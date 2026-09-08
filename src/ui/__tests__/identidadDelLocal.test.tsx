/**
 * La identidad del local en el cuadrante y los ajustes donde se escribe su nombre.
 */

import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { crearAlmacenEnMemoria, instalarAlmacen } from '../../datos/almacenCuadrante';
import {
  ConAreaSegura,
  estiloCombinado,
  MIERCOLES_A_LAS_DIEZ,
  renderizarCuadrante,
} from '../../pruebas/ayudas';
import { ANCHO_MINIMO_SOPORTADO } from '../medidas';
import { INVITACION_A_ESCRIBIR_EL_NOMBRE } from '../CabeceraSemana';
import { PantallaAjustes } from '../PantallaAjustes';
import { PantallaCuadrante } from '../PantallaCuadrante';
import { TEXTO_GUARDADO } from '../AvisoDeGuardado';

/**
 * El cuadrante y sus ajustes con la navegación entre los dos, que es lo que hacen
 * las rutas de expo-router sin expo-router de por medio.
 *
 * Los ajustes se abren **encima** del cuadrante, sin desmontarlo, igual que hace la
 * pila de expo-router: por eso al volver el cuadrante sigue en la semana en la que
 * estaba. Desmontándolo, la semana se perdería en el test y no en la app.
 */
function CuadranteConAjustes() {
  const [enAjustes, setEnAjustes] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, display: enAjustes ? 'none' : 'flex' }}>
        <PantallaCuadrante
          reloj={() => MIERCOLES_A_LAS_DIEZ}
          anchoDePantalla={ANCHO_MINIMO_SOPORTADO}
          onIrAAjustes={() => setEnAjustes(true)}
        />
      </View>
      {enAjustes ? <PantallaAjustes onVolver={() => setEnAjustes(false)} /> : null}
    </View>
  );
}

async function renderizarCuadranteConAjustes(nombreDelLocal = '') {
  const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);
  if (nombreDelLocal) datos.escribirNombreDelLocal(nombreDelLocal);
  instalarAlmacen(datos);

  await render(
    <ConAreaSegura>
      <CuadranteConAjustes />
    </ConAreaSegura>,
  );
  return datos;
}

describe('La pantalla de inicio identifica el local', () => {
  it('Abrir la app con el nombre del local ya escrito', async () => {
    await renderizarCuadrante({ nombreDelLocal: 'La Esquina café' });

    expect(screen.getByTestId('logo-del-local')).toBeTruthy();
    expect(screen.getByTestId('nombre-del-local')).toHaveTextContent('La Esquina café');
    // Y debajo sigue todo lo de siempre.
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(screen.getByTestId('accion-semana-siguiente')).toBeTruthy();
    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
  });

  it('Abrir la app sin haber escrito todavía el nombre', async () => {
    await renderizarCuadrante();

    expect(screen.getByTestId('logo-del-local')).toBeTruthy();
    expect(screen.getByText(INVITACION_A_ESCRIBIR_EL_NOMBRE)).toBeTruthy();
    // Sin nombre inventado ni hueco mudo donde debería estar.
    expect(screen.queryByTestId('nombre-del-local')).toBeNull();
  });

  it('Un nombre de local muy largo no descoloca la rejilla', async () => {
    await renderizarCuadrante({
      nombreDelLocal: 'Cafetería Restaurante Los 24 Hermanos de la Ribera del Duero',
    });

    const nombre = screen.getByTestId('nombre-del-local');
    expect(nombre.props.numberOfLines).toBe(1);
    expect(nombre.props.ellipsizeMode).toBe('tail');
    expect(screen.getByTestId('scroll-plantilla').props.horizontal).toBeFalsy();
  });

  it('El nombre del local y la semana no se confunden', async () => {
    await renderizarCuadrante({ nombreDelLocal: 'La Esquina café' });

    const nombre = estiloCombinado(screen.getByTestId('nombre-del-local'));
    const rango = estiloCombinado(screen.getByTestId('rango-de-la-semana'));

    // El rango lleva cifras de ancho fijo y el nombre no: no se leen como lo mismo.
    expect(rango.fontVariant).toBeTruthy();
    expect(nombre.fontVariant).toBeUndefined();
    expect(nombre.textAlign).toBeUndefined();
    expect(rango.textAlign).toBe('center');
  });

  it('el logo no crece con la letra del sistema', async () => {
    await renderizarCuadrante({ nombreDelLocal: 'La Esquina café' });

    const logo = estiloCombinado(screen.getByTestId('logo-del-local'));
    expect(logo.width).toBe(32);
    expect(logo.height).toBe(32);
  });
});

