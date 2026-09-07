## Context

Ver `proposal.md` — Why. Lo que condiciona el diseño es el estado actual del código y tres
restricciones ya fijadas:

- `src/datos/almacenCuadrante.ts` define la interfaz `AlmacenCuadrante` y una implementación en
  memoria. Es el **único** contrato entre las pantallas y los datos: ni el cuadrante ni el
  panel importan estructuras internas de ese módulo. La implementación se inyecta con
  `instalarAlmacen`, y los tests de UI ya la sustituyen por `crearAlmacenEnMemoria`.
- Esa interfaz es **síncrona**: `listarEmpleados(): Empleado[]`, `leerEmpleado(id): Empleado |
  null`, `altaEmpleado(...): Empleado | null`. Las pantallas la consumen a través de
  `src/ui/usarAlmacen.ts` sin estados de carga.
- El dominio ya tiene lo que hace falta para las reglas: `src/dominio/empleado.ts` valida el
  nombre y sanea los campos, y `src/dominio/orden.ts` ordena con
  `new Intl.Collator('es-ES', { sensitivity: 'base' })`.

Este change sustituye la parte de empleados de la implementación en memoria por una que va
contra SQLite. Turnos, ausencias y vacaciones siguen en memoria hasta su propio change, así que
durante ese intervalo conviven las dos cosas detrás de la misma interfaz.

## Goals / Non-Goals

**Goals:**

- Que la ficha del empleado sobreviva al cierre de la app sin que ninguna pantalla se entere.
- Un mecanismo de versionado de esquema sobre el que los changes siguientes añadan sus tablas
  sin volver a discutir cómo se migra.
- Que el esquema **garantice por construcción** que una baja no deja nada detrás.
- Cero dependencias nuevas más allá de `expo-sqlite`, que ya está en el stack fijado.

**Non-Goals:**

- No se cambia la interfaz `AlmacenCuadrante` ni un solo componente de pantalla. Si algo del
  diseño obligara a tocarlos, es señal de que el diseño está mal.
- No se crean tablas de turnos, ausencias, vacaciones ni horas registradas, ni columnas
  "por si acaso". Lo único que este change deja preparado para ellas es la decisión escrita de
  cómo se enganchan al borrado en cascada (D5), que no cuesta ninguna línea de esquema hoy.
- No se toca la implementación en memoria del contenido del cuadrante.
- No hay migración de datos existentes: hoy no hay ningún fichero de datos en el dispositivo,
  así que no hay nada que traer.

## Decisions

### D1. `expo-sqlite` directamente, sin ORM ni capa de abstracción

SQL escrito a mano contra la API de `expo-sqlite`, encapsulado dentro de
`src/datos/almacenCuadrante.ts` (o de un módulo hermano que ese fichero use). El SQL no sale de
la capa de datos.

*Alternativas descartadas*: Drizzle, TypeORM, WatermelonDB, o una capa propia de repositorios.
Son una tabla, cuatro columnas y cinco operaciones para un solo restaurante; cualquiera de esas
piezas es más código del que ahorra y añade una dependencia que el proyecto tendría que
mantener durante años. La interfaz `AlmacenCuadrante` **ya es** la abstracción sobre los datos.

**Dependencias nuevas**: solo `expo-sqlite`, que el contexto del proyecto fija como el
mecanismo de datos y sin la cual este change no existe. Ninguna otra.

**Matiz añadido al implementar (07/09/2026)**: el SQL no habla con `expo-sqlite` directamente,
sino con una interfaz de cuatro métodos —`ejecutar`, `escribir`, `leer`, `cerrar`— declarada en
`src/datos/sqlite/bd.ts`. En la app la implementa `expo-sqlite`; en los tests, `node:sqlite`.
Ver D10, que explica por qué hizo falta. No es una capa de repositorios: no conoce empleados ni
ninguna otra entidad, solo cadenas de SQL y parámetros, y el SQL de las migraciones y de las
operaciones se escribe **una sola vez**, no una por implementación.

### D2. API **síncrona** de `expo-sqlite` (`openDatabaseSync`, `getAllSync`, `runSync`)

`expo-sqlite` ofrece API síncrona y asíncrona. Se usa la síncrona.

