/**
 * La parte de `AlmacenCuadrante` que se ocupa de los datos del propio local.
 *
 * Hoy solo hay uno, el nombre del local, y se guarda en el dispositivo igual que la
 * plantilla. Está separada del resto por la misma razón que `AlmacenEmpleados`:
 * tiene dos implementaciones a la vez, la de SQLite que usa la app y la de memoria
 * que los tests de pantalla inyectan para partir de un estado conocido.
 *
 * El logo no está aquí: viene con la app y no se edita desde la interfaz.
 */

export interface AlmacenAjustes {
  /** El nombre del local, o cadena vacía si el encargado no lo ha escrito nunca. */
  leerNombreDelLocal(): string;
  /** Guarda el nombre del local, sin los espacios sobrantes del principio y del final. */
  escribirNombreDelLocal(nombre: string): void;
  /** Avisa de cualquier escritura, para que la pantalla se vuelva a pintar. */
  suscribirse(oyente: () => void): () => void;
}

/**
 * Los ajustes en memoria: se pierden al cerrar la app.
 *
 * La app **no** los usa —los suyos van contra SQLite—, pero los tests de pantalla
 * sí, para partir de un local con nombre o sin él sin tocar ninguna base de datos.
 */
export function crearAlmacenAjustesEnMemoria(nombreInicial = ''): AlmacenAjustes {
  let nombreDelLocal = nombreInicial;
  const oyentes = new Set<() => void>();

  return {
    leerNombreDelLocal() {
      return nombreDelLocal;
    },

    escribirNombreDelLocal(nombre) {
      nombreDelLocal = nombre.trim();
      oyentes.forEach((oyente) => oyente());
    },

    suscribirse(oyente) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
  };
}
