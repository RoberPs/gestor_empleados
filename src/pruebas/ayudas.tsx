/**
 * Ayudas comunes de los tests de la pantalla del cuadrante.
 */

import { act, render } from '@testing-library/react-native';
import { useState, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  crearAlmacenEnMemoria,
  instalarAlmacen,
  type AlmacenCuadrante,
} from '../datos/almacenCuadrante';
import type { Empleado, IdEmpleado } from '../dominio/tipos';
import { ANCHO_MINIMO_SOPORTADO } from '../ui/medidas';
import { PantallaCuadrante } from '../ui/PantallaCuadrante';
import { PantallaEmpleados } from '../ui/PantallaEmpleados';
import { PantallaFichaEmpleado } from '../ui/PantallaFichaEmpleado';

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

/**
 * Un dispositivo sin nada que estorbe por los bordes: ni muesca, ni barra de
 * navegación. Es lo que ve la mayoría de los tests, ajenos a ese asunto; el que
 * sí lo comprueba declara sus propios márgenes.
 */
export const SIN_BORDES_OCUPADOS: Metrics = {
  frame: { x: 0, y: 0, width: ANCHO_MINIMO_SOPORTADO, height: 800 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** Envuelve la pantalla en el área segura que declare el test. */
export function ConAreaSegura({
  metricas = SIN_BORDES_OCUPADOS,
  children,
}: {
  readonly metricas?: Metrics;
  readonly children: ReactNode;
}) {
  return <SafeAreaProvider initialMetrics={metricas}>{children}</SafeAreaProvider>;
}

interface Opciones {
  readonly plantilla?: readonly string[];
  readonly reloj?: () => Date;
  readonly anchoDePantalla?: number;
  readonly onIrAEmpleados?: () => void;
  readonly prepararDatos?: (datos: AlmacenCuadrante) => void;
  /** Márgenes del dispositivo (muesca, barra de navegación). Por defecto, ninguno. */
  readonly areaSegura?: Metrics;
  /** Navegación a la ficha de un empleado desde el cuadrante. */
  readonly onAbrirFicha?: (id: IdEmpleado) => void;
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
    areaSegura,
    onAbrirFicha,
  } = opciones;

  const datos = crearAlmacenEnMemoria(plantilla);
  prepararDatos?.(datos);
  instalarAlmacen(datos);

  await render(
    <ConAreaSegura metricas={areaSegura}>
      <PantallaCuadrante
        reloj={reloj}
        anchoDePantalla={anchoDePantalla}
        onIrAEmpleados={onIrAEmpleados}
        onAbrirFicha={onAbrirFicha}
      />
    </ConAreaSegura>,
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
 * El panel de empleados con su navegación: la lista, y la ficha del empleado cuya
 * fila se toca. Es lo que hacen las rutas de expo-router, sin expo-router de por
 * medio, para poder recorrer lista → ficha → lista dentro de un mismo test.
 */
export function PanelDeEmpleados() {
  const [abierta, setAbierta] = useState<IdEmpleado | null>(null);

  return abierta === null ? (
    <PantallaEmpleados onAbrirFicha={setAbierta} />
  ) : (
    <PantallaFichaEmpleado idEmpleado={abierta} onVolver={() => setAbierta(null)} />
  );
}

interface OpcionesDelPanel {
  readonly plantilla?: readonly string[];
  readonly prepararDatos?: (datos: AlmacenCuadrante) => void;
  /** Márgenes del dispositivo (muesca, barra de navegación). Por defecto, ninguno. */
  readonly areaSegura?: Metrics;
}

/** Renderiza el panel de empleados sobre un almacén recién creado. */
export async function renderizarPanelDeEmpleados(
  opciones: OpcionesDelPanel = {},
): Promise<AlmacenCuadrante> {
  const { plantilla = ['Ana', 'Bruno', 'Carmen'], prepararDatos, areaSegura } = opciones;

  const datos = crearAlmacenEnMemoria(plantilla);
  prepararDatos?.(datos);
  instalarAlmacen(datos);

  await render(
    <ConAreaSegura metricas={areaSegura}>
      <PanelDeEmpleados />
    </ConAreaSegura>,
  );
  return datos;
}

/**
 * El cuadrante con la ficha que se abre desde él: desde el nombre de una fila o
 * desde la acción «Ver la ausencia» de una celda.
 *
 * La ficha se abre **encima** del cuadrante, sin desmontarlo, igual que hace la pila
 * de expo-router: por eso al volver el cuadrante sigue en la semana en la que
 * estaba. Desmontándolo, la semana se perdería en el test y no en la app.
 */
export function CuadranteConFicha({
  reloj = () => MIERCOLES_A_LAS_DIEZ,
  anchoDePantalla = ANCHO_MINIMO_SOPORTADO,
}: {
  readonly reloj?: () => Date;
  readonly anchoDePantalla?: number;
} = {}) {
  const [abierta, setAbierta] = useState<IdEmpleado | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, display: abierta === null ? 'flex' : 'none' }}>
        <PantallaCuadrante
          reloj={reloj}
          anchoDePantalla={anchoDePantalla}
          onAbrirFicha={setAbierta}
        />
      </View>
      {abierta === null ? null : (
        <PantallaFichaEmpleado
          idEmpleado={abierta}
          seAbrioDesde="cuadrante"
          onVolver={() => setAbierta(null)}
        />
      )}
    </View>
  );
}

/** Renderiza el cuadrante con su ficha sobre un almacén recién creado. */
export async function renderizarCuadranteConFicha(
  opciones: OpcionesDelPanel = {},
): Promise<AlmacenCuadrante> {
  const { plantilla = ['Ana', 'Bruno'], prepararDatos, areaSegura } = opciones;

  const datos = crearAlmacenEnMemoria(plantilla);
  prepararDatos?.(datos);
  instalarAlmacen(datos);

  await render(
    <ConAreaSegura metricas={areaSegura}>
      <CuadranteConFicha />
    </ConAreaSegura>,
  );
  return datos;
}

/** El empleado de la plantilla que se llama así. Falla si no está. */
export function empleadoLlamado(datos: AlmacenCuadrante, nombre: string): Empleado {
  const encontrado = datos.listarEmpleados().find((e) => e.nombre === nombre);
  if (!encontrado) throw new Error(`No hay ningún empleado llamado ${nombre}`);
  return encontrado;
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
