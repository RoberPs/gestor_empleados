/**
 * La baja de un empleado: borrado definitivo, siempre desde la ficha y siempre
 * con confirmación explícita.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AlmacenCuadrante } from '../../datos/almacenCuadrante';
import { empleadoLlamado, hora, renderizarPanelDeEmpleados } from '../../pruebas/ayudas';
import { ANCHO_MINIMO_SOPORTADO } from '../medidas';
import { PantallaCuadrante } from '../PantallaCuadrante';

const SEMANA_PASADA = '2026-09-01';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function abrirLaFichaDe(datos: AlmacenCuadrante, nombre: string) {
  await tocar(`fila-de-la-lista-${empleadoLlamado(datos, nombre).id}`);
}

/** Bruno con turnos en la semana en curso y en una pasada, y un rango de vacaciones. */
function brunoConContenido(almacen: AlmacenCuadrante) {
  const bruno = almacen.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
  almacen.crearTurno(bruno.id, '2026-09-09', hora(9), hora(17));
  almacen.crearTurno(bruno.id, SEMANA_PASADA, hora(9), hora(17));
  almacen.marcarRangoDeVacaciones(bruno.id, { inicio: '2026-09-21', fin: '2026-09-25' });
  almacen.editarNota(bruno.id, 'No puede los martes por la tarde');
}

describe('Baja de un empleado', () => {
  it('Dar de baja a un empleado que tiene turnos planificados', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: brunoConContenido,
    });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await tocar('accion-dar-de-baja');

    // Se pide confirmar, nombrando a Bruno y advirtiendo de lo que se pierde.
    const confirmacion = screen.getByTestId('confirmacion-eliminar');
    expect(confirmacion).toHaveTextContent(/Bruno/);
    expect(confirmacion).toHaveTextContent(/turnos planificados/);
    expect(confirmacion).toHaveTextContent(/vacaciones/);
    expect(confirmacion).toHaveTextContent(/semanas ya pasadas/);

    await tocar('accion-confirmar-eliminacion');

    // Vuelve a la lista, que ya no muestra ninguna fila para Bruno.
    expect(
      screen.getAllByTestId(/^nombre-de-la-lista-/).map((n) => n.props.children),
    ).toEqual(['Ana']);
    expect(screen.queryByTestId(`fila-de-la-lista-${bruno.id}`)).toBeNull();

    // Y el cuadrante tampoco, ni siquiera en la semana ya pasada.
    await render(
      <PantallaCuadrante
        reloj={() => new Date(2026, 8, 2, 10, 0)}
        anchoDePantalla={ANCHO_MINIMO_SOPORTADO}
      />,
    );
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('31/08/2026 - 06/09/2026');
    expect(screen.queryByTestId(`fila-empleado-${bruno.id}`)).toBeNull();
    expect(screen.queryByTestId(`celda-${bruno.id}-${SEMANA_PASADA}`)).toBeNull();
  });

  it('Desistir de una baja', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: brunoConContenido,
    });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await tocar('accion-dar-de-baja');
    await tocar('accion-desistir');

    // Sigue en la ficha de Bruno, con sus datos, sus vacaciones y su nota.
    expect(screen.getByTestId('titulo-de-la-ficha')).toHaveTextContent('Bruno');
    expect(screen.getByTestId('fechas-del-rango-2026-09-21')).toHaveTextContent(
      '21/09/2026 - 25/09/2026',
    );
    expect(screen.getByTestId('campo-nota').props.value).toBe('No puede los martes por la tarde');
    expect(datos.leerCelda(bruno.id, SEMANA_PASADA).tipo).toBe('turnos');

    // Y al volver, la lista sigue mostrando su fila.
    await tocar('accion-volver-a-la-lista');
    expect(screen.getByTestId(`fila-de-la-lista-${bruno.id}`)).toBeTruthy();
  });

  it('la baja no ofrece deshacerse una vez confirmada', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana', 'Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    await tocar('accion-dar-de-baja');
    await tocar('accion-confirmar-eliminacion');

    expect(screen.queryByText(/deshacer|recuperar|restaurar/i)).toBeNull();
  });
});
