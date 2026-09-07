import type { BaseDeDatos } from '../bd';
import { abrirConNodeSqlite, rutaDeFicheroDePrueba } from '../../../pruebas/bdDePrueba';
import { abrirBaseDeDatos } from '../conexion';
import {
  leerVersionDelEsquema,
  migrar,
  MIGRACIONES,
  VERSION_DEL_ESQUEMA,
  type Migracion,
} from '../migraciones';

function baseVacia(): BaseDeDatos {
  return abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');
}

function tablas(bd: BaseDeDatos): string[] {
  return bd
    .leer<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")
    .map((fila) => fila.name);
}

/** El mismo bucle de `migrar`, pero con una lista de migraciones de mentira. */
function migrarCon(bd: BaseDeDatos, migraciones: readonly Migracion[]): void {
  for (let numero = leerVersionDelEsquema(bd) + 1; numero <= migraciones.length; numero++) {
    bd.ejecutar('BEGIN');
    try {
      migraciones[numero - 1].aplicar(bd);
      bd.ejecutar(`PRAGMA user_version = ${numero}`);
      bd.ejecutar('COMMIT');
    } catch (fallo) {
      bd.ejecutar('ROLLBACK');
      throw fallo;
    }
  }
}

describe('Versionado del esquema', () => {
  it('una base vacía acaba en la última versión conocida', () => {
    const bd = baseVacia();

    expect(leerVersionDelEsquema(bd)).toBe(0);

    migrar(bd);

    expect(leerVersionDelEsquema(bd)).toBe(MIGRACIONES.length);
    bd.cerrar();
  });

  it('migrar dos veces seguidas no vuelve a aplicar nada', () => {
    const bd = baseVacia();

    migrar(bd);
    const despuesDeLaPrimera = tablas(bd);
    // Si se reaplicara, el CREATE TABLE fallaría por tabla ya existente.
    migrar(bd);

    expect(leerVersionDelEsquema(bd)).toBe(VERSION_DEL_ESQUEMA);
    expect(tablas(bd)).toEqual(despuesDeLaPrimera);
    bd.cerrar();
  });

  it('una migración que falla se deshace entera y no sube la versión', () => {
    const bd = baseVacia();
    const aMedias: Migracion = {
      descripcion: 'Crea una tabla y luego falla',
      aplicar(base) {
        base.ejecutar('CREATE TABLE a_medias (x TEXT)');
        throw new Error('fallo a propósito');
      },
    };

    expect(() => migrarCon(bd, [aMedias])).toThrow('fallo a propósito');

    expect(leerVersionDelEsquema(bd)).toBe(0);
    expect(tablas(bd)).not.toContain('a_medias');
    bd.cerrar();
  });

  it('una migración posterior que falla deja intacta la anterior, ya aplicada', () => {
    const bd = baseVacia();
    const primera: Migracion = {
      descripcion: 'Crea una tabla que se queda',
      aplicar: (base) => base.ejecutar('CREATE TABLE se_queda (x TEXT)'),
    };
    const segunda: Migracion = {
      descripcion: 'Falla',
      aplicar: () => {
        throw new Error('fallo a propósito');
      },
    };

    expect(() => migrarCon(bd, [primera, segunda])).toThrow('fallo a propósito');

    expect(leerVersionDelEsquema(bd)).toBe(1);
    expect(tablas(bd)).toContain('se_queda');
    bd.cerrar();
  });
});

