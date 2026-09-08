/**
 * La tubería que saca el documento del dispositivo.
 *
 * `expo-print` y `expo-sharing` no existen fuera del móvil, así que aquí se
 * sustituyen: lo que se comprueba no es que el PDF se genere —eso solo se ve
 * abriéndolo, y está anotado en `docs/verificacion-manual.md`— sino las decisiones
 * que sí son del código: que se pregunte antes de compartir, que desistir no sea un
 * error, que un fallo no le enseñe al encargado nada técnico y que exportar no
 * escriba nada en lo guardado.
 */

import { crearAlmacenEnMemoria } from '../../datos/almacenCuadrante';
import { semanaQueContiene, type Semana } from '../../dominio/semana';

const LUNES = '2026-09-14';
const MARTES = '2026-09-15';
const MIERCOLES = '2026-09-16';
const SEMANA: Semana = semanaQueContiene(LUNES);
const NOMBRE_DEL_LOCAL = 'La Esquina café';

/**
 * Lo que devuelve el motor de impresión: la ruta de su fichero de trabajo —a la que
 * la app no llega— y el contenido del PDF, que es lo que sí se usa.
 */
const URI_DEL_PDF = 'file:///cache/Print/aa11bb22.pdf';
const PDF_EN_BASE64 = 'JVBERi0xLjcKJUNVQURSQU5URQ==';

const mockImprimir = jest.fn();
const mockHayHojaDeCompartir = jest.fn();
const mockCompartir = jest.fn();
const mockCrear = jest.fn();
const mockEscribir = jest.fn();

jest.mock('expo-print', () => ({
  printToFileAsync: (...argumentos: unknown[]) => mockImprimir(...argumentos),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockHayHojaDeCompartir(),
  shareAsync: (...argumentos: unknown[]) => mockCompartir(...argumentos),
}));

/**
 * El sistema de ficheros del dispositivo, en pequeño: la carpeta de la app, la única
 * en la que se puede escribir y desde la que se puede compartir.
 */
const CARPETA_DE_LA_APP = 'file:///data/app/cache';

jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///data/app/cache' } },
  File: class {
    uri: string;
    exists = false;
    constructor(...partes: { uri: string }[] | string[]) {
      const trozos = partes.map((parte) => (typeof parte === 'string' ? parte : parte.uri));
      this.uri = trozos.join('/');
    }
    create(opciones?: unknown) {
      mockCrear(this.uri, opciones);
      this.exists = true;
    }
    write(contenido: string, opciones?: unknown) {
      mockEscribir(this.uri, contenido, opciones);
    }
  },
}));

import {
  compartirElCuadrante,
  MENSAJE_NO_SE_PUDO_COMPARTIR,
  MENSAJE_SIN_PLANTILLA,
} from '../compartirElCuadrante';

const hora = (horas: number, minutos = 0) => ({ horas, minutos });

const idDe = (datos: ReturnType<typeof crearAlmacenEnMemoria>, nombre: string) => {
  const empleado = datos.listarEmpleados().find((e) => e.nombre === nombre);
  if (!empleado) throw new Error(`No hay ningún empleado llamado ${nombre}`);
  return empleado.id;
};

