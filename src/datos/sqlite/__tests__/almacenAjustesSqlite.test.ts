/**
 * El nombre del local contra SQLite de verdad, incluida la migración que lo hace
 * posible sobre una base que ya tenía empleados dentro.
 */

import { abrirConNodeSqlite, rutaDeFicheroDePrueba } from '../../../pruebas/bdDePrueba';
import { crearAlmacenSobreSqlite } from '../../almacenCuadrante';
import { crearAlmacenAjustesSqlite } from '../almacenAjustesSqlite';
import { crearAlmacenEmpleadosSqlite } from '../almacenEmpleadosSqlite';
import { abrirBaseDeDatos } from '../conexion';
import type { BaseDeDatos } from '../bd';
import { leerVersionDelEsquema, migrar, MIGRACIONES } from '../migraciones';

function baseMigrada(): BaseDeDatos {
  const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');
  migrar(bd);
  return bd;
}

describe('El nombre del local es un dato editable, no un texto fijo', () => {
  it('Primera apertura en un dispositivo nuevo', () => {
    const ajustes = crearAlmacenAjustesSqlite(baseMigrada());

    expect(ajustes.leerNombreDelLocal()).toBe('');
  });

  it('El nombre escrito sobrevive al cierre de la app', () => {
    const fichero = rutaDeFicheroDePrueba();

    const primeraApertura = abrirBaseDeDatos(abrirConNodeSqlite, fichero);
    migrar(primeraApertura);
    crearAlmacenAjustesSqlite(primeraApertura).escribirNombreDelLocal('La Esquina café');
    primeraApertura.cerrar();

    const segundaApertura = abrirBaseDeDatos(abrirConNodeSqlite, fichero);
    migrar(segundaApertura);

    expect(crearAlmacenAjustesSqlite(segundaApertura).leerNombreDelLocal()).toBe('La Esquina café');
  });

  it('El nombre se guarda sin espacios sobrantes', () => {
    const ajustes = crearAlmacenAjustesSqlite(baseMigrada());

    ajustes.escribirNombreDelLocal('  La Esquina café  ');

    expect(ajustes.leerNombreDelLocal()).toBe('La Esquina café');
  });

  it('escribir dos veces deja el último nombre, no dos filas', () => {
    const bd = baseMigrada();
    const ajustes = crearAlmacenAjustesSqlite(bd);

    ajustes.escribirNombreDelLocal('Bar Paco');
    ajustes.escribirNombreDelLocal('La Esquina café');

    expect(ajustes.leerNombreDelLocal()).toBe('La Esquina café');
    expect(bd.leer<{ total: number }>('SELECT COUNT(*) AS total FROM ajustes')[0].total).toBe(1);
  });

  it('Cambiar el nombre del local no toca la plantilla', () => {
    const bd = baseMigrada();
    const almacen = crearAlmacenSobreSqlite(bd);
    almacen.altaEmpleado('Ana');
    almacen.altaEmpleado('Bruno');

    almacen.escribirNombreDelLocal('La Esquina café');

    expect(almacen.listarEmpleados().map((empleado) => empleado.nombre)).toEqual(['Ana', 'Bruno']);
  });
});

describe('La migración de los ajustes respeta lo ya guardado', () => {
  it('una base en la versión 1 con empleados dentro sube a la 2 sin perderlos', () => {
    const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');

    // Se deja la base en la versión 1: la plantilla, y nada más.
    bd.ejecutar('BEGIN');
    MIGRACIONES[0].aplicar(bd);
    bd.ejecutar('PRAGMA user_version = 1');
    bd.ejecutar('COMMIT');
    const empleados = crearAlmacenEmpleadosSqlite(bd);
    empleados.altaEmpleado('Ana', '600112233', 'ana@ejemplo.es');
    empleados.altaEmpleado('Bruno');

    migrar(bd);

    expect(leerVersionDelEsquema(bd)).toBe(MIGRACIONES.length);
    expect(empleados.listarEmpleados().map((empleado) => empleado.nombre)).toEqual([
      'Ana',
      'Bruno',
    ]);
    expect(empleados.listarEmpleados()[0].telefono).toBe('600112233');
    // Y el ajuste está listo, todavía sin escribir.
    expect(crearAlmacenAjustesSqlite(bd).leerNombreDelLocal()).toBe('');
  });
});
