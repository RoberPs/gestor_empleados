import {
  analizarHora,
  formatearFecha,
  formatearHora,
  formatearRangoDeSemana,
  nombreDeDia,
  NOMBRES_DE_DIA,
} from '../formatos';

describe('Formatos de la pantalla', () => {
  it('Rango de fechas de la semana visible: la semana del 7 al 13 de septiembre de 2026 se muestra como 07/09/2026 - 13/09/2026', () => {
    expect(formatearRangoDeSemana({ lunes: '2026-09-07' })).toBe('07/09/2026 - 13/09/2026');
  });

  it('las fechas se muestran como dd/mm/aaaa', () => {
    expect(formatearFecha('2026-09-07')).toBe('07/09/2026');
    expect(formatearFecha('2026-12-31')).toBe('31/12/2026');
  });

  it('las horas se muestran en formato 24h, por ejemplo 21:00 y nunca 9:00 PM', () => {
    expect(formatearHora({ horas: 21, minutos: 0 })).toBe('21:00');
    expect(formatearHora({ horas: 9, minutos: 0 })).toBe('09:00');
    expect(formatearHora({ horas: 0, minutos: 0 })).toBe('00:00');
    expect(formatearHora({ horas: 2, minutos: 5 })).toBe('02:05');
  });

  it('la primera columna es el lunes y la última el domingo', () => {
    expect(NOMBRES_DE_DIA[0]).toBe('Lunes');
    expect(NOMBRES_DE_DIA[6]).toBe('Domingo');
    expect(nombreDeDia('2026-09-07')).toBe('Lunes');
    expect(nombreDeDia('2026-09-13')).toBe('Domingo');
  });

  it('los nombres de día se escriben completos, sin abreviar', () => {
    expect(NOMBRES_DE_DIA).toEqual([
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
    ]);
  });

  it('lee las horas que el encargado escribe en formato 24h', () => {
    expect(analizarHora('09:00')).toEqual({ horas: 9, minutos: 0 });
    expect(analizarHora('23:59')).toEqual({ horas: 23, minutos: 59 });
    expect(analizarHora('9:00')).toEqual({ horas: 9, minutos: 0 });
  });

  it('admite media hora y cualquier minuto, no solo horas en punto', () => {
    expect(analizarHora('09:30')).toEqual({ horas: 9, minutos: 30 });
    expect(analizarHora('9:30')).toEqual({ horas: 9, minutos: 30 });
    expect(analizarHora('13:45')).toEqual({ horas: 13, minutos: 45 });
    expect(analizarHora('09:05')).toEqual({ horas: 9, minutos: 5 });
    expect(analizarHora('9:5')).toEqual({ horas: 9, minutos: 5 });
  });

  it('admite las formas naturales de teclear una hora con el teclado numérico', () => {
    // Con el separador que salga en el teclado del móvil.
    expect(analizarHora('9.30')).toEqual({ horas: 9, minutos: 30 });
    expect(analizarHora('9,30')).toEqual({ horas: 9, minutos: 30 });
    expect(analizarHora('9h30')).toEqual({ horas: 9, minutos: 30 });

    // Sin separador ninguno.
    expect(analizarHora('930')).toEqual({ horas: 9, minutos: 30 });
    expect(analizarHora('0930')).toEqual({ horas: 9, minutos: 30 });
    expect(analizarHora('2015')).toEqual({ horas: 20, minutos: 15 });

    // La hora en punto, con solo teclear la hora.
    expect(analizarHora('9')).toEqual({ horas: 9, minutos: 0 });
    expect(analizarHora('09')).toEqual({ horas: 9, minutos: 0 });
    expect(analizarHora('20')).toEqual({ horas: 20, minutos: 0 });
    expect(analizarHora('0')).toEqual({ horas: 0, minutos: 0 });

    // Los espacios sobrantes no estorban.
    expect(analizarHora(' 9 : 30 ')).toEqual({ horas: 9, minutos: 30 });
  });

  it('rechaza lo que no es una hora válida del día', () => {
    expect(analizarHora('24:00')).toBeNull();
    expect(analizarHora('09:60')).toBeNull();
    expect(analizarHora('2460')).toBeNull();
    expect(analizarHora('25')).toBeNull();
    expect(analizarHora('9 PM')).toBeNull();
    expect(analizarHora('mediodía')).toBeNull();
    expect(analizarHora('12345')).toBeNull();
    expect(analizarHora('')).toBeNull();
  });
});
