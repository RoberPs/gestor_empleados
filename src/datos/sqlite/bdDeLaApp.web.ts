/**
 * De dónde saca la app su base de datos. Versión de la demo web.
 *
 * Misma superficie que `bdDeLaApp.ts`, otro motor debajo: `sql.js` en lugar de
 * `expo-sqlite`, y los bytes guardados en el navegador de quien la prueba en lugar de un
 * fichero en el almacenamiento privado de la app.
 *
 * ── EL ORDEN IMPORTA ────────────────────────────────────────────────────────
 * 1. `prepararElAlmacenamiento()` —asíncrono, una sola vez— descarga el motor de SQLite
 *    y recupera del navegador lo que hubiera guardado de una visita anterior.
 * 2. `abrirFicheroDeLaApp()` —síncrono— abre la base con esos bytes.
 *
 * El paso 2 tiene que ser síncrono porque `ArranqueDeLaApp` abre el almacenamiento en el
 * inicializador de `useState`, antes del primer pintado, para que las pantallas puedan
 * leer la plantilla mientras se dibujan. Toda la asincronía cabe en el paso 1, que es
 * justo la fase previa que la app del móvil no tiene (design.md — D3).
 */

import { crearVolcador, leerElFicheroGuardado } from './almacenDelNavegador.web';
import type { AbrirFichero, BaseDeDatos, ResultadoEscritura, ValorSql } from './bd';
import { abrirConSqlJs, prepararSqlJs } from './bdSqlJs';

/** Lo que se recuperó del navegador en la fase previa, a la espera de que abran. */
let contenidoRecuperado: Uint8Array | undefined;
let nombreRecuperado: string | undefined;

/**
 * Descarga el motor de SQLite y recupera lo guardado. Hay que esperarlo antes de abrir.
 *
 * El `.wasm` se sirve desde la raíz del sitio, donde lo deja `scripts/copiarSqlWasm.js`.
 * Cuando el sitio no cuelga de la raíz del dominio —en GitHub Pages vive bajo
 * `/gestor_empleados/`—, Expo deja esa ruta base en `EXPO_BASE_URL` y se antepone.
 */
export async function prepararElAlmacenamiento(nombreDelFichero: string): Promise<void> {
  const rutaBase = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');
  await prepararSqlJs((fichero) => `${rutaBase}/${fichero}`);
  contenidoRecuperado = await leerElFicheroGuardado(nombreDelFichero);
  nombreRecuperado = nombreDelFichero;
}

/**
 * Abre la base de la demo y la deja guardándose sola.
 *
 * Cada escritura programa un volcado al navegador. Las lecturas no: son la inmensa
 * mayoría de las llamadas y no cambian nada que guardar.
 */
export const abrirFicheroDeLaApp: AbrirFichero = (nombreDelFichero: string): BaseDeDatos => {
  const contenido = nombreDelFichero === nombreRecuperado ? contenidoRecuperado : undefined;
  const bd = abrirConSqlJs(nombreDelFichero, contenido);
  const { programarVolcado, volcarYa } = crearVolcador(nombreDelFichero, () => bd.exportar());

  return {
    ejecutar(sql: string): void {
      bd.ejecutar(sql);
      programarVolcado();
    },

    escribir(sql: string, ...parametros: ValorSql[]): ResultadoEscritura {
      const resultado = bd.escribir(sql, ...parametros);
      programarVolcado();
      return resultado;
    },

    leer<Fila>(sql: string, ...parametros: ValorSql[]): Fila[] {
      return bd.leer<Fila>(sql, ...parametros);
    },

    cerrar(): void {
      volcarYa();
      bd.cerrar();
    },
  };
};
