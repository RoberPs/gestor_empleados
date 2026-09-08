/**
 * Lo que el documento exportado contiene y —sobre todo— lo que no.
 *
 * Se prueba contra el HTML completo que produce la composición, que es lo único que
 * llega al motor de impresión: si una cadena no está aquí, no puede estar en el PDF.
 */

import { crearAlmacenEnMemoria } from '../../datos/almacenCuadrante';
import { formatearRangoDeSemana } from '../../dominio/formatos';
import { ordenarEmpleadosPorNombre } from '../../dominio/orden';
import { semanaQueContiene, type Semana } from '../../dominio/semana';
import {
  ETIQUETA_AUSENCIA,
  ETIQUETA_VACACIONES,
  PALABRA_AUSENCIA,
  PALABRA_VACACIONES,
} from '../../dominio/tipos';
import {
  componerDocumentoDelCuadrante,
  nombreDeFicheroDe,
  PAPEL,
  type DocumentoDelCuadrante,
} from '../documentoDelCuadrante';

const LUNES = '2026-09-14';
const MARTES = '2026-09-15';
const MIERCOLES = '2026-09-16';
const DOMINGO = '2026-09-20';
const SEMANA: Semana = semanaQueContiene(LUNES);
const RANGO = '14/09/2026 - 20/09/2026';

const NOMBRE_DEL_LOCAL = 'La Esquina café';

const hora = (horas: number, minutos = 0) => ({ horas, minutos });

/**
 * Compone el documento de una semana sobre un almacén en memoria, que es la misma
 * vía por la que la pantalla lee la plantilla y las celdas.
 */
function componer(
  plantilla: readonly string[],
  preparar: (datos: ReturnType<typeof crearAlmacenEnMemoria>) => void = () => {},
  semana: Semana = SEMANA,
) {
  const datos = crearAlmacenEnMemoria(plantilla);
  preparar(datos);
  return componerDocumentoDelCuadrante({
    semana,
    empleados: datos.listarEmpleados(),
    contenido: datos.leerSemana(semana),
    nombreDelLocal: NOMBRE_DEL_LOCAL,
  });
}

/** El documento, exigiendo que se haya compuesto. */
function documento(...argumentos: Parameters<typeof componer>): DocumentoDelCuadrante {
  const resultado = componer(...argumentos);
  if (resultado.tipo !== 'documento') throw new Error('No se compuso ningún documento');
  return resultado;
}

const idDe = (datos: ReturnType<typeof crearAlmacenEnMemoria>, nombre: string) => {
  const empleado = datos.listarEmpleados().find((e) => e.nombre === nombre);
  if (!empleado) throw new Error(`No hay ningún empleado llamado ${nombre}`);
  return empleado.id;
};

/** Las filas de empleado del HTML, en el orden en el que aparecen. */
function nombresDeLasFilas(html: string): string[] {
  return [...html.matchAll(/<th class="nombre" scope="row">([^<]*)<\/th>/g)].map(
    (encontrado) => encontrado[1],
  );
}

/** Las celdas de día de la fila de ese empleado, de lunes a domingo. */
function celdasDeLaFila(html: string, nombre: string): string[] {
  const fila = html
    .split('<tr>')
    .find((trozo) => trozo.includes(`<th class="nombre" scope="row">${nombre}</th>`));
  if (!fila) throw new Error(`No hay ninguna fila de ${nombre}`);
  return [...fila.matchAll(/<td class="dia[^"]*">([\s\S]*?)<\/td>/g)].map(
    (encontrado) => encontrado[1],
  );
}

/** Los valores de una propiedad CSS en la hoja de estilos del documento. */
function estilosDe(html: string, propiedad: string): string[] {
  return [...html.matchAll(new RegExp(`${propiedad}:\\s*([^;]+);`, 'g'))].map((e) =>
    e[1].trim(),
  );
}

