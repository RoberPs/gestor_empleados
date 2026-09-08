/**
 * Copiar el contenido de una celda y pegarlo en otra, desde la pantalla.
 *
 * Lo que se comprueba aquí es el recorrido entero tal y como lo hace el encargado:
 * abrir la celda, elegir la acción, y ver la otra celda cambiada —o no, cuando
 * desiste—. Que lo copiado no lleve identificadores de turno se comprueba además en
 * `dominio/__tests__/copia.test.ts`.
 */

import { fireEvent, screen, within } from '@testing-library/react-native';

import type { AlmacenCuadrante } from '../../datos/almacenCuadrante';
import {
  empleadoLlamado,
  hora,
  JUEVES,
  LUNES,
  MARTES,
  MIERCOLES,
  renderizarCuadrante,
} from '../../pruebas/ayudas';

/** Martes de la semana siguiente: la que se ve tras tocar «Semana siguiente». */
const MARTES_DE_LA_SEMANA_SIGUIENTE = '2026-09-15';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function abrirCelda(idEmpleado: string, dia: string) {
  await fireEvent.press(screen.getByTestId(`celda-${idEmpleado}-${dia}`));
}

function celda(idEmpleado: string, dia: string) {
  return screen.getByTestId(`celda-${idEmpleado}-${dia}`);
}

/** Abre la celda y copia lo que tiene. */
async function copiarCelda(idEmpleado: string, dia: string) {
  await abrirCelda(idEmpleado, dia);
  await tocar('accion-copiar');
}

/** Abre la celda y pega en ella. Sin confirmar: sobre celda vacía no se pregunta. */
async function pegarEnCelda(idEmpleado: string, dia: string) {
  await abrirCelda(idEmpleado, dia);
  await tocar('accion-pegar');
}

const turnoDe = (datos: AlmacenCuadrante, id: string, dia: string, inicio: number, fin: number) =>
  datos.crearTurno(id, dia, hora(inicio), hora(fin));

