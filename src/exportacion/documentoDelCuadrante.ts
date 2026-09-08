/**
 * Composición del documento con el que el cuadrante de una semana sale del móvil.
 *
 * Es código puro: recibe la semana, la plantilla y el contenido de las celdas, y
 * devuelve la cadena de HTML que el motor de impresión convierte en PDF. **No
 * importa `expo-print` ni `expo-sharing`**, y no habla con ningún almacén. Aquí
 * vive todo lo que la spec exige del documento —qué filas, qué columnas, qué dice
 * cada celda, cómo se identifica y, sobre todo, qué no puede aparecer—, de modo que
 * se comprueba entero en la suite, sin dispositivo.
 *
 * ── LA REGLA QUE NO SE PUEDE RELAJAR ────────────────────────────────────────
 * De cada empleado sale **únicamente su nombre**. Ni teléfono, ni email, ni nota,
 * ni motivo de la ausencia, ni ningún otro campo de su ficha. El documento acaba en
 * manos que no son las del encargado —un grupo de mensajería, un tablón, una
 * impresora ajena—, así que esto no es una decisión de maquetación: es la razón por
 * la que este módulo está separado del que produce el PDF y por la que su test de
 * privacidad mira el texto completo del HTML, no los campos que uno se acuerde de
 * comprobar.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * El papel no es la pantalla: la hoja va apaisada, en blanco y negro y con los
 * nombres enteros, mientras que la rejilla vive en 360 puntos verticales, con
 * fondos de color y con los nombres truncados. Comparten los datos y el orden de
 * las filas —`orden.ts`— y los formatos —`formatos.ts`—, no la maquetación.
 */

import type { ContenidoDeLaSemana } from '../datos/almacenCuadrante';
import {
  formatearFecha,
  formatearHora,
  formatearRangoDeSemana,
  nombreDeDia,
} from '../dominio/formatos';
import { ordenarEmpleadosPorNombre } from '../dominio/orden';
import { diasDeLaSemana, domingoDe, type FechaISO, type Semana } from '../dominio/semana';
import {
  CELDA_VACIA,
  PALABRA_AUSENCIA,
  PALABRA_VACACIONES,
  type ContenidoCelda,
  type Empleado,
} from '../dominio/tipos';

export interface DatosDelDocumento {
  readonly semana: Semana;
  readonly empleados: readonly Empleado[];
  readonly contenido: ContenidoDeLaSemana;
  /** El nombre del local, que identifica de quién es el cuadrante. */
  readonly nombreDelLocal: string;
}

/** El documento compuesto, listo para el motor de impresión. */
export interface DocumentoDelCuadrante {
  readonly tipo: 'documento';
  readonly html: string;
  /**
   * Nombre del fichero, sin extensión y con el rango de la semana dentro: tres
   * semanas compartidas al mismo grupo tienen que distinguirse en la lista.
   */
  readonly nombreDeFichero: string;
}

/**
 * Resultado de intentar componer el documento. Con la plantilla vacía no se compone
 * ninguno: un PDF con la cabecera y ninguna fila no le sirve a nadie.
 */
export type ResultadoDeComposicion = DocumentoDelCuadrante | { readonly tipo: 'sin-plantilla' };

/** Texto de la celda de un día, según su estado. La vacía no dice nada. */
export function textoDeLaCelda(contenido: ContenidoCelda): string {
  switch (contenido.tipo) {
    case 'vacia':
      return '';
    case 'ausencia':
      // La palabra completa, no la etiqueta `AUS` de la rejilla: en la hoja
      // apaisada sobra sitio y quien recibe el documento no conoce la leyenda.
      return PALABRA_AUSENCIA;
    case 'vacaciones':
      return PALABRA_VACACIONES;
    case 'turnos':
      // Los dos turnos del día, cada uno en su línea y con sus dos horas enteras.
      // No se ordenan aquí: llegan ya en orden de hora de inicio desde el almacén.
      return contenido.turnos
        .map((turno) => `${formatearHora(turno.inicio)} - ${formatearHora(turno.fin)}`)
        .join('\n');
  }
}

