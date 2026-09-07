/**
 * La ruta raíz de expo-router es el cuadrante: no hay pantalla intermedia.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';

import RutaCuadrante from '../../../app/index';
import RutaEmpleados from '../../../app/empleados';
import { crearAlmacenEnMemoria, instalarAlmacen } from '../../datos/almacenCuadrante';

const mockEmpujar = jest.fn();
const mockAtras = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockEmpujar, back: mockAtras }),
}));

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

  it('la ruta del panel de empleados es la provisional y permite volver', async () => {
    instalarAlmacen(crearAlmacenEnMemoria(['Ana']));

    await render(<RutaEmpleados />);

    expect(screen.getByTestId('pantalla-empleados')).toBeTruthy();
    expect(screen.getByTestId('accion-volver-al-cuadrante')).toBeTruthy();
  });
});
