/**
 * Las vacaciones por rango desde la ficha, y su efecto sobre las celdas del
 * cuadrante: un rango es exactamente el conjunto de sus días marcados.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AlmacenCuadrante } from '../../datos/almacenCuadrante';
import { MOTIVO_FIN_ANTERIOR_AL_INICIO } from '../../dominio/vacaciones';
import {
  empleadoLlamado,
  hora,
  MIERCOLES_A_LAS_DIEZ,
  PanelDeEmpleados,
  renderizarPanelDeEmpleados,
} from '../../pruebas/ayudas';
import { ANCHO_MINIMO_SOPORTADO } from '../medidas';
import { PantallaCuadrante } from '../PantallaCuadrante';
import { MENSAJE_SIN_VACACIONES } from '../VacacionesDeLaFicha';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function escribir(testID: string, texto: string) {
  await fireEvent.changeText(screen.getByTestId(testID), texto);
}

async function abrirLaFichaDe(datos: AlmacenCuadrante, nombre: string) {
  await tocar(`fila-de-la-lista-${empleadoLlamado(datos, nombre).id}`);
}

/** Teclea un rango en el formulario abierto y pide guardarlo. */
async function tecleraElRango(inicio: string, fin: string) {
  await escribir('campo-fecha-de-inicio', inicio);
  await escribir('campo-fecha-de-fin', fin);
  await tocar('accion-guardar-rango');
}

async function anadirRango(inicio: string, fin: string) {
  await tocar('accion-anadir-rango');
  await tecleraElRango(inicio, fin);
}

/** Los rangos que la ficha muestra ahora mismo, tal y como se leen. */
function rangosDeLaFicha(): string[] {
  return screen
    .queryAllByTestId(/^fechas-del-rango-/)
    .map((nodo) => nodo.props.children as string);
}

/** El cuadrante, en la semana que se indique, sobre el mismo almacén. */
async function verElCuadrante(lunes: Date) {
  await render(<PantallaCuadrante reloj={() => lunes} anchoDePantalla={ANCHO_MINIMO_SOPORTADO} />);
}

