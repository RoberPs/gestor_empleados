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
 * pide en el alta. El teléfono, el email y la nota son opcionales, se rellenan
 * desde la ficha del panel de empleados y **no salen de ella**: el cuadrante no
 * los lee ni los muestra en ninguna de sus pantallas.
 */
export interface Empleado {
  readonly id: IdEmpleado;
  readonly nombre: string;
  readonly telefono?: string;
  readonly email?: string;
  readonly nota?: string;
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
