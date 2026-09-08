import {
  MOTIVO_NOMBRE_REPETIDO,
  MOTIVO_NOMBRE_VACIO,
  motivoPorElQueElNombreNoSeGuarda,
} from '../../../dominio/empleado';
import { abrirConNodeSqlite } from '../../../pruebas/bdDePrueba';
import type { AlmacenEmpleados } from '../../almacenEmpleados';
import { crearAlmacenEmpleadosSqlite } from '../almacenEmpleadosSqlite';
import { abrirBaseDeDatos } from '../conexion';
import { migrar } from '../migraciones';

function plantillaRecienCreada(): AlmacenEmpleados {
  const bd = abrirBaseDeDatos(abrirConNodeSqlite, ':memory:');
  migrar(bd);
  return crearAlmacenEmpleadosSqlite(bd);
}

const nombres = (almacen: AlmacenEmpleados) => almacen.listarEmpleados().map((e) => e.nombre);

function conPlantilla(...nombresIniciales: string[]): AlmacenEmpleados {
  const almacen = plantillaRecienCreada();
  for (const nombre of nombresIniciales) almacen.altaEmpleado(nombre);
  return almacen;
}

function buscar(almacen: AlmacenEmpleados, nombre: string) {
  return almacen.listarEmpleados().find((empleado) => empleado.nombre === nombre)!;
}

describe('Orden alfabético español del listado de empleados', () => {
  it('Listar una plantilla con acentos y con Ñ', () => {
    const almacen = conPlantilla('Óscar', 'Zoe', 'Ana', 'Ñoño', 'Núria', 'Ángel');

    expect(nombres(almacen)).toEqual(['Ana', 'Ángel', 'Núria', 'Ñoño', 'Óscar', 'Zoe']);
  });

  it('El orden ignora las mayúsculas', () => {
    const almacen = conPlantilla('bruno', 'Ana', 'CARMEN');

    expect(nombres(almacen)).toEqual(['Ana', 'bruno', 'CARMEN']);
  });

  it('dos lecturas seguidas sin escrituras devuelven el mismo orden', () => {
    const almacen = conPlantilla('Zoe', 'Ana', 'Bruno');

    expect(nombres(almacen)).toEqual(nombres(almacen));
  });
});

describe('Lectura de una ficha', () => {
  it('leer un empleado que no está en la plantilla no devuelve ninguna ficha', () => {
    const almacen = conPlantilla('Ana');

    expect(almacen.leerEmpleado('9999')).toBeNull();
    expect(almacen.leerEmpleado('no-es-un-id')).toBeNull();
  });
});

