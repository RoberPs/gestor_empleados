/**
 * Dónde vive lo copiado: solo hay un sitio, y no es el almacenamiento.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { copiar, loCopiado, olvidarLoCopiado, suscribirseALoCopiado } from '../loCopiado';

const hora = (horas: number, minutos = 0) => ({ horas, minutos });

beforeEach(() => {
  olvidarLoCopiado();
});

describe('Lo copiado mientras la app está abierta', () => {
  it('sin haber copiado nada, no hay nada copiado', () => {
    expect(loCopiado()).toBeNull();
  });

  it('Copiar otra celda sustituye lo copiado', () => {
    copiar({ tipo: 'turnos', turnos: [{ inicio: hora(9), fin: hora(17) }] });
    copiar({ tipo: 'turnos', turnos: [{ inicio: hora(20), fin: hora(23) }] });

    expect(loCopiado()).toEqual({
      tipo: 'turnos',
      turnos: [{ inicio: hora(20), fin: hora(23) }],
    });
  });

  it('lo copiado se puede leer tantas veces como haga falta', () => {
    copiar({ tipo: 'vacaciones' });

    expect(loCopiado()).toEqual({ tipo: 'vacaciones' });
    expect(loCopiado()).toEqual({ tipo: 'vacaciones' });
    expect(loCopiado()).toEqual({ tipo: 'vacaciones' });
  });

  it('avisa a quien se haya suscrito, y deja de hacerlo al darse de baja', () => {
    const oyente = jest.fn();
    const darseDeBaja = suscribirseALoCopiado(oyente);

    copiar({ tipo: 'ausencia' });
    expect(oyente).toHaveBeenCalledTimes(1);

    darseDeBaja();
    copiar({ tipo: 'vacaciones' });
    expect(oyente).toHaveBeenCalledTimes(1);
  });
});

describe('Lo copiado no sobrevive a cerrar la app', () => {
  it('Lo copiado no sobrevive a cerrar la app', () => {
    copiar({ tipo: 'turnos', turnos: [{ inicio: hora(9), fin: hora(17) }] });
    expect(loCopiado()).not.toBeNull();

    // Cerrar la app es que se lleve el proceso por delante lo que hubiera en memoria.
    // Un módulo recién cargado es lo más cerca que se puede estar de eso sin cerrar
    // Jest: si lo copiado se rehidratara de algún sitio, aquí volvería.
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const recienAbierto = require('../loCopiado') as typeof import('../loCopiado');

    expect(recienAbierto.loCopiado()).toBeNull();
  });
});

describe('Lo copiado no pasa por el almacenamiento', () => {
  it('el módulo no importa nada de la capa de datos', () => {
    const fuente = readFileSync(join(__dirname, '..', 'loCopiado.ts'), 'utf8');
    const importaciones = fuente.match(/^import .*$/gm) ?? [];

    for (const importacion of importaciones) {
      expect(importacion).not.toMatch(/datos|sqlite|almacen/i);
    }
  });
});
