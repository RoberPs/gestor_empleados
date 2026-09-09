/**
 * La plantilla y la semana con las que abre la demo.
 *
 * Quien abre el enlace tiene que ver la app funcionando desde el primer segundo. Una
 * pantalla vacía no enseña nada: no dice cuánto se tarda en planificar una semana, ni
 * cómo se lee la rejilla con la plantilla entera, ni qué aspecto tiene una ausencia al
 * lado de unas vacaciones.
 *
 * ── TODO ESTO ES INVENTADO ──────────────────────────────────────────────────
 * Ni un nombre, teléfono, email o motivo de ausencia corresponde a una persona real, y
 * ninguno sale de la plantilla del local. La demo se publica en un sitio abierto a
 * quien tenga el enlace, y los datos de contacto de la plantilla viven únicamente en el
 * móvil del encargado. Los teléfonos siguen el mismo patrón de ficción que ya usan los
 * tests del proyecto y los emails van a un dominio de ejemplo que no existe.
 *
 * ── ANCLADO A LA SEMANA EN CURSO ────────────────────────────────────────────
 * Las fechas se calculan a partir del día en que se abre la demo, nunca escritas fijas
 * (design.md — D6). Con fechas fijas, la demo abriría en una semana vacía a los dos
 * meses de publicarla, que es justo el día en que se la enseñas a alguien.
 *
 * Este módulo es código corriente y no lleva sufijo de plataforma: así se puede
 * comprobar en la suite. Quien lo llama sí es solo de la demo.
 */

import type { Hora } from '../dominio/formatos';
import { diasDeLaSemana, semanaEnCurso, type FechaISO } from '../dominio/semana';
import type { Empleado, IdEmpleado } from '../dominio/tipos';

/**
 * Lo único que la siembra necesita del almacén.
 *
 * Se declara aquí, y no se importa `AlmacenCuadrante` entero, porque sembrar no tiene
 * por qué enterarse de navegar semanas, copiar celdas ni dar de baja a nadie. Cualquier
 * almacén de la app lo cumple sin adaptarse a nada.
 */
export interface AlmacenParaSembrar {
  listarEmpleados(): Empleado[];
  altaEmpleado(nombre: string, telefono?: string, email?: string, puesto?: string): Empleado | null;
  editarNota(id: IdEmpleado, nota: string): void;
  editarMotivoAusencia(id: IdEmpleado, motivo: string): void;
  crearTurno(idEmpleado: IdEmpleado, dia: FechaISO, inicio: Hora, fin: Hora): void;
  marcarAusencia(idEmpleado: IdEmpleado, dia: FechaISO): void;
  marcarVacaciones(idEmpleado: IdEmpleado, dia: FechaISO): void;
}

const h = (horas: number, minutos = 0): Hora => ({ horas, minutos });

/** Turno de mañana de una cafetería, y el de tarde. */
const MANANA = { inicio: h(7), fin: h(15) } as const;
const TARDE = { inicio: h(15), fin: h(23) } as const;
const PARTIDO_MANANA = { inicio: h(8), fin: h(12) } as const;
const PARTIDO_TARDE = { inicio: h(17), fin: h(21, 30) } as const;

/**
 * Qué hace cada persona de la plantilla de ejemplo a lo largo de la semana.
 *
 * `dias` son índices de lunes (0) a domingo (6). Está escrito así, y no con fechas, para
 * que la misma plantilla sirva sea cual sea la semana en la que se abra la demo.
 */
interface EmpleadoDeEjemplo {
  readonly nombre: string;
  readonly puesto: string;
  readonly telefono: string;
  readonly email: string;
  readonly turnos?: { readonly dias: readonly number[]; readonly turno: { inicio: Hora; fin: Hora } }[];
  readonly ausencias?: readonly number[];
  readonly vacaciones?: readonly number[];
  readonly motivoDeLaAusencia?: string;
  readonly nota?: string;
}

/**
 * Catorce personas: el tamaño real de la plantilla del local.
 *
 * No son tres para que quepan bien. La spec exige que la rejilla siga siendo legible y
 * manejable con la plantilla completa, y una demo de tres filas escondería justo lo que
 * hay que enseñar.
 */
