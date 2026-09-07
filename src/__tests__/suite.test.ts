/**
 * La comprobación que recorre las specs escenario a escenario.
 *
 * El contexto del proyecto pide que **cada escenario de las specs quede comprobado
 * citando su nombre literal**, sea en un test o —cuando solo se puede verificar
 * mirando la pantalla o el dispositivo— en `docs/verificacion-manual.md`. Este test
 * lo comprueba solo, en lugar de dejarlo en una lista escrita a mano que envejece: si
 * una spec gana un escenario y nadie lo cubre, `npm test` lo dice por su nombre.
 *
 * Cita "por su nombre literal" quiere decir tal cual aparece tras `#### Scenario:`,
 * sin traducirlo, resumirlo ni reformularlo.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(__dirname, '..', '..');
const SPECS_PUBLICADAS = join(RAIZ, 'openspec', 'specs');
const CHANGES = join(RAIZ, 'openspec', 'changes');
const CODIGO = join(RAIZ, 'src');
const VERIFICACION_MANUAL = join(RAIZ, 'docs', 'verificacion-manual.md');

function ficherosBajo(directorio: string, admite: (ruta: string) => boolean): string[] {
  if (!existe(directorio)) return [];
  return readdirSync(directorio).flatMap((entrada) => {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) return ficherosBajo(ruta, admite);
    return admite(ruta) ? [ruta] : [];
  });
}

function existe(ruta: string): boolean {
  try {
    statSync(ruta);
    return true;
  } catch {
    return false;
  }
}

/**
 * Las specs vivas: las publicadas más las de los changes en curso. Las de
 * `changes/archive/` no entran: su contenido ya está publicado.
 */
function specsVivas(): string[] {
  const esSpec = (ruta: string) => ruta.endsWith('.md');
  const enCurso = existe(CHANGES)
    ? readdirSync(CHANGES)
        .filter((change) => change !== 'archive')
        .flatMap((change) => ficherosBajo(join(CHANGES, change, 'specs'), esSpec))
    : [];
  return [...ficherosBajo(SPECS_PUBLICADAS, esSpec), ...enCurso];
}

function escenariosDe(ficheros: readonly string[]): string[] {
  const nombres = ficheros.flatMap((fichero) =>
    readFileSync(fichero, 'utf8')
      .split('\n')
      .filter((linea) => linea.startsWith('#### Scenario:'))
      .map((linea) => linea.slice('#### Scenario:'.length).trim()),
  );
  return [...new Set(nombres)];
}

describe('Suite de tests del proyecto', () => {
  it('todo escenario de las specs está citado por su nombre literal', () => {
    const ficheros = specsVivas();
    expect(ficheros.length).toBeGreaterThan(0);

    const dondeSePuedeCitar = [
      ...ficherosBajo(CODIGO, (ruta) => ruta.endsWith('.test.ts') || ruta.endsWith('.test.tsx')),
      VERIFICACION_MANUAL,
    ].map((fichero) => readFileSync(fichero, 'utf8'));

    const sinCubrir = escenariosDe(ficheros).filter(
      (escenario) => !dondeSePuedeCitar.some((texto) => texto.includes(escenario)),
    );

    expect(sinCubrir).toEqual([]);
  });
});
