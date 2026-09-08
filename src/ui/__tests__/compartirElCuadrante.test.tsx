/**
 * La acción de compartir en la pantalla del cuadrante.
 *
 * Lo que se comprueba aquí es de la pantalla: dónde está la acción, en qué semanas
 * se ofrece, en cuál no, y que al terminar o al desistir el encargado sigue en la
 * misma semana. Lo que el documento contiene se comprueba en
 * `src/exportacion/__tests__`, y que el PDF se abra y se lea, en el dispositivo.
 */

import { act, fireEvent, screen } from '@testing-library/react-native';

import { renderizarCuadrante } from '../../pruebas/ayudas';
import { MENSAJE_NO_SE_PUDO_COMPARTIR } from '../../exportacion/compartirElCuadrante';

const mockImprimir = jest.fn();
const mockHayHojaDeCompartir = jest.fn();
const mockCompartir = jest.fn();

jest.mock('expo-print', () => ({
  printToFileAsync: (...argumentos: unknown[]) => mockImprimir(...argumentos),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockHayHojaDeCompartir(),
  shareAsync: (...argumentos: unknown[]) => mockCompartir(...argumentos),
}));

jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///data/app/cache' } },
  File: class {
    uri: string;
    exists = false;
    constructor(...partes: { uri: string }[] | string[]) {
      this.uri = partes.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
    }
    create() {
      this.exists = true;
    }
    write() {}
  },
}));

/** Los 20 empleados de la escala real del local. */
const VEINTE = Array.from({ length: 20 }, (_, i) => `Empleado ${String(i + 1).padStart(2, '0')}`);

async function tocar(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // El test del fallo lo provoca a propósito, y el módulo deja constancia de él en
  // el terminal. Aquí esa constancia solo sería ruido.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockImprimir.mockResolvedValue({
    uri: 'file:///cache/Print/aa11bb22.pdf',
    base64: 'JVBERi0xLjcKJUNVQURSQU5URQ==',
  });
  mockHayHojaDeCompartir.mockResolvedValue(true);
  mockCompartir.mockResolvedValue(undefined);
});