/**
 * Escapa el texto que entra en el HTML.
 *
 * Los nombres los escribe el encargado, y un `&` o un `<` en un nombre no puede
 * romper el documento ni colarse como marcado.
 */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Las líneas de una celda, ya escapadas y separadas con saltos de línea del HTML.
 *
 * La celda de una ausencia o de unas vacaciones se marca con su clase, para que los
 * estilos puedan ponerle su fondo **detrás de la palabra** que ya lleva. Una celda
 * con turnos no la necesita: sus horas se distinguen solas.
 */
function celdaHtml(contenido: ContenidoCelda): string {
  const texto = textoDeLaCelda(contenido);
  if (texto === '') return '<td class="dia"></td>';

  const estado = contenido.tipo === 'ausencia' || contenido.tipo === 'vacaciones' ? ` ${contenido.tipo}` : '';
  const lineas = texto.split('\n').map(escapar).join('<br />');
  return `<td class="dia${estado}">${lineas}</td>`;
}

function cabeceraDeDia(dia: FechaISO): string {
  return `<th class="dia"><span class="nombre-de-dia">${escapar(
    nombreDeDia(dia),
  )}</span><span class="fecha">${formatearFecha(dia)}</span></th>`;
}

function filaDeEmpleado(
  empleado: Empleado,
  dias: readonly FechaISO[],
  contenido: ContenidoDeLaSemana,
): string {
  const suSemana = contenido.get(empleado.id);
  // Solo el nombre. Ningún otro campo de la ficha entra en el documento.
  const celdas = dias.map((dia) => celdaHtml(suSemana?.get(dia) ?? CELDA_VACIA)).join('');
  return `<tr><th class="nombre" scope="row">${escapar(empleado.nombre)}</th>${celdas}</tr>`;
}

/**
 * Tintas y fondos del documento.
 *
 * No son los de la pantalla: `identidad-visual` rige el móvil, y esto es papel. La
 * regla que sí se hereda entera es que **nada se distingue solo por el color**. Por
 * eso todos los fondos son claros y llevan texto oscuro encima —la cabecera de días
 * es la única al revés—, de forma que al imprimir en blanco y negro se convierten en
 * grises distintos y la hoja se sigue leyendo igual.
 */
export const PAPEL = {
  /** Tinta principal y línea de la tabla. */
  tinta: '#101418',
  /** Cabecera de días: lo primero que hay que localizar al abrir la hoja. */
  fondoCabecera: '#2b3138',
  tintaCabecera: '#ffffff',
  /** Columna de empleados: separa el quién del cuándo. */
  fondoColumnaDeNombres: '#eef0f2',
  /**
   * Filas alternas. Es lo que resuelve el problema real de las 20 filas —seguir la
   * semana de un empleado sin saltar a la de al lado— y lo único del documento que
   * no tiene equivalente en la pantalla, donde la rejilla es corta y se toca con el
   * dedo.
   */
  fondoFilaPar: '#ffffff',
  fondoFilaImpar: '#f5f6f8',
  /** Ausencia y vacaciones: detrás de la palabra, nunca en su lugar. */
  fondoAusencia: '#fff1dc',
  tintaAusencia: '#8a4008',
  fondoVacaciones: '#e4f4e8',
  tintaVacaciones: '#14602f',
} as const;

/**
 * Estilos del documento, dentro del propio HTML: `expo-print` recibe una cadena
 * suelta y no puede cargar nada externo.
 */
