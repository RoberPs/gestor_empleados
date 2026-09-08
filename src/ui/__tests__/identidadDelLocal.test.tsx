/**
 * La identidad del local en la pantalla del cuadrante.
 *
 * El nombre y el logo vienen con la app y no se editan desde ninguna pantalla: la
 * de ajustes se retiró el 08/09/2026 y no queda ningún ajuste que tocar.
 */

import { fireEvent, screen } from '@testing-library/react-native';

import {
  empleadoLlamado,
  estiloCombinado,
  renderizarCuadrante,
  renderizarPanelDeEmpleados,
} from '../../pruebas/ayudas';
import { NOMBRE_DEL_LOCAL } from '../CabeceraSemana';

/** Los 20 empleados de la escala real del local. */
const VEINTE = Array.from({ length: 20 }, (_, i) => `Empleado ${String(i + 1).padStart(2, '0')}`);

describe('La pantalla de inicio identifica el local', () => {
  it('Abrir la app con el nombre del local ya escrito', async () => {
    await renderizarCuadrante();

    expect(screen.getByTestId('logo-del-local')).toBeTruthy();
    expect(screen.getByTestId('nombre-del-local')).toHaveTextContent('La Esquina café');
    // Y debajo sigue todo lo de siempre.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(screen.getByTestId('accion-semana-siguiente')).toBeTruthy();
    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
  });

  it('La identidad del local no le quita sitio a la rejilla', async () => {
    // A la anchura mínima soportada y con la plantilla completa.
    const { empleado } = await renderizarCuadrante({ plantilla: VEINTE });

    // Las siete columnas siguen viéndose a la vez, sin scroll horizontal.
    expect(screen.getAllByTestId(/^cabecera-dia-/)).toHaveLength(7);
    expect(screen.getByTestId('scroll-plantilla').props.horizontal).toBeFalsy();

    // Y las 20 filas siguen ahí, dentro del scroll vertical de la plantilla.
    expect(screen.getAllByTestId(/^fila-empleado-/)).toHaveLength(20);
    expect(screen.getByTestId(`fila-empleado-${empleado('Empleado 20').id}`)).toBeTruthy();

    // La fila de identidad mide siempre lo mismo: el nombre es fijo y se trunca en
    // una sola línea, así que no puede empujar a la rejilla hacia abajo.
    const nombre = screen.getByTestId('nombre-del-local');
    expect(nombre.props.numberOfLines).toBe(1);
    expect(nombre.props.ellipsizeMode).toBe('tail');
  });

  it('La app no ofrece cambiar el nombre ni el logo', async () => {
    await renderizarCuadrante();

    // En el cuadrante no hay acceso a ninguna pantalla de ajustes.
    expect(screen.queryByTestId('accion-ir-a-ajustes')).toBeNull();
    expect(screen.queryByTestId('pantalla-ajustes')).toBeNull();
    expect(screen.queryByText(/ajustes|configuraci[óo]n|cambiar el logo/i)).toBeNull();

    // Ni en el panel de empleados, ni en una ficha.
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
    expect(screen.queryByText(/ajustes|configuraci[óo]n|cambiar el logo/i)).toBeNull();
    await fireEvent.press(
      screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`),
    );
    expect(screen.queryByText(/ajustes|configuraci[óo]n|cambiar el logo/i)).toBeNull();
  });

  it('El nombre del local y la semana no se confunden', async () => {
    await renderizarCuadrante();

    const nombre = estiloCombinado(screen.getByTestId('nombre-del-local'));
    const rango = estiloCombinado(screen.getByTestId('rango-de-la-semana'));

    // El rango lleva cifras de ancho fijo y el nombre no: no se leen como lo mismo.
    expect(rango.fontVariant).toBeTruthy();
    expect(nombre.fontVariant).toBeUndefined();
    expect(nombre.textAlign).toBeUndefined();
    expect(rango.textAlign).toBe('center');
  });

  it('el logo no crece con la letra del sistema', async () => {
    await renderizarCuadrante();

    const logo = estiloCombinado(screen.getByTestId('logo-del-local'));
    expect(logo.width).toBe(32);
    expect(logo.height).toBe(32);
  });

  it('el nombre del local viene con la app y no se lee de ningún almacenamiento', async () => {
    // No hay operación de lectura ni de escritura del nombre en la capa de datos:
    // el día que alguien vuelva a guardarlo, este test lo dirá.
    const { datos } = await renderizarCuadrante();

    expect(NOMBRE_DEL_LOCAL).toBe('La Esquina café');
    expect(datos).not.toHaveProperty('leerNombreDelLocal');
    expect(datos).not.toHaveProperty('escribirNombreDelLocal');
  });
});
