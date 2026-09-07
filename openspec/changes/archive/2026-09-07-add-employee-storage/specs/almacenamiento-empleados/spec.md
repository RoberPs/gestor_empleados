## Purpose

El almacenamiento de empleados es lo que hace que la plantilla siga estando ahí cuando el
encargado vuelve a abrir la app: guarda en el dispositivo la ficha de cada empleado —su
nombre, su teléfono, su email y su nota— y garantiza que un alta, una edición o una baja
queden reflejadas en todo lo que se lea después, tanto en la misma sesión como en las
siguientes.

## ADDED Requirements

### Requirement: La plantilla sobrevive al cierre de la app

Los datos de la ficha de un empleado —nombre, teléfono, email y nota— MUST conservarse en el
dispositivo cuando la app se cierra, y MUST volver a estar disponibles tal cual al abrirla de
nuevo.

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

### Requirement: Primera ejecución con la plantilla vacía

Cuando la app arranca por primera vez y no existe todavía ningún almacenamiento de datos, el
sistema MUST crearlo antes de atender ninguna lectura o escritura, y la plantilla MUST quedar
vacía.

El sistema MUST NOT sembrar empleados de ejemplo, de demostración ni de prueba.

La creación MUST ser automática: el sistema MUST NOT pedir al encargado que la confirme, que
elija dónde guardar los datos ni que espere ante ninguna pantalla de preparación.

Una vez creado el almacenamiento, la primera alta MUST poder hacerse sin ningún paso previo.

#### Scenario: Arrancar la app por primera vez

- **WHEN** el encargado abre la app en un dispositivo donde no se había abierto nunca
- **THEN** el sistema crea el almacenamiento de datos
- **AND** la plantilla está vacía
- **AND** no se le pide ninguna confirmación ni ninguna elección sobre los datos

#### Scenario: Dar de alta al primer empleado en una plantilla recién creada

- **WHEN** la app acaba de arrancar por primera vez y la plantilla está vacía
- **AND** el encargado da de alta a `Ana`
- **THEN** el sistema guarda a `Ana`
- **AND** la plantilla pasa a tener un único empleado, `Ana`

### Requirement: Actualización automática del almacenamiento al arrancar

Cuando el almacenamiento que hay en el dispositivo corresponde a una versión anterior de la
app, el sistema MUST adaptarlo al arrancar, de forma automática y antes de atender ninguna
lectura o escritura.

Esa adaptación MUST conservar los datos que ya había: los empleados dados de alta y el
contenido de sus fichas MUST seguir estando después, sin que el encargado tenga que volver a
introducirlos.

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

#### Scenario: Arrancar dos veces seguidas no vuelve a adaptar nada

- **WHEN** el encargado abre la app tras una actualización y el sistema adapta el
  almacenamiento
- **AND** cierra la app y la vuelve a abrir sin instalar nada nuevo
- **THEN** el sistema no vuelve a adaptar el almacenamiento
- **AND** la plantilla es exactamente la misma que antes de cerrar

### Requirement: Toda escritura queda reflejada en la lectura siguiente

Un alta, una edición o una baja MUST quedar reflejadas en cualquier lectura posterior de la
plantilla o de la ficha, sin que haga falta cerrar la app, refrescar nada ni esperar.

Una escritura que el sistema acepta MUST quedar conservada por completo. Una escritura que el
sistema rechaza MUST NOT dejar rastro: la plantilla y las fichas MUST quedar exactamente como
estaban antes de intentarla.

El sistema MUST NOT dejar una escritura a medias: nunca MUST leerse un empleado con parte de
los campos de una edición aplicados y parte no.

#### Scenario: Un alta se ve en el listado siguiente

- **WHEN** la plantilla es `Ana` y `Carmen`
- **AND** el encargado da de alta a `Bruno`
- **THEN** la lectura siguiente de la plantilla devuelve `Ana`, `Bruno` y `Carmen`
- **AND** la ficha de `Bruno` devuelve el nombre `Bruno`

#### Scenario: Una edición se ve en la lectura siguiente

- **WHEN** `Bruno` tiene el teléfono `600 11 22 33`
- **AND** el encargado cambia su teléfono a `611 22 33 44`
- **THEN** la lectura siguiente de la ficha de `Bruno` devuelve el teléfono `611 22 33 44`
- **AND** su nombre, su email y su nota no han cambiado

#### Scenario: Una baja se ve en la lectura siguiente

- **WHEN** la plantilla es `Ana`, `Bruno` y `Carmen`
- **AND** el encargado da de baja a `Bruno`
- **THEN** la lectura siguiente de la plantilla devuelve `Ana` y `Carmen`
- **AND** la lectura de la ficha de `Bruno` indica que ya no está en la plantilla

#### Scenario: Una escritura rechazada no deja rastro

