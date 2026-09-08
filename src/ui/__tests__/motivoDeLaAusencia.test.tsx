/**
 * El motivo de la ausencia: se escribe en la ficha y se llega a él desde la celda.
 *
 * El motivo es del empleado, no del día: uno por persona, como la nota. La celda del
 * cuadrante no cambia por tenerlo escrito —sigue mostrando `AUS` y nada más— y las
 * dos cosas son independientes: escribir el motivo no marca ninguna celda, y marcar
 * una ausencia no pide ningún motivo.
 */

import { fireEvent, screen } from '@testing-library/react-native';

import { ETIQUETA_AUSENCIA } from '../../dominio/tipos';
import {
  empleadoLlamado,
  MARTES,
  JUEVES,
  renderizarCuadranteConFicha,
  renderizarPanelDeEmpleados,
} from '../../pruebas/ayudas';
import { TEXTO_GUARDADO } from '../AvisoDeGuardado';

const MOTIVO = 'Baja médica hasta el 20/09/2026';

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

async function abrirLaFichaDe(datos: Parameters<typeof empleadoLlamado>[0], nombre: string) {
  await tocar(`fila-de-la-lista-${empleadoLlamado(datos, nombre).id}`);
}

describe('Motivo de la ausencia desde la ficha', () => {
  it('Escribir el motivo de la ausencia de un empleado', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });

    await abrirLaFichaDe(datos, 'Bruno');
    // Bruno no tiene motivo escrito: el campo está vacío y listo para escribir.
    expect(screen.getByTestId('campo-motivo-ausencia').props.value).toBe('');
    expect(screen.queryByTestId('guardado-campo-motivo-ausencia')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('campo-motivo-ausencia'), MOTIVO);

    // Junto al campo se indica que ha quedado guardado, igual que en la nota.
    expect(screen.getByTestId('guardado-campo-motivo-ausencia')).toHaveTextContent(TEXTO_GUARDADO);

    await tocar('accion-volver-a-la-lista');
    await abrirLaFichaDe(datos, 'Bruno');
    expect(screen.getByTestId('campo-motivo-ausencia').props.value).toBe(MOTIVO);
  });

  it('El motivo de la ausencia se puede vaciar', async () => {
    const datos = await renderizarPanelDeEmpleados({
      plantilla: [],
      prepararDatos: (almacen) => {
        const bruno = almacen.altaEmpleado('Bruno', '600 11 22 33', 'bruno@ejemplo.es', 'Cocina')!;
        almacen.editarNota(bruno.id, 'No puede los martes');
        almacen.editarMotivoAusencia(bruno.id, MOTIVO);
      },
    });

    await abrirLaFichaDe(datos, 'Bruno');
    await fireEvent.changeText(screen.getByTestId('campo-motivo-ausencia'), '');
    await tocar('accion-volver-a-la-lista');
    await abrirLaFichaDe(datos, 'Bruno');

    expect(screen.getByTestId('campo-motivo-ausencia').props.value).toBe('');
    // Y el resto de datos de Bruno no han cambiado.
    expect(screen.getByTestId('campo-nombre').props.value).toBe('Bruno');
    expect(screen.getByTestId('campo-puesto').props.value).toBe('Cocina');
    expect(screen.getByTestId('campo-telefono').props.value).toBe('600 11 22 33');
    expect(screen.getByTestId('campo-email').props.value).toBe('bruno@ejemplo.es');
    expect(screen.getByTestId('campo-nota').props.value).toBe('No puede los martes');
  });

  it('el motivo es de texto libre, multilínea y sin longitud máxima, como la nota', async () => {
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Bruno'] });
    await abrirLaFichaDe(datos, 'Bruno');

    const motivo = screen.getByTestId('campo-motivo-ausencia');
    const nota = screen.getByTestId('campo-nota');

    // Ni categorías, ni lista cerrada, ni fecha, ni más de un motivo por empleado.
    expect(motivo.props.maxLength).toBeUndefined();
    expect(motivo.props.numberOfLines).toBeUndefined();
    expect(motivo.props.multiline).toBe(true);
    expect(motivo.props.multiline).toBe(nota.props.multiline);
    expect(screen.getAllByTestId('campo-motivo-ausencia')).toHaveLength(1);
  });

  it('El motivo no obliga a marcar ausencias', async () => {
    const datos = await renderizarCuadranteConFicha({ plantilla: ['Ana', 'Bruno'] });
    const bruno = empleadoLlamado(datos, 'Bruno');

    // Se escribe el motivo desde la ficha, que se abre por el nombre de su fila.
    await tocar(`columna-nombres-${bruno.id}`);
    await fireEvent.changeText(screen.getByTestId('campo-motivo-ausencia'), MOTIVO);
    await tocar('accion-volver-a-la-lista');

    // Y ninguna celda de Bruno ha cambiado de estado.
    for (const dia of [MARTES, JUEVES]) {
      expect(datos.leerCelda(bruno.id, dia)).toEqual({ tipo: 'vacia' });
      expect(screen.getByTestId(`celda-${bruno.id}-${dia}`)).not.toHaveTextContent(
        ETIQUETA_AUSENCIA,
      );
    }
  });

  it('Marcar una ausencia no exige escribir el motivo', async () => {
    const datos = await renderizarCuadranteConFicha({ plantilla: ['Ana', 'Bruno'] });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await tocar(`celda-${bruno.id}-${MARTES}`);
    await tocar('accion-marcar-ausencia');

    // La marca de golpe, sin pedir ningún motivo por el camino.
    expect(screen.queryByTestId('campo-motivo-ausencia')).toBeNull();
    expect(datos.leerCelda(bruno.id, MARTES)).toEqual({ tipo: 'ausencia' });
    expect(screen.getByTestId(`celda-${bruno.id}-${MARTES}`)).toHaveTextContent(ETIQUETA_AUSENCIA);
    expect(datos.leerEmpleado(bruno.id)!.motivoAusencia).toBeUndefined();
  });
});

