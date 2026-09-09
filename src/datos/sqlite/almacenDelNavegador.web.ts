/**
 * Dónde se queda, entre visita y visita, lo que alguien prueba en la demo.
 *
 * `sql.js` trabaja en memoria: al recargar la página la base se evapora. Este módulo
 * guarda sus bytes en el navegador de quien la está probando y se los devuelve al
 * abrir, que es lo que hace que la demo se comporte como una app de verdad y no como
 * una maqueta que se reinicia sola.
 *
 * ── POR QUÉ INDEXEDDB Y NO `localStorage` ───────────────────────────────────
 * `localStorage` solo guarda texto: habría que pasar la base a base64 —un tercio más de
 * tamaño— contra un tope que ronda los 5 MB. IndexedDB guarda el binario tal cual
 * (design.md — D5).
 *
 * ── LO QUE AQUÍ NO PASA ─────────────────────────────────────────────────────
 * Nada de esto sale del navegador. No hay servidor al que mandar los bytes, ni lo
 * habría: el sitio de la demo es estático. Cada navegador tiene su copia y ninguna sabe
 * de las otras.
 *
 * Cuando el navegador no deja guardar —una ventana privada, o el almacenamiento del
 * sitio bloqueado— **no pasa nada malo**: se sigue en memoria y lo único que se pierde
 * es lo escrito al recargar. La demo no es el sitio donde nadie guarda su cuadrante de
 * verdad, así que quedarse callado es la respuesta correcta; el aviso de almacenamiento
 * no disponible está pensado para el encargado y para un problema que aquí no lo es.
 */

const BASE = 'cuadrante-demo';
const ALMACEN = 'ficheros';

/** Milisegundos que se espera antes de volcar, para que una ráfaga de cambios escriba una vez. */
const ESPERA_ANTES_DE_VOLCAR = 300;

function abrirIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    // En una ventana privada de algunos navegadores `indexedDB` existe pero abrir falla,
    // y en otros no existe siquiera. Los dos casos acaban en el mismo sitio: sin
    // persistencia y sin ruido.
    if (typeof indexedDB === 'undefined') {
      rechazar(new Error('este navegador no ofrece IndexedDB'));
      return;
    }
    const peticion = indexedDB.open(BASE, 1);
    peticion.onupgradeneeded = () => {
      peticion.result.createObjectStore(ALMACEN);
    };
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error);
    peticion.onblocked = () => rechazar(new Error('IndexedDB bloqueada por otra pestaña'));
  });
}

/** Los bytes guardados de un fichero, o nada si es la primera visita o no se pudo leer. */
export async function leerElFicheroGuardado(nombre: string): Promise<Uint8Array | undefined> {
  try {
    const bd = await abrirIndexedDb();
    try {
      return await new Promise<Uint8Array | undefined>((resolver, rechazar) => {
        const peticion = bd.transaction(ALMACEN, 'readonly').objectStore(ALMACEN).get(nombre);
        peticion.onsuccess = () => resolver(peticion.result as Uint8Array | undefined);
        peticion.onerror = () => rechazar(peticion.error);
      });
    } finally {
      bd.close();
    }
  } catch (fallo) {
    anotar('leer lo guardado', fallo);
    return undefined;
  }
}

/** Guarda los bytes de un fichero. Si el navegador no deja, no pasa nada. */
export async function guardarElFichero(nombre: string, bytes: Uint8Array): Promise<void> {
  try {
    const bd = await abrirIndexedDb();
    try {
      await new Promise<void>((resolver, rechazar) => {
        const transaccion = bd.transaction(ALMACEN, 'readwrite');
        transaccion.objectStore(ALMACEN).put(bytes, nombre);
        transaccion.oncomplete = () => resolver();
        transaccion.onerror = () => rechazar(transaccion.error);
        transaccion.onabort = () => rechazar(transaccion.error);
      });
    } finally {
      bd.close();
    }
  } catch (fallo) {
    anotar('guardar', fallo);
  }
}

/**
 * Borra lo guardado. Es lo que hay detrás de devolver la demo a su estado de ejemplo:
 * sin fichero que cargar, la próxima apertura vuelve a sembrar el ejemplo.
 */
export async function borrarLoGuardado(): Promise<void> {
  try {
    const bd = await abrirIndexedDb();
    try {
      await new Promise<void>((resolver, rechazar) => {
        const transaccion = bd.transaction(ALMACEN, 'readwrite');
        transaccion.objectStore(ALMACEN).clear();
        transaccion.oncomplete = () => resolver();
        transaccion.onerror = () => rechazar(transaccion.error);
        transaccion.onabort = () => rechazar(transaccion.error);
      });
    } finally {
      bd.close();
    }
  } catch (fallo) {
    anotar('borrar lo guardado', fallo);
  }
}

/**
 * Programa volcados de la base sin escribir una vez por cada tecla.
 *
 * Espera un momento tras el último cambio y entonces guarda, de forma que planificar
 * una semana entera no dispare veinte escrituras. El volcado inmediato existe para
 * cuando la página se va: si alguien cierra la pestaña justo después de tocar una celda,
 * el temporizador no llegaría a saltar.
 */
export function crearVolcador(nombre: string, obtenerBytes: () => Uint8Array) {
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  const volcarYa = () => {
    if (temporizador !== undefined) {
      clearTimeout(temporizador);
      temporizador = undefined;
    }
    void guardarElFichero(nombre, obtenerBytes());
  };

  const programarVolcado = () => {
    if (temporizador !== undefined) clearTimeout(temporizador);
    temporizador = setTimeout(volcarYa, ESPERA_ANTES_DE_VOLCAR);
  };

  // `pagehide` es el que llega también cuando el móvil manda la pestaña al fondo, que en
  // un teléfono es la forma habitual de «cerrar» algo. `visibilitychange` cubre el
  // cambio de aplicación.
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', volcarYa);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') volcarYa();
    });
  }

  return { programarVolcado, volcarYa };
}

/**
 * Deja constancia en la consola de desarrollo de por qué no se pudo guardar.
 *
 * **No se recoge en ninguna parte**: se queda en la consola del navegador de quien lo
 * ve, no se envía a ningún sitio y nadie lo mide. Está aquí porque un fallo de IndexedDB
 * no se reproduce en ningún test, y sin esto la demo dejaría de conservar lo escrito sin
 * dar ninguna pista de por qué.
 *
 * (El `privacidad.test.ts` de la capa de datos vigila que aquí no aparezcan las palabras
 * de las herramientas de medición. Que este comentario tenga que decirlo con rodeos es
 * señal de que ese test hace su trabajo.)
 */
function anotar(paso: string, causa: unknown): void {
  console.warn(`[demo] no se pudo ${paso} en el navegador:`, causa);
}
