import { fireEvent, render, screen } from '@testing-library/react-native';

import { crearAlmacenEnMemoria, instalarAlmacen } from '../../datos/almacenCuadrante';
import { ACCION_DAR_DE_ALTA, MENSAJE_SIN_EMPLEADOS } from '../EstadoVacio';
import { PantallaCuadrante } from '../PantallaCuadrante';
import { PantallaEmpleadosProvisional } from '../PantallaEmpleadosProvisional';
import { MIERCOLES_A_LAS_DIEZ, renderizarCuadrante } from '../../pruebas/ayudas';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

describe('Estado vacío sin empleados dados de alta', () => {
  it('Abrir la app sin ningún empleado dado de alta', async () => {
    await renderizarCuadrante({ plantilla: [] });

    // No se muestra la rejilla.
    expect(screen.queryByTestId('rejilla-cuadrante')).toBeNull();
    expect(screen.getByText(MENSAJE_SIN_EMPLEADOS)).toBeTruthy();
    expect(screen.getByTestId('accion-dar-de-alta-primer-empleado')).toHaveTextContent(
      ACCION_DAR_DE_ALTA,
    );

    // Ni identificación de la semana, ni navegación, ni leyenda.
    expect(screen.queryByTestId('rango-de-la-semana')).toBeNull();
    expect(screen.queryByTestId('accion-semana-anterior')).toBeNull();
    expect(screen.queryByTestId('accion-semana-siguiente')).toBeNull();
    expect(screen.queryByTestId('leyenda-etiquetas')).toBeNull();
  });

  it('la acción del estado vacío lleva al panel de empleados', async () => {
    const irAEmpleados = jest.fn();
    await renderizarCuadrante({ plantilla: [], onIrAEmpleados: irAEmpleados });

    await tocar('accion-dar-de-alta-primer-empleado');

    expect(irAEmpleados).toHaveBeenCalled();
  });

  it('El cuadrante aparece tras dar de alta al primer empleado', async () => {
    // El encargado está en el estado vacío…
    const datos = crearAlmacenEnMemoria();
    instalarAlmacen(datos);
    await render(<PantallaCuadrante reloj={() => MIERCOLES_A_LAS_DIEZ} anchoDePantalla={360} />);
    expect(screen.getByTestId('estado-vacio')).toBeTruthy();

    // …da de alta a su primer empleado desde el panel de empleados…
    await render(<PantallaEmpleadosProvisional />);
    await fireEvent.changeText(screen.getByTestId('campo-nombre-empleado'), 'Ana');
    await tocar('accion-dar-de-alta');

    // …y vuelve al cuadrante.
    await render(<PantallaCuadrante reloj={() => MIERCOLES_A_LAS_DIEZ} anchoDePantalla={360} />);

    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(screen.getAllByTestId(/^fila-empleado-/)).toHaveLength(1);
  });
});

describe('Acceso al panel de empleados desde el cuadrante', () => {
  it('Ir al panel de empleados y volver al cuadrante', async () => {
    const irAEmpleados = jest.fn();
    await renderizarCuadrante({ onIrAEmpleados: irAEmpleados });

    // El acceso es permanente y está a un solo toque desde la rejilla.
    await tocar('accion-ir-a-empleados');
    expect(irAEmpleados).toHaveBeenCalledTimes(1);

    // Al volver, sigue en la misma semana: el cuadrante nunca la perdió.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
  });

  it('el acceso al panel sigue disponible tras desplazarse a otra semana', async () => {
    const irAEmpleados = jest.fn();
    await renderizarCuadrante({ onIrAEmpleados: irAEmpleados });

    await tocar('accion-semana-siguiente');
    await tocar('accion-ir-a-empleados');

    expect(irAEmpleados).toHaveBeenCalled();
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
  });

  it('Un empleado nuevo aparece como fila al volver', async () => {
    const { datos } = await renderizarCuadrante({ plantilla: ['Ana', 'Carmen'] });

    // El encargado da de alta a Bruno en el panel de empleados…
    await render(<PantallaEmpleadosProvisional />);
    await fireEvent.changeText(screen.getByTestId('campo-nombre-empleado'), 'Bruno');
    await tocar('accion-dar-de-alta');

    // …y vuelve al cuadrante.
    await render(<PantallaCuadrante reloj={() => MIERCOLES_A_LAS_DIEZ} anchoDePantalla={360} />);

    const nombres = screen
      .getAllByTestId(/^nombre-empleado-/)
      .map((nodo) => nodo.props.children as string);
    // En su posición alfabética.
    expect(nombres).toEqual(['Ana', 'Bruno', 'Carmen']);

    // Sus siete celdas de la semana se presentan vacías.
    const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
    for (const dia of ['2026-09-07', '2026-09-13']) {
      expect(screen.getByTestId(`celda-${bruno.id}-${dia}`)).toBeTruthy();
    }
  });
});
