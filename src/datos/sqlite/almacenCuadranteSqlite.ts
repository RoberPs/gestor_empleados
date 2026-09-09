/**
 * Las celdas del cuadrante —turnos planificados, ausencias y vacaciones—, contra
 * SQLite. Es lo que hace que lo planificado siga ahí al volver a abrir la app.
 *
 * Aquí se acaba el SQL: hacia arriba solo salen `ContenidoCelda` y los mismos tipos
 * del dominio que devolvía la implementación en memoria, así que ni las pantallas ni
 * el resto de la capa de datos saben que hay una base de datos debajo.
 *
 * ── LO QUE HAY QUE TENER PRESENTE AL TOCAR ESTE FICHERO ─────────────────────
 *
 * - **Una celda vacía es la ausencia de fila.** No hay `tipo = 'vacia'`: vaciar una
 *   celda es borrar su fila de `celdas`, y la cascada se lleva sus turnos.
 * - **Cambiar de estado una celda es borrar su fila y escribir otra**, nunca un
 *   `UPDATE` del tipo: es el borrado el que dispara la cascada que se lleva los
 *   turnos que hubiera. Un `UPDATE` los dejaría colgando de una celda que ya no es
 *   de turnos (design.md — D1).
 * - **Los identificadores de turno son estables mientras el turno existe.** Por eso
 *   crear, editar y eliminar un turno tocan solo su fila y no reescriben la celda
 *   entera: la pantalla los usa para editar y borrar.
 * - **Las horas se guardan como texto `hh:mm`**, la misma forma en que se muestran,
 *   con `formatearHora` y `analizarHora` del dominio en los dos sentidos
 *   (design.md — D3).
 * - **Ni un `ORDER BY`.** El orden de los turnos lo pone `ordenarPorHoraDeInicio` y
 *   el de los empleados `ordenarEmpleadosPorNombre`, igual que en la implementación
 *   en memoria y por la misma razón que en `almacenEmpleadosSqlite.ts`.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { ContenidoCopiado } from '../../dominio/copia';
import { analizarHora, formatearHora, type Hora } from '../../dominio/formatos';
import { domingoDe, type FechaISO } from '../../dominio/semana';
import {
  CELDA_VACIA,
  type ContenidoCelda,
  type IdEmpleado,
  type IdTurno,
  type TurnoPlanificado,
  type TurnosDelDia,
} from '../../dominio/tipos';
import { ordenarPorHoraDeInicio } from '../../dominio/turno';
import { agruparEnRangos, diasDelRango, type RangoDeVacaciones } from '../../dominio/vacaciones';
import type { AlmacenCeldas, CeldasConContenido } from '../almacenCeldas';
import type { BaseDeDatos } from './bd';
import { comoIdDeFila } from './identificadores';

/** Los tres estados que puede tener una fila de `celdas`. La celda vacía no es uno. */
type TipoDeCelda = 'turnos' | 'ausencia' | 'vacaciones';

interface FilaCelda {
  readonly empleado_id: number;
  readonly dia: string;
  readonly tipo: TipoDeCelda;
}

interface FilaTurno {
  readonly id: number;
  readonly empleado_id: number;
  readonly dia: string;
  readonly inicio: string;
  readonly fin: string;
}

/**
 * De fila a turno, o `null` si sus horas no se pueden leer.
 *
 * Las escribe este mismo módulo con `formatearHora`, así que no deberían ser
 * ilegibles nunca. Si lo fueran, la fila se descarta en lugar de mostrar una hora
 * inventada: una lectura no es el sitio donde enterarse de una invariante rota
 * (design.md — D2).
 */
function aTurno(fila: FilaTurno): TurnoPlanificado | null {
  const inicio = analizarHora(fila.inicio);
  const fin = analizarHora(fila.fin);
  if (!inicio || !fin) return null;
  return { id: String(fila.id), inicio, fin };
}

