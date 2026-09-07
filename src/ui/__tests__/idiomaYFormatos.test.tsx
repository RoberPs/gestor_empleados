import { fireEvent, screen, within } from '@testing-library/react-native';

import { diasDeLaSemana } from '../../dominio/semana';
import { hora, LUNES, renderizarCuadrante } from '../../pruebas/ayudas';

const DIAS = diasDeLaSemana({ lunes: LUNES });

/** Todo el texto que la pantalla muestra ahora mismo, recorriendo el árbol pintado. */
function textosEnPantalla(): string[] {
  const textos: string[] = [];

  const recorrer = (nodo: unknown): void => {
    if (typeof nodo === 'string') {
      const texto = nodo.trim();
      if (texto.length > 0) textos.push(texto);
      return;
    }
    if (Array.isArray(nodo)) {
      nodo.forEach(recorrer);
      return;
    }
    if (nodo && typeof nodo === 'object' && 'children' in nodo) {
      recorrer((nodo as { children: unknown }).children);
    }
  };

  recorrer(screen.toJSON());
  return textos;
}

describe('Idioma y formatos de la pantalla', () => {
  it('Formatos de la pantalla', async () => {
    await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados()[0];
        datos.crearTurno(ana.id, LUNES, hora(21), hora(2));
      },
    });

    // Los textos de la pantalla están en español de España.
    expect(screen.getByTestId('cabecera-dia-2026-09-09')).toHaveTextContent(/Miércoles/);
    expect(screen.getByTestId('indicacion-semana-en-curso')).toHaveTextContent('Semana en curso');

    // La primera columna es el lunes y la última el domingo.
    const dias = screen
      .getAllByTestId(/^cabecera-dia-/)
      .map((nodo) => String(nodo.props.testID).replace('cabecera-dia-', ''));
    expect(dias[0]).toBe(LUNES);
    expect(dias[6]).toBe('2026-09-13');

    // Las horas en formato 24h, nunca 9:00 PM.
    expect(screen.getByText('21:00')).toBeTruthy();
    expect(screen.getByText('02:00')).toBeTruthy();
    expect(screen.queryByText(/AM|PM/)).toBeNull();

    // Las fechas del rango de la semana como dd/mm/aaaa.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
  });

  it('las únicas abreviaturas de la pantalla son AUS y VAC, y solo dentro de la celda', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados()[0];
        datos.marcarAusencia(ana.id, DIAS[0]);
        datos.marcarVacaciones(ana.id, DIAS[1]);
      },
    });

    const abreviaturas = textosEnPantalla().filter((texto) => /^[A-ZÁÉÍÓÚÑ]{2,4}$/.test(texto));
    expect(new Set(abreviaturas)).toEqual(new Set(['AUS', 'VAC']));

    // En las acciones de celda se usan siempre las palabras completas.
    await fireEvent.press(screen.getByTestId(`celda-${empleado('Ana').id}-${DIAS[1]}`));

    const acciones = within(screen.getByTestId('acciones-de-celda'));
    expect(acciones.getByText('Cambiar a ausencia')).toBeTruthy();
    expect(acciones.getByText('Sustituir por un turno planificado')).toBeTruthy();
    expect(acciones.getByText('Eliminar las vacaciones')).toBeTruthy();
    expect(acciones.queryByText(/\bAUS\b/)).toBeNull();
    expect(acciones.queryByText(/\bVAC\b/)).toBeNull();
  });

  it('no hay ningún literal en otro idioma en la pantalla', async () => {
    await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.crearTurno(datos.listarEmpleados()[0].id, LUNES, hora(9), hora(17)),
    });

    const textoCompleto = textosEnPantalla().join(' ');

    for (const palabra of [
      'Monday',
      'Week',
      'Employee',
      'Shift',
      'Holiday',
      'Delete',
      'Cancel',
      'Save',
      'Next',
      'Previous',
    ]) {
      expect(textoCompleto).not.toMatch(new RegExp(`\\b${palabra}\\b`, 'i'));
    }
  });
});
