## Why

Hoy la plantilla vive en memoria: `src/datos/almacenCuadrante.ts` guarda los empleados en
variables del proceso y todo desaparece al cerrar la app. El encargado puede dar de alta a
sus veinte empleados, rellenar sus fichas y encontrarse la plantilla vacía a la mañana
siguiente. Sin datos que sobrevivan al cierre, el panel de empleados no es utilizable en el
local y el cuadrante semanal no tiene sobre qué filas dibujarse.

Este change pone la primera pieza de persistencia real: la base de datos SQLite local y la
tabla de empleados. Es la base sobre la que se apoyarán después los turnos planificados, las
ausencias, las vacaciones y las horas registradas, que entran en changes posteriores.

## What Changes

- Apertura e inicialización de una única base de datos SQLite local con `expo-sqlite`, en un
  solo fichero del almacenamiento del dispositivo.
- Versionado de esquema y migraciones, ejecutados automáticamente al arrancar la app, sin
  intervención del encargado.
- Tabla de empleados con los campos de la ficha: nombre, teléfono, email y nota.
- Operaciones de lectura y escritura de empleados: alta, edición, borrado y listado ordenado
  alfabéticamente por nombre según el orden alfabético del español.
- Comportamiento definido ante la primera ejecución (base de datos inexistente, plantilla
  vacía) y ante la reapertura de la app (los datos siguen ahí).
- Comportamiento definido cuando la base de datos no puede abrirse, incluido un aviso que ocupa
  la app entera, con acción de volver a intentarlo, en lugar del cuadrante.

Fuera de este change, y no preparados de antemano: tablas de turnos planificados, ausencias,
vacaciones y horas registradas; pantallas, componentes y navegación del panel de empleados;
store de Zustand; exportación PDF/CSV; sincronización; copia de seguridad automática.

No hay **BREAKING**: ningún comportamiento observable del panel de empleados ni del cuadrante
cambia mientras el almacenamiento se abra bien. Lo que hoy se pierde al cerrar la app pasa a
conservarse.

## Capabilities

### New Capabilities

- `almacenamiento-empleados`: persistencia local de la plantilla — existencia e inicialización
  de la base de datos, durabilidad de los datos de un empleado entre ejecuciones, reflejo de
  alta, edición y borrado en la lectura siguiente, orden alfabético español del listado,
  reglas de validez de los campos de la ficha en la escritura y comportamiento cuando la base
  de datos no puede abrirse.

### Modified Capabilities

- `cuadrante-semanal`: el requisito «El cuadrante semanal es la pantalla de inicio» gana una
  única excepción —el aviso de almacenamiento que no se puede abrir sustituye al cuadrante—,
  porque hasta ahora no existía ningún fichero de datos y por tanto ninguna forma de que la
  apertura fallara. Lo demás del requisito no cambia, y se añade el escenario que fija que la
  plantilla vacía sigue llevando al cuadrante y no al aviso.

`panel-empleados` no cambia: describe comportamiento de pantalla que este change no toca y sus
requisitos siguen siendo válidos palabra por palabra. Este change hace que sigan cumpliéndose
después de cerrar y reabrir la app, que es algo que sus requisitos ya dan por supuesto.

## Impact

- **Código**: `src/datos/almacenCuadrante.ts` sustituye la parte de empleados de su
  implementación en memoria por una que va contra SQLite, **sin cambiar la interfaz
  `AlmacenCuadrante`**. Ni el panel de empleados ni el cuadrante se tocan: no importan
  estructuras internas de ese módulo ni conocen SQLite.
- **Dependencias**: se añade `expo-sqlite`, que ya está fijado en el stack del proyecto. Ni
  ORM, ni capa de abstracción, ni ninguna otra dependencia nueva. Los tests van contra
  `node:sqlite`, que viene dentro de Node y tampoco es una dependencia (ver `design.md` — D10).
- **Arranque**: `app/_layout.tsx` pasa a abrir y migrar la base de datos antes de pintar nada, y
  a decidir entre el `Stack` de siempre y el aviso de almacenamiento que no se puede abrir.
- **Datos del dispositivo**: aparece un fichero de base de datos en el almacenamiento privado
  de la app. Antes de este change no existía ningún fichero de datos.
