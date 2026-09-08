/**
 * Lo que se puede comprobar de la identidad visual sin ver la pantalla: qué
 * tamaño, qué peso y qué color declara cada texto.
 *
 * Lo que sí necesita el ojo —si de verdad se lee al sol, si la rejilla no se
 * convierte en una reja, si los dígitos quedan alineados en el dispositivo— está
 * en docs/verificacion-manual.md.
 */

import { fireEvent, screen, within } from '@testing-library/react-native';

import { diasDeLaSemana } from '../../dominio/semana';
import {
  anchoDe,
  empleadoLlamado,
  estiloCombinado,
  hora,
  renderizarCuadrante,
  renderizarPanelDeEmpleados,
} from '../../pruebas/ayudas';
import { ANCHO_MINIMO_SOPORTADO, LADO_PULSABLE_MINIMO, repartirAnchos } from '../medidas';
import { colores, pesos, tipografia } from '../tema';

const LUNES = '2026-09-07';
const MIERCOLES = '2026-09-09';

describe('Escala tipográfica de la aplicación', () => {
  it('Jerarquía dentro de la cabecera de la rejilla', async () => {
    await renderizarCuadrante();

    const cabecera = screen.getByTestId(`cabecera-dia-${LUNES}`);
    const nombreDeDia = estiloCombinado(within(cabecera).getByText('Lunes'));
    const diaDelMes = estiloCombinado(within(cabecera).getByText('07'));

    expect(diaDelMes.fontSize).toBe(tipografia.diaDelMes);
    expect(diaDelMes.fontWeight).toBe(pesos.bold);
    expect(nombreDeDia.fontSize).toBe(tipografia.nombreDeDia);
    expect(nombreDeDia.fontWeight).toBe(pesos.medium);

    // El día del mes pesa más que el nombre del día: es el dato que se busca.
    expect(Number(diaDelMes.fontSize)).toBeGreaterThan(Number(nombreDeDia.fontSize));
  });

  it('el nombre del día se muestra completo y sin poner en mayúsculas', async () => {
    await renderizarCuadrante();

    const cabecera = screen.getByTestId(`cabecera-dia-${LUNES}`);
    const nombreDeDia = within(cabecera).getByText('Lunes');

    // A 360 puntos, «MIÉRCOLES» en caja alta obligaría a bajar el cuerpo por
    // debajo de lo legible, y el día no se puede abreviar.
    expect(estiloCombinado(nombreDeDia).textTransform).toBeUndefined();
    expect(nombreDeDia.props.adjustsFontSizeToFit).toBe(true);
  });
});

describe('La identidad visual no altera el comportamiento ni la estructura', () => {
  it('El cuadrante conserva su geometría', async () => {
    const plantilla = Array.from({ length: 20 }, (_, i) => `Empleado ${String(i).padStart(2, '0')}`);
    const { empleado } = await renderizarCuadrante({
      plantilla,
      anchoDePantalla: ANCHO_MINIMO_SOPORTADO,
      prepararDatos: (datos) => {
        const primero = datos.listarEmpleados()[0]!;
        datos.crearTurno(primero.id, MIERCOLES, hora(9), hora(17));
      },
    });

    const anchos = repartirAnchos(ANCHO_MINIMO_SOPORTADO);
    for (const dia of diasDeLaSemana({ lunes: LUNES })) {
      expect(anchoDe(screen.getByTestId(`cabecera-dia-${dia}`))).toBe(anchos.dia);
    }
    expect(screen.getByTestId('scroll-plantilla').props.horizontal).toBeFalsy();

    const celda = estiloCombinado(
      screen.getByTestId(`celda-${empleado('Empleado 00').id}-${MIERCOLES}`),
    );
    expect(celda.minWidth).toBe(LADO_PULSABLE_MINIMO);
    expect(celda.minHeight).toBe(LADO_PULSABLE_MINIMO);

    // Y las horas siguen enteras, sin truncar ni abreviar.
    expect(screen.getAllByText('09:00')[0]).toBeTruthy();
    expect(screen.getAllByText('17:00')[0]).toBeTruthy();
  });
});

describe('Una sola identidad visual para toda la app', () => {
  it('La acción destructiva se reconoce en cualquier pantalla', async () => {
    // Primera pantalla: eliminar el turno planificado desde la hoja de acciones.
    const { empleado } = await renderizarCuadrante({ plantilla: ['Ana'] });
    const ana = empleado('Ana');
    await fireEvent.press(screen.getByTestId(`celda-${ana.id}-${MIERCOLES}`));
    await fireEvent.press(screen.getByTestId('accion-marcar-ausencia'));
    await fireEvent.press(screen.getByTestId(`celda-${ana.id}-${MIERCOLES}`));

    const eliminarEnLaHoja = screen.getByTestId('accion-eliminar-contenido');
    const fondoEnLaHoja = estiloCombinado(eliminarEnLaHoja);
    const textoEnLaHoja = estiloCombinado(within(eliminarEnLaHoja).getByText(/Eliminar/));

    // Segunda pantalla: dar de baja a un empleado desde su ficha.
    const datos = await renderizarPanelDeEmpleados({ plantilla: ['Ana'] });
    await fireEvent.press(
      screen.getByTestId(`fila-de-la-lista-${empleadoLlamado(datos, 'Ana').id}`),
    );

    const bajaEnLaFicha = screen.getByTestId('accion-dar-de-baja');
    const fondoEnLaFicha = estiloCombinado(bajaEnLaFicha);
    const textoEnLaFicha = estiloCombinado(within(bajaEnLaFicha).getByText('Dar de baja'));

    expect(fondoEnLaHoja.backgroundColor).toBe(colores.fondoAccionDestructiva);
    expect(fondoEnLaFicha.backgroundColor).toBe(fondoEnLaHoja.backgroundColor);
    expect(textoEnLaHoja.color).toBe(colores.textoAccionDestructiva);
    expect(textoEnLaFicha.color).toBe(textoEnLaHoja.color);

    // Y ese tratamiento no es el de una acción que no destruye nada.
    expect(textoEnLaHoja.color).not.toBe(colores.accion);
  });

  it('el fondo de una ausencia no se confunde con el de una acción destructiva', async () => {
    const { empleado } = await renderizarCuadrante({
      plantilla: ['Ana'],
      prepararDatos: (datos) => {
        const ana = datos.listarEmpleados()[0]!;
        datos.crearTurno(ana.id, MIERCOLES, hora(9), hora(17));
      },
    });
    const celda = screen.getByTestId(`celda-${empleado('Ana').id}-${MIERCOLES}`);

    expect(estiloCombinado(celda).backgroundColor).toBeUndefined();
    expect(colores.fondoAusencia).not.toBe(colores.fondoAccionDestructiva);
  });
});
