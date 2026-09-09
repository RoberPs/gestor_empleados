/**
 * La batería que toda implementación de `BaseDeDatos` tiene que pasar.
 *
 * Existe porque la demo web trajo una tercera implementación —`sql.js`— y una demo que
 * se comporte distinto que la app no demuestra nada. Escrita una sola vez y ejecutada
 * contra cada implementación, cualquier diferencia entre ellas sale en `npm test` y no
 * delante de un cliente (design.md — riesgos).
 *
 * No comprueba `sql.js` ni `node:sqlite`: comprueba **el SQL de la app** corriendo encima
 * de cada uno. Por eso ejercita las migraciones reales, los dos almacenes reales y las
 * garantías del esquema de las que depende una spec —la cascada de la baja, la unicidad
 * del nombre, la versión del esquema—, en vez de sentencias inventadas para el test.
 *
 * Quien añada una cuarta implementación no tiene que escribir tests: la llama desde aquí.
 */

import { crearAlmacenCeldasSqlite } from '../datos/sqlite/almacenCuadranteSqlite';
import { crearAlmacenEmpleadosSqlite } from '../datos/sqlite/almacenEmpleadosSqlite';
import type { AbrirFichero, BaseDeDatos } from '../datos/sqlite/bd';
import { abrirBaseDeDatos } from '../datos/sqlite/conexion';
import { leerVersionDelEsquema, migrar, VERSION_DEL_ESQUEMA } from '../datos/sqlite/migraciones';

const LUNES = '2026-09-07';
const MARTES = '2026-09-08';
const h = (horas: number, minutos = 0) => ({ horas, minutos });

/**
 * Declara la batería completa para una implementación.
 *
 * `abrirFichero` es la implementación que se pone a prueba; `preparar` es lo que haya que
 * hacer antes de poder abrir nada —cargar el WebAssembly, en el caso de `sql.js`—.
 */
