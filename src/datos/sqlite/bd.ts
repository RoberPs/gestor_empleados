/**
 * Lo mínimo que la capa de datos necesita de SQLite: ejecutar SQL, escribir con
 * parámetros, leer filas y cerrar.
 *
 * No es una capa de repositorios ni una abstracción sobre el modelo: aquí no se
 * nombra a los empleados ni a ninguna otra entidad, solo cadenas de SQL. El SQL de
 * las migraciones y de las operaciones se escribe una sola vez y corre igual sea
 * cual sea la implementación que haya debajo.
 *
 * Existe por una razón concreta: `expo-sqlite` no se puede ejecutar de verdad fuera
 * del dispositivo. En Node su propio código instala una implementación vacía
 * —`web/SQLiteModule.node.ts`: «expo-sqlite is not supported on server runtime»—
 * que abre, ejecuta y devuelve vacío **sin lanzar ningún error**. Un test contra
 * ella pasaría diga lo que diga el SQL. Con esta interfaz, `npm test` ejecuta el SQL
 * real de la app contra SQLite real a través de `node:sqlite`, y en el dispositivo
 * corre exactamente el mismo SQL sobre `expo-sqlite`.
 *
 * Implementaciones:
 * - `src/datos/sqlite/bdExpoSqlite.ts` — la de la app. Único módulo del proyecto que
 *   importa `expo-sqlite`.
 * - `src/pruebas/bdDePrueba.ts` — la de los tests, sobre `node:sqlite`.
 */

/** Lo que SQLite admite como parámetro de una sentencia. */
export type ValorSql = string | number | null;

/** Lo que devuelve una escritura: sirve para conocer el `id` de una fila recién insertada. */
export interface ResultadoEscritura {
  readonly ultimoId: number;
  readonly filasAfectadas: number;
}

export interface BaseDeDatos {
  /** SQL sin parámetros: DDL, `PRAGMA`, `BEGIN`, `COMMIT`. Admite varias sentencias. */
  ejecutar(sql: string): void;
  /** Una sentencia de escritura con sus parámetros. */
  escribir(sql: string, ...parametros: ValorSql[]): ResultadoEscritura;
  /** Una consulta con sus parámetros. Cada fila es un objeto columna → valor. */
  leer<Fila>(sql: string, ...parametros: ValorSql[]): Fila[];
  cerrar(): void;
}

/**
 * Cómo se consigue una base de datos a partir del nombre de su fichero. La app pasa
 * la de `expo-sqlite`; los tests, la de `node:sqlite`.
 */
export type AbrirFichero = (nombreDelFichero: string) => BaseDeDatos;
