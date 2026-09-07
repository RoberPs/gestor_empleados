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

describe('La ficha del empleado en la capa de datos', () => {
  it('el alta con nombre, teléfono y email queda reflejada en la lectura siguiente', () => {
    const datos = crearAlmacenEnMemoria();

    const bruno = datos.altaEmpleado('Bruno', '600 11 22 33', 'bruno@ejemplo.es')!;

    expect(datos.leerEmpleado(bruno.id)).toEqual({
      id: bruno.id,
      nombre: 'Bruno',
      // El teléfono se guarda tal y como se teclea: no se le quitan los espacios
      // de dentro ni se le impone ningún formato.
      telefono: '600 11 22 33',
      email: 'bruno@ejemplo.es',
    });
  });

  it('el alta solo con el nombre deja el teléfono y el email sin rellenar', () => {
    const datos = crearAlmacenEnMemoria();

    const carmen = datos.altaEmpleado('Carmen')!;

    expect(carmen.telefono).toBeUndefined();
    expect(carmen.email).toBeUndefined();
  });

  it('un alta con nombre repetido no altera la plantilla', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);

    expect(datos.altaEmpleado('ana')).toBeNull();
    expect(datos.altaEmpleado('  ANA ')).toBeNull();
    expect(datos.altaEmpleado('   ')).toBeNull();

    expect(datos.listarEmpleados().map((e) => e.nombre)).toEqual(['Ana']);
  });

  it('edita cada campo de la ficha por separado, sin tocar los demás', () => {
    const datos = crearAlmacenEnMemoria();
    const bruno = datos.altaEmpleado('Bruno', '600 11 22 33', 'bruno@ejemplo.es')!;

    datos.editarTelefono(bruno.id, '611 22 33 44');
    expect(datos.leerEmpleado(bruno.id)!.telefono).toBe('611 22 33 44');
    expect(datos.leerEmpleado(bruno.id)!.email).toBe('bruno@ejemplo.es');

    datos.editarNota(bruno.id, 'No puede los martes por la tarde');
    expect(datos.leerEmpleado(bruno.id)!.nota).toBe('No puede los martes por la tarde');

    // El teléfono y el email se pueden vaciar.
    datos.editarEmail(bruno.id, '');
    expect(datos.leerEmpleado(bruno.id)!.email).toBeUndefined();
    expect(datos.leerEmpleado(bruno.id)!.nombre).toBe('Bruno');
    expect(datos.leerEmpleado(bruno.id)!.telefono).toBe('611 22 33 44');
  });

  it('el nombre editado respeta la unicidad de la plantilla', () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);
    const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;

    expect(datos.editarNombre(bruno.id, 'ana')).toBe(false);
    expect(datos.editarNombre(bruno.id, '  ')).toBe(false);
    expect(datos.leerEmpleado(bruno.id)!.nombre).toBe('Bruno');

    expect(datos.editarNombre(bruno.id, 'Bruno M.')).toBe(true);
    expect(datos.leerEmpleado(bruno.id)!.nombre).toBe('Bruno M.');
  });

  it('leerEmpleado devuelve null cuando ya no está en la plantilla', () => {
    const datos = crearAlmacenEnMemoria(['Ana']);
    const [ana] = datos.listarEmpleados();

    datos.borrarEmpleado(ana.id);

    expect(datos.leerEmpleado(ana.id)).toBeNull();
  });
});

