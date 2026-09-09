/**
 * Pegar en una celda, en la capa de datos.
 *
 * Se comprueba contra las **dos** implementaciones que la app compone: la de memoria
 * que inyectan los tests de pantalla y la que la app usa sobre SQLite. Ya no guardan
 * las celdas en el mismo sitio —una en un `Map`, la otra en la base de datos—, y
 * justo por eso este fichero vale para las dos: lo que afirma es el comportamiento
 * de la interfaz, que no cambia con lo que haya debajo.
 */

import {
  crearAlmacenEnMemoria,
  crearAlmacenSobreSqlite,
  type AlmacenCuadrante,
} from '../almacenCuadrante';
import { paraCopiar } from '../../dominio/copia';
import { migrar } from '../sqlite/migraciones';
import { abrirConNodeSqlite } from '../../pruebas/bdDePrueba';

const h = (horas: number, minutos = 0) => ({ horas, minutos });

const LUNES = '2026-09-07';
const MARTES = '2026-09-08';

/** Lo copiado de una celda, tal y como lo obtiene la pantalla. */
function copiarDe(datos: AlmacenCuadrante, id: string, dia: string) {
  const copiado = paraCopiar(datos.leerCelda(id, dia));
  if (!copiado) throw new Error('Esa celda no tiene nada que copiar');
  return copiado;
}

const implementaciones: [string, (plantilla: readonly string[]) => AlmacenCuadrante][] = [
  ['en memoria', (plantilla) => crearAlmacenEnMemoria(plantilla)],
  [
    'sobre SQLite',
    (plantilla) => {
      const bd = abrirConNodeSqlite(':memory:');
      migrar(bd);
      const datos = crearAlmacenSobreSqlite(bd);
      for (const nombre of plantilla) datos.altaEmpleado(nombre);
      return datos;
    },
  ],
];

describe.each(implementaciones)('Pegar en una celda (%s)', (_nombre, crear) => {
  const conPlantilla = (plantilla: readonly string[] = ['Ana', 'Bruno']) => {
    const datos = crear(plantilla);
    const idDe = (nombre: string) => datos.listarEmpleados().find((e) => e.nombre === nombre)!.id;
    return { datos, idDe };
  };

  it('pegar sobre una celda con dos turnos deja exactamente el contenido copiado', () => {
    const { datos, idDe } = conPlantilla();
    datos.marcarVacaciones(idDe('Ana'), LUNES);
    datos.crearTurno(idDe('Bruno'), MARTES, h(12), h(16));
    datos.crearTurno(idDe('Bruno'), MARTES, h(20), h(23));

    datos.pegarEnCelda(idDe('Bruno'), MARTES, copiarDe(datos, idDe('Ana'), LUNES));

    expect(datos.leerCelda(idDe('Bruno'), MARTES)).toEqual({ tipo: 'vacaciones' });
  });

  it('pegar dos turnos los deja los dos, ordenados por hora de inicio', () => {
    const { datos, idDe } = conPlantilla();
    datos.crearTurno(idDe('Ana'), LUNES, h(20), h(0));
    datos.crearTurno(idDe('Ana'), LUNES, h(12), h(16));

    datos.pegarEnCelda(idDe('Bruno'), MARTES, copiarDe(datos, idDe('Ana'), LUNES));

    expect(datos.leerCelda(idDe('Bruno'), MARTES)).toEqual({
      tipo: 'turnos',
      turnos: [
        { id: expect.any(String), inicio: h(12), fin: h(16) },
        { id: expect.any(String), inicio: h(20), fin: h(0) },
      ],
    });
  });

  it('pegar una ausencia sobre una celda vacía la marca como ausencia', () => {
    const { datos, idDe } = conPlantilla();
    datos.marcarAusencia(idDe('Ana'), LUNES);

    datos.pegarEnCelda(idDe('Bruno'), MARTES, copiarDe(datos, idDe('Ana'), LUNES));

    expect(datos.leerCelda(idDe('Bruno'), MARTES)).toEqual({ tipo: 'ausencia' });
  });

  it('avisa a los suscriptores una sola vez, con la celda ya entera', () => {
    const { datos, idDe } = conPlantilla();
    datos.marcarVacaciones(idDe('Ana'), LUNES);
    datos.crearTurno(idDe('Bruno'), MARTES, h(12), h(16));
    datos.crearTurno(idDe('Bruno'), MARTES, h(20), h(23));
    const copiado = copiarDe(datos, idDe('Ana'), LUNES);

    // El oyente mira la celda cada vez que le avisan: si la operación fuera varias
    // escrituras sueltas, aquí se vería la celda a medio hacer.
    const vistas: unknown[] = [];
    const darseDeBaja = datos.suscribirse(() => vistas.push(datos.leerCelda(idDe('Bruno'), MARTES)));

    datos.pegarEnCelda(idDe('Bruno'), MARTES, copiado);
    darseDeBaja();

    expect(vistas).toEqual([{ tipo: 'vacaciones' }]);
  });

  it('pegar crea turnos nuevos y no reutiliza los del origen', () => {
    const { datos, idDe } = conPlantilla();
    datos.crearTurno(idDe('Ana'), LUNES, h(9), h(17));
    const origen = datos.leerCelda(idDe('Ana'), LUNES);

    datos.pegarEnCelda(idDe('Bruno'), MARTES, copiarDe(datos, idDe('Ana'), LUNES));

    const destino = datos.leerCelda(idDe('Bruno'), MARTES);
    if (origen.tipo !== 'turnos' || destino.tipo !== 'turnos') throw new Error('No hay turnos');
    expect(destino.turnos[0].id).not.toEqual(origen.turnos[0].id);
    // Y la celda de origen se queda exactamente como estaba.
    expect(datos.leerCelda(idDe('Ana'), LUNES)).toEqual(origen);
  });

  it('editar el turno pegado no toca el de la celda de origen', () => {
    const { datos, idDe } = conPlantilla();
    datos.crearTurno(idDe('Ana'), LUNES, h(9), h(17));
    datos.pegarEnCelda(idDe('Bruno'), MARTES, copiarDe(datos, idDe('Ana'), LUNES));

    const destino = datos.leerCelda(idDe('Bruno'), MARTES);
    if (destino.tipo !== 'turnos') throw new Error('No hay turnos');
    datos.editarTurno(idDe('Bruno'), MARTES, destino.turnos[0].id, h(10), h(14));

    expect(datos.leerCelda(idDe('Ana'), LUNES)).toEqual({
      tipo: 'turnos',
      turnos: [{ id: expect.any(String), inicio: h(9), fin: h(17) }],
    });
  });

  it('pegar tantas veces como haga falta deja todas las celdas iguales', () => {
    const { datos, idDe } = conPlantilla();
    datos.crearTurno(idDe('Ana'), LUNES, h(9), h(17));
    const copiado = copiarDe(datos, idDe('Ana'), LUNES);

    for (const dia of ['2026-09-09', '2026-09-10', '2026-09-11']) {
      datos.pegarEnCelda(idDe('Bruno'), dia, copiado);
    }

    for (const dia of ['2026-09-09', '2026-09-10', '2026-09-11']) {
      expect(datos.leerCelda(idDe('Bruno'), dia)).toEqual({
        tipo: 'turnos',
        turnos: [{ id: expect.any(String), inicio: h(9), fin: h(17) }],
      });
    }
  });
});