describe('Validez de los campos de la ficha al escribir', () => {
  it('Guardar un empleado solo con nombre', () => {
    const almacen = plantillaRecienCreada();

    const carmen = almacen.altaEmpleado('Carmen');

    expect(carmen).not.toBeNull();
    // Ni puesto, ni teléfono, ni email, ni nota, ni motivo de la ausencia: un campo
    // opcional vacío no aparece en la ficha.
    expect(almacen.leerEmpleado(carmen!.id)).toEqual({ id: carmen!.id, nombre: 'Carmen' });
    expect(almacen.leerEmpleado(carmen!.id)!.puesto).toBeUndefined();
    expect(almacen.leerEmpleado(carmen!.id)!.motivoAusencia).toBeUndefined();
  });

  it('Un empleado sin nombre no se guarda', () => {
    const almacen = conPlantilla('Ana', 'Bruno');

    expect(almacen.altaEmpleado('   ', '600112233')).toBeNull();

    // Cuál de las dos condiciones falla lo dice el dominio, que es lo que la
    // pantalla consulta para explicárselo al encargado.
    expect(motivoPorElQueElNombreNoSeGuarda('   ', almacen.listarEmpleados())).toBe(
      MOTIVO_NOMBRE_VACIO,
    );
    expect(nombres(almacen)).toEqual(['Ana', 'Bruno']);
  });

  it('Un nombre repetido no se guarda', () => {
    const almacen = conPlantilla('Ana');

    expect(almacen.altaEmpleado(' ana ')).toBeNull();
    expect(motivoPorElQueElNombreNoSeGuarda(' ana ', almacen.listarEmpleados())).toBe(
      MOTIVO_NOMBRE_REPETIDO,
    );
    expect(nombres(almacen)).toEqual(['Ana']);

    expect(almacen.altaEmpleado('Ana G.')).not.toBeNull();
    expect(nombres(almacen)).toEqual(['Ana', 'Ana G.']);
  });

  it('Corregir las mayúsculas del propio nombre sí se guarda', () => {
    const almacen = conPlantilla('ana', 'Bruno');
    const ana = buscar(almacen, 'ana');

    expect(almacen.editarNombre(ana.id, 'Ana')).toBe(true);

    expect(almacen.leerEmpleado(ana.id)!.nombre).toBe('Ana');
  });

  it('Los campos se guardan sin los espacios de los extremos', () => {
    const almacen = plantillaRecienCreada();

    const bruno = almacen.altaEmpleado(' Bruno ', ' 600 11 22 33 ', ' bruno@ejemplo.es ');

    expect(almacen.leerEmpleado(bruno!.id)).toEqual({
      id: bruno!.id,
      nombre: 'Bruno',
      telefono: '600 11 22 33',
      email: 'bruno@ejemplo.es',
    });
  });

  it('Vaciar el email de un empleado', () => {
    const almacen = plantillaRecienCreada();
    const ana = almacen.altaEmpleado('Ana', '600 11 22 33', 'ana@ejemplo.es')!;
    almacen.editarNota(ana.id, 'Solo mañanas');

    almacen.editarEmail(ana.id, '');

    expect(almacen.leerEmpleado(ana.id)).toEqual({
      id: ana.id,
      nombre: 'Ana',
      telefono: '600 11 22 33',
      nota: 'Solo mañanas',
    });
  });

  it('la nota se puede escribir, cambiar y vaciar sin tocar los demás campos', () => {
    const almacen = plantillaRecienCreada();
    const bruno = almacen.altaEmpleado('Bruno', '600 11 22 33', 'bruno@ejemplo.es')!;

    almacen.editarNota(bruno.id, 'No puede los martes por la tarde');
    expect(almacen.leerEmpleado(bruno.id)!.nota).toBe('No puede los martes por la tarde');

    almacen.editarNota(bruno.id, '');
    expect(almacen.leerEmpleado(bruno.id)).toEqual({
      id: bruno.id,
      nombre: 'Bruno',
      telefono: '600 11 22 33',
      email: 'bruno@ejemplo.es',
    });
  });

  it('un nombre vacío tampoco se guarda al editar', () => {
    const almacen = conPlantilla('Ana');
    const ana = buscar(almacen, 'Ana');

    expect(almacen.editarNombre(ana.id, '   ')).toBe(false);
    expect(almacen.leerEmpleado(ana.id)!.nombre).toBe('Ana');
  });

  it('Dos empleados con el mismo puesto se guardan', () => {
    const almacen = plantillaRecienCreada();
    const ana = almacen.altaEmpleado('Ana', undefined, undefined, 'Barra')!;

    const bruno = almacen.altaEmpleado('Bruno', undefined, undefined, 'Barra');

    // El puesto no interviene en la unicidad: lo único que no se puede repetir es
    // el nombre.
    expect(bruno).not.toBeNull();
    expect(almacen.leerEmpleado(ana.id)!.puesto).toBe('Barra');
    expect(almacen.leerEmpleado(bruno!.id)!.puesto).toBe('Barra');
  });

  it('El puesto se guarda sin los espacios de los extremos', () => {
    const almacen = plantillaRecienCreada();
    const bruno = almacen.altaEmpleado('Bruno')!;

    almacen.editarPuesto(bruno.id, ' Jefe de cocina ');

    expect(almacen.leerEmpleado(bruno.id)!.puesto).toBe('Jefe de cocina');
  });

  it('Vaciar el puesto de un empleado', () => {
    const almacen = plantillaRecienCreada();
    const ana = almacen.altaEmpleado('Ana', '600 11 22 33', 'ana@ejemplo.es', 'Barra')!;
    almacen.editarNota(ana.id, 'Solo mañanas');
    almacen.editarMotivoAusencia(ana.id, 'Baja médica hasta el 20/09/2026');

    almacen.editarPuesto(ana.id, '');

    // El puesto se vacía y ningún otro campo se entera.
    expect(almacen.leerEmpleado(ana.id)).toEqual({
      id: ana.id,
      nombre: 'Ana',
      telefono: '600 11 22 33',
      email: 'ana@ejemplo.es',
      nota: 'Solo mañanas',
      motivoAusencia: 'Baja médica hasta el 20/09/2026',
    });
  });

  it('el motivo de la ausencia es texto libre, sin longitud máxima, y el nuevo pisa al anterior', () => {
    const almacen = plantillaRecienCreada();
    const bruno = almacen.altaEmpleado('Bruno')!;
    const largo = 'Baja médica. '.repeat(200);

    almacen.editarMotivoAusencia(bruno.id, 'Asuntos propios');
    expect(almacen.leerEmpleado(bruno.id)!.motivoAusencia).toBe('Asuntos propios');

    // No hay histórico: el segundo motivo sustituye al primero, como la nota.
    almacen.editarMotivoAusencia(bruno.id, largo);
    expect(almacen.leerEmpleado(bruno.id)!.motivoAusencia).toBe(largo.trim());

    almacen.editarMotivoAusencia(bruno.id, '');
    expect(almacen.leerEmpleado(bruno.id)!.motivoAusencia).toBeUndefined();
  });

  it('el puesto no altera el orden alfabético de la lista', () => {
    const almacen = conPlantilla('Carmen', 'Ana', 'Bruno');
    const orden = nombres(almacen);

    // Puestos distintos, y escritos en un orden que no es el alfabético.
    almacen.editarPuesto(buscar(almacen, 'Carmen').id, 'Barra');
    almacen.editarPuesto(buscar(almacen, 'Ana').id, 'Sala');
    almacen.editarPuesto(buscar(almacen, 'Bruno').id, 'Cocina');

    expect(nombres(almacen)).toEqual(orden);
    expect(nombres(almacen)).toEqual(['Ana', 'Bruno', 'Carmen']);
  });

  it('una edición no puede dejar dos empleados con el mismo nombre', () => {
    const almacen = conPlantilla('Ana', 'Bruno');
    const bruno = buscar(almacen, 'Bruno');

    expect(almacen.editarNombre(bruno.id, ' ANA ')).toBe(false);
    expect(nombres(almacen)).toEqual(['Ana', 'Bruno']);
  });
});

