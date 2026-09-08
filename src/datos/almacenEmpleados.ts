/**
 * La parte de `AlmacenCuadrante` que se ocupa de la plantilla y de la ficha.
 *
 * Está separada del resto porque tiene dos implementaciones a la vez: la de SQLite,
 * que es la que usa la app, y la de memoria, que es la que los tests de pantalla
 * inyectan con `instalarAlmacen` para partir de un estado conocido. Las celdas del
 * cuadrante —turnos, ausencias y vacaciones— siguen viviendo solo en memoria hasta
 * su propio change, así que no entran aquí.
 */

import type { Empleado, IdEmpleado } from '../dominio/tipos';

export interface AlmacenEmpleados {
  /** Plantilla actual, en orden alfabético. */
  listarEmpleados(): Empleado[];
  /** La ficha de un empleado, o `null` si ya no está en la plantilla. */
  leerEmpleado(id: IdEmpleado): Empleado | null;
  /**
   * Devuelve `null` sin tocar la plantilla si el nombre está vacío o repetido.
   *
   * El puesto va el último y no en el orden en que lo pide el alta —nombre, puesto,
   * teléfono, email— para no reescribir todas las llamadas que ya existen por añadir
   * un campo opcional más. El puesto **no interviene** en la unicidad: dos empleados
   * pueden compartirlo, pero no el nombre.
   */
  altaEmpleado(nombre: string, telefono?: string, email?: string, puesto?: string): Empleado | null;
  /** Devuelve `false` sin guardar si el nombre queda vacío o repetido. */
  editarNombre(id: IdEmpleado, nombre: string): boolean;
  editarPuesto(id: IdEmpleado, puesto: string): void;
  editarTelefono(id: IdEmpleado, telefono: string): void;
  editarEmail(id: IdEmpleado, email: string): void;
  editarNota(id: IdEmpleado, nota: string): void;
  /** Un motivo por empleado: el que se escriba pisa al que hubiera. */
  editarMotivoAusencia(id: IdEmpleado, motivo: string): void;
  borrarEmpleado(id: IdEmpleado): void;
  /** Avisa de cualquier escritura aceptada. Una rechazada no avisa a nadie. */
  suscribirse(oyente: () => void): () => void;
}
