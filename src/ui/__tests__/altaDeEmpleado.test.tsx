/**
 * El alta de un empleado desde el panel.
 */

import { fireEvent, screen } from '@testing-library/react-native';

import { MOTIVO_NOMBRE_REPETIDO, MOTIVO_NOMBRE_VACIO } from '../../dominio/empleado';
import { empleadoLlamado, renderizarPanelDeEmpleados } from '../../pruebas/ayudas';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function escribir(testID: string, texto: string) {
  await fireEvent.changeText(screen.getByTestId(testID), texto);
}

function nombresDeLaLista(): string[] {
  return screen
    .getAllByTestId(/^nombre-de-la-lista-/)
    .map((nodo) => nodo.props.children as string);
}

describe('Alta de un empleado', () => {
  it('Dar de alta un empleado con nombre, teléfono y email', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana', 'Carmen'] });

    await tocar('accion-dar-de-alta');
    await escribir('campo-nombre-empleado', 'Bruno');
    await escribir('campo-telefono-empleado', '600 11 22 33');
    await escribir('campo-email-empleado', 'bruno@ejemplo.es');
    await tocar('accion-confirmar-alta');

    // Vuelve a la lista, con Bruno en su posición alfabética.
    expect(screen.queryByTestId('formulario-alta-empleado')).toBeNull();
    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno', 'Carmen']);

    // Y al abrir su ficha, el teléfono y el email están tal y como se teclearon.
    const bruno = empleadoLlamado(datos, 'Bruno');
    await tocar(`fila-de-la-lista-${bruno.id}`);
    expect(screen.getByTestId('campo-telefono').props.value).toBe('600 11 22 33');
    expect(screen.getByTestId('campo-email').props.value).toBe('bruno@ejemplo.es');
  });

  it('Dar de alta un empleado sin teléfono ni email', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });

    await tocar('accion-dar-de-alta');
    await escribir('campo-nombre-empleado', 'Carmen');
    await tocar('accion-confirmar-alta');

    expect(nombresDeLaLista()).toEqual(['Ana', 'Carmen']);

    // Los campos de contacto están vacíos y se pueden rellenar.
    const carmen = empleadoLlamado(datos, 'Carmen');
    await tocar(`fila-de-la-lista-${carmen.id}`);
    expect(screen.getByTestId('campo-telefono').props.value).toBe('');
    expect(screen.getByTestId('campo-email').props.value).toBe('');

    await escribir('campo-telefono', '600112233');
    await fireEvent(screen.getByTestId('campo-telefono'), 'endEditing');
    expect(datos.leerEmpleado(carmen.id)!.telefono).toBe('600112233');
  });

  it('Un alta sin nombre no se guarda', async () => {
    await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });

    await tocar('accion-dar-de-alta');
    await escribir('campo-telefono-empleado', '600112233');
    await tocar('accion-confirmar-alta');

    // No se guarda, se explica por qué y el teléfono introducido sigue ahí.
    expect(screen.getByTestId('formulario-alta-empleado')).toBeTruthy();
    expect(screen.getByTestId('motivo-alta-no-se-guarda')).toHaveTextContent(MOTIVO_NOMBRE_VACIO);
    expect(screen.getByTestId('campo-telefono-empleado').props.value).toBe('600112233');

    // Al teclear el nombre, la explicación desaparece…
    await escribir('campo-nombre-empleado', 'Bruno');
    expect(screen.queryByTestId('motivo-alta-no-se-guarda')).toBeNull();

    // …y el alta se puede guardar.
    await tocar('accion-confirmar-alta');
    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno']);
  });

  it('Un alta con un nombre que ya existe no se guarda', async () => {
    await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });

    await tocar('accion-dar-de-alta');
    await escribir('campo-nombre-empleado', 'ana');
    await tocar('accion-confirmar-alta');

    expect(screen.getByTestId('motivo-alta-no-se-guarda')).toHaveTextContent(
      MOTIVO_NOMBRE_REPETIDO,
    );
    // Lo tecleado sigue ahí para poder distinguirlo.
    expect(screen.getByTestId('campo-nombre-empleado').props.value).toBe('ana');

    await escribir('campo-nombre-empleado', 'Ana G.');
    await tocar('accion-confirmar-alta');

    expect(nombresDeLaLista()).toEqual(['Ana', 'Ana G.']);
  });

  it('el alta se puede abandonar sin guardar nada', async () => {
    await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });

    await tocar('accion-dar-de-alta');
    await escribir('campo-nombre-empleado', 'Bruno');
    await tocar('accion-cancelar-alta');

    expect(nombresDeLaLista()).toEqual(['Ana']);
  });
});
