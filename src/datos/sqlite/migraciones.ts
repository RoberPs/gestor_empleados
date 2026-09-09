/**
 * Versionado del esquema de la base de datos.
 *
 * `PRAGMA user_version` es un entero que SQLite guarda en la cabecera del fichero.
 * Al arrancar la app se lee y se aplican en orden las migraciones cuyo número sea
 * mayor, cada una dentro de su propia transacción, subiendo `user_version` al final
 * de cada una. El número de versión de una migración es su posición en la lista, de
 * modo que la versión N es "las N primeras migraciones aplicadas" (design.md — D7).
 *
 * ── DOS REGLAS QUE NO SE SALTAN ─────────────────────────────────────────────
 *
 * 1. **Una migración ya publicada no se edita nunca.** En cuanto una versión de la
 *    app llega a un dispositivo, la base de datos de ese dispositivo ya tiene su
 *    `user_version` subido y esa migración no se volverá a ejecutar jamás. Editarla
 *    solo cambiaría lo que ven las instalaciones nuevas: dos dispositivos con el
 *    mismo `user_version` acabarían con esquemas distintos, y el fallo aparecería
 *    meses después en el móvil del encargado, no aquí. Todo cambio posterior de
 *    esquema es una **migración nueva al final de la lista**.
 *
 * 2. **Toda tabla futura que se refiera a un empleado lo hace con
 *    `empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE`.**
 *    La spec exige que dar de baja a un empleado no deje nada suyo detrás en ninguna
 *    semana, y que esa garantía venga de cómo están guardados los datos y no de que
 *    quien escribe el código se acuerde de borrar tabla por tabla. Guardar el nombre
 *    del empleado como referencia, o un identificador suelto sin clave ajena, deja
 *    esa garantía en manos de la disciplina de cada consulta. No se admite. Las
 *    claves ajenas se activan en cada apertura desde `conexion.ts`: sin eso, la
 *    cascada estaría escrita y no haría nada.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { BaseDeDatos } from './bd';

export interface Migracion {
  /** Qué hace, para leer la lista de un vistazo. No se usa en tiempo de ejecución. */
  readonly descripcion: string;
  aplicar(bd: BaseDeDatos): void;
}

/**
 * Versión 1: la plantilla.
 *
 * `id INTEGER PRIMARY KEY AUTOINCREMENT` y no el rowid a secas: sin `AUTOINCREMENT`,
 * SQLite reutiliza el identificador del último empleado borrado, y una pantalla que
 * se hubiera quedado con el id de alguien dado de baja pasaría a leer, sin error
 * alguno, la ficha de otra persona (design.md — D3).
 *
 * `nombre_comparable` guarda la forma con la que se compara la unicidad del nombre,
 * calculada por `formaComparable` en `src/dominio/empleado.ts`. La comparación no la
 * puede hacer SQLite: su `LOWER()` solo baja a minúsculas el ASCII, así que `ÁNGEL`
 * y `Ángel` le parecerían nombres distintos y la spec dice que no lo son
 * (design.md — D4).
 *
 * `telefono`, `email` y `nota` admiten `NULL`: son opcionales y se pueden vaciar.
 */
const CREAR_PLANTILLA: Migracion = {
  descripcion: 'Crea la tabla de empleados y el índice que hace único su nombre',
  aplicar(bd) {
    bd.ejecutar(`
      CREATE TABLE empleados (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre            TEXT NOT NULL,
        nombre_comparable TEXT NOT NULL,
        telefono          TEXT,
        email             TEXT,
        nota              TEXT
      )
    `);
    bd.ejecutar('CREATE UNIQUE INDEX empleados_nombre_comparable ON empleados (nombre_comparable)');
  },
};

/**
 * Versión 2: los ajustes del local.
 *
 * Una tabla de clave y valor, no una columna por ajuste: cada ajuste nuevo sería si
 * no un `ALTER TABLE` en una migración más, y este fichero ya explica lo caro que
 * sale equivocarse ahí. Que no haya fila para una clave significa que nunca se ha
 * escrito, que es justo lo que la spec pide para la primera apertura: el nombre del
 * local vacío, sin ningún nombre de ejemplo.
 *
 * No lleva clave ajena a `empleados` porque no se refiere a ningún empleado: son
 * datos del propio negocio, y sobreviven a la baja de toda la plantilla.
 */
