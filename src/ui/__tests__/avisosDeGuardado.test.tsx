/**
 * Lo que la ficha dice cuando un dato queda guardado.
 *
 * El encargado no tiene botón de guardar, así que la única forma de saber que lo
 * escrito está a salvo es que la propia ficha lo diga.
 */

import { fireEvent, screen } from '@testing-library/react-native';

import { empleadoLlamado, renderizarPanelDeEmpleados } from '../../pruebas/ayudas';
import { TEXTO_GUARDADO } from '../AvisoDeGuardado';

async function abrirLaFichaDe(nombre: string, plantilla = ['Ana', 'Bruno']) {
  const datos = await renderizarPanelDeEmpleados({ plantilla });
  await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, nombre).id}`));
  return datos;
}

describe('Edición de los datos de la ficha', () => {
  it('El campo dice que ha quedado guardado', async () => {
    await abrirLaFichaDe('Bruno');

    await fireEvent.changeText(screen.getByTestId('campo-telefono'), '611 22 33 44');

    expect(screen.getByTestId('guardado-campo-telefono')).toHaveTextContent(TEXTO_GUARDADO);
    // Y sigue dicho: no es un aviso que pase.
    expect(screen.getByTestId('guardado-campo-telefono')).toBeTruthy();
    // Los campos que no ha tocado no dicen nada.
    expect(screen.queryByTestId('guardado-campo-email')).toBeNull();
    expect(screen.queryByTestId('guardado-campo-nota')).toBeNull();
  });

  it('Un campo escrito queda guardado sin salir de él', async () => {
    const datos = await abrirLaFichaDe('Bruno');

    await fireEvent.changeText(screen.getByTestId('campo-telefono'), '611 22 33 44');
    await fireEvent.press(screen.getByTestId('accion-volver-a-la-lista'));
    await fireEvent.press(
      screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`),
    );

    expect(screen.getByTestId('campo-telefono').props.value).toBe('611 22 33 44');
  });

  it('Al reabrir la ficha no hay avisos de guardado', async () => {
    const datos = await abrirLaFichaDe('Bruno');
    await fireEvent.changeText(screen.getByTestId('campo-telefono'), '611 22 33 44');

    await fireEvent.press(screen.getByTestId('accion-volver-a-la-lista'));
    await fireEvent.press(
      screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`),
    );

    expect(screen.getByTestId('campo-telefono').props.value).toBe('611 22 33 44');
    expect(screen.queryByText(TEXTO_GUARDADO)).toBeNull();
  });

  it('Un nombre que no se puede guardar no dice que se ha guardado', async () => {
    await abrirLaFichaDe('Bruno', ['Ana', 'Bruno']);

    const campo = screen.getByTestId('campo-nombre');
    await fireEvent.changeText(campo, 'Ana');
    await fireEvent(campo, 'endEditing');

    expect(screen.getByTestId('motivo-nombre-no-se-guarda')).toBeTruthy();
    expect(screen.queryByTestId('guardado-campo-nombre')).toBeNull();
  });

  it('un nombre que sí se puede guardar lo dice', async () => {
    await abrirLaFichaDe('Bruno');

    const campo = screen.getByTestId('campo-nombre');
    await fireEvent.changeText(campo, 'Bruno Díaz');
    await fireEvent(campo, 'endEditing');

    expect(screen.getByTestId('guardado-campo-nombre')).toHaveTextContent(TEXTO_GUARDADO);
    expect(screen.queryByTestId('motivo-nombre-no-se-guarda')).toBeNull();
  });

  it('al corregir un nombre rechazado deja de verse la explicación', async () => {
    await abrirLaFichaDe('Bruno');
    const campo = screen.getByTestId('campo-nombre');
    await fireEvent.changeText(campo, 'Ana');
    await fireEvent(campo, 'endEditing');

    await fireEvent.changeText(campo, 'Bruno Díaz');

    expect(screen.queryByTestId('motivo-nombre-no-se-guarda')).toBeNull();
  });
});

describe('Nota del empleado', () => {
  it('La nota se guarda aunque se salga de la ficha desde ella', async () => {
    const datos = await abrirLaFichaDe('Bruno');

    // Se escribe en la nota y se sale desde ella: ni otro campo, ni cerrar teclado.
    await fireEvent.changeText(screen.getByTestId('campo-nota'), 'No puede los martes por la tarde');
    await fireEvent.press(screen.getByTestId('accion-volver-a-la-lista'));
    await fireEvent.press(
      screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`),
    );

    expect(screen.getByTestId('campo-nota').props.value).toBe('No puede los martes por la tarde');
  });

  it('la nota también dice que ha quedado guardada', async () => {
    await abrirLaFichaDe('Bruno');

    await fireEvent.changeText(screen.getByTestId('campo-nota'), 'Solo turnos de mañana');

    expect(screen.getByTestId('guardado-campo-nota')).toHaveTextContent(TEXTO_GUARDADO);
  });
});