describe('Las vacaciones por rango en la capa de datos', () => {
  const RANGO = { inicio: '2026-09-10', fin: '2026-09-14' };

  it('marcar el rango deja esos días como vacaciones en el cuadrante', () => {
    const datos = crearAlmacenEnMemoria(['Bruno']);
    const [bruno] = datos.listarEmpleados();

    datos.marcarRangoDeVacaciones(bruno.id, RANGO);

    for (const dia of ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14']) {
      expect(datos.leerCelda(bruno.id, dia)).toEqual({ tipo: 'vacaciones' });
    }
    // Los días de alrededor no se tocan.
    expect(datos.leerCelda(bruno.id, '2026-09-09')).toEqual({ tipo: 'vacia' });
    expect(datos.leerCelda(bruno.id, '2026-09-15')).toEqual({ tipo: 'vacia' });
  });

  it('el recuento de días con turno planificado o ausencia es exacto', () => {
    const datos = crearAlmacenEnMemoria(['Bruno']);
    const [bruno] = datos.listarEmpleados();
    datos.crearTurno(bruno.id, '2026-09-10', h(9), h(17));
    datos.crearTurno(bruno.id, '2026-09-11', h(9), h(17));
    datos.marcarAusencia(bruno.id, '2026-09-13');
    // Los días que ya estaban de vacaciones no cuentan: el rango no les cambia nada.
    datos.marcarVacaciones(bruno.id, '2026-09-14');

    expect(datos.contarDiasConContenido(bruno.id, RANGO)).toBe(3);
    expect(datos.contarDiasConContenido(bruno.id, { inicio: '2026-09-12', fin: '2026-09-12' })).toBe(
      0,
    );
  });

  it('el rango sustituye el turno planificado de los días que pisa', () => {
    const datos = crearAlmacenEnMemoria(['Bruno']);
    const [bruno] = datos.listarEmpleados();
    datos.crearTurno(bruno.id, '2026-09-10', h(9), h(17));

    datos.marcarRangoDeVacaciones(bruno.id, RANGO);

    expect(datos.leerCelda(bruno.id, '2026-09-10')).toEqual({ tipo: 'vacaciones' });
  });

  it('eliminar un rango deja vacías sus celdas en el cuadrante', () => {
    const datos = crearAlmacenEnMemoria(['Bruno']);
    const [bruno] = datos.listarEmpleados();
    datos.marcarRangoDeVacaciones(bruno.id, RANGO);

    datos.eliminarRangoDeVacaciones(bruno.id, RANGO);

    for (const dia of ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14']) {
      expect(datos.leerCelda(bruno.id, dia)).toEqual({ tipo: 'vacia' });
    }
    expect(datos.leerRangosDeVacaciones(bruno.id)).toEqual([]);
  });

  it('los rangos se leen de los días marcados, agrupando los contiguos', () => {
    const datos = crearAlmacenEnMemoria(['Bruno']);
    const [bruno] = datos.listarEmpleados();

    datos.marcarRangoDeVacaciones(bruno.id, { inicio: '2026-09-01', fin: '2026-09-03' });
    datos.marcarRangoDeVacaciones(bruno.id, { inicio: '2026-09-04', fin: '2026-09-06' });
    expect(datos.leerRangosDeVacaciones(bruno.id)).toEqual([
      { inicio: '2026-09-01', fin: '2026-09-06' },
    ]);

    // Quitar las vacaciones de un día suelto parte el rango en dos.
    datos.vaciarCelda(bruno.id, '2026-09-03');
    expect(datos.leerRangosDeVacaciones(bruno.id)).toEqual([
      { inicio: '2026-09-01', fin: '2026-09-02' },
      { inicio: '2026-09-04', fin: '2026-09-06' },
    ]);
  });

  it('los rangos son de cada empleado, no de la plantilla entera', () => {
    const datos = crearAlmacenEnMemoria(['Ana', 'Bruno']);
    const ana = datos.listarEmpleados().find((e) => e.nombre === 'Ana')!;
    const bruno = datos.listarEmpleados().find((e) => e.nombre === 'Bruno')!;

    datos.marcarRangoDeVacaciones(bruno.id, RANGO);

    expect(datos.leerRangosDeVacaciones(ana.id)).toEqual([]);
    expect(datos.leerRangosDeVacaciones(bruno.id)).toEqual([RANGO]);
  });

  it('avisa a quien esté suscrito de cada cambio de la ficha', () => {
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
