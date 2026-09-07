/**
 * Que los datos de la plantilla no salgan del dispositivo no se comprueba mirando
 * una pantalla: se comprueba mirando qué puede hacer el código de la capa de datos.
 * Si ningún módulo de `src/datos/` sabe hablar por la red ni escribir fuera del
 * directorio de la app, no hay por dónde se escapen.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { FICHERO_BASE_DE_DATOS } from '../sqlite/conexion';

const CAPA_DE_DATOS = join(__dirname, '..');

/** Toda salida posible del dispositivo, y toda escritura fuera de la app. */
const FORMAS_DE_SALIR = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket/,
  /navigator\.sendBeacon/,
  /\bhttps?:\/\//,
  /expo-file-system/,
  /expo-sharing/,
  /expo-print/,
  /AsyncStorage/,
  /analytics|telemetr|Sentry|crashlytics/i,
];

function ficherosDeLaCapaDeDatos(directorio: string = CAPA_DE_DATOS): string[] {
  return readdirSync(directorio).flatMap((entrada) => {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) {
      return entrada === '__tests__' ? [] : ficherosDeLaCapaDeDatos(ruta);
    }
    return ruta.endsWith('.ts') ? [ruta] : [];
  });
}

describe('Los datos guardados no salen del dispositivo', () => {
  it('Los datos de contacto se quedan en el dispositivo', () => {
    const ficheros = ficherosDeLaCapaDeDatos();
    expect(ficheros.length).toBeGreaterThan(0);

    for (const fichero of ficheros) {
      const codigo = readFileSync(fichero, 'utf8');
      for (const forma of FORMAS_DE_SALIR) {
        expect({ fichero, codigo: codigo.match(forma)?.[0] ?? null }).toEqual({
          fichero,
          codigo: null,
        });
      }
    }
  });

  it('la capa de datos solo conoce el fichero de base de datos de la app', () => {
    // Un solo nombre de fichero, sin rutas: `expo-sqlite` lo resuelve dentro del
    // almacenamiento privado de la app, al que otras aplicaciones no llegan.
    expect(FICHERO_BASE_DE_DATOS).not.toMatch(/[\\/]/);
  });
});
