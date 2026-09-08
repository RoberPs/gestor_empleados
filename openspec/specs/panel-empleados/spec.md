## Purpose

El panel de empleados es donde el encargado mantiene su plantilla: la lista de quién trabaja en el local y la ficha de cada persona, con su nombre, su teléfono, su email, sus vacaciones y una nota libre, todo editable por él y sin nada de solo lectura.

## Requirements

### Requirement: Lista de empleados del panel

El panel de empleados MUST presentarse como una lista con una fila por empleado dado de alta.

Cada fila MUST mostrar únicamente el nombre del empleado. La lista MUST NOT mostrar el teléfono, el email, la nota ni ninguna indicación de vacaciones.

Las filas MUST ordenarse por nombre en orden alfabético ascendente, según el orden alfabético del español, el mismo orden con el que el cuadrante ordena sus filas. La lista MUST NOT agruparse por ningún otro criterio: no hay secciones, ni separadores, ni orden manual definido por el encargado.

La lista MUST ofrecer una acción permanente de alta de un empleado nuevo.

La lista MUST NOT ofrecer ninguna acción de baja: ni botón, ni deslizamiento lateral, ni pulsación larga sobre la fila. La baja solo se hace desde la ficha.

#### Scenario: Ver la lista de la plantilla

- **WHEN** la plantilla es Ana, Bruno y Carmen
- **AND** el encargado abre el panel de empleados
- **THEN** la lista muestra tres filas, en el orden Ana, Bruno, Carmen
- **AND** cada fila muestra solo el nombre
- **AND** se ofrece la acción de dar de alta a un empleado nuevo

#### Scenario: La lista no ofrece dar de baja

- **WHEN** el encargado ve la lista de empleados
- **AND** desliza una fila hacia los lados y la mantiene pulsada
- **THEN** no aparece ninguna acción de baja ni de borrado
- **AND** la fila sigue en la lista

### Requirement: Estado vacío de la plantilla

Cuando no hay ningún empleado dado de alta, el panel MUST mostrar en lugar de la lista un mensaje que explique que todavía no hay empleados en la plantilla, junto con una acción que abra directamente el alta del primer empleado.

En este estado el panel MUST NOT mostrar una lista vacía sin explicación.

#### Scenario: Abrir el panel con la plantilla vacía

- **WHEN** el encargado abre el panel de empleados y no hay ningún empleado dado de alta
- **THEN** no se muestra ninguna fila
- **AND** se muestra un mensaje indicando que todavía no hay empleados en la plantilla
- **AND** se ofrece una acción que abre el alta del primer empleado

#### Scenario: La lista aparece tras dar de alta al primer empleado

- **WHEN** el encargado está en el estado vacío y da de alta a su primer empleado
- **THEN** el panel muestra la lista con una fila para ese empleado
- **AND** deja de mostrarse el mensaje de plantilla vacía

### Requirement: Apertura y regreso de la ficha del empleado

Un toque sobre la fila de un empleado MUST abrir su ficha. Toda la fila MUST ser pulsable, no solo el texto del nombre.

La ficha MUST identificar de quién es y MUST ofrecer una acción de regreso a la lista, disponible en todo momento.

Al volver a la lista, esta MUST reflejar los cambios hechos en la ficha, incluida la posición alfabética que corresponda al empleado si se le cambió el nombre.

#### Scenario: Abrir la ficha de un empleado y volver a la lista

- **WHEN** la plantilla es Ana, Bruno y Carmen
- **AND** el encargado toca la fila de Bruno
- **THEN** se abre la ficha de Bruno
- **WHEN** toca la acción de volver
- **THEN** ve de nuevo la lista con las tres filas

#### Scenario: Cambiar el nombre reordena la lista

- **WHEN** la plantilla es Ana, Bruno y Carmen
- **AND** el encargado abre la ficha de Carmen y cambia su nombre por `Alberto`
- **AND** vuelve a la lista
- **THEN** las filas aparecen en el orden Alberto, Ana, Bruno

### Requirement: Alta de un empleado

El alta MUST pedir tres campos: nombre, teléfono y email.

El nombre MUST ser obligatorio. El teléfono y el email MUST ser opcionales: el sistema MUST guardar el empleado con el nombre a secas si el encargado no rellena los otros dos.

