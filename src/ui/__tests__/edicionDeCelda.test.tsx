import { fireEvent, screen, within } from '@testing-library/react-native';

import { MOTIVO_DURACION_NULA } from '../../dominio/turno';
import { hora, JUEVES, LUNES, MARTES, renderizarCuadrante, VIERNES } from '../../pruebas/ayudas';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function escribirHoras(inicio: string, fin: string) {
  await fireEvent.changeText(screen.getByTestId('campo-hora-de-inicio'), inicio);
  await fireEvent.changeText(screen.getByTestId('campo-hora-de-fin'), fin);
}

async function abrirCelda(idEmpleado: string, dia: string) {
  await fireEvent.press(screen.getByTestId(`celda-${idEmpleado}-${dia}`));
}

function celda(idEmpleado: string, dia: string) {
  return screen.getByTestId(`celda-${idEmpleado}-${dia}`);
}

describe('Toda celda es editable desde el cuadrante', () => {
  it('Crear un turno planificado en una celda vacía', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);

    // Se le ofrece crear turno planificado, marcar ausencia o marcar vacaciones.
    expect(screen.getByTestId('accion-crear-turno')).toBeTruthy();
    expect(screen.getByTestId('accion-marcar-ausencia')).toBeTruthy();
    expect(screen.getByTestId('accion-marcar-vacaciones')).toBeTruthy();

    await tocar('accion-crear-turno');
    await escribirHoras('09:00', '17:00');
    await tocar('accion-guardar-turno');

    // Vuelve al cuadrante en la misma semana.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(ana.id, LUNES)).getByText('09:00')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('17:00')).toBeTruthy();
  });

  it('Editar un turno planificado existente', async () => {
    const { empleado, datos } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.crearTurno(datos.listarEmpleados()[0].id, LUNES, hora(9), hora(17)),
    });
    const ana = empleado('Ana');
    const contenido = datos.leerCelda(ana.id, LUNES);
    if (contenido.tipo !== 'turnos') throw new Error('la celda debería tener un turno');

    await abrirCelda(ana.id, LUNES);

    // Se le ofrece editar el turno planificado, nombrado por sus horas.
    expect(screen.getByText('Editar el turno de 09:00 a 17:00')).toBeTruthy();

    await tocar(`accion-editar-turno-${contenido.turnos[0].id}`);
    await fireEvent.changeText(screen.getByTestId('campo-hora-de-fin'), '15:00');
    await tocar('accion-guardar-turno');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(ana.id, LUNES)).getByText('09:00')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('15:00')).toBeTruthy();
  });

  it('Añadir un segundo turno el mismo día', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.crearTurno(datos.listarEmpleados()[0].id, LUNES, hora(12), hora(16)),
    });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);
    await tocar('accion-anadir-segundo-turno');
    await escribirHoras('20:00', '00:00');
    await tocar('accion-guardar-turno');

    const horas = within(celda(ana.id, LUNES))
      .getAllByText(/^\d{2}:\d{2}$/)
      .map((nodo) => nodo.props.children);
    expect(horas).toEqual(['12:00', '16:00', '20:00', '00:00']);

    // Al volver a tocar la celda ya no se ofrece añadir otro turno.
    await abrirCelda(ana.id, LUNES);
    expect(screen.queryByTestId('accion-anadir-segundo-turno')).toBeNull();
  });

  it('Eliminar solo uno de los dos turnos de un día', async () => {
    const { empleado, datos } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados()[0];
        datos.crearTurno(ana.id, LUNES, hora(12), hora(16));
        datos.crearTurno(ana.id, LUNES, hora(20), hora(0));
      },
    });
    const ana = empleado('Ana');
    const contenido = datos.leerCelda(ana.id, LUNES);
    if (contenido.tipo !== 'turnos') throw new Error('la celda debería tener dos turnos');
    const [mediodia] = contenido.turnos;

    await abrirCelda(ana.id, LUNES);
    await tocar(`accion-eliminar-turno-${mediodia.id}`);
    await tocar('accion-confirmar-eliminacion');

    const horas = within(celda(ana.id, LUNES))
      .getAllByText(/^\d{2}:\d{2}$/)
      .map((nodo) => nodo.props.children);
    expect(horas).toEqual(['20:00', '00:00']);
  });

  it('Eliminar el contenido de una celda', async () => {
    const { empleado, datos } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.crearTurno(datos.listarEmpleados()[0].id, LUNES, hora(9), hora(17)),
    });
    const ana = empleado('Ana');
    const contenido = datos.leerCelda(ana.id, LUNES);
    if (contenido.tipo !== 'turnos') throw new Error('la celda debería tener un turno');

    await abrirCelda(ana.id, LUNES);
    await tocar(`accion-eliminar-turno-${contenido.turnos[0].id}`);

    // El sistema pide confirmación antes de que desaparezca nada.
    expect(screen.getByTestId('confirmacion-eliminar')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('09:00')).toBeTruthy();

    await tocar('accion-confirmar-eliminacion');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(ana.id, LUNES)).getByTestId('celda-vacia')).toBeTruthy();
  });

  it('Desistir de una eliminación', async () => {
    const { empleado, datos } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.crearTurno(datos.listarEmpleados()[0].id, LUNES, hora(9), hora(17)),
    });
    const ana = empleado('Ana');
    const contenido = datos.leerCelda(ana.id, LUNES);
    if (contenido.tipo !== 'turnos') throw new Error('la celda debería tener un turno');

    await abrirCelda(ana.id, LUNES);
    await tocar(`accion-eliminar-turno-${contenido.turnos[0].id}`);
    await tocar('accion-desistir');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(ana.id, LUNES)).getByText('09:00')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('17:00')).toBeTruthy();
  });

  it('Un turno cuyo fin coincide con su inicio no se guarda', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);
    await tocar('accion-crear-turno');
    await escribirHoras('09:00', '09:00');
    await tocar('accion-guardar-turno');

    // No lo guarda, dice por qué, y lo introducido sigue ahí para corregirlo.
    expect(screen.getByTestId('motivo-no-se-guarda')).toHaveTextContent(MOTIVO_DURACION_NULA);
    expect(screen.getByTestId('campo-hora-de-inicio').props.value).toBe('09:00');
    expect(screen.getByTestId('campo-hora-de-fin').props.value).toBe('09:00');

    await fireEvent.changeText(screen.getByTestId('campo-hora-de-fin'), '17:00');
    await tocar('accion-guardar-turno');
    expect(within(celda(ana.id, LUNES)).getByText('17:00')).toBeTruthy();
  });

  it('la explicación de por qué no se guarda desaparece al corregir la hora', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);
    await tocar('accion-crear-turno');
    await escribirHoras('mediodía', '17:30');
    await tocar('accion-guardar-turno');
    expect(screen.getByTestId('motivo-no-se-guarda')).toBeTruthy();

    // Al corregir, el aviso se va: no debe leerse que sigue sin poder guardarse.
    await fireEvent.changeText(screen.getByTestId('campo-hora-de-inicio'), '9:30');
    expect(screen.queryByTestId('motivo-no-se-guarda')).toBeNull();

    await tocar('accion-guardar-turno');
    expect(within(celda(ana.id, LUNES)).getByText('09:30')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('17:30')).toBeTruthy();
  });

  it('planifica un turno que no empieza ni acaba en hora en punto', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);
    await tocar('accion-crear-turno');
    await escribirHoras('09:30', '17:45');
    await tocar('accion-guardar-turno');

    expect(within(celda(ana.id, LUNES)).getByText('09:30')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('17:45')).toBeTruthy();
  });

  it('acepta las horas tecleadas con el teclado numérico y las muestra en 24h', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);
    await tocar('accion-crear-turno');
    // Sin dos puntos: el teclado numérico del móvil puede no ofrecerlos.
    await escribirHoras('930', '1745');
    await tocar('accion-guardar-turno');

    expect(within(celda(ana.id, LUNES)).getByText('09:30')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('17:45')).toBeTruthy();
  });

  it('Crear un turno que cruza la medianoche', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Bruno'] });
    const bruno = empleado('Bruno');

    await abrirCelda(bruno.id, VIERNES);
    await tocar('accion-crear-turno');
    await escribirHoras('20:00', '02:00');
    await tocar('accion-guardar-turno');

    expect(within(celda(bruno.id, VIERNES)).getByText('20:00')).toBeTruthy();
    expect(within(celda(bruno.id, VIERNES)).getByText('02:00')).toBeTruthy();
  });

  it('Ver una celda de vacaciones y editarla desde el propio cuadrante', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.marcarVacaciones(datos.listarEmpleados()[0].id, MARTES),
    });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, MARTES);

    expect(screen.getByText('Cambiar a ausencia')).toBeTruthy();
    expect(screen.getByText('Sustituir por un turno planificado')).toBeTruthy();
    expect(screen.getByText('Eliminar las vacaciones')).toBeTruthy();

    await tocar('accion-crear-turno');
    await escribirHoras('12:00', '20:00');
    await tocar('accion-guardar-turno');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(ana.id, MARTES)).getByText('12:00')).toBeTruthy();
    expect(within(celda(ana.id, MARTES)).getByText('20:00')).toBeTruthy();
    expect(within(celda(ana.id, MARTES)).queryByText('VAC')).toBeNull();
  });

  it('marca ausencia y vacaciones desde la propia celda', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, JUEVES);
    await tocar('accion-marcar-ausencia');
    expect(within(celda(ana.id, JUEVES)).getByText('AUS')).toBeTruthy();

    await abrirCelda(ana.id, JUEVES);
    await tocar('accion-marcar-vacaciones');
    expect(within(celda(ana.id, JUEVES)).getByText('VAC')).toBeTruthy();
  });

  it('Editar una celda de una semana ya pasada', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await tocar('accion-semana-anterior');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');

    await abrirCelda(ana.id, '2026-08-31');

    // Las mismas acciones que en la semana en curso, sin ningún aviso adicional.
    expect(screen.getByTestId('accion-crear-turno')).toBeTruthy();
    expect(screen.getByTestId('accion-marcar-ausencia')).toBeTruthy();
    expect(screen.getByTestId('accion-marcar-vacaciones')).toBeTruthy();
    expect(screen.queryByText(/semana pasada|ya pasada|pasado/i)).toBeNull();
  });

  it('Cancelar sin cambiar nada', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => datos.crearTurno(datos.listarEmpleados()[0].id, LUNES, hora(9), hora(17)),
    });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);
    await tocar('accion-cancelar');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(ana.id, LUNES)).getByText('09:00')).toBeTruthy();
    expect(within(celda(ana.id, LUNES)).getByText('17:00')).toBeTruthy();
  });

  it('Editar una celda de una semana distinta de la actual', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');

    await tocar('accion-semana-siguiente');
    await abrirCelda(ana.id, '2026-09-14');
    await tocar('accion-crear-turno');
    await escribirHoras('09:00', '17:00');
    await tocar('accion-guardar-turno');

    // Vuelve al cuadrante mostrando la semana siguiente, no la semana en curso.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    expect(within(celda(ana.id, '2026-09-14')).getByText('09:00')).toBeTruthy();

    await tocar('accion-volver-a-la-semana-en-curso');
    expect(within(celda(ana.id, LUNES)).getByTestId('celda-vacia')).toBeTruthy();
  });
});
