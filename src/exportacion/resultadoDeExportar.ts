/**
 * Cómo acaba una exportación y qué se le dice al encargado, sea cual sea la plataforma.
 *
 * Está aparte de `compartirElCuadrante.ts` desde que existe la demo web, que tiene su
 * propia tubería de exportación —en un navegador no hay hoja de compartir ni selector de
 * carpetas— pero **los mismos textos y los mismos desenlaces**. Duplicarlos habría dejado
 * dos sitios donde arreglar una errata y la posibilidad de que el aviso del móvil y el de
 * la demo acabaran diciendo cosas distintas.
 *
 * Aquí no se importa nada: ni `expo-print`, ni `expo-sharing`, ni el sistema de ficheros.
 * Es lo que permite que las dos versiones lo compartan.
 */

/**
 * Cómo acabó el intento de exportar. La pantalla no necesita saber nada más: no hay
 * códigos, ni causas, ni rutas de fichero que enseñar.
 */
export type ResultadoDeExportar =
  /** Se produjo el documento y se ofreció por la hoja de compartir. */
  | { readonly tipo: 'compartido' }
  /** Se produjo el documento y quedó escrito en la carpeta que eligió el encargado. */
  | { readonly tipo: 'guardado' }
  /** Se abrió el selector de carpetas y el encargado lo cerró sin elegir ninguna. */
  | { readonly tipo: 'desistido' }
  /** No hay ningún empleado dado de alta: no hay cuadrante que compartir. */
  | { readonly tipo: 'sin-plantilla' }
  /** No se pudo producir, no se pudo compartir o no se pudo guardar. Lleva ya el texto. */
  | { readonly tipo: 'fallo'; readonly mensaje: string };

/**
 * Los textos que ve el encargado cuando algo no sale, y el que le confirma que su
 * documento ha quedado guardado.
 *
 * Están escritos en lenguaje corriente y no dicen ni módulo, ni código, ni ruta: al
 * encargado no le sirve de nada saber que falló el motor de impresión, y un mensaje
 * técnico solo le hace pensar que ha roto algo. El de guardado tampoco nombra la
 * carpeta: la eligió él, y una ruta del sistema no le diría dónde ha dejado nada.
 */
export const MENSAJE_SIN_PLANTILLA = 'No hay nada que compartir: todavía no hay empleados.';
export const MENSAJE_NO_SE_PUDO_COMPARTIR =
  'No se ha podido compartir el cuadrante. Inténtalo de nuevo.';
export const MENSAJE_NO_SE_PUDO_GUARDAR =
  'No se ha podido guardar el cuadrante. Inténtalo de nuevo.';
export const MENSAJE_GUARDADO = 'El cuadrante ha quedado guardado donde lo has puesto.';

/** Lo que el PDF se lleva de tipo cuando la hoja del sistema pregunta. */
export const TIPO_PDF = 'application/pdf';
