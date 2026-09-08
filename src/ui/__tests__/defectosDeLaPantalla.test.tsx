/**
 * Los defectos que se vieron en el móvil el 08/09/2026, cada uno con el test que
 * los habría cazado.
 *
 * Ninguno era un requisito nuevo: los cuatro incumplían specs ya publicadas —la
 * plantilla alcanzable con scroll, la nota que se guarda, las acciones
 * permanentes alcanzables— y por eso viven aquí y no en un change.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { diasDeLaSemana } from '../../dominio/semana';
import {
  empleadoLlamado,
  estiloCombinado,
  hora,
  PanelDeEmpleados,
  renderizarCuadrante,
  renderizarPanelDeEmpleados,
} from '../../pruebas/ayudas';
import { altoDeFila, ANCHO_MINIMO_SOPORTADO } from '../medidas';

const LUNES = '2026-09-07';
const MARTES = '2026-09-08';
const MIERCOLES = '2026-09-09';

/** Un móvil con barra de navegación por gestos: 48 puntos que no son de la app. */
const MARGEN_INFERIOR = 48;
const METRICAS_CON_BARRA = {
  frame: { x: 0, y: 0, width: ANCHO_MINIMO_SOPORTADO, height: 800 },
  insets: { top: 24, left: 0, right: 0, bottom: MARGEN_INFERIOR },
};

function altoDe(elemento: { props: { style?: unknown } }): number {
  const combinado = estiloCombinado(elemento);
  if (typeof combinado.height !== 'number') {
    throw new Error('El elemento no declara ningún alto');
  }
  return combinado.height;
}

function margenInferiorDe(elemento: { props: { style?: unknown } }): number {
  const combinado = estiloCombinado(elemento);
  return typeof combinado.paddingBottom === 'number' ? combinado.paddingBottom : 0;
}

describe('Todas las filas del cuadrante miden lo mismo', () => {
  it('una fila vacía mide lo mismo que una con dos turnos', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados().find((e) => e.nombre === 'Ana')!;
        // Ana carga la semana entera: dos turnos el lunes y una ausencia el martes.
        datos.crearTurno(ana.id, LUNES, hora(9), hora(13));
        datos.crearTurno(ana.id, LUNES, hora(20), hora(0));
        datos.marcarAusencia(ana.id, MARTES);
      },
    });

    const cargada = screen.getByTestId(`fila-empleado-${empleado('Ana').id}`);
    const vacia = screen.getByTestId(`fila-empleado-${empleado('Bruno').id}`);

    expect(altoDe(cargada)).toBe(altoDe(vacia));
  });

  it('la fila mide lo mismo en una semana que en otra', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados()[0]!;
        datos.crearTurno(ana.id, LUNES, hora(9), hora(17));
      },
    });
    const ana = empleado('Ana');
    const enLaSemanaEnCurso = altoDe(screen.getByTestId(`fila-empleado-${ana.id}`));

    await fireEvent.press(screen.getByTestId('accion-semana-siguiente'));

    expect(altoDe(screen.getByTestId(`fila-empleado-${ana.id}`))).toBe(enLaSemanaEnCurso);
  });

  it('la fila deja sitio a cuatro horas: dos turnos con su inicio y su fin', async () => {
    // Con la letra del sistema al tamaño normal y también agrandada.
    expect(altoDeFila(1)).toBeGreaterThanOrEqual(4 * Math.ceil(12 * 1.3));
    expect(altoDeFila(2)).toBeGreaterThan(altoDeFila(1));
    // Nunca por debajo del área pulsable mínima, por pequeña que sea la letra.
    expect(altoDeFila(0.5)).toBeGreaterThanOrEqual(44);
  });
});

describe('La cabecera de días no se descuadra', () => {
  it('el nombre del día ocupa la misma caja en los siete días', async () => {
    await renderizarCuadrante();

    // «Miércoles» y «Domingo» son los que no caben y se encogen; su caja tiene que
    // seguir midiendo lo mismo que la de «Lunes», o quedan a distinta altura.
    const cajas = diasDeLaSemana({ lunes: LUNES }).map((dia) => {
      const cabecera = screen.getByTestId(`cabecera-dia-${dia}`);
      return altoDe(cabecera.props.children[0]);
    });

    expect(new Set(cajas).size).toBe(1);
  });
});