describe('Vacaciones por rango de fechas desde la ficha', () => {
  it('Añadir un rango de vacaciones a un empleado y verlo en su ficha', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    // Bruno no tiene vacaciones: la zona lo dice y ofrece añadir un rango.
    expect(screen.getByTestId('sin-vacaciones')).toHaveTextContent(MENSAJE_SIN_VACACIONES);
    expect(screen.getByTestId('accion-anadir-rango')).toBeTruthy();

    await anadirRango('10/09/2026', '14/09/2026');

    expect(rangosDeLaFicha()).toEqual(['10/09/2026 - 14/09/2026']);

    // En el cuadrante, esos días de la semana del 07/09 al 13/09 son vacaciones.
    await verElCuadrante(MIERCOLES_A_LAS_DIEZ);
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    for (const dia of ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13']) {
      expect(screen.getByTestId(`celda-${bruno.id}-${dia}`)).toHaveTextContent(/VAC/);
    }
  });

  it('Un rango de un solo día', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '10/09/2026');

    expect(rangosDeLaFicha()).toEqual(['10/09/2026 - 10/09/2026']);
  });

  it('Un rango cuyo fin es anterior a su inicio no se guarda', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('14/09/2026', '10/09/2026');

    // No se guarda, se explica por qué y las fechas siguen ahí para corregirlas.
    expect(screen.getByTestId('motivo-rango-no-se-guarda')).toHaveTextContent(
      MOTIVO_FIN_ANTERIOR_AL_INICIO,
    );
    expect(screen.getByTestId('campo-fecha-de-inicio').props.value).toBe('14/09/2026');
    expect(screen.getByTestId('campo-fecha-de-fin').props.value).toBe('10/09/2026');

    // Al corregir la fecha de fin, la explicación desaparece…
    await escribir('campo-fecha-de-fin', '18/09/2026');
    expect(screen.queryByTestId('motivo-rango-no-se-guarda')).toBeNull();

    // …y el rango se puede guardar.
    await tocar('accion-guardar-rango');
    expect(rangosDeLaFicha()).toEqual(['14/09/2026 - 18/09/2026']);
  });

  it('Teclear la fecha sin separadores', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10092026', '14/9/2026');

    expect(rangosDeLaFicha()).toEqual(['10/09/2026 - 14/09/2026']);
  });

  it('Dos rangos contiguos se muestran como uno solo', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('01/09/2026', '03/09/2026');
    await anadirRango('04/09/2026', '06/09/2026');

    expect(rangosDeLaFicha()).toEqual(['01/09/2026 - 06/09/2026']);
  });

  it('Editar un rango de vacaciones existente', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '14/09/2026');

    await tocar('accion-editar-rango-2026-09-10');
    await tecleraElRango('10/09/2026', '12/09/2026');

    expect(rangosDeLaFicha()).toEqual(['10/09/2026 - 12/09/2026']);

    // En la semana del 14/09 al 20/09, la celda del lunes 14 se presenta vacía.
    await verElCuadrante(new Date(2026, 8, 16, 10, 0));
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    expect(screen.getByTestId(`celda-${bruno.id}-2026-09-14`)).not.toHaveTextContent(/VAC/);
  });

  it('Eliminar un rango de vacaciones existente', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '14/09/2026');

    await tocar('accion-eliminar-rango-2026-09-10');
    // El sistema pide confirmar antes de que las vacaciones desaparezcan.
    expect(screen.getByTestId('confirmacion-eliminar')).toBeTruthy();
    await tocar('accion-confirmar-eliminacion');

    expect(rangosDeLaFicha()).toEqual([]);
    expect(screen.getByTestId('sin-vacaciones')).toBeTruthy();

    await verElCuadrante(MIERCOLES_A_LAS_DIEZ);
    for (const dia of ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13']) {
      expect(screen.getByTestId(`celda-${bruno.id}-${dia}`)).not.toHaveTextContent(/VAC/);
    }
  });

  it('una eliminación de rango ya confirmada no se puede deshacer', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '14/09/2026');
    await tocar('accion-eliminar-rango-2026-09-10');
    await tocar('accion-confirmar-eliminacion');

    expect(screen.queryByText(/deshacer|recuperar|restaurar|revertir/i)).toBeNull();
    expect(screen.queryByText('10/09/2026 - 14/09/2026')).toBeNull();
  });

  it('Desistir de eliminar un rango de vacaciones', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '14/09/2026');

    await tocar('accion-eliminar-rango-2026-09-10');
    await tocar('accion-desistir');

    expect(rangosDeLaFicha()).toEqual(['10/09/2026 - 14/09/2026']);
  });

  it('Un rango de vacaciones que pisa turnos planificados', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: ['Bruno'],
      prepararDatos: (almacen) => {
        const bruno = almacen.listarEmpleados()[0];
        almacen.crearTurno(bruno.id, '2026-09-10', hora(9), hora(17));
        almacen.crearTurno(bruno.id, '2026-09-11', hora(9), hora(17));
      },
    });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '14/09/2026');

    // Dice cuántos días están en esa situación y pide confirmarlo.
    expect(screen.getByTestId('aviso-dias-con-contenido')).toHaveTextContent(
      /2 días del rango tienen ya turno planificado o ausencia/,
    );
    await tocar('accion-confirmar-rango');

    expect(rangosDeLaFicha()).toEqual(['10/09/2026 - 14/09/2026']);

    await verElCuadrante(MIERCOLES_A_LAS_DIEZ);
    for (const dia of ['2026-09-10', '2026-09-11']) {
      const celda = screen.getByTestId(`celda-${bruno.id}-${dia}`);
      expect(celda).toHaveTextContent(/VAC/);
      expect(celda).not.toHaveTextContent(/09:00/);
      expect(celda).not.toHaveTextContent(/17:00/);
    }
  });

  it('Desistir de un rango que pisa turnos planificados', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: ['Bruno'],
      prepararDatos: (almacen) => {
        const bruno = almacen.listarEmpleados()[0];
        almacen.crearTurno(bruno.id, '2026-09-10', hora(9), hora(17));
      },
    });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '14/09/2026');
    await tocar('accion-desistir-del-rango');

    // El rango no se guarda y la ficha no muestra ninguno.
    expect(rangosDeLaFicha()).toEqual([]);

    // Y la celda del 10/09/2026 sigue mostrando su turno.
    await verElCuadrante(MIERCOLES_A_LAS_DIEZ);
    const celda = screen.getByTestId(`celda-${bruno.id}-2026-09-10`);
    expect(celda).toHaveTextContent(/09:00/);
    expect(celda).toHaveTextContent(/17:00/);
  });

  it('Quitar las vacaciones de un día desde el cuadrante parte el rango', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await anadirRango('10/09/2026', '14/09/2026');

    // El encargado quita las vacaciones del 12/09/2026 desde la celda del cuadrante.
    await verElCuadrante(MIERCOLES_A_LAS_DIEZ);
    await tocar(`celda-${bruno.id}-2026-09-12`);
    await tocar('accion-eliminar-contenido');
    await tocar('accion-confirmar-eliminacion');

    // Y vuelve a abrir la ficha de Bruno, sobre el mismo almacén.
    await render(<PanelDeEmpleados />);
    await abrirLaFichaDe(datos, 'Bruno');

    expect(rangosDeLaFicha()).toEqual([
      '10/09/2026 - 11/09/2026',
      '13/09/2026 - 14/09/2026',
    ]);
  });

  it('El panel no valora el cumplimiento normativo', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    // Dos meses de vacaciones de golpe.
    await anadirRango('01/07/2026', '31/08/2026');

    expect(rangosDeLaFicha()).toEqual(['01/07/2026 - 31/08/2026']);
    // Ni un aviso sobre días disponibles, jornada, descansos, convenio o normativa.
    expect(
      screen.queryByText(/disponible|jornada|descanso|convenio|normativa|legal|exceso|límite/i),
    ).toBeNull();
  });
});
