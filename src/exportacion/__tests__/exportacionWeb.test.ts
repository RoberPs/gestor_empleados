/**
 * La exportación de la demo web.
 *
 * Se importa `compartirElCuadrante.web` por su nombre completo a propósito: la suite
 * corre con la resolución nativa de Metro, así que sin el sufijo se cargaría la versión
 * del móvil y estos tests no comprobarían nada de lo que dicen comprobar.
 *
 * Lo que aquí no se puede tocar es el diálogo de impresión del navegador, que no existe
 * en Node. De eso responden los escenarios de `docs/verificacion-manual.md`, que hay que
 * pasar en Chrome Android y en Safari iOS. Lo que sí se comprueba es todo lo que ocurre
 * **antes** de abrirlo, que es donde están las reglas del documento.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  compartirElCuadrante,
  guardarElCuadrante,
  MENSAJE_GUARDADO,
  MENSAJE_NO_SE_PUDO_COMPARTIR,
  MENSAJE_SIN_PLANTILLA,
} from '../compartirElCuadrante.web';
import { crearAlmacenSobreSqlite } from '../../datos/almacenCuadrante';
import { abrirBaseDeDatos } from '../../datos/sqlite/conexion';
import { migrar } from '../../datos/sqlite/migraciones';
import { semanaEnCurso } from '../../dominio/semana';
import { abrirConNodeSqlite } from '../../pruebas/bdDePrueba';
import { componerDocumentoDelCuadrante } from '../documentoDelCuadrante';
import {
  MENSAJE_GUARDADO as MENSAJE_GUARDADO_DEL_MOVIL,
  MENSAJE_SIN_PLANTILLA as MENSAJE_SIN_PLANTILLA_DEL_MOVIL,
} from '../resultadoDeExportar';

const SEMANA = { lunes: '2026-09-07' };
const NOMBRE_DEL_LOCAL = 'La Esquina café';

function montar() {
  const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');
  migrar(bd);
  return crearAlmacenSobreSqlite(bd);
}

function datosDe(almacen: ReturnType<typeof montar>) {
  return {
    semana: SEMANA,
    empleados: almacen.listarEmpleados(),
    contenido: almacen.leerSemana(SEMANA),
    nombreDelLocal: NOMBRE_DEL_LOCAL,
  };
}

describe('La entrega del documento donde no hay hoja de compartir ni selector de carpetas', () => {
  it('Exportar desde un navegador con la plantilla vacía', async () => {
    const almacen = montar();

    // Ni compartir ni guardar producen documento alguno: no llegan siquiera a tocar el
    // navegador, así que esto se puede comprobar sin diálogo de impresión.
    await expect(compartirElCuadrante(datosDe(almacen))).resolves.toEqual({
      tipo: 'sin-plantilla',
    });
    await expect(guardarElCuadrante(datosDe(almacen))).resolves.toEqual({
      tipo: 'sin-plantilla',
    });
  });

  it('El documento entregado fuera del móvil respeta las mismas reglas', () => {
    // Con todos los campos de la ficha escritos, para que si alguno se colara se viera.
    const almacen = montar();
    const ana = almacen.altaEmpleado('Ana Pérez', '600100200', 'ana@ejemplo.es', 'Sala')!.id;
    almacen.editarNota(ana, 'No puede cerrar los viernes');
    almacen.editarMotivoAusencia(ana, 'Cita médica');
    almacen.crearTurno(ana, '2026-09-07', { horas: 9, minutos: 0 }, { horas: 17, minutos: 0 });

    const documento = componerDocumentoDelCuadrante(datosDe(almacen));
    if (documento.tipo !== 'documento') throw new Error('debería haber compuesto un documento');

    expect(documento.html).toContain('Ana Pérez');
    expect(documento.html).not.toContain('600100200');
    expect(documento.html).not.toContain('ana@ejemplo.es');
    expect(documento.html).not.toContain('No puede cerrar los viernes');
    expect(documento.html).not.toContain('Cita médica');

    // Y es el mismo documento que se compartiría desde el móvil: la web no compone otro,
    // usa esta misma función y solo cambia por dónde lo entrega.
    expect(documento.nombreDeFichero).toBe('Cuadrante 07-09-2026 a 13-09-2026');
  });

  it('El cuadrante no viaja a ningún servicio para exportarlo', () => {
    // El documento se produce en el propio dispositivo. Se comprueba como lo hace
    // `privacidad.test.ts` con la capa de datos: mirando de qué es capaz el código, que
    // es lo único que no depende de qué pasara durante una sesión concreta.
    const codigo = readFileSync(join(__dirname, '..', 'compartirElCuadrante.web.ts'), 'utf8');

    for (const formaDeSalir of [
      /\bfetch\s*\(/,
      /XMLHttpRequest/,
      /WebSocket/,
      /navigator\.sendBeacon/,
      /\bhttps?:\/\/(?!\S*ExponentPrint)/,
      /FormData/,
    ]) {
      expect({ formaDeSalir: String(formaDeSalir), encontrado: codigo.match(formaDeSalir)?.[0] ?? null })
        .toEqual({ formaDeSalir: String(formaDeSalir), encontrado: null });
    }
  });

  it('los textos de la demo son literalmente los mismos que los del móvil', () => {
    // Si alguien duplicara los mensajes en vez de compartirlos, el aviso de la demo y el
    // del móvil podrían separarse sin que nadie se enterase.
    expect(MENSAJE_SIN_PLANTILLA).toBe(MENSAJE_SIN_PLANTILLA_DEL_MOVIL);
    expect(MENSAJE_GUARDADO).toBe(MENSAJE_GUARDADO_DEL_MOVIL);
    expect(MENSAJE_NO_SE_PUDO_COMPARTIR).toMatch(/no se ha podido compartir/i);
  });
});
