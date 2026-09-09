/**
 * El cuadrante contra SQLite de verdad, cerrando y reabriendo la app.
 *
 * Cada test abre el almacenamiento sobre un fichero temporal, escribe, y lo vuelve a
 * abrir sobre el mismo fichero: es lo que reproduce cerrar la app y abrirla de nuevo
 * desde su icono, y lo único con lo que los escenarios de durabilidad del cuadrante
 * significan algo. `abrirAlmacenamiento` es exactamente lo que la app hace al
 * arrancar, antes de pintar nada, y compone el almacén de cero sobre lo que haya en
 * el fichero: de la apertura anterior no queda nada en memoria.
 *
 * La pantalla se pinta **una sola vez y al final**, ya sobre la última apertura: es
 * la rejilla que vería el encargado al volver, que es donde la spec dice qué muestra
 * cada celda.
 *
 * Los escenarios de la plantilla están en `arranqueDeLaApp.test.tsx`; aquí solo los
 * del cuadrante.
 */

import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { almacen } from '../../datos/almacenCuadrante';
import { abrirAlmacenamiento } from '../../datos/arranque';
import { ETIQUETA_AUSENCIA, ETIQUETA_VACACIONES, type IdEmpleado } from '../../dominio/tipos';
import { abrirConNodeSqlite, rutaDeFicheroDePrueba } from '../../pruebas/bdDePrueba';
import { ConAreaSegura, hora } from '../../pruebas/ayudas';
import { ArranqueDeLaApp } from '../ArranqueDeLaApp';
import { PantallaCuadrante } from '../PantallaCuadrante';

/** Miércoles 9 de septiembre de 2026: la semana 07/09/2026 - 13/09/2026. */
const MIERCOLES_A_LAS_DIEZ = new Date(2026, 8, 9, 10, 0);

const LUNES = '2026-09-07';
const MARTES = '2026-09-08';
const MIERCOLES = '2026-09-09';
const JUEVES = '2026-09-10';
const VIERNES = '2026-09-11';
const SABADO = '2026-09-12';
const DOMINGO = '2026-09-13';

const ETIQUETA_AUS = new RegExp(ETIQUETA_AUSENCIA);
const ETIQUETA_VAC = new RegExp(ETIQUETA_VACACIONES);

/** Abre el almacenamiento igual que hace la app al arrancar, sin pintar nada. */
function abrirLosDatos(fichero: string): void {
  expect(abrirAlmacenamiento(abrirConNodeSqlite, fichero)).toBe(true);
}

/** La app entera, ya arrancada, sobre lo que el fichero guarde en este momento. */
async function pintarElCuadrante(fichero: string): Promise<void> {
  await render(
    <ArranqueDeLaApp abrirFichero={abrirConNodeSqlite} nombreDelFichero={fichero}>
      <ConAreaSegura>
        <PantallaCuadrante reloj={() => MIERCOLES_A_LAS_DIEZ} />
      </ConAreaSegura>
    </ArranqueDeLaApp>,
  );
}

/** La celda que se ve en la rejilla para ese empleado y ese día. */
function celda(id: IdEmpleado, dia: string) {
  return screen.getByTestId(`celda-${id}-${dia}`);
}

function esVacia(id: IdEmpleado, dia: string): boolean {
  return within(celda(id, dia)).queryByTestId('celda-vacia') !== null;
}

/** El identificador del empleado que se llama así. Falla si no está. */
function idDe(nombre: string): IdEmpleado {
  const encontrado = almacen()
    .listarEmpleados()
    .find((empleado) => empleado.nombre === nombre);
  if (!encontrado) throw new Error(`No hay ningún empleado llamado ${nombre}`);
  return encontrado.id;
}

function darDeAlta(...nombres: readonly string[]): void {
  for (const nombre of nombres) almacen().altaEmpleado(nombre);
}

async function tocar(testID: string) {
  await fireEvent.press(screen.getByTestId(testID));
}