describe('El cuadrante de una semana se exporta como documento', () => {
  it('Exportar la semana que se está viendo: el documento es el de esa semana', () => {
    const { html } = documento(['Ana']);

    expect(html).toContain(RANGO);
    // Los siete días de esa semana, no los de la anterior ni los de la siguiente.
    expect(html).toContain('14/09/2026');
    expect(html).toContain('20/09/2026');
    expect(html).not.toContain('07/09/2026');
    expect(html).not.toContain('21/09/2026');
  });

  it('Exportar no cambia nada de lo guardado', () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno', 'Carmen']);
    datos.crearTurno(idDe(datos, 'Ana'), LUNES, hora(9), hora(17));
    datos.marcarAusencia(idDe(datos, 'Bruno'), MARTES);
    datos.marcarVacaciones(idDe(datos, 'Carmen'), MIERCOLES);

    const antes = JSON.stringify({
      plantilla: datos.listarEmpleados(),
      semana: [...datos.leerSemana(SEMANA)].map(([id, dias]) => [id, [...dias]]),
    });

    componerDocumentoDelCuadrante({
      semana: SEMANA,
      empleados: datos.listarEmpleados(),
      contenido: datos.leerSemana(SEMANA),
      nombreDelLocal: NOMBRE_DEL_LOCAL,
    });

    const despues = JSON.stringify({
      plantilla: datos.listarEmpleados(),
      semana: [...datos.leerSemana(SEMANA)].map(([id, dias]) => [id, [...dias]]),
    });
    expect(despues).toEqual(antes);
  });
});

describe('Contenido del documento exportado', () => {
  it('El documento recoge la semana completa', () => {
    const { html } = documento(['Ana', 'Bruno', 'Carmen'], (datos) => {
      datos.crearTurno(idDe(datos, 'Ana'), LUNES, hora(9), hora(17));
      datos.marcarAusencia(idDe(datos, 'Bruno'), MARTES);
      for (const dia of [LUNES, MARTES, MIERCOLES, '2026-09-17', '2026-09-18', '2026-09-19', DOMINGO]) {
        datos.marcarVacaciones(idDe(datos, 'Carmen'), dia);
      }
    });

    // Una fila por empleado, en el orden Ana, Bruno, Carmen.
    expect(nombresDeLasFilas(html)).toEqual(['Ana', 'Bruno', 'Carmen']);

    // Siete columnas, de lunes a domingo en ese orden.
    expect(celdasDeLaFila(html, 'Ana')).toHaveLength(7);
    const cabeceras = [...html.matchAll(/<span class="nombre-de-dia">([^<]*)<\/span>/g)].map(
      (encontrado) => encontrado[1],
    );
    expect(cabeceras).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ]);

    // La celda de Ana del lunes muestra `09:00` y `17:00`.
    const [lunesDeAna] = celdasDeLaFila(html, 'Ana');
    expect(lunesDeAna).toContain('09:00');
    expect(lunesDeAna).toContain('17:00');

    // La celda de Bruno del martes indica que es una ausencia.
    expect(celdasDeLaFila(html, 'Bruno')[1]).toContain(PALABRA_AUSENCIA);

    // Las siete celdas de Carmen indican que son vacaciones.
    for (const celda of celdasDeLaFila(html, 'Carmen')) {
      expect(celda).toContain(PALABRA_VACACIONES);
    }
  });

  it('Un día con dos turnos planificados', () => {
    const { html } = documento(['Ana', 'Bruno'], (datos) => {
      datos.crearTurno(idDe(datos, 'Bruno'), MIERCOLES, hora(9), hora(13));
      datos.crearTurno(idDe(datos, 'Bruno'), MIERCOLES, hora(20), hora(23));
    });

    const miercolesDeBruno = celdasDeLaFila(html, 'Bruno')[2];
    for (const hora of ['09:00', '13:00', '20:00', '23:00']) {
      expect(miercolesDeBruno).toContain(hora);
    }
  });

  it('El documento dice de qué local y de qué semana es', () => {
    const { html } = documento(['Ana']);

    expect(html).toContain(NOMBRE_DEL_LOCAL);
    expect(html).toContain(formatearRangoDeSemana(SEMANA));
    expect(html).toContain(RANGO);
  });

  it('Exportar con la plantilla vacía', () => {
    const resultado = componer([]);

    // Ni documento, ni HTML: no hay nada que componer.
    expect(resultado).toEqual({ tipo: 'sin-plantilla' });
    expect(resultado).not.toHaveProperty('html');
  });

  it('las filas van en el mismo orden alfabético español que el cuadrante', () => {
    const plantilla = ['Óscar', 'Núria', 'Ana', 'Ángel', 'Zoe', 'Íñigo', 'ana maría'];
    const datos = crearAlmacenEnMemoria(plantilla);
    const { html } = documento(plantilla);

    // El mismo orden que `listarEmpleados`, no uno propio: la fila de un empleado
    // ocupa la misma posición en la pantalla y en el papel.
    expect(nombresDeLasFilas(html)).toEqual(
      ordenarEmpleadosPorNombre(datos.listarEmpleados()).map((empleado) => empleado.nombre),
    );
  });

  it('la celda sin nada planificado no dice nada', () => {
    const { html } = documento(['Ana']);

    expect(celdasDeLaFila(html, 'Ana')).toEqual(['', '', '', '', '', '', '']);
  });

  it('el fichero lleva el rango de la semana en el nombre', () => {
    expect(nombreDeFicheroDe(SEMANA)).toBe('Cuadrante 14-09-2026 a 20-09-2026');
    expect(documento(['Ana']).nombreDeFichero).toBe('Cuadrante 14-09-2026 a 20-09-2026');
  });
});

