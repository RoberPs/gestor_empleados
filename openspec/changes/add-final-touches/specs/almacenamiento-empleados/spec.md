## MODIFIED Requirements

### Requirement: La plantilla sobrevive al cierre de la app

Los datos de la ficha de un empleado —nombre, puesto, teléfono, email, nota y motivo de la
ausencia— MUST conservarse en el dispositivo cuando la app se cierra, y MUST volver a estar
disponibles tal cual al abrirla de nuevo.

Esa conservación MUST NOT depender de que el encargado guarde nada a mano, cierre la app de
ninguna forma concreta ni la deje abierta: un dato queda conservado en cuanto la escritura que
lo produjo termina.

El sistema MUST NOT perder ni alterar ningún dato de la ficha por el hecho de cerrar y reabrir
la app.

#### Scenario: La ficha de un empleado sigue ahí tras reabrir la app

- **WHEN** el encargado da de alta a `Bruno` con el teléfono `600 11 22 33`, el email
  `bruno@ejemplo.es` y la nota `No puede los martes por la tarde`
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la plantilla incluye a `Bruno`
- **AND** su teléfono es `600 11 22 33`, su email es `bruno@ejemplo.es` y su nota es
  `No puede los martes por la tarde`

#### Scenario: El puesto y el motivo de la ausencia sobreviven al cierre

- **WHEN** el encargado escribe el puesto `Cocina` y el motivo de la ausencia
  `Baja médica hasta el 20/09/2026` en la ficha de `Bruno`
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** el puesto de `Bruno` es `Cocina`
- **AND** su motivo de la ausencia es `Baja médica hasta el 20/09/2026`

#### Scenario: La plantilla entera sobrevive a varias reaperturas

- **WHEN** el encargado da de alta a `Ana`, `Bruno` y `Carmen`
- **AND** cierra y reabre la app tres veces seguidas sin tocar nada más
- **THEN** la plantilla sigue siendo `Ana`, `Bruno` y `Carmen`, en ese orden
- **AND** ninguna de las tres fichas ha cambiado

#### Scenario: Una baja también sobrevive al cierre de la app

- **WHEN** la plantilla es `Ana`, `Bruno` y `Carmen`
- **AND** el encargado da de baja a `Bruno`
- **AND** cierra la app y la vuelve a abrir
- **THEN** la plantilla es `Ana` y `Carmen`
- **AND** `Bruno` no reaparece

### Requirement: Actualización automática del almacenamiento al arrancar

Cuando el almacenamiento que hay en el dispositivo corresponde a una versión anterior de la
app, el sistema MUST adaptarlo al arrancar, de forma automática y antes de atender ninguna
lectura o escritura.

Esa adaptación MUST conservar los datos que ya había: los empleados dados de alta, el
contenido de sus fichas y el contenido del cuadrante MUST seguir estando después, sin que el
encargado tenga que volver a introducirlos.

Una adaptación MUST poder retirar del almacenamiento datos que la app ha dejado de usar. Al
hacerlo MUST retirar únicamente esos, y MUST NOT tocar la plantilla, las fichas ni el
cuadrante. El encargado MUST NOT perder por ello ningún dato que la app le siga mostrando.

El sistema MUST NOT pedir al encargado que autorice la adaptación, MUST NOT ofrecerle
saltársela y MUST NOT mostrarle ningún detalle técnico sobre ella.

Un almacenamiento ya adaptado MUST NOT volver a adaptarse en arranques posteriores, y el
resultado de arrancar dos veces seguidas MUST ser el mismo que el de arrancar una.

El sistema MUST NOT abrir un almacenamiento creado por una versión de la app **posterior** a
la instalada, porque no puede saber qué contiene; ese caso se trata como base de datos que no
puede abrirse.

#### Scenario: Abrir la app tras actualizarla conservando la plantilla

- **WHEN** el encargado tiene en la app a `Ana`, `Bruno` y `Carmen` con sus fichas rellenas
- **AND** instala una versión posterior de la app que necesita un almacenamiento distinto
- **AND** la abre
- **THEN** el sistema adapta el almacenamiento sin pedirle nada
- **AND** la plantilla sigue siendo `Ana`, `Bruno` y `Carmen`
- **AND** sus teléfonos, emails y notas siguen siendo los mismos

#### Scenario: Una adaptación que retira datos no toca la plantilla

- **WHEN** el encargado tiene a `Ana`, `Bruno` y `Carmen` con sus fichas rellenas y un
  cuadrante con turnos planificados, ausencias y vacaciones
- **AND** instala una versión de la app que ha dejado de usar parte de lo guardado
- **AND** la abre
- **THEN** la plantilla sigue siendo `Ana`, `Bruno` y `Carmen` con sus fichas intactas
- **AND** el cuadrante conserva todos sus turnos planificados, ausencias y vacaciones
- **AND** el encargado no ve ningún aviso ni tiene que hacer nada

#### Scenario: Arrancar dos veces seguidas no vuelve a adaptar nada

- **WHEN** el encargado abre la app tras una actualización y el sistema adapta el
  almacenamiento
