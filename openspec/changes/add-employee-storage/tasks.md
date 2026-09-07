# Tareas

Referencia de comportamiento: `specs/almacenamiento-empleados/spec.md`. Decisiones técnicas y
su porqué: `design.md` — se citan como D1…D9.

**Frontera de este change**: la interfaz `AlmacenCuadrante` de `src/datos/almacenCuadrante.ts`
no cambia y ninguna pantalla se toca. La implementación en memoria **no se borra**: los tests
de UI la siguen inyectando con `instalarAlmacen`, y sigue atendiendo turnos, ausencias y
vacaciones, que son de changes posteriores.

**Huecos abiertos que bloquean tareas concretas** (ver el listado al final de cada una):

- La spec deja sin decidir qué observa el encargado cuando la base de datos no puede abrirse.
  Bloquea 5.2 y 5.3.
- Está sin confirmar si `expo-sqlite` se puede ejecutar bajo `jest-expo` en Node. Determina la
  forma de las tareas 6.x.

## 1. Dependencia y apertura de la base de datos

- [ ] 1.1 Añadir `expo-sqlite` a `package.json` con la versión que corresponde a Expo SDK 57 e
  instalarlo con `npx expo install expo-sqlite`. **Acepta cuando**: `npm run typecheck` y
  `npm test` siguen pasando sin ningún cambio en el código, y `package.json` no ha ganado
  ninguna otra dependencia. *Sin dependencias previas.*

- [ ] 1.2 Crear `src/datos/sqlite/conexion.ts` que abra con `openDatabaseSync` el único fichero
  de base de datos, con nombre neutro que no aluda al nombre comercial de la app, al del local
  ni al del responsable (D9), y que ejecute `PRAGMA foreign_keys = ON` en cada apertura (D5).
  **Acepta cuando**: un test comprueba que tras abrir, `PRAGMA foreign_keys` devuelve `1`, y
  que dos aperturas seguidas del mismo fichero devuelven la misma base con los mismos datos.
  *Depende de 1.1.*

## 2. Versionado del esquema y migraciones

- [ ] 2.1 Crear `src/datos/sqlite/migraciones.ts` con la lista ordenada de migraciones y el
  bucle que lee `PRAGMA user_version`, aplica en orden las de número mayor —cada una dentro de
  su propia transacción— y sube `user_version` al terminar cada una (D7). **Acepta cuando**:
  un test parte de una base vacía, la migra y comprueba que `user_version` acaba en el número
  de migraciones conocidas; y otro test, con una migración que lanza un error, comprueba que
  `user_version` no ha subido y que el esquema quedó como estaba.
  *Depende de 1.2.*

- [ ] 2.2 Escribir en `src/datos/sqlite/migraciones.ts` la migración 1, que crea la tabla
  `empleados` con `id INTEGER PRIMARY KEY AUTOINCREMENT`, `nombre TEXT NOT NULL`,
  `nombre_comparable TEXT NOT NULL`, `telefono TEXT`, `email TEXT`, `nota TEXT`, y el índice
  `CREATE UNIQUE INDEX empleados_nombre_comparable ON empleados (nombre_comparable)` (D3, D4).
  **Acepta cuando**: un test sobre una base recién migrada comprueba que la tabla existe, que
  no tiene ninguna fila y que insertar dos filas con el mismo `nombre_comparable` falla.
  *Depende de 2.1.*

- [ ] 2.3 Rechazar en `src/datos/sqlite/migraciones.ts` la base de datos cuyo `user_version` sea
  **mayor** que el número de migraciones conocidas, sin tocar su contenido (D7). **Acepta
  cuando**: un test pone `user_version` a un número por encima del último, intenta migrar y
  comprueba que la operación falla, que `user_version` no ha cambiado y que las filas que había
  siguen ahí. *Depende de 2.2.*

- [ ] 2.4 Escribir en la cabecera de `src/datos/sqlite/migraciones.ts` la regla de que una
  migración ya publicada no se edita nunca y de que todo cambio posterior de esquema es una
  migración nueva al final de la lista, junto con la restricción de que toda tabla futura que
  se refiera a un empleado lo hace con `REFERENCES empleados(id) ON DELETE CASCADE` (D5).
  **Acepta cuando**: leyendo el módulo se encuentran las dos reglas escritas, con su porqué.
  *Depende de 2.2.*

## 3. Reglas del nombre compartidas con la base de datos

