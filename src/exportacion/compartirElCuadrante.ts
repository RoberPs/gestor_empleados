/**
 * La tubería que saca el documento del dispositivo: HTML → PDF → hoja de compartir.
 *
 * Es el **único** punto de la app que habla con `expo-print` y con `expo-sharing`, y
 * a propósito no decide nada sobre el documento: ni qué filas lleva, ni qué dice
 * cada celda, ni qué campos de la ficha pueden aparecer. Todo eso vive en
 * `documentoDelCuadrante.ts`, que es código puro y se comprueba entero en la suite.
 * Aquí solo queda lo que no se puede comprobar sin un móvil delante.
 *
 * La app no elige destino por el encargado, no guarda el PDF en ninguna carpeta suya
 * y no lo envía a ningún servicio: lo entrega a la hoja del sistema y se aparta. Lo
 * que `expo-print` deja en la caché temporal del propio sistema no es una copia de
 * la app ni sobrevive a nada.
 *
 * `expo-file-system` aparece aquí porque las dos piezas anteriores no encajan solas:
 * `expo-print` deja el PDF en una carpeta de trabajo suya que queda **fuera de la
 * carpeta de la app**, y ahí no llega nadie más. Se usa para escribir el PDF dentro
 * de la caché de la app —de paso con el nombre de la semana— y para nada más: no se
 * lee ni se escribe ningún otro fichero.
 */

import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { componerDocumentoDelCuadrante, type DatosDelDocumento } from './documentoDelCuadrante';

/**
 * Cómo acabó el intento de exportar. La pantalla no necesita saber nada más: no hay
 * códigos, ni causas, ni rutas de fichero que enseñar.
 */
export type ResultadoDeExportar =
  /** Se produjo el documento y se ofreció por la hoja de compartir. */
  | { readonly tipo: 'compartido' }
  /** No hay ningún empleado dado de alta: no hay cuadrante que compartir. */
  | { readonly tipo: 'sin-plantilla' }
  /** No se pudo producir o no se pudo compartir. Lleva ya el texto que se muestra. */
  | { readonly tipo: 'fallo'; readonly mensaje: string };

/**
 * Los dos textos que ve el encargado cuando algo no sale.
 *
 * Están escritos en lenguaje corriente y no dicen ni módulo, ni código, ni ruta: al
 * encargado no le sirve de nada saber que falló el motor de impresión, y un mensaje
 * técnico solo le hace pensar que ha roto algo.
 */
export const MENSAJE_SIN_PLANTILLA = 'No hay nada que compartir: todavía no hay empleados.';
export const MENSAJE_NO_SE_PUDO_COMPARTIR =
  'No se ha podido compartir el cuadrante. Inténtalo de nuevo.';

/** Lo que el PDF se lleva de tipo cuando la hoja del sistema pregunta. */
const TIPO_PDF = 'application/pdf';

/**
 * Deja constancia en el terminal de desarrollo de qué paso falló y por qué.
 *
 * **No es telemetría ni analítica**: no sale del ordenador de quien desarrolla y en
 * el móvil del encargado no se ve por ninguna parte. Está aquí porque `expo-print` y
 * `expo-sharing` solo fallan en el dispositivo, donde no hay test que lo cuente, y
 * sin esto un fallo de exportación es un mensaje corriente y ninguna pista.
 */
function anotarElFallo(paso: string, causa: unknown): void {
  console.warn(`[exportación] falló en «${paso}»:`, causa);
}

/**
 * Produce el PDF de la semana y lo ofrece por la hoja de compartir del sistema.
 *
 * Devuelve siempre, también cuando el encargado cierra la hoja sin elegir nada: eso
 * no es un fallo y no se le muestra ningún error. La pantalla desde la que se llama
 * no se mueve —no navega a ninguna parte, ni cambia de semana—, así que al terminar
 * o al desistir el encargado sigue donde estaba.
 */
export async function compartirElCuadrante(datos: DatosDelDocumento): Promise<ResultadoDeExportar> {
  const documento = componerDocumentoDelCuadrante(datos);
  if (documento.tipo === 'sin-plantilla') return { tipo: 'sin-plantilla' };

  // Se pregunta **antes** de producir nada: si el dispositivo no tiene hoja de
  // compartir, el PDF no le serviría de nada a nadie.
  let hayHojaDeCompartir: boolean;
  try {
    hayHojaDeCompartir = await Sharing.isAvailableAsync();
  } catch (causa) {
    anotarElFallo('preguntar por la hoja de compartir', causa);
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }
  if (!hayHojaDeCompartir) {
    anotarElFallo('preguntar por la hoja de compartir', 'el dispositivo dice que no la tiene');
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }

  // Se pide el PDF **en base64** y no como fichero: el fichero que el motor de
  // impresión escribe por su cuenta está en una carpeta a la que la app no tiene
  // acceso, así que lo que se recoge son sus bytes, no su ruta.
  let pdfEnBase64: string | undefined;
  try {
    pdfEnBase64 = (await Print.printToFileAsync({ html: documento.html, base64: true })).base64;
  } catch (causa) {
    anotarElFallo('producir el PDF', causa);
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }
  if (!pdfEnBase64) {
    anotarElFallo('producir el PDF', 'el motor de impresión no devolvió el contenido del PDF');
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }

  let uriCompartible: string;
  try {
    uriCompartible = escribirEnLaCarpetaDeLaApp(pdfEnBase64, documento.nombreDeFichero);
  } catch (causa) {
    anotarElFallo('escribir el PDF en la carpeta de la app', causa);
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }

  try {
    await Sharing.shareAsync(uriCompartible, {
      mimeType: TIPO_PDF,
      UTI: 'com.adobe.pdf',
      dialogTitle: documento.nombreDeFichero,
    });
    return { tipo: 'compartido' };
  } catch (causa) {
    anotarElFallo('abrir la hoja de compartir', causa);
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }
}

/**
 * Escribe el PDF dentro de la carpeta de la app, con el nombre de la semana, y
 * devuelve su ruta.
 *
 * **No es cosmético: sin esto no se puede compartir nada.** `expo-print` escribe su
 * PDF en una carpeta de trabajo suya —`…/cache/Print/`— que queda fuera de la carpeta
 * de la app, y a ese fichero no llega nadie más: la hoja de compartir se niega a
 * leerlo («Not allowed to read file under given URL») y el sistema de ficheros se
 * niega hasta a moverlo («Missing 'READ' permission for accessing the file»). Las dos
 * cosas, comprobadas en el móvil del encargado el 08/09/2026.
 *
 * Por eso no se copia ni se mueve el fichero del motor de impresión: se le piden sus
 * bytes y se escribe uno nuevo, dentro de casa, donde la app sí manda.
 *
 * De paso resuelve el nombre: el fichero llega a la app de destino llamándose
 * `Cuadrante 07-09-2026 a 13-09-2026.pdf` y no con el identificador aleatorio del
 * motor de impresión, así que tres semanas mandadas al mismo grupo se distinguen sin
 * abrirlas.
 *
 * Va a la **caché** de la app y no a sus documentos: es un fichero de un solo uso,
 * que el sistema puede tirar cuando necesite sitio. La app no guarda copia propia del
 * cuadrante ni un historial de exportaciones. Si se vuelve a compartir la misma
 * semana, el fichero anterior se sustituye en lugar de acumular copias.
 */
function escribirEnLaCarpetaDeLaApp(pdfEnBase64: string, nombre: string): string {
  const destino = new File(Paths.cache, `${nombre}.pdf`);
  destino.create({ overwrite: true });
  destino.write(pdfEnBase64, { encoding: 'base64' });
  return destino.uri;
}
