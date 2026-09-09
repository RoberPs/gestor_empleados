/**
 * La tubería que saca el documento del dispositivo: HTML → PDF → el destino que elija
 * el encargado.
 *
 * Es el **único** punto de la app que habla con `expo-print`, con `expo-sharing` y con
 * el sistema de ficheros, y a propósito no decide nada sobre el documento: ni qué
 * filas lleva, ni qué dice cada celda, ni qué campos de la ficha pueden aparecer. Todo
 * eso vive en `documentoDelCuadrante.ts`, que es código puro y se comprueba entero en
 * la suite. Aquí solo queda lo que no se puede comprobar sin un móvil delante.
 *
 * ── LOS DOS DESTINOS ────────────────────────────────────────────────────────
 * El documento se produce una sola vez y sale por uno de dos caminos, que el
 * encargado elige:
 *
 * - **Compartir**: se entrega a la hoja del sistema, que es la que decide a dónde va.
 *   La app no elige aplicación de destino y no envía nada a ningún servicio.
 * - **Guardar**: se le pide una carpeta con el selector del sistema y se escribe allí.
 *   La app no da por hecho ninguna carpeta ni escribe fuera de la que él eligió.
 *
 * Lo que los dos comparten —componer el HTML, producir el PDF y resolver el nombre de
 * la semana— está en un solo sitio: que el documento guardado sea el mismo que el
 * compartido, con las mismas reglas de privacidad, no puede depender de que nadie
 * toque una de las dos ramas.
 *
 * `expo-file-system` aparece aquí porque las piezas anteriores no encajan solas:
 * `expo-print` deja el PDF en una carpeta de trabajo suya que queda **fuera de la
 * carpeta de la app**, y ahí no llega nadie más. Se usa para escribir el PDF dentro de
 * la caché de la app —de paso con el nombre de la semana— antes de compartirlo, y para
 * escribirlo en la carpeta que el encargado elige al guardarlo. Para nada más.
 */

import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import {
  MENSAJE_NO_SE_PUDO_COMPARTIR,
  MENSAJE_NO_SE_PUDO_GUARDAR,
  TIPO_PDF,
  type ResultadoDeExportar,
} from './resultadoDeExportar';
import {
  componerDocumentoDelCuadrante,
  type DatosDelDocumento,
  type DocumentoDelCuadrante,
} from './documentoDelCuadrante';

/**
 * El desenlace de una exportación y sus textos viven en `resultadoDeExportar.ts`, que no
 * importa nada del sistema: así la demo web, que exporta por otra vía, usa exactamente
 * los mismos y no hay dos sitios donde arreglar una errata. Se vuelven a exportar desde
 * aquí para que quien ya los pedía a este módulo los siga encontrando.
 */
export {
  MENSAJE_GUARDADO,
  MENSAJE_NO_SE_PUDO_COMPARTIR,
  MENSAJE_NO_SE_PUDO_GUARDAR,
  MENSAJE_SIN_PLANTILLA,
  type ResultadoDeExportar,
} from './resultadoDeExportar';

/**
 * Deja constancia en el terminal de desarrollo de qué paso falló y por qué.
 *
 * **No es telemetría ni analítica**: no sale del ordenador de quien desarrolla y en
 * el móvil del encargado no se ve por ninguna parte. Está aquí porque `expo-print`,
 * `expo-sharing` y el selector de carpetas solo fallan en el dispositivo, donde no hay
 * test que lo cuente, y sin esto un fallo de exportación es un mensaje corriente y
 * ninguna pista.
 */
function anotarElFallo(paso: string, causa: unknown): void {
  console.warn(`[exportación] falló en «${paso}»:`, causa);
}

/** El PDF ya producido: sus bytes y el nombre con el que llega a su destino. */
interface PdfProducido {
  readonly base64: string;
  readonly nombreDeFichero: string;
}

/**
 * Produce el PDF del documento ya compuesto, o dice por qué no se puede.
 *
 * Es el paso que comparten los dos destinos, y el que garantiza que lo guardado y lo
 * compartido sean el mismo documento: hay una sola composición y una sola impresión.
 */