- [ ] 3.1 Exportar `formaComparable` desde `src/dominio/empleado.ts`, hoy privada, y anotar en
  su comentario que la columna `nombre_comparable` guarda su resultado, de forma que cambiarla
  obliga a una migración que recalcule esa columna (D4). **Acepta cuando**: los tests que ya
  existen en `src/dominio/__tests__/empleado.test.ts` siguen pasando y un test nuevo comprueba
  que `formaComparable` da el mismo resultado para `Ana`, ` ana ` y `ANA`, y distinto para
  `Ana G.`. *Sin dependencias previas; 4.2 la necesita.*

## 4. Operaciones de empleados sobre SQLite

- [ ] 4.1 Crear `src/datos/sqlite/almacenEmpleadosSqlite.ts` con la lectura de la plantilla y
  de una ficha: `listarEmpleados`, que devuelve las filas ordenadas con
  `ordenarEmpleadosPorNombre` de `src/dominio/orden.ts` y **no** con `ORDER BY` (D6), y
  `leerEmpleado`, que devuelve `null` cuando el empleado ya no está. El `id` de la fila se
  convierte a texto en el borde del módulo (D3). **Acepta cuando**: unos tests cubren los
  escenarios «Listar una plantilla con acentos y con Ñ», «El orden ignora las mayúsculas» y la
  lectura de una ficha inexistente. *Depende de 2.2.*

- [ ] 4.2 Implementar en `src/datos/sqlite/almacenEmpleadosSqlite.ts` el alta: sanear los campos
  con `sanearCampo`, calcular `nombre_comparable` con `formaComparable`, insertar en una sola
  transacción y devolver `null` sin tocar la plantilla cuando el nombre está vacío o cuando el
  índice único rechaza la inserción, traduciendo ese fallo al mismo `null` que devuelve hoy la
  implementación en memoria (D4). **Acepta cuando**: unos tests cubren los escenarios «Guardar
  un empleado solo con nombre», «Un empleado sin nombre no se guarda», «Un nombre repetido no
  se guarda», «Los campos se guardan sin los espacios de los extremos», «Un alta se ve en el
  listado siguiente» y «Una escritura rechazada no deja rastro». *Depende de 4.1 y de 3.1.*

- [ ] 4.3 Implementar en `src/datos/sqlite/almacenEmpleadosSqlite.ts` la edición campo a campo:
  `editarNombre`, que actualiza `nombre` y `nombre_comparable` en la misma sentencia y devuelve
  `false` sin guardar si queda vacío o repetido —sin que el propio empleado cuente como
  repetido consigo mismo—, y `editarTelefono`, `editarEmail` y la edición de la nota, que
  admiten dejar el campo vacío sin afectar a los demás. **Acepta cuando**: unos tests cubren los
  escenarios «Una edición se ve en la lectura siguiente», «Corregir las mayúsculas del propio
  nombre sí se guarda», «Vaciar el email de un empleado» y «Cambiar un nombre cambia su
  posición en el listado». *Depende de 4.2.*

- [ ] 4.4 Implementar en `src/datos/sqlite/almacenEmpleadosSqlite.ts` la baja como un único
  `DELETE FROM empleados WHERE id = ?`, sin código que recorra ninguna otra tabla (D5).
  **Acepta cuando**: unos tests cubren los escenarios «Una baja se ve en la lectura siguiente»
  y «Reutilizar el nombre de un empleado dado de baja», y un test comprueba que tras dar de
  baja y dar de alta con el mismo nombre el identificador es distinto del que tenía el
  anterior. *Depende de 4.3.*

- [ ] 4.5 Hacer que cada escritura aceptada de `src/datos/sqlite/almacenEmpleadosSqlite.ts`
  avise a los oyentes de `suscribirse`, igual que hace hoy la implementación en memoria, y que
  una escritura rechazada no avise a nadie. **Acepta cuando**: un test suscribe un oyente,
  comprueba que un alta válida lo llama una vez y que un alta con nombre repetido no lo llama.
  *Depende de 4.4.*

## 5. Enganche con la app

- [ ] 5.1 Componer en `src/datos/almacenCuadrante.ts` un almacén que atienda las operaciones de
  empleados con `almacenEmpleadosSqlite` y el resto —celdas del cuadrante, ausencias y
  vacaciones— con la implementación en memoria que ya existe, cumpliendo `AlmacenCuadrante` sin
  cambiar ni una firma. **Acepta cuando**: `npm run typecheck` pasa, `npm test` pasa sin tocar
  ningún test de `src/ui/__tests__/`, y un `grep` confirma que ningún fichero de `app/` ni de
  `src/ui/` importa nada de `src/datos/sqlite/`. *Depende de 4.5.*

