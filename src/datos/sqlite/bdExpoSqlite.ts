/**
 * La `BaseDeDatos` de la app, sobre `expo-sqlite`.
 *
 * Es el **único** módulo del proyecto que importa `expo-sqlite`, y no tiene lógica
 * propia: traduce los cuatro métodos de la interfaz a la API síncrona de la
 * librería. Los tests no lo ejercitan —en Node `expo-sqlite` es una implementación
 * vacía, ver `bd.ts`—, así que cuanto menos haga aquí, mejor.
 *
 * La API es la síncrona (`openDatabaseSync`, `execSync`, `runSync`, `getAllSync`)
 * porque `AlmacenCuadrante` es síncrona y las pantallas la consumen sin estados de
 * carga (design.md — D2).
 */

import { openDatabaseSync } from 'expo-sqlite';

import type { BaseDeDatos, ResultadoEscritura, ValorSql } from './bd';

export function abrirConExpoSqlite(nombreDelFichero: string): BaseDeDatos {
  const bd = openDatabaseSync(nombreDelFichero);

  return {
    ejecutar(sql: string): void {
      bd.execSync(sql);
    },

    escribir(sql: string, ...parametros: ValorSql[]): ResultadoEscritura {
      const resultado = bd.runSync(sql, ...parametros);
      return { ultimoId: resultado.lastInsertRowId, filasAfectadas: resultado.changes };
    },

    leer<Fila>(sql: string, ...parametros: ValorSql[]): Fila[] {
      return bd.getAllSync<Fila>(sql, ...parametros);
    },

    cerrar(): void {
      bd.closeSync();
    },
  };
}
