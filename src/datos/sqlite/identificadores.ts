/**
 * Del identificador que maneja el resto del proyecto al que entiende la tabla.
 *
 * Todos los identificadores del dominio son `string` —`IdEmpleado`, `IdTurno`— y
 * todos los de las tablas son enteros de `AUTOINCREMENT`. La conversión vive aquí,
 * en un solo sitio, porque la usan los dos adaptadores: el de la plantilla y el del
 * cuadrante.
 */

/**
 * El identificador tal y como lo entiende la tabla, o `null` si no puede
 * corresponder a ninguna fila.
 *
 * Un identificador que no sea un entero no lo genera `AUTOINCREMENT`, así que no
 * apunta a nada: se trata como fila que no está, no como error.
 */
export function comoIdDeFila(id: string): number | null {
  const numero = Number(id);
  return Number.isInteger(numero) && id.trim() !== '' ? numero : null;
}
