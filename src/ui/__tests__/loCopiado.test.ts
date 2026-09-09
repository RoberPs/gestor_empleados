/**
 * Dónde vive lo copiado: solo hay un sitio, y no es el almacenamiento.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import { almacen } from '../../datos/almacenCuadrante';
import { abrirAlmacenamiento } from '../../datos/arranque';
import { abrirConNodeSqlite, rutaDeFicheroDePrueba } from '../../pruebas/bdDePrueba';
import { copiar, loCopiado, olvidarLoCopiado, suscribirseALoCopiado } from '../loCopiado';

const hora = (horas: number, minutos = 0) => ({ horas, minutos });

const LUNES = '2026-09-07';

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
    // El escenario tiene dos mitades y las dos se comprueban aquí: que el
    // portapapeles no vuelva, y que el cuadrante sí. Cerrar la app se lleva por
    // delante lo que estuviera en memoria y deja intacto lo guardado; si las dos
    // cosas vivieran en el mismo sitio, una de las dos mitades fallaría.
    const fichero = rutaDeFicheroDePrueba();
    abrirAlmacenamiento(abrirConNodeSqlite, fichero);
    const ana = almacen().altaEmpleado('Ana')!;
    almacen().crearTurno(ana.id, LUNES, hora(9), hora(17));
    const planificadoAntes = almacen().leerCelda(ana.id, LUNES);

    copiar({ tipo: 'turnos', turnos: [{ inicio: hora(9), fin: hora(17) }] });
    expect(loCopiado()).not.toBeNull();

    // Un módulo recién cargado es lo más cerca que se puede estar de cerrar la app
    // sin cerrar Jest: si lo copiado se rehidratara de algún sitio, aquí volvería.
    jest.resetModules();
    /* eslint-disable @typescript-eslint/no-var-requires */
    const recienAbierto = require('../loCopiado') as typeof import('../loCopiado');
    const datos = require('../../datos/almacenCuadrante') as typeof import('../../datos/almacenCuadrante');
    const arranque = require('../../datos/arranque') as typeof import('../../datos/arranque');
    /* eslint-enable @typescript-eslint/no-var-requires */
    arranque.abrirAlmacenamiento(abrirConNodeSqlite, fichero);

    // No se le ofrece pegar: no hay nada copiado.
    expect(recienAbierto.loCopiado()).toBeNull();
    // Y el cuadrante muestra los mismos turnos planificados que antes de cerrarla.
    expect(datos.almacen().leerCelda(ana.id, LUNES)).toEqual(planificadoAntes);
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
