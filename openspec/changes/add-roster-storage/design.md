## Context

Ver `proposal.md` — Why para el motivo. Lo que condiciona el diseño es el estado actual:

- `AlmacenCuadrante` (`src/datos/almacenCuadrante.ts`) es el único contrato entre la pantalla y
  los datos. Sus operaciones de empleado ya van contra SQLite —`almacenEmpleadosSqlite.ts`— y
  las de celda siguen en un `Map` en memoria, indexado por `` `${idEmpleado}|${dia}` ``.
- Los tipos del dominio ya garantizan por construcción lo que el esquema tendrá que respetar:
  `ContenidoCelda` es una unión de cuatro estados excluyentes, y `TurnosDelDia` es una tupla de
  uno o dos elementos, «nunca tres: el tipo no lo permite».
- `FechaISO` es `aaaa-mm-dd` y `Hora` es `{ horas, minutos }`. Los identificadores de turno son
  `string` y hoy salen de un contador en memoria.
- `migraciones.ts` fija dos reglas que este change no puede saltarse: una migración publicada no
  se edita nunca, y toda tabla que se refiera a un empleado lo hace con
  `empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE`.
- `conexion.ts` ejecuta `PRAGMA foreign_keys = ON` en cada apertura, hoy sin ninguna clave ajena
  que vigilar. Este change es el que le da trabajo.
- `borrarEmpleado` en `almacenEmpleadosSqlite.ts` ya borra con una sola sentencia y confía la
  limpieza de «turnos, ausencias, vacaciones, horas» a la cascada. Hoy esa confianza no está
  respaldada por ninguna tabla.

## Goals / Non-Goals

**Goals:**

- Que las celdas se guarden en el mismo fichero de base de datos que la plantilla, sin cambiar
  la interfaz `AlmacenCuadrante` ni ninguna pantalla.
- Que la exclusividad de los cuatro estados de celda y la cascada de la baja vengan del
  esquema, no de la disciplina de cada consulta.
- Que la implementación en memoria siga existiendo para los tests de pantalla.

**Non-Goals:**

- Cambiar la interfaz `AlmacenCuadrante`. Si alguna firma tuviera que cambiar, es señal de que
  el diseño se ha desviado.
- Ordenar en SQL. El orden de empleados lo sigue poniendo `ordenarEmpleadosPorNombre` y el de
  turnos `ordenarPorHoraDeInicio`, por la misma razón que en `add-employee-storage` — D6.
- Guardar el portapapeles. Lo copiado sigue en memoria y debe seguir sin sobrevivir al cierre.

## Decisions

### D1. Dos tablas: `celdas` y `turnos`

```sql
CREATE TABLE celdas (
  empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  dia         TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('turnos', 'ausencia', 'vacaciones')),
  PRIMARY KEY (empleado_id, dia)
);

CREATE TABLE turnos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  dia         TEXT NOT NULL,
  inicio      TEXT NOT NULL,
  fin         TEXT NOT NULL,
  FOREIGN KEY (empleado_id, dia) REFERENCES celdas (empleado_id, dia) ON DELETE CASCADE
);
```

`PRIMARY KEY (empleado_id, dia)` es lo que hace el trabajo: **una celda no puede estar en dos
estados a la vez porque no puede tener dos filas**. La exclusividad que `ContenidoCelda`
garantiza en los tipos queda garantizada también en el fichero, que es donde la spec la quiere.

No hay estado `'vacia'`: **una celda vacía es la ausencia de fila**, igual que en la tabla
`ajustes` de la migración 2 «que no haya fila para una clave significa que nunca se ha
escrito». Vaciar una celda es borrar su fila, y la cascada se lleva sus turnos.

`turnos` lleva **dos** claves ajenas a propósito. La compuesta contra `celdas` es la que borra
los turnos al vaciar la celda o al cambiarla de estado. La directa contra `empleados` es la que
exige la regla 2 de `migraciones.ts`: una tabla que se refiere a un empleado lo dice ella misma
y no a través de un tercero, de modo que la cascada de la baja no depende de que `celdas` siga
existiendo ni de que nadie retoque su clave.

**Alternativas descartadas:**

- **Tres tablas —`turnos`, `ausencias`, `vacaciones`—**, que es como las nombra de pasada el
  comentario de `migraciones.ts`. Descartada: nada impediría que el mismo empleado y día
  tuvieran fila en dos de ellas, y la exclusividad volvería a depender de que cada consulta se
  acuerde de borrar en las otras dos. Es justo el patrón que el fichero de migraciones prohíbe.
- **Una sola tabla con `turno1_inicio`, `turno1_fin`, `turno2_inicio`, `turno2_fin`.**
  Tentadora: el máximo de dos turnos quedaría también grabado en el esquema. Descartada porque
  el identificador del turno pasaría a ser su posición, y eliminar el primero de dos le
  cambiaría el identificador al segundo. Hoy los identificadores son estables mientras el turno
  existe, y la pantalla los usa para editar y borrar; no merece la pena cambiar esa garantía a
  cambio de un `CHECK` que el tipo `TurnosDelDia` ya cubre en el único sitio por el que se
  escribe.

### D2. El máximo de dos turnos lo sigue guardando el código

El esquema admitiría tres filas de turno el mismo día. No se añade ni disparador ni índice para
impedirlo: `crearTurno` ya no hace nada si la celda tiene dos, `TurnosDelDia` no admite un
tercero, y toda escritura pasa por el adaptador. Poner el límite también en SQL costaría un
disparador —la única herramienta de SQLite para contar filas hermanas— y este proyecto no tiene
ninguno; introducir el primero para reforzar una regla que ya está en el tipo y en el único
camino de escritura contradice el principio de simplicidad.

