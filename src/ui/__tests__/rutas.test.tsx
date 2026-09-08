/**
 * La ruta raíz de expo-router es el cuadrante: no hay pantalla intermedia.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';

import RutaCuadrante from '../../../app/index';
import RutaEmpleados from '../../../app/empleados';
import RutaFichaEmpleado from '../../../app/empleados/[id]';
import RutaAjustes from '../../../app/ajustes';
import { crearAlmacenEnMemoria, instalarAlmacen } from '../../datos/almacenCuadrante';

const mockEmpujar = jest.fn();
const mockAtras = jest.fn();
let mockIdDeLaRuta = '1';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockEmpujar, back: mockAtras }),
  useLocalSearchParams: () => ({ id: mockIdDeLaRuta }),
}));

beforeEach(() => {
  mockEmpujar.mockClear();
  mockAtras.mockClear();
});

describe('Rutas de la app', () => {
  it('la ruta raíz renderiza el cuadrante, sin pantalla previa', async () => {
    instalarAlmacen(crearAlmacenEnMemoria(['Ana']));

    await render(<RutaCuadrante />);

    expect(screen.getByTestId('pantalla-cuadrante')).toBeTruthy();
    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
  });

  it('desde el cuadrante se navega al panel de empleados', async () => {
    instalarAlmacen(crearAlmacenEnMemoria(['Ana']));
    await render(<RutaCuadrante />);

    await fireEvent.press(screen.getByTestId('accion-ir-a-empleados'));

    expect(mockEmpujar).toHaveBeenCalledWith('/empleados');
  });

  it('la ruta del panel de empleados muestra la lista de la plantilla y permite volver', async () => {
    instalarAlmacen(crearAlmacenEnMemoria(['Ana']));

    await render(<RutaEmpleados />);

    expect(screen.getByTestId('pantalla-empleados')).toBeTruthy();
    expect(screen.getByTestId('lista-de-empleados')).toBeTruthy();
    expect(screen.getByTestId('accion-volver-al-cuadrante')).toBeTruthy();
  });

  it('desde la lista se navega a la ficha del empleado que se toca', async () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);
    instalarAlmacen(datos);
    const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
    await render(<RutaEmpleados />);

    await fireEvent.press(screen.getByTestId(`fila-de-la-lista-${bruno.id}`));

    expect(mockEmpujar).toHaveBeenCalledWith(`/empleados/${bruno.id}`);
  });

  it('la ruta de la ficha muestra al empleado de la ruta y vuelve a la lista', async () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);
    instalarAlmacen(datos);
    const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
    mockIdDeLaRuta = bruno.id;

    await render(<RutaFichaEmpleado />);

    expect(screen.getByTestId('titulo-de-la-ficha')).toHaveTextContent('Bruno');

    await fireEvent.press(screen.getByTestId('accion-volver-a-la-lista'));
    expect(mockAtras).toHaveBeenCalled();
  });

  it('desde el cuadrante se navega a los ajustes del local', async () => {
    instalarAlmacen(crearAlmacenEnMemoria(['Ana']));
    await render(<RutaCuadrante />);

    await fireEvent.press(screen.getByTestId('accion-escribir-el-nombre-del-local'));

    expect(mockEmpujar).toHaveBeenCalledWith('/ajustes');
  });

  it('la ruta de ajustes muestra el nombre del local y permite volver', async () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    datos.escribirNombreDelLocal('La Esquina café');
    instalarAlmacen(datos);

    await render(<RutaAjustes />);

    expect(screen.getByTestId('pantalla-ajustes')).toBeTruthy();
    expect(screen.getByTestId('campo-nombre-del-local').props.value).toBe('La Esquina café');

    await fireEvent.press(screen.getByTestId('accion-volver-al-cuadrante'));
    expect(mockAtras).toHaveBeenCalled();
  });
});