const ESTILOS = `
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
      color: ${PAPEL.tinta};
      background: #fff;
    }
    header { margin-bottom: 6mm; }
    h1 { font-size: 16pt; font-weight: 700; margin: 0 0 1mm; }
    .rango { font-size: 12pt; font-weight: 500; margin: 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border: 1px solid ${PAPEL.tinta};
      padding: 1.5mm 1mm;
      font-size: 9pt;
      font-weight: 400;
      vertical-align: middle;
    }
    /* La cabecera de días, en oscuro: es la referencia de a qué día pertenece cada
       columna, y con 20 filas por debajo tiene que pesar más que ellas. */
    thead th {
      font-weight: 700;
      background: ${PAPEL.fondoCabecera};
      color: ${PAPEL.tintaCabecera};
    }
    th.dia { width: 11.5%; text-align: center; }
    .nombre-de-dia { display: block; }
    .fecha { display: block; font-size: 7.5pt; font-weight: 400; }
    /* La columna de nombres se queda con lo que sobra: en la hoja apaisada hay
       sitio de sobra para que el nombre vaya entero. */
    th.nombre {
      width: 19.5%;
      text-align: left;
      font-weight: 500;
      /* Sin recortes: el nombre parte de línea antes que perder una letra. */
      overflow-wrap: break-word;
    }
    /* Las filas alternan fondo para poder seguirse de lunes a domingo. El fondo va
       en la fila y no en cada celda: así la celda que tenga algo que decir —una
       ausencia, unas vacaciones— pone el suyo encima sin pelear por especificidad,
       y la que no, deja ver el de su fila. */
    tbody tr:nth-child(odd) { background: ${PAPEL.fondoFilaPar}; }
    tbody tr:nth-child(even) { background: ${PAPEL.fondoFilaImpar}; }
    /* La celda del nombre lleva el suyo propio, más marcado, en las dos. */
    tbody th.nombre {
      background: ${PAPEL.fondoColumnaDeNombres};
      color: ${PAPEL.tinta};
    }
    td.dia { text-align: center; white-space: normal; }
    /* El fondo del estado va detrás de su palabra, no en su lugar: quien no perciba
       el color lee «Ausencia» y «Vacaciones» igual de claro. */
    td.ausencia {
      background: ${PAPEL.fondoAusencia};
      color: ${PAPEL.tintaAusencia};
      font-weight: 500;
    }
    td.vacaciones {
      background: ${PAPEL.fondoVacaciones};
      color: ${PAPEL.tintaVacaciones};
      font-weight: 500;
    }
    /* Si la tabla se parte entre páginas, la cabecera de días acompaña. */
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
`;

/**
 * Compone el documento de una semana.
 *
 * Devuelve `sin-plantilla` —y no compone HTML alguno— cuando no hay ningún empleado
 * dado de alta.
 */
export function componerDocumentoDelCuadrante({
  semana,
  empleados,
  contenido,
  nombreDelLocal,
}: DatosDelDocumento): ResultadoDeComposicion {
  if (empleados.length === 0) return { tipo: 'sin-plantilla' };

  const dias = diasDeLaSemana(semana);
  // El mismo orden alfabético español que la rejilla, y por la misma vía: un
  // empleado ocupa la misma posición en la pantalla y en el papel.
  const enOrden = ordenarEmpleadosPorNombre(empleados);
  const rango = formatearRangoDeSemana(semana);

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapar(nombreDelLocal)} · ${rango}</title>
    <style>${ESTILOS}</style>
  </head>
  <body>
    <header>
      <h1>${escapar(nombreDelLocal)}</h1>
      <p class="rango">${rango}</p>
    </header>
    <table>
      <thead>
        <tr>
          <th class="nombre" scope="col">Empleado</th>
          ${dias.map(cabeceraDeDia).join('\n          ')}
        </tr>
      </thead>
      <tbody>
        ${enOrden.map((empleado) => filaDeEmpleado(empleado, dias, contenido)).join('\n        ')}
      </tbody>
    </table>
  </body>
</html>
`;

  return { tipo: 'documento', html, nombreDeFichero: nombreDeFicheroDe(semana) };
}

/**
 * `Cuadrante 14-09-2026 a 20-09-2026`.
 *
 * Con guiones y no con barras porque es un nombre de fichero: las barras no se
 * admiten. El orden es el mismo que el del rango que se lee en la cabecera.
 */
export function nombreDeFicheroDe(semana: Semana): string {
  const enGuiones = (fecha: FechaISO) => formatearFecha(fecha).replace(/\//g, '-');
  return `Cuadrante ${enGuiones(semana.lunes)} a ${enGuiones(domingoDe(semana))}`;
}