describe('Toda escritura queda reflejada en la lectura siguiente', () => {
  it('Un alta se ve en el listado siguiente', () => {
    const almacen = conPlantilla('Ana', 'Carmen');

    const bruno = almacen.altaEmpleado('Bruno')!;

    expect(nombres(almacen)).toEqual(['Ana', 'Bruno', 'Carmen']);
    expect(almacen.leerEmpleado(bruno.id)!.nombre).toBe('Bruno');
  });

  it('Una edición se ve en la lectura siguiente', () => {
    const almacen = plantillaRecienCreada();
    const bruno = almacen.altaEmpleado('Bruno', '600 11 22 33', 'bruno@ejemplo.es')!;
    almacen.editarNota(bruno.id, 'No puede los martes por la tarde');

    almacen.editarTelefono(bruno.id, '611 22 33 44');

    expect(almacen.leerEmpleado(bruno.id)).toEqual({
      id: bruno.id,
      nombre: 'Bruno',
      telefono: '611 22 33 44',
      email: 'bruno@ejemplo.es',
      nota: 'No puede los martes por la tarde',
    });
  });

  it('Una baja se ve en la lectura siguiente', () => {
    const almacen = conPlantilla('Ana', 'Bruno', 'Carmen');
    const bruno = buscar(almacen, 'Bruno');

    almacen.borrarEmpleado(bruno.id);

    expect(nombres(almacen)).toEqual(['Ana', 'Carmen']);
    expect(almacen.leerEmpleado(bruno.id)).toBeNull();
  });

  it('Una escritura rechazada no deja rastro', () => {
    const almacen = conPlantilla('Ana', 'Bruno');

    expect(almacen.altaEmpleado('')).toBeNull();

    expect(nombres(almacen)).toEqual(['Ana', 'Bruno']);
  });

  it('Cambiar un nombre cambia su posición en el listado', () => {
    const almacen = conPlantilla('Ana', 'Bruno', 'Carmen');
    const carmen = buscar(almacen, 'Carmen');

    almacen.editarNombre(carmen.id, 'Alberto');

    expect(nombres(almacen)).toEqual(['Alberto', 'Ana', 'Bruno']);
  });
});

describe('La baja de un empleado es un borrado definitivo', () => {
  it('Reutilizar el nombre de un empleado dado de baja', () => {
    const almacen = plantillaRecienCreada();
    const bruno = almacen.altaEmpleado('Bruno', '600 11 22 33')!;
    almacen.editarNota(bruno.id, 'No puede los martes por la tarde');

    almacen.borrarEmpleado(bruno.id);
    const nuevoBruno = almacen.altaEmpleado('Bruno')!;

    expect(nuevoBruno).not.toBeNull();
    expect(almacen.leerEmpleado(nuevoBruno.id)).toEqual({ id: nuevoBruno.id, nombre: 'Bruno' });
  });

  it('el identificador de un empleado dado de baja no se reutiliza', () => {
    // Sin AUTOINCREMENT, SQLite le daría al nuevo empleado el id del anterior, y una
    // pantalla que se hubiera quedado con ese id mostraría la ficha de otra persona.
    const almacen = plantillaRecienCreada();
    const bruno = almacen.altaEmpleado('Bruno')!;

    almacen.borrarEmpleado(bruno.id);
    const nuevoBruno = almacen.altaEmpleado('Bruno')!;

    expect(nuevoBruno.id).not.toBe(bruno.id);
    expect(almacen.leerEmpleado(bruno.id)).toBeNull();
  });
});

describe('Aviso a las pantallas', () => {
  it('una escritura aceptada avisa una vez y una rechazada no avisa', () => {
    const almacen = conPlantilla('Ana');
    const oyente = jest.fn();
    almacen.suscribirse(oyente);

    almacen.altaEmpleado('Bruno');
    expect(oyente).toHaveBeenCalledTimes(1);

    almacen.altaEmpleado(' ana ');
    almacen.altaEmpleado('  ');
    expect(oyente).toHaveBeenCalledTimes(1);
  });

  it('la edición y la baja también avisan, y darse de baja de la suscripción la corta', () => {
    const almacen = conPlantilla('Ana');
    const ana = buscar(almacen, 'Ana');
    const oyente = jest.fn();
    const darseDeBaja = almacen.suscribirse(oyente);

    almacen.editarTelefono(ana.id, '600 11 22 33');
    expect(oyente).toHaveBeenCalledTimes(1);

    darseDeBaja();
    almacen.borrarEmpleado(ana.id);
    expect(oyente).toHaveBeenCalledTimes(1);
  });
});