const PLANTILLA_DE_EJEMPLO: readonly EmpleadoDeEjemplo[] = [
  {
    nombre: 'Adriana Peral',
    puesto: 'Barra',
    telefono: '600100201',
    email: 'adriana.peral@ejemplo.es',
    turnos: [{ dias: [0, 1, 2, 3, 4], turno: MANANA }],
  },
  {
    nombre: 'Bruno Alcalá',
    puesto: 'Cocina',
    telefono: '600100202',
    email: 'bruno.alcala@ejemplo.es',
    turnos: [{ dias: [0, 1, 2, 4, 5], turno: TARDE }],
  },
  {
    nombre: 'Candela Ruiz',
    puesto: 'Sala',
    telefono: '600100203',
    email: 'candela.ruiz@ejemplo.es',
    turnos: [
      { dias: [0, 2, 4], turno: PARTIDO_MANANA },
      { dias: [0, 2, 4], turno: PARTIDO_TARDE },
    ],
    nota: 'Prefiere no cerrar los viernes.',
  },
  {
    nombre: 'Damián Ortiz',
    puesto: 'Barra',
    telefono: '600100204',
    email: 'damian.ortiz@ejemplo.es',
    turnos: [{ dias: [2, 3, 4, 5, 6], turno: TARDE }],
  },
  {
    nombre: 'Elena Bardají',
    puesto: 'Sala',
    telefono: '600100205',
    email: 'elena.bardaji@ejemplo.es',
    turnos: [{ dias: [0, 1, 3, 5], turno: MANANA }],
    ausencias: [2],
    motivoDeLaAusencia: 'Cita médica',
  },
  {
    nombre: 'Fernando Gil',
    puesto: 'Cocina',
    telefono: '600100206',
    email: 'fernando.gil@ejemplo.es',
    turnos: [{ dias: [1, 2, 3, 4, 5], turno: MANANA }],
  },
  {
    nombre: 'Gloria Sanchís',
    puesto: 'Sala',
    telefono: '600100207',
    email: 'gloria.sanchis@ejemplo.es',
    vacaciones: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    nombre: 'Héctor Naranjo',
    puesto: 'Barra',
    telefono: '600100208',
    email: 'hector.naranjo@ejemplo.es',
    turnos: [{ dias: [1, 2, 3, 5, 6], turno: TARDE }],
  },
  {
    nombre: 'Irene Vallejo',
    puesto: 'Office',
    telefono: '600100209',
    email: 'irene.vallejo@ejemplo.es',
    turnos: [
      { dias: [1, 3, 5], turno: PARTIDO_MANANA },
      { dias: [1, 3, 5], turno: PARTIDO_TARDE },
    ],
  },
  {
    nombre: 'Jorge Buendía',
    puesto: 'Cocina',
    telefono: '600100210',
    email: 'jorge.buendia@ejemplo.es',
    turnos: [{ dias: [0, 3, 4, 5, 6], turno: MANANA }],
  },
  {
    nombre: 'Lucía Otero',
    puesto: 'Sala',
    telefono: '600100211',
    email: 'lucia.otero@ejemplo.es',
    turnos: [{ dias: [4, 5, 6], turno: TARDE }],
    vacaciones: [0, 1, 2],
  },
  {
    nombre: 'Manuel Cifuentes',
    puesto: 'Barra',
    telefono: '600100212',
    email: 'manuel.cifuentes@ejemplo.es',
    turnos: [{ dias: [0, 1, 2, 3], turno: TARDE }],
    ausencias: [5],
    motivoDeLaAusencia: 'Formación',
  },
  {
    nombre: 'Nuria Estévez',
    puesto: 'Sala',
    telefono: '600100213',
    email: 'nuria.estevez@ejemplo.es',
    turnos: [{ dias: [2, 3, 4, 5, 6], turno: MANANA }],
  },
  {
    nombre: 'Óscar Ibáñez',
    puesto: 'Cocina',
    telefono: '600100214',
    email: 'oscar.ibanez@ejemplo.es',
    turnos: [{ dias: [5, 6], turno: MANANA }],
    nota: 'Solo fines de semana.',
  },
];

/** Si la demo ya tiene contenido. Sembrar sobre algo escrito duplicaría la plantilla. */
export function laDemoYaTieneContenido(almacen: AlmacenParaSembrar): boolean {
  return almacen.listarEmpleados().length > 0;
}

/**
 * Deja la demo con su plantilla y su semana planificada.
 *
 * Escribe **por la misma vía que el encargado**: da de alta y planifica a través de los
 * almacenes, no metiendo filas a mano en SQLite. Si sembrar se rompiera, sería que la
 * app está rota, y es mejor enterarse así que con una demo que enseña un estado
 * imposible de alcanzar usándola (design.md — D6).
 *
 * No hace nada si ya hay plantilla: al recargar la página, lo que haya escrito quien la
 * esté probando manda.
 */
export function sembrarElEjemplo(almacen: AlmacenParaSembrar, ahora: Date = new Date()): void {
  if (laDemoYaTieneContenido(almacen)) return;

  const dias = diasDeLaSemana(semanaEnCurso(ahora));

  for (const persona of PLANTILLA_DE_EJEMPLO) {
    const alta = almacen.altaEmpleado(
      persona.nombre,
      persona.telefono,
      persona.email,
      persona.puesto,
    );
    // `altaEmpleado` devuelve `null` si el nombre está vacío o repetido. Con esta
    // plantilla no puede pasar, pero si alguien edita la lista y repite un nombre, lo
    // que no se puede es seguir planificando turnos de alguien que no existe.
    if (!alta) continue;

    if (persona.nota) almacen.editarNota(alta.id, persona.nota);
    if (persona.motivoDeLaAusencia) {
      almacen.editarMotivoAusencia(alta.id, persona.motivoDeLaAusencia);
    }

    // Las vacaciones van antes que los turnos y las ausencias: así, si alguna vez se
    // solapan al editar la lista, gana lo que se escriba después y no queda una celda
    // en un estado que no se pretendía.
    for (const dia of persona.vacaciones ?? []) almacen.marcarVacaciones(alta.id, diaDe(dias, dia));
    for (const dia of persona.ausencias ?? []) almacen.marcarAusencia(alta.id, diaDe(dias, dia));
    for (const bloque of persona.turnos ?? []) {
      for (const dia of bloque.dias) {
        almacen.crearTurno(alta.id, diaDe(dias, dia), bloque.turno.inicio, bloque.turno.fin);
      }
    }
  }
}

function diaDe(dias: readonly FechaISO[], indice: number): FechaISO {
  return dias[indice];
}