El alta MUST confirmarse con una acción explícita del encargado. Al guardar, el sistema MUST añadir al empleado a la plantilla y volver a la lista, donde MUST aparecer en su posición alfabética.

El sistema MUST NOT guardar un empleado sin nombre, ni con un nombre que solo contenga espacios, y MUST explicar por qué no puede guardarse sin perder lo ya introducido.

El nombre MUST ser único en la plantilla. Si ya existe un empleado con ese nombre —ignorando mayúsculas y espacios sobrantes—, el sistema MUST NOT guardar, MUST explicar que otro empleado ya tiene ese nombre y MUST conservar lo tecleado para que el encargado lo distinga.

Cuando el encargado corrige el campo, esa explicación MUST desaparecer: no debe leerse que sigue sin poder guardarse un alta que ya es válida.

El nombre, el teléfono y el email MUST guardarse tal y como se teclean, sin los espacios sobrantes del principio y del final. El sistema MUST NOT rechazar ningún formato de teléfono ni de email.

#### Scenario: Dar de alta un empleado con nombre, teléfono y email

- **WHEN** el encargado abre el alta y teclea el nombre `Bruno`, el teléfono `600 11 22 33` y el email `bruno@ejemplo.es`
- **AND** confirma el alta
- **THEN** vuelve a la lista
- **AND** la lista muestra una fila para Bruno en su posición alfabética
- **WHEN** abre la ficha de Bruno
- **THEN** el teléfono es `600 11 22 33` y el email es `bruno@ejemplo.es`

#### Scenario: Dar de alta un empleado sin teléfono ni email

- **WHEN** el encargado abre el alta y teclea únicamente el nombre `Carmen`
- **AND** confirma el alta
- **THEN** el sistema guarda a Carmen
- **AND** vuelve a la lista, que muestra una fila para Carmen
- **WHEN** abre la ficha de Carmen
- **THEN** los campos de teléfono y email están vacíos y se pueden rellenar

#### Scenario: Un alta sin nombre no se guarda

- **WHEN** el encargado abre el alta, deja el nombre vacío y teclea el teléfono `600112233`
- **AND** confirma el alta
- **THEN** el sistema no lo guarda
- **AND** le indica por qué no puede guardarse
- **AND** el teléfono que había introducido sigue ahí
- **WHEN** teclea el nombre `Bruno`
- **THEN** esa explicación desaparece
- **AND** puede guardar el alta

#### Scenario: Un alta con un nombre que ya existe no se guarda

- **WHEN** la plantilla ya incluye a `Ana`
- **AND** el encargado da de alta a otra empleada con el nombre `ana`
- **THEN** el sistema no lo guarda
- **AND** le indica que otro empleado ya tiene ese nombre
- **AND** lo tecleado sigue ahí para poder distinguirlo
- **WHEN** cambia el nombre por `Ana G.`
- **THEN** el sistema lo guarda

### Requirement: Edición de los datos de la ficha

El nombre, el teléfono y el email de un empleado ya dado de alta MUST ser siempre editables desde su ficha. Ninguno MUST ser de solo lectura para el encargado.

Cada campo MUST quedar guardado según se escribe, sin acción de guardar adicional y sin depender de que el encargado salga del campo, cierre el teclado o vuelva a la lista. La ficha MUST NOT ofrecer un botón de guardar global ni preguntar si se descartan los cambios al volver a la lista.

Cuando un campo queda guardado, la ficha MUST decirlo junto a ese campo, de forma que el encargado sepa que lo que acaba de escribir ya está a salvo sin tener que salir y volver a entrar para comprobarlo. Ese aviso MUST permanecer visible mientras la ficha siga abierta, y MUST NOT aparecer en un campo que el encargado no ha tocado.

Al abrir de nuevo la ficha, ningún campo MUST mostrar aviso de guardado: el aviso habla de lo que se acaba de escribir, no de lo que ya estaba guardado de antes.

El nombre editado MUST cumplir las mismas condiciones que en el alta: no puede quedar vacío ni repetir el nombre de otro empleado. Cuando no las cumple, el sistema MUST NOT guardar ese cambio, MUST explicar por qué y MUST conservar lo tecleado para corregirlo. Mientras el nombre no se pueda guardar, la ficha MUST NOT decir que ha quedado guardado. El teléfono y el email MUST poder vaciarse.

El sistema MUST NOT ofrecer deshacer una edición ya guardada.

#### Scenario: Editar el teléfono de un empleado existente

