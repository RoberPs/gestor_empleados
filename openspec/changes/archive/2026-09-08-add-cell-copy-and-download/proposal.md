## Why

Quedaban dos cosas pendientes de los changes anteriores, y las dos las pidió el encargado el 08/09/2026 después de usar la app una semana entera en la sala:

1. **Planificar repite mucho.** Un camarero que hace el mismo turno de lunes a viernes obliga hoy a abrir la celda, crear el turno y teclear cuatro horas **cinco veces**. Con 20 empleados y siete días, la semana se planifica a base de repetir la misma operación decenas de veces, de pie y con una mano. La app ya sabe qué hay en una celda: lo que le falta es poder llevarlo a otra.

2. **El cuadrante sale del móvil, pero no se queda en él.** `add-schedule-export` dejó la exportación en la hoja de compartir del sistema, y ahí el encargado elige a quién mandarlo. Lo que no puede es **quedarse el fichero**: guardarlo en su móvil, en la carpeta que él quiera, para tenerlo a mano o volver a mandarlo semanas después. Hoy la única copia del cuadrante fuera del dispositivo es la que dejó en una conversación de mensajería.

## What Changes

**Copiar el contenido de una celda y pegarlo en otra**

- Las acciones de una celda ganan **copiar**: se guarda lo que esa celda contiene —sus turnos planificados, su ausencia o sus vacaciones— para poder repetirlo en otra.
- Las acciones de una celda ganan **pegar**, ofrecida solo cuando hay algo copiado. Pega en la celda tocada lo que se copió, sea de otro empleado, de otro día o de otra semana.
- Pegar sobre una celda que ya tiene contenido **pide confirmación** antes de sustituirlo.
- Lo copiado se conserva mientras la app está abierta y se puede pegar tantas veces como haga falta.

**Guardar el documento en el dispositivo, además de compartirlo**

- La acción de exportar pasa a ofrecer **dos caminos**: compartir la semana —lo que ya hacía— y **guardar una copia** del PDF en el dispositivo.
- Guardar abre el **selector de carpetas del sistema**: el encargado elige dónde va el fichero, con el mismo nombre de semana que ya lleva.
- Compartir sigue funcionando exactamente igual. El documento guardado es el mismo PDF que el compartido, con las mismas reglas de contenido y de privacidad.

Decisiones tomadas el 08/09/2026:

- **La copia es de celda a celda, no de día ni de fila.** Copiar una columna entera o la fila de un empleado a otro resuelve un caso que nadie ha pedido y multiplica las preguntas —¿qué pasa con las celdas ocupadas del destino?, ¿se copian también las ausencias?—. Celda a celda cubre lo que duele: repetir el mismo turno.
- **Pegar sobre contenido pide confirmación.** La app no ofrece deshacer nada, y ya exige confirmar para eliminar. Pegar encima de un turno lo borra igual que eliminarlo, así que se confirma igual. Sobre celda vacía no se pregunta nada: no hay nada que perder.
- **Lo copiado no se guarda en el almacenamiento.** Vive mientras la app está abierta y desaparece al cerrarla. Es un apaño de planificación, no un dato del local, y guardarlo en SQLite obligaría a migrar la base de datos para algo que se usa durante treinta segundos.
- **Se copia el contenido, no el turno concreto.** Al pegar se crean turnos nuevos en la celda destino; el turno original se queda donde estaba. Copiar no mueve ni vacía la celda de origen.
- **Guardar abre el selector de carpetas, no escribe en Descargas por su cuenta.** Esto **revisa la decisión del 08/09/2026 de `add-schedule-export`** («la hoja de compartir, no la carpeta de Descargas»). Aquella decisión sigue siendo buena para *compartir*; lo que se ha visto después es que compartir no cubre quedarse el fichero. El selector del sistema es el único camino por el que la app puede escribir fuera de su carpeta sin pedir permisos de almacenamiento, y deja al encargado eligiendo el destino en lugar de tener que buscar dónde ha ido a parar.
- **Guardar no sustituye a compartir.** Son dos cosas distintas —mandárselo a la plantilla y quedárselo— y la app ofrece las dos, no una que haga las veces de la otra.
- **La app sigue sin guardar copia propia ni historial.** El PDF guardado es del encargado, en la carpeta que él eligió; la app no lo indexa, no lo recuerda y no lo vuelve a abrir.

## Capabilities

### New Capabilities

<!-- Ninguna: las dos piezas amplían capacidades que ya existen. -->

### Modified Capabilities

- `cuadrante-semanal`: las acciones de celda ganan copiar y pegar, y aparece el comportamiento de lo copiado —qué se copia, cuánto dura y qué pasa al pegar sobre contenido—.
- `exportacion-cuadrante`: el documento, además de entregarse por la hoja de compartir, puede guardarse en el dispositivo en la carpeta que elija el encargado.

## Impact

- **Dependencias**: ninguna nueva prevista. `expo-file-system` ya está declarada y es la que ofrece el selector de carpetas del sistema; si al implementarlo resultara insuficiente en Android, la alternativa se decide en `design.md` y se registra aquí.
- **Datos**: ninguno nuevo en el almacenamiento. Lo copiado vive en memoria mientras la app está abierta; no hay migración de SQLite.
- **Código**: `src/ui/accionesDeCelda.ts` (dos acciones nuevas y su disponibilidad), `src/ui/PantallaCuadrante.tsx` (dónde vive lo copiado y el pegado con confirmación), `src/exportacion/compartirElCuadrante.ts` (el guardado, que comparte la producción del PDF con el compartir) y la acción de la cabecera.
- **Privacidad**: el PDF guardado sale de la carpeta de la app y queda en el dispositivo del encargado, donde otras apps pueden leerlo. Es el mismo documento que ya se comparte y las reglas de contenido no cambian: ni teléfono, ni email, ni nota, ni motivo de la ausencia.
- **Tests**: qué acciones ofrece cada estado de celda, qué produce el pegado y cuándo se pide confirmación se comprueban en la suite. Que el selector de carpetas se abra y el fichero acabe donde el encargado dijo solo se comprueba en el dispositivo, y va a `docs/verificacion-manual.md`.
- **Riesgo**: la hoja de acciones de la celda. Con dos turnos ya ofrece seis acciones; añadir copiar y pegar la deja en ocho, y una hoja que hay que recorrer con el pulgar es justo lo que el principio de uso real prohíbe.
