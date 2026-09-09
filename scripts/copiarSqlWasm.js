/**
 * Deja el motor de SQLite donde el navegador pueda pedirlo.
 *
 * `sql.js` es SQLite compilado a WebAssembly: el `.js` viaja dentro del bundle, pero el
 * `.wasm` lo descarga el navegador aparte, por su URL. Todo lo que hay en `public/` se
 * copia tal cual a la raíz del sitio, así que ahí es donde tiene que estar.
 *
 * Se copia desde `node_modules` en cada build en lugar de guardar una copia en el
 * repositorio: así el motor no puede quedarse atrás respecto a la versión de `sql.js`
 * que declara `package.json`, que es justo la clase de desajuste que solo se nota
 * cuando la demo ya está delante de alguien.
 *
 * Esto solo hace falta para la demo web. El binario del móvil no lo usa: allí SQLite
 * lo pone `expo-sqlite`.
 */

const { copyFileSync, mkdirSync } = require('node:fs');
const { dirname, join } = require('node:path');

const raiz = dirname(__dirname);
const origen = join(raiz, 'node_modules', 'sql.js', 'dist');
const destino = join(raiz, 'public');

/**
 * Las dos variantes del motor.
 *
 * `sql.js` trae varias compilaciones y **elige una u otra según quién lo empaquete**: al
 * hacer el bundle para el navegador acaba pidiendo `sql-wasm-browser.wasm`, mientras que
 * en Node se usa `sql-wasm.wasm`. Se copian las dos y `prepararSqlJs` las resuelve por el
 * nombre que le pidan, en lugar de dar por hecho cuál va a ser: cuál elige el bundler no
 * es una decisión nuestra, y acertarla a mano se rompe en la siguiente actualización.
 *
 * Averiguado el 09/09/2026 probando la demo ya construida en un navegador: con solo
 * `sql-wasm.wasm` copiado, la petición de `sql-wasm-browser.wasm` devolvía el `index.html`
 * del sitio y la demo arrancaba en el aviso «No se han podido abrir tus datos».
 */
const VARIANTES = ['sql-wasm.wasm', 'sql-wasm-browser.wasm'];

mkdirSync(destino, { recursive: true });
for (const variante of VARIANTES) {
  copyFileSync(join(origen, variante), join(destino, variante));
}

console.log(`[demo] motor de SQLite copiado a public/: ${VARIANTES.join(', ')}`);
