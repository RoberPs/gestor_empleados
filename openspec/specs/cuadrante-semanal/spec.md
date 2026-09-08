## Purpose

El cuadrante semanal es la pantalla de inicio de la app: la rejilla de empleados por días de una semana donde el encargado ve de un vistazo quién trabaja cuándo y planifica turnos, ausencias y vacaciones tocando directamente cada celda.

## Requirements

### Requirement: El cuadrante semanal es la pantalla de inicio

La pantalla del cuadrante semanal MUST ser la ruta raíz de la app. Al abrir la app, el sistema MUST mostrar directamente la rejilla del cuadrante, sin pantalla de bienvenida, de resumen ni de menú intermedia.

La única excepción MUST ser que el almacenamiento no pueda abrirse: en ese caso el sistema MUST mostrar el aviso que define `almacenamiento-empleados` — «Comportamiento cuando el almacenamiento no puede abrirse» en lugar del cuadrante, porque no hay plantilla que dibujar y una rejilla vacía haría creer al encargado que ha perdido a sus empleados. Ese aviso MUST NOT aparecer cuando el almacenamiento se abre bien, ni siquiera un instante, ni cuando la plantilla está simplemente vacía.

La semana mostrada por defecto MUST ser la semana en curso: la semana de lunes a domingo que contiene la fecha actual del dispositivo.

El sistema MUST recalcular cuál es la semana en curso cada vez que la app vuelve a primer plano. Mientras la pantalla está en primer plano, el sistema MUST NOT cambiar por sí solo la semana mostrada.

#### Scenario: Abrir la app un día cualquiera de la semana

- **WHEN** el encargado abre la app un miércoles
- **THEN** la primera pantalla que ve es la rejilla del cuadrante
- **AND** la semana mostrada es la que va del lunes anterior a ese miércoles al domingo siguiente
- **AND** no se muestra ninguna pantalla previa de bienvenida, resumen o menú

#### Scenario: Abrir la app en domingo

- **WHEN** el encargado abre la app un domingo
- **THEN** la semana mostrada es la que termina en ese domingo, no la que empieza al día siguiente

#### Scenario: La app vuelve a primer plano ya en la semana siguiente

- **WHEN** el encargado deja la app abierta mostrando la semana en curso un domingo
- **AND** vuelve a la app pasada la medianoche, ya en lunes
- **THEN** la semana mostrada es la semana nueva, indicada como semana en curso
- **AND** la semana anterior deja de presentarse como semana en curso

#### Scenario: Abrir la app con la plantilla vacía sigue llevando al cuadrante

- **WHEN** el encargado abre la app en un dispositivo donde no ha dado de alta a nadie
- **AND** el almacenamiento se abre sin problemas
- **THEN** la primera pantalla que ve es la rejilla del cuadrante
- **AND** no ve ningún aviso sobre sus datos

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

### Requirement: Navegación entre semanas

La pantalla MUST ofrecer dos acciones permanentes y siempre disponibles: ir a la semana anterior e ir a la semana siguiente. Cada una MUST desplazar el cuadrante exactamente siete días y actualizar el rango de fechas mostrado.

La pantalla MUST ofrecer además una acción de regreso a la semana en curso, disponible siempre que la semana mostrada no sea la semana en curso. Esa acción MUST devolver el cuadrante a la semana en curso desde cualquier semana, con un solo toque y sin pasar por las semanas intermedias.

No MUST haber límite de cuántas semanas hacia atrás o hacia adelante se puede navegar.

#### Scenario: Navegar a la semana siguiente y volver a la semana en curso

- **WHEN** el cuadrante muestra la semana en curso `07/09/2026 - 13/09/2026`
- **AND** el encargado toca la acción de semana siguiente
- **THEN** el cuadrante muestra la semana `14/09/2026 - 20/09/2026`
- **AND** aparece la acción de regreso a la semana en curso
- **WHEN** el encargado toca la acción de regreso a la semana en curso
- **THEN** el cuadrante vuelve a mostrar la semana `07/09/2026 - 13/09/2026`

#### Scenario: Navegar a la semana anterior

- **WHEN** el cuadrante muestra la semana `07/09/2026 - 13/09/2026`
- **AND** el encargado toca la acción de semana anterior
- **THEN** el cuadrante muestra la semana `31/08/2026 - 06/09/2026`

#### Scenario: Regreso desde una semana lejana con un solo toque

- **WHEN** el encargado se ha desplazado cinco semanas hacia adelante
- **AND** toca la acción de regreso a la semana en curso
- **THEN** el cuadrante muestra la semana en curso
- **AND** no ha tenido que tocar la acción de semana anterior cinco veces

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

### Requirement: La plantilla completa es alcanzable y legible

Cuando el número de empleados no cabe en la pantalla, la plantilla completa MUST ser alcanzable mediante scroll vertical. La cabecera con los días de la semana MUST seguir siendo visible mientras el encargado recorre la plantilla, de forma que nunca pierda la referencia de a qué día pertenece la celda que está mirando.