describe('El documento exportado no contiene datos de contacto', () => {
  const TELEFONO = '600112233';
  const EMAIL = 'quien.sea@ejemplo.es';
  const NOTA = 'Solo puede trabajar por las tardes';
  const MOTIVO = 'Baja médica';

  /** Todos los empleados con la ficha entera rellena. */
  function conLasFichasLlenas(plantilla: readonly string[]) {
    return documento(plantilla, (datos) => {
      for (const empleado of datos.listarEmpleados()) {
        datos.editarTelefono(empleado.id, `${TELEFONO}${empleado.id}`);
        datos.editarEmail(empleado.id, `${empleado.id}${EMAIL}`);
        datos.editarNota(empleado.id, `${NOTA} ${empleado.id}`);
        datos.editarMotivoAusencia(empleado.id, `${MOTIVO} ${empleado.id}`);
        datos.editarPuesto(empleado.id, `Camarero ${empleado.id}`);
      }
      datos.marcarAusencia(idDe(datos, 'Bruno'), MARTES);
    });
  }

  it('Las fichas rellenas no ensucian el documento', () => {
    const { html } = conLasFichasLlenas(['Ana', 'Bruno', 'Carmen']);

    // De cada uno, solo su nombre.
    expect(nombresDeLasFilas(html)).toEqual(['Ana', 'Bruno', 'Carmen']);

    // Ninguna de esas cadenas está en el HTML completo, ni entera ni por partes.
    for (const dato of [TELEFONO, EMAIL, NOTA, MOTIVO, 'Camarero', 'ejemplo.es']) {
      expect(html).not.toContain(dato);
    }
  });

  it('Una ausencia no arrastra su motivo al documento', () => {
    const { html } = documento(['Ana', 'Bruno'], (datos) => {
      datos.marcarAusencia(idDe(datos, 'Bruno'), MARTES);
      datos.editarMotivoAusencia(idDe(datos, 'Bruno'), 'Baja médica');
    });

    expect(celdasDeLaFila(html, 'Bruno')[1]).toContain(PALABRA_AUSENCIA);
    expect(html).not.toContain('Baja médica');
  });
});

