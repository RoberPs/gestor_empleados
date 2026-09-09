/**
 * La misma batería contra las dos implementaciones que se pueden ejecutar aquí.
 *
 * `node:sqlite` es la de los tests y `sql.js` la de la demo web. La tercera,
 * `expo-sqlite`, no puede ejercitarse fuera del dispositivo —en Node su propio código
 * instala una implementación vacía que no lanza—, así que de esa responden los escenarios
 * de `docs/verificacion-manual.md`.
 *
 * Lo que se compara no es una librería contra otra: es que el SQL de la app se comporte
 * igual encima de cualquiera de ellas. Si `sql.js` divergiera en la cascada, en el orden
 * alfabético o en la versión del esquema, la demo enseñaría algo que la app no hace, y
 * eso saldría aquí.
 */

import { join } from 'node:path';

import { abrirConNodeSqlite } from '../../../pruebas/bdDePrueba';
import { verificarContratoDeBaseDeDatos } from '../../../pruebas/contratoDeBaseDeDatos';
import { abrirConSqlJs, prepararSqlJs } from '../bdSqlJs';

verificarContratoDeBaseDeDatos('node:sqlite (los tests)', abrirConNodeSqlite);

verificarContratoDeBaseDeDatos('sql.js (la demo web)', abrirConSqlJs, () =>
  // En el navegador el `.wasm` se descarga de la raíz del sitio; aquí no hay servidor,
  // así que se lee directamente de `node_modules`.
  prepararSqlJs((fichero) => join(__dirname, '..', '..', '..', '..', 'node_modules', 'sql.js', 'dist', fichero)),
);