describe('El cuadrante sobrevive al cierre de la app', () => {
  it('Un turno planificado sigue en su celda tras reabrir la app', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Bruno');
    almacen().crearTurno(idDe('Bruno'), JUEVES, hora(9), hora(17));

    await pintarElCuadrante(fichero);

    expect(celda(idDe('Bruno'), JUEVES)).toHaveTextContent(/09:00/);
    expect(celda(idDe('Bruno'), JUEVES)).toHaveTextContent(/17:00/);
  });

  it('Un día con dos turnos sobrevive entero', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana');
    almacen().crearTurno(idDe('Ana'), LUNES, hora(12), hora(16));
    almacen().crearTurno(idDe('Ana'), LUNES, hora(20), hora(0));

    await pintarElCuadrante(fichero);

    const lunes = celda(idDe('Ana'), LUNES);
    expect(lunes).toHaveTextContent(/12:00/);
    expect(lunes).toHaveTextContent(/16:00/);
    expect(lunes).toHaveTextContent(/20:00/);
    expect(lunes).toHaveTextContent(/00:00/);
    // Y en orden de hora de inicio ascendente: el de mediodía antes que el de noche.
    expect(lunes).toHaveTextContent(/12:00.*20:00/);
  });

  it('Un turno que cruza la medianoche sobrevive en el día en que empieza', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Bruno');
    almacen().crearTurno(idDe('Bruno'), VIERNES, hora(20), hora(2));

    await pintarElCuadrante(fichero);

    expect(celda(idDe('Bruno'), VIERNES)).toHaveTextContent(/20:00/);
    expect(celda(idDe('Bruno'), VIERNES)).toHaveTextContent(/02:00/);
    // El sábado no se entera: el turno es del día en que empieza.
    expect(esVacia(idDe('Bruno'), SABADO)).toBe(true);
  });

  it('Una ausencia sobrevive al cierre', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Bruno');
    almacen().marcarAusencia(idDe('Bruno'), MARTES);

    await pintarElCuadrante(fichero);

    expect(celda(idDe('Bruno'), MARTES)).toHaveTextContent(ETIQUETA_AUS);
  });

  it('Unas vacaciones sobreviven al cierre', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Carmen');
    // Del 14 al 20: la semana siguiente a la que se ve al abrir.
    almacen().marcarRangoDeVacaciones(idDe('Carmen'), { inicio: '2026-09-14', fin: '2026-09-20' });

    await pintarElCuadrante(fichero);
    await tocar('accion-semana-siguiente');

    for (const dia of [
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ]) {
      expect(celda(idDe('Carmen'), dia)).toHaveTextContent(ETIQUETA_VAC);
    }
  });

  it('Una celda vaciada sigue vacía tras reabrir', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana');
    almacen().crearTurno(idDe('Ana'), MIERCOLES, hora(9), hora(17));
    almacen().vaciarCelda(idDe('Ana'), MIERCOLES);

    await pintarElCuadrante(fichero);

    expect(esVacia(idDe('Ana'), MIERCOLES)).toBe(true);
    expect(celda(idDe('Ana'), MIERCOLES)).not.toHaveTextContent(/09:00/);
  });

  it('El cuadrante entero sobrevive a varias reaperturas', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana', 'Bruno', 'Carmen');
    almacen().crearTurno(idDe('Ana'), LUNES, hora(9), hora(17));
    almacen().crearTurno(idDe('Ana'), LUNES, hora(20), hora(23));
    almacen().marcarAusencia(idDe('Bruno'), MARTES);
    almacen().marcarRangoDeVacaciones(idDe('Carmen'), { inicio: MIERCOLES, fin: VIERNES });
    const antes = almacen().leerSemana({ lunes: LUNES });

    abrirLosDatos(fichero);
    abrirLosDatos(fichero);
    await pintarElCuadrante(fichero);

    // Exactamente el mismo contenido, celda a celda, identificadores de turno
    // incluidos: nada se ha movido de sitio por el camino.
    expect(almacen().leerSemana({ lunes: LUNES })).toEqual(antes);
    expect(celda(idDe('Ana'), LUNES)).toHaveTextContent(/09:00/);
    expect(celda(idDe('Bruno'), MARTES)).toHaveTextContent(ETIQUETA_AUS);
    expect(celda(idDe('Carmen'), MIERCOLES)).toHaveTextContent(ETIQUETA_VAC);
  });
});

