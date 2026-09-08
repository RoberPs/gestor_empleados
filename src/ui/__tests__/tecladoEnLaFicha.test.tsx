/**
 * El teclado no tapa el campo que se está escribiendo.
 *
 * Con edge-to-edge, Android ya no encoge la ventana al abrir el teclado: lo pinta
 * por encima. La ficha reserva su alto a mano en el `paddingBottom` del contenido
 * del scroll, y lo retira al cerrarse. Lo que aquí se comprueba es exactamente eso:
 * que el hueco está declarado con el teclado abierto y no lo está con él cerrado.
 * Que el campo se lea de verdad por encima del teclado solo se ve mirando la
 * pantalla, y queda anotado en `docs/verificacion-manual.md`.
 */

import { act, fireEvent, screen } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import { empleadoLlamado, estiloCombinado, renderizarPanelDeEmpleados } from '../../pruebas/ayudas';
import {
  MOTIVO_FECHA_ILEGIBLE,
  PISTA_DE_FECHA_FIN,
  PISTA_DE_FECHA_INICIO,
} from '../VacacionesDeLaFicha';

const ALTO_DEL_TECLADO = 320;

/** Los oyentes que la ficha registró, para poder simular el teclado del dispositivo. */
function espiarElTeclado(): {
  abrir: () => Promise<void>;
  cerrar: () => Promise<void>;
} {
  const oyentes = new Map<string, Array<(evento: unknown) => void>>();

  jest.spyOn(Keyboard, 'addListener').mockImplementation(((
    tipo: string,
    oyente: (evento: unknown) => void,
  ) => {
    oyentes.set(tipo, [...(oyentes.get(tipo) ?? []), oyente]);
    return { remove: () => {} };
  }) as unknown as typeof Keyboard.addListener);

  const avisar = async (tipo: string, evento: unknown) => {
    await act(async () => {
      (oyentes.get(tipo) ?? []).forEach((oyente) => oyente(evento));
    });
  };

  return {
    abrir: () =>
      avisar('keyboardDidShow', { endCoordinates: { height: ALTO_DEL_TECLADO } }),
    cerrar: () => avisar('keyboardDidHide', {}),
  };
}

/** El hueco que el contenido del scroll de la ficha está reservando ahora mismo. */
function huecoAlFinalDelContenido(): number {
  const scroll = screen.getByTestId('scroll-de-la-ficha');
  const estilo = estiloCombinado({ props: { style: scroll.props.contentContainerStyle } });
  return Number(estilo.paddingBottom);
}

