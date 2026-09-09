/**
 * El adaptador de las celdas del cuadrante, contra SQLite de verdad.
 *
 * Aquí se comprueba lo que solo se ve desde debajo de la interfaz: que el ida y
 * vuelta de cada estado de celda es exacto, que la cascada del esquema hace el
 * trabajo que la spec le encarga, que los identificadores de turno no se mueven y
 * que una operación de varias escrituras avisa una sola vez. Los escenarios de la
 * spec, que hablan de cerrar y reabrir la app, se comprueban en
 * `src/ui/__tests__/cuadranteGuardado.test.tsx`.
 */

import { crearAlmacenCeldasSqlite } from '../almacenCuadranteSqlite';
import type { AlmacenCeldas } from '../../almacenCeldas';
import { crearAlmacenEmpleadosSqlite } from '../almacenEmpleadosSqlite';
import type { BaseDeDatos } from '../bd';
import { abrirBaseDeDatos } from '../conexion';
import { migrar } from '../migraciones';
import { abrirConNodeSqlite } from '../../../pruebas/bdDePrueba';
import type { IdEmpleado } from '../../../dominio/tipos';

const h = (horas: number, minutos = 0) => ({ horas, minutos });

const SEMANA = { lunes: '2026-09-07' };
const LUNES = '2026-09-07';
const MARTES = '2026-09-08';
const MIERCOLES = '2026-09-09';

interface Montaje {
  readonly bd: BaseDeDatos;
  readonly celdas: AlmacenCeldas;
  readonly ana: IdEmpleado;
  readonly bruno: IdEmpleado;
}

/** Una base recién migrada con dos empleados y el adaptador montado encima. */
function montar(): Montaje {
  const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');
  migrar(bd);
  const empleados = crearAlmacenEmpleadosSqlite(bd);
  return {
    bd,
    celdas: crearAlmacenCeldasSqlite(bd),
    ana: empleados.altaEmpleado('Ana')!.id,
    bruno: empleados.altaEmpleado('Bruno')!.id,
  };
}

describe('Ida y vuelta de los cuatro estados de una celda', () => {
  it('un turno se lee tal y como se escribió', () => {
    const { bd, celdas, ana } = montar();

    celdas.crearTurno(ana, LUNES, h(9), h(17));

    expect(celdas.leerCelda(ana, LUNES)).toEqual({
      tipo: 'turnos',
      turnos: [{ id: expect.any(String), inicio: h(9), fin: h(17) }],
    });
    // Las horas se guardan como el texto que se muestra, con el cero delante.
    expect(bd.leer('SELECT inicio, fin FROM turnos')).toEqual([{ inicio: '09:00', fin: '17:00' }]);
    bd.cerrar();
  });

  it('los dos turnos de un día se leen en orden de hora de inicio', () => {
    const { bd, celdas, ana } = montar();

    celdas.crearTurno(ana, LUNES, h(20), h(0));
    celdas.crearTurno(ana, LUNES, h(12), h(16));

    expect(celdas.leerCelda(ana, LUNES)).toEqual({
      tipo: 'turnos',
      turnos: [
        { id: expect.any(String), inicio: h(12), fin: h(16) },
        { id: expect.any(String), inicio: h(20), fin: h(0) },
      ],
    });
    bd.cerrar();
  });

  it('la ausencia y las vacaciones se leen idénticas', () => {
    const { bd, celdas, ana } = montar();

    celdas.marcarAusencia(ana, LUNES);
    celdas.marcarVacaciones(ana, MARTES);

    expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'ausencia' });
    expect(celdas.leerCelda(ana, MARTES)).toEqual({ tipo: 'vacaciones' });
    bd.cerrar();
  });

  it('una celda sin escribir se lee vacía, y una vaciada vuelve a estarlo', () => {
    const { bd, celdas, ana } = montar();

    expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'vacia' });

    celdas.crearTurno(ana, LUNES, h(9), h(17));
    celdas.vaciarCelda(ana, LUNES);

    expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'vacia' });
    // Una celda vacía es la ausencia de fila: no queda ni la celda ni su turno.
    expect(bd.leer('SELECT * FROM celdas')).toEqual([]);
    expect(bd.leer('SELECT * FROM turnos')).toEqual([]);
    bd.cerrar();
  });

  it('un identificador de empleado que no es de nadie no rompe la lectura', () => {
    const { bd, celdas } = montar();

    expect(celdas.leerCelda('no-es-un-id', LUNES)).toEqual({ tipo: 'vacia' });
    expect(celdas.leerRangosDeVacaciones('no-es-un-id')).toEqual([]);
    bd.cerrar();
  });
});