- **AND** cierra la app y la vuelve a abrir sin instalar nada nuevo
- **THEN** el sistema no vuelve a adaptar el almacenamiento
- **AND** la plantilla es exactamente la misma que antes de cerrar

### Requirement: Validez de los campos de la ficha al escribir

El nombre MUST ser obligatorio: el sistema MUST NOT guardar un empleado cuyo nombre, una vez
quitados los espacios sobrantes del principio y del final, quede vacío.

El nombre MUST ser único en la plantilla, ignorando mayúsculas y espacios sobrantes: el
sistema MUST NOT guardar un alta ni una edición que deje a dos empleados con el mismo nombre
bajo esa comparación. Corregir solo las mayúsculas o los espacios del nombre de un empleado
MUST NOT contar como nombre repetido consigo mismo.

El puesto, el teléfono, el email, la nota y el motivo de la ausencia MUST ser opcionales: un
empleado con nombre a secas MUST poder guardarse, y cada uno de esos cinco campos MUST poder
vaciarse después sin afectar a los demás.

El puesto y el motivo de la ausencia MUST ser texto libre. El sistema MUST NOT restringirlos a
un conjunto cerrado de valores, MUST NOT imponerles ningún formato y MUST NOT exigir que el
puesto sea distinto entre empleados: dos personas pueden compartir puesto.

El nombre, el puesto, el teléfono y el email MUST guardarse tal y como se teclean, sin los
espacios sobrantes del principio y del final. El sistema MUST NOT rechazar ningún formato de
teléfono ni de email, y MUST NOT imponer ninguna longitud máxima a la nota ni al motivo de la
ausencia.

Cuando el sistema rechaza una escritura por incumplir estas reglas, MUST decir cuál de las dos
condiciones del nombre no se cumple —vacío o repetido—, para que la pantalla pueda explicarlo
al encargado.

#### Scenario: Guardar un empleado solo con nombre

- **WHEN** el encargado da de alta a `Carmen` sin puesto, sin teléfono, sin email y sin nota
- **THEN** el sistema la guarda
- **AND** la lectura siguiente de su ficha devuelve el nombre `Carmen` y el puesto, el teléfono,
  el email, la nota y el motivo de la ausencia vacíos

#### Scenario: Un empleado sin nombre no se guarda

- **WHEN** se intenta dar de alta a un empleado cuyo nombre es `   ` y cuyo teléfono es
  `600112233`
- **THEN** el sistema no lo guarda
- **AND** indica que el nombre está vacío
- **AND** la plantilla no cambia

#### Scenario: Un nombre repetido no se guarda

- **WHEN** la plantilla ya incluye a `Ana`
- **AND** se intenta dar de alta a otra empleada con el nombre ` ana `
- **THEN** el sistema no lo guarda
- **AND** indica que el nombre está repetido
- **AND** la plantilla sigue teniendo una sola `Ana`
- **WHEN** se intenta de nuevo con el nombre `Ana G.`
- **THEN** el sistema lo guarda

#### Scenario: Corregir las mayúsculas del propio nombre sí se guarda

- **WHEN** la plantilla incluye a `ana` y a `Bruno`
- **AND** el encargado cambia el nombre de `ana` por `Ana`
- **THEN** el sistema lo guarda
- **AND** la lectura siguiente de su ficha devuelve el nombre `Ana`

#### Scenario: Los campos se guardan sin los espacios de los extremos

- **WHEN** el encargado da de alta a un empleado con el nombre ` Bruno `, el teléfono
  ` 600 11 22 33 ` y el email ` bruno@ejemplo.es `
- **THEN** la lectura siguiente de su ficha devuelve el nombre `Bruno`, el teléfono
  `600 11 22 33` y el email `bruno@ejemplo.es`

#### Scenario: Vaciar el email de un empleado

- **WHEN** `Ana` tiene el email `ana@ejemplo.es`
- **AND** el encargado deja su email vacío
- **THEN** la lectura siguiente de su ficha devuelve el email vacío
- **AND** su nombre, su teléfono y su nota no han cambiado

#### Scenario: Dos empleados con el mismo puesto se guardan

- **WHEN** la plantilla incluye a `Ana` con el puesto `Barra`
- **AND** se da de alta a `Bruno` con el puesto `Barra`
- **THEN** el sistema lo guarda
- **AND** la lectura siguiente devuelve a los dos con el puesto `Barra`

#### Scenario: El puesto se guarda sin los espacios de los extremos

- **WHEN** el encargado escribe ` Jefe de cocina ` como puesto de `Bruno`
- **THEN** la lectura siguiente de su ficha devuelve el puesto `Jefe de cocina`

#### Scenario: Vaciar el puesto de un empleado

- **WHEN** `Ana` tiene el puesto `Barra`
- **AND** el encargado deja su puesto vacío
- **THEN** la lectura siguiente de su ficha devuelve el puesto vacío
- **AND** su nombre, su teléfono, su email, su nota y su motivo de la ausencia no han
  cambiado
