/**
 * La lista de la plantilla dentro del panel de empleados.
 */

import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { crearAlmacenEnMemoria, instalarAlmacen } from '../../datos/almacenCuadrante';
import type { AlmacenCuadrante } from '../../datos/almacenCuadrante';
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

/** Escribe los puestos de una plantilla ya dada de alta. */
function conPuestos(puestos: Record<string, string>) {
  return (almacen: AlmacenCuadrante) => {
    for (const [nombre, puesto] of Object.entries(puestos)) {
      almacen.editarPuesto(empleadoLlamado(almacen, nombre).id, puesto);
    }
  };
}

describe('Lista de empleados del panel', () => {
  it('Ver la lista de la plantilla', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: ['Carmen', 'Ana', 'Bruno'],
      prepararDatos: conPuestos({ Ana: 'Barra', Bruno: 'Cocina', Carmen: 'Sala' }),
    });

    // Tres filas, en orden alfabético del español.
    expect(screen.getAllByTestId(/^fila-de-la-lista-/)).toHaveLength(3);
    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno', 'Carmen']);

    // Cada fila muestra el nombre y el puesto de ese empleado, y un acceso a su
    // ficha al final: ni teléfono, ni email, ni nota, ni vacaciones.
    for (const [nombre, puesto] of [
      ['Ana', 'Barra'],
      ['Bruno', 'Cocina'],
      ['Carmen', 'Sala'],
    ]) {
      const empleado = empleadoLlamado(datos, nombre);
      const fila = screen.getByTestId(`fila-de-la-lista-${empleado.id}`);
      expect(within(fila).getByTestId(`nombre-de-la-lista-${empleado.id}`)).toHaveTextContent(nombre);
      expect(within(fila).getByTestId(`puesto-de-la-lista-${empleado.id}`)).toHaveTextContent(puesto);
      expect(within(fila).getByTestId(`acceso-a-la-ficha-${empleado.id}`)).toBeTruthy();
    }

    // Y se ofrece la acción de dar de alta a un empleado nuevo.
    expect(screen.getByTestId('accion-dar-de-alta')).toHaveTextContent(ACCION_ALTA);
  });

  it('Un empleado sin puesto escrito', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: conPuestos({ Ana: 'Barra' }),
    });
    const ana = empleadoLlamado(datos, 'Ana');
    const bruno = empleadoLlamado(datos, 'Bruno');

    expect(screen.getByTestId(`puesto-de-la-lista-${ana.id}`)).toHaveTextContent('Barra');
    // Ni hueco vacío ni texto de relleno: la fila de Bruno muestra solo su nombre.
    expect(screen.queryByTestId(`puesto-de-la-lista-${bruno.id}`)).toBeNull();
    expect(screen.getByTestId(`nombre-de-la-lista-${bruno.id}`)).toHaveTextContent('Bruno');

    // Y las dos filas conservan el mismo alto.
    const alto = (id: string) => estiloCombinado(screen.getByTestId(`fila-de-la-lista-${id}`));
    expect(alto(bruno.id).minHeight).toBe(alto(ana.id).minHeight);
    expect(alto(bruno.id).height).toBe(alto(ana.id).height);
  });

  it('El puesto se trunca antes que el nombre', async () => {
    const nombreLargo = 'Maricarmen de la Fuente Etxebarria';
    const datos = await renderizarPanelDeEmpleados({
      plantilla: [nombreLargo],
      prepararDatos: conPuestos({ [nombreLargo]: 'Responsable de sala y barra' }),
    });
    const empleado = empleadoLlamado(datos, nombreLargo);

    const nombre = estiloCombinado(screen.getByTestId(`nombre-de-la-lista-${empleado.id}`));
    const puesto = estiloCombinado(screen.getByTestId(`puesto-de-la-lista-${empleado.id}`));

    // El puesto cede ancho mucho antes que el nombre.
    expect(Number(puesto.flexShrink)).toBeGreaterThan(Number(nombre.flexShrink));
    expect(Number(nombre.flexShrink)).toBeGreaterThan(0);

    // El acceso a la ficha no cede ninguno: sigue visible y pulsable.
    const acceso = screen.getByTestId(`acceso-a-la-ficha-${empleado.id}`);
    expect(estiloCombinado(acceso).flexShrink).toBe(0);
    expect(estiloCombinado(acceso).minWidth).toBe(LADO_PULSABLE_MINIMO);
    expect(estiloCombinado(acceso).minHeight).toBe(LADO_PULSABLE_MINIMO);
  });

  it('El acceso de la fila y la fila llevan al mismo sitio', async () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);
    instalarAlmacen(datos);
    const abrir = jest.fn();
    await render(<PantallaEmpleados onAbrirFicha={abrir} />);
    const bruno = empleadoLlamado(datos, 'Bruno');

    await tocar(`acceso-a-la-ficha-${bruno.id}`);
    expect(abrir).toHaveBeenCalledWith(bruno.id);

    // Y cualquier otro punto de la fila lleva a la misma ficha: el acceso es la
    // pista visual, no el único camino.
    abrir.mockClear();
    await tocar(`fila-de-la-lista-${bruno.id}`);
    expect(abrir).toHaveBeenCalledWith(bruno.id);
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
