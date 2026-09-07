/**
 * Colores y tamaños de la pantalla del cuadrante.
 *
 * Los estados de la celda no se distinguen solo por el color: cada uno lleva
 * además su propio texto (las horas, `AUS`, `VAC`) y su propio borde, de modo que
 * siguen siendo distinguibles sin percibir el color.
 */

export const colores = {
  fondo: '#ffffff',
  fondoCabecera: '#f2f2f7',
  texto: '#11181c',
  textoSecundario: '#5b6570',
  borde: '#c7ccd1',
  bordeFuerte: '#11181c',
  fondoSemanaEnCurso: '#e3f0ff',
  fondoAusencia: '#fdece7',
  fondoVacaciones: '#e9f5ea',
  fondoAccionDestructiva: '#fdece7',
  textoAccionDestructiva: '#8c2f1a',
  velo: 'rgba(0, 0, 0, 0.4)',
} as const;

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