Al **leer**, si aparecieran tres filas, el adaptador se queda con las dos primeras por hora de
inicio en lugar de reventar: una lectura no es el sitio donde enterarse de una invariante rota.

### D3. Las horas se guardan como texto `hh:mm`

`Hora` es `{ horas, minutos }` y se guarda como `TEXT` de cinco caracteres con cero delante,
que es la misma forma en la que se muestra. La conversión vive en el borde del adaptador, igual
que `aEmpleado` convierte el `id` a texto.

Frente a un entero de minutos desde medianoche: el texto hace legible el fichero cuando haya que
mirarlo con cualquier herramienta de SQLite, y ahorra aritmética en los dos sentidos. Como está
rellenado con ceros, ordena igual que ordenaría el entero — aunque el orden no se haga en SQL
(D1, Non-Goals).

### D4. `dia` es la `FechaISO` tal cual

`aaaa-mm-dd` como `TEXT`. Leer una semana es
`WHERE dia BETWEEN <lunes> AND <domingo>`, que con ese formato es una comparación de texto
correcta sin conversiones. Es además la clave que ya usa el `Map` en memoria, así que el
adaptador no inventa ninguna forma nueva de nombrar un día.

Índice `CREATE INDEX celdas_dia ON celdas (dia)` y su equivalente en `turnos`: la lectura por
semana es la consulta que se hace en cada repintado de la pantalla, y con 20 empleados y meses
planificados recorrer la tabla entera cada vez no hace falta.

### D5. Una transacción por operación de la interfaz, y un solo aviso

`pegarEnCelda` son hasta tres escrituras —borrar la celda, escribirla, insertar sus turnos— y
la interfaz ya advierte de que sueltas «la rejilla se repintaría con la celda a medio hacer, en
un estado que nunca debió verse». En SQLite eso es envolverlas en `BEGIN`/`COMMIT` y llamar a
`avisar()` **una sola vez al final**, nunca dentro. Lo mismo vale para
`marcarRangoDeVacaciones` y `eliminarRangoDeVacaciones`, que tocan hasta una celda por día del
rango.

### D6. Las vacaciones se guardan por día, no por rango

`leerRangosDeVacaciones` devuelve tramos contiguos, pero lo guardado son días sueltos con
`tipo = 'vacaciones'`, y los tramos los sigue componiendo `agruparEnRangos` en el dominio.

Guardar rangos obligaría a partirlos y recoserlos cada vez que una celda del medio cambia de
estado, y dejaría dos representaciones de lo mismo —el rango guardado y el día de la celda—
que podrían discrepar. Un día es un día.

### D7. La implementación en memoria se queda

`crearAlmacenCuadranteEnMemoria` sigue existiendo para los tests de pantalla, igual que
`crearAlmacenEmpleadosEnMemoria`. Lo que cambia es que deja de ser lo que usa la app: `arranque.ts`
compondrá el almacén con el adaptador nuevo. Su cabecera —«las celdas del cuadrante siguen en
memoria y se pierden al cerrar la app»— deja de describir el producto y hay que reescribirla:
mientras siga ahí, contradice la spec nueva.

## Risks / Trade-offs

- **La cascada no funciona si `PRAGMA foreign_keys` no está activo** → Ya se ejecuta en cada
  apertura desde `conexion.ts`, y este change es el primero que lo necesita de verdad. Un test
  debe comprobar la cascada de punta a punta —dar de baja y ver que no queda ni celda ni
  turno—, no solo que el SQL declara `ON DELETE CASCADE`.
- **La migración 4 corre en instalaciones que ya tienen plantilla** → Solo crea tablas e
  índices; no toca `empleados` ni copia nada. El mecanismo ya envuelve cada migración en su
  transacción y sube `user_version` al final.
- **Más escrituras por gesto que antes** → Cada toque en una celda pasa de mutar un `Map` a
  escribir en SQLite. Con 20 empleados y siete días es un volumen ridículo para SQLite, y la
  escritura ya era síncrona. No se prevé cambio perceptible; si lo hubiera, se mediría antes de
  tocar nada.
- **`ORDER BY` ausente en las lecturas** → El orden lo ponen el dominio y el mismo código que
  ya lo pone hoy. El riesgo es olvidarlo en alguna lectura nueva y que el cuadrante salga
  desordenado; los escenarios de orden de la spec de `cuadrante-semanal` lo detectan.

## Migration Plan

1. Migración 4 al final de `MIGRACIONES`, con las dos tablas y sus índices. No se edita ninguna
   de las tres publicadas.
2. Adaptador nuevo en `src/datos/sqlite/`, hermano de `almacenEmpleadosSqlite.ts`.
3. `almacenCuadrante.ts` compone el almacén con el adaptador; la interfaz no cambia.
4. `arranque.ts` pasa a instalar el almacén completo sobre SQLite.

**Vuelta atrás**: instalar el APK anterior sobre una base migrada **no funciona** y falla de
forma controlada: `migrar` lanza cuando `user_version` es mayor que la que la app conoce, y la
app muestra el aviso de almacenamiento en lugar del cuadrante, sin tocar el fichero. Es el
comportamiento ya especificado, pero conviene tenerlo presente: **la vuelta atrás real es
reinstalar la versión nueva**, no la vieja. Como la versión con este change será la primera que
llegue al encargado, el caso solo puede darse en la copia del desarrollador.

## Open Questions

Ninguna. Las dos que había —cómo se describe la capability y si el aviso «Guardado» entra en
este change— se resolvieron el 09/09/2026 y están registradas en `proposal.md`.