function conLaPlantilla(
  plantilla: readonly string[],
  preparar: (datos: ReturnType<typeof crearAlmacenEnMemoria>) => void = () => {},
) {
  const datos = crearAlmacenEnMemoria(plantilla);
  preparar(datos);
  return {
    datos,
    exportar: (semana: Semana = SEMANA) =>
      compartirElCuadrante({
        semana,
        empleados: datos.listarEmpleados(),
        contenido: datos.leerSemana(semana),
        nombreDelLocal: NOMBRE_DEL_LOCAL,
      }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Varios de estos tests provocan el fallo a propósito, y el módulo deja constancia
  // de él en el terminal. Aquí esa constancia solo sería ruido.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  // `clearAllMocks` borra las llamadas pero no las implementaciones: el test que hace
  // fallar la escritura del fichero se las llevaría por delante a los siguientes.
  mockEscribir.mockImplementation(() => {});
  mockImprimir.mockResolvedValue({ uri: URI_DEL_PDF, base64: PDF_EN_BASE64 });
  mockHayHojaDeCompartir.mockResolvedValue(true);
  mockCompartir.mockResolvedValue(undefined);
});

describe('El documento se entrega por la hoja de compartir del sistema', () => {
  it('Compartir la semana exportada', async () => {
    const { exportar } = conLaPlantilla(['Ana', 'Bruno']);

    const resultado = await exportar();

    expect(resultado).toEqual({ tipo: 'compartido' });
    // Se produjo el PDF con el HTML del documento y se ofreció por la hoja del
    // sistema: la app no eligió destino ninguno.
    expect(mockImprimir).toHaveBeenCalledWith(expect.objectContaining({ html: expect.any(String) }));
    expect(mockCompartir).toHaveBeenCalledTimes(1);
    expect(mockCompartir.mock.calls[0][1]).toEqual(
      expect.objectContaining({ mimeType: 'application/pdf' }),
    );
  });

  it('Exportar la semana que se está viendo', async () => {
    const { exportar } = conLaPlantilla(['Ana']);

    await exportar(semanaQueContiene(LUNES));

    // El documento producido es el de esa semana, no el de ninguna otra.
    const html = mockImprimir.mock.calls[0][0].html as string;
    expect(html).toContain('14/09/2026 - 20/09/2026');
  });

  it('Desistir de compartir', async () => {
    // La hoja se cierra sin elegir nada: `shareAsync` resuelve igual, sin error.
    mockCompartir.mockResolvedValue(undefined);
    const { exportar } = conLaPlantilla(['Ana']);

    const resultado = await exportar();

    // Ni error ni mensaje: quien llama sigue donde estaba.
    expect(resultado).toEqual({ tipo: 'compartido' });
    expect(resultado).not.toHaveProperty('mensaje');
  });

  it('La exportación falla', async () => {
    mockImprimir.mockRejectedValue(new Error('ExponentPrint: no se pudo escribir /cache/Print'));
    const { exportar } = conLaPlantilla(['Ana']);

    const resultado = await exportar();

    expect(resultado).toEqual({ tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR });
    // Y no se compartió nada.
    expect(mockCompartir).not.toHaveBeenCalled();
  });

  it('sin hoja de compartir en el dispositivo, la exportación no se puede completar', async () => {
    mockHayHojaDeCompartir.mockResolvedValue(false);
    const { exportar } = conLaPlantilla(['Ana']);

    const resultado = await exportar();

    expect(resultado).toEqual({ tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR });
    // Se preguntó antes de producir nada: un PDF que no se puede compartir no le
    // sirve a nadie.
    expect(mockImprimir).not.toHaveBeenCalled();
    expect(mockCompartir).not.toHaveBeenCalled();
  });

  it('un fallo al compartir tampoco enseña nada técnico', async () => {
    mockCompartir.mockRejectedValue(new Error('Sharing.shareAsync: ENOENT /cache/Print/aa11bb22.pdf'));
    const { exportar } = conLaPlantilla(['Ana']);

    const resultado = await exportar();

    expect(resultado).toEqual({ tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR });
  });

  it('los mensajes de fallo están en lenguaje corriente', () => {
    for (const mensaje of [MENSAJE_NO_SE_PUDO_COMPARTIR, MENSAJE_SIN_PLANTILLA]) {
      // Ni módulo, ni código de error, ni ruta de fichero, ni inglés.
      expect(mensaje).not.toMatch(/expo-|Print|Sharing|Error|ENOENT|undefined|null/i);
      expect(mensaje).not.toMatch(/[/\\]|file:|\.pdf|\.ts|E[A-Z]{3,}|\b\d{3,}\b/);
      expect(mensaje).toMatch(/^[A-ZÁÉÍÓÚÑ].*[.!]$/);
    }
  });

  it('el PDF se escribe en la carpeta de la app antes de compartirlo', async () => {
    // Al fichero que escribe el motor de impresión no llega nadie más: está en una
    // carpeta de trabajo suya, fuera de la carpeta de la app. Así que se le piden sus
    // bytes y se escribe uno nuevo dentro de casa.
    const { exportar } = conLaPlantilla(['Ana']);

    await exportar();

    const ruta = `${CARPETA_DE_LA_APP}/Cuadrante 14-09-2026 a 20-09-2026.pdf`;
    expect(mockImprimir).toHaveBeenCalledWith(expect.objectContaining({ base64: true }));
    expect(mockCrear).toHaveBeenCalledWith(ruta, { overwrite: true });
    expect(mockEscribir).toHaveBeenCalledWith(ruta, PDF_EN_BASE64, { encoding: 'base64' });

    // Y lo que se comparte es ese fichero, no el que dejó `expo-print`.
    expect(mockCompartir.mock.calls[0][0]).toBe(ruta);
    expect(mockCompartir.mock.calls[0][0]).not.toBe(URI_DEL_PDF);
  });

  it('si el motor de impresión no devuelve el PDF, no se comparte nada', async () => {
    mockImprimir.mockResolvedValue({ uri: URI_DEL_PDF });
    const { exportar } = conLaPlantilla(['Ana']);

    const resultado = await exportar();

    expect(resultado).toEqual({ tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR });
    expect(mockEscribir).not.toHaveBeenCalled();
    expect(mockCompartir).not.toHaveBeenCalled();
  });

  it('el fichero compartido lleva el rango de la semana en el nombre', async () => {
    const { exportar } = conLaPlantilla(['Ana']);

    await exportar();

    expect(mockCompartir.mock.calls[0][0]).toContain('Cuadrante 14-09-2026 a 20-09-2026.pdf');
    // Y no el identificador aleatorio que le pone el motor de impresión.
    expect(mockCompartir.mock.calls[0][0]).not.toContain('aa11bb22');
  });

  it('compartir dos veces la misma semana no acumula copias', async () => {
    const { exportar } = conLaPlantilla(['Ana']);

    await exportar();
    await exportar();

    // Mismo fichero las dos veces, y creado sustituyendo al anterior.
    expect(mockCompartir).toHaveBeenCalledTimes(2);
    expect(mockCompartir.mock.calls[1][0]).toBe(mockCompartir.mock.calls[0][0]);
    for (const llamada of mockCrear.mock.calls) {
      expect(llamada[1]).toEqual({ overwrite: true });
    }
  });

  it('si el PDF no se puede escribir en la carpeta de la app, no se comparte nada', async () => {
    mockEscribir.mockImplementation(() => {
      throw new Error('EACCES: /data/app/cache');
    });
    const { exportar } = conLaPlantilla(['Ana']);

    const resultado = await exportar();

    expect(resultado).toEqual({ tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR });
    expect(mockCompartir).not.toHaveBeenCalled();
  });
});

describe('Exportar con la plantilla vacía', () => {
  it('no produce documento ni abre la hoja de compartir', async () => {
    const { exportar } = conLaPlantilla([]);

    const resultado = await exportar();

    expect(resultado).toEqual({ tipo: 'sin-plantilla' });
    expect(mockImprimir).not.toHaveBeenCalled();
    expect(mockHayHojaDeCompartir).not.toHaveBeenCalled();
    expect(mockCompartir).not.toHaveBeenCalled();
  });
});

describe('Exportar no cambia nada de lo guardado', () => {
  it('la plantilla y el contenido del cuadrante quedan como estaban', async () => {
    const { datos, exportar } = conLaPlantilla(['Ana', 'Bruno', 'Carmen'], (almacen) => {
      almacen.crearTurno(idDe(almacen, 'Ana'), LUNES, hora(9), hora(17));
      almacen.marcarAusencia(idDe(almacen, 'Bruno'), MARTES);
      almacen.marcarVacaciones(idDe(almacen, 'Carmen'), MIERCOLES);
    });

    const retrato = () =>
      JSON.stringify({
        plantilla: datos.listarEmpleados(),
        semana: [...datos.leerSemana(SEMANA)].map(([id, dias]) => [id, [...dias]]),
      });
    const antes = retrato();

    await exportar();

    expect(retrato()).toEqual(antes);
  });

  it('exportar no escribe en el almacenamiento de la app', async () => {
    const { datos, exportar } = conLaPlantilla(['Ana']);
    const escrituras = [
      'altaEmpleado',
      'editarNombre',
      'editarPuesto',
      'editarTelefono',
      'editarEmail',
      'editarNota',
      'editarMotivoAusencia',
      'borrarEmpleado',
      'crearTurno',
      'editarTurno',
      'eliminarTurno',
      'marcarAusencia',
      'marcarVacaciones',
      'vaciarCelda',
      'marcarRangoDeVacaciones',
      'eliminarRangoDeVacaciones',
    ] as const;

    const espias = escrituras.map((operacion) => jest.spyOn(datos, operacion));

    await exportar();

    for (const espia of espias) expect(espia).not.toHaveBeenCalled();
    // El PDF vive en la **caché** de la app, que el sistema puede tirar cuando
    // necesite sitio: no es una copia guardada del cuadrante ni un historial de
    // exportaciones.
    expect(mockCompartir.mock.calls[0][0]).toContain(CARPETA_DE_LA_APP);
  });
});