*Por qué*: la interfaz `AlmacenCuadrante` es síncrona y las pantallas la consumen sin estados
de carga. Pasar a asíncrono obligaría a reescribir `usarAlmacen.ts`, la pantalla del cuadrante,
la lista de empleados y la ficha, más sus tests — exactamente lo que este change declara fuera
de alcance, y con riesgo de tocar comportamiento ya especificado y verificado.

*Trade-off*: las consultas bloquean el hilo de JavaScript. Con 20 empleados y consultas sobre
una tabla de una sola clave primaria, el coste es de microsegundos y no es perceptible. Si
algún día una tabla creciera hasta hacerlo notar —la de horas registradas es la candidata—, el
cambio a asíncrono es un change propio, con su propia justificación.

### D3. El identificador del empleado es el `rowid` de SQLite, con `AUTOINCREMENT`

```
CREATE TABLE empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
)
```

y se convierte a texto en el borde de la capa de datos, para que `IdEmpleado = string` siga
siendo cierto y `src/dominio/tipos.ts` no cambie.

*Por qué el rowid y no un UUID*: generar UUIDs pediría `expo-crypto` o una implementación
propia de aleatoriedad; ni una cosa ni la otra hacen falta cuando la base de datos ya sabe
generar claves y no hay sincronización entre dispositivos que obligue a que la clave sea única
fuera de este móvil.

*Por qué `AUTOINCREMENT` y no el rowid a secas*: sin `AUTOINCREMENT`, SQLite reutiliza el
identificador del último empleado borrado. Una pantalla que se hubiera quedado con el id de un
empleado dado de baja pasaría a leer, sin error alguno, la ficha de otra persona. `AUTOINCREMENT`
garantiza que un identificador no se reutiliza nunca. El coste es una tabla interna
`sqlite_sequence`, irrelevante a esta escala.

### D4. La unicidad del nombre la garantiza un índice sobre una columna de forma comparable

```
CREATE TABLE empleados (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre            TEXT NOT NULL,
  nombre_comparable TEXT NOT NULL,
  telefono          TEXT,
  email             TEXT,
  nota              TEXT
);
CREATE UNIQUE INDEX empleados_nombre_comparable ON empleados (nombre_comparable);
```

`nombre` guarda lo que el encargado tecleó, sin los espacios de los extremos.
`nombre_comparable` guarda la forma con la que se compara la unicidad, calculada **en
TypeScript** por la función `formaComparable` que ya existe en `src/dominio/empleado.ts`
(minúsculas con `toLocaleLowerCase('es-ES')` y espacios interiores colapsados). Este change la
exporta; no la reimplementa.

*Por qué no `UNIQUE` sobre `LOWER(nombre)`*: `LOWER()` de SQLite solo pasa a minúsculas los
caracteres ASCII. `ÁNGEL` y `Ángel` le parecerían nombres distintos, y la spec dice que no lo
son. La única forma de que SQLite y la pantalla estén de acuerdo sobre qué es el mismo nombre
es que la comparación la haga una sola pieza de código, la que ya existe.

*Consecuencia*: la validación deja de depender de que la pantalla se acuerde de llamarla. Un
alta con nombre repetido falla en el índice aunque nadie la haya comprobado antes, que es lo
que pide el requisito «Validez de los campos de la ficha al escribir». La capa de datos traduce
ese fallo al mismo `null` / `false` que hoy devuelve la implementación en memoria, para que la
interfaz no cambie.

### D5. El borrado definitivo lo garantiza `ON DELETE CASCADE` con las claves ajenas activadas

Este change crea una sola tabla, así que hoy no hay ninguna cascada que ejecutar. Lo que sí
decide, y deja escrito como restricción para los changes de turnos, ausencias, vacaciones y
horas registradas:

1. **Toda** tabla que se refiera a un empleado lo hace con
   `empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE`. No se admite
   guardar el nombre del empleado como referencia, ni un identificador sin clave ajena.
2. `PRAGMA foreign_keys = ON` se ejecuta **en cada apertura** de la base de datos. En SQLite
   las claves ajenas están desactivadas por omisión y el ajuste no se guarda en el fichero: sin
   esa línea, `ON DELETE CASCADE` está escrito en el esquema y no hace absolutamente nada. Este
   change la incluye ya, aunque todavía no haya ninguna clave ajena que vigilar, para que
   ningún change posterior tenga que acordarse.