describe('La lectura de una semana', () => {
  it('trae solo los días de la semana pedida', () => {
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, LUNES, h(9), h(17));
    // El domingo anterior y el lunes siguiente quedan fuera.
    celdas.marcarAusencia(ana, '2026-09-06');
    celdas.marcarAusencia(ana, '2026-09-14');

    const contenido = celdas.leerContenidoDeLaSemana(SEMANA);

    expect([...contenido.get(ana)!.keys()]).toEqual([LUNES]);
    bd.cerrar();
  });

  it('trae las celdas de todos los empleados que tengan algo esa semana', () => {
    const { bd, celdas, ana, bruno } = montar();
    celdas.crearTurno(ana, LUNES, h(9), h(17));
    celdas.crearTurno(ana, LUNES, h(20), h(23));
    celdas.marcarVacaciones(bruno, MARTES);

    const contenido = celdas.leerContenidoDeLaSemana(SEMANA);

    expect(contenido.get(ana)!.get(LUNES)).toEqual({
      tipo: 'turnos',
      turnos: [
        { id: expect.any(String), inicio: h(9), fin: h(17) },
        { id: expect.any(String), inicio: h(20), fin: h(23) },
      ],
    });
    expect(contenido.get(bruno)!.get(MARTES)).toEqual({ tipo: 'vacaciones' });
    bd.cerrar();
  });

  it('un empleado sin nada esa semana no aparece', () => {
    const { bd, celdas, ana, bruno } = montar();
    celdas.crearTurno(ana, LUNES, h(9), h(17));

    expect(celdas.leerContenidoDeLaSemana(SEMANA).has(bruno)).toBe(false);
    bd.cerrar();
  });
});

describe('Los turnos de un día', () => {
  it('no se guarda un tercer turno el mismo día', () => {
    const { bd, celdas, ana } = montar();

    celdas.crearTurno(ana, LUNES, h(9), h(12));
    celdas.crearTurno(ana, LUNES, h(14), h(18));
    celdas.crearTurno(ana, LUNES, h(20), h(22));

    expect(bd.leer('SELECT COUNT(*) AS cuantos FROM turnos')).toEqual([{ cuantos: 2 }]);
    bd.cerrar();
  });

  it('con tres turnos guardados a mano se leen los dos primeros por hora de inicio', () => {
    // El esquema los admitiría: el máximo lo guardan el tipo y el adaptador
    // (design.md — D2). Una lectura no es el sitio donde enterarse de eso.
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, LUNES, h(14), h(18));
    for (const [inicio, fin] of [
      ['20:00', '22:00'],
      ['09:00', '12:00'],
    ]) {
      bd.escribir(
        'INSERT INTO turnos (empleado_id, dia, inicio, fin) VALUES (?, ?, ?, ?)',
        Number(ana),
        LUNES,
        inicio,
        fin,
      );
    }

    const celda = celdas.leerCelda(ana, LUNES);

    expect(celda).toEqual({
      tipo: 'turnos',
      turnos: [
        { id: expect.any(String), inicio: h(9), fin: h(12) },
        { id: expect.any(String), inicio: h(14), fin: h(18) },
      ],
    });
    bd.cerrar();
  });

  it('editar un turno no toca el otro ni le cambia el identificador', () => {
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, LUNES, h(12), h(16));
    celdas.crearTurno(ana, LUNES, h(20), h(0));
    const antes = celdas.leerCelda(ana, LUNES);
    if (antes.tipo !== 'turnos') throw new Error('la celda debería tener turnos');
    const [mediodia, noche] = antes.turnos;

    celdas.editarTurno(ana, LUNES, mediodia.id, h(12), h(15));

    const despues = celdas.leerCelda(ana, LUNES);
    if (despues.tipo !== 'turnos') throw new Error('la celda debería tener turnos');
    expect(despues.turnos).toEqual([
      { id: mediodia.id, inicio: h(12), fin: h(15) },
      { id: noche!.id, inicio: h(20), fin: h(0) },
    ]);
    bd.cerrar();
  });

  it('eliminar un turno deja al otro con su identificador', () => {
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, LUNES, h(12), h(16));
    celdas.crearTurno(ana, LUNES, h(20), h(0));
    const antes = celdas.leerCelda(ana, LUNES);
    if (antes.tipo !== 'turnos') throw new Error('la celda debería tener turnos');
    const [mediodia, noche] = antes.turnos;

    celdas.eliminarTurno(ana, LUNES, mediodia.id);

    expect(celdas.leerCelda(ana, LUNES)).toEqual({
      tipo: 'turnos',
      turnos: [{ id: noche!.id, inicio: h(20), fin: h(0) }],
    });
    bd.cerrar();
  });

  it('eliminar el último turno deja la celda vacía', () => {
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, LUNES, h(9), h(17));
    const celda = celdas.leerCelda(ana, LUNES);
    if (celda.tipo !== 'turnos') throw new Error('la celda debería tener turnos');

    celdas.eliminarTurno(ana, LUNES, celda.turnos[0].id);

    expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'vacia' });
    expect(bd.leer('SELECT * FROM celdas')).toEqual([]);
    bd.cerrar();
  });
});