- **WHEN** la plantilla es `Ana` y `Bruno`
- **AND** se intenta dar de alta a un empleado con el nombre vacío
- **THEN** el sistema no lo guarda
- **AND** la lectura siguiente de la plantilla devuelve exactamente `Ana` y `Bruno`

### Requirement: Orden alfabético español del listado de empleados

El listado de la plantilla MUST devolver los empleados ordenados por nombre en orden
alfabético ascendente, según el orden alfabético del español, el mismo orden con el que el
cuadrante ordena sus filas y con el que el panel de empleados ordena las suyas.

Ese orden MUST tratar una letra acentuada igual que la misma letra sin acentuar, y MUST
colocar la `Ñ` después de la `N` y antes de la `O`.

El orden MUST NOT depender de las mayúsculas y minúsculas con las que se tecleó el nombre, ni
del orden en que los empleados se dieron de alta, ni de ninguna agrupación adicional: el
listado no tiene secciones, ni separadores, ni orden manual definido por el encargado.

Dos lecturas seguidas del listado sin escrituras entre medias MUST devolver los empleados en
el mismo orden.

#### Scenario: Listar una plantilla con acentos y con Ñ

- **WHEN** la plantilla se ha dado de alta en el orden `Óscar`, `Zoe`, `Ana`, `Ñoño`, `Núria`,
  `Ángel`
- **AND** se lee el listado de la plantilla
- **THEN** los empleados se devuelven en el orden `Ana`, `Ángel`, `Núria`, `Ñoño`, `Óscar`,
  `Zoe`

#### Scenario: El orden ignora las mayúsculas

- **WHEN** la plantilla es `bruno`, `Ana` y `CARMEN`
- **AND** se lee el listado de la plantilla
- **THEN** los empleados se devuelven en el orden `Ana`, `bruno`, `CARMEN`

#### Scenario: Cambiar un nombre cambia su posición en el listado

- **WHEN** la plantilla es `Ana`, `Bruno` y `Carmen`
- **AND** el encargado cambia el nombre de `Carmen` por `Alberto`
- **THEN** la lectura siguiente del listado devuelve `Alberto`, `Ana`, `Bruno`

### Requirement: Validez de los campos de la ficha al escribir

El nombre MUST ser obligatorio: el sistema MUST NOT guardar un empleado cuyo nombre, una vez
quitados los espacios sobrantes del principio y del final, quede vacío.

El nombre MUST ser único en la plantilla, ignorando mayúsculas y espacios sobrantes: el
sistema MUST NOT guardar un alta ni una edición que deje a dos empleados con el mismo nombre
bajo esa comparación. Corregir solo las mayúsculas o los espacios del nombre de un empleado
MUST NOT contar como nombre repetido consigo mismo.

El teléfono, el email y la nota MUST ser opcionales: un empleado con nombre a secas MUST poder
guardarse, y cada uno de esos tres campos MUST poder vaciarse después sin afectar a los demás.

El nombre, el teléfono y el email MUST guardarse tal y como se teclean, sin los espacios
sobrantes del principio y del final. El sistema MUST NOT rechazar ningún formato de teléfono
ni de email, y MUST NOT imponer ninguna longitud máxima a la nota.

Cuando el sistema rechaza una escritura por incumplir estas reglas, MUST decir cuál de las dos
condiciones del nombre no se cumple —vacío o repetido—, para que la pantalla pueda explicarlo
al encargado.

#### Scenario: Guardar un empleado solo con nombre

- **WHEN** el encargado da de alta a `Carmen` sin teléfono, sin email y sin nota
- **THEN** el sistema la guarda
- **AND** la lectura siguiente de su ficha devuelve el nombre `Carmen` y el teléfono, el email
  y la nota vacíos

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

### Requirement: La baja de un empleado es un borrado definitivo

Dar de baja a un empleado MUST eliminar del dispositivo su ficha completa —nombre, teléfono,
email y nota—, no marcarla como inactiva.

El sistema MUST NOT conservar ningún histórico de plantilla, ninguna papelera y ninguna forma
de recuperar a un empleado dado de baja.

El almacenamiento MUST garantizar que un empleado dado de baja no deja detrás nada asociado a
él en ninguna semana, ni pasada ni futura: sus turnos planificados, sus ausencias, sus
vacaciones y sus horas registradas MUST desaparecer con él. Esa garantía MUST venir de cómo
están guardados los datos, no de que quien escribe el código se acuerde de borrarlos uno a
uno.

Un nombre que quedó libre al dar de baja a un empleado MUST poder reutilizarse en un alta
posterior, y ese alta MUST crear un empleado nuevo, sin recuperar nada del anterior.

#### Scenario: Dar de baja a un empleado no deja nada suyo

