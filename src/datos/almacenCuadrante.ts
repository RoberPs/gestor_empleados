/**
 * Capa de acceso a datos del cuadrante y del panel de empleados.
 *
 * ── QUÉ SOBREVIVE AL CIERRE DE LA APP Y QUÉ NO ──────────────────────────────
 * Debajo de la interfaz `AlmacenCuadrante` conviven hoy dos cosas:
 *
 * - **La plantilla y las fichas van contra SQLite** y se conservan en el
 *   dispositivo: nombre, teléfono, email y nota siguen ahí al reabrir la app. Lo
 *   implementa `sqlite/almacenEmpleadosSqlite.ts`; este fichero solo lo compone.
 * - **Las celdas del cuadrante siguen en memoria y se pierden al cerrar la app**:
 *   turnos planificados, ausencias y vacaciones. Su persistencia es el change de
 *   turnos, todavía por hacer. Hasta entonces, reabrir la app deja la plantilla
 *   intacta y el cuadrante vacío.
 *
 * La interfaz no distingue entre las dos: ni el cuadrante ni el panel de empleados
 * acceden a los datos por ninguna otra vía —no importan este fichero para leer
 * estructuras internas, no guardan estado propio de turnos, de plantilla ni de
 * ficha, y no conocen SQLite ni ningún store—, así que llevar las celdas a SQLite
 * tampoco tocará ni un componente.
 *
 * `crearAlmacenEnMemoria` no se borra: es lo que los tests de pantalla inyectan con
 * `instalarAlmacen` para partir de un estado conocido sin tocar ninguna base de
 * datos.
 *
 * La baja de un empleado es un borrado real, no una marca de inactivo, y se lleva
 * sus celdas de cualquier semana, también las pasadas.
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
  type TurnosDelDia,
} from '../dominio/tipos';
import type { ContenidoCopiado } from '../dominio/copia';
import { sanearCampo, sePuedeGuardarElNombre } from '../dominio/empleado';
import { ordenarEmpleadosPorNombre } from '../dominio/orden';
import { ordenarPorHoraDeInicio } from '../dominio/turno';
import { agruparEnRangos, diasDelRango, type RangoDeVacaciones } from '../dominio/vacaciones';
import type { AlmacenEmpleados } from './almacenEmpleados';
import type { BaseDeDatos } from './sqlite/bd';
import { crearAlmacenEmpleadosSqlite } from './sqlite/almacenEmpleadosSqlite';

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
   * Da de alta un empleado. El puesto, el teléfono y el email son opcionales.
   * Devuelve `null` sin tocar la plantilla si el nombre está vacío o repetido.
   */
  altaEmpleado(nombre: string, telefono?: string, email?: string, puesto?: string): Empleado | null;
  /** Cambia el nombre. Devuelve `false` sin guardar si queda vacío o repetido. */
  editarNombre(id: IdEmpleado, nombre: string): boolean;
  /** Texto libre. No interviene en la unicidad del nombre ni en el orden de la lista. */
  editarPuesto(id: IdEmpleado, puesto: string): void;
  editarTelefono(id: IdEmpleado, telefono: string): void;
  editarEmail(id: IdEmpleado, email: string): void;
  editarNota(id: IdEmpleado, nota: string): void;
  /** Un motivo por empleado: el que se escriba pisa al que hubiera. */
  editarMotivoAusencia(id: IdEmpleado, motivo: string): void;
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

  /**
   * Deja la celda con el contenido copiado de otra: vacía lo que hubiera y aplica lo
   * nuevo, en una sola operación.
   *
   * Es una operación de la capa de datos y no una receta de la pantalla porque pegar
   * unas vacaciones sobre una celda de dos turnos son tres escrituras en un orden
   * concreto: sueltas, cada una avisaría a los suscriptores y la rejilla se
   * repintaría con la celda a medio hacer, en un estado que nunca debió verse.
   *
   * Los turnos copiados se crean **nuevos** en esta celda: no se reutiliza ningún
   * identificador de la celda de origen, que además se queda intacta.
   */
  pegarEnCelda(idEmpleado: IdEmpleado, dia: FechaISO, contenido: ContenidoCopiado): void;

  /** Avisa de cualquier cambio, para que la pantalla se vuelva a pintar. */
  suscribirse(oyente: () => void): () => void;
}