3. El borrado del empleado es `DELETE FROM empleados WHERE id = ?`, una sola sentencia. No se
   escribe código que recorra tablas borrando lo de cada una: eso es justo lo que la spec
   prohíbe cuando dice que la garantía debe venir del esquema.

*Alternativa descartada*: borrado lógico con una columna `activo`. Lo prohíbe la decisión de
negocio del 07/09/2026 y además obligaría a filtrar por esa columna en cada consulta futura,
con el riesgo permanente de que una se olvide y un empleado dado de baja reaparezca en el
cuadrante de una semana pasada.

### D6. El orden alfabético se hace en JavaScript, no en `ORDER BY`

`listarEmpleados` lee las filas y las ordena con `ordenarEmpleadosPorNombre` de
`src/dominio/orden.ts`, que ya usa el `Intl.Collator` español.

*Por qué no `ORDER BY nombre`*: la colación por omisión de SQLite es `BINARY`, que ordena por
código de carácter. Pondría `Zoe` antes que `Ángel` y la `Ñ` después de la `Z`, justo lo
contrario de lo que pide el requisito «Orden alfabético español del listado de empleados».
SQLite no trae colaciones locales y `expo-sqlite` no expone el registro de colaciones propias.

*Alternativa descartada*: guardar una columna con la clave de ordenación. Añade una columna que
hay que mantener sincronizada con el nombre en cada edición, para ahorrar ordenar veinte
cadenas en memoria. No compensa.

*Consecuencia útil*: el orden lo produce el mismo código que ya ordena las filas del cuadrante,
así que los dos órdenes no pueden divergir.

### D7. Versionado del esquema con `PRAGMA user_version` y una lista de migraciones

`user_version` es un entero que SQLite guarda en la cabecera del fichero. Al abrir la base de
datos, la capa de datos lo lee y aplica en orden las migraciones cuyo número sea mayor,
**cada una dentro de su propia transacción**, subiendo `user_version` al final de cada una. Una
migración es una función que recibe la base de datos y ejecuta su DDL; el número de versión es
su posición en la lista.

Reglas que este change fija para siempre:

- Una migración ya publicada **no se edita nunca**: los cambios posteriores se hacen añadiendo
  una migración nueva al final de la lista.
- La versión 1 es la que crea la tabla `empleados` y su índice.
- Si `user_version` es **mayor** que el número de migraciones que conoce la app, la base de
  datos viene de una versión posterior y no se abre (ver D8). SQLite abriría el fichero tan
  ricamente y la app leería columnas que no entiende.

*Alternativa descartada*: una tabla propia de migraciones aplicadas. Da más información
—cuándo se aplicó cada una— que aquí no sirve para nada, y cuesta una tabla y una consulta más
en cada arranque. `user_version` ya está en el fichero y no cuesta nada.

*Alternativa descartada*: el ayudante de migraciones que trae `expo-sqlite`. Sube la versión
por su cuenta y ata el esquema a la forma que esa librería espera, cuando lo que hay que
resolver son quince líneas de bucle. La lista explícita se lee de un vistazo y no depende de
que la librería no cambie de criterio.

### D8. La apertura fallida no destruye nada y deja el almacén en un estado que no acepta escrituras

Si `openDatabaseSync`, el `PRAGMA foreign_keys` o alguna migración fallan, la capa de datos
**no** borra el fichero, **no** lo recrea y **no** devuelve un almacén vacío que se dejaría
escribir: eso presentaría al encargado una plantilla vacía y le invitaría a teclearla otra vez
encima de los datos que sí están ahí. Lo que expone es un estado de "no disponible", del que
toda lectura y toda escritura son rechazadas.

**Cerrado el 07/09/2026**: el encargado ve, en lugar del cuadrante y ocupando la app entera, un
aviso en lenguaje llano —sus datos no se han podido abrir, no se ha borrado nada— con una acción
para volver a intentarlo. Ninguna otra pantalla es alcanzable mientras tanto.