- **WHEN** la plantilla es `Ana`, `Bruno` y `Carmen`
- **AND** el encargado da de baja a `Bruno`
- **AND** cierra la app y la vuelve a abrir
- **THEN** la plantilla es `Ana` y `Carmen`
- **AND** no queda en el dispositivo ningún dato asociado a `Bruno`, en ninguna semana

#### Scenario: Reutilizar el nombre de un empleado dado de baja

- **WHEN** el encargado da de baja a `Bruno`, que tenía el teléfono `600 11 22 33` y la nota
  `No puede los martes por la tarde`
- **AND** da de alta después a otro empleado con el nombre `Bruno`
- **THEN** el sistema lo guarda
- **AND** la ficha del nuevo `Bruno` tiene el teléfono, el email y la nota vacíos

### Requirement: Los datos guardados no salen del dispositivo

El teléfono, el email y la nota de un empleado MUST guardarse únicamente en el almacenamiento
local del dispositivo.

El sistema MUST NOT enviarlos a ningún servicio externo, MUST NOT sincronizarlos con ningún
otro dispositivo, MUST NOT hacer con ellos ninguna copia fuera de la app y MUST NOT incluirlos
en las exportaciones de cuadrante ni de horas registradas.

El almacenamiento MUST NOT ser accesible a otras aplicaciones del dispositivo, y su protección
MUST ser la que da el propio sistema operativo al almacenamiento privado de la app, junto con
el desbloqueo del móvil.

El sistema MUST NOT registrar ni enviar analítica, telemetría ni diagnósticos que contengan
datos de la plantilla.

#### Scenario: Los datos de contacto se quedan en el dispositivo

- **WHEN** el encargado rellena el teléfono, el email y la nota de `Bruno`
- **AND** usa la app con el dispositivo sin conexión a ninguna red
- **THEN** los datos se guardan y siguen ahí al reabrir la app
- **AND** no se envía nada a ningún servicio externo

### Requirement: Comportamiento cuando el almacenamiento no puede abrirse

Cuando el sistema no consigue abrir el almacenamiento al arrancar —porque el fichero está
dañado, no es legible o corresponde a una versión posterior de la app—, MUST NOT continuar
como si la plantilla estuviera vacía.

El sistema MUST NOT borrar, sobrescribir ni recrear el almacenamiento existente para poder
seguir arrancando: los datos que haya MUST conservarse intactos para un intento posterior.

El sistema MUST NOT aceptar altas, ediciones ni bajas mientras el almacenamiento no esté
abierto, para no dar por guardado lo que no se ha guardado.

En ese caso el sistema MUST mostrar al encargado, en lugar del cuadrante y ocupando la app
entera, un aviso que diga en lenguaje llano que sus datos no se han podido abrir y que no se ha
borrado nada. Ese aviso MUST ofrecer una acción para volver a intentarlo, y MUST NOT dejar
alcanzable ninguna otra pantalla mientras el almacenamiento siga sin abrirse: ni el cuadrante,
ni el panel de empleados, ni la ficha.

Cuando el encargado vuelve a intentarlo, el sistema MUST reintentar la apertura y, si esta vez
funciona, MUST continuar hasta el cuadrante con los datos que había. Si vuelve a fallar, MUST
seguir mostrando el mismo aviso.

El aviso MUST NOT mostrar detalles técnicos —ni nombres de fichero, ni códigos, ni números de
versión del almacenamiento— y MUST NOT ofrecer al encargado borrar ni reiniciar sus datos.

#### Scenario: Arrancar con el almacenamiento dañado

- **WHEN** el fichero de datos del dispositivo está dañado y no puede abrirse
- **AND** el encargado abre la app
- **THEN** el sistema no muestra una plantilla vacía como si no hubiera empleados
- **AND** no borra ni sobrescribe el fichero existente
- **AND** no acepta ninguna alta, edición ni baja
- **AND** en lugar del cuadrante ve un aviso que dice que sus datos no se han podido abrir y que
  no se ha borrado nada, con una acción para volver a intentarlo
- **AND** no puede llegar al cuadrante, ni al panel de empleados, ni a ninguna ficha

#### Scenario: Volver a intentarlo cuando el almacenamiento ya se puede abrir

- **WHEN** el encargado está viendo el aviso de que sus datos no se han podido abrir
- **AND** el motivo del fallo ha dejado de darse
- **AND** toca la acción de volver a intentarlo
- **THEN** el sistema abre el almacenamiento
- **AND** el encargado pasa al cuadrante con su plantilla completa

#### Scenario: Arrancar con un almacenamiento de una versión posterior de la app

- **WHEN** el dispositivo tiene un almacenamiento creado por una versión de la app posterior a
  la instalada
- **AND** el encargado abre la app
- **THEN** el sistema no lo adapta ni lo abre
- **AND** conserva el fichero intacto
- **AND** ve el mismo aviso de que sus datos no se han podido abrir, sin ningún detalle técnico
  sobre versiones de almacenamiento
