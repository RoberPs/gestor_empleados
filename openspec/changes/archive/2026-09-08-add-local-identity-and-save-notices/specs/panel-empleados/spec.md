## MODIFIED Requirements

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