- **WHEN** el empleado Bruno tiene el teléfono `600 11 22 33`
- **AND** el encargado abre su ficha y cambia el teléfono a `611 22 33 44`
- **AND** vuelve a la lista
- **WHEN** abre de nuevo la ficha de Bruno
- **THEN** el teléfono es `611 22 33 44`

#### Scenario: Vaciar el email de un empleado

- **WHEN** la empleada Ana tiene el email `ana@ejemplo.es`
- **AND** el encargado abre su ficha y borra el contenido del email
- **AND** vuelve a la lista y abre de nuevo la ficha de Ana
- **THEN** el campo de email está vacío
- **AND** el nombre y el teléfono de Ana no han cambiado

#### Scenario: El campo dice que ha quedado guardado

- **WHEN** el encargado abre la ficha de Bruno y escribe `611 22 33 44` en el teléfono
- **THEN** junto al teléfono se indica que ha quedado guardado
- **AND** esa indicación sigue ahí mientras la ficha continúa abierta
- **AND** el email y la nota, que no ha tocado, no muestran ninguna indicación

#### Scenario: Un campo escrito queda guardado sin salir de él

- **WHEN** el encargado abre la ficha de Bruno, escribe `611 22 33 44` en el teléfono
- **AND** vuelve a la lista sin tocar ningún otro campo ni cerrar el teclado
- **WHEN** abre de nuevo la ficha de Bruno
- **THEN** el teléfono es `611 22 33 44`

#### Scenario: Al reabrir la ficha no hay avisos de guardado

- **WHEN** el encargado ha escrito el teléfono de Bruno y ha vuelto a la lista
- **AND** abre de nuevo la ficha de Bruno
- **THEN** el teléfono guardado se muestra en su campo
- **AND** ningún campo muestra indicación de guardado

#### Scenario: Un nombre que no se puede guardar no dice que se ha guardado

- **WHEN** la plantilla es Ana y Bruno
- **AND** el encargado abre la ficha de Bruno y cambia su nombre por `Ana`
- **THEN** el sistema explica por qué no puede guardarse
- **AND** el campo del nombre no indica que haya quedado guardado

### Requirement: Vacaciones por rango de fechas desde la ficha

La ficha MUST mostrar las vacaciones del empleado como una lista de rangos de fechas, cada uno con su fecha de inicio y su fecha de fin en formato dd/mm/aaaa.

Un rango de vacaciones MUST equivaler exactamente al conjunto de sus días marcados como vacaciones en el cuadrante: añadirlo MUST hacer que esos días se muestren como celdas de vacaciones en la rejilla, y eliminarlo MUST dejar esas celdas vacías. La ficha MUST presentar los días de vacaciones del empleado agrupados en rangos de días contiguos, de forma que dos rangos que se tocan se muestren como uno solo.

La ficha MUST ofrecer añadir un rango, editar cualquier rango existente y eliminar cualquier rango existente. Ningún rango MUST ser de solo lectura para el encargado.

Al introducir una fecha, el sistema MUST admitir las formas naturales de teclearla con el teclado numérico de un móvil y MUST normalizarlas a dd/mm/aaaa: con separador (`7/9/2026`, `07/09/2026`, `7-9-2026`, `7.9.2026`) y solo dígitos (`07092026`). El sistema MUST seguir rechazando lo que no sea una fecha real del calendario.

El sistema MUST NOT guardar un rango cuya fecha de fin es anterior a su fecha de inicio, e informará de por qué no puede guardarse sin perder lo ya introducido. Un rango cuya fecha de fin coincide con la de inicio MUST aceptarse: es un único día de vacaciones. Cuando el encargado corrige la fecha, esa explicación MUST desaparecer.

Cuando algún día del rango tiene ya un turno planificado o una ausencia, el sistema MUST decir cuántos días están en esa situación y MUST pedir una confirmación explícita antes de guardar. Al confirmar, esos días MUST pasar a vacaciones y su turno planificado o su ausencia MUST desaparecer. Si el encargado no confirma, el rango MUST NOT guardarse y esos días MUST conservar lo que tenían. Los días del rango que ya estaban de vacaciones MUST NOT contarse en ese aviso.

Eliminar un rango MUST requerir una confirmación explícita antes de que las vacaciones desaparezcan. Si el encargado no confirma, el rango MUST seguir en la ficha. El sistema MUST NOT ofrecer deshacer una eliminación ya confirmada.