const CREAR_AJUSTES: Migracion = {
  descripcion: 'Crea la tabla de ajustes del local',
  aplicar(bd) {
    bd.ejecutar(`
      CREATE TABLE ajustes (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      )
    `);
  },
};

/**
 * Versión 3: la ficha gana el puesto y el motivo de la ausencia, y los ajustes se van.
 *
 * Las tres cosas en una sola migración y no en tres: el mecanismo aplica una
 * transacción por número de versión, así que tres versiones son tres oportunidades
 * de quedarse a medias en un móvil que se apaga a mitad del arranque. Con una sola,
 * el salto es todo o nada (design.md — "La migración 3 hace las tres cosas de golpe").
 *
 * `ALTER TABLE ADD COLUMN` y no una tabla nueva a la que copiar: SQLite añade la
 * columna sin reescribir la tabla, de modo que la plantilla ni se copia ni se toca y
 * el índice único sobre `nombre_comparable` sigue en pie sin recrearse. Copiar a una
 * tabla nueva —lo que SQLite obliga a hacer para *quitar* una columna— es justo el
 * patrón que puede perder filas, y aquí no hace falta.
 *
 * `DEFAULT ''` y no `NULL`: los dos campos son opcionales y se pueden vaciar, y así
 * las fichas que ya existían quedan con los dos campos vacíos, que es lo que la
 * pantalla muestra para quien no los tiene escritos.
 *
 * **Esta es la primera migración del proyecto que borra algo.** `ajustes` guardaba el
 * nombre del local, que pasa a estar fijado en el código junto al logo: no se pierde
 * ningún dato que el encargado siga viendo en pantalla. Dejar la tabla muerta se
 * descartó — una tabla con el nombre del local dentro, mientras el nombre vive en el
 * código, es una trampa para quien lea esto dentro de seis meses.
 */
const AMPLIAR_FICHA_Y_RETIRAR_AJUSTES: Migracion = {
  descripcion: 'Añade el puesto y el motivo de la ausencia a la ficha, y retira los ajustes',
  aplicar(bd) {
    bd.ejecutar("ALTER TABLE empleados ADD COLUMN puesto TEXT DEFAULT ''");
    bd.ejecutar("ALTER TABLE empleados ADD COLUMN motivo_ausencia TEXT DEFAULT ''");
    bd.ejecutar('DROP TABLE ajustes');
  },
};

/**
 * Versión 4: el cuadrante.
 *
 * Dos tablas y no tres —una por estado de la celda—: `PRIMARY KEY (empleado_id, dia)`
 * es lo que impide que una celda esté en dos estados a la vez, porque no puede tener
 * dos filas. La exclusividad que el tipo `ContenidoCelda` garantiza en el código
 * queda garantizada también en el fichero, que es donde la spec la quiere. Con una
 * tabla por estado, nada impediría que el mismo empleado y día tuvieran fila en dos
 * de ellas (design.md — D1).
 *
 * **No hay estado `vacia`: una celda vacía es la ausencia de fila**, igual que en la
 * tabla `ajustes` de la migración 2 no haber fila para una clave significaba que
 * nunca se había escrito. Vaciar una celda es borrar su fila, y la cascada se lleva
 * sus turnos.
 *
 * `turnos` lleva **dos** claves ajenas a propósito. La compuesta contra `celdas` es
 * la que borra los turnos al vaciar la celda o al cambiarla de estado. La directa
 * contra `empleados` es la que exige la regla 2 de este fichero: una tabla que se
 * refiere a un empleado lo dice ella misma y no a través de un tercero, de modo que
 * la cascada de la baja no depende de que `celdas` siga existiendo.
 *
 * El máximo de dos turnos el mismo día **no** está en el esquema: lo guardan el tipo
 * `TurnosDelDia` y el único camino de escritura, que es el adaptador. Ponerlo aquí
 * costaría un disparador —la única herramienta de SQLite para contar filas
 * hermanas—, y este proyecto no tiene ninguno (design.md — D2).
 *
 * Las horas se guardan como texto `hh:mm` con cero delante, que es la misma forma en
 * la que se muestran: hace legible el fichero desde cualquier herramienta de SQLite
 * y ahorra aritmética en los dos sentidos (design.md — D3). `dia` es la `FechaISO`
 * `aaaa-mm-dd` tal cual, así que leer una semana es un `BETWEEN` de texto correcto
 * sin conversiones (design.md — D4).
 *
 * Los dos índices son para esa lectura por semana, que es la que se hace en cada
 * repintado de la pantalla: con 20 empleados y meses planificados, recorrer las
 * tablas enteras cada vez no hace falta.
 */
