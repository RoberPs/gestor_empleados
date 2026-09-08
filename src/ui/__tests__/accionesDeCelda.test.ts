import type { ContenidoCelda } from '../../dominio/tipos';
import { accionesPara, etiquetaDeAccion } from '../accionesDeCelda';

const turnoManana = { id: 'a', inicio: { horas: 12, minutos: 0 }, fin: { horas: 16, minutos: 0 } };
const turnoTarde = { id: 'b', inicio: { horas: 20, minutos: 0 }, fin: { horas: 0, minutos: 0 } };

const vacia: ContenidoCelda = { tipo: 'vacia' };
const unTurno: ContenidoCelda = { tipo: 'turnos', turnos: [turnoManana] };
const dosTurnos: ContenidoCelda = { tipo: 'turnos', turnos: [turnoManana, turnoTarde] };
const ausencia: ContenidoCelda = { tipo: 'ausencia' };
const vacaciones: ContenidoCelda = { tipo: 'vacaciones' };

const tipos = (contenido: ContenidoCelda) => accionesPara(contenido).map((a) => a.tipo);

describe('Acciones que ofrece cada estado de la celda', () => {
  it('sobre una celda vacía: crear turno planificado, marcar ausencia y marcar vacaciones', () => {
    expect(tipos(vacia)).toEqual(['crear-turno', 'marcar-ausencia', 'marcar-vacaciones']);
  });

  it('sobre una celda con un turno: editar, añadir un segundo, sustituir por ausencia o vacaciones y eliminar', () => {
    expect(tipos(unTurno)).toEqual([
      'editar-turno',
      'anadir-segundo-turno',
      'marcar-ausencia',
      'marcar-vacaciones',
      'eliminar-turno',
    ]);
  });

  it('sobre una celda con dos turnos: editar y eliminar cada uno por separado, y ningún tercer turno', () => {
    const acciones = accionesPara(dosTurnos);

    expect(tipos(dosTurnos)).not.toContain('anadir-segundo-turno');
    expect(acciones.filter((a) => a.tipo === 'editar-turno')).toHaveLength(2);
    expect(acciones.filter((a) => a.tipo === 'eliminar-turno')).toHaveLength(2);
    expect(tipos(dosTurnos)).toContain('marcar-ausencia');
    expect(tipos(dosTurnos)).toContain('marcar-vacaciones');
  });

  it('sobre una celda con ausencia: ver la ausencia, cambiar a vacaciones, sustituir por turno planificado y eliminarla', () => {
    expect(tipos(ausencia)).toEqual([
      'ver-ausencia',
      'marcar-vacaciones',
      'crear-turno',
      'eliminar-contenido',
    ]);
  });

  it('ver la ausencia solo se ofrece sobre una celda de ausencia', () => {
    // Las acciones de una celda de vacaciones no han cambiado, ni las de las demás.
    for (const contenido of [vacia, unTurno, dosTurnos, vacaciones]) {
      expect(tipos(contenido)).not.toContain('ver-ausencia');
    }
  });

  it('sobre una celda con vacaciones: cambiar a ausencia, sustituir por turno planificado y eliminarlas', () => {
    expect(tipos(vacaciones)).toEqual(['marcar-ausencia', 'crear-turno', 'eliminar-contenido']);
  });

  it('las acciones usan siempre las palabras completas, nunca AUS ni VAC', () => {
    for (const contenido of [vacia, unTurno, dosTurnos, ausencia, vacaciones]) {
      for (const accion of accionesPara(contenido)) {
        const etiqueta = etiquetaDeAccion(accion, contenido);
        expect(etiqueta).not.toMatch(/\bAUS\b/);
        expect(etiqueta).not.toMatch(/\bVAC\b/);
      }
    }

    expect(etiquetaDeAccion({ tipo: 'marcar-ausencia' }, vacia)).toBe('Marcar ausencia');
    expect(etiquetaDeAccion({ tipo: 'marcar-vacaciones' }, vacia)).toBe('Marcar vacaciones');
    expect(etiquetaDeAccion({ tipo: 'marcar-ausencia' }, vacaciones)).toBe('Cambiar a ausencia');
    expect(etiquetaDeAccion({ tipo: 'marcar-vacaciones' }, ausencia)).toBe('Cambiar a vacaciones');
    expect(etiquetaDeAccion({ tipo: 'ver-ausencia' }, ausencia)).toBe('Ver la ausencia');
  });

  it('las acciones sobre un turno nombran sus horas completas, en 24h', () => {
    expect(etiquetaDeAccion({ tipo: 'editar-turno', turno: turnoTarde }, dosTurnos)).toBe(
      'Editar el turno de 20:00 a 00:00',
    );
    expect(etiquetaDeAccion({ tipo: 'eliminar-turno', turno: turnoManana }, dosTurnos)).toBe(
      'Eliminar el turno de 12:00 a 16:00',
    );
  });
});