export function verificarContratoDeBaseDeDatos(
  nombre: string,
  abrirFichero: AbrirFichero,
  preparar?: () => Promise<void>,
): void {
  describe(`Contrato de BaseDeDatos: ${nombre}`, () => {
    beforeAll(async () => {
      if (preparar) await preparar();
    });

    /** Una base recién abierta y migrada, como la que se encuentra la app al arrancar. */
    function baseMigrada(): BaseDeDatos {
      const bd = abrirBaseDeDatos(abrirFichero, ':memory:');
      migrar(bd);
      return bd;
    }

    describe('los cuatro métodos', () => {
      /**
       * Una tabla del propio test, no una de la app.
       *
       * Aquí se comprueba la **interfaz**: qué devuelve escribir, cómo llegan las filas
       * al leer, qué pasa con un parámetro nulo. Usar las tablas reales mezclaría eso
       * con las restricciones del esquema, y un fallo no diría cuál de las dos cosas se
       * ha roto. Del esquema real responden los dos bloques siguientes.
       */
      function baseConTablaDePrueba(): BaseDeDatos {
        const bd = baseMigrada();
        bd.ejecutar(
          'CREATE TABLE prueba (id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT, numero INTEGER)',
        );
        return bd;
      }

      it('escribir devuelve el identificador de la fila insertada', () => {
        const bd = baseConTablaDePrueba();
        const primero = bd.escribir('INSERT INTO prueba (texto) VALUES (?)', 'uno');
        const segundo = bd.escribir('INSERT INTO prueba (texto) VALUES (?)', 'dos');

        expect(primero.ultimoId).toBeGreaterThan(0);
        expect(segundo.ultimoId).toBe(primero.ultimoId + 1);
        bd.cerrar();
      });

      it('escribir devuelve cuántas filas cambió', () => {
        const bd = baseConTablaDePrueba();
        bd.escribir('INSERT INTO prueba (texto) VALUES (?)', 'uno');
        bd.escribir('INSERT INTO prueba (texto) VALUES (?)', 'dos');

        expect(bd.escribir("UPDATE prueba SET texto = 'ya'").filasAfectadas).toBe(2);
        expect(bd.escribir('UPDATE prueba SET texto = ? WHERE texto = ?', 'ya', 'nada')
          .filasAfectadas).toBe(0);
        bd.cerrar();
      });

      it('leer devuelve cada fila como objeto columna → valor', () => {
        const bd = baseConTablaDePrueba();
        bd.escribir('INSERT INTO prueba (texto, numero) VALUES (?, ?)', 'Ana', 3);

        expect(bd.leer<{ texto: string; numero: number }>('SELECT texto, numero FROM prueba'))
          .toEqual([{ texto: 'Ana', numero: 3 }]);
        bd.cerrar();
      });

      it('leer con parámetros no interpreta el valor como SQL', () => {
        const bd = baseConTablaDePrueba();
        bd.escribir('INSERT INTO prueba (texto) VALUES (?)', "Ana'; DROP TABLE prueba; --");

        expect(bd.leer<{ n: number }>('SELECT COUNT(*) AS n FROM prueba')[0].n).toBe(1);
        bd.cerrar();
      });

      it('leer devuelve lista vacía cuando no hay filas', () => {
        const bd = baseConTablaDePrueba();
        expect(bd.leer('SELECT * FROM prueba')).toEqual([]);
        bd.cerrar();
      });

      it('un campo vacío se lee como null y no como cadena', () => {
        const bd = baseConTablaDePrueba();
        bd.escribir('INSERT INTO prueba (texto, numero) VALUES (?, ?)', 'Ana', null);

        expect(bd.leer<{ numero: number | null }>('SELECT numero FROM prueba')[0].numero).toBeNull();
        bd.cerrar();
      });

      it('ejecutar admite varias sentencias seguidas, como las migraciones', () => {
        const bd = baseConTablaDePrueba();
        bd.ejecutar("INSERT INTO prueba (texto) VALUES ('uno'); INSERT INTO prueba (texto) VALUES ('dos');");

        expect(bd.leer<{ n: number }>('SELECT COUNT(*) AS n FROM prueba')[0].n).toBe(2);
        bd.cerrar();
      });
    });

    describe('lo que el esquema tiene que garantizar', () => {
      it('una base nueva queda en la última versión del esquema', () => {
        const bd = baseMigrada();
        expect(leerVersionDelEsquema(bd)).toBe(VERSION_DEL_ESQUEMA);
        bd.cerrar();
      });

      it('migrar dos veces no vuelve a aplicar nada', () => {
        const bd = baseMigrada();
        migrar(bd);
        expect(leerVersionDelEsquema(bd)).toBe(VERSION_DEL_ESQUEMA);
        bd.cerrar();
      });

      it('el índice único del nombre rechaza un empleado repetido', () => {
        const bd = baseMigrada();
        const empleados = crearAlmacenEmpleadosSqlite(bd);
        empleados.altaEmpleado('Ana');

        expect(empleados.altaEmpleado('Ana')).toBeNull();
        expect(empleados.listarEmpleados()).toHaveLength(1);
        bd.cerrar();
      });

      it('la baja de un empleado se lleva por cascada todo lo suyo del cuadrante', () => {
        // Es la garantía que `almacenamiento-cuadrante` pone en el esquema y no en que
        // ninguna pantalla recorra semanas. Sin `PRAGMA foreign_keys = ON` en cada
        // apertura, el `ON DELETE CASCADE` no haría nada y esto dejaría filas huérfanas.
        const bd = baseMigrada();
        const empleados = crearAlmacenEmpleadosSqlite(bd);
        const celdas = crearAlmacenCeldasSqlite(bd);
        const ana = empleados.altaEmpleado('Ana')!.id;
        celdas.crearTurno(ana, LUNES, h(9), h(17));
        celdas.marcarAusencia(ana, MARTES);

        empleados.borrarEmpleado(ana);

        expect(bd.leer<{ n: number }>('SELECT COUNT(*) AS n FROM celdas')[0].n).toBe(0);
        expect(bd.leer<{ n: number }>('SELECT COUNT(*) AS n FROM turnos')[0].n).toBe(0);
        bd.cerrar();
      });
    });

    describe('los almacenes de la app, encima de esta implementación', () => {
      it('una ficha escrita se lee igual', () => {
        const bd = baseMigrada();
        const empleados = crearAlmacenEmpleadosSqlite(bd);
        const ana = empleados.altaEmpleado('Ana', '600100200', 'ana@ejemplo.es', 'Sala')!.id;

        expect(empleados.leerEmpleado(ana)).toMatchObject({
          nombre: 'Ana',
          telefono: '600100200',
          email: 'ana@ejemplo.es',
          puesto: 'Sala',
        });
        bd.cerrar();
      });

      it('la plantilla sale en orden alfabético español', () => {
        const bd = baseMigrada();
        const empleados = crearAlmacenEmpleadosSqlite(bd);
        for (const nombre of ['Óscar', 'Ana', 'Zoe', 'Ñoño', 'Bruno']) {
          empleados.altaEmpleado(nombre);
        }

        expect(empleados.listarEmpleados().map((empleado) => empleado.nombre)).toEqual([
          'Ana',
          'Bruno',
          'Ñoño',
          'Óscar',
          'Zoe',
        ]);
        bd.cerrar();
      });

      it('los cuatro estados de una celda van y vuelven intactos', () => {
        const bd = baseMigrada();
        const empleados = crearAlmacenEmpleadosSqlite(bd);
        const celdas = crearAlmacenCeldasSqlite(bd);
        const ana = empleados.altaEmpleado('Ana')!.id;

        expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'vacia' });

        celdas.crearTurno(ana, LUNES, h(9), h(17, 30));
        const conTurno = celdas.leerCelda(ana, LUNES);
        expect(conTurno.tipo).toBe('turnos');
        expect(conTurno).toMatchObject({
          turnos: [{ inicio: { horas: 9, minutos: 0 }, fin: { horas: 17, minutos: 30 } }],
        });

        celdas.marcarAusencia(ana, LUNES);
        expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'ausencia' });

        celdas.marcarVacaciones(ana, LUNES);
        expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'vacaciones' });

        celdas.vaciarCelda(ana, LUNES);
        expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'vacia' });
        bd.cerrar();
      });

      it('cambiar de estado una celda con turnos borra sus turnos', () => {
        const bd = baseMigrada();
        const empleados = crearAlmacenEmpleadosSqlite(bd);
        const celdas = crearAlmacenCeldasSqlite(bd);
        const ana = empleados.altaEmpleado('Ana')!.id;
        celdas.crearTurno(ana, LUNES, h(9), h(17));

        celdas.marcarVacaciones(ana, LUNES);

        expect(bd.leer<{ n: number }>('SELECT COUNT(*) AS n FROM turnos')[0].n).toBe(0);
        bd.cerrar();
      });
    });
  });
}
