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

describe('Migración 4: las tablas del cuadrante', () => {
  /** Un empleado en la base, para poder colgar celdas de él. */
  function conUnEmpleado(bd: BaseDeDatos): number {
    return bd.escribir(
      'INSERT INTO empleados (nombre, nombre_comparable) VALUES (?, ?)',
      'Ana',
      'ana',
    ).ultimoId;
  }

  it('una base nueva queda en la última versión con las dos tablas del cuadrante', () => {
    const bd = baseVacia();

    migrar(bd);

    expect(leerVersionDelEsquema(bd)).toBe(4);
    expect(tablas(bd)).toContain('celdas');
    expect(tablas(bd)).toContain('turnos');
    expect(bd.leer('SELECT * FROM celdas')).toEqual([]);
    expect(bd.leer('SELECT * FROM turnos')).toEqual([]);
    bd.cerrar();
  });

  it('las dos tablas tienen sus columnas', () => {
    const bd = baseVacia();
    migrar(bd);

    const columnasDe = (tabla: string) =>
      bd.leer<{ name: string; notnull: number }>(`PRAGMA table_info(${tabla})`);

    expect(columnasDe('celdas').map((columna) => columna.name)).toEqual([
      'empleado_id',
      'dia',
      'tipo',
    ]);
    // Las tres son obligatorias: una celda sin empleado, sin día o sin estado no es
    // una celda.
    expect(columnasDe('celdas').every((columna) => columna.notnull === 1)).toBe(true);

    expect(columnasDe('turnos').map((columna) => columna.name)).toEqual([
      'id',
      'empleado_id',
      'dia',
      'inicio',
      'fin',
    ]);
    bd.cerrar();
  });

  it('los dos índices de la lectura por semana están creados', () => {
    const bd = baseVacia();
    migrar(bd);

    const indicesDe = (tabla: string) =>
      bd.leer<{ name: string }>(`PRAGMA index_list(${tabla})`).map((indice) => indice.name);

    expect(indicesDe('celdas')).toContain('celdas_dia');
    expect(indicesDe('turnos')).toContain('turnos_empleado_dia');
    bd.cerrar();
  });

  it('una celda no puede estar en dos estados a la vez', () => {
    const bd = baseVacia();
    migrar(bd);
    const ana = conUnEmpleado(bd);
    bd.escribir(
      'INSERT INTO celdas (empleado_id, dia, tipo) VALUES (?, ?, ?)',
      ana,
      '2026-09-07',
      'turnos',
    );

    // La clave primaria es lo que lo impide: dos estados serían dos filas.
    expect(() =>
      bd.escribir(
        'INSERT INTO celdas (empleado_id, dia, tipo) VALUES (?, ?, ?)',
        ana,
        '2026-09-07',
        'vacaciones',
      ),
    ).toThrow(/UNIQUE|PRIMARY/i);
    expect(bd.leer('SELECT tipo FROM celdas')).toEqual([{ tipo: 'turnos' }]);
    bd.cerrar();
  });

  it('una celda solo admite los tres estados que existen', () => {
    const bd = baseVacia();
    migrar(bd);
    const ana = conUnEmpleado(bd);

    for (const [dia, tipo] of [
      ['2026-09-07', 'turnos'],
      ['2026-09-08', 'ausencia'],
      ['2026-09-09', 'vacaciones'],
    ]) {
      bd.escribir('INSERT INTO celdas (empleado_id, dia, tipo) VALUES (?, ?, ?)', ana, dia, tipo);
    }

    // `vacia` no es un estado guardado: una celda vacía es la ausencia de fila.
    expect(() =>
      bd.escribir(
        'INSERT INTO celdas (empleado_id, dia, tipo) VALUES (?, ?, ?)',
        ana,
        '2026-09-10',
        'vacia',
      ),
    ).toThrow(/CHECK/i);
    expect(bd.leer('SELECT COUNT(*) AS cuantas FROM celdas')).toEqual([{ cuantas: 3 }]);
    bd.cerrar();
  });

  it('la baja de un empleado se lleva sus celdas y sus turnos', () => {
    const bd = baseVacia();
    migrar(bd);
    const ana = conUnEmpleado(bd);
    bd.escribir(
      'INSERT INTO celdas (empleado_id, dia, tipo) VALUES (?, ?, ?)',
      ana,
      '2026-09-07',
      'turnos',
    );
    bd.escribir(
      'INSERT INTO turnos (empleado_id, dia, inicio, fin) VALUES (?, ?, ?, ?)',
      ana,
      '2026-09-07',
      '09:00',
      '17:00',
    );

    bd.escribir('DELETE FROM empleados WHERE id = ?', ana);

    // Una sola sentencia, sin recorrer ninguna otra tabla: lo hace la cascada, que
    // `abrirBaseDeDatos` deja activa con `PRAGMA foreign_keys = ON`.
    expect(bd.leer('SELECT * FROM celdas')).toEqual([]);
    expect(bd.leer('SELECT * FROM turnos')).toEqual([]);
    bd.cerrar();
  });

  it('vaciar una celda se lleva sus turnos', () => {
    const bd = baseVacia();
    migrar(bd);
    const ana = conUnEmpleado(bd);
    bd.escribir(
      'INSERT INTO celdas (empleado_id, dia, tipo) VALUES (?, ?, ?)',
      ana,
      '2026-09-07',
      'turnos',
    );
    bd.escribir(
      'INSERT INTO turnos (empleado_id, dia, inicio, fin) VALUES (?, ?, ?, ?)',
      ana,
      '2026-09-07',
      '09:00',
      '17:00',
    );

    bd.escribir('DELETE FROM celdas WHERE empleado_id = ? AND dia = ?', ana, '2026-09-07');

    // La clave ajena compuesta contra `celdas`: borrar la celda es borrar sus turnos.
    expect(bd.leer('SELECT * FROM turnos')).toEqual([]);
    bd.cerrar();
  });

  it('Una instalación con plantilla conserva sus fichas', () => {
    // El almacenamiento que dejó la versión instalada de la app: la plantilla del
    // encargado con sus fichas rellenas, en la versión 3 del esquema.
    const bd = abrirBaseDeDatos(abrirConNodeSqlite, rutaDeFicheroDePrueba());
    migrarCon(bd, MIGRACIONES.slice(0, 3));
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
    const fichasAntes = bd.leer('SELECT * FROM empleados');

    // El encargado instala la versión que guarda el cuadrante.
    migrar(bd);

    expect(leerVersionDelEsquema(bd)).toBe(VERSION_DEL_ESQUEMA);
    // Ni un empleado ni un campo de menos: la migración 4 solo crea tablas.
    expect(bd.leer('SELECT * FROM empleados')).toEqual(fichasAntes);
    expect(bd.leer<{ nombre: string }>('SELECT nombre FROM empleados').map((f) => f.nombre)).toEqual(
      ['Ana', 'Bruno', 'Carmen'],
    );
    // Y el cuadrante empieza vacío, porque lo planificado antes nunca se guardó.
    expect(bd.leer('SELECT * FROM celdas')).toEqual([]);
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
    // `horas` y no `turnos`: la de turnos ya existe de verdad desde la migración 4,
    // y lo que este escenario necesita es una tabla que **todavía** no está en la
    // lista, como lo será la de las horas trabajadas.
    const conHoras: Migracion = {
      descripcion: 'Una tabla que cuelga del empleado, como las que vendrán',
      aplicar: (base) =>
        base.ejecutar(`
          CREATE TABLE horas (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
            dia         TEXT NOT NULL
          )
        `),
    };
    migrarCon(laNueva, [...MIGRACIONES, conHoras]);

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
 * Junto a la plantilla y a los ajustes hay una tercera tabla, `otros_datos`, montada
 * aquí a mano: representa lo que hubiera en el fichero al margen de lo que la
 * migración 3 toca. No se llama `celdas` —que es como se llamaba cuando el cuadrante
 * todavía no vivía en el esquema— porque `celdas` es ya una tabla de verdad, la que
 * crea la migración 4, y esta base se queda en la versión 2. Lo que se afirma es lo
 * que la spec exige de una adaptación que retira datos: que retire **solo** eso y no
 * toque nada más de lo que hay en el fichero.
 */
const FICHAS_DEL_MOVIL = [
  ['Ana', 'ana', '600 00 00 01', 'ana@ejemplo.es', 'Prefiere mañanas'],
  ['Bruno', 'bruno', '600 00 00 02', 'bruno@ejemplo.es', 'No puede los martes'],
  ['Carmen', 'carmen', '600 00 00 03', 'carmen@ejemplo.es', 'Turno partido'],
] as const;

/** Filas cualesquiera que cuelgan de un empleado y que la migración 3 no debe tocar. */
const OTROS_DATOS_DEL_MOVIL = [
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
    CREATE TABLE otros_datos (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
      dia         TEXT NOT NULL,
      contenido   TEXT NOT NULL
    )
  `);
  for (const [dia, contenido] of OTROS_DATOS_DEL_MOVIL) {
    bd.escribir(
      'INSERT INTO otros_datos (empleado_id, dia, contenido) VALUES (?, ?, ?)',
      1,
      dia,
      contenido,
    );
  }

  // El nombre que el encargado escribió el 08/09/2026, y que ahora vive en el código.
  bd.escribir('INSERT INTO ajustes (clave, valor) VALUES (?, ?)', 'nombre_del_local', 'La Esquina café');

  return bd;
}

describe('Migración 3: la ficha se amplía y los ajustes se retiran', () => {
  it('el salto de la 2 a la 3 conserva la plantilla y lo demás, y borra los ajustes', () => {
    const bd = baseDelMovilEnLaVersion2(rutaDeFicheroDePrueba());
    const fichasAntes = bd.leer('SELECT nombre, telefono, email, nota FROM empleados');
    const otrosAntes = bd.leer('SELECT empleado_id, dia, contenido FROM otros_datos');
    expect(leerVersionDelEsquema(bd)).toBe(2);

    // Solo hasta la 3: lo que se mira aquí es ese salto, no el que venga después.
    migrarCon(bd, MIGRACIONES.slice(0, 3));

    expect(leerVersionDelEsquema(bd)).toBe(3);
    // Ni un empleado ni una ficha de menos.
    expect(bd.leer('SELECT nombre, telefono, email, nota FROM empleados')).toEqual(fichasAntes);
    // Ni una fila de menos en lo que no le incumbe.
    expect(bd.leer('SELECT empleado_id, dia, contenido FROM otros_datos')).toEqual(otrosAntes);
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

    migrarCon(bd, MIGRACIONES.slice(0, 3));

    // Lo único que desaparece del fichero es `ajustes`: si la migración borrase
    // cualquier otra cosa, esta comparación lo diría por su nombre.
    expect(tablas(bd)).toEqual(tablasAntes.filter((tabla) => tabla !== 'ajustes'));
    expect(bd.leer('SELECT nombre FROM empleados')).toEqual([
      { nombre: 'Ana' },
      { nombre: 'Bruno' },
      { nombre: 'Carmen' },
    ]);
    expect(bd.leer('SELECT contenido FROM otros_datos')).toEqual(
      OTROS_DATOS_DEL_MOVIL.map(([, contenido]) => ({ contenido })),
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
