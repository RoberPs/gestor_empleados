/**
 * Vacaciones como rango de fechas.
 *
 * No hay dos conceptos de vacaciones: un rango es exactamente el conjunto de sus
 * días marcados como vacaciones en el cuadrante. De ahí las dos operaciones de
 * este módulo, que son inversas la una de la otra:
 *
 * - `diasDelRango` expande el rango que el encargado teclea en la ficha a los días
 *   que hay que marcar en la rejilla.
 * - `agruparEnRangos` recompone los días marcados en los rangos que la ficha
 *   presenta, uniendo los que se tocan.
 *
 * Por eso dos rangos contiguos se ven en la ficha como uno solo, y por eso quitar
 * las vacaciones de un día desde la celda del cuadrante parte el rango en dos: la
 * ficha no recuerda en cuántas veces se tecleó, solo lee los días.
 */

import { formatearFecha } from './formatos';
import { sumarDias, type FechaISO } from './semana';

/** Un tramo de vacaciones: del día de inicio al de fin, los dos incluidos. */
export interface RangoDeVacaciones {
  readonly inicio: FechaISO;
  readonly fin: FechaISO;
}

export const MOTIVO_FIN_ANTERIOR_AL_INICIO =
  'La fecha de fin no puede ser anterior a la de inicio.';

/**
 * Un rango se puede guardar si su fin no es anterior a su inicio. Que coincidan es
 * válido: es un único día de vacaciones.
 *
 * Las fechas son `aaaa-mm-dd`, así que compararlas como texto es compararlas como
 * días naturales.
 */
export function sePuedeGuardarElRango(rango: RangoDeVacaciones): boolean {
  return rango.fin >= rango.inicio;
}

/** Los días naturales que cubre el rango, de inicio a fin y en ese orden. */
export function diasDelRango(rango: RangoDeVacaciones): FechaISO[] {
  if (!sePuedeGuardarElRango(rango)) return [];

  const dias: FechaISO[] = [];
  for (let dia = rango.inicio; dia <= rango.fin; dia = sumarDias(dia, 1)) {
    dias.push(dia);
  }
  return dias;
}

/**
 * Agrupa días sueltos de vacaciones en tramos de días contiguos.
 *
 * Los días llegan en cualquier orden y pueden venir repetidos; los rangos salen
 * ordenados de más antiguo a más reciente.
 */
export function agruparEnRangos(dias: readonly FechaISO[]): RangoDeVacaciones[] {
  const ordenados = [...new Set(dias)].sort();
  const rangos: RangoDeVacaciones[] = [];

  for (const dia of ordenados) {
    const ultimo = rangos[rangos.length - 1];
    if (ultimo && sumarDias(ultimo.fin, 1) === dia) {
      rangos[rangos.length - 1] = { inicio: ultimo.inicio, fin: dia };
    } else {
      rangos.push({ inicio: dia, fin: dia });
    }
  }

  return rangos;
}

/** El rango tal y como se muestra en la ficha: `10/09/2026 - 14/09/2026`. */
export function formatearRango(rango: RangoDeVacaciones): string {
  return `${formatearFecha(rango.inicio)} - ${formatearFecha(rango.fin)}`;
}

export function esElMismoRango(uno: RangoDeVacaciones, otro: RangoDeVacaciones): boolean {
  return uno.inicio === otro.inicio && uno.fin === otro.fin;
}