const CREAR_CUADRANTE: Migracion = {
  descripcion: 'Crea las tablas del cuadrante: la celda de cada empleado y día, y sus turnos',
  aplicar(bd) {
    bd.ejecutar(`
      CREATE TABLE celdas (
        empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        dia         TEXT NOT NULL,
        tipo        TEXT NOT NULL CHECK (tipo IN ('turnos', 'ausencia', 'vacaciones')),
        PRIMARY KEY (empleado_id, dia)
      )
    `);
    bd.ejecutar(`
      CREATE TABLE turnos (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
        dia         TEXT NOT NULL,
        inicio      TEXT NOT NULL,
        fin         TEXT NOT NULL,
        FOREIGN KEY (empleado_id, dia) REFERENCES celdas (empleado_id, dia) ON DELETE CASCADE
      )
    `);
    bd.ejecutar('CREATE INDEX celdas_dia ON celdas (dia)');
    bd.ejecutar('CREATE INDEX turnos_empleado_dia ON turnos (empleado_id, dia)');
  },
};

/** En orden. Nunca se reordena, nunca se quita ninguna: solo se añade al final. */
export const MIGRACIONES: readonly Migracion[] = [
  CREAR_PLANTILLA,
  CREAR_AJUSTES,
  AMPLIAR_FICHA_Y_RETIRAR_AJUSTES,
  CREAR_CUADRANTE,
];

/** La versión de esquema que esta versión de la app sabe leer. */
export const VERSION_DEL_ESQUEMA = MIGRACIONES.length;

export function leerVersionDelEsquema(bd: BaseDeDatos): number {
  const [fila] = bd.leer<{ user_version: number }>('PRAGMA user_version');
  return fila.user_version;
}

/**
 * Lleva la base de datos a la última versión conocida.
 *
 * Se llama en cada arranque, antes de la primera lectura. Si ya está al día no hace
 * nada, así que arrancar dos veces seguidas da el mismo resultado que arrancar una.
 *
 * Lanza si la base viene de una versión **posterior** de la app: SQLite la abriría
 * tan ricamente y la app leería columnas que no entiende, o escribiría dejándose
 * otras a medias. No se toca su contenido; quien llama decide qué mostrar.
 */
export function migrar(bd: BaseDeDatos): void {
  const versionActual = leerVersionDelEsquema(bd);

  if (versionActual > VERSION_DEL_ESQUEMA) {
    throw new Error(
      `El almacenamiento es de una versión posterior de la app ` +
        `(esquema ${versionActual}, esta app conoce hasta ${VERSION_DEL_ESQUEMA}).`,
    );
  }

  for (let numero = versionActual + 1; numero <= VERSION_DEL_ESQUEMA; numero++) {
    aplicarMigracion(bd, MIGRACIONES[numero - 1], numero);
  }
}

/**
 * Una migración y su subida de versión, en la misma transacción: si algo falla se
 * deshace entera y `user_version` no sube, de modo que la app queda en la versión
 * anterior y vuelve a intentarlo en el siguiente arranque en lugar de quedarse con
 * medio esquema.
 */
function aplicarMigracion(bd: BaseDeDatos, migracion: Migracion, numero: number): void {
  bd.ejecutar('BEGIN');
  try {
    migracion.aplicar(bd);
    // `user_version` no admite parámetros; el número es un entero que sale de la
    // posición en la lista, no de ninguna entrada del encargado.
    bd.ejecutar(`PRAGMA user_version = ${numero}`);
    bd.ejecutar('COMMIT');
  } catch (fallo) {
    bd.ejecutar('ROLLBACK');
    throw fallo;
  }
}
