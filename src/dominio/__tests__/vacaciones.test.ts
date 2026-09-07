import {
  agruparEnRangos,
  diasDelRango,
  formatearRango,
  sePuedeGuardarElRango,
} from '../vacaciones';

describe('Vacaciones por rango de fechas', () => {
  it('expande un rango a sus días naturales, inicio y fin incluidos', () => {
    expect(diasDelRango({ inicio: '2026-09-10', fin: '2026-09-14' })).toEqual([
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
    ]);
  });

  it('expande un rango que cruza el cambio de mes', () => {
    expect(diasDelRango({ inicio: '2026-08-31', fin: '2026-09-02' })).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
    ]);
  });

  it('Dos rangos contiguos se muestran como uno solo', () => {
    // El encargado añade 01/09 - 03/09 y después 04/09 - 06/09: en el cuadrante
    // son seis días seguidos de vacaciones, y la ficha los presenta como uno.
    const dias = [
      ...diasDelRango({ inicio: '2026-09-01', fin: '2026-09-03' }),
      ...diasDelRango({ inicio: '2026-09-04', fin: '2026-09-06' }),
    ];

    const rangos = agruparEnRangos(dias);

    expect(rangos).toEqual([{ inicio: '2026-09-01', fin: '2026-09-06' }]);
    expect(formatearRango(rangos[0])).toBe('01/09/2026 - 06/09/2026');
  });

  it('Quitar las vacaciones de un día desde el cuadrante parte el rango', () => {
    const dias = diasDelRango({ inicio: '2026-09-10', fin: '2026-09-14' }).filter(
      (dia) => dia !== '2026-09-12',
    );

    expect(agruparEnRangos(dias)).toEqual([
      { inicio: '2026-09-10', fin: '2026-09-11' },
      { inicio: '2026-09-13', fin: '2026-09-14' },
    ]);
  });

  it('agrupa días desordenados y repetidos sin duplicar rangos', () => {
    expect(agruparEnRangos(['2026-09-11', '2026-09-10', '2026-09-11'])).toEqual([
      { inicio: '2026-09-10', fin: '2026-09-11' },
    ]);
  });

  it('sin ningún día marcado no hay ningún rango', () => {
    expect(agruparEnRangos([])).toEqual([]);
  });

  it('Un rango de un solo día', () => {
    const rango = { inicio: '2026-09-10', fin: '2026-09-10' };

    expect(sePuedeGuardarElRango(rango)).toBe(true);
    expect(diasDelRango(rango)).toEqual(['2026-09-10']);
    expect(formatearRango(rango)).toBe('10/09/2026 - 10/09/2026');
  });

  it('Un rango cuyo fin es anterior a su inicio no se guarda', () => {
    expect(sePuedeGuardarElRango({ inicio: '2026-09-14', fin: '2026-09-10' })).toBe(false);
    // Al corregir la fecha de fin, el rango ya se puede guardar.
    expect(sePuedeGuardarElRango({ inicio: '2026-09-14', fin: '2026-09-18' })).toBe(true);
  });
});
