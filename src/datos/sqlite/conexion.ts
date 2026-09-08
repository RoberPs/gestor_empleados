/**
 * Apertura del único fichero de base de datos de la app.
 *
 * Una sola base de datos, un solo fichero, en el directorio privado que la librería
 * usa por omisión. Sin cifrado propio: la protección es la del almacenamiento
 * privado de la aplicación más el desbloqueo del móvil (design.md — D9).
 *
 * El nombre del fichero es deliberadamente neutro. El del local sí quedó fijado en
 * el código el 08/09/2026, pero aquí no pinta nada: el nombre comercial de la app y
 * el del responsable siguen sin fijarse, y un fichero que aludiera a cualquiera de
 * los tres habría que renombrarlo —con migración de por medio— el día que cambien.
 */

import type { AbrirFichero, BaseDeDatos } from './bd';

export const FICHERO_BASE_DE_DATOS = 'plantilla.db';

/**
 * Abre la base de datos y deja activadas las claves ajenas.
 *
 * `PRAGMA foreign_keys = ON` se ejecuta **en cada apertura** y no una sola vez al
 * crear el fichero: en SQLite las claves ajenas vienen desactivadas por omisión y el
 * ajuste no se guarda en el fichero. Sin esta línea, el `ON DELETE CASCADE` con el
 * que las tablas de turnos, ausencias, vacaciones y horas se colgarán del empleado
 * estaría escrito en el esquema y no haría absolutamente nada, y una baja dejaría
 * detrás filas huérfanas de alguien que ya no está (design.md — D5).
 *
 * Hoy todavía no hay ninguna clave ajena que vigilar. Se activa ya para que ningún
 * change posterior tenga que acordarse.
 */
export function abrirBaseDeDatos(
  abrirFichero: AbrirFichero,
  nombreDelFichero: string = FICHERO_BASE_DE_DATOS,
): BaseDeDatos {
  const bd = abrirFichero(nombreDelFichero);
  bd.ejecutar('PRAGMA foreign_keys = ON');
  return bd;
}
