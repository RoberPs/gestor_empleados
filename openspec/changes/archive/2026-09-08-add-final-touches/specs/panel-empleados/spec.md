## MODIFIED Requirements

### Requirement: Lista de empleados del panel

El panel de empleados MUST presentarse como una lista con una fila por empleado dado de alta.

Cada fila MUST mostrar el nombre del empleado y su puesto. La lista MUST NOT mostrar el teléfono, el email, la nota, el motivo de la ausencia ni ninguna indicación de vacaciones.

Cuando un empleado no tiene puesto escrito, la fila MUST mostrar solo su nombre, sin hueco vacío ni texto de relleno.

El nombre MUST tener prioridad sobre el puesto al repartir el ancho de la fila: cuando los dos no caben, el que se trunca MUST ser el puesto.

Cada fila MUST mostrar un acceso visible a la ficha de ese empleado, situado al final de la fila. Ese acceso MUST NOT ser el único camino a la ficha: toda la fila MUST seguir siendo pulsable.

Las filas MUST ordenarse por nombre en orden alfabético ascendente, según el orden alfabético del español, el mismo orden con el que el cuadrante ordena sus filas. La lista MUST NOT agruparse por ningún otro criterio: no hay secciones, ni separadores, ni orden manual definido por el encargado. El puesto MUST NOT alterar ese orden ni agrupar las filas.

La lista MUST ofrecer una acción permanente de alta de un empleado nuevo.

La lista MUST NOT ofrecer ninguna acción de baja: ni botón, ni deslizamiento lateral, ni pulsación larga sobre la fila. La baja solo se hace desde la ficha.

#### Scenario: Ver la lista de la plantilla

- **WHEN** la plantilla es Ana con el puesto `Barra`, Bruno con el puesto `Cocina` y Carmen con el puesto `Sala`
- **AND** el encargado abre el panel de empleados
- **THEN** la lista muestra tres filas, en el orden Ana, Bruno, Carmen
- **AND** cada fila muestra el nombre y el puesto de ese empleado
- **AND** cada fila muestra un acceso a la ficha al final de la fila
- **AND** se ofrece la acción de dar de alta a un empleado nuevo

#### Scenario: Un empleado sin puesto escrito

- **WHEN** la plantilla es Ana con el puesto `Barra` y Bruno sin puesto
- **AND** el encargado abre el panel de empleados
- **THEN** la fila de Ana muestra su nombre y `Barra`
- **AND** la fila de Bruno muestra solo su nombre
- **AND** las dos filas conservan el mismo alto

#### Scenario: El puesto se trunca antes que el nombre

- **WHEN** la plantilla incluye a `Maricarmen de la Fuente Etxebarria` con el puesto `Responsable de sala y barra`
- **AND** el encargado ve la lista en la anchura mínima soportada
- **THEN** el nombre se lee entero o truncado lo mínimo imprescindible
- **AND** el puesto se trunca antes que el nombre
- **AND** el acceso a la ficha sigue visible y pulsable

#### Scenario: El acceso de la fila y la fila llevan al mismo sitio

- **WHEN** el encargado toca el acceso a la ficha de la fila de Bruno
- **THEN** se abre la ficha de Bruno
- **WHEN** vuelve a la lista y toca cualquier otro punto de la fila de Bruno
- **THEN** se abre igualmente la ficha de Bruno

#### Scenario: La lista no ofrece dar de baja

- **WHEN** el encargado ve la lista de empleados
- **AND** desliza una fila hacia los lados y la mantiene pulsada
- **THEN** no aparece ninguna acción de baja ni de borrado
- **AND** la fila sigue en la lista

### Requirement: Apertura y regreso de la ficha del empleado

Un toque sobre la fila de un empleado MUST abrir su ficha. Toda la fila MUST ser pulsable, no solo el texto del nombre.

La ficha MUST identificar de quién es, mostrando el nombre del empleado **completo**: cuando no cabe en una línea MUST repartirse en varias, y MUST NOT truncarse.

La ficha MUST ofrecer una acción de regreso, disponible en todo momento. Esa acción MUST devolver al encargado a la pantalla desde la que abrió la ficha: a la lista del panel si vino de ella, y al cuadrante si vino del cuadrante.

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

#### Scenario: El nombre largo se lee entero en la ficha

- **WHEN** el encargado abre la ficha de `Maricarmen de la Fuente Etxebarria` en la anchura mínima soportada
- **THEN** la ficha muestra el nombre completo, repartido en más de una línea
- **AND** no aparecen puntos suspensivos ni ninguna otra marca de texto recortado

### Requirement: Alta de un empleado

El alta MUST pedir cuatro campos: nombre, puesto, teléfono y email.

El nombre MUST ser obligatorio. El puesto, el teléfono y el email MUST ser opcionales: el sistema MUST guardar el empleado con el nombre a secas si el encargado no rellena los otros tres.

El puesto MUST ser texto libre. El sistema MUST NOT ofrecer una lista cerrada de puestos, MUST NOT imponerle un formato y MUST NOT rechazar ningún valor.