*Consecuencia sobre la interfaz*: `AlmacenCuadrante` **no cambia**. Como el aviso sustituye a
toda la app, ninguna pantalla llega a consultar el almacén en ese estado, así que no hace falta
que la interfaz sepa expresar "no disponible". El estado vive donde se abre la base de datos
—`app/_layout.tsx`—, que decide entre pintar el aviso o el `Stack` de siempre. Lo que se instala
con `instalarAlmacen` cuando la apertura falla es un almacén que lanza en toda operación: no un
almacén vacío que se dejaría escribir. Es una red de seguridad, no la vía normal; si alguna vez
se dispara es que una pantalla se ha colado por delante del aviso, y conviene que se note.

### D10. El SQL corre contra una interfaz de cuatro métodos, no contra `expo-sqlite`

`src/datos/sqlite/bd.ts` declara `BaseDeDatos`: `ejecutar(sql)`, `escribir(sql, ...params)`,
`leer(sql, ...params)` y `cerrar()`. `src/datos/sqlite/bdExpoSqlite.ts` la implementa sobre
`openDatabaseSync` y es **el único módulo del proyecto que importa `expo-sqlite`**.
`src/pruebas/bdDePrueba.ts` la implementa sobre `node:sqlite`, y solo los tests lo importan.

*Por qué hizo falta*: `expo-sqlite` no se puede ejecutar de verdad bajo `jest-expo` en Node. Su
propio código lo dice —`web/SQLiteModule.node.ts`: «expo-sqlite is not supported on server
runtime, this file contains a dummy implementation»—: en Node abre, ejecuta y devuelve vacío
**sin lanzar ningún error**. Un test contra esa implementación pasaría diga lo que diga el SQL,
que es peor que no tener test. La ruta nativa, por su parte, necesita el módulo nativo, que en
Node no existe.

Sin este seam, los escenarios de durabilidad, de migración, de índice único y de orden se
quedaban sin comprobación automática y había que llevárselos todos a
`docs/verificacion-manual.md` —que además hoy no se puede recorrer, porque los escenarios de
arranque piden un build instalable que el proyecto todavía no tiene—. Con él, `npm test`
ejecuta el SQL real de la app contra SQLite real: `PRAGMA user_version`, `AUTOINCREMENT`, el
índice único sobre `nombre_comparable`, `PRAGMA foreign_keys` y el cierre y reapertura de un
fichero de verdad.

*Por qué `node:sqlite` y no `better-sqlite3`*: viene dentro de Node 22, que es el que ejecuta la
suite, así que no añade ninguna dependencia ni ningún binario que compilar. Es SQLite el mismo,
comprobado con `PRAGMA user_version`, `AUTOINCREMENT` y el índice único.

*Trade-off*: los tests no ejercitan el adaptador de `expo-sqlite`, que queda cubierto solo por
la verificación en el dispositivo. Es una envoltura de cuatro métodos sin lógica propia, y es lo
máximo que se puede cubrir mientras la librería no funcione fuera del dispositivo.

### D9. Un único fichero, con nombre neutro, en el directorio de la app

Una sola base de datos, un solo fichero, en el directorio privado que `expo-sqlite` usa por
omisión (`SQLite/` dentro del almacenamiento de la app). Sin cifrado propio: la protección es
la del almacenamiento privado de la aplicación más el desbloqueo del móvil, tal y como fija el
contexto del proyecto.

El nombre del fichero **no** puede aludir al nombre comercial de la app, al del local ni al del
responsable: el contexto del proyecto dice que ninguno de los tres se fija en código.

## Risks / Trade-offs

