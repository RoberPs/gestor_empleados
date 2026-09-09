/**
 * Si esto es la demo, y cómo se reinicia. Versión del móvil.
 *
 * Va aparte de `bdDeLaApp` a propósito. Aquel módulo abre la base de datos y por eso
 * importa `expo-sqlite`, que no se puede ejecutar fuera del dispositivo: cualquier test
 * que quisiera preguntar «¿esto es la demo?» acabaría arrastrando esa librería y no
 * podría correr. Aquí no hay nada que no funcione en cualquier parte, así que la
 * garantía de que la app instalada no lleva demo dentro sí se puede comprobar en la
 * suite.
 */

/** En la app instalada, no. No hay distintivo, ni datos de ejemplo, ni reinicio. */
export const ES_LA_DEMO = false;

/** Devolver la demo a su estado de ejemplo. En el móvil no existe y nadie la llama. */
export async function reiniciarLaDemo(): Promise<void> {
  throw new Error('La app instalada no tiene demo que reiniciar.');
}