describe('Copiar el contenido de una celda y pegarlo en otra', () => {
  it('Copiar un turno planificado y repetirlo otro día', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (datos) => turnoDe(datos, empleadoLlamado(datos, 'Bruno').id, LUNES, 9, 17),
    });
    const bruno = empleado('Bruno');

    await copiarCelda(bruno.id, LUNES);

    // Vuelve al cuadrante en la misma semana, y la celda de origen no ha cambiado.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(bruno.id, LUNES)).getByText('09:00')).toBeTruthy();
    expect(within(celda(bruno.id, LUNES)).getByText('17:00')).toBeTruthy();

    await pegarEnCelda(bruno.id, MARTES);

    expect(within(celda(bruno.id, MARTES)).getByText('09:00')).toBeTruthy();
    expect(within(celda(bruno.id, MARTES)).getByText('17:00')).toBeTruthy();
    // Y el lunes sigue como estaba: copiar no mueve nada.
    expect(within(celda(bruno.id, LUNES)).getByText('09:00')).toBeTruthy();
    expect(within(celda(bruno.id, LUNES)).getByText('17:00')).toBeTruthy();
  });

  it('Pegar el mismo turno en varias celdas sin volver a copiar', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (datos) => turnoDe(datos, empleadoLlamado(datos, 'Bruno').id, LUNES, 9, 17),
    });
    const ana = empleado('Ana');
    const bruno = empleado('Bruno');

    await copiarCelda(bruno.id, LUNES);
    await pegarEnCelda(bruno.id, MARTES);
    await pegarEnCelda(bruno.id, MIERCOLES);
    await pegarEnCelda(ana.id, LUNES);

    const pegadas = [
      [bruno.id, MARTES],
      [bruno.id, MIERCOLES],
      [ana.id, LUNES],
    ] as const;
    for (const [id, dia] of pegadas) {
      expect(within(celda(id, dia)).getByText('09:00')).toBeTruthy();
      expect(within(celda(id, dia)).getByText('17:00')).toBeTruthy();
    }
  });

  it('Copiar una celda con dos turnos', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = empleadoLlamado(datos, 'Ana').id;
        turnoDe(datos, ana, LUNES, 12, 16);
        datos.crearTurno(ana, LUNES, hora(20), hora(0));
      },
    });
    const ana = empleado('Ana');

    await copiarCelda(ana.id, LUNES);
    await pegarEnCelda(ana.id, JUEVES);

    const jueves = within(celda(ana.id, JUEVES));
    expect(jueves.getByText('12:00')).toBeTruthy();
    expect(jueves.getByText('16:00')).toBeTruthy();
    expect(jueves.getByText('20:00')).toBeTruthy();
    expect(jueves.getByText('00:00')).toBeTruthy();

    // Y ya no se le ofrece añadir otro turno: la celda tiene los dos.
    await abrirCelda(ana.id, JUEVES);
    expect(screen.queryByTestId('accion-anadir-segundo-turno')).toBeNull();
  });

  it('Copiar unas vacaciones y extenderlas a los demás días', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Carmen'],
      prepararDatos: (datos) => datos.marcarVacaciones(empleadoLlamado(datos, 'Carmen').id, LUNES),
    });
    const carmen = empleado('Carmen');

    await copiarCelda(carmen.id, LUNES);
    await pegarEnCelda(carmen.id, MARTES);
    await pegarEnCelda(carmen.id, MIERCOLES);

    for (const dia of [LUNES, MARTES, MIERCOLES]) {
      expect(within(celda(carmen.id, dia)).getByText('VAC')).toBeTruthy();
    }
  });

  it('Pegar en otra semana', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => turnoDe(datos, empleadoLlamado(datos, 'Ana').id, LUNES, 9, 17),
    });
    const ana = empleado('Ana');

    await copiarCelda(ana.id, LUNES);
    await tocar('accion-semana-siguiente');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');

    // Se le sigue ofreciendo pegar en la semana nueva.
    await abrirCelda(ana.id, MARTES_DE_LA_SEMANA_SIGUIENTE);
    expect(screen.getByTestId('accion-pegar')).toBeTruthy();
    await tocar('accion-pegar');

    expect(within(celda(ana.id, MARTES_DE_LA_SEMANA_SIGUIENTE)).getByText('09:00')).toBeTruthy();
    // Y sigue viendo el cuadrante en esa misma semana.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
  });

  it('Una celda vacía no se puede copiar', async () => {
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });

    await abrirCelda(empleado('Ana').id, LUNES);

    expect(screen.queryByTestId('accion-copiar')).toBeNull();
  });

  it('Sin nada copiado no se ofrece pegar', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => turnoDe(datos, empleadoLlamado(datos, 'Ana').id, LUNES, 9, 17),
    });
    const ana = empleado('Ana');

    for (const dia of [LUNES, MARTES]) {
      await abrirCelda(ana.id, dia);
      expect(screen.queryByTestId('accion-pegar')).toBeNull();
      await tocar('accion-cancelar');
    }
  });

  it('Copiar otra celda sustituye lo copiado', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = empleadoLlamado(datos, 'Ana').id;
        turnoDe(datos, ana, LUNES, 9, 17);
        turnoDe(datos, ana, MARTES, 20, 23);
      },
    });
    const ana = empleado('Ana');

    await copiarCelda(ana.id, LUNES);
    await copiarCelda(ana.id, MARTES);
    await pegarEnCelda(ana.id, JUEVES);

    const jueves = within(celda(ana.id, JUEVES));
    expect(jueves.getByText('20:00')).toBeTruthy();
    expect(jueves.getByText('23:00')).toBeTruthy();
    expect(jueves.queryByText('09:00')).toBeNull();
  });

  it('Copiar no se lleva los datos de la ficha', async () => {
    const { empleado, datos } = await renderizarCuadrante({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (almacen) => {
        const bruno = empleadoLlamado(almacen, 'Bruno').id;
        almacen.editarTelefono(bruno, '600112233');
        almacen.editarEmail(bruno, 'bruno@ejemplo.es');
        almacen.editarNota(bruno, 'Prefiere los turnos de tarde');
        almacen.editarMotivoAusencia(bruno, 'Baja médica');
        almacen.marcarAusencia(bruno, MARTES);
      },
    });
    const ana = empleado('Ana');
    const bruno = empleado('Bruno');

    await copiarCelda(bruno.id, MARTES);
    await pegarEnCelda(ana.id, JUEVES);

    // La celda de Ana muestra la ausencia y nada más.
    expect(within(celda(ana.id, JUEVES)).getByText('AUS')).toBeTruthy();
    const datosDeLaFicha = [
      '600112233',
      'bruno@ejemplo.es',
      'Prefiere los turnos de tarde',
      'Baja médica',
    ];
    for (const dato of datosDeLaFicha) {
      expect(screen.queryByText(dato)).toBeNull();
    }
    // Y la ficha de Ana no ha ganado nada de la de Bruno.
    expect(datos.leerEmpleado(ana.id)).toEqual({ id: ana.id, nombre: 'Ana' });
  });

  it('copiar no escribe nada en el cuadrante', async () => {
    const { empleado, datos } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (almacen) => turnoDe(almacen, empleadoLlamado(almacen, 'Ana').id, LUNES, 9, 17),
    });
    const ana = empleado('Ana');
    const retrato = () => JSON.stringify([...datos.leerSemana({ lunes: LUNES })]);
    const antes = retrato();

    await copiarCelda(ana.id, LUNES);

    expect(retrato()).toEqual(antes);
  });
});

