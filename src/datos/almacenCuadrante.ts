/**
 * Capa de acceso a datos del cuadrante.
 *
 * ── IMPLEMENTACIÓN PROVISIONAL ──────────────────────────────────────────────
 * Todo lo que hay debajo de la interfaz `AlmacenCuadrante` guarda los datos en
 * memoria y se pierde al cerrar la app. Es deliberado: la persistencia (SQLite
 * local con expo-sqlite) es un change aparte, todavía sin especificar.
 *
 * El change de persistencia sustituye la implementación **sin cambiar esta
 * interfaz**: basta con proporcionar otro objeto que cumpla `AlmacenCuadrante` y
 * pasarlo a `instalarAlmacen`. La pantalla del cuadrante no accede a los datos por
 * ninguna otra vía —no importa este fichero para leer estructuras internas, no
 * guarda estado propio de turnos ni de plantilla, y no conoce SQLite ni ningún
 * store—, así que ese cambio no toca ni un componente.
 *
 * Lo mismo vale para el panel de empleados: el alta y el borrado viven aquí porque
 * la pantalla provisional de empleados los necesita, y el change del panel de
 * empleados los reemplazará por la ficha completa (nombre, teléfono, email). El
 * cuadrante solo consume `listarEmpleados`, que devuelve el nombre mostrable.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { FechaISO, Semana } from '../dominio/semana';
import { diasDeLaSemana } from '../dominio/semana';
import type { Hora } from '../dominio/formatos';
import {
  CELDA_VACIA,
  type ContenidoCelda,
  type Empleado,
  type IdEmpleado,
  type IdTurno,
  type TurnoPlanificado,
} from '../dominio/tipos';
import { ordenarEmpleadosPorNombre } from '../dominio/orden';
import { ordenarPorHoraDeInicio } from '../dominio/turno';

/** Contenido de una semana entera: para cada empleado, sus siete días. */
export type ContenidoDeLaSemana = ReadonlyMap<IdEmpleado, ReadonlyMap<FechaISO, ContenidoCelda>>;

/**
 * Lecturas y escrituras que consume la pantalla del cuadrante.
 * Es el único contrato entre la pantalla y los datos.
 */
export interface AlmacenCuadrante {
  /** Plantilla actual, en orden alfabético. Es la misma sea cual sea la semana. */
  listarEmpleados(): Empleado[];
  altaEmpleado(nombre: string): Empleado;
  borrarEmpleado(id: IdEmpleado): void;

  /** Contenido de las celdas de una semana concreta. */
  leerSemana(semana: Semana): ContenidoDeLaSemana;
  leerCelda(idEmpleado: IdEmpleado, dia: FechaISO): ContenidoCelda;

  /** Crea un turno en la celda. Si ya había dos, no hace nada. */
  crearTurno(idEmpleado: IdEmpleado, dia: FechaISO, inicio: Hora, fin: Hora): void;
  editarTurno(idEmpleado: IdEmpleado, dia: FechaISO, idTurno: IdTurno, inicio: Hora, fin: Hora): void;
  eliminarTurno(idEmpleado: IdEmpleado, dia: FechaISO, idTurno: IdTurno): void;

  marcarAusencia(idEmpleado: IdEmpleado, dia: FechaISO): void;
  marcarVacaciones(idEmpleado: IdEmpleado, dia: FechaISO): void;
  vaciarCelda(idEmpleado: IdEmpleado, dia: FechaISO): void;

  /** Avisa de cualquier cambio, para que la pantalla se vuelva a pintar. */
  suscribirse(oyente: () => void): () => void;
}

function clave(idEmpleado: IdEmpleado, dia: FechaISO): string {
  return `${idEmpleado}|${dia}`;
}