- **Privacidad**: el teléfono, el email y la nota pasan a quedar escritos en disco. Siguen sin
  salir del dispositivo: no se sincronizan, no se envían a ningún servicio y no entran en las
  exportaciones de cuadrante ni de horas. El diseño lo permite porque la base de datos es un
  fichero local en el almacenamiento privado de la app y este change no introduce ninguna vía
  de salida.
- **Convivencia**: turnos, ausencias, vacaciones y horas registradas siguen en memoria hasta
  su propio change. Durante ese intervalo la app tiene una parte persistente (empleados) y una
  parte que se pierde al cerrar (el contenido del cuadrante).

## Supuestos de partida

Supuestos con los que se delimitó este change, adoptados el **07/09/2026**:

1. **(07/09/2026)** Este change cubre solo la infraestructura SQLite y la tabla de empleados.
   Turnos, ausencias, vacaciones y horas registradas entran en changes posteriores.
2. **(07/09/2026)** El borrado de un empleado es físico y definitivo: no hay flag de inactivo
   ni histórico de plantilla.
3. **(07/09/2026)** Hay una sola base de datos, en un único fichero, en el almacenamiento
   local del dispositivo. Sin cifrado propio más allá del que da el sistema operativo.
4. **(07/09/2026)** Las migraciones se ejecutan al arrancar la app, de forma automática y sin
   intervención del encargado.
5. **(07/09/2026)** La app es de un solo usuario y sin concurrencia: no hay dos escrituras
   simultáneas que resolver.

### Supuestos revisados durante la redacción

6. **(07/09/2026)** El supuesto de partida decía que la ficha tiene exactamente tres campos
   (nombre, teléfono, email). **Choca con la spec viva**: `panel-empleados` — «Nota del
   empleado» define además una nota de texto libre por empleado, persistente, siempre editable
   y que puede vaciarse, y `src/dominio/tipos.ts` ya declara `nota?: string` en `Empleado`. Se
   resuelve a favor de la spec viva: **la tabla de empleados guarda cuatro campos —nombre,
   teléfono, email y nota—**. Sin la nota, el escenario «Escribir y modificar la nota de un
   empleado» dejaría de cumplirse en cuanto la app se cerrase.
7. **(07/09/2026)** Las vacaciones que la ficha muestra por rangos **no** son un campo del
   empleado: son días marcados en las celdas del cuadrante, y su persistencia entra con el
   change de turnos. La tabla de empleados no las guarda.

## Decisiones de negocio

- **(07/09/2026) El borrado de un empleado es definitivo y sin histórico.** Al dar de baja a
  un empleado desaparecen también sus turnos planificados, sus ausencias y sus vacaciones de
  cualquier semana, incluidas las ya pasadas. No existe empleado inactivo, ni papelera, ni
  deshacer. Es la decisión que `panel-empleados` — «Baja de un empleado» ya recoge en la
  pantalla; aquí se asume como restricción del esquema, que debe garantizarla por
  construcción y no por disciplina de quien escribe el código.
- **(07/09/2026) La plantilla arranca vacía.** En la primera ejecución no se siembran empleados
  de ejemplo ni datos de demostración: el encargado ve el estado vacío del panel y da de alta
  a su primer empleado.
- **(07/09/2026) Nombre obligatorio y único; teléfono, email y nota opcionales.** Se cierran
  con lo que ya dice `panel-empleados` — «Alta de un empleado» y «Edición de los datos de la
  ficha»: el nombre no puede quedar vacío ni repetir el de otro empleado ignorando mayúsculas
  y espacios sobrantes; el teléfono y el email se guardan tal y como se teclean, sin validar
  formato. La persistencia rechaza la escritura que lo incumpla, en lugar de confiar en que la
  pantalla ya lo haya comprobado.
- **(07/09/2026) Las migraciones son automáticas y silenciosas.** El encargado no ve pantallas
  de actualización de base de datos, ni las autoriza, ni puede saltárselas.
- **(07/09/2026) Sin copia de seguridad automática.** La única copia de seguridad que existe
  sigue siendo la exportación que el encargado lanza a mano, tal y como fija el contexto del
  proyecto. Este change no añade ninguna otra.
