/**
 * La tubería que saca el documento de la demo web: HTML → diálogo del navegador.
 *
 * Misma superficie que `compartirElCuadrante.ts` y **el mismo documento**: se compone con
 * `componerDocumentoDelCuadrante`, que no se toca y sigue decidiendo en solitario qué
 * filas lleva, qué dice cada celda y qué campos de la ficha no pueden aparecer. Aquí solo
 * cambia por dónde sale.
 *
 * ── POR QUÉ NO SE REUTILIZA `expo-print` ────────────────────────────────────
 * Porque en el navegador no hace lo que promete. `expo-print` en web
 * (`node_modules/expo-print/build/ExponentPrint.web.js`) implementa `printToFileAsync`
 * como `window.print()`: **ignora el HTML que se le pasa**, imprime la página que se está
 * viendo y no devuelve ningún fichero. Llamarlo desde el código del móvil sacaría por la
 * impresora el cuadrante de la pantalla en lugar del documento, y `.base64` sería
 * `undefined`. `expo-sharing` en web tampoco sirve: es `navigator.share({ url })`, que
 * comparte una dirección, no un fichero.
 *
 * Así que el documento se escribe en un marco propio, fuera de la vista, y se imprime
 * **ese** marco (design.md — D7). Lo que sale es el documento compuesto, con sus reglas
 * de contenido y de privacidad intactas.
 *
 * ── DOS LÍMITES QUE EL NAVEGADOR IMPONE ─────────────────────────────────────
 * 1. El nombre del fichero es el que se **propone**: el navegador lo toma del título del
 *    documento y quien exporta puede cambiarlo en el diálogo. En el móvil lo pone la app.
 * 2. **No se puede saber si llegó a guardarse.** El diálogo no lo cuenta. Por eso esta
 *    versión no devuelve nunca `guardado`, que es lo que dispara el aviso de «ha quedado
 *    guardado»: afirmarlo cuando puede haberse cancelado sería mentir. Ni se afirma, ni
 *    se da por fallido: se vuelve al cuadrante sin decir nada, que es lo que la spec pide.
 *
 * Nada de esto sale del navegador: el PDF lo produce el propio dispositivo y el cuadrante
 * no viaja a ningún servicio para convertirlo.
 */

import {
  componerDocumentoDelCuadrante,
  type DatosDelDocumento,
  type DocumentoDelCuadrante,
} from './documentoDelCuadrante';
import {
  MENSAJE_NO_SE_PUDO_COMPARTIR,
  MENSAJE_NO_SE_PUDO_GUARDAR,
  type ResultadoDeExportar,
} from './resultadoDeExportar';

export {
  MENSAJE_GUARDADO,
  MENSAJE_NO_SE_PUDO_COMPARTIR,
  MENSAJE_NO_SE_PUDO_GUARDAR,
  MENSAJE_SIN_PLANTILLA,
  type ResultadoDeExportar,
} from './resultadoDeExportar';

/**
 * Deja constancia en la consola de desarrollo de qué paso falló y por qué.
 *
 * No sale del navegador de quien lo ve y nadie lo recoge. Está aquí por lo mismo que su
 * gemelo del móvil: el diálogo de impresión solo falla en un dispositivo de verdad, donde
 * no hay test que lo cuente.
 */
function anotarElFallo(paso: string, causa: unknown): void {
  console.warn(`[exportación] falló en «${paso}»:`, causa);
}

/**
 * Escribe el documento en un marco oculto y abre con él el diálogo del navegador.
 *
 * El marco se retira al terminar. Se espera a que el navegador haya cargado el HTML antes
 * de imprimir: sin eso, en algunos navegadores el diálogo se abre sobre un marco todavía
 * vacío y sale una hoja en blanco.
 */
async function entregarElDocumento(
  documento: DocumentoDelCuadrante,
  mensajeSiFalla: string,
): Promise<ResultadoDeExportar> {
  let marco: HTMLIFrameElement | undefined;
  try {
    marco = document.createElement('iframe');
    // Fuera de la vista pero **no** `display: none`: un marco oculto del todo no se
    // imprime en algunos navegadores.
    marco.setAttribute('aria-hidden', 'true');
    marco.setAttribute('tabindex', '-1');
    marco.style.cssText =
      'position:fixed; right:0; bottom:0; width:1px; height:1px; opacity:0; border:0;';
    document.body.appendChild(marco);

    const documentoDelMarco = marco.contentDocument;
    const ventanaDelMarco = marco.contentWindow;
    if (!documentoDelMarco || !ventanaDelMarco) {
      throw new Error('el navegador no ha dejado preparar el marco de impresión');
    }

    const cargado = new Promise<void>((resolver) => {
      marco!.addEventListener('load', () => resolver(), { once: true });
      // Si el navegador no dispara `load` para un documento escrito a mano, no se puede
      // esperar indefinidamente: el diálogo no se abriría nunca.
      setTimeout(resolver, 500);
    });

    documentoDelMarco.open();
    documentoDelMarco.write(documento.html);
    documentoDelMarco.close();
    await cargado;

    // El nombre que el navegador propone al guardar como PDF sale del título del
    // documento. Se pone aquí, y no en `documentoDelCuadrante.ts`, porque allí el título
    // es el encabezado del documento —el local y el rango— y en el móvil el nombre del
    // fichero lo resuelve la app por su cuenta.
    documentoDelMarco.title = documento.nombreDeFichero;

    ventanaDelMarco.focus();
    ventanaDelMarco.print();

    return { tipo: 'compartido' };
  } catch (causa) {
    anotarElFallo('abrir el diálogo de impresión', causa);
    return { tipo: 'fallo', mensaje: mensajeSiFalla };
  } finally {
    // Se retira después del diálogo. En los navegadores donde `print()` no bloquea, el
    // marco tiene que seguir vivo mientras el diálogo está abierto; de ahí la espera.
    const aRetirar = marco;
    if (aRetirar) setTimeout(() => aRetirar.remove(), 60_000);
  }
}

/**
 * Produce el documento de la semana y lo ofrece por el diálogo del navegador.
 *
 * Con la plantilla vacía no se produce nada, igual que en el móvil.
 */
export async function compartirElCuadrante(datos: DatosDelDocumento): Promise<ResultadoDeExportar> {
  const documento = componerDocumentoDelCuadrante(datos);
  if (documento.tipo === 'sin-plantilla') return { tipo: 'sin-plantilla' };

  return entregarElDocumento(documento, MENSAJE_NO_SE_PUDO_COMPARTIR);
}

/**
 * En el navegador, guardar y compartir desembocan en el mismo sitio.
 *
 * No hay dos destinos que ofrecer: el diálogo del navegador es el que permite guardar
 * como PDF, imprimir o mandarlo, y lo elige quien exporta. Los dos botones del cuadrante
 * siguen existiendo y siguen entregando el mismo documento; lo que no se hace es fingir
 * dos caminos donde solo hay uno.
 */
export async function guardarElCuadrante(datos: DatosDelDocumento): Promise<ResultadoDeExportar> {
  const documento = componerDocumentoDelCuadrante(datos);
  if (documento.tipo === 'sin-plantilla') return { tipo: 'sin-plantilla' };

  return entregarElDocumento(documento, MENSAJE_NO_SE_PUDO_GUARDAR);
}
