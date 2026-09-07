import { ordenarEmpleadosPorNombre } from '../orden';
import type { Empleado } from '../tipos';

const plantilla: Empleado[] = [
  { id: '3', nombre: 'Carmen' },
  { id: '1', nombre: 'Ana' },
  { id: '2', nombre: 'Bruno' },
];

describe('Orden de los empleados en las filas', () => {
  it('Orden alfabético estable entre semanas: la plantilla Ana, Bruno y Carmen aparece siempre en ese orden', () => {
    const semanaActual = ordenarEmpleadosPorNombre(plantilla).map((e) => e.nombre);
    const semanaSiguiente = ordenarEmpleadosPorNombre(plantilla).map((e) => e.nombre);

    expect(semanaActual).toEqual(['Ana', 'Bruno', 'Carmen']);
    expect(semanaSiguiente).toEqual(['Ana', 'Bruno', 'Carmen']);
  });

  it('ordena según el alfabeto español, con la eñe y las tildes en su sitio', () => {
    const nombres = ordenarEmpleadosPorNombre([
      { id: '1', nombre: 'Nuria' },
      { id: '2', nombre: 'Ñuño' },
      { id: '3', nombre: 'Óscar' },
      { id: '4', nombre: 'Olga' },
    ]).map((e) => e.nombre);

    expect(nombres).toEqual(['Nuria', 'Ñuño', 'Olga', 'Óscar']);
  });

  it('no agrupa por ningún otro criterio: devuelve una única lista plana', () => {
    expect(ordenarEmpleadosPorNombre(plantilla)).toHaveLength(plantilla.length);
  });
});
