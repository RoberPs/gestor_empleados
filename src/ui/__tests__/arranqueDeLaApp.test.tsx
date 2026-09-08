/**
 * El arranque de la app contra SQLite de verdad.
 *
 * Cierra y reabre un fichero temporal entre la escritura y la lectura: es lo que
 * reproduce cerrar la app y volver a abrirla, y lo único con lo que los escenarios
 * de durabilidad significan algo.
 */

import { render, screen, userEvent } from '@testing-library/react-native';
import { readFileSync, writeFileSync } from 'node:fs';
import { Text } from 'react-native';

import { almacen } from '../../datos/almacenCuadrante';
import { VERSION_DEL_ESQUEMA } from '../../datos/sqlite/migraciones';
import { abrirConNodeSqlite, rutaDeFicheroDePrueba } from '../../pruebas/bdDePrueba';
import { ArranqueDeLaApp } from '../ArranqueDeLaApp';
import {
  ACCION_VOLVER_A_INTENTARLO,
  EXPLICACION_ALMACENAMIENTO_NO_DISPONIBLE,
  TITULO_ALMACENAMIENTO_NO_DISPONIBLE,
} from '../AvisoAlmacenamiento';

const CUADRANTE = 'aquí va el cuadrante';

/** Un arranque de la app sobre ese fichero. Devuelve lo que se pintó. */
async function arrancar(fichero: string) {
  return render(
    <ArranqueDeLaApp abrirFichero={abrirConNodeSqlite} nombreDelFichero={fichero}>
      <Text>{CUADRANTE}</Text>
    </ArranqueDeLaApp>,
  );
}

const nombres = () => almacen().listarEmpleados().map((empleado) => empleado.nombre);

describe('Primera ejecución con la plantilla vacía', () => {
  it('Arrancar la app por primera vez', async () => {
    // Un fichero que todavía no existe: el dispositivo donde la app no se ha abierto nunca.
    await arrancar(rutaDeFicheroDePrueba());

    // Ni confirmación, ni elección sobre los datos, ni pantalla de preparación:
    // lo que se pinta es directamente el cuadrante.
    expect(screen.getByText(CUADRANTE)).toBeTruthy();
    expect(screen.queryByText(TITULO_ALMACENAMIENTO_NO_DISPONIBLE)).toBeNull();
    expect(nombres()).toEqual([]);
  });

  it('Dar de alta al primer empleado en una plantilla recién creada', async () => {
    await arrancar(rutaDeFicheroDePrueba());

    const ana = almacen().altaEmpleado('Ana');

    expect(ana).not.toBeNull();
    expect(nombres()).toEqual(['Ana']);
  });

  it('Abrir la app con la plantilla vacía sigue llevando al cuadrante', async () => {
    await arrancar(rutaDeFicheroDePrueba());

    expect(screen.getByText(CUADRANTE)).toBeTruthy();
    expect(screen.queryByText(TITULO_ALMACENAMIENTO_NO_DISPONIBLE)).toBeNull();
  });
});

describe('La plantilla sobrevive al cierre de la app', () => {
  it('La ficha de un empleado sigue ahí tras reabrir la app', async () => {
    const fichero = rutaDeFicheroDePrueba();
    await arrancar(fichero);
    const bruno = almacen().altaEmpleado('Bruno', '600 11 22 33', 'bruno@ejemplo.es')!;
    almacen().editarNota(bruno.id, 'No puede los martes por la tarde');

    await arrancar(fichero);

    expect(almacen().listarEmpleados()).toEqual([
      {
        id: bruno.id,
        nombre: 'Bruno',
        telefono: '600 11 22 33',
        email: 'bruno@ejemplo.es',
        nota: 'No puede los martes por la tarde',
      },
    ]);
  });

  it('El puesto y el motivo de la ausencia sobreviven al cierre', async () => {
    const fichero = rutaDeFicheroDePrueba();
    await arrancar(fichero);
    const bruno = almacen().altaEmpleado('Bruno')!;

    almacen().editarPuesto(bruno.id, 'Cocina');
    almacen().editarMotivoAusencia(bruno.id, 'Baja médica hasta el 20/09/2026');

    await arrancar(fichero);

    // Las dos columnas que trajo la migración 3 guardan de verdad: si faltara
    // cualquiera de las dos, este test lo diría.
    expect(almacen().leerEmpleado(bruno.id)).toEqual({
      id: bruno.id,
      nombre: 'Bruno',
      puesto: 'Cocina',
      motivoAusencia: 'Baja médica hasta el 20/09/2026',
    });
  });

  it('La plantilla entera sobrevive a varias reaperturas', async () => {
    const fichero = rutaDeFicheroDePrueba();
    await arrancar(fichero);
    almacen().altaEmpleado('Ana', '600 00 00 01');
    almacen().altaEmpleado('Bruno', '600 00 00 02');
    almacen().altaEmpleado('Carmen', '600 00 00 03');
    const fichasIniciales = almacen().listarEmpleados();

    await arrancar(fichero);
    await arrancar(fichero);
    await arrancar(fichero);

    expect(nombres()).toEqual(['Ana', 'Bruno', 'Carmen']);
    expect(almacen().listarEmpleados()).toEqual(fichasIniciales);
  });

  it('Una baja también sobrevive al cierre de la app', async () => {
    const fichero = rutaDeFicheroDePrueba();
    await arrancar(fichero);
    almacen().altaEmpleado('Ana');
    const bruno = almacen().altaEmpleado('Bruno')!;
    almacen().altaEmpleado('Carmen');

    almacen().borrarEmpleado(bruno.id);
    await arrancar(fichero);

    expect(nombres()).toEqual(['Ana', 'Carmen']);
  });
});

