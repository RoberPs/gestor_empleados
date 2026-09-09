/**
 * La parte de `AlmacenCuadrante` que se ocupa de las celdas: turnos planificados,
 * ausencias y vacaciones de cada empleado y cada día.
 *
 * Está separada del resto por la misma razón que `AlmacenEmpleados`: tiene dos
 * implementaciones a la vez, la de SQLite —que es la que usa la app y la que hace
 * que lo planificado siga ahí al reabrir— y la de memoria, que es la que los tests
 * de pantalla inyectan con `instalarAlmacen` para partir de un estado conocido.
 *
 * Aquí no aparece `leerSemana`: la rejilla de una semana son los siete días de cada
 * empleado **de la plantilla actual**, y quién está en la plantilla no lo sabe este
 * almacén. Lo compone `almacenCuadrante.ts` cruzando la lista de empleados con
 * `leerContenidoDeLaSemana`.
 */

import type { Hora } from '../dominio/formatos';
import type { ContenidoCopiado } from '../dominio/copia';
import type { FechaISO, Semana } from '../dominio/semana';
import type { ContenidoCelda, IdEmpleado, IdTurno } from '../dominio/tipos';
import type { RangoDeVacaciones } from '../dominio/vacaciones';

/**
 * Las celdas **con contenido** de una semana, por empleado y día.
 *
 * Una celda vacía no tiene entrada: es la misma idea que en el fichero, donde una
 * celda vacía es la ausencia de fila. Quien compone la rejilla pone `CELDA_VACIA`
 * en los días que no aparecen.
 */
export type CeldasConContenido = ReadonlyMap<IdEmpleado, ReadonlyMap<FechaISO, ContenidoCelda>>;

export interface AlmacenCeldas {
  leerCelda(idEmpleado: IdEmpleado, dia: FechaISO): ContenidoCelda;
  leerContenidoDeLaSemana(semana: Semana): CeldasConContenido;

  /** Los días de vacaciones del empleado, agrupados en tramos contiguos. */
  leerRangosDeVacaciones(id: IdEmpleado): RangoDeVacaciones[];
  /** Cuántos días del rango tienen ya turno planificado o ausencia. */
  contarDiasConContenido(id: IdEmpleado, rango: RangoDeVacaciones): number;
  marcarRangoDeVacaciones(id: IdEmpleado, rango: RangoDeVacaciones): void;
  eliminarRangoDeVacaciones(id: IdEmpleado, rango: RangoDeVacaciones): void;

  /** Crea un turno en la celda. Si ya había dos, no hace nada. */
  crearTurno(idEmpleado: IdEmpleado, dia: FechaISO, inicio: Hora, fin: Hora): void;
  editarTurno(idEmpleado: IdEmpleado, dia: FechaISO, idTurno: IdTurno, inicio: Hora, fin: Hora): void;
  eliminarTurno(idEmpleado: IdEmpleado, dia: FechaISO, idTurno: IdTurno): void;

  marcarAusencia(idEmpleado: IdEmpleado, dia: FechaISO): void;
  marcarVacaciones(idEmpleado: IdEmpleado, dia: FechaISO): void;
  vaciarCelda(idEmpleado: IdEmpleado, dia: FechaISO): void;
  pegarEnCelda(idEmpleado: IdEmpleado, dia: FechaISO, contenido: ContenidoCopiado): void;

  /**
   * Retira todo lo del empleado, de todas las semanas, antes de que se le dé de baja.
   *
   * En SQLite no hace nada y no es un olvido: lo suyo se va con él por el
   * `ON DELETE CASCADE` de su clave ajena, que es donde la spec quiere esa garantía
   * —en el esquema, no en que ninguna pantalla recorra semana por semana—. En
   * memoria no hay cascada que valga, así que hay que recorrer las celdas a mano.
   */
  borrarCeldasDe(idEmpleado: IdEmpleado): void;

  /** Avisa de cualquier escritura aceptada. */
  suscribirse(oyente: () => void): () => void;
}
