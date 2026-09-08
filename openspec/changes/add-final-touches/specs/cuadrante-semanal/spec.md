## MODIFIED Requirements

### Requirement: Identificación de la semana en pantalla

La pantalla MUST identificar en todo momento qué semana se está mostrando, indicando el rango de fechas de lunes a domingo en formato dd/mm/aaaa.

Cuando la semana mostrada es la semana en curso, la pantalla MUST indicarlo de forma explícita, de manera que el encargado distinga sin contar fechas si está mirando su semana o se ha desplazado a otra.

La identidad del local MUST mostrarse por encima del rango de fechas, y MUST NOT confundirse con él: el nombre del local y el rango de la semana MUST leerse como dos cosas distintas, no como un único título.

#### Scenario: Rango de fechas de la semana visible

- **WHEN** el cuadrante muestra la semana del lunes 7 de septiembre de 2026 al domingo 13 de septiembre de 2026
- **THEN** la pantalla muestra el rango como `07/09/2026 - 13/09/2026`

#### Scenario: La semana en curso se distingue de las demás

- **WHEN** el cuadrante muestra la semana en curso
- **THEN** la pantalla lo indica de forma explícita junto al rango de fechas
- **WHEN** el encargado se desplaza a otra semana
- **THEN** esa indicación desaparece

#### Scenario: El nombre del local y la semana no se confunden

- **WHEN** el nombre del local es `La Esquina café` y el cuadrante muestra la semana `07/09/2026 - 13/09/2026`
- **THEN** el nombre del local se muestra por encima del rango de fechas
- **AND** los dos se distinguen a simple vista como dos datos distintos

### Requirement: Rejilla de empleados por días

El cuadrante MUST presentarse como una rejilla en la que cada fila es un empleado dado de alta y cada columna es un día de la semana, de lunes a domingo en ese orden.

Las filas MUST corresponder siempre a la plantilla dada de alta en el momento de mirar, sea cual sea la semana mostrada. No existe empleado inactivo ni histórico de plantilla: un empleado borrado de la plantilla MUST dejar de tener fila también en las semanas ya pasadas, y un empleado dado de alta hoy MUST tener fila en cualquier semana que se muestre.

Los siete días de la semana MUST ser visibles a la vez sin scroll horizontal, en la orientación vertical del móvil del encargado.

Cada columna MUST estar identificada por su día de la semana y su fecha dentro de la semana mostrada. Cada fila MUST estar identificada por el nombre del empleado.

La fila del empleado MUST mostrar únicamente su nombre. La pantalla MUST NOT mostrar el teléfono ni el email del empleado.

Cuando el nombre del empleado no cabe en su columna, el sistema MUST mostrarlo truncado con puntos suspensivos. El sistema MUST NOT reducir por ello el ancho de las columnas de día.

El nombre de la fila MUST ser pulsable y MUST abrir la ficha de ese empleado, para que el encargado pueda leer entero un nombre que la rejilla trunca y consultar sus datos sin pasar por el panel. Al volver de la ficha, el cuadrante MUST mostrarse en la misma semana en la que estaba.

#### Scenario: La semana completa se ve sin scroll horizontal

- **WHEN** el encargado abre el cuadrante en su móvil en orientación vertical
- **THEN** las siete columnas de lunes a domingo son visibles a la vez
- **AND** no existe scroll horizontal en la rejilla

#### Scenario: Cabeceras de día con su fecha

- **WHEN** el cuadrante muestra la semana `07/09/2026 - 13/09/2026`
- **THEN** la primera columna corresponde al lunes 07 y la última al domingo 13
- **AND** cada cabecera de columna identifica su día de la semana y su día del mes

#### Scenario: Un nombre largo se trunca sin estrechar los días

- **WHEN** la plantilla incluye a un empleado cuyo nombre no cabe en la columna de nombres
- **THEN** su nombre se muestra truncado con puntos suspensivos
- **AND** las siete columnas de día conservan su ancho

#### Scenario: Abrir la ficha desde el nombre de la fila

