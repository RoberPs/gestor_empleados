/**
 * Tipos que la pantalla del cuadrante necesita.
 *
 * El tipo `ContenidoCelda` impide por construcción que una celda tenga un tercer
 * turno: la lista de turnos es una tupla de uno o dos elementos, nunca un array
 * abierto.
 */

import type { Hora } from './formatos';

export type IdEmpleado = string;
export type IdTurno = string;

/**
 * Empleado de la plantilla.
 *
 * El nombre es el único campo obligatorio: identifica la fila del cuadrante y se
 * pide en el alta. Los demás son opcionales y se rellenan desde la ficha del panel
 * de empleados.
 *
 * El teléfono, el email, la nota y el motivo de la ausencia **no salen de la
 * ficha**: el cuadrante no los lee ni los muestra en ninguna de sus pantallas, y la
 * lista del panel tampoco. El puesto es la excepción: describe la función de una
 * persona dentro del local, no permite localizarla ni identificarla fuera de él, y
 * por eso sí se muestra junto al nombre en la lista.
 *
 * `motivoAusencia` es **uno por empleado**, no uno por día marcado como ausencia:
 * el caso real es recordar por qué falta alguien estos días, no llevar el historial
 * de bajas del año. La consecuencia está asumida y es explícita: **un motivo nuevo
 * pisa al anterior**, no se archiva ninguno, y nada obliga a que el empleado tenga
 * ausencias marcadas en el cuadrante para tenerlo escrito.
 */
export interface Empleado {
  readonly id: IdEmpleado;
  readonly nombre: string;
  readonly puesto?: string;
  readonly telefono?: string;
  readonly email?: string;
  readonly nota?: string;
  readonly motivoAusencia?: string;
}

/** Un turno planificado de un día: hora de inicio y hora de fin, en 24h. */
export interface TurnoPlanificado {
  readonly id: IdTurno;
  readonly inicio: Hora;
  readonly fin: Hora;
}

/** Uno o dos turnos el mismo día. Nunca tres: el tipo no lo permite. */
export type TurnosDelDia = readonly [TurnoPlanificado] | readonly [TurnoPlanificado, TurnoPlanificado];

/** Los cuatro estados en los que puede encontrarse una celda empleado × día. */
export type ContenidoCelda =
  | { readonly tipo: 'vacia' }
  | { readonly tipo: 'turnos'; readonly turnos: TurnosDelDia }
  | { readonly tipo: 'ausencia' }
  | { readonly tipo: 'vacaciones' };

export const CELDA_VACIA: ContenidoCelda = { tipo: 'vacia' };

/** Etiquetas de la celda. Son las dos únicas abreviaturas admitidas en la pantalla. */
export const ETIQUETA_AUSENCIA = 'AUS';
export const ETIQUETA_VACACIONES = 'VAC';

/** Palabras completas, que son las que se usan fuera de la celda. */
export const PALABRA_AUSENCIA = 'Ausencia';
export const PALABRA_VACACIONES = 'Vacaciones';
