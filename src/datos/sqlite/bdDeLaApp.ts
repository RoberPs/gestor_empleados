/**
 * De dónde saca la app su base de datos. Versión del móvil.
 *
 * Existe para que `app/_layout.tsx` no tenga que saber en qué plataforma corre. Metro
 * resuelve `bdDeLaApp.web.ts` al empaquetar para el navegador y este fichero en Android,
 * así que la elección no es un condicional en el código: es qué fichero entra en el
 * bundle (design.md — D4). Consecuencia práctica: nada de la demo —ni `sql.js`, ni los
 * datos de ejemplo, ni IndexedDB— puede colarse en el binario del móvil, porque Metro
 * no empaqueta los `.web.ts` para Android.
 *
 * Aquí no hay nada que preparar: `expo-sqlite` está dentro de la app y abre al momento.
 * `prepararElAlmacenamiento` existe solo porque la versión web sí tiene que esperar a su
 * motor de WebAssembly.
 */

import { abrirConExpoSqlite } from './bdExpoSqlite';
import type { AbrirFichero } from './bd';

/** En el móvil no hay nada que cargar antes de abrir. Recibe el nombre por simetría. */
export async function prepararElAlmacenamiento(_nombreDelFichero: string): Promise<void> {}

export const abrirFicheroDeLaApp: AbrirFichero = abrirConExpoSqlite;
