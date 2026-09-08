/**
 * Guardar el documento en el dispositivo, en la carpeta que elija el encargado.
 *
 * El selector de carpetas no existe fuera del móvil, así que aquí se sustituye: lo que
 * se comprueba no es que el selector se abra —eso solo se ve con el móvil delante, y
 * está anotado en `docs/verificacion-manual.md`— sino las decisiones que sí son del
 * código: que no se pida carpeta cuando no hay nada que guardar, que desistir no sea un
 * error, que un fallo no le enseñe al encargado nada técnico, que el fichero lleve el
 * nombre de la semana y que lo guardado sea exactamente el mismo documento que se
 * comparte.
 */

import { crearAlmacenEnMemoria } from '../../datos/almacenCuadrante';
import { semanaQueContiene, type Semana } from '../../dominio/semana';

const LUNES = '2026-09-14';
const MARTES = '2026-09-15';
const MIERCOLES = '2026-09-16';
const SEMANA: Semana = semanaQueContiene(LUNES);
const NOMBRE_DEL_LOCAL = 'La Esquina café';

const PDF_EN_BASE64 = 'JVBERi0xLjcKJUNVQURSQU5URQ==';
/** La carpeta que el encargado elige en el selector del sistema. */
const CARPETA_ELEGIDA = 'content://com.android.providers.downloads/tree/descargas';

const mockImprimir = jest.fn();
const mockPedirCarpeta = jest.fn();
const mockCrearFichero = jest.fn();
const mockEscribir = jest.fn();
const mockCompartir = jest.fn();

jest.mock('expo-print', () => ({
  printToFileAsync: (...argumentos: unknown[]) => mockImprimir(...argumentos),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => Promise.resolve(true),
  shareAsync: (...argumentos: unknown[]) => mockCompartir(...argumentos),
}));

jest.mock('expo-file-system', () => ({
  Paths: { cache: { uri: 'file:///data/app/cache' } },
  File: class {
    uri: string;
    constructor(...partes: { uri: string }[] | string[]) {
      const trozos = partes.map((parte) => (typeof parte === 'string' ? parte : parte.uri));
      this.uri = trozos.join('/');
    }
    create() {}
    write(contenido: string, opciones?: unknown) {
      mockEscribir(this.uri, contenido, opciones);
    }
  },
  Directory: {
    pickDirectoryAsync: () => mockPedirCarpeta(),
  },
}));

import {
  compartirElCuadrante,
  guardarElCuadrante,
  MENSAJE_GUARDADO,
  MENSAJE_NO_SE_PUDO_GUARDAR,
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
  const parametros = (semana: Semana) => ({
    semana,
    empleados: datos.listarEmpleados(),
    contenido: datos.leerSemana(semana),
    nombreDelLocal: NOMBRE_DEL_LOCAL,
  });
  return {
    datos,
    guardar: (semana: Semana = SEMANA) => guardarElCuadrante(parametros(semana)),
    compartir: (semana: Semana = SEMANA) => compartirElCuadrante(parametros(semana)),
  };
}

