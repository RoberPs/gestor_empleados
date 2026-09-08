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

/** En orden. Nunca se reordena, nunca se quita ninguna: solo se añade al final. */
export const MIGRACIONES: readonly Migracion[] = [CREAR_PLANTILLA, CREAR_AJUSTES];

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