function clave(idEmpleado: IdEmpleado, dia: FechaISO): string {
  return `${idEmpleado}|${dia}`;
}

/**
 * El contenido que deja en la celda lo copiado de otra.
 *
 * Los turnos se crean con identificadores **nuevos**, pedidos aquí mismo: lo copiado
 * no trae ninguno, precisamente para que no se pueda reutilizar el de la celda de
 * origen. Se ordenan por hora de inicio igual que los que se crean a mano, para que
 * una celda pegada y una celda tecleada no se distingan en nada.
 */
function celdaConLoCopiado(contenido: ContenidoCopiado, nuevoId: () => IdTurno): ContenidoCelda {
  if (contenido.tipo === 'ausencia') return { tipo: 'ausencia' };
  if (contenido.tipo === 'vacaciones') return { tipo: 'vacaciones' };

  const [primero, segundo] = contenido.turnos;
  const turnos: TurnosDelDia = segundo
    ? ordenarPorHoraDeInicio([
        { id: nuevoId(), inicio: primero.inicio, fin: primero.fin },
        { id: nuevoId(), inicio: segundo.inicio, fin: segundo.fin },
      ])
    : [{ id: nuevoId(), inicio: primero.inicio, fin: primero.fin }];

  return { tipo: 'turnos', turnos };
}

/**
 * La plantilla en memoria: se pierde al cerrar la app.
 *
 * La app **no** la usa —sus empleados van contra SQLite—, pero los tests de pantalla
 * sí: les da una plantilla conocida sin tocar ninguna base de datos.
 */