/**
 * Los turnos de un día, a lo sumo dos y en orden de hora de inicio.
 *
 * El esquema admitiría un tercero —el máximo lo guardan el tipo `TurnosDelDia` y el
 * único camino de escritura, que es este fichero—, así que al leer se toleran: se
 * devuelven **los dos primeros por hora de inicio** en lugar de lanzar.
 *
 * Las horas están guardadas como `hh:mm` rellenado con ceros, así que ordenarlas
 * como texto es ordenarlas como horas; el orden que sale de aquí lo pone de todos
 * modos `ordenarPorHoraDeInicio`, que es el mismo que usa la pantalla.
 */
function turnosDelDia(filas: readonly FilaTurno[]): TurnosDelDia | null {
  const turnos = [...filas]
    .sort((una, otra) => (una.inicio < otra.inicio ? -1 : una.inicio > otra.inicio ? 1 : 0))
    .map(aTurno)
    .filter((turno): turno is TurnoPlanificado => turno !== null);

  if (turnos.length === 0) return null;
  if (turnos.length === 1) return [turnos[0]];
  return ordenarPorHoraDeInicio([turnos[0], turnos[1]]);
}

/** El contenido de una celda a partir de su fila y de la de sus turnos. */
function aContenido(tipo: TipoDeCelda, filas: readonly FilaTurno[]): ContenidoCelda {
  if (tipo === 'ausencia') return { tipo: 'ausencia' };
  if (tipo === 'vacaciones') return { tipo: 'vacaciones' };

  const turnos = turnosDelDia(filas);
  // Una celda de turnos sin ni un turno no la escribe nadie: eliminar el último
  // borra la fila de la celda. Si apareciera, es una celda vacía y no un fallo.
  return turnos ? { tipo: 'turnos', turnos } : CELDA_VACIA;
}

/** Mete un valor en el mapa de mapas, creando el de dentro la primera vez. */
function anidar<Clave, Interna, Valor>(
  mapa: Map<Clave, Map<Interna, Valor>>,
  clave: Clave,
  interna: Interna,
  valor: Valor,
): void {
  const dentro = mapa.get(clave) ?? new Map<Interna, Valor>();
  dentro.set(interna, valor);
  mapa.set(clave, dentro);
}