describe('Cambiar de estado una celda', () => {
  it('marcar ausencia sobre una celda con turnos se lleva sus turnos por la cascada', () => {
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, LUNES, h(9), h(17));
    celdas.crearTurno(ana, LUNES, h(20), h(23));

    celdas.marcarAusencia(ana, LUNES);

    expect(celdas.leerCelda(ana, LUNES)).toEqual({ tipo: 'ausencia' });
    // Ni una sentencia de borrado de turnos: la escribe el esquema.
    expect(bd.leer('SELECT * FROM turnos')).toEqual([]);
    bd.cerrar();
  });

  it('los turnos de otras celdas no se tocan', () => {
    const { bd, celdas, ana, bruno } = montar();
    celdas.crearTurno(ana, LUNES, h(9), h(17));
    celdas.crearTurno(ana, MARTES, h(9), h(17));
    celdas.crearTurno(bruno, LUNES, h(9), h(17));

    celdas.marcarVacaciones(ana, LUNES);

    expect(celdas.leerCelda(ana, MARTES).tipo).toBe('turnos');
    expect(celdas.leerCelda(bruno, LUNES).tipo).toBe('turnos');
    bd.cerrar();
  });

  it('crear un turno sobre una celda de vacaciones la convierte en celda de turnos', () => {
    const { bd, celdas, ana } = montar();
    celdas.marcarVacaciones(ana, LUNES);

    celdas.crearTurno(ana, LUNES, h(9), h(17));

    expect(celdas.leerCelda(ana, LUNES)).toEqual({
      tipo: 'turnos',
      turnos: [{ id: expect.any(String), inicio: h(9), fin: h(17) }],
    });
    expect(bd.leer('SELECT tipo FROM celdas')).toEqual([{ tipo: 'turnos' }]);
    bd.cerrar();
  });
});

