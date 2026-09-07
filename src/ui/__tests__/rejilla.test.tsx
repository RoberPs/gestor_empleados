import { act, fireEvent, screen, within } from '@testing-library/react-native';

import { diasDeLaSemana } from '../../dominio/semana';
import { ANCHO_MINIMO_SOPORTADO, LADO_PULSABLE_MINIMO, repartirAnchos } from '../medidas';
import { anchoDe, estiloCombinado, hora, renderizarCuadrante } from '../../pruebas/ayudas';

const DIAS = diasDeLaSemana({ lunes: '2026-09-07' });

describe('Rejilla de empleados por días', () => {
  it('La semana completa se ve sin scroll horizontal', async () => {
    await renderizarCuadrante();

    for (const dia of DIAS) {
      expect(screen.getByTestId(`cabecera-dia-${dia}`)).toBeTruthy();
    }
    // El único scroll de la rejilla es el vertical de la plantilla.
    expect(screen.getByTestId('scroll-plantilla').props.horizontal).toBeFalsy();
  });

  it('Cabeceras de día con su fecha', async () => {
    await renderizarCuadrante();

    const primera = screen.getByTestId('cabecera-dia-2026-09-07');
    const ultima = screen.getByTestId('cabecera-dia-2026-09-13');

    expect(primera).toHaveTextContent(/Lunes/);
    expect(primera).toHaveTextContent(/07/);
    expect(ultima).toHaveTextContent(/Domingo/);
    expect(ultima).toHaveTextContent(/13/);
  });

  it('las siete columnas van de lunes a domingo en ese orden', async () => {
    await renderizarCuadrante();

    const fechas = screen
      .getAllByTestId(/^cabecera-dia-/)
      .map((nodo) => String(nodo.props.testID).replace('cabecera-dia-', ''));

    expect(fechas).toEqual(DIAS);
  });

  it('Un nombre largo se trunca sin estrechar los días', async () => {
    const nombreLargo = 'Bartolomé Buenaventura de la Concepción';
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana', nombreLargo] });

    const nombre = screen.getByTestId(`nombre-empleado-${empleado(nombreLargo).id}`);
    expect(nombre.props.numberOfLines).toBe(1);
    expect(nombre.props.ellipsizeMode).toBe('tail');

    const anchos = repartirAnchos(ANCHO_MINIMO_SOPORTADO);
    for (const dia of DIAS) {
      expect(anchoDe(screen.getByTestId(`cabecera-dia-${dia}`))).toBe(anchos.dia);
    }
  });

  it('la fila del empleado muestra solo el nombre: nunca teléfono ni email', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });

    expect(screen.getByTestId(`nombre-empleado-${empleado('Ana').id}`)).toHaveTextContent('Ana');
    expect(screen.queryByText(/@/)).toBeNull();
    expect(screen.queryByText(/\d{9}/)).toBeNull();
    expect(screen.queryByText(/teléfono/i)).toBeNull();
    expect(screen.queryByText(/email/i)).toBeNull();
  });

  it('Un empleado borrado desaparece también de las semanas pasadas', async () => {
    const { datos, empleado } = await renderizarCuadrante({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (datos) => {
        const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
        datos.crearTurno(bruno.id, '2026-09-01', hora(9), hora(17));
      },
    });
    const bruno = empleado('Bruno');
    expect(screen.getByTestId(`fila-empleado-${bruno.id}`)).toBeTruthy();

    await act(async () => datos.borrarEmpleado(bruno.id));

    expect(screen.queryByTestId(`fila-empleado-${bruno.id}`)).toBeNull();
    // Tampoco en una semana pasada en la que tenía turnos planificados.
    await fireEvent.press(screen.getByTestId('accion-semana-anterior'));
    expect(screen.queryByTestId(`fila-empleado-${bruno.id}`)).toBeNull();
  });
});

describe('La plantilla completa es alcanzable y legible', () => {
  it('El cuadrante en la pantalla más estrecha soportada: a 360 puntos ninguna columna de día baja de 44', () => {
    const anchos = repartirAnchos(ANCHO_MINIMO_SOPORTADO);

    expect(anchos.dia).toBeGreaterThanOrEqual(LADO_PULSABLE_MINIMO);
    expect(anchos.nombres).toBeGreaterThan(0);
    expect(anchos.nombres + anchos.dia * 7).toBe(ANCHO_MINIMO_SOPORTADO);
  });

  it('por debajo del ancho mínimo soportado el reparto no encoge las columnas de día', () => {
    expect(repartirAnchos(320).dia).toBe(repartirAnchos(ANCHO_MINIMO_SOPORTADO).dia);
  });

  it('en pantallas más anchas los días crecen y la columna de nombres se ensancha', () => {
    const estrecha = repartirAnchos(ANCHO_MINIMO_SOPORTADO);
    const ancha = repartirAnchos(430);

    expect(ancha.dia).toBeGreaterThan(LADO_PULSABLE_MINIMO);
    expect(ancha.nombres).toBeGreaterThan(estrecha.nombres);
  });

  it('Ver el cuadrante con 20 empleados en plantilla: 20 filas dentro del scroll vertical y celdas de 44 × 44 puntos', async () => {
    const plantilla = Array.from(
      { length: 20 },
      (_, i) => `Empleado ${String(i + 1).padStart(2, '0')}`,
    );
    const { empleado } = await renderizarCuadrante({ plantilla });

    expect(screen.getAllByTestId(/^fila-empleado-/)).toHaveLength(20);

    const celda = screen.getByTestId(`celda-${empleado('Empleado 20').id}-2026-09-07`);
    const estilo = estiloCombinado(celda);
    expect(estilo.minWidth).toBe(LADO_PULSABLE_MINIMO);
    expect(estilo.minHeight).toBe(LADO_PULSABLE_MINIMO);
    expect(screen.getByTestId('scroll-plantilla').props.horizontal).toBeFalsy();
  });

  it('La cabecera de días acompaña al scroll vertical: queda fuera del scroll de la plantilla', async () => {
    await renderizarCuadrante();

    const scroll = screen.getByTestId('scroll-plantilla');

    expect(within(scroll).queryByTestId('cabecera-de-dias')).toBeNull();
    expect(screen.getByTestId('cabecera-de-dias')).toBeTruthy();
  });
});
