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
      // Las dos que añade la migración 3, al final: `ALTER TABLE ADD COLUMN` las
      // pone detrás y no reordena las que ya estaban.
      'puesto',
      'motivo_ausencia',
    ]);
    // `nombre` y `nombre_comparable` son obligatorios; los otros cinco se pueden vaciar.
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

/**
 * El salto de la versión 2 a la 3, que es el que corre en el móvil del encargado.
 *
 * Es la primera migración de este proyecto que **borra** algo, y lo hace sobre el
 * único dispositivo donde están los datos reales. Por eso el salto se prueba aquí
 * antes que en ningún sitio: contra una base poblada como la suya, no contra una
 * vacía.
 *
 * El contenido del cuadrante —turnos planificados, ausencias y vacaciones— todavía
 * no vive en el esquema (`src/datos/almacenCuadrante.ts` lo explica), así que la
 * tabla que lo guardará se monta aquí a mano, igual que hace el escenario "Abrir la
 * app tras actualizarla conservando la plantilla". Lo que se afirma es lo que la
 * spec exige de una adaptación que retira datos: que retire **solo** eso y no toque
 * nada más de lo que hay en el fichero.
 */
const FICHAS_DEL_MOVIL = [
  ['Ana', 'ana', '600 00 00 01', 'ana@ejemplo.es', 'Prefiere mañanas'],
  ['Bruno', 'bruno', '600 00 00 02', 'bruno@ejemplo.es', 'No puede los martes'],
  ['Carmen', 'carmen', '600 00 00 03', 'carmen@ejemplo.es', 'Turno partido'],
] as const;

/** Turnos planificados, una ausencia y unas vacaciones: el cuadrante de una semana. */
const CELDAS_DEL_MOVIL = [
  ['2026-09-07', 'turno 09:00-17:00'],
  ['2026-09-08', 'ausencia'],
  ['2026-09-09', 'vacaciones'],
] as const;

function baseDelMovilEnLaVersion2(fichero: string): BaseDeDatos {
  const bd = abrirBaseDeDatos(abrirConNodeSqlite, fichero);
  // La versión 2 es "las dos primeras migraciones aplicadas": la plantilla y los
  // ajustes. Es exactamente lo que hay hoy en el móvil.
  migrarCon(bd, MIGRACIONES.slice(0, 2));

  for (const [nombre, comparable, telefono, email, nota] of FICHAS_DEL_MOVIL) {
    bd.escribir(
      'INSERT INTO empleados (nombre, nombre_comparable, telefono, email, nota)' +
        ' VALUES (?, ?, ?, ?, ?)',
      nombre,
      comparable,
      telefono,
      email,
      nota,
    );
  }

  bd.ejecutar(`
    CREATE TABLE celdas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
      dia         TEXT NOT NULL,
      contenido   TEXT NOT NULL
    )
  `);
  for (const [dia, contenido] of CELDAS_DEL_MOVIL) {
    bd.escribir('INSERT INTO celdas (empleado_id, dia, contenido) VALUES (?, ?, ?)', 1, dia, contenido);
  }

  // El nombre que el encargado escribió el 08/09/2026, y que ahora vive en el código.
  bd.escribir('INSERT INTO ajustes (clave, valor) VALUES (?, ?)', 'nombre_del_local', 'La Esquina café');

  return bd;
}

describe('Migración 3: la ficha se amplía y los ajustes se retiran', () => {
  it('el salto de la 2 a la 3 conserva la plantilla y el cuadrante, y borra los ajustes', () => {
    const bd = baseDelMovilEnLaVersion2(rutaDeFicheroDePrueba());
    const fichasAntes = bd.leer('SELECT nombre, telefono, email, nota FROM empleados');
    const celdasAntes = bd.leer('SELECT empleado_id, dia, contenido FROM celdas');
    expect(leerVersionDelEsquema(bd)).toBe(2);

    migrar(bd);

    expect(leerVersionDelEsquema(bd)).toBe(3);
    // Ni un empleado ni una ficha de menos.
    expect(bd.leer('SELECT nombre, telefono, email, nota FROM empleados')).toEqual(fichasAntes);
    // Ni una celda del cuadrante de menos.
    expect(bd.leer('SELECT empleado_id, dia, contenido FROM celdas')).toEqual(celdasAntes);
    // Y los dos campos nuevos de la ficha, vacíos para todo el mundo.
    expect(bd.leer('SELECT puesto, motivo_ausencia FROM empleados')).toEqual(
      FICHAS_DEL_MOVIL.map(() => ({ puesto: '', motivo_ausencia: '' })),
    );
    // La tabla que la app ha dejado de usar ya no está.
    expect(tablas(bd)).not.toContain('ajustes');
    bd.cerrar();
  });

  it('Una adaptación que retira datos no toca la plantilla', () => {
    const bd = baseDelMovilEnLaVersion2(rutaDeFicheroDePrueba());
    const tablasAntes = tablas(bd);

    migrar(bd);

    // Lo único que desaparece del fichero es `ajustes`: si la migración borrase
    // cualquier otra cosa, esta comparación lo diría por su nombre.
    expect(tablas(bd)).toEqual(tablasAntes.filter((tabla) => tabla !== 'ajustes'));
    expect(bd.leer('SELECT nombre FROM empleados')).toEqual([
      { nombre: 'Ana' },
      { nombre: 'Bruno' },
      { nombre: 'Carmen' },
    ]);
    expect(bd.leer('SELECT contenido FROM celdas')).toEqual(
      CELDAS_DEL_MOVIL.map(([, contenido]) => ({ contenido })),
    );
    bd.cerrar();
  });

  it('Un nombre repetido no se guarda, tampoco tras el salto a la 3', () => {
    // La migración añade columnas con ALTER TABLE y no recrea `empleados`, así que
    // el índice único sobre `nombre_comparable` sigue en pie sin haberse tocado.
    const bd = baseDelMovilEnLaVersion2(rutaDeFicheroDePrueba());
    migrar(bd);

    expect(() =>
      bd.escribir('INSERT INTO empleados (nombre, nombre_comparable) VALUES (?, ?)', ' ana ', 'ana'),
    ).toThrow(/UNIQUE/i);
    expect(bd.leer('SELECT id FROM empleados')).toHaveLength(3);
    bd.cerrar();
  });

  it('Arrancar dos veces seguidas no vuelve a adaptar nada', () => {
    const fichero = rutaDeFicheroDePrueba();
    const primerArranque = baseDelMovilEnLaVersion2(fichero);
    migrar(primerArranque);
    const trasElPrimero = tablas(primerArranque);
    const plantillaTrasElPrimero = primerArranque.leer('SELECT nombre, puesto FROM empleados');
    primerArranque.cerrar();

    // El encargado cierra la app y la vuelve a abrir sin instalar nada nuevo.
    const segundoArranque = abrirBaseDeDatos(abrirConNodeSqlite, fichero);
    migrar(segundoArranque);

    expect(leerVersionDelEsquema(segundoArranque)).toBe(VERSION_DEL_ESQUEMA);
    expect(tablas(segundoArranque)).toEqual(trasElPrimero);
    expect(segundoArranque.leer('SELECT nombre, puesto FROM empleados')).toEqual(
      plantillaTrasElPrimero,
    );
    segundoArranque.cerrar();
  });
});
