/**
 * Privacidad, idioma y formatos del panel de empleados.
 *
 * El teléfono, el email y la nota solo se ven y se editan en la ficha: ni la lista
 * ni el cuadrante los muestran.
 */

import { fireEvent, render, screen, within } from '@testing-library/react-native';

import type { AlmacenCuadrante } from '../../datos/almacenCuadrante';
import { ETIQUETA_AUSENCIA } from '../../dominio/tipos';
import {
  empleadoLlamado,
  MIERCOLES_A_LAS_DIEZ,
  renderizarPanelDeEmpleados,
} from '../../pruebas/ayudas';
import { ANCHO_MINIMO_SOPORTADO } from '../medidas';
import { PantallaCuadrante } from '../PantallaCuadrante';

const PUESTO = 'Cocina';
const TELEFONO = '600 11 22 33';
const EMAIL = 'bruno@ejemplo.es';
const NOTA = 'No puede los martes por la tarde';
const MOTIVO_AUSENCIA = 'Baja médica hasta el 20/09/2026';

/** Todo el texto que la pantalla muestra ahora mismo, recorriendo el árbol pintado. */
function textosEnPantalla(): string[] {
  const textos: string[] = [];

  const recorrer = (nodo: unknown): void => {
    if (typeof nodo === 'string') {
      const texto = nodo.trim();
      if (texto.length > 0) textos.push(texto);
      return;
    }
    if (Array.isArray(nodo)) {
      nodo.forEach(recorrer);
      return;
    }
    if (nodo && typeof nodo === 'object' && 'children' in nodo) {
      recorrer((nodo as { children: unknown }).children);
    }
  };

  recorrer(screen.toJSON());
  return textos;
}

function conBruno(almacen: AlmacenCuadrante) {
  const bruno = almacen.altaEmpleado('Bruno', TELEFONO, EMAIL, PUESTO)!;
  almacen.editarNota(bruno.id, NOTA);
  almacen.editarMotivoAusencia(bruno.id, MOTIVO_AUSENCIA);
  almacen.marcarRangoDeVacaciones(bruno.id, { inicio: '2026-09-10', fin: '2026-09-14' });
  almacen.marcarAusencia(bruno.id, '2026-09-08');
}

/** Lo que ninguna pantalla fuera de la ficha puede llegar a mostrar. */
const LO_QUE_NO_SALE_DE_LA_FICHA = [/600/, /ejemplo\.es/, /martes/, /[Bb]aja médica/];

describe('Privacidad de los datos de contacto y de la nota', () => {
  it('El teléfono y el email no salen de la ficha', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'], prepararDatos: conBruno });
    const bruno = empleadoLlamado(datos, 'Bruno');

    // En la lista de empleados se muestran su nombre y su puesto, y nada más.
    const enLaLista = textosEnPantalla().join(' ');
    expect(enLaLista).toMatch(/Bruno/);
    expect(screen.getByTestId(`puesto-de-la-lista-${bruno.id}`)).toHaveTextContent(PUESTO);
    for (const oculto of LO_QUE_NO_SALE_DE_LA_FICHA) expect(enLaLista).not.toMatch(oculto);

    // Y en el cuadrante solo su nombre: ahí ni siquiera sale el puesto.
    await render(
      <PantallaCuadrante
        reloj={() => MIERCOLES_A_LAS_DIEZ}
        anchoDePantalla={ANCHO_MINIMO_SOPORTADO}
      />,
    );
    const enElCuadrante = textosEnPantalla().join(' ');
    expect(screen.getByTestId(`nombre-empleado-${bruno.id}`)).toHaveTextContent('Bruno');
    expect(enElCuadrante).not.toMatch(new RegExp(PUESTO));
    for (const oculto of LO_QUE_NO_SALE_DE_LA_FICHA) expect(enElCuadrante).not.toMatch(oculto);

    // Abriendo las acciones de una celda suya, siguen sin aparecer.
    await fireEvent.press(screen.getByTestId(`celda-${bruno.id}-2026-09-10`));
    const conAcciones = textosEnPantalla().join(' ');
    for (const oculto of LO_QUE_NO_SALE_DE_LA_FICHA) expect(conAcciones).not.toMatch(oculto);
  });

  it('La celda de ausencia no muestra el motivo', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: [], prepararDatos: conBruno });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await render(
      <PantallaCuadrante
        reloj={() => MIERCOLES_A_LAS_DIEZ}
        anchoDePantalla={ANCHO_MINIMO_SOPORTADO}
      />,
    );

    // La celda del martes muestra la etiqueta de ausencia y nada más: ni el motivo,
    // ni ninguna marca de que lo tenga escrito.
    const celda = screen.getByTestId(`celda-${bruno.id}-2026-09-08`);
    expect(celda).toHaveTextContent(ETIQUETA_AUSENCIA);
    expect(celda).not.toHaveTextContent(/baja|médica/i);
    expect(within(celda).getAllByText(/./)).toHaveLength(1);
  });

  it('el puesto, el teléfono, el email, la nota y el motivo se ven y se editan en la ficha', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: [], prepararDatos: conBruno });

    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`));

    for (const campo of [
      'campo-puesto',
      'campo-telefono',
      'campo-email',
      'campo-nota',
      'campo-motivo-ausencia',
    ]) {
      // Ninguno es de solo lectura para el encargado.
      expect(screen.getByTestId(campo).props.editable).not.toBe(false);
    }
    expect(screen.getByTestId('campo-puesto').props.value).toBe(PUESTO);
    expect(screen.getByTestId('campo-telefono').props.value).toBe(TELEFONO);
    expect(screen.getByTestId('campo-email').props.value).toBe(EMAIL);
    expect(screen.getByTestId('campo-nota').props.value).toBe(NOTA);
    expect(screen.getByTestId('campo-motivo-ausencia').props.value).toBe(MOTIVO_AUSENCIA);
  });
});

describe('Idioma y formatos del panel', () => {
  it('Formatos del panel de empleados', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: [], prepararDatos: conBruno });

    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`));

    // Las fechas del rango, como dd/mm/aaaa.
    expect(screen.getByTestId('fechas-del-rango-2026-09-10')).toHaveTextContent(
      '10/09/2026 - 14/09/2026',
    );

    // Y los textos de la pantalla, en español de España.
    expect(screen.getByText('Teléfono')).toBeTruthy();
    expect(screen.getByText('Nota')).toBeTruthy();
    expect(screen.getByText('Vacaciones')).toBeTruthy();
  });

  it('no hay ningún literal en otro idioma en el panel', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: [], prepararDatos: conBruno });

    const textoDeLaLista = textosEnPantalla().join(' ');
    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Bruno').id}`));
    const textoDeLaFicha = textosEnPantalla().join(' ');

    // "Email" no entra en la lista: es la palabra que usa la propia spec para ese
    // campo y la que el encargado lee en su móvil todos los días.
    for (const palabra of [
      'Employee',
      'Staff',
      'Phone',
      'Note',
      'Holiday',
      'Add',
      'Edit',
      'Delete',
      'Cancel',
      'Save',
      'Back',
    ]) {
      const literal = new RegExp(`\\b${palabra}\\b`, 'i');
      expect(textoDeLaLista).not.toMatch(literal);
      expect(textoDeLaFicha).not.toMatch(literal);
    }
  });
});
