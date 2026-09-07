import {
  desplazarSemanas,
  diasDeLaSemana,
  domingoDe,
  esLaMismaSemana,
  semanaAnterior,
  semanaEnCurso,
  semanaQueContiene,
  semanaSiguiente,
} from '../semana';

describe('Semana de lunes a domingo', () => {
  it('Abrir la app un día cualquiera de la semana: la semana es la del lunes anterior al domingo siguiente', () => {
    // Miércoles 9 de septiembre de 2026.
    const semana = semanaQueContiene('2026-09-09');

    expect(semana.lunes).toBe('2026-09-07');
    expect(domingoDe(semana)).toBe('2026-09-13');
  });

  it('Abrir la app en domingo: la semana es la que termina en ese domingo', () => {
    // Domingo 13 de septiembre de 2026.
    const semana = semanaQueContiene('2026-09-13');

    expect(semana.lunes).toBe('2026-09-07');
    expect(domingoDe(semana)).toBe('2026-09-13');
    // No es la semana que empieza al día siguiente.
    expect(semana.lunes).not.toBe('2026-09-14');
  });

  it('un lunes pertenece a la semana que empieza ese mismo día', () => {
    expect(semanaQueContiene('2026-09-07').lunes).toBe('2026-09-07');
  });

  it('la semana tiene siete días, de lunes a domingo en ese orden', () => {
    expect(diasDeLaSemana({ lunes: '2026-09-07' })).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ]);
  });

  it('el desplazamiento es de exactamente siete días en cada sentido', () => {
    const semana = { lunes: '2026-09-07' };

    expect(semanaSiguiente(semana).lunes).toBe('2026-09-14');
    expect(semanaAnterior(semana).lunes).toBe('2026-08-31');
  });

  it('el desplazamiento cruza el cambio de mes y de año sin límite', () => {
    expect(desplazarSemanas({ lunes: '2026-12-28' }, 1).lunes).toBe('2027-01-04');
    expect(desplazarSemanas({ lunes: '2026-09-07' }, 5).lunes).toBe('2026-10-12');
    expect(desplazarSemanas({ lunes: '2026-09-07' }, -52).lunes).toBe('2025-09-08');
  });

  it('la semana en curso se calcula a partir de la fecha del dispositivo en hora local', () => {
    // 9 de septiembre de 2026 a las 23:30 en hora local del dispositivo.
    const semana = semanaEnCurso(new Date(2026, 8, 9, 23, 30));

    expect(esLaMismaSemana(semana, { lunes: '2026-09-07' })).toBe(true);
  });
});