#### Scenario: Añadir un rango de vacaciones a un empleado y verlo en su ficha

- **WHEN** el encargado abre la ficha de Bruno, que no tiene vacaciones
- **AND** añade un rango del `10/09/2026` al `14/09/2026`
- **THEN** la ficha de Bruno muestra el rango `10/09/2026 - 14/09/2026`
- **WHEN** vuelve al cuadrante y navega a la semana del `07/09/2026 - 13/09/2026`
- **THEN** las celdas de Bruno del jueves 10, viernes 11, sábado 12 y domingo 13 muestran la etiqueta `VAC`

#### Scenario: Un rango de un solo día

- **WHEN** el encargado añade a Bruno un rango del `10/09/2026` al `10/09/2026`
- **THEN** el sistema lo guarda
- **AND** la ficha muestra el rango `10/09/2026 - 10/09/2026`

#### Scenario: Un rango cuyo fin es anterior a su inicio no se guarda

- **WHEN** el encargado añade a Bruno un rango del `14/09/2026` al `10/09/2026`
- **THEN** el sistema no lo guarda
- **AND** le indica por qué no puede guardarse
- **AND** las fechas que había introducido siguen ahí para corregirlas
- **WHEN** corrige la fecha de fin a `18/09/2026`
- **THEN** esa explicación desaparece
- **AND** puede guardar el rango

#### Scenario: Teclear la fecha sin separadores

- **WHEN** el encargado añade un rango de vacaciones y teclea `10092026` como fecha de inicio y `14/9/2026` como fecha de fin
- **THEN** el sistema lo guarda
- **AND** la ficha muestra el rango `10/09/2026 - 14/09/2026`

#### Scenario: Dos rangos contiguos se muestran como uno solo

- **WHEN** el encargado añade a Bruno un rango del `01/09/2026` al `03/09/2026`
- **AND** añade después un rango del `04/09/2026` al `06/09/2026`
- **THEN** la ficha de Bruno muestra un único rango `01/09/2026 - 06/09/2026`

#### Scenario: Editar un rango de vacaciones existente

- **WHEN** la ficha de Bruno muestra el rango `10/09/2026 - 14/09/2026`
- **AND** el encargado edita ese rango y cambia su fecha de fin a `12/09/2026`
- **THEN** la ficha muestra el rango `10/09/2026 - 12/09/2026`
- **WHEN** vuelve al cuadrante y navega a la semana del `14/09/2026 - 20/09/2026`
- **THEN** la celda de Bruno del lunes 14 se presenta vacía

#### Scenario: Eliminar un rango de vacaciones existente

- **WHEN** la ficha de Bruno muestra el rango `10/09/2026 - 14/09/2026`
- **AND** el encargado elige eliminar ese rango
- **THEN** el sistema le pide que confirme la eliminación
- **WHEN** confirma
- **THEN** la ficha de Bruno ya no muestra ningún rango de vacaciones
- **WHEN** vuelve al cuadrante y navega a la semana del `07/09/2026 - 13/09/2026`
- **THEN** las celdas de Bruno de esos días se presentan vacías

#### Scenario: Desistir de eliminar un rango de vacaciones

- **WHEN** la ficha de Bruno muestra el rango `10/09/2026 - 14/09/2026`
- **AND** el encargado elige eliminar ese rango y no confirma la eliminación
- **THEN** la ficha de Bruno sigue mostrando el rango `10/09/2026 - 14/09/2026`

#### Scenario: Un rango de vacaciones que pisa turnos planificados

- **WHEN** Bruno tiene turnos planificados el `10/09/2026` y el `11/09/2026`
- **AND** el encargado añade a Bruno un rango del `10/09/2026` al `14/09/2026`
- **THEN** el sistema le indica que dos días del rango tienen ya turno planificado o ausencia
- **AND** le pide que lo confirme
- **WHEN** confirma
- **THEN** la ficha de Bruno muestra el rango `10/09/2026 - 14/09/2026`
- **AND** las celdas del `10/09/2026` y del `11/09/2026` en el cuadrante muestran la etiqueta `VAC` y ya no muestran ninguna hora

#### Scenario: Desistir de un rango que pisa turnos planificados