describe('Las vacaciones por rango', () => {
  const RANGO = { inicio: '2026-09-10', fin: '2026-09-14' };

  it('los tramos contiguos se agrupan igual que en memoria', () => {
    const { bd, celdas, ana } = montar();

    celdas.marcarRangoDeVacaciones(ana, { inicio: '2026-09-01', fin: '2026-09-03' });
    celdas.marcarRangoDeVacaciones(ana, { inicio: '2026-09-04', fin: '2026-09-06' });
    expect(celdas.leerRangosDeVacaciones(ana)).toEqual([
      { inicio: '2026-09-01', fin: '2026-09-06' },
    ]);

    // Quitar las vacaciones de un día suelto parte el rango en dos.
    celdas.vaciarCelda(ana, '2026-09-03');
    expect(celdas.leerRangosDeVacaciones(ana)).toEqual([
      { inicio: '2026-09-01', fin: '2026-09-02' },
      { inicio: '2026-09-04', fin: '2026-09-06' },
    ]);
    bd.cerrar();
  });

  it('los rangos son de cada empleado, no de la plantilla entera', () => {
    const { bd, celdas, ana, bruno } = montar();

    celdas.marcarRangoDeVacaciones(bruno, RANGO);

    expect(celdas.leerRangosDeVacaciones(ana)).toEqual([]);
    expect(celdas.leerRangosDeVacaciones(bruno)).toEqual([RANGO]);
    bd.cerrar();
  });

  it('el recuento de días con turno planificado o ausencia es exacto', () => {
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, '2026-09-10', h(9), h(17));
    celdas.crearTurno(ana, '2026-09-11', h(9), h(17));
    celdas.marcarAusencia(ana, '2026-09-13');
    // Los días que ya estaban de vacaciones no cuentan.
    celdas.marcarVacaciones(ana, '2026-09-14');

    expect(celdas.contarDiasConContenido(ana, RANGO)).toBe(3);
    expect(celdas.contarDiasConContenido(ana, { inicio: '2026-09-12', fin: '2026-09-12' })).toBe(0);
    bd.cerrar();
  });

  it('eliminar un rango deja vacíos sus días de vacaciones y no toca lo demás', () => {
    const { bd, celdas, ana } = montar();
    celdas.marcarRangoDeVacaciones(ana, RANGO);
    celdas.crearTurno(ana, '2026-09-12', h(9), h(17));

    celdas.eliminarRangoDeVacaciones(ana, RANGO);

    expect(celdas.leerRangosDeVacaciones(ana)).toEqual([]);
    expect(celdas.leerCelda(ana, '2026-09-10')).toEqual({ tipo: 'vacia' });
    // El turno que pisaba el rango sigue donde estaba.
    expect(celdas.leerCelda(ana, '2026-09-12').tipo).toBe('turnos');
    bd.cerrar();
  });
});

describe('Un solo aviso por operación', () => {
  const RANGO = { inicio: '2026-09-07', fin: '2026-09-13' };

  /** Cuántas veces avisa la operación, sea cual sea el número de celdas que toque. */
  function avisosDe(celdas: AlmacenCeldas, hacer: () => void): number {
    const oyente = jest.fn();
    const darseDeBaja = celdas.suscribirse(oyente);
    hacer();
    darseDeBaja();
    return oyente.mock.calls.length;
  }

  it('marcar un rango de siete días avisa una sola vez', () => {
    const { bd, celdas, ana } = montar();

    expect(avisosDe(celdas, () => celdas.marcarRangoDeVacaciones(ana, RANGO))).toBe(1);

    expect(celdas.leerRangosDeVacaciones(ana)).toEqual([RANGO]);
    bd.cerrar();
  });

  it('eliminar un rango de siete días avisa una sola vez', () => {
    const { bd, celdas, ana } = montar();
    celdas.marcarRangoDeVacaciones(ana, RANGO);

    expect(avisosDe(celdas, () => celdas.eliminarRangoDeVacaciones(ana, RANGO))).toBe(1);
    bd.cerrar();
  });

  it('pegar sobre una celda con dos turnos avisa una sola vez', () => {
    const { bd, celdas, ana, bruno } = montar();
    celdas.crearTurno(bruno, MIERCOLES, h(12), h(16));
    celdas.crearTurno(bruno, MIERCOLES, h(20), h(23));

    const avisos = avisosDe(celdas, () =>
      celdas.pegarEnCelda(bruno, MIERCOLES, {
        tipo: 'turnos',
        turnos: [{ inicio: h(9), fin: h(17) }],
      }),
    );

    expect(avisos).toBe(1);
    expect(celdas.leerCelda(ana, MIERCOLES)).toEqual({ tipo: 'vacia' });
    bd.cerrar();
  });

  it('crear un tercer turno no avisa de nada, porque no cambia nada', () => {
    const { bd, celdas, ana } = montar();
    celdas.crearTurno(ana, LUNES, h(9), h(12));
    celdas.crearTurno(ana, LUNES, h(14), h(18));

    expect(avisosDe(celdas, () => celdas.crearTurno(ana, LUNES, h(20), h(22)))).toBe(0);
    bd.cerrar();
  });
});