- **`expo-sqlite` no funciona igual fuera del dispositivo** (Node en los tests, y el navegador
  con `npm run web`) → Los tests de UI existentes no se ven afectados: siguen inyectando
  `crearAlmacenEnMemoria` con `instalarAlmacen`, que no toca SQLite. Los escenarios de esta
  capability se comprueban contra `node:sqlite` a través del seam de D10.

  **En web la app arranca directamente en el aviso de almacenamiento**, y es correcto: ahí no
  hay base de datos que abrir. Comprobado el 07/09/2026 sobre el servidor de desarrollo, por dos
  motivos independientes, cualquiera de los dos suficiente:

  1. La API síncrona de `expo-sqlite` en web pasa por `invokeWorkerSync`, que hace
     `new SharedArrayBuffer(4)`. El navegador solo expone `SharedArrayBuffer` a una página
     *cross-origin isolated*, y el servidor de Expo no manda `Cross-Origin-Opener-Policy` ni
     `Cross-Origin-Embedder-Policy`. Lanza en la primera apertura.
  2. `getWorker()` carga `new Worker(new URL('./worker', location.href))`, y bajo expo-router
     `/worker` devuelve el HTML de la app con `content-type: text/html`, no el worker.

  **Decisión (07/09/2026): no se arregla.** El producto es un binario instalable en el móvil del
  encargado; web no es un objetivo y arreglarlo pide tocar `metro.config.js` y cómo se empaqueta
  ese worker, con resultado incierto. `npm run web` deja de servir para mirar esta app: se mira
  con `npx expo start` en el móvil. Se descartó montar en web un almacén en memoria porque es
  justo lo que D8 prohíbe —una plantilla vacía que además se deja escribir—, y tenerlo en una
  plataforma y no en otra invita a comprobar ahí cosas que no significan nada.

  Para que esto no haya que volver a investigarlo, `abrirAlmacenamiento` escribe el fallo real en
  la consola bajo `__DEV__`: el aviso sigue sin enseñarle ningún detalle técnico al encargado, y
  quien desarrolla ve por qué no abrió.

- **Las escrituras síncronas bloquean el hilo de JavaScript** (D2) → A esta escala es
  imperceptible. El riesgo real llegaría con la tabla de horas registradas, que es de otro
  change y puede decidir otra cosa entonces.

- **Una migración con un error deja la base de datos a medio migrar** → Cada migración va en su
  propia transacción, así que una que falla se deshace entera y `user_version` no sube. La app
  queda en la versión anterior y vuelve a intentarlo en el siguiente arranque, en lugar de
  quedarse con medio esquema.

- **Convivencia entre datos persistentes y datos en memoria** hasta el change de turnos → Los
  empleados sobreviven al cierre de la app y sus turnos no. Durante ese intervalo, reabrir la
  app deja la plantilla intacta y el cuadrante vacío. Es raro de ver y conviene no dejar la
  aplicación publicada en ese estado intermedio, pero no rompe ninguna spec: `panel-empleados`
  y `cuadrante-semanal` no dicen nada sobre qué sobrevive al cierre.

- **La forma comparable del nombre se calcula en TypeScript** (D4) → Si esa función cambiara,
  el índice de la base de datos guardaría formas calculadas con dos criterios distintos y una
  unicidad podría colarse. Es un riesgo que se materializa solo si alguien cambia
  `formaComparable`; quien lo haga necesita una migración que recalcule la columna, y conviene
  que el módulo lo diga en un comentario.

- **`AUTOINCREMENT` y el fin del rango** → Se agota tras 9.223.372.036.854.775.807 altas.
  Anotado por completitud.

## Migration Plan

No hay despliegue ni datos existentes: en el dispositivo del encargado no hay hoy ningún
fichero de base de datos, así que la primera ejecución tras instalar esta versión es la que lo
crea vacío. La vuelta atrás es desinstalar la app, que se lleva su almacenamiento.

Dentro del código, la sustitución es en un solo punto: la implementación que se pasa a
`instalarAlmacen`. La implementación en memoria **no se borra** —los tests de UI la usan— y
sigue siendo la que da servicio a turnos, ausencias y vacaciones mientras la de SQLite se ocupa
de los empleados.

## Open Questions

Las dos que había quedaron respondidas el **07/09/2026**, al empezar a implementar:

- **¿Cómo se comprueban automáticamente los escenarios de esta capability?** Con el seam de
  cuatro métodos de D10: el SQL de la app corre en los tests contra `node:sqlite`. Se comprobó
  antes de decidir que `expo-sqlite` bajo `jest-expo` es una implementación vacía que no lanza
  errores, y que `node:sqlite` soporta lo que este esquema necesita.

- **¿Qué observa el encargado cuando la base de datos no puede abrirse?** Un aviso que ocupa la
  app entera, con una acción para volver a intentarlo. Recogido ya en el requisito
  «Comportamiento cuando el almacenamiento no puede abrirse» de la spec y en D8.
