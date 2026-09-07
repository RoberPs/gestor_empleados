import { crearAlmacenEnMemoria } from '../almacenCuadrante';

const h = (horas: number, minutos = 0) => ({ horas, minutos });

const SEMANA_EN_CURSO = { lunes: '2026-09-07' };
const SEMANA_PASADA = { lunes: '2026-08-31' };

describe('Capa de acceso a datos del cuadrante', () => {
  it('una escritura queda reflejada en la lectura siguiente', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();

    datos.crearTurno(ana.id, '2026-09-10', h(9), h(17));

    const celda = datos.leerCelda(ana.id, '2026-09-10');
    expect(celda).toEqual({
      tipo: 'turnos',
      turnos: [{ id: expect.any(String), inicio: h(9), fin: h(17) }],
    });
  });

  it('la plantilla devuelta es siempre la actual, sea cual sea la semana consultada', () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);

    expect([...datos.leerSemana(SEMANA_EN_CURSO).keys()]).toHaveLength(2);
    expect([...datos.leerSemana(SEMANA_PASADA).keys()]).toHaveLength(2);

    datos.altaEmpleado('Carmen');

    expect([...datos.leerSemana(SEMANA_EN_CURSO).keys()]).toHaveLength(3);
    expect([...datos.leerSemana(SEMANA_PASADA).keys()]).toHaveLength(3);
  });

  it('un empleado borrado deja de tener fila también en las semanas pasadas', () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);
    const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;
    datos.crearTurno(bruno.id, '2026-09-01', h(9), h(17));

    datos.borrarEmpleado(bruno.id);

    expect(datos.leerSemana(SEMANA_PASADA).has(bruno.id)).toBe(false);
    expect(datos.leerSemana(SEMANA_EN_CURSO).has(bruno.id)).toBe(false);
  });

  it('la semana leída trae los siete días de cada empleado', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();

    const dias = datos.leerSemana(SEMANA_EN_CURSO).get(ana.id)!;

    expect([...dias.keys()]).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
    expect(dias.get('2026-09-07')).toEqual({ tipo: 'vacia' });
  });

  it('admite un segundo turno el mismo día y lo guarda ordenado por hora de inicio', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();

    datos.crearTurno(ana.id, '2026-09-07', h(20), h(0));
    datos.crearTurno(ana.id, '2026-09-07', h(12), h(16));

    const celda = datos.leerCelda(ana.id, '2026-09-07');
    expect(celda.tipo).toBe('turnos');
    if (celda.tipo !== 'turnos') return;
    expect(celda.turnos.map((t) => t.inicio)).toEqual([h(12), h(20)]);
  });

  it('no guarda un tercer turno el mismo día', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();

    datos.crearTurno(ana.id, '2026-09-07', h(9), h(12));
    datos.crearTurno(ana.id, '2026-09-07', h(14), h(18));
    datos.crearTurno(ana.id, '2026-09-07', h(20), h(22));

    const celda = datos.leerCelda(ana.id, '2026-09-07');
    if (celda.tipo !== 'turnos') throw new Error('la celda debería tener turnos');
    expect(celda.turnos).toHaveLength(2);
  });

  it('edita y elimina cada turno del día por separado', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();
    datos.crearTurno(ana.id, '2026-09-07', h(12), h(16));
    datos.crearTurno(ana.id, '2026-09-07', h(20), h(0));

    const celdaInicial = datos.leerCelda(ana.id, '2026-09-07');
    if (celdaInicial.tipo !== 'turnos') throw new Error('la celda debería tener turnos');
    const [mediodia] = celdaInicial.turnos;

    datos.editarTurno(ana.id, '2026-09-07', mediodia.id, h(12), h(15));
    let celda = datos.leerCelda(ana.id, '2026-09-07');
    if (celda.tipo !== 'turnos') throw new Error('la celda debería tener turnos');
    expect(celda.turnos[0].fin).toEqual(h(15));

    datos.eliminarTurno(ana.id, '2026-09-07', mediodia.id);
    celda = datos.leerCelda(ana.id, '2026-09-07');
    if (celda.tipo !== 'turnos') throw new Error('la celda debería tener turnos');
    expect(celda.turnos).toHaveLength(1);
    expect(celda.turnos[0].inicio).toEqual(h(20));
  });

  it('la celda queda vacía al eliminar el último turno', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();
    datos.crearTurno(ana.id, '2026-09-07', h(9), h(17));
    const celda = datos.leerCelda(ana.id, '2026-09-07');
    if (celda.tipo !== 'turnos') throw new Error('la celda debería tener turnos');

    datos.eliminarTurno(ana.id, '2026-09-07', celda.turnos[0].id);

    expect(datos.leerCelda(ana.id, '2026-09-07')).toEqual({ tipo: 'vacia' });
  });

  it('marca y quita ausencia y vacaciones, que sustituyen a lo que hubiera', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();
    datos.crearTurno(ana.id, '2026-09-08', h(9), h(17));

    datos.marcarVacaciones(ana.id, '2026-09-08');
    expect(datos.leerCelda(ana.id, '2026-09-08')).toEqual({ tipo: 'vacaciones' });

    datos.marcarAusencia(ana.id, '2026-09-08');
    expect(datos.leerCelda(ana.id, '2026-09-08')).toEqual({ tipo: 'ausencia' });

    datos.vaciarCelda(ana.id, '2026-09-08');
    expect(datos.leerCelda(ana.id, '2026-09-08')).toEqual({ tipo: 'vacia' });
  });

  it('avisa a quien esté suscrito de cada cambio', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();
    const oyente = jest.fn();
    const cancelar = datos.suscribirse(oyente);

    datos.crearTurno(ana.id, '2026-09-07', h(9), h(17));
    expect(oyente).toHaveBeenCalled();

    cancelar();
    oyente.mockClear();
    datos.vaciarCelda(ana.id, '2026-09-07');
    expect(oyente).not.toHaveBeenCalled();
  });
});