describe('Se conserva el cuadrante de cualquier semana', () => {
  it('Una semana pasada sigue planificada', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana');
    almacen().crearTurno(idDe('Ana'), LUNES, hora(9), hora(17));

    await pintarElCuadrante(fichero);
    // El encargado se desplaza a otra semana y vuelve a la que había planificado.
    await tocar('accion-semana-siguiente');
    await tocar('accion-semana-anterior');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('07/09/2026 - 13/09/2026');
    expect(celda(idDe('Ana'), LUNES)).toHaveTextContent(/09:00/);
    expect(celda(idDe('Ana'), LUNES)).toHaveTextContent(/17:00/);
  });

  it('Una semana futura sigue planificada', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana');
    // La semana 21/09/2026 - 27/09/2026, dos por delante de la que se ve al abrir.
    almacen().crearTurno(idDe('Ana'), '2026-09-21', hora(9), hora(17));

    await pintarElCuadrante(fichero);
    await tocar('accion-semana-siguiente');
    await tocar('accion-semana-siguiente');

    expect(screen.getByTestId('rango-de-la-semana')).toHaveTextContent('21/09/2026 - 27/09/2026');
    expect(celda(idDe('Ana'), '2026-09-21')).toHaveTextContent(/09:00/);
  });

  it('Planificar una semana no borra las demás', () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana');
    const tresSemanas = ['2026-08-31', LUNES, '2026-09-14'];
    for (const dia of tresSemanas) almacen().crearTurno(idDe('Ana'), dia, hora(9), hora(17));

    // Y una cuarta semana, después de las otras tres.
    almacen().crearTurno(idDe('Ana'), '2026-09-21', hora(12), hora(16));
    abrirLosDatos(fichero);

    for (const dia of tresSemanas) {
      expect(almacen().leerCelda(idDe('Ana'), dia)).toEqual({
        tipo: 'turnos',
        turnos: [{ id: expect.any(String), inicio: hora(9), fin: hora(17) }],
      });
    }
    expect(almacen().leerCelda(idDe('Ana'), '2026-09-21')).toEqual({
      tipo: 'turnos',
      turnos: [{ id: expect.any(String), inicio: hora(12), fin: hora(16) }],
    });
  });
});

describe('Toda escritura del cuadrante queda reflejada en la lectura siguiente', () => {
  it('Sustituir el contenido de una celda', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana');
    almacen().crearTurno(idDe('Ana'), LUNES, hora(9), hora(17));

    almacen().marcarVacaciones(idDe('Ana'), LUNES);
    await pintarElCuadrante(fichero);

    expect(celda(idDe('Ana'), LUNES)).toHaveTextContent(ETIQUETA_VAC);
    // Ni rastro del turno que había: ni en la celda ni en lo guardado.
    expect(celda(idDe('Ana'), LUNES)).not.toHaveTextContent(/09:00/);
    expect(almacen().leerCelda(idDe('Ana'), LUNES)).toEqual({ tipo: 'vacaciones' });
  });

  it('Lo pegado en una celda se conserva', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana', 'Carmen');
    almacen().crearTurno(idDe('Ana'), LUNES, hora(9), hora(17));

    // Lo que se copia de la celda de Ana, pegado en la de Carmen del sábado.
    almacen().pegarEnCelda(idDe('Carmen'), SABADO, {
      tipo: 'turnos',
      turnos: [{ inicio: hora(9), fin: hora(17) }],
    });
    await pintarElCuadrante(fichero);

    expect(celda(idDe('Carmen'), SABADO)).toHaveTextContent(/09:00/);
    expect(celda(idDe('Carmen'), SABADO)).toHaveTextContent(/17:00/);
  });
});

