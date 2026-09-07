import { screen, within } from '@testing-library/react-native';

import { diasDeLaSemana } from '../../dominio/semana';
import { estiloCombinado, hora, JUEVES, LUNES, MARTES, renderizarCuadrante, VIERNES, SABADO } from '../../pruebas/ayudas';

const DIAS = diasDeLaSemana({ lunes: LUNES });

function celdaDe(idEmpleado: string, dia: string) {
  return screen.getByTestId(`celda-${idEmpleado}-${dia}`);
}

describe('Contenido observable de una celda', () => {
  it('Ver un turno planificado en su celda', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (datos) => {
        const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
        datos.crearTurno(bruno.id, JUEVES, hora(9), hora(17));
      },
    });

    const celda = celdaDe(empleado('Bruno').id, JUEVES);

    expect(within(celda).getByText('09:00')).toBeTruthy();
    expect(within(celda).getByText('17:00')).toBeTruthy();
  });

  it('Ver un turno partido en su celda', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados()[0];
        // Se dan de alta en orden inverso: la celda debe mostrarlos ordenados.
        datos.crearTurno(ana.id, LUNES, hora(20), hora(0));
        datos.crearTurno(ana.id, LUNES, hora(12), hora(16));
      },
    });

    const celda = celdaDe(empleado('Ana').id, LUNES);
    const horas = within(celda)
      .getAllByText(/^\d{2}:\d{2}$/)
      .map((nodo) => nodo.props.children);

    // Los dos pares de horas, completos y en orden de hora de inicio ascendente.
    expect(horas).toEqual(['12:00', '16:00', '20:00', '00:00']);
    // Ningún indicador de contenido oculto.
    expect(within(celda).queryByText(/\+|más|\.\.\./)).toBeNull();
  });

  it('Ver un turno que cruza la medianoche', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Bruno'],
      prepararDatos: (datos) => {
        const bruno = datos.listarEmpleados()[0];
        datos.crearTurno(bruno.id, VIERNES, hora(20), hora(2));
      },
    });
    const bruno = empleado('Bruno');

    const viernes = celdaDe(bruno.id, VIERNES);
    expect(within(viernes).getByText('20:00')).toBeTruthy();
    expect(within(viernes).getByText('02:00')).toBeTruthy();

    // El día siguiente no se marca ni se continúa.
    const sabado = celdaDe(bruno.id, SABADO);
    expect(within(sabado).getByTestId('celda-vacia')).toBeTruthy();
    expect(within(sabado).queryByText(/\d{2}:\d{2}/)).toBeNull();
  });

  it('Ver una celda de vacaciones', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.marcarVacaciones(datos.listarEmpleados()[0].id, MARTES),
    });

    const celda = celdaDe(empleado('Ana').id, MARTES);

    expect(within(celda).getByText('VAC')).toBeTruthy();
    expect(within(celda).queryByText(/\d{2}:\d{2}/)).toBeNull();
    // Se distingue de una celda vacía por el texto, no solo por el color.
    expect(within(celda).queryByTestId('celda-vacia')).toBeNull();
  });

  it('Ver una celda de ausencia', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (datos) => {
        const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
        const ana = datos.listarEmpleados().find((e) => e.nombre === 'Ana')!;
        datos.marcarAusencia(bruno.id, VIERNES);
        datos.marcarVacaciones(ana.id, VIERNES);
      },
    });

    const ausencia = celdaDe(empleado('Bruno').id, VIERNES);
    const vacaciones = celdaDe(empleado('Ana').id, VIERNES);

    expect(within(ausencia).getByText('AUS')).toBeTruthy();
    expect(within(vacaciones).getByText('VAC')).toBeTruthy();

    // Se distinguen entre sí por su texto y por su borde, no solo por el color.
    const estiloAusencia = estiloCombinado(within(ausencia).getByText('AUS'));
    const estiloVacaciones = estiloCombinado(within(vacaciones).getByText('VAC'));
    expect(estiloAusencia.borderStyle).not.toBe(estiloVacaciones.borderStyle);
  });

  it('La leyenda explica las etiquetas de la celda', async () => {
    await renderizarCuadrante();

    const leyenda = screen.getByTestId('leyenda-etiquetas');

    expect(leyenda).toHaveTextContent(/AUS = Ausencia/);
    expect(leyenda).toHaveTextContent(/VAC = Vacaciones/);
    // Fuera de la rejilla que hace scroll: se ve sin desplazarse.
    expect(within(screen.getByTestId('scroll-plantilla')).queryByTestId('leyenda-etiquetas')).toBeNull();
  });

  it('Semana sin ningún turno planificado', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana', 'Bruno'] });

    expect(screen.getAllByTestId(/^fila-empleado-/)).toHaveLength(2);
    expect(screen.getAllByTestId('celda-vacia')).toHaveLength(2 * 7);

    for (const dia of DIAS) {
      const celda = celdaDe(empleado('Ana').id, dia);
      expect(within(celda).getByTestId('celda-vacia')).toBeTruthy();
      // Sigue siendo pulsable.
      expect(celda.props.onClick ?? celda.props.onStartShouldSetResponder).toBeTruthy();
    }
  });

  it('La pantalla no valora el cumplimiento normativo', async () => {
    await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados()[0];
        for (const dia of DIAS) datos.crearTurno(ana.id, dia, hora(9), hora(21));
      },
    });

    // Los turnos se muestran tal cual, sin aviso ni advertencia de ningún tipo.
    expect(screen.getAllByText('09:00')).toHaveLength(7);
    expect(screen.queryByText(/jornada|descanso|convenio|normativa|límite|aviso|advertencia/i)).toBeNull();
  });

  it('la celda nunca muestra horas realmente trabajadas', async () => {
    await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.crearTurno(datos.listarEmpleados()[0].id, LUNES, hora(9), hora(17)),
    });

    expect(screen.queryByText(/trabajad/i)).toBeNull();
    expect(screen.queryByText(/registrad/i)).toBeNull();
    expect(screen.queryByText(/fichaj/i)).toBeNull();
  });
});