describe('El documento es legible con la plantilla completa', () => {
  it('las 20 filas y las siete columnas entran en el documento', () => {
    const plantilla = Array.from({ length: 20 }, (_, i) => `Empleado ${String(i + 1).padStart(2, '0')}`);
    const { html } = documento(plantilla, (datos) => {
      for (const empleado of datos.listarEmpleados()) {
        datos.crearTurno(empleado.id, LUNES, hora(9), hora(17));
        datos.crearTurno(empleado.id, DOMINGO, hora(20), hora(23, 30));
      }
    });

    expect(nombresDeLasFilas(html)).toHaveLength(20);
    for (const nombre of plantilla) {
      expect(celdasDeLaFila(html, nombre)).toHaveLength(7);
      expect(celdasDeLaFila(html, nombre)[6]).toContain('23:30');
    }
  });

  it('Un nombre largo se lee entero en el documento', () => {
    const largo = 'Maricarmen de la Fuente Etxebarria';
    const { html } = documento([largo, 'Ana']);

    // Entero y sin ninguna marca de recorte: el papel tiene sitio de sobra.
    expect(nombresDeLasFilas(html)).toContain(largo);
    expect(html).not.toContain('…');
    expect(html).not.toContain('...');
    expect(html).not.toContain('text-overflow');
  });

  it('el documento usa las palabras completas y no las abreviaturas de la rejilla', () => {
    const { html } = documento(['Ana', 'Bruno'], (datos) => {
      datos.marcarAusencia(idDe(datos, 'Ana'), LUNES);
      datos.marcarVacaciones(idDe(datos, 'Bruno'), MARTES);
    });

    expect(html).toContain(PALABRA_AUSENCIA);
    expect(html).toContain(PALABRA_VACACIONES);
    expect(html).not.toContain(ETIQUETA_AUSENCIA);
    expect(html).not.toContain(ETIQUETA_VACACIONES);
  });

  it('las horas van en 24h y las fechas en dd/mm/aaaa, igual que en la pantalla', () => {
    const { html } = documento(['Ana'], (datos) => {
      datos.crearTurno(idDe(datos, 'Ana'), LUNES, hora(20), hora(23, 30));
    });

    expect(celdasDeLaFila(html, 'Ana')[0]).toContain('20:00 - 23:30');
    // Ni AM ni PM, ni fechas en otro orden.
    expect(html).not.toMatch(/\b(AM|PM|a\.\s?m\.|p\.\s?m\.)\b/i);
    expect(html).toContain('14/09/2026');
  });

  it('la hoja va apaisada', () => {
    expect(documento(['Ana']).html).toContain('size: A4 landscape');
  });

  it('el documento no se lleva al papel el azul de las acciones de la pantalla', () => {
    // El papel no tiene acciones que tocar: `identidad-visual` rige la pantalla.
    expect(documento(['Ana']).html).not.toContain('#1d4ed8');
  });

  it('un nombre con caracteres de marcado no rompe el documento', () => {
    const { html } = documento(['Ana & Cía. <Sala>']);

    expect(html).toContain('Ana &amp; Cía. &lt;Sala&gt;');
    expect(html).not.toContain('<Sala>');
  });
});

