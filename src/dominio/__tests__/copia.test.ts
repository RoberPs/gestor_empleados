/**
 * Qué se lleva copiar una celda, y sobre todo qué no se lleva.
 *
 * La comprobación que importa aquí es la de los identificadores: si un `id` de turno
 * viajara con lo copiado, alguien acabaría usándolo para editar el turno del
 * empleado de origen creyendo que edita el del destino.
 */

import { paraCopiar } from '../copia';
import type { ContenidoCelda } from '../tipos';

const hora = (horas: number, minutos = 0) => ({ horas, minutos });

describe('Lo que se copia de una celda', () => {
  it('copiar una celda de dos turnos devuelve las cuatro horas', () => {
    const contenido: ContenidoCelda = {
      tipo: 'turnos',
      turnos: [
        { id: '7', inicio: hora(12), fin: hora(16) },
        { id: '8', inicio: hora(20), fin: hora(0) },
      ],
    };

    expect(paraCopiar(contenido)).toEqual({
      tipo: 'turnos',
      turnos: [
        { inicio: hora(12), fin: hora(16) },
        { inicio: hora(20), fin: hora(0) },
      ],
    });
  });

  it('en lo copiado no aparece ningún identificador de turno', () => {
    const contenido: ContenidoCelda = {
      tipo: 'turnos',
      turnos: [
        { id: 'turno-de-ana', inicio: hora(9), fin: hora(17) },
        { id: 'el-otro-turno-de-ana', inicio: hora(20), fin: hora(23) },
      ],
    };

    const copiado = JSON.stringify(paraCopiar(contenido));

    // Ni los identificadores concretos ni la propia clave que los guarda.
    expect(copiado).not.toContain('turno-de-ana');
    expect(copiado).not.toContain('el-otro-turno-de-ana');
    expect(copiado).not.toContain('"id"');
  });

  it('copiar un solo turno devuelve un solo turno', () => {
    const contenido: ContenidoCelda = {
      tipo: 'turnos',
      turnos: [{ id: '1', inicio: hora(9), fin: hora(17) }],
    };

    expect(paraCopiar(contenido)).toEqual({
      tipo: 'turnos',
      turnos: [{ inicio: hora(9), fin: hora(17) }],
    });
  });

  it('copiar una ausencia y copiar unas vacaciones se lleva el estado y nada más', () => {
    expect(paraCopiar({ tipo: 'ausencia' })).toEqual({ tipo: 'ausencia' });
    expect(paraCopiar({ tipo: 'vacaciones' })).toEqual({ tipo: 'vacaciones' });
  });

  it('Una celda vacía no se puede copiar', () => {
    expect(paraCopiar({ tipo: 'vacia' })).toBeNull();
  });
});
