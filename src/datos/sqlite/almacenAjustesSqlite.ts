/**
 * Los ajustes del local, contra SQLite.
 *
 * Un ajuste es una clave y su valor. Que no exista la fila significa que el
 * encargado nunca lo ha escrito, y hacia arriba eso sale como cadena vacía: la app
 * no da por hecho ningún nombre de local, ni siquiera uno de ejemplo.
 *
 * El nombre se sanea con `sanearCampo`, el mismo del dominio que ya recorta el
 * teléfono y el email de una ficha, para no tener dos formas distintas de quitar
 * espacios sobrantes en la misma app.
 */

import { sanearCampo } from '../../dominio/empleado';
import type { AlmacenAjustes } from '../almacenAjustes';
import type { BaseDeDatos } from './bd';

/** La clave del único ajuste que hay hoy. */
const NOMBRE_DEL_LOCAL = 'nombre_del_local';

export function crearAlmacenAjustesSqlite(bd: BaseDeDatos): AlmacenAjustes {
  const oyentes = new Set<() => void>();
  const avisar = () => oyentes.forEach((oyente) => oyente());

  function leer(clave: string): string {
    const [fila] = bd.leer<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ?', clave);
    return fila?.valor ?? '';
  }

  return {
    leerNombreDelLocal() {
      return leer(NOMBRE_DEL_LOCAL);
    },

    escribirNombreDelLocal(nombre) {
      // Una sola sentencia en vez de leer, decidir y escribir: entre la lectura y la
      // escritura cabría otra escritura.
      bd.escribir(
        `INSERT INTO ajustes (clave, valor) VALUES (?, ?)
         ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor`,
        NOMBRE_DEL_LOCAL,
        sanearCampo(nombre),
      );
      avisar();
    },

    suscribirse(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
  };
}