- **WHEN** Bruno tiene un turno planificado el `10/09/2026` de 09:00 a 17:00
- **AND** el encargado añade un rango del `10/09/2026` al `14/09/2026` y no confirma
- **THEN** el rango no se guarda
- **AND** la ficha de Bruno no muestra ningún rango de vacaciones
- **AND** la celda del `10/09/2026` en el cuadrante sigue mostrando `09:00` y `17:00`

#### Scenario: Quitar las vacaciones de un día desde el cuadrante parte el rango

- **WHEN** la ficha de Bruno muestra el rango `10/09/2026 - 14/09/2026`
- **AND** el encargado quita las vacaciones del `12/09/2026` desde la celda del cuadrante
- **AND** vuelve a abrir la ficha de Bruno
- **THEN** la ficha muestra dos rangos: `10/09/2026 - 11/09/2026` y `13/09/2026 - 14/09/2026`

### Requirement: Nota del empleado

La ficha MUST ofrecer un campo de nota de texto libre por empleado, siempre editable por el encargado.

La interfaz MUST NOT imponer una longitud máxima al texto de la nota, ni exigirle ninguna estructura: no hay categorías, ni etiquetas, ni fecha, ni más de una nota por empleado.

La nota MUST quedar guardada según se escribe, igual que el resto de campos de la ficha, y MUST decirlo junto al campo igual que ellos. En particular, la nota MUST quedar guardada aunque el encargado salga de la ficha sin haber salido antes del campo de la nota ni haber cerrado el teclado. La nota MUST poder vaciarse.

La nota MUST NOT mostrarse fuera de la ficha: ni en la lista de empleados ni en el cuadrante.

#### Scenario: Escribir y modificar la nota de un empleado

- **WHEN** el encargado abre la ficha de Bruno, que no tiene nota
- **AND** escribe `No puede los martes por la tarde`
- **AND** vuelve a la lista y abre de nuevo la ficha de Bruno
- **THEN** la nota es `No puede los martes por la tarde`
- **WHEN** cambia la nota por `Solo turnos de mañana`
- **AND** vuelve a la lista y abre de nuevo la ficha de Bruno
- **THEN** la nota es `Solo turnos de mañana`

#### Scenario: La nota se guarda aunque se salga de la ficha desde ella

- **WHEN** el encargado abre la ficha de Bruno y escribe `No puede los martes por la tarde` en la nota
- **AND** sale de la ficha directamente desde el campo de la nota, sin tocar ningún otro campo ni cerrar el teclado
- **WHEN** abre de nuevo la ficha de Bruno
- **THEN** la nota es `No puede los martes por la tarde`

#### Scenario: Una nota larga no se recorta

- **WHEN** el encargado escribe en la nota de Bruno un texto de varios párrafos
- **THEN** el sistema lo guarda entero
- **AND** al volver a abrir la ficha la nota conserva todo el texto, sin recortarlo ni añadir ningún indicador de contenido oculto

### Requirement: Baja de un empleado

La ficha MUST ofrecer dar de baja al empleado. La baja MUST ser un borrado definitivo: no existe el concepto de empleado inactivo ni histórico de plantilla.

Antes de borrar, el sistema MUST pedir una confirmación explícita en la que nombre al empleado y advierta de que sus turnos planificados, sus ausencias y sus vacaciones desaparecen del cuadrante, incluidas las semanas ya pasadas.

Al confirmar, el sistema MUST eliminar al empleado y todo su contenido del cuadrante en cualquier semana, y MUST volver a la lista, donde ese empleado ya no MUST aparecer. Si el encargado no confirma, el empleado y su contenido MUST conservarse tal cual y la ficha MUST seguir abierta.

El sistema MUST NOT ofrecer deshacer una baja ya confirmada.

#### Scenario: Dar de baja a un empleado que tiene turnos planificados

- **WHEN** Bruno tiene turnos planificados en la semana en curso y en una semana ya pasada, y un rango de vacaciones
- **AND** el encargado abre su ficha y elige darle de baja
- **THEN** el sistema le pide que lo confirme nombrando a Bruno
- **AND** le advierte de que sus turnos planificados y sus vacaciones desaparecen del cuadrante, también en las semanas ya pasadas
- **WHEN** confirma
- **THEN** vuelve a la lista, que ya no muestra ninguna fila para Bruno
- **WHEN** va al cuadrante y navega a esa semana pasada
- **THEN** el cuadrante no muestra ninguna fila para Bruno

#### Scenario: Desistir de una baja

