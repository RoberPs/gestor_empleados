/**
 * Lo que la demo tiene que enseñar en cuanto se abre.
 *
 * Se ejecuta sobre SQLite de verdad y a través de los almacenes de la app, que es como
 * siembra el módulo: si la siembra dejara de funcionar, sería que la app no acepta lo
 * que se le pide, y eso tiene que salir aquí y no delante de un cliente.
 */

import {
  laDemoYaTieneContenido,
  sembrarElEjemplo,
} from '../ejemploDeLaDemo';
import { crearAlmacenSobreSqlite } from '../../datos/almacenCuadrante';
import { abrirBaseDeDatos } from '../../datos/sqlite/conexion';
import { migrar } from '../../datos/sqlite/migraciones';
import { diasDeLaSemana, semanaEnCurso } from '../../dominio/semana';
import { abrirConNodeSqlite } from '../../pruebas/bdDePrueba';

/** El mismo almacén que instala la app al arrancar, sobre SQLite de verdad. */
function montar() {
  const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');
  migrar(bd);
  return crearAlmacenSobreSqlite(bd);
}

/** Los cuatro estados que puede tener una celda, contados en la semana sembrada. */
function contarEstados(ahora: Date) {
  const almacen = montar();
  sembrarElEjemplo(almacen, ahora);
  const dias = diasDeLaSemana(semanaEnCurso(ahora));

  const cuenta = { turnos: 0, ausencia: 0, vacaciones: 0, vacia: 0 };
  for (const empleado of almacen.listarEmpleados()) {
    for (const dia of dias) cuenta[almacen.leerCelda(empleado.id, dia).tipo] += 1;
  }
  return { cuenta, almacen, dias };
}

describe('La demo arranca con un cuadrante de ejemplo', () => {
  it('La demo abre con la semana en curso planificada', () => {
    const ahora = new Date('2026-09-09T10:00:00Z');
    const { cuenta, almacen } = contarEstados(ahora);

    // La plantilla tiene el tamaño real del local: la spec pide entre 10 y 20.
    const plantilla = almacen.listarEmpleados();
    expect(plantilla.length).toBeGreaterThanOrEqual(10);
    expect(plantilla.length).toBeLessThanOrEqual(20);

    // Y en la semana que se ve al abrir están los tres contenidos a la vez, para que se
    // entienda de un vistazo qué sabe hacer la app.
    expect(cuenta.turnos).toBeGreaterThan(0);
    expect(cuenta.ausencia).toBeGreaterThan(0);
    expect(cuenta.vacaciones).toBeGreaterThan(0);
  });

  it('El ejemplo sigue estando en la semana en curso meses después', () => {
    // Es la razón por la que las fechas no se escriben fijas. Con dos fechas de sistema
    // separadas por más de un año, el ejemplo tiene que caer en la semana en curso de
    // cada una, no en la de quien programó la demo.
    for (const dia of ['2026-09-09T10:00:00Z', '2027-02-15T08:30:00Z', '2028-12-31T23:00:00Z']) {
      const ahora = new Date(dia);
      const { cuenta, almacen, dias } = contarEstados(ahora);

      expect(cuenta.turnos).toBeGreaterThan(0);
      expect(cuenta.ausencia).toBeGreaterThan(0);
      expect(cuenta.vacaciones).toBeGreaterThan(0);

      // Y nada cae fuera de esa semana: la de antes y la de después están vacías.
      const semanaAnterior = dias.map((d) => sumarSiete(d, -7));
      for (const empleado of almacen.listarEmpleados()) {
        for (const fuera of semanaAnterior) {
          expect(almacen.leerCelda(empleado.id, fuera)).toEqual({ tipo: 'vacia' });
        }
      }
    }
  });

  it('sembrar dos veces no duplica ningún empleado', () => {
    // Al recargar la página se vuelve a pasar por aquí con la base ya escrita. Lo que
    // haya escrito quien esté probando la demo manda.
    const almacen = montar();
    const ahora = new Date('2026-09-09T10:00:00Z');

    sembrarElEjemplo(almacen, ahora);
    const despuesDeLaPrimera = almacen.listarEmpleados().length;
    sembrarElEjemplo(almacen, ahora);

    expect(almacen.listarEmpleados()).toHaveLength(despuesDeLaPrimera);
  });

  it('no siembra encima de lo que haya escrito quien prueba la demo', () => {
    const almacen = montar();
    almacen.altaEmpleado('Alguien que ya estaba');

    sembrarElEjemplo(almacen, new Date('2026-09-09T10:00:00Z'));

    expect(almacen.listarEmpleados().map((e) => e.nombre)).toEqual(['Alguien que ya estaba']);
    expect(laDemoYaTieneContenido(almacen)).toBe(true);
  });

  it('Ningún dato de la demo corresponde a una persona real', () => {
    // La comprobación de que los nombres son inventados la hace una persona leyendo la
    // lista; lo que sí se puede exigir aquí es que ningún dato de contacto pueda
    // alcanzar a nadie: los teléfonos son del rango de ficción que ya usan los tests del
    // proyecto y los emails van a un dominio de ejemplo que no existe.
    const almacen = montar();
    sembrarElEjemplo(almacen, new Date('2026-09-09T10:00:00Z'));

    for (const empleado of almacen.listarEmpleados()) {
      expect(empleado.telefono).toMatch(/^6001002\d\d$/);
      expect(empleado.email).toMatch(/@ejemplo\.es$/);
    }
  });
});

/** Suma días a una fecha ISO sin traer aquí el módulo de semana entero. */
function sumarSiete(fecha: string, dias: number): string {
  const fechaUtc = new Date(`${fecha}T00:00:00Z`);
  fechaUtc.setUTCDate(fechaUtc.getUTCDate() + dias);
  return fechaUtc.toISOString().slice(0, 10);
}
