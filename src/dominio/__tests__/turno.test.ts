import { clasificarTurno, describirTurno, ordenarPorHoraDeInicio, sePuedeGuardar } from '../turno';

const h = (horas: number, minutos = 0) => ({ horas, minutos });

describe('Clasificación de un turno planificado', () => {
  it('un turno que acaba después de empezar es un turno normal', () => {
    expect(clasificarTurno(h(9), h(17))).toBe('normal');
  });

  it('una hora de fin anterior a la de inicio se acepta: es un turno que cruza la medianoche', () => {
    expect(clasificarTurno(h(20), h(2))).toBe('cruza-medianoche');
    expect(sePuedeGuardar(h(20), h(2))).toBe(true);
  });

  it('un turno cuyo fin coincide con su inicio tiene duración nula y no se puede guardar', () => {
    expect(clasificarTurno(h(9), h(9))).toBe('duracion-nula');
    expect(sePuedeGuardar(h(9), h(9))).toBe(false);
  });

  it('un turno que termina a las 00:00 cruza la medianoche', () => {
    expect(clasificarTurno(h(20), h(0))).toBe('cruza-medianoche');
  });

  it('los turnos de un día se ordenan por hora de inicio ascendente', () => {
    const tarde = { id: 'b', inicio: h(20), fin: h(0) };
    const mediodia = { id: 'a', inicio: h(12), fin: h(16) };

    expect(ordenarPorHoraDeInicio([tarde, mediodia]).map((t) => t.id)).toEqual(['a', 'b']);
    expect(ordenarPorHoraDeInicio([mediodia, tarde]).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('describe el turno con las horas completas, sin abreviar', () => {
    expect(describirTurno({ id: 'a', inicio: h(9), fin: h(17) })).toBe('09:00 a 17:00');
  });
});
