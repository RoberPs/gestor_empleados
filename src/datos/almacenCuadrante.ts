/**
 * Capa de acceso a datos del cuadrante y del panel de empleados.
 *
 * ── IMPLEMENTACIÓN PROVISIONAL ──────────────────────────────────────────────
 * Todo lo que hay debajo de la interfaz `AlmacenCuadrante` guarda los datos en
 * memoria y se pierde al cerrar la app. Es deliberado: la persistencia (SQLite
 * local con expo-sqlite) es un change aparte, todavía sin especificar.
 *
 * El change de persistencia sustituye la implementación **sin cambiar esta
 * interfaz**: basta con proporcionar otro objeto que cumpla `AlmacenCuadrante` y
 * pasarlo a `instalarAlmacen`. Ni el cuadrante ni el panel de empleados acceden a
 * los datos por ninguna otra vía —no importan este fichero para leer estructuras
 * internas, no guardan estado propio de turnos, de plantilla ni de ficha, y no
 * conocen SQLite ni ningún store—, así que ese cambio no toca ni un componente.
 *
 * La ficha completa del empleado vive ya aquí: nombre, teléfono, email, nota y las
 * vacaciones por rango. El cuadrante solo consume de todo eso `listarEmpleados` y
 * el contenido de las celdas; el teléfono, el email y la nota no salen de la ficha.
 * Al change de persistencia se le traslada una restricción: la baja es un borrado
 * real, no una marca de inactivo, y se lleva las celdas de cualquier semana.
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
import { sanearCampo, sePuedeGuardarElNombre } from '../dominio/empleado';
import { ordenarEmpleadosPorNombre } from '../dominio/orden';
import { ordenarPorHoraDeInicio } from '../dominio/turno';
import { agruparEnRangos, diasDelRango, type RangoDeVacaciones } from '../dominio/vacaciones';

/** Contenido de una semana entera: para cada empleado, sus siete días. */
export type ContenidoDeLaSemana = ReadonlyMap<IdEmpleado, ReadonlyMap<FechaISO, ContenidoCelda>>;

/**
 * Lecturas y escrituras que consume la pantalla del cuadrante.
 * Es el único contrato entre la pantalla y los datos.
 */
export interface AlmacenCuadrante {
  /** Plantilla actual, en orden alfabético. Es la misma sea cual sea la semana. */
  listarEmpleados(): Empleado[];
  /** La ficha de un empleado, o `null` si ya no está en la plantilla. */
  leerEmpleado(id: IdEmpleado): Empleado | null;
  /**
   * Da de alta un empleado. El teléfono y el email son opcionales.
   * Devuelve `null` sin tocar la plantilla si el nombre está vacío o repetido.
   */
  altaEmpleado(nombre: string, telefono?: string, email?: string): Empleado | null;
  /** Cambia el nombre. Devuelve `false` sin guardar si queda vacío o repetido. */
  editarNombre(id: IdEmpleado, nombre: string): boolean;
  editarTelefono(id: IdEmpleado, telefono: string): void;
  editarEmail(id: IdEmpleado, email: string): void;
  editarNota(id: IdEmpleado, nota: string): void;
  /** La baja se lleva al empleado y sus celdas de cualquier semana, también pasadas. */
  borrarEmpleado(id: IdEmpleado): void;

  /** Los días de vacaciones del empleado, agrupados en tramos contiguos. */
  leerRangosDeVacaciones(id: IdEmpleado): RangoDeVacaciones[];
  /**
   * Cuántos días del rango tienen ya turno planificado o ausencia. Los que ya
   * estaban de vacaciones no cuentan: el rango no les cambia nada.
   */
  contarDiasConContenido(id: IdEmpleado, rango: RangoDeVacaciones): number;
  /** Marca como vacaciones todos los días del rango, sustituyendo lo que hubiera. */
  marcarRangoDeVacaciones(id: IdEmpleado, rango: RangoDeVacaciones): void;
  /** Vacía los días de vacaciones del rango. Lo demás no se toca. */
  eliminarRangoDeVacaciones(id: IdEmpleado, rango: RangoDeVacaciones): void;

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

  /**
   * Cambia campos sueltos de una ficha. Un campo a `undefined` se quita: es como
   * se vacían el teléfono, el email y la nota.
   */
  function cambiarFicha(id: IdEmpleado, cambios: Partial<Omit<Empleado, 'id'>>): void {
    empleados = empleados.map((empleado) => {
      if (empleado.id !== id) return empleado;
      const cambiado: Record<string, unknown> = { ...empleado, ...cambios };
      for (const campo of Object.keys(cambios)) {
        if (cambiado[campo] === undefined) delete cambiado[campo];
      }
      return cambiado as unknown as Empleado;
    });
    avisar();
  }

  const almacen: AlmacenCuadrante = {
    listarEmpleados() {
      return ordenarEmpleadosPorNombre(empleados);
    },

    leerEmpleado(id) {
      return empleados.find((empleado) => empleado.id === id) ?? null;
    },

    altaEmpleado(nombre, telefono, email) {
      if (!sePuedeGuardarElNombre(nombre, empleados)) return null;

      // Teléfono y email son opcionales: si llegan vacíos, la ficha no guarda el
      // campo en absoluto en lugar de guardar una cadena vacía.
      const empleado: Empleado = {
        id: nuevoId(),
        nombre: sanearCampo(nombre),
        ...(sanearCampo(telefono ?? '') ? { telefono: sanearCampo(telefono ?? '') } : {}),
        ...(sanearCampo(email ?? '') ? { email: sanearCampo(email ?? '') } : {}),
      };
      empleados = [...empleados, empleado];
      avisar();
      return empleado;
    },

    editarNombre(id, nombre) {
      if (!sePuedeGuardarElNombre(nombre, empleados, id)) return false;
      cambiarFicha(id, { nombre: sanearCampo(nombre) });
      return true;
    },

    editarTelefono(id, telefono) {
      cambiarFicha(id, { telefono: sanearCampo(telefono) || undefined });
    },

    editarEmail(id, email) {
      cambiarFicha(id, { email: sanearCampo(email) || undefined });
    },

    editarNota(id, nota) {
      // La nota se guarda entera: ni se recorta ni se le quitan los saltos de
      // línea, solo los espacios de los extremos, igual que el resto de campos.
      cambiarFicha(id, { nota: sanearCampo(nota) || undefined });
    },

    leerRangosDeVacaciones(id) {
      const dias: FechaISO[] = [];
      for (const [k, contenido] of celdas) {
        if (contenido.tipo !== 'vacaciones') continue;
        const [idDeLaCelda, dia] = k.split('|');
        if (idDeLaCelda === id) dias.push(dia);
      }
      return agruparEnRangos(dias);
    },

    contarDiasConContenido(id, rango) {
      return diasDelRango(rango).filter((dia) => {
        const tipo = leerCelda(id, dia).tipo;
        return tipo === 'turnos' || tipo === 'ausencia';
      }).length;
    },

    marcarRangoDeVacaciones(id, rango) {
      // Día a día, con la misma operación que la celda del cuadrante: el rango no
      // es más que una forma de marcar varios días de una vez.
      for (const dia of diasDelRango(rango)) almacen.marcarVacaciones(id, dia);
    },

    eliminarRangoDeVacaciones(id, rango) {
      for (const dia of diasDelRango(rango)) {
        if (leerCelda(id, dia).tipo === 'vacaciones') almacen.vaciarCelda(id, dia);
      }
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