async function abrirLaFichaDeBruno() {
  const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
  await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`));
  return datos;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('El teclado no tapa el campo que se está escribiendo', () => {
  it('Escribir en la nota con el teclado abierto', async () => {
    const teclado = espiarElTeclado();
    await abrirLaFichaDeBruno();
    const sinTeclado = huecoAlFinalDelContenido();

    // El encargado toca el campo de la nota y se abre el teclado.
    await fireEvent(screen.getByTestId('campo-nota'), 'focus', { target: 7 });
    await teclado.abrir();

    // El contenido reserva el alto del teclado: la nota no queda debajo de él.
    expect(huecoAlFinalDelContenido()).toBe(sinTeclado + ALTO_DEL_TECLADO);

    // Y sigue reservado mientras escribe varias líneas.
    await fireEvent.changeText(screen.getByTestId('campo-nota'), 'Una línea\nY otra\nY otra más');
    expect(huecoAlFinalDelContenido()).toBe(sinTeclado + ALTO_DEL_TECLADO);
    expect(screen.getByTestId('campo-nota').props.value).toBe('Una línea\nY otra\nY otra más');
  });

  it('Escribir en el motivo de la ausencia con el teclado abierto', async () => {
    const teclado = espiarElTeclado();
    await abrirLaFichaDeBruno();
    const sinTeclado = huecoAlFinalDelContenido();

    // El motivo es el último campo de texto de la ficha: es el que más abajo queda.
    await fireEvent(screen.getByTestId('campo-motivo-ausencia'), 'focus', { target: 9 });
    await teclado.abrir();

    expect(huecoAlFinalDelContenido()).toBe(sinTeclado + ALTO_DEL_TECLADO);
    await fireEvent.changeText(screen.getByTestId('campo-motivo-ausencia'), 'Baja médica');
    expect(huecoAlFinalDelContenido()).toBe(sinTeclado + ALTO_DEL_TECLADO);
  });

  it('Al cerrar el teclado la ficha recupera su sitio', async () => {
    const teclado = espiarElTeclado();
    await abrirLaFichaDeBruno();
    const sinTeclado = huecoAlFinalDelContenido();

    await teclado.abrir();
    expect(huecoAlFinalDelContenido()).toBeGreaterThan(sinTeclado);

    await teclado.cerrar();

    // El hueco se retira entero: no queda ninguna franja en blanco al final.
    expect(huecoAlFinalDelContenido()).toBe(sinTeclado);
  });

  it('el primer toque fuera del campo con el teclado abierto ejecuta la acción tocada', async () => {
    const teclado = espiarElTeclado();
    await abrirLaFichaDeBruno();

    await fireEvent(screen.getByTestId('campo-nota'), 'focus', { target: 7 });
    await teclado.abrir();

    // Sin `keyboardShouldPersistTaps`, este primer toque se gastaría cerrando el
    // teclado y habría que tocar dos veces.
    expect(screen.getByTestId('scroll-de-la-ficha').props.keyboardShouldPersistTaps).toBe('handled');

    await fireEvent.press(screen.getByTestId('accion-dar-de-baja'));
    expect(screen.getByText(/¿Dar de baja a Bruno\?/)).toBeTruthy();
  });

  it('todos los campos de la ficha llevan el scroll hasta sí mismos al enfocarse', async () => {
    await abrirLaFichaDeBruno();

    for (const campo of [
      'campo-nombre',
      'campo-puesto',
      'campo-telefono',
      'campo-email',
      'campo-nota',
      'campo-motivo-ausencia',
    ]) {
      expect(typeof screen.getByTestId(campo).props.onFocus).toBe('function');
    }
  });
});

describe('La pista de escritura de una fecha coincide con lo que se puede teclear', () => {
  it('La pista de la fecha se puede teclear con el teclado que se abre', async () => {
    const datos = await abrirLaFichaDeBruno();
    expect(datos).toBeTruthy();

    await fireEvent.press(screen.getByTestId('accion-anadir-rango'));

    const inicio = screen.getByTestId('campo-fecha-de-inicio');
    const fin = screen.getByTestId('campo-fecha-de-fin');

    // El campo abre el teclado numérico, que en Android no ofrece la barra.
    expect(inicio.props.keyboardType).toBe('numeric');
    expect(fin.props.keyboardType).toBe('numeric');
    // Así que la pista solo lleva caracteres que ese teclado sí ofrece.
    expect(inicio.props.placeholder).toMatch(/^\d+$/);
    expect(fin.props.placeholder).toMatch(/^\d+$/);

    // Y la fecha se puede escribir siguiendo esa pista, sin cambiar de teclado.
    await fireEvent.changeText(inicio, PISTA_DE_FECHA_INICIO);
    await fireEvent.changeText(fin, PISTA_DE_FECHA_FIN);
    await fireEvent.press(screen.getByTestId('accion-guardar-rango'));

    expect(screen.queryByTestId('motivo-rango-no-se-guarda')).toBeNull();
    expect(screen.getByTestId('fechas-del-rango-2026-09-10')).toHaveTextContent(
      '10/09/2026 - 14/09/2026',
    );
  });

  it('la explicación de una fecha ilegible empieza por la forma que sí se puede teclear', async () => {
    // El mensaje sigue admitiendo las demás formas, pero la primera que se lee es la
    // única que el teclado numérico permite escribir entera.
    expect(MOTIVO_FECHA_ILEGIBLE).toMatch(/Valen 07092026/);
  });
});
