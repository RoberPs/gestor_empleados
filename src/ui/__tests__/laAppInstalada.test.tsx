/**
 * Que la demo web no se le cuele a la app instalada.
 *
 * Es la mitad menos vistosa del change y la que más importa: el encargado tiene la app
 * en su móvil con los datos reales del local, y no puede aparecerle un distintivo de
 * demostración, ni una plantilla inventada, ni un botón que borre lo suyo.
 *
 * Estos tests corren con la resolución **nativa** de Metro, la misma que se empaqueta
 * para Android: los ficheros `.web.tsx` no entran aquí, igual que no entran en el APK.
 * Por eso comprobar el componente nativo es comprobar lo que se instala.
 */

import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { crearAlmacenSobreSqlite } from '../../datos/almacenCuadrante';
import { abrirBaseDeDatos } from '../../datos/sqlite/conexion';
import { ES_LA_DEMO, reiniciarLaDemo } from '../../demo/laDemo';
import { migrar } from '../../datos/sqlite/migraciones';
import { abrirConNodeSqlite } from '../../pruebas/bdDePrueba';
import { LaDemo } from '../LaDemo';

describe('La demo no altera la app instalada', () => {
  it('La app instalada arranca como siempre', async () => {
    // Arranca con la plantilla vacía: la siembra del ejemplo vive en un módulo que solo
    // llama la versión web, así que abrir la base en el móvil no la ejecuta.
    const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');
    migrar(bd);
    expect(crearAlmacenSobreSqlite(bd).listarEmpleados()).toEqual([]);
    bd.cerrar();

    // Y lo que se pinta es el cuadrante y nada más: sin distintivo de demostración y
    // sin ninguna acción para reiniciarla.
    await render(
      <LaDemo>
        <Text>El cuadrante</Text>
      </LaDemo>,
    );

    expect(screen.getByText('El cuadrante')).toBeTruthy();
    expect(screen.queryByTestId('accion-reiniciar-demo')).toBeNull();
    expect(screen.queryByText(/[Dd]emostración/)).toBeNull();
  });

  it('la app instalada no se declara como demo', () => {
    expect(ES_LA_DEMO).toBe(false);
  });

  it('reiniciar la demo no existe en la app instalada', async () => {
    // Si algún día alguien cablea el botón de reinicio fuera de la demo, que falle
    // ruidosamente y en un test, no en el móvil del encargado con sus datos dentro.
    await expect(reiniciarLaDemo()).rejects.toThrow(/no tiene demo/i);
  });
});