describe('Exportar la semana desde el cuadrante', () => {
  it('Compartir la semana que se está viendo', async () => {
    await renderizarCuadrante();

    // El encargado se desplaza a la semana 14/09/2026 - 20/09/2026.
    await tocar('accion-semana-siguiente');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');

    await tocar('accion-compartir-la-semana');

    // Se comparte el cuadrante de esa semana, no el de la semana en curso.
    const html = mockImprimir.mock.calls[0][0].html as string;
    expect(html).toContain('14/09/2026 - 20/09/2026');
    expect(mockCompartir).toHaveBeenCalledTimes(1);

    // Y al terminar ve de nuevo el cuadrante en esa misma semana.
    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    expect(screen.queryByTestId('aviso-de-la-exportacion')).toBeNull();
  });

  it('Compartir una semana ya pasada', async () => {
    await renderizarCuadrante();

    for (let i = 0; i < 3; i++) await tocar('accion-semana-anterior');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('17/08/2026 - 23/08/2026');

    // Se le sigue ofreciendo, y no se le pide ninguna confirmación adicional.
    expect(screen.getByTestId('accion-compartir-la-semana')).toBeTruthy();
    await tocar('accion-compartir-la-semana');

    expect(screen.queryByTestId('confirmacion-eliminar')).toBeNull();
    expect(mockCompartir).toHaveBeenCalledTimes(1);
    expect(mockImprimir.mock.calls[0][0].html).toContain('17/08/2026 - 23/08/2026');
  });

  it('la acción está siempre ahí, con un solo toque y en cualquier semana', async () => {
    await renderizarCuadrante();

    // En la semana en curso.
    expect(screen.getByTestId('accion-compartir-la-semana')).toBeTruthy();
    await tocar('accion-semana-siguiente');
    // Y en una futura.
    expect(screen.getByTestId('accion-compartir-la-semana')).toBeTruthy();

    // Un solo toque: no hay ningún menú ni paso intermedio antes de compartir.
    await tocar('accion-compartir-la-semana');
    expect(mockCompartir).toHaveBeenCalledTimes(1);
  });

  it('El estado vacío no ofrece compartir', async () => {
    await renderizarCuadrante({ plantilla: [] });

    expect(screen.getByTestId('estado-vacio')).toBeTruthy();
    expect(screen.queryByTestId('accion-compartir-la-semana')).toBeNull();
    // Lo que sí se le ofrece es dar de alta al primer empleado.
    expect(screen.getByTestId('accion-dar-de-alta-primer-empleado')).toBeTruthy();
  });

  it('Desistir de compartir: vuelve al cuadrante sin error', async () => {
    // La hoja del sistema se cierra sin elegir nada.
    mockCompartir.mockResolvedValue(undefined);
    await renderizarCuadrante();
    await tocar('accion-semana-siguiente');

    await tocar('accion-compartir-la-semana');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    expect(screen.queryByTestId('aviso-de-la-exportacion')).toBeNull();
  });

  it('La exportación falla: se le dice en lenguaje corriente y sigue en su semana', async () => {
    mockImprimir.mockRejectedValue(new Error('ExponentPrint: ENOENT /cache/Print'));
    await renderizarCuadrante();
    await tocar('accion-semana-anterior');

    await tocar('accion-compartir-la-semana');

    expect(screen.getByTestId('mensaje-de-la-exportacion')).toHaveTextContent(
      MENSAJE_NO_SE_PUDO_COMPARTIR,
    );
    // Nada técnico: ni módulo, ni código, ni ruta.
    const mostrado = screen.getByTestId('mensaje-de-la-exportacion').props.children as string;
    expect(mostrado).not.toMatch(/expo|Print|ENOENT|Error|[/\\]|\.pdf/i);

    // Y sigue en el cuadrante, en la misma semana.
    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');

    // El aviso se cierra y no queda nada por en medio.
    await tocar('accion-cerrar-el-aviso');
    expect(screen.queryByTestId('aviso-de-la-exportacion')).toBeNull();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');
  });

  it('La acción de compartir no descoloca la rejilla', async () => {
    // La plantilla completa, a la anchura mínima soportada.
    const { empleado } = await renderizarCuadrante({ plantilla: VEINTE });

    // La acción es visible y pulsable, con el área mínima de 44 puntos.
    const accion = screen.getByTestId('accion-compartir-la-semana');
    expect(accion).toBeTruthy();
    const estilo = [accion.props.style].flat(Infinity).filter(Boolean) as Record<string, number>[];
    const combinado = Object.assign({}, ...estilo) as Record<string, number>;
    expect(combinado.minHeight).toBe(44);
    expect(combinado.minWidth).toBe(44);

    // Las siete columnas de día siguen viéndose a la vez, sin scroll horizontal.
    expect(screen.getAllByTestId(/^cabecera-dia-/)).toHaveLength(7);
    expect(screen.getByTestId('scroll-plantilla').props.horizontal).toBeFalsy();

    // Y se ven tantas filas de empleado como antes de existir la acción: entró en
    // la fila de navegación, que ya medía lo que mide un botón, así que la cabecera
    // no ha ganado ni una fila ni un punto de alto.
    expect(screen.getAllByTestId(/^fila-empleado-/)).toHaveLength(20);
    expect(screen.getByTestId(`fila-empleado-${empleado('Empleado 20').id}`)).toBeTruthy();
  });

  it('la acción de compartir no le come el ancho a las de navegación', async () => {
    await renderizarCuadrante({ plantilla: VEINTE });

    // Es un icono y no una palabra: con las tres palabras, a 360 puntos Android
    // truncaba las tres —«Semana ant…», «Comp…», «Semana sigu…»—.
    expect(screen.getByTestId('icono-de-compartir')).toBeTruthy();
    expect(screen.queryByText('Compartir')).toBeNull();
    // Y quien no ve el icono oye la acción entera.
    expect(screen.getByTestId('accion-compartir-la-semana').props.accessibilityLabel).toBe(
      'Compartir la semana',
    );

    // Los dos textos de navegación siguen ahí, enteros y a una sola línea: no
    // pueden partirse y empujar la rejilla hacia abajo.
    for (const texto of ['Semana anterior', 'Semana siguiente']) {
      expect(screen.getByText(texto).props.numberOfLines).toBe(1);
    }
  });

  it('las acciones de navegación entre semanas no han cambiado', async () => {
    await renderizarCuadrante();

    // Siguen donde estaban y hacen lo mismo, con la acción de compartir entre ellas.
    await tocar('accion-semana-siguiente');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    await tocar('accion-volver-a-la-semana-en-curso');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    await tocar('accion-semana-anterior');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');

    // Y compartir no mueve la semana ni un día.
    await tocar('accion-compartir-la-semana');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');
  });
});
