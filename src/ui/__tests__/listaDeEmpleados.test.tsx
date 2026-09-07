/**
 * La lista de la plantilla dentro del panel de empleados.
 */

import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { crearAlmacenEnMemoria, instalarAlmacen } from '../../datos/almacenCuadrante';
import { empleadoLlamado, renderizarPanelDeEmpleados } from '../../pruebas/ayudas';
import { estiloCombinado } from '../../pruebas/ayudas';
import { ANCHO_MINIMO_SOPORTADO, LADO_PULSABLE_MINIMO } from '../medidas';
import {
  ACCION_ALTA,
  ACCION_ALTA_PRIMER_EMPLEADO,
  MENSAJE_PLANTILLA_VACIA,
  PantallaEmpleados,
} from '../PantallaEmpleados';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

/** Los nombres que la lista muestra ahora mismo, en el orden en que aparecen. */
function nombresDeLaLista(): string[] {
  return screen
    .getAllByTestId(/^nombre-de-la-lista-/)
    .map((nodo) => nodo.props.children as string);
}

describe('Lista de empleados del panel', () => {
  it('Ver la lista de la plantilla', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Carmen', 'Ana', 'Bruno'] });

    // Tres filas, en orden alfabético del español.
    expect(screen.getAllByTestId(/^fila-de-la-lista-/)).toHaveLength(3);
    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno', 'Carmen']);

    // Cada fila muestra solo el nombre: ni teléfono, ni email, ni nota, ni vacaciones.
    const ana = empleadoLlamado(datos, 'Ana');
    const fila = screen.getByTestId(`fila-de-la-lista-${ana.id}`);
    expect(within(fila).getByText('Ana')).toBeTruthy();
    expect(within(fila).getAllByText(/./)).toHaveLength(1);

    // Y se ofrece la acción de dar de alta a un empleado nuevo.
    expect(screen.getByTestId('accion-dar-de-alta')).toHaveTextContent(ACCION_ALTA);
  });

  it('La lista no ofrece dar de baja', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana', 'Bruno'] });
    const ana = empleadoLlamado(datos, 'Ana');
    const fila = screen.getByTestId(`fila-de-la-lista-${ana.id}`);

    // Ni botón de baja, ni deslizamiento lateral, ni pulsación larga.
    expect(screen.queryByTestId(/^accion-dar-de-baja/)).toBeNull();
    expect(screen.queryByText(/baja|borrar|eliminar/i)).toBeNull();
    expect(fila.props.onLongPress).toBeUndefined();
    expect(fila.props.onSwipeableOpen).toBeUndefined();

    // La fila sigue en la lista.
    await fireEvent(fila, 'longPress');
    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno']);
  });

  it('Abrir el panel con la plantilla vacía', async () => {
    await renderizarPanelDeEmpleados({ plantilla: [] });

    expect(screen.queryByTestId(/^fila-de-la-lista-/)).toBeNull();
    expect(screen.getByText(MENSAJE_PLANTILLA_VACIA)).toBeTruthy();
    expect(screen.getByTestId('accion-dar-de-alta-primer-empleado')).toHaveTextContent(
      ACCION_ALTA_PRIMER_EMPLEADO,
    );

    // La acción abre directamente el alta del primer empleado.
    await tocar('accion-dar-de-alta-primer-empleado');
    expect(screen.getByTestId('formulario-alta-empleado')).toBeTruthy();
  });

  it('La lista aparece tras dar de alta al primer empleado', async () => {
    await renderizarPanelDeEmpleados({ plantilla: [] });

    await tocar('accion-dar-de-alta-primer-empleado');
    await fireEvent.changeText(screen.getByTestId('campo-nombre-empleado'), 'Ana');
    await tocar('accion-confirmar-alta');

    expect(nombresDeLaLista()).toEqual(['Ana']);
    expect(screen.queryByText(MENSAJE_PLANTILLA_VACIA)).toBeNull();
  });

  it('cada fila conserva un área pulsable de al menos 44 puntos de alto y todo el ancho', async () => {
    // Con 20 empleados en plantilla, que es la escala real del local.
    const veinte = Array.from({ length: 20 }, (_, i) => `Empleado ${String(i + 1).padStart(2, '0')}`);
    await renderizarPanelDeEmpleados({ plantilla: veinte });

    const filas = screen.getAllByTestId(/^fila-de-la-lista-/);
    expect(filas).toHaveLength(20);

    for (const fila of filas) {
      const estilo = estiloCombinado(fila);
      expect(estilo.minHeight).toBe(LADO_PULSABLE_MINIMO);
      expect(estilo.width).toBe('100%');
    }

    // La lista se recorre con scroll vertical y la acción de alta queda fuera de
    // él: sigue alcanzable sin recorrer la lista entera.
    expect(screen.getByTestId('lista-de-empleados')).toBeTruthy();
    expect(screen.getByTestId('accion-dar-de-alta')).toBeTruthy();

    // Y todo ello a partir del ancho mínimo soportado, el mismo que el cuadrante.
    expect(estiloCombinado(screen.getByTestId('pantalla-empleados')).minWidth).toBe(
      ANCHO_MINIMO_SOPORTADO,
    );
  });

  it('Un nombre largo se trunca en su fila', async () => {
    const nombreLargo = 'María del Carmen Fernández de la Torre y Aguilar';
    const datos = await renderizarPanelDeEmpleados({ plantilla: [nombreLargo] });
    const empleado = empleadoLlamado(datos, nombreLargo);

    const nombre = screen.getByTestId(`nombre-de-la-lista-${empleado.id}`);
    expect(nombre.props.numberOfLines).toBe(1);
    expect(nombre.props.ellipsizeMode).toBe('tail');

    // La fila conserva su área pulsable pese al nombre largo.
    const fila = screen.getByTestId(`fila-de-la-lista-${empleado.id}`);
    expect(estiloCombinado(fila).minHeight).toBe(LADO_PULSABLE_MINIMO);
  });

  it('al tocar una fila se abre la ficha de ese empleado y no la del de al lado', async () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno', 'Carmen']);
    instalarAlmacen(datos);
    const abrir = jest.fn();
    await render(<PantallaEmpleados onAbrirFicha={abrir} />);

    const bruno = empleadoLlamado(datos, 'Bruno');
    await tocar(`fila-de-la-lista-${bruno.id}`);

    expect(abrir).toHaveBeenCalledWith(bruno.id);
  });
});
