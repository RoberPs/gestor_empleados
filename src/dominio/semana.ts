/**
 * Modelo de semana del cuadrante: de lunes a domingo, siempre.
 *
 * Las fechas se manejan como cadenas `aaaa-mm-dd` (`FechaISO`) y no como `Date`,
 * para que un día del cuadrante sea siempre el mismo día natural, sin depender de
 * la hora ni de la zona horaria. El único punto en el que se lee un `Date` es
 * `semanaQueContiene`, que traduce la fecha actual del dispositivo a día natural
 * usando sus componentes locales.
 */

/** Día natural en formato `aaaa-mm-dd`. */
export type FechaISO = string;

/** Una semana del cuadrante, identificada por su lunes. */
export interface Semana {
  readonly lunes: FechaISO;
}

/** Número de días que tiene la semana del cuadrante, de lunes a domingo. */
export const DIAS_POR_SEMANA = 7;

function aFechaISO(anio: number, mes: number, dia: number): FechaISO {
  const mm = String(mes).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

/** Convierte `aaaa-mm-dd` en un `Date` en UTC a medianoche, para poder sumar días. */
function aDateUTC(fecha: FechaISO): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function deDateUTC(fecha: Date): FechaISO {
  return aFechaISO(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, fecha.getUTCDate());
}

/** Día natural que corresponde a un `Date` del dispositivo, en hora local. */
export function fechaDelDispositivo(momento: Date): FechaISO {
  return aFechaISO(momento.getFullYear(), momento.getMonth() + 1, momento.getDate());
}

/** Suma (o resta, si es negativo) días naturales a una fecha. */
export function sumarDias(fecha: FechaISO, dias: number): FechaISO {
  const d = aDateUTC(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return deDateUTC(d);
}

/**
 * Semana de lunes a domingo que contiene la fecha dada.
 *
 * Un domingo pertenece a la semana que termina en él, no a la que empieza al día
 * siguiente.
 */
export function semanaQueContiene(fecha: FechaISO): Semana {
  // getUTCDay(): 0 = domingo … 6 = sábado. Días transcurridos desde el lunes.
  const diasDesdeElLunes = (aDateUTC(fecha).getUTCDay() + 6) % DIAS_POR_SEMANA;
  return { lunes: sumarDias(fecha, -diasDesdeElLunes) };
}

/** Semana en curso: la que contiene la fecha actual del dispositivo. */
export function semanaEnCurso(ahora: Date = new Date()): Semana {
  return semanaQueContiene(fechaDelDispositivo(ahora));
}

/** Desplaza la semana un número entero de semanas: `+1` la siguiente, `-1` la anterior. */
export function desplazarSemanas(semana: Semana, semanas: number): Semana {
  return { lunes: sumarDias(semana.lunes, semanas * DIAS_POR_SEMANA) };
}

/** Semana siguiente: exactamente siete días después. */
export function semanaSiguiente(semana: Semana): Semana {
  return desplazarSemanas(semana, 1);
}

/** Semana anterior: exactamente siete días antes. */
export function semanaAnterior(semana: Semana): Semana {
  return desplazarSemanas(semana, -1);
}

/** Los siete días de la semana, de lunes a domingo en ese orden. */
export function diasDeLaSemana(semana: Semana): FechaISO[] {
  return Array.from({ length: DIAS_POR_SEMANA }, (_, i) => sumarDias(semana.lunes, i));
}

/** Domingo de la semana. */
export function domingoDe(semana: Semana): FechaISO {
  return sumarDias(semana.lunes, DIAS_POR_SEMANA - 1);
}

export function esLaMismaSemana(una: Semana, otra: Semana): boolean {
  return una.lunes === otra.lunes;
}
