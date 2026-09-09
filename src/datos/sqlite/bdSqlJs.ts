/**
 * La `BaseDeDatos` de la demo web, sobre `sql.js`.
 *
 * Es la tercera implementación de la misma interfaz —`expo-sqlite` en el móvil,
 * `node:sqlite` en los tests, esta en el navegador—, y como las otras dos no tiene
 * lógica propia: traduce los cuatro métodos y nada más. El SQL de las migraciones y de
 * las operaciones sigue escribiéndose una sola vez.
 *
 * `sql.js` es SQLite de verdad compilado a WebAssembly, con **API síncrona**, que es lo
 * que permite que la demo sea la misma app y no una copia suya: `AlmacenCuadrante` es
 * síncrona y `ArranqueDeLaApp` abre el almacenamiento en el inicializador de `useState`,
 * antes del primer pintado. El soporte web de `expo-sqlite` es asíncrono, y adoptarlo
 * habría obligado a meter estados de carga en las pantallas, es decir, a cambiar la app
 * real para poder enseñarla (design.md — D1).
 *
 * ── DÓNDE VIVE EL FICHERO ───────────────────────────────────────────────────
 * En ninguna parte por sí solo. `sql.js` trabaja **en memoria**: no hay sistema de
 * ficheros que valga, así que el «nombre del fichero» aquí es solo una etiqueta que se
 * conserva para que la interfaz sea la misma. Quien quiera que lo escrito sobreviva a
 * recargar la página guarda los bytes por su cuenta con `exportar()` y los devuelve al
 * abrir. Eso lo hace `bdDeLaApp.web.ts`; este módulo no sabe de navegadores y por eso
 * se puede ejercitar en los tests igual que las otras dos implementaciones.
 */

import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

import type { BaseDeDatos, ResultadoEscritura, ValorSql } from './bd';

/**
 * Una base de `sql.js` sabe además entregar sus bytes, que es como se conserva lo que
 * se prueba en la demo. Sigue siendo una `BaseDeDatos` para todo lo demás.
 */
export interface BaseDeDatosExportable extends BaseDeDatos {
  /** Los bytes del fichero SQLite tal cual está ahora, para poder volver a abrirlo. */
  exportar(): Uint8Array;
}

/**
 * El motor, una vez cargado. Es un módulo de WebAssembly: cargarlo es asíncrono y
 * cuesta una descarga, así que se hace una sola vez y se guarda aquí.
 */
let motor: SqlJsStatic | undefined;

/**
 * Trae el motor de SQLite y lo deja listo para `abrirConSqlJs`.
 *
 * Hay que llamarlo —y esperarlo— **antes** de abrir ninguna base. Esa es toda la razón
 * de que la demo tenga una fase previa de arranque que la app del móvil no tiene
 * (design.md — D3): una vez cargado el motor, abrir vuelve a ser síncrono y el resto de
 * la app no se entera de nada.
 *
 * `localizarElWasm` dice de dónde se descarga el `.wasm`. Por omisión, de la raíz del
 * sitio, que es donde lo deja `scripts/copiarSqlWasm.js`. Los tests le pasan la ruta
 * dentro de `node_modules`, porque en Node no hay servidor que valga.
 */
export async function prepararSqlJs(
  localizarElWasm: (fichero: string) => string = (fichero) => `/${fichero}`,
): Promise<void> {
  if (motor) return;
  motor = await initSqlJs({ locateFile: localizarElWasm });
}

/** Si el motor está listo. Sin esto, `abrirConSqlJs` lanza. */
export function sqlJsEstaPreparado(): boolean {
  return motor !== undefined;
}

/**
 * Abre una base sobre `sql.js`, vacía o a partir de los bytes de una anterior.
 *
 * `contenidoInicial` son los bytes que se guardaron la última vez. Si no se pasan
 * —primera visita, o no había nada guardado—, la base nace vacía y las migraciones la
 * levantan desde cero, igual que la primera vez que se abre la app en un móvil.
 */
export function abrirConSqlJs(
  nombreDelFichero: string,
  contenidoInicial?: Uint8Array,
): BaseDeDatosExportable {
  if (!motor) {
    // No es un mensaje para nadie que use la demo: es para quien la programe. Si esto
    // salta, la fase previa de arranque no ha esperado al motor.
    throw new Error(
      `No se puede abrir «${nombreDelFichero}»: el motor de SQLite todavía no está cargado. ` +
        'Hay que esperar a `prepararSqlJs()` antes de abrir la base.',
    );
  }

  const bd: Database = contenidoInicial
    ? new motor.Database(contenidoInicial)
    : new motor.Database();

  return {
    ejecutar(sql: string): void {
      // `run` sin parámetros admite varias sentencias seguidas, que es lo que necesitan
      // las migraciones y los `PRAGMA`.
      bd.run(sql);
    },

    escribir(sql: string, ...parametros: ValorSql[]): ResultadoEscritura {
      bd.run(sql, parametros);
      // `sql.js` no devuelve el identificador insertado como sí hacen `expo-sqlite` y
      // `node:sqlite`, así que se pregunta aparte, sobre la misma conexión y justo
      // después de escribir (design.md — D2). `getRowsModified` es el equivalente de
      // `changes`.
      return { ultimoId: ultimoIdInsertado(bd), filasAfectadas: bd.getRowsModified() };
    },

    leer<Fila>(sql: string, ...parametros: ValorSql[]): Fila[] {
      const sentencia = bd.prepare(sql);
      try {
        sentencia.bind(parametros);
        const filas: Fila[] = [];
        while (sentencia.step()) filas.push(sentencia.getAsObject() as Fila);
        return filas;
      } finally {
        // Sin esto la sentencia se queda viva dentro del módulo de WebAssembly: en una
        // sesión larga de la demo serían cientos.
        sentencia.free();
      }
    },

    exportar(): Uint8Array {
      return bd.export();
    },

    cerrar(): void {
      bd.close();
    },
  };
}

/** El `rowid` de la última fila insertada en esta conexión. */
function ultimoIdInsertado(bd: Database): number {
  const sentencia = bd.prepare('SELECT last_insert_rowid() AS id');
  try {
    sentencia.step();
    const { id } = sentencia.getAsObject() as { id: number };
    return id;
  } finally {
    sentencia.free();
  }
}
