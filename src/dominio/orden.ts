/**
 * Orden de las filas del cuadrante: alfabético ascendente por nombre, según el
 * orden alfabético del español. No hay ninguna agrupación adicional —ni secciones,
 * ni separadores, ni orden manual—, de forma que un empleado ocupa siempre la misma
 * posición relativa al navegar entre semanas.
 */

import type { Empleado } from './tipos';

const colacionEspanola = new Intl.Collator('es-ES', { sensitivity: 'base' });

export function compararNombres(uno: string, otro: string): number {
  return colacionEspanola.compare(uno, otro);
}

export function ordenarEmpleadosPorNombre<T extends Empleado>(empleados: readonly T[]): T[] {
  return [...empleados].sort((uno, otro) => compararNombres(uno.nombre, otro.nombre));
}
