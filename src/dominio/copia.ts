/**
 * Lo que se copia de una celda para pegarlo en otra.
 *
 * **No es una `ContenidoCelda`**, y la diferencia no es cosmética: los turnos de una
 * celda llevan un `id`, y ese identificador no significa nada en la celda destino,
 * donde los turnos son otros. Guardarlo invitaría a usarlo en un `editarTurno` sobre
 * la celda equivocada —que edita el turno del empleado de origen mientras el
 * encargado mira el destino, sin que nada falle a la vista—. Un tipo que no lo lleva
 * hace ese fallo imposible de escribir.
 *
 * De la ficha del empleado no viaja nada: ni nombre, ni teléfono, ni email, ni nota,
 * ni el motivo de la ausencia. Lo que se copia es el contenido observable de la
 * celda y nada más.
 */

import type { Hora } from './formatos';
import type { ContenidoCelda } from './tipos';

/** Un turno copiado: sus dos horas, sin identificador. */
export interface TurnoCopiado {
  readonly inicio: Hora;
  readonly fin: Hora;
}

/** Uno o dos turnos copiados. Nunca tres, igual que en la celda. */
export type TurnosCopiados = readonly [TurnoCopiado] | readonly [TurnoCopiado, TurnoCopiado];

/**
 * Los tres estados de celda que se pueden copiar.
 *
 * La celda vacía no está: no hay nada que copiar en ella, y por eso `paraCopiar`
 * devuelve `null` en ese caso en lugar de un cuarto estado que luego habría que
 * distinguir en cada sitio.
 */
export type ContenidoCopiado =
  | { readonly tipo: 'turnos'; readonly turnos: TurnosCopiados }
  | { readonly tipo: 'ausencia' }
  | { readonly tipo: 'vacaciones' };

/**
 * Lo que se lleva copiar esta celda, o `null` si no hay nada que copiar.
 *
 * Es código puro: no lee del almacén, no escribe nada y no toca la celda de origen.
 */
export function paraCopiar(contenido: ContenidoCelda): ContenidoCopiado | null {
  switch (contenido.tipo) {
    case 'vacia':
      return null;

    case 'ausencia':
      return { tipo: 'ausencia' };

    case 'vacaciones':
      return { tipo: 'vacaciones' };

    case 'turnos': {
      const [primero, segundo] = contenido.turnos;
      return {
        tipo: 'turnos',
        turnos: segundo
          ? [sinIdentificador(primero), sinIdentificador(segundo)]
          : [sinIdentificador(primero)],
      };
    }
  }
}

/**
 * Deja el turno en sus dos horas. Se escribe campo a campo y no con un `...turno`
 * al que se le quite el `id`: así, el día que el turno gane un campo, hay que
 * decidir a mano si viaja o no.
 */
function sinIdentificador(turno: { readonly inicio: Hora; readonly fin: Hora }): TurnoCopiado {
  return { inicio: turno.inicio, fin: turno.fin };
}
