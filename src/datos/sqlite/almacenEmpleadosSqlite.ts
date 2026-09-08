/**
 * Las operaciones de empleados de `AlmacenCuadrante`, contra SQLite.
 *
 * Aquí se acaba el SQL: hacia arriba solo salen `Empleado` y los mismos `null` y
 * `false` que devolvía la implementación en memoria, así que ni las pantallas ni el
 * resto de la capa de datos saben que hay una base de datos debajo.
 *
 * Las reglas del nombre no se reimplementan: `sanearCampo` y `formaComparable` son
 * las del dominio, las mismas que usa la pantalla. Y la unicidad no se comprueba
 * leyendo antes de escribir —entre la lectura y la escritura cabría otra escritura—,
 * sino que se deja fallar al índice único y se traduce ese fallo al `null` o al
 * `false` que la interfaz ya devolvía (design.md — D4).
 */

import { formaComparable, sanearCampo } from '../../dominio/empleado';
import { ordenarEmpleadosPorNombre } from '../../dominio/orden';
import type { Empleado, IdEmpleado } from '../../dominio/tipos';
import type { AlmacenEmpleados } from '../almacenEmpleados';
import type { BaseDeDatos, ValorSql } from './bd';

interface FilaEmpleado {
  readonly id: number;
  readonly nombre: string;
  readonly puesto: string | null;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly nota: string | null;
  readonly motivo_ausencia: string | null;
}

const COLUMNAS = 'id, nombre, puesto, telefono, email, nota, motivo_ausencia';

/**
 * De fila a ficha. Un campo opcional vacío **no aparece** en el objeto, igual que en
 * la implementación en memoria: la ficha de quien no tiene teléfono no trae la clave
 * `telefono` con una cadena vacía dentro.
 *
 * El `id` se convierte a texto aquí, en el borde del módulo, para que
 * `IdEmpleado = string` siga siendo cierto en todo el resto del proyecto (D3).
 */
function aEmpleado(fila: FilaEmpleado): Empleado {
  return {
    id: String(fila.id),
    nombre: fila.nombre,
    // `puesto` y `motivo_ausencia` llegaron con la migración 3 y las filas que ya
    // existían las tienen a cadena vacía: vacío y sin escribir son lo mismo aquí.
    ...(fila.puesto ? { puesto: fila.puesto } : {}),
    ...(fila.telefono ? { telefono: fila.telefono } : {}),
    ...(fila.email ? { email: fila.email } : {}),
    ...(fila.nota ? { nota: fila.nota } : {}),
    ...(fila.motivo_ausencia ? { motivoAusencia: fila.motivo_ausencia } : {}),
  };
}

/** Un campo opcional se guarda como `NULL` cuando queda vacío, no como cadena vacía. */
function campoOpcional(texto: string | undefined): ValorSql {
  return sanearCampo(texto ?? '') || null;
}

/**
 * El `id` tal y como lo entiende la tabla. Un identificador que no sea un entero no
 * corresponde a ninguna fila —los genera `AUTOINCREMENT`—, así que se trata como
 * empleado que no está, no como error.
 */
function comoIdDeFila(id: IdEmpleado): number | null {
  const numero = Number(id);
  return Number.isInteger(numero) && id.trim() !== '' ? numero : null;
}