export function crearAlmacenCeldasSqlite(bd: BaseDeDatos): AlmacenCeldas {
  const oyentes = new Set<() => void>();
  const avisar = () => oyentes.forEach((oyente) => oyente());

  /**
   * Una operación de la interfaz, entera o nada, con un solo aviso al final.
   *
   * Pegar en una celda son hasta tres escrituras y marcar un rango de vacaciones una
   * por día. Sueltas, cada una avisaría a los suscriptores y la rejilla se
   * repintaría con la celda a medio hacer, en un estado que nunca debió verse
   * (design.md — D5). La operación puede devolver `false` para decir que no cambió
   * nada y que no hay de qué avisar.
   */
  function operacion(hacer: () => boolean | void): void {
    bd.ejecutar('BEGIN');
    let cambio: boolean | void;
    try {
      cambio = hacer();
      bd.ejecutar('COMMIT');
    } catch (fallo) {
      bd.ejecutar('ROLLBACK');
      throw fallo;
    }
    if (cambio !== false) avisar();
  }

  function turnosDe(empleado: number, dia: FechaISO): FilaTurno[] {
    return bd.leer<FilaTurno>(
      'SELECT id, empleado_id, dia, inicio, fin FROM turnos WHERE empleado_id = ? AND dia = ?',
      empleado,
      dia,
    );
  }

  function contenidoDe(empleado: number, dia: FechaISO): ContenidoCelda {
    const [celda] = bd.leer<FilaCelda>(
      'SELECT empleado_id, dia, tipo FROM celdas WHERE empleado_id = ? AND dia = ?',
      empleado,
      dia,
    );
    if (!celda) return CELDA_VACIA;
    return aContenido(celda.tipo, celda.tipo === 'turnos' ? turnosDe(empleado, dia) : []);
  }

  /** Borra la fila de la celda. La cascada se lleva sus turnos, si los tenía. */
  function borrarCelda(empleado: number, dia: FechaISO): void {
    bd.escribir('DELETE FROM celdas WHERE empleado_id = ? AND dia = ?', empleado, dia);
  }

  /**
   * Deja la celda en el estado pedido, sustituyendo lo que hubiera.
   *
   * El borrado previo no es una precaución contra la clave primaria: es lo que
   * dispara la cascada que se lleva los turnos de la celda anterior.
   */
  function fijarTipo(empleado: number, dia: FechaISO, tipo: TipoDeCelda): void {
    borrarCelda(empleado, dia);
    bd.escribir('INSERT INTO celdas (empleado_id, dia, tipo) VALUES (?, ?, ?)', empleado, dia, tipo);
  }

  function insertarTurno(empleado: number, dia: FechaISO, inicio: Hora, fin: Hora): void {
    bd.escribir(
      'INSERT INTO turnos (empleado_id, dia, inicio, fin) VALUES (?, ?, ?, ?)',
      empleado,
      dia,
      formatearHora(inicio),
      formatearHora(fin),
    );
  }

  /** Escribe en la celda lo copiado de otra. Los turnos se crean nuevos aquí. */
  function escribirLoCopiado(empleado: number, dia: FechaISO, contenido: ContenidoCopiado): void {
    if (contenido.tipo !== 'turnos') {
      fijarTipo(empleado, dia, contenido.tipo);
      return;
    }
    fijarTipo(empleado, dia, 'turnos');
    for (const turno of contenido.turnos) insertarTurno(empleado, dia, turno.inicio, turno.fin);
  }

  return {
    leerCelda(idEmpleado, dia) {
      const empleado = comoIdDeFila(idEmpleado);
      return empleado === null ? CELDA_VACIA : contenidoDe(empleado, dia);
    },

    leerContenidoDeLaSemana(semana) {
      // Dos consultas por rango y no una por celda: es la lectura que se hace en
      // cada repintado de la pantalla, y `dia` es `aaaa-mm-dd`, así que el `BETWEEN`
      // de texto es una comparación de días naturales correcta (design.md — D4).
      const lunes = semana.lunes;
      const domingo = domingoDe(semana);

      const filasDeTurno = bd.leer<FilaTurno>(
        'SELECT id, empleado_id, dia, inicio, fin FROM turnos WHERE dia BETWEEN ? AND ?',
        lunes,
        domingo,
      );
      const porCelda = new Map<string, FilaTurno[]>();
      for (const fila of filasDeTurno) {
        const clave = `${fila.empleado_id}|${fila.dia}`;
        porCelda.set(clave, [...(porCelda.get(clave) ?? []), fila]);
      }

      const contenido = new Map<IdEmpleado, Map<FechaISO, ContenidoCelda>>();
      for (const fila of bd.leer<FilaCelda>(
        'SELECT empleado_id, dia, tipo FROM celdas WHERE dia BETWEEN ? AND ?',
        lunes,
        domingo,
      )) {
        const suyos = porCelda.get(`${fila.empleado_id}|${fila.dia}`) ?? [];
        anidar(contenido, String(fila.empleado_id), fila.dia, aContenido(fila.tipo, suyos));
      }
      return contenido as CeldasConContenido;
    },

    leerRangosDeVacaciones(id) {
      const empleado = comoIdDeFila(id);
      if (empleado === null) return [];

      // Los días sueltos son lo guardado; los tramos los compone el dominio, igual
      // que en la implementación en memoria (design.md — D6).
      return agruparEnRangos(
        bd
          .leer<{ dia: string }>(
            "SELECT dia FROM celdas WHERE empleado_id = ? AND tipo = 'vacaciones'",
            empleado,
          )
          .map((fila) => fila.dia),
      );
    },

    contarDiasConContenido(id, rango) {
      const empleado = comoIdDeFila(id);
      if (empleado === null) return 0;

      // Los días que ya estaban de vacaciones no cuentan: el rango no les cambia
      // nada. Un rango con el fin anterior al inicio no abarca ningún día, y el
      // `BETWEEN` tampoco.
      const [fila] = bd.leer<{ cuantos: number }>(
        'SELECT COUNT(*) AS cuantos FROM celdas' +
          " WHERE empleado_id = ? AND dia BETWEEN ? AND ? AND tipo IN ('turnos', 'ausencia')",
        empleado,
        rango.inicio,
        rango.fin,
      );
      return fila.cuantos;
    },

    marcarRangoDeVacaciones(id, rango) {
      const empleado = comoIdDeFila(id);
      if (empleado === null) return;

      // Día a día, con la misma escritura que la celda del cuadrante: el rango no es
      // más que una forma de marcar varios días de una vez. Todos en la misma
      // transacción y con un solo aviso al final.
      operacion(() => {
        for (const dia of diasDelRango(rango)) fijarTipo(empleado, dia, 'vacaciones');
      });
    },

    eliminarRangoDeVacaciones(id, rango) {
      const empleado = comoIdDeFila(id);
      if (empleado === null) return;

      // Solo los días que están de vacaciones: lo demás que haya dentro del rango no
      // se toca.
      operacion(() => {
        bd.escribir(
          "DELETE FROM celdas WHERE empleado_id = ? AND dia BETWEEN ? AND ? AND tipo = 'vacaciones'",
          empleado,
          rango.inicio,
          rango.fin,
        );
      });
    },

    crearTurno(idEmpleado, dia, inicio, fin) {
      const empleado = comoIdDeFila(idEmpleado);
      if (empleado === null) return;

      operacion(() => {
        const actual = contenidoDe(empleado, dia);
        if (actual.tipo === 'turnos' && actual.turnos.length >= 2) return false;
        // La celda solo se reescribe si no era ya de turnos: así el turno que
        // hubiera conserva su identificador.
        if (actual.tipo !== 'turnos') fijarTipo(empleado, dia, 'turnos');
        insertarTurno(empleado, dia, inicio, fin);
      });
    },

    editarTurno(idEmpleado, dia, idTurno, inicio, fin) {
      const empleado = comoIdDeFila(idEmpleado);
      const turno = comoIdDeFila(idTurno);
      if (empleado === null || turno === null) return;

      operacion(() => {
        const escritura = bd.escribir(
          'UPDATE turnos SET inicio = ?, fin = ? WHERE id = ? AND empleado_id = ? AND dia = ?',
          formatearHora(inicio),
          formatearHora(fin),
          turno,
          empleado,
          dia,
        );
        return escritura.filasAfectadas > 0;
      });
    },

    eliminarTurno(idEmpleado, dia, idTurno) {
      const empleado = comoIdDeFila(idEmpleado);
      const turno = comoIdDeFila(idTurno);
      if (empleado === null || turno === null) return;

      operacion(() => {
        const escritura = bd.escribir(
          'DELETE FROM turnos WHERE id = ? AND empleado_id = ? AND dia = ?',
          turno,
          empleado,
          dia,
        );
        if (escritura.filasAfectadas === 0) return false;
        // Sin turnos no hay celda de turnos: quitar el último la deja vacía, que es
        // no tener fila.
        if (turnosDe(empleado, dia).length === 0) borrarCelda(empleado, dia);
      });
    },

    marcarAusencia(idEmpleado, dia) {
      const empleado = comoIdDeFila(idEmpleado);
      if (empleado === null) return;
      operacion(() => fijarTipo(empleado, dia, 'ausencia'));
    },

    marcarVacaciones(idEmpleado, dia) {
      const empleado = comoIdDeFila(idEmpleado);
      if (empleado === null) return;
      operacion(() => fijarTipo(empleado, dia, 'vacaciones'));
    },

    vaciarCelda(idEmpleado, dia) {
      const empleado = comoIdDeFila(idEmpleado);
      if (empleado === null) return;
      operacion(() => borrarCelda(empleado, dia));
    },

    pegarEnCelda(idEmpleado, dia, contenido) {
      const empleado = comoIdDeFila(idEmpleado);
      if (empleado === null) return;
      operacion(() => escribirLoCopiado(empleado, dia, contenido));
    },

    borrarCeldasDe() {
      // A propósito, nada: lo del empleado se va con él por el `ON DELETE CASCADE`
      // de su clave ajena. La spec pide justo eso, que la garantía venga de cómo
      // están guardados los datos y no de recorrer semana por semana lo que haya
      // que borrar.
    },

    suscribirse(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}
