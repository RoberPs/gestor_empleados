/**
 * Elegir a dónde va la semana exportada, desde la pantalla del cuadrante.
 *
 * Lo que se comprueba aquí es de la pantalla: que el icono lleve a los dos destinos,
 * que se pueda cerrar sin exportar nada, que guardar le diga al encargado que su
 * documento ha quedado guardado —lo único que no deja ninguna señal en la pantalla— y
 * que al terminar siga en la misma semana. Que el selector de carpetas se abra de
 * verdad solo se comprueba con el móvil delante.
 */

import { act, fireEvent, screen } from '@testing-library/react-native';

import { MENSAJE_GUARDADO, MENSAJE_NO_SE_PUDO_GUARDAR } from '../../exportacion/compartirElCuadrante';
import { renderizarCuadrante } from '../../pruebas/ayudas';

const CARPETA_ELEGIDA = 'content://com.android.providers.downloads/tree/descargas';

const mockImprimir = jest.fn();
const mockCompartir = jest.fn();
const mockPedirCarpeta = jest.fn();
const mockEscribir = jest.fn();

jest.mock('expo-print', () => ({
  printToFileAsync: (...argumentos: unknown[]) => mockImprimir(...argumentos),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => Promise.resolve(true),
  shareAsync: (...argumentos: unknown[]) => mockCompartir(...argumentos),
}));

jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///data/app/cache' } },
  File: class {
    uri: string;
    constructor(...partes: { uri: string }[] | string[]) {
      this.uri = partes.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
    }
    create() {}
    write() {}
  },
  Directory: {
    pickDirectoryAsync: () => mockPedirCarpeta(),
  },
}));

async function tocar(testID: string) {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockImprimir.mockResolvedValue({
    uri: 'file:///cache/Print/aa11bb22.pdf',
    base64: 'JVBERi0xLjcKJUNVQURSQU5URQ==',
  });
  mockCompartir.mockResolvedValue(undefined);
  mockPedirCarpeta.mockResolvedValue({
    uri: CARPETA_ELEGIDA,
    createFile: (nombre: string) => ({
      uri: `${CARPETA_ELEGIDA}/${nombre}`,
      write: (contenido: string) => mockEscribir(nombre, contenido),
    }),
  });
});

describe('Exportar la semana desde el cuadrante', () => {
  it('Guardar la semana que se está viendo', async () => {
    await renderizarCuadrante();

    await tocar('accion-semana-siguiente');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');

    await tocar('accion-exportar-la-semana');
    await tocar('accion-guardar-el-cuadrante');

    // Se guarda el cuadrante de esa semana, no el de la semana en curso.
    const html = mockImprimir.mock.calls[0][0].html as string;
    expect(html).toContain('14/09/2026 - 20/09/2026');
    expect(mockEscribir).toHaveBeenCalledTimes(1);
    // Y no se compartió nada: son dos destinos distintos.
    expect(mockCompartir).not.toHaveBeenCalled();

    // Se le dice que ha quedado guardado, sin ninguna ruta de fichero.
    expect(screen.getByTestId('mensaje-de-la-exportacion')).toHaveTextContent(MENSAJE_GUARDADO);
    const mostrado = screen.getByTestId('mensaje-de-la-exportacion').props.children as string;
    expect(mostrado).not.toMatch(/content:|file:|[/\\]|\.pdf/i);

    // Al cerrar el aviso sigue en el cuadrante, en esa misma semana.
    await tocar('accion-cerrar-el-aviso');
    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
  });

  it('Desistir de exportar sin elegir destino', async () => {
    await renderizarCuadrante();
    await tocar('accion-semana-anterior');

    await tocar('accion-exportar-la-semana');
    expect(screen.getByTestId('destinos-de-exportacion')).toBeTruthy();
    await tocar('accion-cancelar-la-exportacion');

    // Ni se compartió ni se guardó nada, y no se le mostró ningún error.
    expect(mockImprimir).not.toHaveBeenCalled();
    expect(mockCompartir).not.toHaveBeenCalled();
    expect(mockPedirCarpeta).not.toHaveBeenCalled();
    expect(screen.queryByTestId('aviso-de-la-exportacion')).toBeNull();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');
  });

  it('desistir del selector de carpetas tampoco es un error', async () => {
    mockPedirCarpeta.mockRejectedValue(new Error('user cancelled the picker'));
    await renderizarCuadrante();

    await tocar('accion-exportar-la-semana');
    await tocar('accion-guardar-el-cuadrante');

    expect(screen.queryByTestId('aviso-de-la-exportacion')).toBeNull();
    expect(mockEscribir).not.toHaveBeenCalled();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
  });

  it('el guardado falla: se le dice en lenguaje corriente y sigue en su semana', async () => {
    mockPedirCarpeta.mockResolvedValue({
      uri: CARPETA_ELEGIDA,
      createFile: () => {
        throw new Error("EACCES: Missing 'WRITE' permission for content://…/descargas");
      },
    });
    await renderizarCuadrante();
    await tocar('accion-semana-anterior');

    await tocar('accion-exportar-la-semana');
    await tocar('accion-guardar-el-cuadrante');

    expect(screen.getByTestId('mensaje-de-la-exportacion')).toHaveTextContent(
      MENSAJE_NO_SE_PUDO_GUARDAR,
    );
    const mostrado = screen.getByTestId('mensaje-de-la-exportacion').props.children as string;
    expect(mostrado).not.toMatch(/EACCES|content:|Error|[/\\]|\.pdf/i);
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');
  });

  it('los dos destinos se ofrecen en cualquier semana, y ninguno sin plantilla', async () => {
    await renderizarCuadrante();

    // En una semana pasada.
    for (let i = 0; i < 3; i++) await tocar('accion-semana-anterior');
    await tocar('accion-exportar-la-semana');
    expect(screen.getByTestId('accion-compartir-el-cuadrante')).toBeTruthy();
    expect(screen.getByTestId('accion-guardar-el-cuadrante')).toBeTruthy();
    await tocar('accion-cancelar-la-exportacion');

    // Y en una futura.
    for (let i = 0; i < 5; i++) await tocar('accion-semana-siguiente');
    await tocar('accion-exportar-la-semana');
    expect(screen.getByTestId('accion-guardar-el-cuadrante')).toBeTruthy();
  });

  it('El estado vacío no ofrece guardar', async () => {
    await renderizarCuadrante({ plantilla: [] });

    expect(screen.getByTestId('estado-vacio')).toBeTruthy();
    expect(screen.queryByTestId('accion-exportar-la-semana')).toBeNull();
    expect(screen.queryByTestId('accion-guardar-el-cuadrante')).toBeNull();
  });

  it('la hoja de destinos dice de qué semana es', async () => {
    await renderizarCuadrante();
    await tocar('accion-semana-siguiente');

    await tocar('accion-exportar-la-semana');

    expect(screen.getByTestId('destinos-de-exportacion')).toBeTruthy();
    expect(screen.getAllByText('14/09/2026 - 20/09/2026').length).toBeGreaterThan(0);
  });
});