describe('La nota del empleado se guarda al escribirla', () => {
  it('la nota queda guardada sin salir del campo ni cerrar el teclado', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });
    const ana = empleadoLlamado(datos, 'Ana');
    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${ana.id}`));

    // Se escribe y no se toca nada más: ni otro campo, ni el teclado, ni volver.
    await fireEvent.changeText(screen.getByTestId('campo-nota'), 'No puede los martes');

    expect(datos.leerEmpleado(ana.id)?.nota).toBe('No puede los martes');
  });

  it('la nota sigue ahí al volver a abrir la ficha', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });
    const ana = empleadoLlamado(datos, 'Ana');
    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${ana.id}`));
    await fireEvent.changeText(screen.getByTestId('campo-nota'), 'Turno de tarde');

    await fireEvent.press(screen.getByTestId('accion-volver-a-la-lista'));
    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${ana.id}`));

    expect(screen.getByTestId('campo-nota').props.value).toBe('Turno de tarde');
  });

  it('el teléfono y el email se guardan igual', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });
    const ana = empleadoLlamado(datos, 'Ana');
    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${ana.id}`));

    await fireEvent.changeText(screen.getByTestId('campo-telefono'), '605858525');
    await fireEvent.changeText(screen.getByTestId('campo-email'), 'prueba@ejemplo.es');

    expect(datos.leerEmpleado(ana.id)?.telefono).toBe('605858525');
    expect(datos.leerEmpleado(ana.id)?.email).toBe('prueba@ejemplo.es');
  });
});

describe('La barra de navegación del móvil no tapa ninguna acción', () => {
  it('el panel de empleados aparta sus acciones de la barra', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICAS_CON_BARRA}>
        <PanelDeEmpleados />
      </SafeAreaProvider>,
    );

    expect(margenInferiorDe(screen.getByTestId('pantalla-empleados'))).toBeGreaterThanOrEqual(
      MARGEN_INFERIOR,
    );
  });

  it('la leyenda del cuadrante se aparta de la barra', async () => {
    await renderizarCuadrante({ areaSegura: METRICAS_CON_BARRA });

    expect(margenInferiorDe(screen.getByTestId('leyenda-etiquetas'))).toBeGreaterThanOrEqual(
      MARGEN_INFERIOR,
    );
  });

  it('la ficha del empleado aparta la acción de baja de la barra', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: ['Ana'],
      areaSegura: METRICAS_CON_BARRA,
    });
    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Ana').id}`));

    const scroll = screen.getByTestId('scroll-de-la-ficha');
    const margen = estiloCombinado({ props: { style: scroll.props.contentContainerStyle } })
      .paddingBottom;
    expect(Number(margen)).toBeGreaterThanOrEqual(MARGEN_INFERIOR);
  });

  it('sin barra de navegación no se añade aire de más', async () => {
    await renderizarCuadrante({ plantilla: ['Ana'] });

    // El mock devuelve márgenes a cero cuando no hay barra: solo queda el aire propio.
    expect(margenInferiorDe(screen.getByTestId('leyenda-etiquetas'))).toBeLessThan(MARGEN_INFERIOR);
  });
});

describe('La plantilla completa se alcanza con scroll', () => {
  it('con 20 empleados la rejilla no crece más allá de la pantalla', async () => {
    const plantilla = Array.from({ length: 20 }, (_, i) => `Empleado ${String(i).padStart(2, '0')}`);
    await renderizarCuadrante({ plantilla });

    const scroll = screen.getByTestId('scroll-plantilla');
    // La plantilla vive dentro del scroll vertical, no debajo de la pantalla.
    expect(scroll.props.horizontal).toBeFalsy();
    expect(estiloCombinado(scroll).flex).toBe(1);
    expect(screen.getAllByTestId(/^fila-empleado-/)).toHaveLength(20);
  });

  it('la rejilla no le come el sitio a la leyenda', async () => {
    await renderizarCuadrante({ plantilla: ['Ana'] });

    // La leyenda es hermana de la rejilla, no parte de su scroll: sigue visible.
    expect(screen.getByTestId('leyenda-etiquetas')).toBeTruthy();
    expect(estiloCombinado(screen.getByTestId('rejilla-cuadrante')).flex).toBe(1);
  });
});
