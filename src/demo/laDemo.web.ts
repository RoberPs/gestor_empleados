/**
 * Si esto es la demo, y cómo se reinicia. Versión de la demo web.
 */

import { borrarLoGuardado } from '../datos/sqlite/almacenDelNavegador.web';

/** Esta sí es la demo: lleva distintivo, datos de ejemplo y reinicio. */
export const ES_LA_DEMO = true;

/**
 * Devuelve la demo a su estado de ejemplo.
 *
 * Borra lo guardado en el navegador y recarga la página: sin fichero que recuperar, la
 * apertura siguiente vuelve a sembrar el ejemplo sobre la semana en curso. Recargar es
 * además lo único que garantiza que no quede en memoria nada de la sesión anterior, ni
 * en la base abierta ni en las pantallas.
 */
export async function reiniciarLaDemo(): Promise<void> {
  await borrarLoGuardado();
  window.location.reload();
}
