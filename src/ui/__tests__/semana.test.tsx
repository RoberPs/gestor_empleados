import { fireEvent, screen } from '@testing-library/react-native';

import {
  DOMINGO_POR_LA_NOCHE,
  espiarAppState,
  LUNES_SIGUIENTE_DE_MADRUGADA,
  MIERCOLES_A_LAS_DIEZ,
  renderizarCuadrante,
} from '../../pruebas/ayudas';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('El cuadrante semanal es la pantalla de inicio', () => {
  it('Abrir la app un día cualquiera de la semana: se ve la rejilla del cuadrante, sin pantalla previa', async () => {
    await renderizarCuadrante({ reloj: () => MIERCOLES_A_LAS_DIEZ });

    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    // Ni bienvenida, ni resumen, ni menú.
    expect(screen.queryByTestId('estado-vacio')).toBeNull();
  });

  it('Abrir la app en domingo: la semana es la que termina en ese domingo', async () => {
    await renderizarCuadrante({ reloj: () => DOMINGO_POR_LA_NOCHE });

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(screen.getByTestId('indicacion-semana-en-curso')).toBeTruthy();
  });

  it('La app vuelve a primer plano ya en la semana siguiente', async () => {
    const { volverAPrimerPlano } = espiarAppState();
    let ahora = DOMINGO_POR_LA_NOCHE;
    await renderizarCuadrante({ reloj: () => ahora });

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(screen.getByTestId('indicacion-semana-en-curso')).toBeTruthy();

    // Pasa la medianoche del domingo y el encargado vuelve a la app.
    ahora = LUNES_SIGUIENTE_DE_MADRUGADA;
    await volverAPrimerPlano();

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    expect(screen.getByTestId('indicacion-semana-en-curso')).toBeTruthy();
  });

  it('la semana mostrada no se mueve sola mientras la pantalla sigue en primer plano', async () => {
    let ahora = DOMINGO_POR_LA_NOCHE;
    await renderizarCuadrante({ reloj: () => ahora });

    ahora = LUNES_SIGUIENTE_DE_MADRUGADA;

    // Sin volver a primer plano, el cuadrante sigue donde estaba.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
  });

  it('al volver a primer plano no arrastra al encargado si se había desplazado a otra semana', async () => {
    const { volverAPrimerPlano } = espiarAppState();
    let ahora = DOMINGO_POR_LA_NOCHE;
    await renderizarCuadrante({ reloj: () => ahora });
    await tocar('accion-semana-anterior');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');

    ahora = LUNES_SIGUIENTE_DE_MADRUGADA;
    await volverAPrimerPlano();

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');
    expect(screen.queryByTestId('indicacion-semana-en-curso')).toBeNull();
  });
});

describe('Identificación de la semana en pantalla', () => {
  it('Rango de fechas de la semana visible', async () => {
    await renderizarCuadrante();

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
  });

  it('La semana en curso se distingue de las demás', async () => {
    await renderizarCuadrante();

    expect(screen.getByTestId('indicacion-semana-en-curso')).toHaveTextContent('Semana en curso');

    await tocar('accion-semana-siguiente');

    expect(screen.queryByTestId('indicacion-semana-en-curso')).toBeNull();
  });
});

describe('Navegación entre semanas', () => {
  it('Navegar a la semana anterior', async () => {
    await renderizarCuadrante();

    await tocar('accion-semana-anterior');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');
  });

  it('Navegar a la semana siguiente y volver a la semana en curso', async () => {
    await renderizarCuadrante();

    await tocar('accion-semana-siguiente');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    expect(screen.getByTestId('accion-volver-a-la-semana-en-curso')).toBeTruthy();

    await tocar('accion-volver-a-la-semana-en-curso');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
  });

  it('Regreso desde una semana lejana con un solo toque', async () => {
    await renderizarCuadrante();

    for (let i = 0; i < 5; i++) await tocar('accion-semana-siguiente');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('12/10/2026 - 18/10/2026');

    await tocar('accion-volver-a-la-semana-en-curso');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
  });

  it('la acción de regreso solo se ofrece fuera de la semana en curso', async () => {
    await renderizarCuadrante();

    expect(screen.queryByTestId('accion-volver-a-la-semana-en-curso')).toBeNull();

    await tocar('accion-semana-anterior');

    expect(screen.getByTestId('accion-volver-a-la-semana-en-curso')).toBeTruthy();
  });

  it('no hay límite de semanas hacia atrás ni hacia adelante', async () => {
    await renderizarCuadrante();

    for (let i = 0; i < 60; i++) await tocar('accion-semana-anterior');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/07/2025 - 20/07/2025');
    expect(screen.getByTestId('accion-semana-anterior')).toBeTruthy();
    expect(screen.getByTestId('accion-semana-siguiente')).toBeTruthy();
  });
});
