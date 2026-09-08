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
    await escribir('campo-puesto-empleado', 'Cocina');
    await escribir('campo-telefono-empleado', '600 11 22 33');
    await escribir('campo-email-empleado', 'bruno@ejemplo.es');
    await tocar('accion-confirmar-alta');

    // Vuelve a la lista, con Bruno en su posición alfabética y con su puesto.
    expect(screen.queryByTestId('formulario-alta-empleado')).toBeNull();
    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno', 'Carmen']);
    const bruno = empleadoLlamado(datos, 'Bruno');
    expect(screen.getByTestId(`puesto-de-la-lista-${bruno.id}`)).toHaveTextContent('Cocina');

    // Y al abrir su ficha, los tres están tal y como se teclearon.
    await tocar(`fila-de-la-lista-${bruno.id}`);
    expect(screen.getByTestId('campo-puesto').props.value).toBe('Cocina');
    expect(screen.getByTestId('campo-telefono').props.value).toBe('600 11 22 33');
    expect(screen.getByTestId('campo-email').props.value).toBe('bruno@ejemplo.es');
  });

  it('Dar de alta un empleado sin teléfono ni email', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });

    await tocar('accion-dar-de-alta');
    await escribir('campo-nombre-empleado', 'Carmen');
    await tocar('accion-confirmar-alta');

    expect(nombresDeLaLista()).toEqual(['Ana', 'Carmen']);

    // Los campos de puesto y de contacto están vacíos y se pueden rellenar.
    const carmen = empleadoLlamado(datos, 'Carmen');
    await tocar(`fila-de-la-lista-${carmen.id}`);
    expect(screen.getByTestId('campo-puesto').props.value).toBe('');
    expect(screen.getByTestId('campo-telefono').props.value).toBe('');
    expect(screen.getByTestId('campo-email').props.value).toBe('');

    await escribir('campo-telefono', '600112233');
    await fireEvent(screen.getByTestId('campo-telefono'), 'endEditing');
    expect(datos.leerEmpleado(carmen.id)!.telefono).toBe('600112233');
  });

  it('Dos empleados con el mismo puesto', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: [],
      prepararDatos: (almacen) => almacen.altaEmpleado('Ana', undefined, undefined, 'Barra'),
    });

    await tocar('accion-dar-de-alta');
    await escribir('campo-nombre-empleado', 'Bruno');
    await escribir('campo-puesto-empleado', 'Barra');
    await tocar('accion-confirmar-alta');

    // El puesto no interviene en la unicidad del nombre: los dos se guardan.
    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno']);
    for (const nombre of ['Ana', 'Bruno']) {
      const empleado = empleadoLlamado(datos, nombre);
      expect(screen.getByTestId(`puesto-de-la-lista-${empleado.id}`)).toHaveTextContent('Barra');
    }
  });

  it('el puesto del alta es texto libre: ni lista cerrada, ni formato, ni valor rechazado', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });

    await tocar('accion-dar-de-alta');
    const campo = screen.getByTestId('campo-puesto-empleado');
    // Ni longitud máxima, ni teclado especial, ni desplegable de opciones.
    expect(campo.props.maxLength).toBeUndefined();
    expect(campo.props.keyboardType).toBeUndefined();

    await escribir('campo-nombre-empleado', 'Bruno');
    await escribir('campo-puesto-empleado', '  Jefe de cocina y compras  ');
    await tocar('accion-confirmar-alta');

    // Se guarda tal cual se teclea, sin los espacios de los extremos.
    expect(empleadoLlamado(datos, 'Bruno').puesto).toBe('Jefe de cocina y compras');
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