describe('Pegar sobre una celda con contenido pide confirmación', () => {
  it('Pegar sobre un turno planificado existente', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = empleadoLlamado(datos, 'Ana').id;
        turnoDe(datos, ana, LUNES, 9, 17);
        turnoDe(datos, ana, MARTES, 20, 23);
      },
    });
    const ana = empleado('Ana');

    await copiarCelda(ana.id, LUNES);
    await abrirCelda(ana.id, MARTES);
    await tocar('accion-pegar');

    // Se le pide confirmar, y la pregunta nombra lo que va a desaparecer.
    expect(screen.getByTestId('confirmacion-eliminar')).toBeTruthy();
    expect(screen.getByText(/20:00 a 23:00/)).toBeTruthy();

    await tocar('accion-confirmar-eliminacion');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    const martes = within(celda(ana.id, MARTES));
    expect(martes.getByText('09:00')).toBeTruthy();
    expect(martes.getByText('17:00')).toBeTruthy();
    expect(martes.queryByText('20:00')).toBeNull();
    expect(martes.queryByText('23:00')).toBeNull();
  });

  it('Desistir de pegar encima', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = empleadoLlamado(datos, 'Ana').id;
        turnoDe(datos, ana, LUNES, 9, 17);
        datos.marcarVacaciones(ana, MARTES);
      },
    });
    const ana = empleado('Ana');

    await copiarCelda(ana.id, LUNES);
    await abrirCelda(ana.id, MARTES);
    await tocar('accion-pegar');
    await tocar('accion-desistir');

    // La celda conserva sus vacaciones.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(within(celda(ana.id, MARTES)).getByText('VAC')).toBeTruthy();

    // Y lo copiado sigue disponible para pegarlo en otro sitio.
    await abrirCelda(ana.id, JUEVES);
    expect(screen.getByTestId('accion-pegar')).toBeTruthy();
  });

  it('Pegar en una celda vacía no pregunta nada', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => turnoDe(datos, empleadoLlamado(datos, 'Ana').id, LUNES, 9, 17),
    });
    const ana = empleado('Ana');

    await copiarCelda(ana.id, LUNES);
    await abrirCelda(ana.id, MARTES);
    await tocar('accion-pegar');

    expect(screen.queryByTestId('confirmacion-eliminar')).toBeNull();
    expect(within(celda(ana.id, MARTES)).getByText('09:00')).toBeTruthy();
  });

  it('un pegado confirmado no se puede deshacer', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = empleadoLlamado(datos, 'Ana').id;
        turnoDe(datos, ana, LUNES, 9, 17);
        turnoDe(datos, ana, MARTES, 20, 23);
      },
    });
    const ana = empleado('Ana');

    await copiarCelda(ana.id, LUNES);
    await abrirCelda(ana.id, MARTES);
    await tocar('accion-pegar');
    // El diálogo avisa de que no hay vuelta atrás, igual que al eliminar.
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeTruthy();
    await tocar('accion-confirmar-eliminacion');

    expect(screen.queryByText(/deshacer/i)).toBeNull();
    await abrirCelda(ana.id, MARTES);
    expect(screen.queryByTestId('accion-deshacer')).toBeNull();
  });
});
