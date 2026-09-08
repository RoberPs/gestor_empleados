/**
 * La identidad visual de la app: paleta, escala tipográfica y pesos.
 *
 * Este fichero es la única fuente de verdad del aspecto. Ninguna pantalla define
 * colores ni tamaños propios: los pide aquí. La app tiene un único aspecto,
 * claro; no hay tema oscuro ni selector de tema, y no sigue la preferencia de
 * tema del dispositivo.
 *
 * Los estados de la celda no se distinguen solo por el color: cada uno lleva
 * además su propio texto (las horas, `AUS`, `VAC`) y su propio borde, de modo que
 * siguen siendo distinguibles sin percibir el color.
 */

import type { TextStyle } from 'react-native';

/**
 * Cada color tiene un papel y solo se usa para ese papel. El ratio que acompaña
 * a cada uno es su contraste contra el fondo sobre el que se dibuja: el mínimo
 * exigido es 4,5:1 para texto y 3:1 para las líneas y bordes que delimitan a qué
 * empleado y a qué día pertenece lo que se está mirando.
 */
export const colores = {
  /** Fondo de pantalla. */
  fondo: '#ffffff',
  /** Fondo de cabecera y de barras. */
  fondoCabecera: '#f1f3f5',
  /** Texto principal. 17,6:1 sobre el fondo de pantalla. */
  texto: '#101418',
  /** Texto secundario. 7,3:1 sobre el fondo de pantalla. */
  textoSecundario: '#4a5560',
  /**
   * Línea de la rejilla y separadores. 3,4:1 sobre el fondo de pantalla: se
   * dibuja a un punto y tiene que verse al sol, porque sin ella la rejilla deja
   * de leerse.
   */
  lineaRejilla: '#848c95',
  /**
   * Borde marcado: delimitación fuerte de la cabecera de días y de la columna de
   * nombres, las dos líneas que estructuran la rejilla. 17,6:1 sobre el fondo de
   * pantalla. El borde de las etiquetas `AUS` y `VAC` no usa este color: lleva la
   * tinta de su propio estado.
   */
  bordeFuerte: '#101418',
  /** Acción: botones y accesos de la interfaz. 6,7:1 sobre el fondo de pantalla. */
  accion: '#1d4ed8',
  /** Fondo de la indicación de semana en curso. Lleva el texto principal, 15,9:1. */
  fondoSemanaEnCurso: '#e8efff',
  /** Fondo de una celda de ausencia. Distinto del de una acción destructiva. */
  fondoAusencia: '#fff1dc',
  /** Texto y borde de una celda de ausencia. 6,7:1 sobre su fondo. */
  tintaAusencia: '#8a4008',
  /** Fondo de una celda de vacaciones. */
  fondoVacaciones: '#e4f4e8',
  /** Texto y borde de una celda de vacaciones. 6,7:1 sobre su fondo. */
  tintaVacaciones: '#14602f',
  /** Fondo de una acción destructiva. */
  fondoAccionDestructiva: '#fdece7',
  /** Texto de una acción destructiva. 7,2:1 sobre su fondo. */
  textoAccionDestructiva: '#8c2f1a',
  /** Velo sobre el que se abren hojas y confirmaciones, teñido con la tinta. */
  velo: 'rgba(16, 20, 24, 0.45)',
} as const;

/**
 * Tamaños en puntos de cada papel de texto.
 *
 * Son exactamente estos: la identidad visual no altera la densidad ya verificada
 * de la rejilla ni el reparto de anchos de sus columnas.
 */
export const tipografia = {
  /** Horas de la celda: es el dato que hay que leer de pie y con prisa. */
  hora: 12,
  /** Etiquetas `AUS` y `VAC`. */
  etiqueta: 13,
  /** Nombre completo del día en la cabecera. No se abrevia: se ajusta el tamaño. */
  nombreDeDia: 9,
  diaDelMes: 13,
  nombreEmpleado: 13,
  cuerpo: 15,
  titulo: 17,
} as const;

/**
 * Solo tres pesos.
 *
 * Android resuelve `fontWeight` mapeando a familias concretas de Roboto: 400 a
 * `sans-serif`, 500 a `sans-serif-medium` y 700 a `sans-serif-bold`. Los pesos
 * intermedios como 600 no tienen familia propia y caen a bold, aplanando sin
 * avisar la jerarquía prevista.
 */
export const pesos = {
  regular: '400',
  medium: '500',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/**
 * Cifras de ancho fijo. Todo texto que muestre un dato numérico —horas, fechas,
 * día del mes— se compone con ellas, para que los números queden alineados en
 * columna y no bailen al cambiar de valor.
 */
export const CIFRAS_TABULARES: TextStyle['fontVariant'] = ['tabular-nums'];