Con una plantilla de 20 empleados, la rejilla MUST seguir siendo utilizable: el contenido de cada celda de día MUST mostrarse completo, sin truncar ni abreviar las horas —también cuando la celda tiene dos turnos—, y cada celda MUST conservar un área pulsable de al menos 44 × 44 puntos. El truncado con puntos suspensivos MUST aplicarse únicamente a la columna de nombres.

El ancho mínimo de pantalla soportado MUST ser de 360 puntos en orientación vertical. Las siete columnas de día MUST repartirse el ancho disponible a partes iguales, con un mínimo de 44 puntos cada una, y la columna de nombres MUST quedarse con el ancho restante.

#### Scenario: Ver el cuadrante con 20 empleados en plantilla

- **WHEN** hay 20 empleados dados de alta
- **AND** el encargado abre el cuadrante
- **THEN** puede alcanzar a los 20 empleados desplazándose verticalmente
- **AND** las horas de los turnos planificados se muestran completas, sin truncar ni abreviar
- **AND** cada celda mantiene un área pulsable de al menos 44 × 44 puntos
- **AND** sigue sin haber scroll horizontal

#### Scenario: El cuadrante en la pantalla más estrecha soportada

- **WHEN** el encargado abre el cuadrante en una pantalla de 360 puntos de ancho en orientación vertical
- **THEN** las siete columnas de día son visibles a la vez sin scroll horizontal
- **AND** cada columna de día mide al menos 44 puntos
- **AND** las horas de los turnos planificados se muestran completas, sin truncar ni abreviar

#### Scenario: La cabecera de días acompaña al scroll vertical

- **WHEN** el encargado se desplaza verticalmente hasta el último empleado de la plantilla
- **THEN** la cabecera con los días de la semana sigue visible

### Requirement: Orden de los empleados en las filas

Las filas MUST ordenarse por nombre del empleado en orden alfabético ascendente, según el orden alfabético del español.

El orden MUST ser el mismo en todas las semanas, de forma que un empleado ocupe siempre la misma posición relativa al navegar entre semanas.

Las filas MUST NOT agruparse por ningún otro criterio: no hay secciones, ni separadores, ni orden manual definido por el encargado.

#### Scenario: Orden alfabético estable entre semanas

- **WHEN** la plantilla es Ana, Bruno y Carmen
- **THEN** las filas aparecen en el orden Ana, Bruno, Carmen
- **WHEN** el encargado navega a la semana siguiente
- **THEN** las filas mantienen el orden Ana, Bruno, Carmen

### Requirement: Contenido observable de una celda

Cada celda corresponde a un empleado y un día concretos y MUST encontrarse en uno de estos cuatro estados, distinguibles entre sí de un vistazo y sin depender únicamente del color:

- **Con turno planificado**: la celda MUST mostrar la hora de inicio y la hora de fin de cada turno planificado de ese día en formato 24h `hh:mm`.
- **Ausencia**: la celda MUST mostrar la etiqueta `AUS`, sin mostrar horas.
- **Vacaciones**: la celda MUST mostrar la etiqueta `VAC`, sin mostrar horas.
- **Vacía**: la celda MUST presentarse visiblemente vacía, sin texto que sugiera un turno planificado.

Una celda con turno planificado MUST poder contener uno o dos turnos del mismo día, y MUST NOT contener más de dos. Cuando contiene dos, la celda MUST mostrar los dos pares de horas completos, uno debajo del otro y en orden de hora de inicio ascendente, sin ocultar ninguno tras un indicador de "hay más".

Un turno planificado cuya hora de fin es anterior a su hora de inicio cruza la medianoche. Ese turno MUST pertenecer a la celda del día en que empieza y MUST mostrarse en ella tal cual, con su hora de inicio y su hora de fin. El sistema MUST NOT mostrarlo, marcarlo ni continuarlo en la celda del día siguiente.

Las etiquetas `AUS` y `VAC` MUST ir acompañadas de una leyenda permanente en la pantalla que las asocie con las palabras "Ausencia" y "Vacaciones". Esa leyenda MUST ser visible sin desplazarse por la rejilla. Fuera de la celda, y en particular en las acciones de celda, el sistema MUST usar siempre las palabras completas, nunca las abreviaturas.

La celda MUST NOT mostrar en ningún caso horas realmente trabajadas: el cuadrante muestra turno planificado, no hora registrada.

#### Scenario: Ver un turno planificado en su celda

- **WHEN** el empleado Bruno tiene un turno planificado el jueves de 09:00 a 17:00
- **AND** el encargado abre el cuadrante de esa semana
- **THEN** la celda de Bruno en la columna del jueves muestra `09:00` y `17:00`

#### Scenario: Ver un turno partido en su celda

- **WHEN** la empleada Ana tiene el lunes un turno planificado de 12:00 a 16:00 y otro de 20:00 a 00:00
- **AND** el encargado abre el cuadrante de esa semana
- **THEN** la celda de Ana en la columna del lunes muestra `12:00` y `16:00`, y debajo `20:00` y `00:00`
- **AND** los dos pares de horas se muestran completos, sin truncar ni abreviar
- **AND** no aparece ningún indicador de contenido oculto

#### Scenario: Ver un turno que cruza la medianoche