export function crearAlmacenEmpleadosEnMemoria(): AlmacenEmpleados {
  let empleados: Empleado[] = [];
  const oyentes = new Set<() => void>();
  let siguienteId = 1;

  const avisar = () => oyentes.forEach((oyente) => oyente());

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

  return {
    listarEmpleados() {
      return ordenarEmpleadosPorNombre(empleados);
    },

    leerEmpleado(id) {
      return empleados.find((empleado) => empleado.id === id) ?? null;
    },

    altaEmpleado(nombre, telefono, email, puesto) {
      // El puesto no entra en la comprobación: dos empleados pueden compartirlo.
      if (!sePuedeGuardarElNombre(nombre, empleados)) return null;

      // Puesto, teléfono y email son opcionales: si llegan vacíos, la ficha no
      // guarda el campo en absoluto en lugar de guardar una cadena vacía.
      const empleado: Empleado = {
        id: String(siguienteId++),
        nombre: sanearCampo(nombre),
        ...(sanearCampo(puesto ?? '') ? { puesto: sanearCampo(puesto ?? '') } : {}),
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

    editarPuesto(id, puesto) {
      cambiarFicha(id, { puesto: sanearCampo(puesto) || undefined });
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

    editarMotivoAusencia(id, motivo) {
      // Igual que la nota: texto libre, sin longitud máxima, y el motivo nuevo pisa
      // al anterior porque solo hay uno por empleado.
      cambiarFicha(id, { motivoAusencia: sanearCampo(motivo) || undefined });
    },

    borrarEmpleado(id) {
      empleados = empleados.filter((empleado) => empleado.id !== id);
      avisar();
    },

    suscribirse(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}

/**
 * Compone el almacén que consume la pantalla: la plantilla la atiende `empleados`
 * —contra SQLite en la app, en memoria en los tests de pantalla— y las celdas del
 * cuadrante viven en memoria hasta el change de turnos.
 *
 * Ya no hay ajustes que componer: el nombre del local dejó de ser un dato guardado
 * y vive fijo en el código, junto al logo, en `src/ui/CabeceraSemana.tsx`.
 */
export function crearAlmacenCuadrante(empleados: AlmacenEmpleados): AlmacenCuadrante {
  const celdas = new Map<string, ContenidoCelda>();
  const oyentes = new Set<() => void>();
  let siguienteIdDeTurno = 1;

  const nuevoId = () => String(siguienteIdDeTurno++);
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
    listarEmpleados: (...argumentos) => empleados.listarEmpleados(...argumentos),
    leerEmpleado: (...argumentos) => empleados.leerEmpleado(...argumentos),
    altaEmpleado: (...argumentos) => empleados.altaEmpleado(...argumentos),
    editarNombre: (...argumentos) => empleados.editarNombre(...argumentos),
    editarPuesto: (...argumentos) => empleados.editarPuesto(...argumentos),
    editarTelefono: (...argumentos) => empleados.editarTelefono(...argumentos),
    editarEmail: (...argumentos) => empleados.editarEmail(...argumentos),
    editarNota: (...argumentos) => empleados.editarNota(...argumentos),
    editarMotivoAusencia: (...argumentos) => empleados.editarMotivoAusencia(...argumentos),

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
      // Sus celdas se van con él: no hay histórico de plantilla. Mientras vivan en
      // memoria hay que recorrerlas a mano; cuando pasen a SQLite se irán solas por
      // el `ON DELETE CASCADE` de su clave ajena.
      for (const k of [...celdas.keys()]) {
        if (k.startsWith(`${id}|`)) celdas.delete(k);
      }
      empleados.borrarEmpleado(id);
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

    pegarEnCelda(idEmpleado, dia, contenido) {
      // Una sola escritura, y por tanto un solo aviso: la celda pasa de lo que tenía
      // a lo pegado sin estados intermedios que la rejilla pudiera llegar a pintar.
      escribirCelda(idEmpleado, dia, celdaConLoCopiado(contenido, nuevoId));
    },

    suscribirse(oyente) {
      // Un solo punto de suscripción para la pantalla, aunque debajo haya dos
      // almacenes: cambie la plantilla o cambie una celda, se vuelve a pintar.
      oyentes.add(oyente);
      const darseDeBajaDeEmpleados = empleados.suscribirse(oyente);
      return () => {
        oyentes.delete(oyente);
        darseDeBajaDeEmpleados();
      };
    },
  };

  return almacen;
}

/** Un almacén entero en memoria, opcionalmente con una plantilla inicial. */
export function crearAlmacenEnMemoria(nombresIniciales: readonly string[] = []): AlmacenCuadrante {
  const almacen = crearAlmacenCuadrante(crearAlmacenEmpleadosEnMemoria());
  for (const nombre of nombresIniciales) almacen.altaEmpleado(nombre);
  return almacen;
}

/**
 * El almacén de la app: la plantilla en la base de datos ya abierta y migrada, las
 * celdas del cuadrante todavía en memoria.
 */
export function crearAlmacenSobreSqlite(bd: BaseDeDatos): AlmacenCuadrante {
  return crearAlmacenCuadrante(crearAlmacenEmpleadosSqlite(bd));
}

/**
 * El almacén de cuando la base de datos no se ha podido abrir: rechaza toda lectura
 * y toda escritura.
 *
 * No es la vía por la que el encargado se entera —para eso está el aviso que
 * sustituye a toda la app—, sino una red de seguridad: si alguna pantalla llegara a
 * pintarse por delante de ese aviso, conviene que se note en vez de que enseñe una
 * plantilla vacía y acepte altas que no se guardan en ningún sitio (design.md — D8).
 */
export function crearAlmacenNoDisponible(): AlmacenCuadrante {
  const rechazar = (): never => {
    throw new Error('El almacenamiento no está abierto: no se atiende ninguna operación.');
  };

  // Una a una y no con un Proxy: así, el día que `AlmacenCuadrante` gane una
  // operación, el compilador obliga a decidir qué hace aquí.
  return {
    listarEmpleados: rechazar,
    leerEmpleado: rechazar,
    altaEmpleado: rechazar,
    editarNombre: rechazar,
    editarPuesto: rechazar,
    editarTelefono: rechazar,
    editarEmail: rechazar,
    editarNota: rechazar,
    editarMotivoAusencia: rechazar,
    borrarEmpleado: rechazar,
    leerRangosDeVacaciones: rechazar,
    contarDiasConContenido: rechazar,
    marcarRangoDeVacaciones: rechazar,
    eliminarRangoDeVacaciones: rechazar,
    leerSemana: rechazar,
    leerCelda: rechazar,
    crearTurno: rechazar,
    editarTurno: rechazar,
    eliminarTurno: rechazar,
    marcarAusencia: rechazar,
    marcarVacaciones: rechazar,
    vaciarCelda: rechazar,
    pegarEnCelda: rechazar,
    // Suscribirse no es una operación sobre los datos: nunca habrá ningún cambio
    // del que avisar, así que se admite y no llama a nadie.
    suscribirse: () => () => {},
  };
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
