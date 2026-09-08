/**
 * Dónde vive lo copiado de una celda mientras el encargado planifica.
 *
 * Vive **fuera del árbol de React**, en memoria, y no pasa por el almacén.
 *
 * Fuera del árbol porque la spec exige que dure mientras la app está abierta: si
 * viviera en el estado de `PantallaCuadrante`, su duración pasaría a depender de si
 * expo-router mantiene montada la pantalla al abrir la ficha de un empleado, algo
 * que hoy hace y que nadie ha prometido. Aquí la respuesta no depende de la
 * navegación.
 *
 * Y no pasa por el almacén porque el almacén escribe en SQLite: lo copiado se pierde
 * al cerrar la app, a propósito. Es un apaño de planificación que dura treinta
 * segundos, no un dato del local, y guardarlo obligaría a migrar la base de datos.
 *
 * Tampoco es el portapapeles del sistema: copiar un turno no debe pisar lo que el
 * encargado tuviera copiado en el móvil, ni pegar debe tener que interpretar lo que
 * haya dejado ahí cualquier otra app.
 */

import { useEffect, useState } from 'react';

import type { ContenidoCopiado } from '../dominio/copia';

let copiado: ContenidoCopiado | null = null;
const oyentes = new Set<() => void>();

/** Guarda lo copiado, sustituyendo lo que hubiera: solo hay un sitio, no una pila. */
export function copiar(contenido: ContenidoCopiado): void {
  copiado = contenido;
  oyentes.forEach((oyente) => oyente());
}

/** Lo copiado ahora mismo, o `null` si no se ha copiado nada. */
export function loCopiado(): ContenidoCopiado | null {
  return copiado;
}

export function suscribirseALoCopiado(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

/**
 * Devuelve el módulo al estado en que arranca la app: sin nada copiado y sin nadie
 * escuchando.
 *
 * La interfaz no ofrece esta acción —copiar otra celda ya sustituye—: existe para que
 * cada test parta de un estado conocido, porque el módulo dura lo que dura el proceso
 * y no lo que dura un test.
 *
 * No avisa a nadie a propósito: quien estuviera suscrito pertenece a un árbol de un
 * render anterior, al que ya no le interesa repintarse.
 */
export function olvidarLoCopiado(): void {
  copiado = null;
  oyentes.clear();
}

/** Lo copiado, repintando la pantalla cuando cambia. */
export function usarLoCopiado(): ContenidoCopiado | null {
  const [contenido, setContenido] = useState<ContenidoCopiado | null>(loCopiado);

  useEffect(() => {
    // Se relee al suscribirse: entre el primer pintado y este efecto puede haberse
    // copiado algo desde otra pantalla.
    setContenido(loCopiado());
    return suscribirseALoCopiado(() => setContenido(loCopiado()));
  }, []);

  return contenido;
}
