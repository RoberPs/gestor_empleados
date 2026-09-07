/**
 * Lo que pasa con los datos al arrancar la app, antes de la primera lectura.
 *
 * Abre el fichero, lo lleva a la última versión del esquema y deja instalado el
 * almacén que consumirán las pantallas. Todo automático: el encargado no confirma
 * nada, no elige dónde se guardan sus datos y no ve ninguna pantalla de preparación.
 *
 * Cuando algo de eso falla —fichero dañado, ilegible, o creado por una versión
 * posterior de la app— **no se borra, no se sobrescribe y no se recrea nada**: los
 * datos que haya se quedan intactos para un intento posterior, y quien llama muestra
 * el aviso en lugar del cuadrante.
 */

import {
  crearAlmacenNoDisponible,
  crearAlmacenSobreSqlite,
  instalarAlmacen,
} from './almacenCuadrante';
import type { AbrirFichero } from './sqlite/bd';
import { abrirBaseDeDatos } from './sqlite/conexion';
import { migrar } from './sqlite/migraciones';

/**
 * Abre y migra el almacenamiento, e instala el almacén que corresponda.
 *
 * Devuelve si quedó disponible. `abrirFichero` llega de fuera —`expo-sqlite` en la
 * app, `node:sqlite` en los tests— porque `expo-sqlite` no funciona fuera del
 * dispositivo (design.md — D10).
 */
export function abrirAlmacenamiento(
  abrirFichero: AbrirFichero,
  nombreDelFichero?: string,
): boolean {
  try {
    const bd = abrirBaseDeDatos(abrirFichero, nombreDelFichero);
    try {
      migrar(bd);
    } catch (fallo) {
      // El fichero se queda tal cual estaba; solo se suelta el asa.
      try {
        bd.cerrar();
      } catch {
        // Si ni cerrarse deja, tampoco hay nada que arreglar aquí.
      }
      throw fallo;
    }
    instalarAlmacen(crearAlmacenSobreSqlite(bd));
    return true;
  } catch (fallo) {
    // Al encargado no se le enseña ningún detalle técnico, pero quien desarrolla
    // necesita saber por qué no abrió: sin esto, el aviso es indistinguible de un
    // fallo en el código. `__DEV__` es falso en el binario que se instala, así que
    // esto no llega al móvil de nadie.
    if (__DEV__) console.error('[almacenamiento] no se pudo abrir la base de datos:', fallo);
    instalarAlmacen(crearAlmacenNoDisponible());
    return false;
  }
}
