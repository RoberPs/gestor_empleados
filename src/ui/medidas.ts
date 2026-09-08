/**
 * Reparto de anchos de la rejilla.
 *
 * Las cuatro exigencias de la pantalla —siete columnas visibles a la vez, sin
 * scroll horizontal, área pulsable de 44 × 44 puntos y horas sin abreviar— fijan
 * la geometría: las siete columnas de día se reparten el ancho a partes iguales
 * con un mínimo de 44 puntos y la columna de nombres se queda con el resto.
 */

import { DIAS_POR_SEMANA } from '../dominio/semana';
import { tipografia } from './tema';

/** Área pulsable mínima de una celda, en puntos. */
export const LADO_PULSABLE_MINIMO = 44;

/**
 * Líneas de hora que tiene que poder mostrar una celda: dos turnos, con su hora
 * de inicio y su hora de fin cada uno. Es el contenido más alto que admite una
 * celda, y por tanto el que fija el alto de la fila.
 */
const LINEAS_DE_HORA_POR_CELDA = 4;

/** Separación vertical propia de cada turno dentro de la celda, arriba y abajo. */
const MARGEN_POR_TURNO = 1;
/** Aire que la celda deja por dentro, arriba y abajo. */
const RELLENO_DE_LA_CELDA = 2;

/**
 * Alto de una fila de la rejilla, en puntos.
 *
 * Todas las filas miden lo mismo, tengan lo que tengan: una fila vacía ocupa lo
 * que una con dos turnos, y la rejilla no cambia de forma al pasar de una semana
 * a otra. El alto sale del contenido más alto que puede llegar a haber —cuatro
 * horas, una debajo de otra— para que ese caso quepa entero y sin truncar.
 *
 * Se calcula con la escala de letra del dispositivo, no con un número fijo:
 * cuando el encargado tiene el móvil configurado con letra grande, el texto crece
 * y la fila tiene que crecer con él o las horas quedarían cortadas.
 */
export function altoDeFila(escalaDeLetra: number): number {
  const altoDeLinea = Math.ceil(tipografia.hora * escalaDeLetra * 1.3);
  const altoDelContenido =
    LINEAS_DE_HORA_POR_CELDA * (altoDeLinea + MARGEN_POR_TURNO) + RELLENO_DE_LA_CELDA * 2;
  return Math.max(LADO_PULSABLE_MINIMO, altoDelContenido);
}

/** Ancho mínimo de pantalla soportado, en orientación vertical. */
export const ANCHO_MINIMO_SOPORTADO = 360;

/** Ancho que se reserva a la columna de nombres cuando la pantalla da de sí. */
const ANCHO_DESEADO_DE_NOMBRES = 96;

export interface AnchosDeLaRejilla {
  /** Ancho de la columna de nombres. */
  readonly nombres: number;
  /** Ancho de cada una de las siete columnas de día, todas iguales. */
  readonly dia: number;
}

/**
 * Reparte el ancho disponible entre la columna de nombres y las siete de día.
 *
 * A 360 puntos, las siete columnas de día se quedan con 44 puntos cada una —su
 * mínimo— y la de nombres con los 52 restantes. A partir de ahí, la columna de
 * nombres crece hasta su ancho deseado y el sobrante se reparte entre los días.
 */
export function repartirAnchos(anchoDePantalla: number): AnchosDeLaRejilla {
  const ancho = Math.max(anchoDePantalla, ANCHO_MINIMO_SOPORTADO);
  const anchoParaDias = ancho - ANCHO_DESEADO_DE_NOMBRES;
  const diaSiCabenLosNombres = anchoParaDias / DIAS_POR_SEMANA;

  if (diaSiCabenLosNombres >= LADO_PULSABLE_MINIMO) {
    return { nombres: ANCHO_DESEADO_DE_NOMBRES, dia: diaSiCabenLosNombres };
  }

  // No cabe la columna de nombres deseada: los días se quedan con su mínimo y la
  // columna de nombres con el resto. El nombre que no quepa se trunca.
  const dia = LADO_PULSABLE_MINIMO;
  return { nombres: ancho - dia * DIAS_POR_SEMANA, dia };
}
