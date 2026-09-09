/**
 * Que la demo no recoja nada de quien la prueba.
 *
 * La demo se publica en un sitio abierto a quien tenga el enlace, así que la promesa de
 * que lo escrito en ella no sale del navegador no se puede quedar en una intención: se
 * comprueba igual que `src/datos/__tests__/privacidad.test.ts` comprueba la capa de
 * datos, mirando de qué es capaz el código. Si ningún módulo de la demo sabe hablar por
 * la red ni medir a nadie, no hay por dónde se escape nada.
 *
 * Mirar el tráfico durante una sesión diría qué pasó esa vez; esto dice qué puede pasar.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(__dirname, '..', '..');

/** Los módulos que solo existen para la demo, estén donde estén. */
const DE_LA_DEMO = [
  join(RAIZ, 'demo'),
  join(RAIZ, 'datos', 'sqlite', 'almacenDelNavegador.web.ts'),
  join(RAIZ, 'datos', 'sqlite', 'bdDeLaApp.web.ts'),
  join(RAIZ, 'datos', 'sqlite', 'bdSqlJs.ts'),
  join(RAIZ, 'ui', 'LaDemo.web.tsx'),
  join(RAIZ, 'ui', 'PreparacionDeLaPlataforma.web.tsx'),
  join(RAIZ, 'exportacion', 'compartirElCuadrante.web.ts'),
];

/** Toda salida posible del navegador, y toda forma de medir a quien está delante. */
const FORMAS_DE_SALIR = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket/,
  /navigator\.sendBeacon/,
  /EventSource/,
  /\bhttps?:\/\//,
  /analytics|telemetr|Sentry|crashlytics|gtag|dataLayer/i,
  /document\.cookie/,
];

function ficherosDe(ruta: string): string[] {
  if (!statSync(ruta).isDirectory()) return [ruta];
  return readdirSync(ruta).flatMap((entrada) => {
    const hijo = join(ruta, entrada);
    if (statSync(hijo).isDirectory()) return entrada === '__tests__' ? [] : ficherosDe(hijo);
    return hijo.endsWith('.ts') || hijo.endsWith('.tsx') ? [hijo] : [];
  });
}

describe('Lo que se escribe en la demo no sale del navegador', () => {
  it('Probar la demo no envía nada a ninguna parte', () => {
    const ficheros = DE_LA_DEMO.flatMap(ficherosDe);
    // Si un módulo de la demo cambiara de nombre o de sitio, esta lista dejaría de
    // mirarlo sin decir nada. Por eso se exige que siga habiendo varios.
    expect(ficheros.length).toBeGreaterThanOrEqual(7);

    for (const fichero of ficheros) {
      const codigo = readFileSync(fichero, 'utf8');
      for (const forma of FORMAS_DE_SALIR) {
        expect({ fichero, encontrado: codigo.match(forma)?.[0] ?? null }).toEqual({
          fichero,
          encontrado: null,
        });
      }
    }
  });

  it('la demo no tiene a dónde mandar nada aunque quisiera', () => {
    // El sitio de la demo es estático: no hay servidor de aplicación detrás, así que no
    // existe ningún punto al que enviar lo que alguien escriba. Se comprueba que el
    // proyecto no ha ganado por el camino una dirección a la que llamar.
    const paquete = JSON.parse(readFileSync(join(RAIZ, '..', 'package.json'), 'utf8'));
    const dependencias = Object.keys(paquete.dependencies ?? {});

    expect(dependencias).not.toContain('axios');
    expect(dependencias.filter((nombre) => /analytics|sentry|firebase|amplitude/i.test(nombre)))
      .toEqual([]);
  });
});