El alta MUST confirmarse con una acción explícita del encargado. Al guardar, el sistema MUST añadir al empleado a la plantilla y volver a la lista, donde MUST aparecer en su posición alfabética.

El sistema MUST NOT guardar un empleado sin nombre, ni con un nombre que solo contenga espacios, y MUST explicar por qué no puede guardarse sin perder lo ya introducido.

El nombre MUST ser único en la plantilla. Si ya existe un empleado con ese nombre —ignorando mayúsculas y espacios sobrantes—, el sistema MUST NOT guardar, MUST explicar que otro empleado ya tiene ese nombre y MUST conservar lo tecleado para que el encargado lo distinga. El puesto MUST NOT intervenir en esa comprobación: dos empleados pueden compartir puesto, pero no nombre.

Cuando el encargado corrige el campo, esa explicación MUST desaparecer: no debe leerse que sigue sin poder guardarse un alta que ya es válida.

El nombre, el puesto, el teléfono y el email MUST guardarse tal y como se teclean, sin los espacios sobrantes del principio y del final. El sistema MUST NOT rechazar ningún formato de teléfono ni de email.

#### Scenario: Dar de alta un empleado con nombre, teléfono y email

- **WHEN** el encargado abre el alta y teclea el nombre `Bruno`, el puesto `Cocina`, el teléfono `600 11 22 33` y el email `bruno@ejemplo.es`
- **AND** confirma el alta
- **THEN** vuelve a la lista
- **AND** la lista muestra una fila para Bruno en su posición alfabética, con su puesto `Cocina`
- **WHEN** abre la ficha de Bruno
- **THEN** el puesto es `Cocina`, el teléfono es `600 11 22 33` y el email es `bruno@ejemplo.es`

#### Scenario: Dar de alta un empleado sin teléfono ni email

- **WHEN** el encargado abre el alta y teclea únicamente el nombre `Carmen`
- **AND** confirma el alta
- **THEN** el sistema guarda a Carmen
- **AND** vuelve a la lista, que muestra una fila para Carmen
- **WHEN** abre la ficha de Carmen
- **THEN** los campos de puesto, teléfono y email están vacíos y se pueden rellenar

#### Scenario: Dos empleados con el mismo puesto

- **WHEN** la plantilla ya incluye a `Ana` con el puesto `Barra`
- **AND** el encargado da de alta a `Bruno` con el puesto `Barra`
- **THEN** el sistema lo guarda
- **AND** la lista muestra a los dos, cada uno con el puesto `Barra`

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

El nombre, el puesto, el teléfono y el email de un empleado ya dado de alta MUST ser siempre editables desde su ficha. Ninguno MUST ser de solo lectura para el encargado.

Cada campo MUST quedar guardado según se escribe, sin acción de guardar adicional y sin depender de que el encargado salga del campo, cierre el teclado o vuelva a la lista. La ficha MUST NOT ofrecer un botón de guardar global ni preguntar si se descartan los cambios al volver a la lista.

Cuando un campo queda guardado, la ficha MUST decirlo junto a ese campo, de forma que el encargado sepa que lo que acaba de escribir ya está a salvo sin tener que salir y volver a entrar para comprobarlo. Ese aviso MUST permanecer visible mientras la ficha siga abierta, y MUST NOT aparecer en un campo que el encargado no ha tocado.

Al abrir de nuevo la ficha, ningún campo MUST mostrar aviso de guardado: el aviso habla de lo que se acaba de escribir, no de lo que ya estaba guardado de antes.

El nombre editado MUST cumplir las mismas condiciones que en el alta: no puede quedar vacío ni repetir el nombre de otro empleado. Cuando no las cumple, el sistema MUST NOT guardar ese cambio, MUST explicar por qué y MUST conservar lo tecleado para corregirlo. Mientras el nombre no se pueda guardar, la ficha MUST NOT decir que ha quedado guardado. El puesto, el teléfono y el email MUST poder vaciarse.

El sistema MUST NOT ofrecer deshacer una edición ya guardada.

#### Scenario: Editar el teléfono de un empleado existente

- **WHEN** el empleado Bruno tiene el teléfono `600 11 22 33`
- **AND** el encargado abre su ficha y cambia el teléfono a `611 22 33 44`
- **AND** vuelve a la lista
- **WHEN** abre de nuevo la ficha de Bruno
- **THEN** el teléfono es `611 22 33 44`

#### Scenario: Editar el puesto de un empleado existente

- **WHEN** el empleado Bruno tiene el puesto `Cocina`
- **AND** el encargado abre su ficha y cambia el puesto a `Jefe de cocina`
- **AND** vuelve a la lista
- **THEN** la fila de Bruno muestra el puesto `Jefe de cocina`

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

### Requirement: Privacidad de los datos de contacto y de la nota

El teléfono, el email, la nota y el motivo de la ausencia de un empleado MUST verse y editarse únicamente en la ficha de ese empleado dentro del panel de empleados.

El sistema MUST NOT mostrarlos en la lista de empleados ni en ninguna pantalla del cuadrante.

El puesto MUST quedar fuera de esa restricción: MUST poder mostrarse en la lista de empleados, porque describe la función de una persona dentro del local y no permite localizarla ni identificarla fuera de él.