- **WHEN** el encargado abre la ficha de Bruno y elige darle de baja
- **AND** no confirma la baja
- **THEN** sigue en la ficha de Bruno
- **AND** sus datos, sus vacaciones y su nota siguen ahí
- **WHEN** vuelve a la lista
- **THEN** la lista sigue mostrando la fila de Bruno

### Requirement: Privacidad de los datos de contacto y de la nota

El teléfono, el email y la nota de un empleado MUST verse y editarse únicamente en la ficha de ese empleado dentro del panel de empleados.

El sistema MUST NOT mostrarlos en la lista de empleados ni en ninguna pantalla del cuadrante.

El sistema MUST NOT enviarlos a ningún servicio externo, MUST NOT sincronizarlos con ningún otro dispositivo y MUST NOT incluirlos en las exportaciones de cuadrante ni de horas registradas.

#### Scenario: El teléfono y el email no salen de la ficha

- **WHEN** el empleado Bruno tiene teléfono, email y nota
- **AND** el encargado mira la lista de empleados y después el cuadrante
- **THEN** ninguna de las dos pantallas muestra su teléfono, su email ni su nota
- **AND** solo se muestra su nombre

### Requirement: La plantilla completa es alcanzable y legible en el panel

Cuando el número de empleados no cabe en la pantalla, la lista completa MUST ser alcanzable mediante scroll vertical.

Con una plantilla de 20 empleados, la lista MUST seguir siendo utilizable: cada fila MUST conservar un área pulsable de al menos 44 puntos de alto y MUST ocupar todo el ancho disponible, y la acción de alta MUST seguir siendo alcanzable sin recorrer la lista entera.

El nombre que no cabe en el ancho de la fila MUST mostrarse truncado con puntos suspensivos.

El ancho mínimo de pantalla soportado MUST ser de 360 puntos en orientación vertical, el mismo que el del cuadrante.

La ficha MUST ser recorrible con scroll vertical cuando su contenido no cabe, sin que ningún campo quede fuera de alcance.

#### Scenario: Ver la lista con 20 empleados

- **WHEN** hay 20 empleados dados de alta
- **AND** el encargado abre el panel de empleados en una pantalla de 360 puntos de ancho en orientación vertical
- **THEN** puede alcanzar a los 20 empleados desplazándose verticalmente
- **AND** cada fila mantiene un área pulsable de al menos 44 puntos de alto
- **AND** la acción de dar de alta sigue siendo alcanzable
- **AND** al tocar una fila se abre la ficha de ese empleado y no la del de al lado

#### Scenario: Ver la ficha de un empleado sin vacaciones y sin notas

- **WHEN** el encargado abre la ficha de un empleado sin ningún rango de vacaciones y sin nota
- **THEN** el nombre, el teléfono y el email se muestran y se pueden editar
- **AND** la zona de vacaciones indica que no hay ninguno y ofrece la acción de añadir un rango
- **AND** el campo de nota se muestra vacío y se puede escribir en él
- **AND** no se muestra ningún mensaje de error ni ninguna zona en blanco sin explicación

#### Scenario: Un nombre largo se trunca en su fila

- **WHEN** la plantilla incluye a un empleado cuyo nombre no cabe en el ancho de la fila
- **THEN** su nombre se muestra truncado con puntos suspensivos
- **AND** la fila conserva su área pulsable

### Requirement: Idioma y formatos del panel

Todos los textos del panel de empleados y de la ficha MUST estar en español de España.

Las fechas MUST mostrarse en formato dd/mm/aaaa.

El panel MUST NOT mostrar textos que valoren el cumplimiento de límites de jornada, descansos, convenio o normativa laboral, ni al gestionar vacaciones ni al dar de baja a un empleado.

#### Scenario: Formatos del panel de empleados

- **WHEN** el encargado ve la ficha de un empleado con un rango de vacaciones
- **THEN** los textos de la pantalla están en español de España
- **AND** las fechas del rango se muestran como dd/mm/aaaa, por ejemplo `10/09/2026`

#### Scenario: El panel no valora el cumplimiento normativo

- **WHEN** el encargado añade a un empleado un rango de vacaciones de dos meses
- **THEN** el sistema lo guarda tal cual
- **AND** no aparece ningún aviso, advertencia ni mensaje sobre días de vacaciones disponibles, límites de jornada o normativa laboral