describe('Ver la ausencia desde el cuadrante', () => {
  it('Ver la ausencia desde la celda', async () => {
    const datos = await renderizarCuadranteConFicha({
      plantilla: ['Ana', 'Bruno'],
      prepararDatos: (almacen) => {
        const bruno = almacen.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
        almacen.marcarAusencia(bruno.id, MARTES);
      },
    });
    const bruno = empleadoLlamado(datos, 'Bruno');

    // Se deja el cuadrante en otra semana para comprobar que vuelve a ella.
    await tocar('accion-semana-siguiente');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    await tocar('accion-semana-anterior');

    await tocar(`celda-${bruno.id}-${MARTES}`);
    expect(screen.getByTestId('accion-ver-ausencia')).toHaveTextContent('Ver la ausencia');

    await tocar('accion-ver-ausencia');

    // Se abre la ficha de Bruno, donde puede leer y escribir el motivo.
    expect(screen.getByTestId('titulo-de-la-ficha')).toHaveTextContent('Bruno');
    await fireEvent.changeText(screen.getByTestId('campo-motivo-ausencia'), MOTIVO);
    expect(datos.leerEmpleado(bruno.id)!.motivoAusencia).toBe(MOTIVO);

    // Y al volver, el cuadrante sigue en la misma semana.
    await tocar('accion-volver-a-la-lista');
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(screen.getByTestId(`celda-${bruno.id}-${MARTES}`)).toHaveTextContent(ETIQUETA_AUSENCIA);
  });

  it('Ver la ausencia de quien no tiene motivo escrito', async () => {
    const datos = await renderizarCuadranteConFicha({
      plantilla: ['Carmen'],
      prepararDatos: (almacen) => {
        const carmen = almacen.listarEmpleados()[0]!;
        almacen.marcarAusencia(carmen.id, JUEVES);
      },
    });
    const carmen = empleadoLlamado(datos, 'Carmen');
    expect(carmen.motivoAusencia).toBeUndefined();

    await tocar(`celda-${carmen.id}-${JUEVES}`);

    // La acción se ofrece igualmente: la celda no sabe si hay motivo escrito.
    expect(screen.getByTestId('accion-ver-ausencia')).toBeTruthy();

    await tocar('accion-ver-ausencia');

    expect(screen.getByTestId('titulo-de-la-ficha')).toHaveTextContent('Carmen');
    expect(screen.getByTestId('campo-motivo-ausencia').props.value).toBe('');
    expect(screen.getByTestId('campo-motivo-ausencia').props.editable).not.toBe(false);
  });

  it('las acciones de la celda no muestran el motivo, tenga o no escrito uno', async () => {
    const datos = await renderizarCuadranteConFicha({
      plantilla: ['Bruno'],
      prepararDatos: (almacen) => {
        const bruno = almacen.listarEmpleados()[0]!;
        almacen.marcarAusencia(bruno.id, MARTES);
        almacen.editarMotivoAusencia(bruno.id, MOTIVO);
      },
    });
    const bruno = empleadoLlamado(datos, 'Bruno');

    await tocar(`celda-${bruno.id}-${MARTES}`);

    // La rejilla sigue mostrando la ausencia como una etiqueta y nada más: el
    // motivo solo se lee en la ficha.
    expect(screen.getByTestId('acciones-de-celda')).not.toHaveTextContent(/baja|médica/i);
  });
});