El sistema MUST NOT enviar a ningún servicio externo el teléfono, el email, la nota ni el motivo de la ausencia, MUST NOT sincronizarlos con ningún otro dispositivo y MUST NOT incluirlos en las exportaciones de cuadrante ni de horas registradas.

#### Scenario: El teléfono y el email no salen de la ficha

- **WHEN** el empleado Bruno tiene puesto, teléfono, email, nota y motivo de la ausencia
- **AND** el encargado mira la lista de empleados y después el cuadrante
- **THEN** ninguna de las dos pantallas muestra su teléfono, su email, su nota ni el motivo de su ausencia
- **AND** la lista muestra su nombre y su puesto
- **AND** el cuadrante muestra solo su nombre

## ADDED Requirements

### Requirement: Motivo de la ausencia desde la ficha

La ficha MUST ofrecer un campo de motivo de la ausencia, de texto libre, uno por empleado, siempre editable por el encargado.

Ese campo MUST comportarse igual que la nota: MUST quedar guardado según se escribe, MUST decirlo junto al campo, MUST poder vaciarse y MUST NOT tener longitud máxima ni estructura impuesta —ni categorías, ni lista cerrada de motivos, ni fecha, ni más de un motivo por empleado—.

El motivo de la ausencia MUST NOT mostrarse fuera de la ficha: ni en la lista de empleados ni en ninguna celda del cuadrante.

El motivo MUST ser independiente de que el empleado tenga o no días marcados como ausencia en el cuadrante: escribirlo MUST NOT marcar ninguna celda, y marcar una ausencia en una celda MUST NOT exigir escribir un motivo.

#### Scenario: Escribir el motivo de la ausencia de un empleado

- **WHEN** el encargado abre la ficha de Bruno, que no tiene motivo escrito
- **AND** escribe `Baja médica hasta el 20/09/2026`
- **THEN** junto al campo se indica que ha quedado guardado
- **WHEN** vuelve a la lista y abre de nuevo la ficha de Bruno
- **THEN** el motivo de la ausencia es `Baja médica hasta el 20/09/2026`

#### Scenario: El motivo no obliga a marcar ausencias

- **WHEN** el encargado escribe el motivo de la ausencia de Bruno
- **AND** vuelve al cuadrante
- **THEN** ninguna celda de Bruno ha cambiado de estado

#### Scenario: Marcar una ausencia no exige escribir el motivo

- **WHEN** el encargado marca como ausencia la celda de Bruno del martes
- **THEN** el sistema la marca sin pedirle ningún motivo
- **AND** la celda muestra la etiqueta de ausencia

#### Scenario: El motivo de la ausencia se puede vaciar

- **WHEN** la ficha de Bruno tiene el motivo `Baja médica hasta el 20/09/2026`
- **AND** el encargado borra el contenido del campo
- **AND** vuelve a la lista y abre de nuevo la ficha de Bruno
- **THEN** el campo del motivo de la ausencia está vacío
- **AND** el resto de datos de Bruno no han cambiado

### Requirement: El teclado no tapa el campo que se está escribiendo

Mientras el encargado escribe en un campo de la ficha, ese campo MUST seguir visible en pantalla: el teclado del dispositivo MUST NOT taparlo ni total ni parcialmente.

Esto MUST cumplirse para todos los campos de la ficha, y en particular para los que están más abajo y para los que crecen con lo que se escribe: la nota y el motivo de la ausencia.

Cuando el teclado se cierra, la pantalla MUST recuperar su disposición anterior sin dejar hueco vacío al final del contenido.

#### Scenario: Escribir en la nota con el teclado abierto

- **WHEN** el encargado abre la ficha de Bruno y toca el campo de la nota
- **THEN** el teclado se abre
- **AND** el campo de la nota sigue viéndose por encima del teclado
- **WHEN** escribe varias líneas
- **THEN** sigue viendo lo que está escribiendo

#### Scenario: Escribir en el motivo de la ausencia con el teclado abierto

- **WHEN** el encargado abre la ficha de Bruno y toca el campo del motivo de la ausencia
- **THEN** el campo sigue viéndose por encima del teclado mientras escribe

#### Scenario: Al cerrar el teclado la ficha recupera su sitio

- **WHEN** el encargado termina de escribir en la nota y cierra el teclado
- **THEN** la ficha vuelve a mostrarse como antes de abrirlo
- **AND** no queda un hueco en blanco al final del contenido

### Requirement: La pista de escritura de una fecha coincide con lo que se puede teclear

Cuando la interfaz muestra una pista de cómo escribir una fecha, esa pista MUST NOT contener caracteres que el teclado ofrecido para ese campo no permita teclear.

#### Scenario: La pista de la fecha se puede teclear con el teclado que se abre

- **WHEN** el encargado añade un rango de vacaciones y toca el campo de la fecha de inicio
- **THEN** la pista de escritura del campo solo contiene caracteres que puede teclear con el teclado que se le abre
- **AND** puede escribir la fecha siguiendo esa pista sin cambiar de teclado