/** Crea un almacén en memoria, opcionalmente con una plantilla inicial. */
export function crearAlmacenEnMemoria(nombresIniciales: readonly string[] = []): AlmacenCuadrante {
  let empleados: Empleado[] = [];
  const celdas = new Map<string, ContenidoCelda>();
  const oyentes = new Set<() => void>();
  let siguienteId = 1;

  const nuevoId = () => String(siguienteId++);
  const avisar = () => oyentes.forEach((oyente) => oyente());

  function leerCelda(idEmpleado: IdEmpleado, dia: FechaISO): ContenidoCelda {
    return celdas.get(clave(idEmpleado, dia)) ?? CELDA_VACIA;
  }

  function escribirCelda(idEmpleado: IdEmpleado, dia: FechaISO, contenido: ContenidoCelda): void {
    if (contenido.tipo === 'vacia') celdas.delete(clave(idEmpleado, dia));
    else celdas.set(clave(idEmpleado, dia), contenido);
    avisar();
  }

  /** Los turnos que hay ahora mismo en la celda, o lista vacía si no hay ninguno. */
  function turnosDe(idEmpleado: IdEmpleado, dia: FechaISO): readonly TurnoPlanificado[] {
    const contenido = leerCelda(idEmpleado, dia);
    return contenido.tipo === 'turnos' ? contenido.turnos : [];
  }

  function guardarTurnos(
    idEmpleado: IdEmpleado,
    dia: FechaISO,
    turnos: readonly TurnoPlanificado[],
  ): void {
    if (turnos.length === 0) {
      escribirCelda(idEmpleado, dia, CELDA_VACIA);
      return;
    }
    if (turnos.length === 1) {
      escribirCelda(idEmpleado, dia, { tipo: 'turnos', turnos: [turnos[0]] });
      return;
    }
    escribirCelda(idEmpleado, dia, {
      tipo: 'turnos',
      turnos: ordenarPorHoraDeInicio([turnos[0], turnos[1]]),
    });
  }

  const almacen: AlmacenCuadrante = {
    listarEmpleados() {
      return ordenarEmpleadosPorNombre(empleados);
    },

    altaEmpleado(nombre) {
      const empleado: Empleado = { id: nuevoId(), nombre: nombre.trim() };
      empleados = [...empleados, empleado];
      avisar();
      return empleado;
    },

    borrarEmpleado(id) {
      empleados = empleados.filter((empleado) => empleado.id !== id);
      // Sus celdas se van con él: no hay histórico de plantilla.
      for (const k of [...celdas.keys()]) {
        if (k.startsWith(`${id}|`)) celdas.delete(k);
      }
      avisar();
    },

    leerSemana(semana) {
      const dias = diasDeLaSemana(semana);
      const porEmpleado = new Map<IdEmpleado, ReadonlyMap<FechaISO, ContenidoCelda>>();
      for (const empleado of almacen.listarEmpleados()) {
        const porDia = new Map<FechaISO, ContenidoCelda>();
        for (const dia of dias) porDia.set(dia, leerCelda(empleado.id, dia));
        porEmpleado.set(empleado.id, porDia);
      }
      return porEmpleado;
    },

    leerCelda,

    crearTurno(idEmpleado, dia, inicio, fin) {
      const existentes = turnosDe(idEmpleado, dia);
      if (existentes.length >= 2) return; // Nunca un tercer turno el mismo día.
      guardarTurnos(idEmpleado, dia, [...existentes, { id: nuevoId(), inicio, fin }]);
    },

    editarTurno(idEmpleado, dia, idTurno, inicio, fin) {
      const turnos = turnosDe(idEmpleado, dia).map((turno) =>
        turno.id === idTurno ? { ...turno, inicio, fin } : turno,
      );
      guardarTurnos(idEmpleado, dia, turnos);
    },

    eliminarTurno(idEmpleado, dia, idTurno) {
      guardarTurnos(
        idEmpleado,
        dia,
        turnosDe(idEmpleado, dia).filter((turno) => turno.id !== idTurno),
      );
    },

    marcarAusencia(idEmpleado, dia) {
      escribirCelda(idEmpleado, dia, { tipo: 'ausencia' });
    },

    marcarVacaciones(idEmpleado, dia) {
      escribirCelda(idEmpleado, dia, { tipo: 'vacaciones' });
    },

    vaciarCelda(idEmpleado, dia) {
      escribirCelda(idEmpleado, dia, CELDA_VACIA);
    },

    suscribirse(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };

  for (const nombre of nombresIniciales) almacen.altaEmpleado(nombre);
  return almacen;
}

/** Almacén que usa la app en ejecución. */
let almacenInstalado: AlmacenCuadrante = crearAlmacenEnMemoria();

/**
 * Sustituye el almacén en uso. El change de persistencia llamará aquí con la
 * implementación sobre SQLite; los tests la usan para partir de un estado conocido.
 */
export function instalarAlmacen(almacen: AlmacenCuadrante): void {
  almacenInstalado = almacen;
}

export function almacen(): AlmacenCuadrante {
  return almacenInstalado;
}
