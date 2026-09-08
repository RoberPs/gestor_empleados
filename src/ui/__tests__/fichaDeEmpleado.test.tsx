/**
 * La ficha del empleado: apertura y regreso, edición de sus datos y nota.
 */

import { fireEvent, screen } from '@testing-library/react-native';

import { MOTIVO_NOMBRE_REPETIDO, MOTIVO_NOMBRE_VACIO } from '../../dominio/empleado';
import {
  empleadoLlamado,
  estiloCombinado,
  renderizarPanelDeEmpleados,
} from '../../pruebas/ayudas';
import type { AlmacenCuadrante } from '../../datos/almacenCuadrante';
import { ANCHO_MINIMO_SOPORTADO } from '../medidas';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

/** Teclea en un campo de la ficha y termina de editarlo, que es cuando se guarda. */
async function rellenar(testID: string, texto: string) {
  const campo = screen.getByTestId(testID);
  await fireEvent.changeText(campo, texto);
  await fireEvent(campo, 'endEditing');
}

async function abrirLaFichaDe(datos: AlmacenCuadrante, nombre: string) {
  await tocar(`fila-de-la-lista-${empleadoLlamado(datos, nombre).id}`);
}

function nombresDeLaLista(): string[] {
  return screen
    .getAllByTestId(/^nombre-de-la-lista-/)
    .map((nodo) => nodo.props.children as string);
}

describe('Apertura y regreso de la ficha del empleado', () => {
  it('Abrir la ficha de un empleado y volver a la lista', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana', 'Bruno', 'Carmen'] });

    await abrirLaFichaDe(datos, 'Bruno');

    expect(screen.getByTestId('ficha-empleado')).toBeTruthy();
    expect(screen.getByTestId('titulo-de-la-ficha')).toHaveTextContent('Bruno');

    await tocar('accion-volver-a-la-lista');

    expect(nombresDeLaLista()).toEqual(['Ana', 'Bruno', 'Carmen']);
  });

  it('El nombre largo se lee entero en la ficha', async () => {
    const nombreLargo = 'Maricarmen de la Fuente Etxebarria';
    const datos = await renderizarPanelDeEmpleados({ plantilla: [nombreLargo] });

    await abrirLaFichaDe(datos, nombreLargo);

    // El título se reparte en las líneas que necesite: ni se trunca ni aparece
    // ninguna otra marca de texto recortado.
    const titulo = screen.getByTestId('titulo-de-la-ficha');
    expect(titulo).toHaveTextContent(nombreLargo);
    expect(titulo.props.numberOfLines).toBeUndefined();
    expect(titulo.props.ellipsizeMode).toBeUndefined();
    // Y a la anchura mínima soportada, que es donde el nombre no cabe en una línea.
    expect(estiloCombinado(screen.getByTestId('ficha-empleado')).minWidth).toBe(
      ANCHO_MINIMO_SOPORTADO,
    );
  });

  it('Cambiar el nombre reordena la lista', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana', 'Bruno', 'Carmen'] });

    await abrirLaFichaDe(datos, 'Carmen');
    await rellenar('campo-nombre', 'Alberto');
    await tocar('accion-volver-a-la-lista');

    expect(nombresDeLaLista()).toEqual(['Alberto', 'Ana', 'Bruno']);
  });
});