describe('Acceso a los ajustes desde el cuadrante', () => {
  it('Ir a los ajustes y volver al cuadrante', async () => {
    await renderizarCuadranteConAjustes('Bar Paco');

    // Se deja el cuadrante en otra semana para comprobar que vuelve a ella.
    await fireEvent.press(screen.getByTestId('accion-semana-siguiente'));
    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');

    await fireEvent.press(screen.getByTestId('accion-ir-a-ajustes'));
    expect(screen.getByTestId('pantalla-ajustes')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('campo-nombre-del-local'), 'La Esquina café');
    await fireEvent.press(screen.getByTestId('accion-volver-al-cuadrante'));

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('14/09/2026 - 20/09/2026');
    expect(screen.getByTestId('nombre-del-local')).toHaveTextContent('La Esquina café');
  });

  it('la invitación a escribir el nombre lleva también a los ajustes', async () => {
    await renderizarCuadranteConAjustes();

    await fireEvent.press(screen.getByTestId('accion-escribir-el-nombre-del-local'));

    expect(screen.getByTestId('pantalla-ajustes')).toBeTruthy();
  });

  it('El estado vacío no ofrece los ajustes', async () => {
    await renderizarCuadrante({ plantilla: [] });

    expect(screen.getByTestId('estado-vacio')).toBeTruthy();
    expect(screen.queryByTestId('accion-ir-a-ajustes')).toBeNull();
    expect(screen.queryByTestId('accion-escribir-el-nombre-del-local')).toBeNull();
  });
});

describe('Pantalla de ajustes del local', () => {
  it('Escribir el nombre del local desde los ajustes', async () => {
    const datos = await renderizarCuadranteConAjustes();
    await fireEvent.press(screen.getByTestId('accion-escribir-el-nombre-del-local'));

    await fireEvent.changeText(screen.getByTestId('campo-nombre-del-local'), 'La Esquina café');

    expect(screen.getByTestId('guardado-nombre-del-local')).toHaveTextContent(TEXTO_GUARDADO);
    expect(datos.leerNombreDelLocal()).toBe('La Esquina café');

    await fireEvent.press(screen.getByTestId('accion-volver-al-cuadrante'));
    expect(screen.getByTestId('nombre-del-local')).toHaveTextContent('La Esquina café');
  });

  it('Corregir el nombre del local', async () => {
    const datos = await renderizarCuadranteConAjustes('La Esquina cafe');
    await fireEvent.press(screen.getByTestId('accion-ir-a-ajustes'));

    await fireEvent.changeText(screen.getByTestId('campo-nombre-del-local'), 'La Esquina café');
    await fireEvent.press(screen.getByTestId('accion-volver-al-cuadrante'));

    expect(screen.getByTestId('nombre-del-local')).toHaveTextContent('La Esquina café');
    expect(datos.leerNombreDelLocal()).toBe('La Esquina café');
  });

  it('Los ajustes no ofrecen nada más que el nombre', async () => {
    await renderizarCuadranteConAjustes('La Esquina café');
    await fireEvent.press(screen.getByTestId('accion-ir-a-ajustes'));

    expect(screen.getByTestId('campo-nombre-del-local')).toBeTruthy();
    expect(screen.getByTestId('accion-volver-al-cuadrante')).toBeTruthy();
    for (const loQueNoEsta of [/copia de seguridad/i, /borrar/i, /idioma/i, /tema/i, /exportar/i]) {
      expect(screen.queryByText(loQueNoEsta)).toBeNull();
    }
  });

  it('al abrir los ajustes todavía no se dice que se haya guardado nada', async () => {
    await renderizarCuadranteConAjustes('La Esquina café');
    await fireEvent.press(screen.getByTestId('accion-ir-a-ajustes'));

    expect(screen.queryByTestId('guardado-nombre-del-local')).toBeNull();
  });

  it('el aviso de guardado es el mismo que el de la ficha del empleado', async () => {
    await renderizarCuadranteConAjustes('La Esquina café');
    await fireEvent.press(screen.getByTestId('accion-ir-a-ajustes'));
    await fireEvent.changeText(screen.getByTestId('campo-nombre-del-local'), 'Bar Paco');

    const aviso = estiloCombinado(screen.getByTestId('guardado-nombre-del-local'));
    // El mismo componente en las dos pantallas: mismo texto y mismo color.
    expect(screen.getByTestId('guardado-nombre-del-local')).toHaveTextContent(TEXTO_GUARDADO);
    expect(aviso.color).toBeTruthy();
  });
});