async function producirElPdf(
  documento: DocumentoDelCuadrante,
  mensajeSiFalla: string,
): Promise<PdfProducido | ResultadoDeExportar> {
  // Se pide el PDF **en base64** y no como fichero: el fichero que el motor de
  // impresión escribe por su cuenta está en una carpeta a la que la app no tiene
  // acceso, así que lo que se recoge son sus bytes, no su ruta.
  let pdfEnBase64: string | undefined;
  try {
    pdfEnBase64 = (await Print.printToFileAsync({ html: documento.html, base64: true })).base64;
  } catch (causa) {
    anotarElFallo('producir el PDF', causa);
    return { tipo: 'fallo', mensaje: mensajeSiFalla };
  }
  if (!pdfEnBase64) {
    anotarElFallo('producir el PDF', 'el motor de impresión no devolvió el contenido del PDF');
    return { tipo: 'fallo', mensaje: mensajeSiFalla };
  }

  return { base64: pdfEnBase64, nombreDeFichero: documento.nombreDeFichero };
}

function esUnResultado(pdf: PdfProducido | ResultadoDeExportar): pdf is ResultadoDeExportar {
  return 'tipo' in pdf;
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

  const pdf = await producirElPdf(documento, MENSAJE_NO_SE_PUDO_COMPARTIR);
  if (esUnResultado(pdf)) return pdf;

  let uriCompartible: string;
  try {
    uriCompartible = escribirEnLaCarpetaDeLaApp(pdf.base64, pdf.nombreDeFichero);
  } catch (causa) {
    anotarElFallo('escribir el PDF en la carpeta de la app', causa);
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }

  try {
    await Sharing.shareAsync(uriCompartible, {
      mimeType: TIPO_PDF,
      UTI: 'com.adobe.pdf',
      dialogTitle: pdf.nombreDeFichero,
    });
    return { tipo: 'compartido' };
  } catch (causa) {
    anotarElFallo('abrir la hoja de compartir', causa);
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_COMPARTIR };
  }
}

/**
 * Produce el PDF de la semana y lo escribe en la carpeta que elija el encargado.
 *
 * El PDF se produce **antes** de pedir la carpeta: si no se puede producir, el
 * encargado se entera sin haber recorrido el selector para nada. Es el mismo orden que
 * sigue compartir, que pregunta por la hoja del sistema antes de imprimir.
 *
 * Se escribe directamente en la carpeta elegida, sin pasar por la caché de la app: la
 * caché la necesita compartir porque la hoja del sistema exige un fichero dentro de la
 * carpeta de la app, pero aquí el destino ya es una carpeta a la que la app ha recibido
 * acceso, y un fichero intermedio solo dejaría una copia que luego habría que limpiar.
 */
export async function guardarElCuadrante(datos: DatosDelDocumento): Promise<ResultadoDeExportar> {
  const documento = componerDocumentoDelCuadrante(datos);
  if (documento.tipo === 'sin-plantilla') return { tipo: 'sin-plantilla' };

  const pdf = await producirElPdf(documento, MENSAJE_NO_SE_PUDO_GUARDAR);
  if (esUnResultado(pdf)) return pdf;

  // Cerrar el selector sin elegir carpeta no es un fallo: es desistir, y de eso no se
  // avisa con un error. El selector lo señala rechazando la promesa, que es también
  // como avisaría de un fallo de verdad; por eso los dos casos salen por aquí y lo que
  // los distingue es que uno no ha escrito nada y el otro tampoco.
  let carpeta: Directory;
  try {
    carpeta = await Directory.pickDirectoryAsync();
  } catch (causa) {
    anotarElFallo('pedir la carpeta donde guardar', causa);
    return { tipo: 'desistido' };
  }

  try {
    const destino = carpeta.createFile(`${pdf.nombreDeFichero}.pdf`, TIPO_PDF);
    destino.write(pdf.base64, { encoding: 'base64' });
    return { tipo: 'guardado' };
  } catch (causa) {
    anotarElFallo('escribir el PDF en la carpeta elegida', causa);
    return { tipo: 'fallo', mensaje: MENSAJE_NO_SE_PUDO_GUARDAR };
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
