/**
 * Formatos de la pantalla, en español de España: fechas dd/mm/aaaa y horas en
 * formato 24h `hh:mm`. Ninguno de los dos se abrevia nunca.
 */

import { domingoDe, type FechaISO, type Semana } from './semana';

/** Hora del día en formato 24h. */
export interface Hora {
  readonly horas: number;
  readonly minutos: number;
}

/** Nombres completos de los días, de lunes a domingo. No se abrevian. */
export const NOMBRES_DE_DIA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

/** Nombre completo del día de la semana que corresponde a una fecha. */
export function nombreDeDia(fecha: FechaISO): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return NOMBRES_DE_DIA[(diaSemana + 6) % 7];
}

/** `2026-09-07` → `07/09/2026`. */
export function formatearFecha(fecha: FechaISO): string {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Día del mes sin el resto de la fecha: `2026-09-07` → `07`. */
export function formatearDiaDelMes(fecha: FechaISO): string {
  return fecha.split('-')[2];
}

/** Rango de la semana tal y como se muestra en la cabecera: `07/09/2026 - 13/09/2026`. */
export function formatearRangoDeSemana(semana: Semana): string {
  return `${formatearFecha(semana.lunes)} - ${formatearFecha(domingoDe(semana))}`;
}

/** `{ horas: 9, minutos: 0 }` → `09:00`. Siempre 24h, nunca abreviado. */
export function formatearHora(hora: Hora): string {
  const hh = String(hora.horas).padStart(2, '0');
  const mm = String(hora.minutos).padStart(2, '0');
  return `${hh}:${mm}`;
}

function componerHora(horas: number, minutos: number): Hora | null {
  if (!Number.isInteger(horas) || !Number.isInteger(minutos)) return null;
  if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) return null;
  return { horas, minutos };
}

/**
 * Lee una hora del día escrita por el encargado.
 *
 * La pantalla **muestra** siempre `hh:mm` en 24h, pero al **escribir** se admite
 * cualquiera de las formas naturales de teclear una hora con una mano y con el
 * teclado numérico del móvil, porque exigir los dos puntos deja fuera media hora
 * sin ninguna razón de negocio:
 *
 * - con separador: `9:30`, `09:30`, `9.30`, `9,30`, `9h30`
 * - solo dígitos: `930`, `0930`
 * - hora en punto: `9`, `09` (equivalen a `09:00`)
 *
 * Devuelve `null` si el texto no es una hora válida del día.
 */
export function analizarHora(texto: string): Hora | null {
  const limpio = texto.trim().replace(/\s+/g, '');
  if (limpio.length === 0) return null;

  const conSeparador = /^(\d{1,2})[:.,hH](\d{1,2})$/.exec(limpio);
  if (conSeparador) {
    return componerHora(Number(conSeparador[1]), Number(conSeparador[2]));
  }

  const soloDigitos = /^\d{1,4}$/.exec(limpio);
  if (soloDigitos) {
    // Uno o dos dígitos son la hora en punto; tres o cuatro son `hmm` o `hhmm`.
    if (limpio.length <= 2) return componerHora(Number(limpio), 0);
    return componerHora(Number(limpio.slice(0, -2)), Number(limpio.slice(-2)));
  }

  return null;
}
