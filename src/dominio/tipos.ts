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
 * Empleado tal y como lo necesita el cuadrante: solo el nombre mostrable.
 * El cuadrante no conoce el teléfono ni el email; esos campos son del panel de
 * empleados y no se muestran nunca en esta pantalla.
 */
export interface Empleado {
  readonly id: IdEmpleado;
  readonly nombre: string;
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