describe('La baja de un empleado es un borrado definitivo', () => {
  it('Dar de baja a un empleado no deja nada suyo', async () => {
    const fichero = rutaDeFicheroDePrueba();
    await arrancar(fichero);
    almacen().altaEmpleado('Ana');
    const bruno = almacen().altaEmpleado('Bruno', '600 11 22 33', 'bruno@ejemplo.es')!;
    almacen().editarNota(bruno.id, 'No puede los martes por la tarde');
    almacen().altaEmpleado('Carmen');

    almacen().borrarEmpleado(bruno.id);
    await arrancar(fichero);

    expect(nombres()).toEqual(['Ana', 'Carmen']);
    // Nada suyo en el fichero: ni su ficha ni ningún resto en ninguna tabla.
    const bd = abrirConNodeSqlite(fichero);
    const tablas = bd.leer<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
    );
    for (const { name } of tablas) {
      const filas = bd.leer<Record<string, unknown>>(`SELECT * FROM ${name}`);
      expect(JSON.stringify(filas)).not.toContain('Bruno');
      expect(JSON.stringify(filas)).not.toContain('600 11 22 33');
      expect(JSON.stringify(filas)).not.toContain('No puede los martes por la tarde');
    }
    bd.cerrar();
  });
});

describe('Actualización automática del almacenamiento al arrancar', () => {
  it('Arrancar dos veces seguidas no vuelve a adaptar nada', async () => {
    const fichero = rutaDeFicheroDePrueba();
    await arrancar(fichero);
    almacen().altaEmpleado('Ana');
    almacen().altaEmpleado('Bruno');
    const antes = almacen().listarEmpleados();

    await arrancar(fichero);

    const bd = abrirConNodeSqlite(fichero);
    expect(bd.leer('PRAGMA user_version')).toEqual([{ user_version: VERSION_DEL_ESQUEMA }]);
    bd.cerrar();
    expect(almacen().listarEmpleados()).toEqual(antes);
  });
});

describe('Comportamiento cuando el almacenamiento no puede abrirse', () => {
  // Aquí el fallo de apertura se provoca a propósito, y el arranque lo deja escrito
  // en la consola para quien desarrolla. Se calla solo en estos tests, para que la
  // salida de `npm test` no dé a entender que algo ha ido mal.
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Un fichero que existe y no es una base de datos. */
  function ficheroDanado(): string {
    const fichero = rutaDeFicheroDePrueba();
    writeFileSync(fichero, 'esto no es una base de datos, ni lo parece');
    return fichero;
  }

  it('Arrancar con el almacenamiento dañado', async () => {
    const fichero = ficheroDanado();
    const contenidoAntes = readFileSync(fichero);

    await arrancar(fichero);

    // No se muestra una plantilla vacía como si no hubiera empleados: no se llega
    // ni al cuadrante, ni al panel, ni a ninguna ficha.
    expect(screen.queryByText(CUADRANTE)).toBeNull();
    expect(screen.getByText(TITULO_ALMACENAMIENTO_NO_DISPONIBLE)).toBeTruthy();
    expect(screen.getByText(EXPLICACION_ALMACENAMIENTO_NO_DISPONIBLE)).toBeTruthy();
    expect(screen.getByLabelText(ACCION_VOLVER_A_INTENTARLO)).toBeTruthy();
    // El fichero se queda intacto: ni borrado, ni sobrescrito, ni recreado.
    expect(readFileSync(fichero)).toEqual(contenidoAntes);
    // Y no se acepta ninguna alta, edición ni baja.
    expect(() => almacen().altaEmpleado('Ana')).toThrow();
    expect(() => almacen().editarNombre('1', 'Ana')).toThrow();
    expect(() => almacen().borrarEmpleado('1')).toThrow();
    expect(readFileSync(fichero)).toEqual(contenidoAntes);
  });

  it('Arrancar con un almacenamiento de una versión posterior de la app', async () => {
    const fichero = rutaDeFicheroDePrueba();
    await arrancar(fichero);
    almacen().altaEmpleado('Ana');
    const bd = abrirConNodeSqlite(fichero);
    bd.ejecutar(`PRAGMA user_version = ${VERSION_DEL_ESQUEMA + 7}`);
    bd.cerrar();
    const contenidoAntes = readFileSync(fichero);

    await arrancar(fichero);

    expect(screen.queryByText(CUADRANTE)).toBeNull();
    expect(screen.getByText(TITULO_ALMACENAMIENTO_NO_DISPONIBLE)).toBeTruthy();
    // Ni una palabra sobre versiones, ficheros o códigos.
    const explicacion = EXPLICACION_ALMACENAMIENTO_NO_DISPONIBLE.toLowerCase();
    expect(explicacion).not.toMatch(/versi[óo]n|esquema|sqlite|fichero|c[óo]digo|error/);
    expect(explicacion).not.toMatch(/borrar|reiniciar|empezar de cero/);
    expect(readFileSync(fichero)).toEqual(contenidoAntes);
  });

  it('Volver a intentarlo cuando el almacenamiento ya se puede abrir', async () => {
    const fichero = ficheroDanado();
    await arrancar(fichero);
    expect(screen.getByText(TITULO_ALMACENAMIENTO_NO_DISPONIBLE)).toBeTruthy();

    // El motivo del fallo deja de darse: donde había basura, ahora hay un fichero
    // que SQLite sí sabe abrir.
    writeFileSync(fichero, '');

    await userEvent.press(screen.getByLabelText(ACCION_VOLVER_A_INTENTARLO));

    expect(screen.getByText(CUADRANTE)).toBeTruthy();
    expect(screen.queryByText(TITULO_ALMACENAMIENTO_NO_DISPONIBLE)).toBeNull();
    expect(almacen().altaEmpleado('Ana')).not.toBeNull();
  });
});
