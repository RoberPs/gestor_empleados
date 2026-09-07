/**
 * La `BaseDeDatos` de los tests, sobre `node:sqlite`.
 *
 * **Solo para tests**: la app no importa este módulo desde ningún sitio. Existe
 * porque `expo-sqlite` en Node es una implementación vacía que no lanza errores (ver
 * `src/datos/sqlite/bd.ts`), así que un test contra ella pasaría diga lo que diga el
 * SQL. `node:sqlite` viene dentro de Node, así que no añade ninguna dependencia, y
 * es SQLite de verdad: respeta `PRAGMA user_version`, `AUTOINCREMENT`, los índices
 * únicos y `PRAGMA foreign_keys`.
 *
 * El SQL que se ejecuta aquí es exactamente el mismo que corre en el dispositivo:
 * las migraciones y las operaciones se escriben una sola vez, contra la interfaz.
 */

// Los tipos de Node se cargan aquí y solo aquí: `tsconfig.json` deja `types` en
// `jest` y `expo` a propósito, para que un módulo de la app no pueda usar por
// descuido una API que en el móvil no existe.
/// <reference types="node" />
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { BaseDeDatos, ResultadoEscritura, ValorSql } from '../datos/sqlite/bd';

/**
 * Abre una base para un test. Con `':memory:'` no toca el disco; con la ruta de un
 * fichero temporal se puede cerrar y reabrir, que es como se comprueban los
 * escenarios de durabilidad.
 */
export function abrirConNodeSqlite(nombreDelFichero: string): BaseDeDatos {
  const bd = new DatabaseSync(nombreDelFichero);

  return {
    ejecutar(sql: string): void {
      bd.exec(sql);
    },

    escribir(sql: string, ...parametros: ValorSql[]): ResultadoEscritura {
      const resultado = bd.prepare(sql).run(...parametros);
      return {
        ultimoId: Number(resultado.lastInsertRowid),
        filasAfectadas: Number(resultado.changes),
      };
    },

    leer<Fila>(sql: string, ...parametros: ValorSql[]): Fila[] {
      return bd.prepare(sql).all(...parametros) as Fila[];
    },

    cerrar(): void {
      bd.close();
    },
  };
}

/**
 * Ruta de un fichero de base de datos nuevo, en un directorio temporal propio del
 * test. Hace falta para los escenarios de durabilidad: cerrar y volver a abrir el
 * mismo fichero es lo que reproduce cerrar y volver a abrir la app.
 */
export function rutaDeFicheroDePrueba(): string {
  return join(mkdtempSync(join(tmpdir(), 'gestor-empleados-')), 'datos.db');
}