/** La carpeta que devuelve el selector: sabe crear ficheros dentro de sí misma. */
function carpetaQueAcepta() {
  return {
    uri: CARPETA_ELEGIDA,
    createFile: (nombre: string, tipo: string) => {
      mockCrearFichero(nombre, tipo);
      return {
        uri: `${CARPETA_ELEGIDA}/${nombre}`,
        write: (contenido: string, opciones?: unknown) =>
          mockEscribir(`${CARPETA_ELEGIDA}/${nombre}`, contenido, opciones),
      };
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Varios de estos tests provocan el fallo a propósito, y el módulo deja constancia
  // de él en el terminal. Aquí esa constancia solo sería ruido.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockImprimir.mockResolvedValue({ uri: 'file:///cache/Print/aa11.pdf', base64: PDF_EN_BASE64 });
  mockPedirCarpeta.mockResolvedValue(carpetaQueAcepta());
  mockCompartir.mockResolvedValue(undefined);
});

describe('El documento se puede guardar en el dispositivo', () => {
  it('Guardar la semana en la carpeta que elige el encargado', async () => {
    const { guardar } = conLaPlantilla(['Ana', 'Bruno']);

    const resultado = await guardar();

    expect(resultado).toEqual({ tipo: 'guardado' });
    // Se le pidió la carpeta: la app no eligió ninguna por su cuenta.
    expect(mockPedirCarpeta).toHaveBeenCalledTimes(1);
    // Y el PDF quedó escrito dentro de ella.
    expect(mockEscribir).toHaveBeenCalledWith(
      `${CARPETA_ELEGIDA}/Cuadrante 14-09-2026 a 20-09-2026.pdf`,
      PDF_EN_BASE64,
      { encoding: 'base64' },
    );
  });

  it('El fichero guardado se reconoce por su nombre', async () => {
    const { guardar, compartir } = conLaPlantilla(['Ana']);

    await guardar(semanaQueContiene('2026-09-07'));
    const nombreGuardado = mockCrearFichero.mock.calls[0][0] as string;

    await compartir(semanaQueContiene('2026-09-07'));
    const rutaCompartida = mockCompartir.mock.calls[0][0] as string;

    expect(nombreGuardado).toBe('Cuadrante 07-09-2026 a 13-09-2026.pdf');
    // El mismo nombre con el que se comparte esa semana, e identifica la semana sin
    // tener que abrir el documento.
    expect(rutaCompartida).toContain(nombreGuardado);
    expect(nombreGuardado).toContain('07-09-2026');
    expect(nombreGuardado).toContain('13-09-2026');
  });

  it('el fichero se guarda como PDF', async () => {
    const { guardar } = conLaPlantilla(['Ana']);

    await guardar();

    expect(mockCrearFichero).toHaveBeenCalledWith(expect.any(String), 'application/pdf');
  });

  it('Desistir de guardar', async () => {
    // El selector se cierra sin elegir carpeta.
    mockPedirCarpeta.mockRejectedValue(new Error('user cancelled the picker'));
    const { guardar } = conLaPlantilla(['Ana']);

    const resultado = await guardar();

    // Ni error ni mensaje, y no se escribió ningún fichero.
    expect(resultado).toEqual({ tipo: 'desistido' });
    expect(resultado).not.toHaveProperty('mensaje');
    expect(mockEscribir).not.toHaveBeenCalled();
  });

  it('El guardado falla', async () => {
    mockPedirCarpeta.mockResolvedValue({
      uri: CARPETA_ELEGIDA,
      createFile: () => {
        throw new Error("EACCES: Missing 'WRITE' permission for content://…/tree/descargas");
      },
    });
    const { guardar } = conLaPlantilla(['Ana']);

    const resultado = await guardar();

    expect(resultado).toEqual({ tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_GUARDAR });
    expect(mockEscribir).not.toHaveBeenCalled();
  });

  it('si el PDF no se puede producir, no se pide ninguna carpeta', async () => {
    mockImprimir.mockRejectedValue(new Error('ExponentPrint: no se pudo escribir /cache/Print'));
    const { guardar } = conLaPlantilla(['Ana']);

    const resultado = await guardar();

    expect(resultado).toEqual({ tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_GUARDAR });
    expect(mockPedirCarpeta).not.toHaveBeenCalled();
  });

  it('los mensajes del guardado están en lenguaje corriente', () => {
    for (const mensaje of [MENSAJE_NO_SE_PUDO_GUARDAR, MENSAJE_GUARDADO]) {
      // Ni módulo, ni código de error, ni ruta de fichero, ni inglés.
      expect(mensaje).not.toMatch(/expo-|Print|Sharing|Error|EACCES|content:|undefined|null/i);
      expect(mensaje).not.toMatch(/[/\\]|file:|\.pdf|\.ts|E[A-Z]{3,}|\b\d{3,}\b/);
      expect(mensaje).toMatch(/^[A-ZÁÉÍÓÚÑ].*[.!]$/);
    }
  });

  it('Guardar con la plantilla vacía', async () => {
    const { guardar } = conLaPlantilla([]);

    const resultado = await guardar();

    expect(resultado).toEqual({ tipo: 'sin-plantilla' });
    // Ni se produjo documento ni se pidió carpeta.
    expect(mockImprimir).not.toHaveBeenCalled();
    expect(mockPedirCarpeta).not.toHaveBeenCalled();
    expect(mockEscribir).not.toHaveBeenCalled();
  });

  it('el PDF guardado no pasa por la caché de la app', async () => {
    const { guardar } = conLaPlantilla(['Ana']);

    await guardar();

    // Una sola escritura, y dentro de la carpeta que eligió el encargado: la app no
    // se queda una copia propia por el camino.
    expect(mockEscribir).toHaveBeenCalledTimes(1);
    expect(mockEscribir.mock.calls[0][0]).toContain(CARPETA_ELEGIDA);
    expect(mockEscribir.mock.calls[0][0]).not.toContain('cache');
  });
});

describe('Lo guardado es el mismo documento que se comparte', () => {
  const conFichasRellenas = () =>
    conLaPlantilla(['Ana', 'Bruno', 'Carmen'], (almacen) => {
      for (const nombre of ['Ana', 'Bruno', 'Carmen']) {
        const id = idDe(almacen, nombre);
        almacen.editarTelefono(id, '600112233');
        almacen.editarEmail(id, `${nombre.toLowerCase()}@ejemplo.es`);
        almacen.editarNota(id, `Nota de ${nombre}`);
        almacen.editarMotivoAusencia(id, 'Baja médica');
      }
      almacen.crearTurno(idDe(almacen, 'Ana'), LUNES, hora(9), hora(17));
      almacen.marcarAusencia(idDe(almacen, 'Bruno'), MARTES);
      almacen.marcarVacaciones(idDe(almacen, 'Carmen'), MIERCOLES);
    });

  it('el documento guardado y el compartido salen del mismo HTML', async () => {
    const { guardar, compartir } = conFichasRellenas();

    await guardar();
    await compartir();

    const htmlGuardado = mockImprimir.mock.calls[0][0].html as string;
    const htmlCompartido = mockImprimir.mock.calls[1][0].html as string;
    expect(htmlGuardado).toEqual(htmlCompartido);
  });

  it('el documento guardado no lleva ningún dato de contacto', async () => {
    const { guardar } = conFichasRellenas();

    await guardar();

    const html = mockImprimir.mock.calls[0][0].html as string;
    for (const dato of [
      '600112233',
      'ana@ejemplo.es',
      'bruno@ejemplo.es',
      'carmen@ejemplo.es',
      'Nota de Ana',
      'Baja médica',
    ]) {
      expect(html).not.toContain(dato);
    }
    // Y sí lleva lo que tiene que llevar: los nombres y la semana.
    for (const nombre of ['Ana', 'Bruno', 'Carmen']) expect(html).toContain(nombre);
    expect(html).toContain('14/09/2026 - 20/09/2026');
  });
});

describe('Guardar no cambia nada de lo guardado en la app', () => {
  it('la plantilla y el contenido del cuadrante quedan como estaban', async () => {
    const { datos, guardar } = conLaPlantilla(['Ana', 'Bruno', 'Carmen'], (almacen) => {
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

    await guardar();

    expect(retrato()).toEqual(antes);
  });

  it('guardar no escribe en el almacenamiento de la app', async () => {
    const { datos, guardar } = conLaPlantilla(['Ana']);
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
      'pegarEnCelda',
      'marcarRangoDeVacaciones',
      'eliminarRangoDeVacaciones',
    ] as const;

    const espias = escrituras.map((operacion) => jest.spyOn(datos, operacion));

    await guardar();

    for (const espia of espias) expect(espia).not.toHaveBeenCalled();
  });
});