describe('La baja de un empleado no deja nada suyo en el cuadrante', () => {
  it('Dar de baja borra lo planificado del empleado', () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Bruno');
    const bruno = idDe('Bruno');
    almacen().crearTurno(bruno, '2026-08-31', hora(9), hora(17));
    almacen().crearTurno(bruno, LUNES, hora(20), hora(23));
    almacen().marcarAusencia(bruno, MARTES);
    almacen().marcarRangoDeVacaciones(bruno, { inicio: '2026-09-14', fin: '2026-09-18' });

    almacen().borrarEmpleado(bruno);
    abrirLosDatos(fichero);

    // De punta a punta: ni fila en `celdas` ni fila en `turnos`. Lo hace la cascada
    // del esquema, no un recorrido semana por semana.
    const bd = abrirConNodeSqlite(fichero);
    expect(bd.leer('SELECT * FROM celdas')).toEqual([]);
    expect(bd.leer('SELECT * FROM turnos')).toEqual([]);
    bd.cerrar();
    for (const lunes of ['2026-08-31', LUNES, '2026-09-14']) {
      expect(almacen().leerSemana({ lunes }).has(bruno)).toBe(false);
    }
  });

  it('La baja de uno no toca el cuadrante de los demás', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana', 'Bruno', 'Carmen');
    almacen().crearTurno(idDe('Ana'), LUNES, hora(9), hora(17));
    almacen().crearTurno(idDe('Bruno'), LUNES, hora(12), hora(16));
    almacen().marcarVacaciones(idDe('Carmen'), LUNES);
    const deAna = almacen().leerCelda(idDe('Ana'), LUNES);
    const deCarmen = almacen().leerCelda(idDe('Carmen'), LUNES);

    almacen().borrarEmpleado(idDe('Bruno'));
    await pintarElCuadrante(fichero);

    expect(almacen().leerCelda(idDe('Ana'), LUNES)).toEqual(deAna);
    expect(almacen().leerCelda(idDe('Carmen'), LUNES)).toEqual(deCarmen);
    expect(celda(idDe('Ana'), LUNES)).toHaveTextContent(/09:00/);
    expect(celda(idDe('Carmen'), LUNES)).toHaveTextContent(ETIQUETA_VAC);
  });

  it('Un alta con el mismo nombre empieza sin cuadrante', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Bruno');
    almacen().crearTurno(idDe('Bruno'), LUNES, hora(9), hora(17));
    almacen().marcarAusencia(idDe('Bruno'), MARTES);
    almacen().borrarEmpleado(idDe('Bruno'));

    // Otra persona que se llama igual: no hereda nada del anterior.
    darDeAlta('Bruno');
    const nuevo = idDe('Bruno');
    await pintarElCuadrante(fichero);

    for (const dia of [LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO]) {
      expect(esVacia(nuevo, dia)).toBe(true);
    }
  });
});

describe('La plantilla ya guardada no se altera al llegar el almacenamiento del cuadrante', () => {
  it('Una instalación con plantilla conserva sus fichas', async () => {
    // Que el salto de esquema no toque ninguna ficha se comprueba en
    // `sqlite/__tests__/migraciones.test.ts`; lo que se mira aquí es lo que ve el
    // encargado al abrir la app con su plantilla ya guardada.
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana', 'Bruno', 'Carmen');
    almacen().editarTelefono(idDe('Ana'), '600 00 00 01');
    almacen().editarEmail(idDe('Bruno'), 'bruno@ejemplo.es');
    almacen().editarNota(idDe('Carmen'), 'Turno partido');
    const fichas = almacen().listarEmpleados();

    await pintarElCuadrante(fichero);

    expect(almacen().listarEmpleados()).toEqual(fichas);
    // Ni una pantalla de preparación por el medio: lo que se pinta es el cuadrante.
    expect(screen.getByTestId('rejilla-cuadrante')).toBeTruthy();
  });

  it('A partir de esa apertura el cuadrante ya se conserva', async () => {
    const fichero = rutaDeFicheroDePrueba();
    abrirLosDatos(fichero);
    darDeAlta('Ana');

    almacen().crearTurno(idDe('Ana'), JUEVES, hora(9), hora(17));
    await pintarElCuadrante(fichero);

    expect(celda(idDe('Ana'), JUEVES)).toHaveTextContent(/09:00/);
    expect(celda(idDe('Ana'), JUEVES)).toHaveTextContent(/17:00/);
  });
});
