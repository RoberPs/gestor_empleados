/**
 * Acceso de la pantalla a la capa de datos.
 *
 * Es la única vía por la que la pantalla lee y escribe: no guarda copia propia de
 * la plantilla ni del contenido de las celdas, así que cuando el change de
 * persistencia sustituya el almacén, aquí no cambia nada.
 */

import { useEffect, useReducer } from 'react';

import { almacen, type AlmacenCuadrante } from '../datos/almacenCuadrante';

export function usarAlmacen(): AlmacenCuadrante {
  const datos = almacen();
  const [, repintar] = useReducer((n: number) => n + 1, 0);

  useEffect(() => datos.suscribirse(repintar), [datos]);

  return datos;
}
