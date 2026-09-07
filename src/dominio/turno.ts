/**
 * Clasificación de un turno planificado a partir de sus horas.
 *
 * Es la validación mínima que la pantalla necesita para no aceptar en silencio un
 * turno imposible. Las reglas de dominio del turno —solapamiento entre los dos
 * tramos de un mismo día, duración mínima o máxima, cómputo de horas— son spec
 * pendiente y no se deciden aquí.
 */

import { formatearHora, type Hora } from './formatos';
import type { TurnoPlanificado, TurnosDelDia } from './tipos';

export type ClasificacionTurno =
  /** La hora de fin es posterior a la de inicio: el turno acaba el mismo día. */
  | 'normal'
  /** La hora de fin es anterior a la de inicio: el turno cruza la medianoche. */
  | 'cruza-medianoche'
  /** La hora de fin coincide con la de inicio: duración nula, no se puede guardar. */
  | 'duracion-nula';

/** Explicación que se muestra al encargado cuando el turno no se puede guardar. */
export const MOTIVO_DURACION_NULA =
  'La hora de fin no puede ser la misma que la de inicio: el turno no duraría nada.';

function enMinutos(hora: Hora): number {
  return hora.horas * 60 + hora.minutos;
}

export function clasificarTurno(inicio: Hora, fin: Hora): ClasificacionTurno {
  const minutosInicio = enMinutos(inicio);
  const minutosFin = enMinutos(fin);
  if (minutosFin === minutosInicio) return 'duracion-nula';
  if (minutosFin < minutosInicio) return 'cruza-medianoche';
  return 'normal';
}

/** Un turno se puede guardar salvo que su duración sea nula. */
export function sePuedeGuardar(inicio: Hora, fin: Hora): boolean {
  return clasificarTurno(inicio, fin) !== 'duracion-nula';
}

export function cruzaLaMedianoche(turno: TurnoPlanificado): boolean {
  return clasificarTurno(turno.inicio, turno.fin) === 'cruza-medianoche';
}

/** Los turnos de un día se muestran en orden de hora de inicio ascendente. */
export function ordenarPorHoraDeInicio(turnos: TurnosDelDia): TurnosDelDia {
  if (turnos.length === 1) return turnos;
  const [uno, otro] = turnos;
  return enMinutos(otro.inicio) < enMinutos(uno.inicio) ? [otro, uno] : [uno, otro];
}

/** Descripción de un turno con las palabras completas, para las acciones de celda. */
export function describirTurno(turno: TurnoPlanificado): string {
  return `${formatearHora(turno.inicio)} a ${formatearHora(turno.fin)}`;
}