describe('Edición de los datos de la ficha', () => {
  it('Editar el teléfono de un empleado existente', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: [],
      prepararDatos: (almacen) => almacen.altaEmpleado('Bruno', '600 11 22 33'),
    });

    await abrirLaFichaDe(datos, 'Bruno');
    // No hay botón de guardar global: el campo se guarda al terminar de editarlo.
    expect(screen.queryByTestId('accion-guardar-ficha')).toBeNull();
    await rellenar('campo-telefono', '611 22 33 44');

    await tocar('accion-volver-a-la-lista');
    // Y al volver no se pregunta si se descartan los cambios.
    expect(screen.queryByText(/descartar/i)).toBeNull();

    await abrirLaFichaDe(datos, 'Bruno');
    expect(screen.getByTestId('campo-telefono').props.value).toBe('611 22 33 44');
  });

  it('Editar el puesto de un empleado existente', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: [],
      prepararDatos: (almacen) => almacen.altaEmpleado('Bruno', undefined, undefined, 'Cocina'),
    });

    await abrirLaFichaDe(datos, 'Bruno');
    expect(screen.getByTestId('campo-puesto').props.value).toBe('Cocina');
    await rellenar('campo-puesto', 'Jefe de cocina');
    await tocar('accion-volver-a-la-lista');

    // La lista refleja el puesto nuevo en la fila de Bruno.
    const bruno = empleadoLlamado(datos, 'Bruno');
    expect(screen.getByTestId(`puesto-de-la-lista-${bruno.id}`)).toHaveTextContent('Jefe de cocina');
  });

  it('Vaciar el email de un empleado', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: [],
      prepararDatos: (almacen) => almacen.altaEmpleado('Ana', '600 11 22 33', 'ana@ejemplo.es'),
    });

    await abrirLaFichaDe(datos, 'Ana');
    await rellenar('campo-email', '');
    await tocar('accion-volver-a-la-lista');
    await abrirLaFichaDe(datos, 'Ana');

    expect(screen.getByTestId('campo-email').props.value).toBe('');
    // El nombre y el teléfono no han cambiado.
    expect(screen.getByTestId('campo-nombre').props.value).toBe('Ana');
    expect(screen.getByTestId('campo-telefono').props.value).toBe('600 11 22 33');
  });

  it('el nombre editado no puede quedar vacío ni repetir el de otro empleado', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana', 'Bruno'] });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await abrirLaFichaDe(datos, 'Bruno');
    await rellenar('campo-nombre', 'Ana');

    // No se guarda, se explica por qué y lo tecleado sigue ahí para corregirlo.
    expect(screen.getByTestId('motivo-nombre-no-se-guarda')).toHaveTextContent(
      MOTIVO_NOMBRE_REPETIDO,
    );
    expect(screen.getByTestId('campo-nombre').props.value).toBe('Ana');
    expect(datos.leerEmpleado(bruno.id)!.nombre).toBe('Bruno');

    // Vaciarlo tampoco vale.
    await rellenar('campo-nombre', '   ');
    expect(screen.getByTestId('motivo-nombre-no-se-guarda')).toHaveTextContent(MOTIVO_NOMBRE_VACIO);
    expect(datos.leerEmpleado(bruno.id)!.nombre).toBe('Bruno');

    // Al corregirlo, la explicación desaparece y el cambio se guarda.
    await rellenar('campo-nombre', 'Ana G.');
    expect(screen.queryByTestId('motivo-nombre-no-se-guarda')).toBeNull();
    expect(datos.leerEmpleado(bruno.id)!.nombre).toBe('Ana G.');
  });

  it('todos los campos de la ficha son alcanzables recorriéndola verticalmente', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');

    // Ninguno queda fuera de alcance: la ficha entera se recorre con scroll.
    expect(screen.getByTestId('scroll-de-la-ficha')).toBeTruthy();
    expect(screen.getByTestId('campo-nombre')).toBeTruthy();
    expect(screen.getByTestId('campo-telefono')).toBeTruthy();
    expect(screen.getByTestId('campo-email')).toBeTruthy();
    expect(screen.getByTestId('vacaciones-de-la-ficha')).toBeTruthy();
    expect(screen.getByTestId('campo-nota')).toBeTruthy();

    // Y a partir del ancho mínimo soportado, el mismo que el cuadrante.
    expect(estiloCombinado(screen.getByTestId('ficha-empleado')).minWidth).toBe(
      ANCHO_MINIMO_SOPORTADO,
    );
  });

  it('una edición ya guardada no se puede deshacer', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: [],
      prepararDatos: (almacen) => almacen.altaEmpleado('Bruno', '600 11 22 33'),
    });

    await abrirLaFichaDe(datos, 'Bruno');
    await rellenar('campo-telefono', '611 22 33 44');

    // Ni acción de deshacer, ni de recuperar el valor anterior, ni rastro de él.
    expect(screen.queryByText(/deshacer|recuperar|restaurar|revertir/i)).toBeNull();
    expect(screen.queryByText('600 11 22 33')).toBeNull();
  });
});

describe('Nota del empleado', () => {
  it('Escribir y modificar la nota de un empleado', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    expect(screen.getByTestId('campo-nota').props.value).toBe('');

    await rellenar('campo-nota', 'No puede los martes por la tarde');
    await tocar('accion-volver-a-la-lista');
    await abrirLaFichaDe(datos, 'Bruno');
    expect(screen.getByTestId('campo-nota').props.value).toBe('No puede los martes por la tarde');

    await rellenar('campo-nota', 'Solo turnos de mañana');
    await tocar('accion-volver-a-la-lista');
    await abrirLaFichaDe(datos, 'Bruno');
    expect(screen.getByTestId('campo-nota').props.value).toBe('Solo turnos de mañana');
  });

  it('Una nota larga no se recorta', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
    const variosParrafos = [
      'Empezó en la barra y ahora hace también sala los fines de semana.',
      'No puede los martes por la tarde porque tiene clase hasta las nueve.',
      'Prefiere cerrar antes que abrir; en verano avisa con un mes para las vacaciones.',
    ].join('\n\n');

    await abrirLaFichaDe(datos, 'Bruno');
    await rellenar('campo-nota', variosParrafos);
    await tocar('accion-volver-a-la-lista');
    await abrirLaFichaDe(datos, 'Bruno');

    // Entera, sin recortar y sin ningún indicador de contenido oculto.
    const nota = screen.getByTestId('campo-nota');
    expect(nota.props.value).toBe(variosParrafos);
    expect(nota.props.maxLength).toBeUndefined();
    expect(nota.props.numberOfLines).toBeUndefined();
    expect(nota.props.multiline).toBe(true);

    // La nota se puede vaciar.
    await rellenar('campo-nota', '');
    expect(datos.leerEmpleado(empleadoLlamado(datos, 'Bruno').id)!.nota).toBeUndefined();
  });
});