- [ ] 5.2 Abrir y migrar la base de datos al arrancar la app desde `app/_layout.tsx`, antes de
  la primera lectura, y llamar a `instalarAlmacen` con el almacén compuesto de 5.1; cuando la
  apertura o la migración fallan, dejar el almacén en un estado que rechaza toda lectura y toda
  escritura, sin borrar, sobrescribir ni recrear el fichero (D8). **Acepta cuando**: unos tests
  cubren los escenarios «Arrancar la app por primera vez», «Dar de alta al primer empleado en
  una plantilla recién creada» y «Arrancar dos veces seguidas no vuelve a adaptar nada», y un
  test comprueba que con un fichero ilegible no se acepta ninguna escritura y el fichero queda
  intacto. *Depende de 5.1.* **Bloqueada en parte por el hueco de qué observa el encargado
  cuando la base de datos no puede abrirse: la forma de exponer ese estado a través de
  `AlmacenCuadrante` depende de esa respuesta.*

- [ ] 5.3 Mostrar al encargado lo que corresponda cuando la base de datos no puede abrirse, en
  `[hueco: ruta —depende de si es una pantalla propia, un estado de las que ya hay o un aviso
  sobre ellas]`. **Acepta cuando**: quedan cubiertos los escenarios «Arrancar con el
  almacenamiento dañado» y «Arrancar con un almacenamiento de una versión posterior de la app»,
  en un test o en `docs/verificacion-manual.md` según lo que se decida.
  *Depende de 5.2.* **Bloqueada por el hueco de qué observa el encargado: no se empieza hasta
  que esté respondido.*

- [ ] 5.4 Actualizar el comentario de cabecera de `src/datos/almacenCuadrante.ts`, que hoy
  anuncia toda la capa como provisional y la persistencia como un change sin especificar, para
  que diga qué parte va ya contra SQLite y qué parte sigue en memoria hasta el change de
  turnos. **Acepta cuando**: leyendo el módulo no queda ninguna afirmación falsa sobre lo que
  se pierde al cerrar la app. *Depende de 5.1.*

## 6. Verificación de los escenarios de la spec

- [ ] 6.1 Confirmar si `expo-sqlite` se puede ejecutar bajo `jest-expo` en Node y dejar escrito
  el resultado en `[hueco: ruta — `docs/verificacion-manual.md` si la respuesta obliga a
  comprobar en el dispositivo, o la cabecera del fichero de tests si no]`. **Acepta cuando**:
  un test mínimo que abre una base de datos en memoria y crea una tabla o bien pasa con
  `npm test`, o bien queda documentado por qué no puede pasar y qué escenarios se trasladan a
  la verificación manual. *Depende de 1.1. Determina la forma de 6.2 y 6.3.*

- [ ] 6.2 Cubrir en tests los escenarios de durabilidad y de actualización del esquema, que solo
  significan algo contra SQLite en fichero: «La ficha de un empleado sigue ahí tras reabrir la
  app», «La plantilla entera sobrevive a varias reaperturas», «Una baja también sobrevive al
  cierre de la app», «Dar de baja a un empleado no deja nada suyo» y «Abrir la app tras
  actualizarla conservando la plantilla», cerrando y reabriendo la base de datos entre la
  escritura y la lectura. **Acepta cuando**: los cinco escenarios pasan citando su nombre
  literal, o —si 6.1 lo impide— quedan anotados en `docs/verificacion-manual.md` con el formato
  que ese documento ya fija. *Depende de 5.2 y de 6.1.*

- [ ] 6.3 Recorrer la spec escenario a escenario y comprobar que los **25** de
  `specs/almacenamiento-empleados/spec.md` están citados por su nombre literal en un test o en
  `docs/verificacion-manual.md`, incluidos «Los datos de contacto se quedan en el dispositivo»
  —que se comprueba leyendo el código: ningún módulo de `src/datos/` hace peticiones de red ni
  escribe fuera del directorio de la app— y los dos del hueco de apertura fallida. **Acepta
  cuando**: existe la lista de los 25 nombres con dónde queda comprobado cada uno, ninguno sin
  cubrir, y `npm test` pasa entero. *Depende de 5.3, 5.4 y 6.2 — es la última tarea del change.*