describe('El documento distingue sus partes de un vistazo', () => {
  it('La cabecera y la columna de empleados se distinguen del contenido', () => {
    const { html } = documento(['Ana', 'Bruno', 'Carmen']);

    // La cabecera de días pesa más que las 20 filas que puede tener debajo: fondo
    // oscuro y texto claro, al revés que todo lo demás del documento.
    expect(html).toMatch(/thead th\s*\{[^}]*background:\s*#2b3138/);
    expect(html).toMatch(/thead th\s*\{[^}]*color:\s*#ffffff/);

    // La columna de empleados tiene fondo propio y separa el quién del cuándo.
    expect(html).toMatch(/tbody th\.nombre\s*\{[^}]*background:\s*#eef0f2/);

    // Y los nombres siguen enteros, que es lo que no se puede perder por adornar.
    expect(nombresDeLasFilas(html)).toEqual(['Ana', 'Bruno', 'Carmen']);
    const cabeceras = [...html.matchAll(/<span class="nombre-de-dia">([^<]*)<\/span>/g)];
    expect(cabeceras).toHaveLength(7);
  });

  it('Las filas se siguen sin perder la línea', () => {
    const plantilla = Array.from({ length: 20 }, (_, i) => `Empleado ${String(i + 1).padStart(2, '0')}`);
    const { html } = documento(plantilla, (datos) => {
      for (const empleado of datos.listarEmpleados()) {
        datos.crearTurno(empleado.id, LUNES, hora(9), hora(17));
        datos.crearTurno(empleado.id, DOMINGO, hora(20), hora(23, 30));
      }
    });

    // Las filas alternan fondo: es lo que permite recorrer la semana de un empleado
    // de lunes a domingo sin saltar a la fila de al lado.
    expect(html).toMatch(/tbody tr:nth-child\(odd\)\s*\{[^}]*background:\s*#ffffff/);
    expect(html).toMatch(/tbody tr:nth-child\(even\)\s*\{[^}]*background:\s*#f5f6f8/);

    // Y el fondo va en la fila, no en cada celda: si fuese en la celda, la banda
    // alterna le ganaría por especificidad al fondo de una ausencia.
    expect(html).not.toMatch(/tbody tr:nth-child\((odd|even)\) td\s*\{/);

    // Con las 20 filas puestas, cada una sigue teniendo sus siete días.
    expect(nombresDeLasFilas(html)).toHaveLength(20);
    for (const nombre of plantilla) {
      expect(celdasDeLaFila(html, nombre)).toHaveLength(7);
    }
  });

  it('el color de un estado va detrás de su palabra, nunca en su lugar', () => {
    const { html } = documento(['Ana', 'Bruno'], (datos) => {
      datos.marcarAusencia(idDe(datos, 'Ana'), LUNES);
      datos.marcarVacaciones(idDe(datos, 'Bruno'), MARTES);
    });

    // La celda lleva su clase, y su clase lleva su fondo.
    expect(html).toContain('<td class="dia ausencia">');
    expect(html).toContain('<td class="dia vacaciones">');
    expect(html).toMatch(/td\.ausencia\s*\{[^}]*background:\s*#fff1dc/);
    expect(html).toMatch(/td\.vacaciones\s*\{[^}]*background:\s*#e4f4e8/);

    // Pero la palabra sigue estando: quitar el color no quita la información.
    expect(celdasDeLaFila(html, 'Ana')[0]).toContain(PALABRA_AUSENCIA);
    expect(celdasDeLaFila(html, 'Bruno')[1]).toContain(PALABRA_VACACIONES);

    // Y una celda con turnos no necesita clase de estado: sus horas hablan solas.
    expect(html).toContain('<td class="dia">');
  });

  it('El documento impreso en blanco y negro sigue distinguiendo sus partes', () => {
    const { html } = documento(['Ana', 'Bruno'], (datos) => {
      datos.marcarAusencia(idDe(datos, 'Ana'), LUNES);
      datos.marcarVacaciones(idDe(datos, 'Bruno'), MARTES);
      datos.crearTurno(idDe(datos, 'Bruno'), MIERCOLES, hora(9), hora(17));
    });

    /** Claridad aproximada de un color, de 0 (negro) a 1 (blanco). */
    const claridad = (hex: string) => {
      const canal = (desde: number) => parseInt(hex.slice(desde, desde + 2), 16) / 255;
      return 0.299 * canal(1) + 0.587 * canal(3) + 0.114 * canal(5);
    };
    const separacion = (uno: string, otro: string) => Math.abs(claridad(uno) - claridad(otro));

    // Todos los fondos del documento son claros salvo el de la cabecera de días, que
    // es el único que va al revés: así ninguno se traga el texto oscuro que lleva
    // encima al imprimirse en gris.
    const fondos = estilosDe(html, 'background').filter((color) => color.startsWith('#'));
    expect(fondos.length).toBeGreaterThan(0);
    expect(fondos.filter((color) => claridad(color) < 0.5)).toEqual([PAPEL.fondoCabecera]);

    // Las tres partes que estructuran la hoja —las dos bandas de fila y la columna
    // de empleados— se separan de sobra entre sí: son las que hay que distinguir
    // para no perder la línea ni confundir el quién con el cuándo.
    const estructura = [PAPEL.fondoFilaPar, PAPEL.fondoFilaImpar, PAPEL.fondoColumnaDeNombres];
    for (const uno of estructura) {
      for (const otro of estructura) {
        if (uno === otro) continue;
        expect(separacion(uno, otro)).toBeGreaterThan(0.02);
      }
    }

    // Y el fondo de un estado se despega de la banda sobre la que cae, sea cual sea
    // la de su fila. Es un refuerzo, no la señal: la señal es la palabra.
    for (const estado of [PAPEL.fondoAusencia, PAPEL.fondoVacaciones]) {
      for (const banda of [PAPEL.fondoFilaPar, PAPEL.fondoFilaImpar]) {
        expect(separacion(estado, banda)).toBeGreaterThan(0.01);
      }
    }

    // Y lo que informa sigue siendo el texto: sin él, el color no diría nada.
    expect(celdasDeLaFila(html, 'Ana')[0]).toContain(PALABRA_AUSENCIA);
    expect(celdasDeLaFila(html, 'Bruno')[1]).toContain(PALABRA_VACACIONES);
    expect(celdasDeLaFila(html, 'Bruno')[2]).toContain('09:00');
  });
});
