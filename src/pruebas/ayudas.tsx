/**
 * Ayudas comunes de los tests de la pantalla del cuadrante.
 */

import { act, render } from '@testing-library/react-native';
import { AppState } from 'react-native';

import {
  crearAlmacenEnMemoria,
  instalarAlmacen,
  type AlmacenCuadrante,
} from '../datos/almacenCuadrante';
import type { Empleado } from '../dominio/tipos';
import { ANCHO_MINIMO_SOPORTADO } from '../ui/medidas';
import { PantallaCuadrante } from '../ui/PantallaCuadrante';

/** Miércoles 9 de septiembre de 2026, dentro de la semana 07/09/2026 - 13/09/2026. */
export const MIERCOLES_A_LAS_DIEZ = new Date(2026, 8, 9, 10, 0);
/** Domingo 13 de septiembre de 2026, último día de esa misma semana. */
export const DOMINGO_POR_LA_NOCHE = new Date(2026, 8, 13, 23, 0);
/** Lunes 14 de septiembre de 2026: ya es la semana siguiente. */
export const LUNES_SIGUIENTE_DE_MADRUGADA = new Date(2026, 8, 14, 0, 30);

export const LUNES = '2026-09-07';
export const MARTES = '2026-09-08';
export const MIERCOLES = '2026-09-09';
export const JUEVES = '2026-09-10';
export const VIERNES = '2026-09-11';
export const SABADO = '2026-09-12';
export const DOMINGO = '2026-09-13';

export const hora = (horas: number, minutos = 0) => ({ horas, minutos });

interface Opciones {
  readonly plantilla?: readonly string[];
  readonly reloj?: () => Date;
  readonly anchoDePantalla?: number;
  readonly onIrAEmpleados?: () => void;
  readonly prepararDatos?: (datos: AlmacenCuadrante) => void;
}

export interface CuadranteRenderizado {
  readonly datos: AlmacenCuadrante;
  readonly empleado: (nombre: string) => Empleado;
}

export async function renderizarCuadrante(opciones: Opciones = {}): Promise<CuadranteRenderizado> {
  const {
    plantilla = ['Ana', 'Bruno'],
    reloj = () => MIERCOLES_A_LAS_DIEZ,
    anchoDePantalla = ANCHO_MINIMO_SOPORTADO,
    onIrAEmpleados,
    prepararDatos,
  } = opciones;

  const datos = crearAlmacenEnMemoria(plantilla);
  prepararDatos?.(datos);
  instalarAlmacen(datos);

  await render(
    <PantallaCuadrante
      reloj={reloj}
      anchoDePantalla={anchoDePantalla}
      onIrAEmpleados={onIrAEmpleados}
    />,
  );

  return {
    datos,
    empleado: (nombre) => {
      const encontrado = datos.listarEmpleados().find((e) => e.nombre === nombre);
      if (!encontrado) throw new Error(`No hay ningún empleado llamado ${nombre}`);
      return encontrado;
    },
  };
}

/**
 * Sustituye `AppState.addEventListener` para poder simular que la app vuelve a
 * primer plano. Hay que llamarlo antes de renderizar la pantalla.
 */
export function espiarAppState(): { volverAPrimerPlano: () => Promise<void> } {
  const oyentes: Array<(estado: string) => void> = [];

  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation(((_tipo: string, oyente: (estado: string) => void) => {
      oyentes.push(oyente);
      return { remove: () => {} };
    }) as unknown as typeof AppState.addEventListener);

  return {
    volverAPrimerPlano: async () => {
      await act(async () => {
        oyentes.forEach((oyente) => oyente('active'));
      });
    },
  };
}

/** Ancho declarado por un elemento, leyendo el último `width` de su estilo. */
export function anchoDe(elemento: { props: { style?: unknown } }): number {
  const combinado = estiloCombinado(elemento);
  if (typeof combinado.width !== 'number') {
    throw new Error('El elemento no declara ningún ancho');
  }
  return combinado.width;
}

export function estiloCombinado(elemento: { props: { style?: unknown } }): Record<string, unknown> {
  const capas = [elemento.props.style].flat(Infinity).filter(Boolean) as object[];
  return Object.assign({}, ...capas) as Record<string, unknown>;
}
