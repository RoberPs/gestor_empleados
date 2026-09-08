/**
 * Acciones que ofrece una celda al tocarla. Dependen del estado de la celda y de si
 * hay algo copiado, nunca de la semana a la que pertenece: una celda de una semana
 * pasada ofrece exactamente las mismas acciones que una de la semana en curso.
 *
 * Fuera de la celda se usan siempre las palabras completas "ausencia" y
 * "vacaciones": las abreviaturas `AUS` y `VAC` solo viven dentro de la rejilla.
 */

import type { ContenidoCelda, TurnoPlanificado } from '../dominio/tipos';
import { describirTurno } from '../dominio/turno';

export type AccionCelda =
  | { readonly tipo: 'crear-turno' }
  | { readonly tipo: 'anadir-segundo-turno' }
  | { readonly tipo: 'editar-turno'; readonly turno: TurnoPlanificado }
  | { readonly tipo: 'eliminar-turno'; readonly turno: TurnoPlanificado }
  | { readonly tipo: 'marcar-ausencia' }
  | { readonly tipo: 'marcar-vacaciones' }
  | { readonly tipo: 'ver-ausencia' }
  | { readonly tipo: 'eliminar-contenido' }
  | { readonly tipo: 'copiar' }
  | { readonly tipo: 'pegar' };

/**
 * Acciones disponibles para cada uno de los cuatro estados de la celda.
 *
 * Copiar y pegar van **al final**, después de las que crean, editan y eliminan: son
 * las últimas en llegar y las que menos veces se buscan, y meterlas por en medio
 * obligaría a releer la hoja a quien ya se sabe de memoria dónde está lo suyo.
 */
export function accionesPara(contenido: ContenidoCelda, hayAlgoCopiado = false): AccionCelda[] {
  return [...accionesDelContenido(contenido), ...accionesDeCopia(contenido, hayAlgoCopiado)];
}

/**
 * Copiar solo tiene sentido cuando hay algo que copiar, y pegar cuando hay algo
 * copiado. Fuera de esos dos casos la acción no se ofrece: una acción que aparece
 * apagada se toca igual, y una que no está no se busca dos veces.
 */
function accionesDeCopia(contenido: ContenidoCelda, hayAlgoCopiado: boolean): AccionCelda[] {
  const acciones: AccionCelda[] = [];
  if (contenido.tipo !== 'vacia') acciones.push({ tipo: 'copiar' });
  if (hayAlgoCopiado) acciones.push({ tipo: 'pegar' });
  return acciones;
}

function accionesDelContenido(contenido: ContenidoCelda): AccionCelda[] {
  switch (contenido.tipo) {
    case 'vacia':
      return [{ tipo: 'crear-turno' }, { tipo: 'marcar-ausencia' }, { tipo: 'marcar-vacaciones' }];

    case 'turnos': {
      if (contenido.turnos.length === 1) {
        const [turno] = contenido.turnos;
        return [
          { tipo: 'editar-turno', turno },
          { tipo: 'anadir-segundo-turno' },
          { tipo: 'marcar-ausencia' },
          { tipo: 'marcar-vacaciones' },
          { tipo: 'eliminar-turno', turno },
        ];
      }
      // Dos turnos: se editan y se eliminan por separado, y no se ofrece un tercero.
      const [primero, segundo] = contenido.turnos;
      return [
        { tipo: 'editar-turno', turno: primero },
        { tipo: 'editar-turno', turno: segundo },
        { tipo: 'marcar-ausencia' },
        { tipo: 'marcar-vacaciones' },
        { tipo: 'eliminar-turno', turno: primero },
        { tipo: 'eliminar-turno', turno: segundo },
      ];
    }

    case 'ausencia':
      // Ver la ausencia lleva a la ficha, que es donde vive el motivo. Se ofrece
      // tenga o no tenga motivo escrito ese empleado: la celda no sabe nada de él,
      // y una acción que aparece y desaparece se busca dos veces.
      return [
        { tipo: 'ver-ausencia' },
        { tipo: 'marcar-vacaciones' },
        { tipo: 'crear-turno' },
        { tipo: 'eliminar-contenido' },
      ];

    case 'vacaciones':
      return [{ tipo: 'marcar-ausencia' }, { tipo: 'crear-turno' }, { tipo: 'eliminar-contenido' }];
  }
}

/** Texto que ve el encargado, siempre con las palabras completas. */
export function etiquetaDeAccion(accion: AccionCelda, contenido: ContenidoCelda): string {
  switch (accion.tipo) {
    case 'crear-turno':
      return contenido.tipo === 'vacia'
        ? 'Crear turno planificado'
        : 'Sustituir por un turno planificado';
    case 'anadir-segundo-turno':
      return 'Añadir un segundo turno ese mismo día';
    case 'editar-turno':
      return `Editar el turno de ${describirTurno(accion.turno)}`;
    case 'eliminar-turno':
      return `Eliminar el turno de ${describirTurno(accion.turno)}`;
    case 'marcar-ausencia':
      if (contenido.tipo === 'vacia') return 'Marcar ausencia';
      if (contenido.tipo === 'vacaciones') return 'Cambiar a ausencia';
      return 'Sustituir por ausencia';
    case 'marcar-vacaciones':
      if (contenido.tipo === 'vacia') return 'Marcar vacaciones';
      if (contenido.tipo === 'ausencia') return 'Cambiar a vacaciones';
      return 'Sustituir por vacaciones';
    case 'ver-ausencia':
      return 'Ver la ausencia';
    case 'eliminar-contenido':
      return contenido.tipo === 'ausencia' ? 'Eliminar la ausencia' : 'Eliminar las vacaciones';
    case 'copiar':
      return 'Copiar esta celda';
    case 'pegar':
      // Sobre una celda con contenido se avisa aquí de que sustituye, antes de
      // tocarla: la confirmación llega después, pero el encargado ya sabe a qué va.
      return contenido.tipo === 'vacia' ? 'Pegar aquí lo copiado' : 'Pegar aquí, sustituyendo';
  }
}

/** Identificador estable de la acción, para poder localizarla en los tests. */
export function idDeAccion(accion: AccionCelda): string {
  switch (accion.tipo) {
    case 'editar-turno':
    case 'eliminar-turno':
      return `accion-${accion.tipo}-${accion.turno.id}`;
    default:
      return `accion-${accion.tipo}`;
  }
}
