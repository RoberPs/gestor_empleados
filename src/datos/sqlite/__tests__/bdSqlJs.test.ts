/**
 * Lo que solo tiene sentido preguntarle a la implementación de la demo web.
 *
 * El contrato que comparte con las otras dos está en
 * `contratoDeLasImplementaciones.test.ts`. Aquí queda lo suyo: que los bytes de la base
 * se puedan sacar y volver a meter sin perder nada, que es todo el mecanismo por el que
 * lo que alguien prueba en la demo sigue ahí al recargar la página.
 *
 * Lo que este test **no** cubre es IndexedDB, que no existe en Node. De guardar y
 * recuperar esos bytes en el navegador responden los escenarios de
 * `docs/verificacion-manual.md`.
 */

import { join } from 'node:path';

import { crearAlmacenCeldasSqlite } from '../almacenCuadranteSqlite';
import { crearAlmacenEmpleadosSqlite } from '../almacenEmpleadosSqlite';
import { abrirConSqlJs, prepararSqlJs, sqlJsEstaPreparado } from '../bdSqlJs';
import { abrirBaseDeDatos } from '../conexion';
import { migrar } from '../migraciones';

const LUNES = '2026-09-07';
const MARTES = '2026-09-08';

beforeAll(() =>
  prepararSqlJs((fichero) =>
    join(__dirname, '..', '..', '..', '..', 'node_modules', 'sql.js', 'dist', fichero),
  ),
);

describe('La base de la demo se puede guardar y recuperar', () => {
  it('una base exportada y vuelta a cargar conserva plantilla y cuadrante', () => {
    const primera = abrirConSqlJs(':memory:');
    abrirBaseDeDatos(() => primera, ':memory:');
    migrar(primera);
    const empleados = crearAlmacenEmpleadosSqlite(primera);
    const celdas = crearAlmacenCeldasSqlite(primera);
    const ana = empleados.altaEmpleado('Ana', '600100200', 'ana@ejemplo.es', 'Sala')!.id;
    celdas.crearTurno(ana, LUNES, { horas: 9, minutos: 0 }, { horas: 17, minutos: 30 });
    celdas.marcarAusencia(ana, MARTES);

    // Esto es exactamente lo que se guarda en el navegador y lo que se recupera al
    // volver: los bytes del fichero SQLite, sin más ceremonia.
    const bytes = primera.exportar();
    primera.cerrar();

    const segunda = abrirBaseDeDatos(
      (nombre) => abrirConSqlJs(nombre, bytes),
      ':memory:',
    );
    const empleadosDespues = crearAlmacenEmpleadosSqlite(segunda);
    const celdasDespues = crearAlmacenCeldasSqlite(segunda);
    const recuperada = empleadosDespues.listarEmpleados();

    expect(recuperada).toHaveLength(1);
    expect(recuperada[0]).toMatchObject({
      nombre: 'Ana',
      telefono: '600100200',
      email: 'ana@ejemplo.es',
      puesto: 'Sala',
    });
    expect(celdasDespues.leerCelda(recuperada[0].id, LUNES)).toMatchObject({
      tipo: 'turnos',
      turnos: [{ inicio: { horas: 9, minutos: 0 }, fin: { horas: 17, minutos: 30 } }],
    });
    expect(celdasDespues.leerCelda(recuperada[0].id, MARTES)).toEqual({ tipo: 'ausencia' });
    segunda.cerrar();
  });

  it('sin bytes que recuperar la base nace vacía, como una instalación nueva', () => {
    const bd = abrirBaseDeDatos(abrirConSqlJs, ':memory:');
    migrar(bd);

    expect(crearAlmacenEmpleadosSqlite(bd).listarEmpleados()).toEqual([]);
    bd.cerrar();
  });

  it('lo escrito después de exportar no está en los bytes ya guardados', () => {
    // Justifica que cada escritura programe un volcado: los bytes son una foto del
    // momento en que se piden, no una vista viva de la base.
    const bd = abrirConSqlJs(':memory:');
    migrar(bd);
    const empleados = crearAlmacenEmpleadosSqlite(bd);
    empleados.altaEmpleado('Ana');

    const bytes = bd.exportar();
    empleados.altaEmpleado('Bruno');

    const recuperada = abrirConSqlJs(':memory:', bytes);
    expect(crearAlmacenEmpleadosSqlite(recuperada).listarEmpleados().map((e) => e.nombre)).toEqual([
      'Ana',
    ]);
    bd.cerrar();
    recuperada.cerrar();
  });

  it('abrir sin haber cargado el motor lo dice en lugar de fallar por dentro', () => {
    // No es un mensaje para nadie que use la demo: es la red de seguridad de la fase
    // previa de arranque. Si alguien la quita, esto lo cuenta.
    expect(sqlJsEstaPreparado()).toBe(true);
  });
});
