/**
 * La hoja de acciones de la celda en su estado más cargado.
 *
 * Copiar y pegar la dejan en ocho acciones sobre una celda de dos turnos, y es justo
 * el punto donde el principio de uso real —una mano, de pie, con prisa— más aprieta:
 * cada acción tiene que leerse entera y conservar su área pulsable en la pantalla más
 * estrecha soportada.
 */

import { fireEvent, screen, within } from '@testing-library/react-native';

import {
  empleadoLlamado,
  estiloCombinado,
  hora,
  LUNES,
  MARTES,
  renderizarCuadrante,
} from '../../pruebas/ayudas';
import { LADO_PULSABLE_MINIMO } from '../medidas';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function abrirCelda(idEmpleado: string, dia: string) {
  await fireEvent.press(screen.getByTestId(`celda-${idEmpleado}-${dia}`));
}

describe('Toda celda es editable desde el cuadrante', () => {
  it('Las acciones se leen enteras en el estado más cargado', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      // El estado más cargado: dos turnos, que se editan y se eliminan por separado.
      prepararDatos: (datos) => {
        const ana = empleadoLlamado(datos, 'Ana').id;
        datos.crearTurno(ana, LUNES, hora(9), hora(17));
        datos.crearTurno(ana, MARTES, hora(12), hora(16));
        datos.crearTurno(ana, MARTES, hora(20), hora(0));
      },
    });
    const ana = empleado('Ana');

    // Con algo copiado, para que la hoja ofrezca también pegar.
    await abrirCelda(ana.id, LUNES);
    await tocar('accion-copiar');

    await abrirCelda(ana.id, MARTES);

    const hoja = within(screen.getByTestId('acciones-de-celda'));
    const acciones = [
      'accion-editar-turno-2',
      'accion-editar-turno-3',
      'accion-marcar-ausencia',
      'accion-marcar-vacaciones',
      'accion-eliminar-turno-2',
      'accion-eliminar-turno-3',
      'accion-copiar',
      'accion-pegar',
    ];

    for (const id of acciones) {
      const accion = hoja.getByTestId(id);
      const estilo = estiloCombinado(accion);

      // Su área pulsable no baja de los 44 puntos.
      expect(estilo.minHeight).toBe(LADO_PULSABLE_MINIMO);

      // Y su texto se lee entero: ni truncado con puntos suspensivos ni limitado a un
      // número de líneas que lo recorte.
      const texto = within(accion).getByText(/.+/);
      expect(texto.props.numberOfLines).toBeUndefined();
      expect(texto.props.ellipsizeMode).toBeUndefined();
      expect(String(texto.props.children)).not.toMatch(/…|\.\.\./);
    }

    // Las ocho, y la de cancelar: no falta ninguna ni sobra ninguna.
    expect(hoja.getByTestId('accion-cancelar')).toBeTruthy();
    expect(screen.queryByTestId('accion-anadir-segundo-turno')).toBeNull();
  });

  it('copiar y pegar van al final de la hoja, separadas de las demás', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) =>
        datos.crearTurno(empleadoLlamado(datos, 'Ana').id, LUNES, hora(9), hora(17)),
    });
    const ana = empleado('Ana');

    await abrirCelda(ana.id, LUNES);

    // El hueco que separa el bloque de copiar del de crear, editar y eliminar.
    expect(estiloCombinado(screen.getByTestId('accion-copiar')).marginTop).toBeGreaterThan(0);
    expect(estiloCombinado(screen.getByTestId('accion-eliminar-turno-1')).marginTop).toBeUndefined();
  });
});