export function crearAlmacenEmpleadosSqlite(bd: BaseDeDatos): AlmacenEmpleados {
  const oyentes = new Set<() => void>();
  const avisar = () => oyentes.forEach((oyente) => oyente());

  /**
   * Cambia un campo opcional de la ficha sin tocar los demás. Devuelve si llegó a
   * cambiar algo, para no avisar de una escritura sobre alguien que ya no está.
   */
  function editarCampo(
    id: IdEmpleado,
    columna: 'puesto' | 'telefono' | 'email' | 'nota' | 'motivo_ausencia',
    valor: string,
  ): void {
    const idDeFila = comoIdDeFila(id);
    if (idDeFila === null) return;

    const escritura = bd.escribir(
      `UPDATE empleados SET ${columna} = ? WHERE id = ?`,
      campoOpcional(valor),
      idDeFila,
    );
    if (escritura.filasAfectadas > 0) avisar();
  }

  return {
    listarEmpleados() {
      // El orden lo pone `ordenarEmpleadosPorNombre` y no un `ORDER BY`: la colación
      // por omisión de SQLite es BINARY, que ordena por código de carácter y pondría
      // `Zoe` antes que `Ángel` y la `Ñ` después de la `Z` (design.md — D6). Ordenar
      // aquí garantiza además que el listado y las filas del cuadrante no divergen,
      // porque las ordena el mismo código.
      return ordenarEmpleadosPorNombre(
        bd.leer<FilaEmpleado>(`SELECT ${COLUMNAS} FROM empleados`).map(aEmpleado),
      );
    },

    leerEmpleado(id) {
      const idDeFila = comoIdDeFila(id);
      if (idDeFila === null) return null;

      const [fila] = bd.leer<FilaEmpleado>(
        `SELECT ${COLUMNAS} FROM empleados WHERE id = ?`,
        idDeFila,
      );
      return fila ? aEmpleado(fila) : null;
    },

    altaEmpleado(nombre, telefono, email, puesto) {
      const nombreGuardado = sanearCampo(nombre);
      if (nombreGuardado.length === 0) return null;

      try {
        // Una sentencia suelta es su propia transacción en SQLite: o entra la fila
        // entera o no entra ninguna. Si el nombre está repetido, el índice único la
        // rechaza y no queda rastro de la escritura.
        const escritura = bd.escribir(
          'INSERT INTO empleados' +
            ' (nombre, nombre_comparable, puesto, telefono, email, nota, motivo_ausencia)' +
            ' VALUES (?, ?, ?, ?, ?, NULL, NULL)',
          nombreGuardado,
          formaComparable(nombre),
          campoOpcional(puesto),
          campoOpcional(telefono),
          campoOpcional(email),
        );
        avisar();
        return {
          id: String(escritura.ultimoId),
          nombre: nombreGuardado,
          // El puesto se guarda saneado, igual que el nombre, el teléfono y el email.
          ...(campoOpcional(puesto) ? { puesto: sanearCampo(puesto ?? '') } : {}),
          ...(campoOpcional(telefono) ? { telefono: sanearCampo(telefono ?? '') } : {}),
          ...(campoOpcional(email) ? { email: sanearCampo(email ?? '') } : {}),
        };
      } catch {
        // Nombre repetido. La plantilla queda como estaba y nadie recibe aviso.
        return null;
      }
    },

    editarNombre(id, nombre) {
      const idDeFila = comoIdDeFila(id);
      const nombreGuardado = sanearCampo(nombre);
      if (idDeFila === null || nombreGuardado.length === 0) return false;

      try {
        // Las dos columnas en la misma sentencia: el nombre que se ve y la forma con
        // la que se compara nunca pueden quedar contando cosas distintas.
        const escritura = bd.escribir(
          'UPDATE empleados SET nombre = ?, nombre_comparable = ? WHERE id = ?',
          nombreGuardado,
          formaComparable(nombre),
          idDeFila,
        );
        if (escritura.filasAfectadas === 0) return false;
        avisar();
        return true;
      } catch {
        // Repetido con **otro** empleado. Corregir las mayúsculas del propio nombre
        // no pasa por aquí: la fila que se actualiza es la misma que ya ocupaba esa
        // forma comparable en el índice.
        return false;
      }
    },

    editarPuesto(id, puesto) {
      editarCampo(id, 'puesto', puesto);
    },

    editarTelefono(id, telefono) {
      editarCampo(id, 'telefono', telefono);
    },

    editarEmail(id, email) {
      editarCampo(id, 'email', email);
    },

    editarNota(id, nota) {
      editarCampo(id, 'nota', nota);
    },

    editarMotivoAusencia(id, motivo) {
      // Como la nota: texto libre, sin longitud máxima y sin más estructura que la
      // de quitarle los espacios de los extremos. El motivo nuevo pisa al anterior.
      editarCampo(id, 'motivo_ausencia', motivo);
    },

    borrarEmpleado(id) {
      const idDeFila = comoIdDeFila(id);
      if (idDeFila === null) return;

      // Una sola sentencia, sin recorrer ninguna otra tabla. Lo que cuelgue del
      // empleado —turnos, ausencias, vacaciones, horas— se irá con él por el
      // `ON DELETE CASCADE` de su clave ajena, que es donde la spec quiere esa
      // garantía: en el esquema, no en la memoria de quien escribe el código (D5).
      const escritura = bd.escribir('DELETE FROM empleados WHERE id = ?', idDeFila);
      if (escritura.filasAfectadas > 0) avisar();
    },

    suscribirse(oyente) {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}