describe('Migración 1: la tabla de empleados', () => {
  it('crea la tabla vacía', () => {
    const bd = baseVacia();

    migrar(bd);

    expect(tablas(bd)).toContain('empleados');
    expect(bd.leer('SELECT * FROM empleados')).toEqual([]);
    bd.cerrar();
  });

  it('la tabla tiene las columnas de la ficha y el id autoincremental', () => {
    const bd = baseVacia();
    migrar(bd);

    const columnas = bd.leer<{ name: string; type: string; notnull: number }>(
      'PRAGMA table_info(empleados)',
    );

    expect(columnas.map((columna) => columna.name)).toEqual([
      'id',
      'nombre',
      'nombre_comparable',
      'telefono',
      'email',
      'nota',
    ]);
    // `nombre` y `nombre_comparable` son obligatorios; los otros tres se pueden vaciar.
    expect(columnas.filter((columna) => columna.notnull === 1).map((c) => c.name)).toEqual([
      'nombre',
      'nombre_comparable',
    ]);
    // AUTOINCREMENT: SQLite lleva la cuenta en su propia tabla para no reutilizar ids.
    expect(tablas(bd)).toContain('sqlite_sequence');
    bd.cerrar();
  });

  it('el índice único impide dos empleados con la misma forma comparable del nombre', () => {
    const bd = baseVacia();
    migrar(bd);

    bd.escribir('INSERT INTO empleados (nombre, nombre_comparable) VALUES (?, ?)', 'Ana', 'ana');

    expect(() =>
      bd.escribir('INSERT INTO empleados (nombre, nombre_comparable) VALUES (?, ?)', ' ana ', 'ana'),
    ).toThrow(/UNIQUE/i);
    expect(bd.leer('SELECT id FROM empleados')).toHaveLength(1);
    bd.cerrar();
  });
});

describe('Actualización automática del almacenamiento al arrancar', () => {
  it('Abrir la app tras actualizarla conservando la plantilla', () => {
    // Lo que hay en el dispositivo: el almacenamiento que dejó la versión instalada
    // de la app, con la plantilla del encargado y sus fichas rellenas.
    const fichero = rutaDeFicheroDePrueba();
    const laDeAhora = abrirBaseDeDatos(abrirConNodeSqlite, fichero);
    migrar(laDeAhora);
    for (const [nombre, comparable, telefono, email, nota] of [
      ['Ana', 'ana', '600 00 00 01', 'ana@ejemplo.es', 'Prefiere mañanas'],
      ['Bruno', 'bruno', '600 00 00 02', 'bruno@ejemplo.es', 'No puede los martes'],
      ['Carmen', 'carmen', '600 00 00 03', 'carmen@ejemplo.es', 'Turno partido'],
    ]) {
      laDeAhora.escribir(
        'INSERT INTO empleados (nombre, nombre_comparable, telefono, email, nota)' +
          ' VALUES (?, ?, ?, ?, ?)',
        nombre,
        comparable,
        telefono,
        email,
        nota,
      );
    }
    const fichasAntes = laDeAhora.leer('SELECT nombre, telefono, email, nota FROM empleados');
    laDeAhora.cerrar();

    // El encargado instala una versión posterior de la app, que necesita un
    // almacenamiento distinto: trae una migración más al final de la lista.
    const laNueva = abrirBaseDeDatos(abrirConNodeSqlite, fichero);
    const conTurnos: Migracion = {
      descripcion: 'Una tabla que cuelga del empleado, como las que vendrán',
      aplicar: (base) =>
        base.ejecutar(`
          CREATE TABLE turnos (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
            dia         TEXT NOT NULL
          )
        `),
    };
    migrarCon(laNueva, [...MIGRACIONES, conTurnos]);

    // La adaptación no ha pedido nada y no se ha llevado por delante ningún dato.
    expect(leerVersionDelEsquema(laNueva)).toBe(MIGRACIONES.length + 1);
    expect(laNueva.leer('SELECT nombre, telefono, email, nota FROM empleados')).toEqual(fichasAntes);
    laNueva.cerrar();
  });
});

describe('Almacenamiento de una versión posterior de la app', () => {
  it('no se migra, no se toca su contenido y la operación falla', () => {
    const bd = baseVacia();
    migrar(bd);
    bd.escribir('INSERT INTO empleados (nombre, nombre_comparable) VALUES (?, ?)', 'Ana', 'ana');
    const delFuturo = VERSION_DEL_ESQUEMA + 7;
    bd.ejecutar(`PRAGMA user_version = ${delFuturo}`);

    expect(() => migrar(bd)).toThrow(/versión posterior/i);

    expect(leerVersionDelEsquema(bd)).toBe(delFuturo);
    expect(bd.leer('SELECT nombre FROM empleados')).toEqual([{ nombre: 'Ana' }]);
    bd.cerrar();
  });
});