- **WHEN** el encargado se ha desplazado a la semana `14/09/2026 - 20/09/2026`
- **AND** toca el nombre de Bruno en la columna de nombres
- **THEN** se abre la ficha de Bruno
- **WHEN** toca la acción de volver
- **THEN** ve de nuevo el cuadrante en la semana `14/09/2026 - 20/09/2026`

#### Scenario: Un nombre truncado se lee entero abriendo su ficha

- **WHEN** la rejilla muestra truncado el nombre de `Maricarmen de la Fuente Etxebarria`
- **AND** el encargado toca ese nombre
- **THEN** se abre su ficha, que muestra el nombre completo

#### Scenario: Un empleado borrado desaparece también de las semanas pasadas

- **WHEN** el encargado borra a un empleado de la plantilla
- **AND** navega a una semana pasada en la que ese empleado tenía turnos planificados
- **THEN** esa semana ya no muestra ninguna fila para ese empleado

### Requirement: Toda celda es editable desde el cuadrante

Ninguna celda MUST ser de solo lectura para el encargado. Un toque sobre cualquier celda, sea cual sea su estado, MUST abrir las acciones disponibles para ese empleado y ese día, sin salir del contexto de la semana mostrada.

El estado de la celda MUST NOT depender de la semana a la que pertenece: una celda de una semana ya pasada MUST ofrecer exactamente las mismas acciones que una de la semana en curso o de una futura, sin aviso ni confirmación adicional por ser pasada.

Las acciones ofrecidas MUST depender del estado de la celda:

- Sobre una celda vacía, el sistema MUST ofrecer: crear turno planificado, marcar ausencia y marcar vacaciones.
- Sobre una celda con un turno planificado, el sistema MUST ofrecer: editar ese turno, añadir un segundo turno ese mismo día, sustituir el contenido por ausencia, sustituirlo por vacaciones y eliminar el turno.
- Sobre una celda con dos turnos planificados, el sistema MUST ofrecer: editar cada uno de los dos por separado, eliminar cada uno de los dos por separado, sustituir el contenido por ausencia y sustituirlo por vacaciones. El sistema MUST NOT ofrecer añadir un tercer turno.
- Sobre una celda con ausencia, el sistema MUST ofrecer: ver la ausencia, cambiarla a vacaciones, sustituirla por un turno planificado y eliminarla.
- Sobre una celda con vacaciones, el sistema MUST ofrecer: cambiarlas a ausencia, sustituirlas por un turno planificado y eliminarlas.

Ver la ausencia MUST llevar a la ficha del empleado de esa celda, donde vive el motivo de la ausencia. El sistema MUST NOT mostrar el motivo dentro de la celda ni dentro de las acciones: la rejilla sigue mostrando la ausencia como una etiqueta y nada más. Esa acción MUST ofrecerse tenga o no tenga escrito un motivo ese empleado.

Al terminar o cancelar la acción, el encargado MUST volver al cuadrante en la misma semana desde la que la inició, con la celda ya actualizada si hubo cambio.

Las horas del turno planificado MUST mostrarse siempre en formato 24h `hh:mm`.

Al introducirlas, el sistema MUST admitir las formas naturales de teclear una hora con el teclado numérico de un móvil, y MUST normalizarlas a `hh:mm`: con separador (`9:30`, `09:30`, `9.30`, `9,30`, `9h30`), solo dígitos (`930`, `0930`) y la hora sola cuando es en punto (`9` equivale a `09:00`). El sistema MUST NOT exigir una única forma de escritura, y MUST seguir rechazando lo que no sea una hora del día.

El sistema MUST NOT permitir guardar un turno planificado cuya hora de fin coincide con su hora de inicio, e informará de por qué no puede guardarse sin perder lo ya introducido. Una hora de fin anterior a la de inicio MUST aceptarse: es un turno que cruza la medianoche.

Cuando el encargado corrige una hora, esa explicación MUST desaparecer: no debe leerse que sigue sin poder guardarse un turno que ya es válido.

Eliminar un turno planificado, una ausencia o unas vacaciones MUST requerir una confirmación explícita del encargado antes de que el contenido desaparezca de la celda. Si el encargado no confirma, la celda MUST conservar el contenido que tenía. El sistema MUST NOT ofrecer deshacer una eliminación ya confirmada.

