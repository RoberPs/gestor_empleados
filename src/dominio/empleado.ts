/**
 * Reglas del empleado: qué nombre se puede guardar y cómo se guardan sus datos de
 * contacto.
 *
 * Solo el nombre es obligatorio, y además tiene que ser único: la rejilla del
 * cuadrante identifica cada fila únicamente por él y trunca los largos, así que dos
 * "María" harían el cuadrante ambiguo justo en la pantalla donde se planifica.
 *
 * El teléfono y el email no se validan: `600 11 22 33`, `+34 600112233` y
 * `600112233` son el mismo teléfono para una persona, y la app no llama ni escribe
 * a nadie. Se guardan tal y como se teclean, sin los espacios sobrantes del
 * principio y del final, y nada más.
 */

import type { Empleado, IdEmpleado } from './tipos';

export const MOTIVO_NOMBRE_VACIO = 'Escribe el nombre: es el único dato obligatorio.';
export const MOTIVO_NOMBRE_REPETIDO =
  'Ya hay otro empleado con ese nombre. Escríbelo de otra forma para poder distinguirlos.';

/** Lo que se guarda de un campo tecleado: lo mismo, sin los espacios de los extremos. */
export function sanearCampo(texto: string): string {
  return texto.trim();
}

/**
 * Forma del nombre con la que se comprueba la unicidad: sin distinguir mayúsculas
 * y sin espacios sobrantes, ni en los extremos ni entre palabras. `ana` y `Ana `
 * son el mismo nombre; `Ana G.` no.
 */
function formaComparable(nombre: string): string {
  return nombre.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-ES');
}

/**
 * Explica por qué un nombre no se puede guardar, o `null` si se puede.
 *
 * `idQueSeEdita` es el empleado cuyo nombre se está cambiando: su propio nombre no
 * cuenta como repetido cuando solo se corrigen mayúsculas o espacios.
 */
export function motivoPorElQueElNombreNoSeGuarda(
  nombre: string,
  plantilla: readonly Empleado[],
  idQueSeEdita?: IdEmpleado,
): string | null {
  if (sanearCampo(nombre).length === 0) return MOTIVO_NOMBRE_VACIO;

  const buscado = formaComparable(nombre);
  const repetido = plantilla.some(
    (empleado) => empleado.id !== idQueSeEdita && formaComparable(empleado.nombre) === buscado,
  );

  return repetido ? MOTIVO_NOMBRE_REPETIDO : null;
}

export function sePuedeGuardarElNombre(
  nombre: string,
  plantilla: readonly Empleado[],
  idQueSeEdita?: IdEmpleado,
): boolean {
  return motivoPorElQueElNombreNoSeGuarda(nombre, plantilla, idQueSeEdita) === null;
}
