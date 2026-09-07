import {
  MOTIVO_NOMBRE_REPETIDO,
  MOTIVO_NOMBRE_VACIO,
  motivoPorElQueElNombreNoSeGuarda,
  sanearCampo,
  sePuedeGuardarElNombre,
} from '../empleado';
import type { Empleado } from '../tipos';

const PLANTILLA: readonly Empleado[] = [
  { id: '1', nombre: 'Ana' },
  { id: '2', nombre: 'Bruno' },
];

describe('Reglas del empleado', () => {
  it('un empleado sin nombre no se guarda', () => {
    expect(motivoPorElQueElNombreNoSeGuarda('', PLANTILLA)).toBe(MOTIVO_NOMBRE_VACIO);
    expect(motivoPorElQueElNombreNoSeGuarda('   ', PLANTILLA)).toBe(MOTIVO_NOMBRE_VACIO);
  });

  it('un nombre que ya existe no se guarda, ignorando mayúsculas y espacios sobrantes', () => {
    expect(motivoPorElQueElNombreNoSeGuarda('ana', PLANTILLA)).toBe(MOTIVO_NOMBRE_REPETIDO);
    expect(motivoPorElQueElNombreNoSeGuarda('  Ana  ', PLANTILLA)).toBe(MOTIVO_NOMBRE_REPETIDO);
    expect(motivoPorElQueElNombreNoSeGuarda('ANA', PLANTILLA)).toBe(MOTIVO_NOMBRE_REPETIDO);
  });

  it('un nombre distinguible del que ya existe sí se guarda', () => {
    expect(sePuedeGuardarElNombre('Ana G.', PLANTILLA)).toBe(true);
    expect(sePuedeGuardarElNombre('Carmen', PLANTILLA)).toBe(true);
  });

  it('al editar, el nombre propio no cuenta como repetido', () => {
    expect(sePuedeGuardarElNombre('ana', PLANTILLA, '1')).toBe(true);
    expect(motivoPorElQueElNombreNoSeGuarda('Bruno', PLANTILLA, '1')).toBe(MOTIVO_NOMBRE_REPETIDO);
  });

  it('los datos de contacto se guardan tal y como se teclean, sin los espacios de los extremos', () => {
    // El formato del teléfono no se toca: `600 11 22 33` se guarda tal cual.
    expect(sanearCampo('600 11 22 33')).toBe('600 11 22 33');
    expect(sanearCampo('  +34 600112233 ')).toBe('+34 600112233');
    expect(sanearCampo(' bruno@ejemplo.es ')).toBe('bruno@ejemplo.es');
    expect(sanearCampo('   ')).toBe('');
  });
});