#### Scenario: Crear un turno planificado en una celda vacía

- **WHEN** el encargado toca una celda vacía
- **THEN** se le ofrece crear turno planificado, marcar ausencia o marcar vacaciones
- **WHEN** crea un turno planificado de 09:00 a 17:00
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda muestra `09:00` y `17:00`

#### Scenario: Editar un turno planificado existente

- **WHEN** el encargado toca una celda con un turno planificado de 09:00 a 17:00
- **THEN** se le ofrece editar el turno planificado
- **WHEN** cambia la hora de fin a 15:00
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda muestra `09:00` y `15:00`

#### Scenario: Ver una celda de vacaciones y editarla desde el propio cuadrante

- **WHEN** la empleada Ana tiene vacaciones el martes
- **AND** el encargado toca esa celda desde el cuadrante
- **THEN** se le ofrece cambiar las vacaciones por ausencia, sustituirlas por un turno planificado o eliminarlas
- **WHEN** las sustituye por un turno planificado de 12:00 a 20:00
- **THEN** vuelve al cuadrante en la misma semana
- **AND** la celda de Ana del martes muestra `12:00` y `20:00`
- **AND** ya no se identifica como vacaciones

#### Scenario: Añadir un segundo turno el mismo día

- **WHEN** el encargado toca una celda con un turno planificado de 12:00 a 16:00
- **THEN** se le ofrece añadir un segundo turno ese mismo día
- **WHEN** añade un turno de 20:00 a 00:00
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda muestra `12:00` y `16:00`, y debajo `20:00` y `00:00`
- **WHEN** vuelve a tocar esa celda
- **THEN** ya no se le ofrece añadir otro turno

#### Scenario: Eliminar solo uno de los dos turnos de un día

- **WHEN** el encargado toca una celda con un turno de 12:00 a 16:00 y otro de 20:00 a 00:00
- **AND** elige eliminar el turno de 12:00 a 16:00 y lo confirma
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda muestra únicamente `20:00` y `00:00`

#### Scenario: Eliminar el contenido de una celda

- **WHEN** el encargado toca una celda con turno planificado y elige eliminarlo
- **THEN** el sistema le pide que confirme la eliminación
- **WHEN** confirma
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda se presenta vacía

#### Scenario: Desistir de una eliminación

- **WHEN** el encargado toca una celda con un turno planificado de 09:00 a 17:00 y elige eliminarlo
- **AND** no confirma la eliminación
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda sigue mostrando `09:00` y `17:00`

#### Scenario: Un turno cuyo fin coincide con su inicio no se guarda

- **WHEN** el encargado crea un turno planificado de 09:00 a 09:00
- **THEN** el sistema no lo guarda
- **AND** le indica por qué no puede guardarse
- **AND** las horas que había introducido siguen ahí para corregirlas

#### Scenario: Teclear la hora sin los dos puntos

- **WHEN** el encargado crea un turno planificado y teclea `930` como hora de inicio y `1745` como hora de fin
- **THEN** el sistema lo guarda
- **AND** la celda muestra `09:30` y `17:45`

#### Scenario: Corregir una hora que el sistema no entiende

- **WHEN** el encargado intenta guardar un turno con una hora que el sistema no entiende
- **THEN** el sistema le indica por qué no puede guardarse
- **WHEN** corrige esa hora
- **THEN** esa explicación desaparece
- **AND** puede guardar el turno

#### Scenario: Crear un turno que cruza la medianoche

- **WHEN** el encargado toca la celda del viernes de un empleado y crea un turno planificado de 20:00 a 02:00
- **THEN** el sistema lo guarda
- **AND** la celda del viernes muestra `20:00` y `02:00`

#### Scenario: Editar una celda de una semana ya pasada

- **WHEN** el encargado navega a una semana ya pasada
- **AND** toca una celda de esa semana
- **THEN** se le ofrecen las mismas acciones que en la semana en curso
- **AND** no aparece ningún aviso ni confirmación por tratarse de una semana pasada

#### Scenario: Cancelar sin cambiar nada