- **WHEN** el empleado Bruno tiene un turno planificado que empieza el viernes a las 20:00 y termina a las 02:00
- **AND** el encargado abre el cuadrante de esa semana
- **THEN** la celda de Bruno en la columna del viernes muestra `20:00` y `02:00`
- **AND** la celda de Bruno en la columna del sábado se presenta vacía

#### Scenario: Ver una celda de vacaciones

- **WHEN** la empleada Ana tiene vacaciones el martes
- **AND** el encargado abre el cuadrante de esa semana
- **THEN** la celda de Ana en la columna del martes muestra la etiqueta `VAC`
- **AND** no muestra ninguna hora
- **AND** se distingue a simple vista de una celda con turno planificado y de una celda vacía

#### Scenario: Ver una celda de ausencia

- **WHEN** el empleado Bruno tiene una ausencia el viernes
- **THEN** la celda de Bruno en la columna del viernes muestra la etiqueta `AUS`
- **AND** se distingue a simple vista de una celda de vacaciones

#### Scenario: La leyenda explica las etiquetas de la celda

- **WHEN** el encargado ve el cuadrante
- **THEN** la pantalla muestra, sin necesidad de desplazarse, una leyenda que asocia `AUS` con "Ausencia" y `VAC` con "Vacaciones"

#### Scenario: Semana sin ningún turno planificado

- **WHEN** hay empleados dados de alta pero la semana mostrada no tiene ningún turno planificado, ausencia ni vacaciones
- **THEN** la rejilla se muestra completa, con una fila por empleado y las siete columnas
- **AND** todas las celdas se presentan vacías
- **AND** cada celda sigue siendo pulsable

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

### Requirement: Acceso al panel de empleados desde el cuadrante

La pantalla del cuadrante MUST ofrecer un acceso permanente al panel de empleados, alcanzable con un solo toque desde la rejilla.

Al volver del panel de empleados, el sistema MUST devolver al encargado al cuadrante en la misma semana en la que estaba, reflejando los cambios de plantilla que se hayan hecho.

#### Scenario: Ir al panel de empleados y volver al cuadrante

- **WHEN** el encargado está viendo el cuadrante de una semana
- **AND** toca el acceso al panel de empleados
- **THEN** se abre el panel de empleados
- **WHEN** vuelve atrás
- **THEN** ve de nuevo el cuadrante en la misma semana en la que estaba

#### Scenario: Un empleado nuevo aparece como fila al volver

- **WHEN** el encargado va al panel de empleados y da de alta a un empleado nuevo
- **AND** vuelve al cuadrante
- **THEN** el cuadrante muestra una fila para ese empleado, en su posición alfabética
- **AND** sus siete celdas de la semana se presentan vacías

### Requirement: Estado vacío sin empleados dados de alta

Cuando no hay ningún empleado dado de alta, la pantalla MUST mostrar en lugar de la rejilla un mensaje que explique que todavía no hay empleados en la plantilla, junto con una acción que lleve directamente al panel de empleados para dar de alta al primero.

La identificación de la semana, la navegación entre semanas y la leyenda de etiquetas MUST NOT ofrecerse en este estado: sin plantilla no hay cuadrante que recorrer ni etiquetas que explicar.

#### Scenario: Abrir la app sin ningún empleado dado de alta

- **WHEN** el encargado abre la app y no hay ningún empleado dado de alta
- **THEN** no se muestra la rejilla
- **AND** se muestra un mensaje indicando que todavía no hay empleados en la plantilla
- **AND** se ofrece una acción que lleva al panel de empleados para dar de alta al primer empleado

#### Scenario: El cuadrante aparece tras dar de alta al primer empleado

- **WHEN** el encargado está en el estado vacío y da de alta a su primer empleado desde el panel de empleados
- **AND** vuelve al cuadrante
- **THEN** se muestra la rejilla de la semana en curso con una fila para ese empleado

### Requirement: Idioma y formatos de la pantalla

Todos los textos de la pantalla del cuadrante MUST estar en español de España.

La semana MUST presentarse de lunes a domingo, las horas en formato 24h `hh:mm` y las fechas en formato dd/mm/aaaa.

Las únicas abreviaturas admitidas en la pantalla MUST ser `AUS` y `VAC` dentro de la celda, siempre acompañadas de su leyenda. Las horas MUST NOT abreviarse en ningún caso.

La pantalla MUST NOT mostrar textos que valoren el cumplimiento de límites de jornada, descansos, convenio o normativa laboral.

#### Scenario: Formatos de la pantalla

- **WHEN** el encargado ve el cuadrante con turnos planificados
- **THEN** los textos de la pantalla están en español de España
- **AND** la primera columna es el lunes y la última el domingo
- **AND** las horas se muestran en formato 24h, por ejemplo `21:00` y nunca `9:00 PM`
- **AND** las fechas del rango de la semana se muestran como dd/mm/aaaa

#### Scenario: La pantalla no valora el cumplimiento normativo

- **WHEN** un empleado tiene turnos planificados los siete días de la semana
- **THEN** el cuadrante los muestra tal cual
- **AND** no aparece ningún aviso, advertencia ni mensaje sobre límites de jornada o descansos

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