- **WHEN** el encargado toca una celda y cancela sin elegir ninguna acción
- **THEN** vuelve al cuadrante en la misma semana
- **AND** la celda conserva el contenido que tenía

#### Scenario: Editar una celda de una semana distinta de la actual

- **WHEN** el encargado ha navegado a la semana siguiente
- **AND** toca una celda de esa semana y crea un turno planificado
- **THEN** vuelve al cuadrante mostrando la semana siguiente, no la semana en curso
- **AND** el turno planificado aparece en la celda de esa semana

#### Scenario: Ver la ausencia desde la celda

- **WHEN** la celda de Bruno del martes está marcada como ausencia
- **AND** el encargado toca esa celda
- **THEN** entre las acciones ofrecidas está ver la ausencia
- **WHEN** la elige
- **THEN** se abre la ficha de Bruno, donde puede leer y escribir el motivo de la ausencia
- **WHEN** toca la acción de volver
- **THEN** ve de nuevo el cuadrante en la misma semana

#### Scenario: La celda de ausencia no muestra el motivo

- **WHEN** Bruno tiene escrito el motivo `Baja médica` y su celda del martes está marcada como ausencia
- **THEN** la celda muestra únicamente la etiqueta de ausencia
- **AND** no muestra el motivo ni ninguna marca de que lo tenga escrito

#### Scenario: Ver la ausencia de quien no tiene motivo escrito

- **WHEN** Carmen no tiene ningún motivo escrito y su celda del jueves está marcada como ausencia
- **AND** el encargado toca esa celda
- **THEN** se le ofrece igualmente ver la ausencia
- **WHEN** la elige
- **THEN** se abre la ficha de Carmen con el campo del motivo vacío y listo para escribir

## ADDED Requirements

### Requirement: La pantalla de inicio identifica el local

La pantalla del cuadrante MUST mostrar de forma permanente la identidad del local: su logo y su nombre.

El nombre y el logo del local MUST ser siempre los mismos y MUST venir con la app. El sistema MUST NOT ofrecer cambiarlos desde la interfaz, MUST NOT pedir acceso a las fotos del dispositivo y MUST NOT guardarlos en el almacenamiento del dispositivo.

La identidad del local MUST NOT robarle sitio a la rejilla: con la plantilla completa, el cuadrante MUST seguir mostrando los siete días sin scroll horizontal y las mismas filas de empleado que mostraba antes de existir la cabecera de identidad.

El nombre del local MUST mostrarse completo cuando quepa y truncado con puntos suspensivos cuando no, en una sola línea. El sistema MUST NOT reducir por ello el ancho ni el alto de la rejilla.

#### Scenario: Abrir la app con el nombre del local ya escrito

- **WHEN** el encargado abre la app
- **THEN** la pantalla del cuadrante muestra el logo y el nombre `La Esquina café`
- **AND** debajo sigue viéndose el rango de la semana, la navegación entre semanas y la rejilla

#### Scenario: La identidad del local no le quita sitio a la rejilla

- **WHEN** el encargado abre la app con 20 empleados dados de alta, en la anchura mínima soportada
- **THEN** las siete columnas de día siguen viéndose a la vez, sin scroll horizontal
- **AND** se ven tantas filas de empleado como antes de existir la cabecera de identidad

#### Scenario: La app no ofrece cambiar el nombre ni el logo

- **WHEN** el encargado recorre el cuadrante, el panel de empleados y una ficha
- **THEN** en ninguna pantalla se le ofrece editar el nombre del local ni cambiar su logo
- **AND** no existe ninguna pantalla de ajustes

## REMOVED Requirements

### Requirement: Acceso a los ajustes desde el cuadrante

**Reason**: Se retira la pantalla de ajustes: el nombre del local pasa a estar fijo en el código y no queda ningún ajuste que editar, así que un acceso permanente en la cabecera del cuadrante ocupaba sitio sin llevar a ninguna parte.

**Migration**: Ninguna acción para el encargado. El nombre que había escrito queda fijado en la app y la cabecera lo sigue mostrando igual. La tabla donde se guardaba se borra en la migración del esquema.
