## Purpose

El almacenamiento del cuadrante es lo que hace que lo planificado siga estando ahí cuando el
encargado vuelve a abrir la app: guarda en el dispositivo el contenido de cada celda —los
turnos planificados, las ausencias y las vacaciones de cada empleado y cada día, en cualquier
semana— y garantiza que lo que se acaba de escribir se lea igual después, tanto en la misma
sesión como en las siguientes.

## Requirements

### Requirement: El cuadrante sobrevive al cierre de la app

El contenido de una celda —turnos planificados, ausencia o vacaciones— MUST conservarse en el
dispositivo cuando la app se cierra, y MUST volver a estar disponible tal cual al abrirla de
nuevo.

Esa conservación MUST NOT depender de que el encargado guarde nada a mano, cierre la app de
ninguna forma concreta ni la deje abierta: el contenido de una celda queda conservado en cuanto
la escritura que lo produjo termina.

El sistema MUST NOT perder ni alterar el contenido de ninguna celda por el hecho de cerrar y
reabrir la app. Una celda vacía MUST seguir vacía al reabrir: el sistema MUST NOT hacer
reaparecer en ella nada que se hubiera borrado.

#### Scenario: Un turno planificado sigue en su celda tras reabrir la app

- **WHEN** el encargado planifica a `Bruno` un turno de `09:00` a `17:00` el jueves
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la celda de `Bruno` en la columna del jueves muestra `09:00` y `17:00`

#### Scenario: Un día con dos turnos sobrevive entero

- **WHEN** el encargado planifica a `Ana` el lunes un turno de `12:00` a `16:00` y otro de
  `20:00` a `00:00`
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la celda de `Ana` en la columna del lunes muestra `12:00` y `16:00`, y debajo `20:00`
  y `00:00`
- **AND** los dos turnos siguen en orden de hora de inicio ascendente

#### Scenario: Un turno que cruza la medianoche sobrevive en el día en que empieza

- **WHEN** el encargado planifica a `Bruno` un turno que empieza el viernes a las `20:00` y
  termina a las `02:00`
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la celda de `Bruno` en la columna del viernes muestra `20:00` y `02:00`
- **AND** la celda de `Bruno` en la columna del sábado sigue vacía

#### Scenario: Una ausencia sobrevive al cierre

- **WHEN** el encargado marca una ausencia a `Bruno` el martes
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la celda de `Bruno` en la columna del martes muestra la etiqueta `AUS`

#### Scenario: Unas vacaciones sobreviven al cierre

- **WHEN** el encargado marca vacaciones a `Carmen` del `14/09/2026` al `20/09/2026`
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** las siete celdas de `Carmen` de esa semana muestran la etiqueta `VAC`

#### Scenario: Una celda vaciada sigue vacía tras reabrir

- **WHEN** el encargado planifica a `Ana` un turno el miércoles y después vacía esa celda
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la celda de `Ana` en la columna del miércoles se presenta vacía
- **AND** no reaparece el turno que se había vaciado

#### Scenario: El cuadrante entero sobrevive a varias reaperturas

- **WHEN** el encargado ha planificado turnos, ausencias y vacaciones a `Ana`, `Bruno` y
  `Carmen`
- **AND** cierra y reabre la app tres veces seguidas sin tocar nada más
- **THEN** todas las celdas muestran exactamente el mismo contenido que antes de la primera vez

### Requirement: Se conserva el cuadrante de cualquier semana

La conservación MUST alcanzar a todas las semanas que el encargado haya planificado, y no solo
a la que estaba viendo al cerrar la app. Al desplazarse a una semana anterior o posterior tras
reabrir, el sistema MUST mostrar lo que se planificó en ella.

El sistema MUST NOT descartar lo planificado de una semana por antigüedad, por lejanía ni por
haber cambiado de semana en pantalla.

#### Scenario: Una semana pasada sigue planificada

- **WHEN** el encargado planifica turnos en la semana `07/09/2026 - 13/09/2026`
- **AND** se desplaza a otra semana, cierra la app y la vuelve a abrir
- **AND** vuelve a la semana `07/09/2026 - 13/09/2026`
- **THEN** las celdas de esa semana muestran los turnos que planificó

#### Scenario: Una semana futura sigue planificada

- **WHEN** el encargado planifica turnos en la semana `21/09/2026 - 27/09/2026`
- **AND** cierra la app por completo y la vuelve a abrir
- **AND** se desplaza a la semana `21/09/2026 - 27/09/2026`
- **THEN** las celdas de esa semana muestran los turnos que planificó

#### Scenario: Planificar una semana no borra las demás

- **WHEN** el encargado tiene turnos planificados en tres semanas distintas
- **AND** planifica un turno nuevo en una cuarta semana
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** las cuatro semanas conservan sus turnos

### Requirement: Toda escritura del cuadrante queda reflejada en la lectura siguiente

Cuando una escritura sobre una celda termina, toda lectura posterior del cuadrante MUST
reflejarla, sin que haga falta cerrar la app, cambiar de semana ni refrescar nada.

Esto MUST cumplirse igual dentro de la misma sesión y después de reabrir la app: el sistema
MUST NOT tener una versión de lo planificado en pantalla y otra distinta en el dispositivo.

#### Scenario: Sustituir el contenido de una celda

- **WHEN** la celda de `Ana` del lunes tiene un turno de `09:00` a `17:00`
- **AND** el encargado marca vacaciones en esa celda
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la celda de `Ana` del lunes muestra la etiqueta `VAC`
- **AND** no queda rastro del turno de `09:00` a `17:00`

#### Scenario: Lo pegado en una celda se conserva

- **WHEN** el encargado copia una celda con un turno de `09:00` a `17:00` y lo pega en la celda
  de `Carmen` del sábado
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** la celda de `Carmen` del sábado muestra `09:00` y `17:00`

### Requirement: La baja de un empleado no deja nada suyo en el cuadrante

Cuando un empleado se da de baja, el sistema MUST eliminar del dispositivo todos sus turnos
planificados, sus ausencias y sus vacaciones, de todas las semanas.

Esa eliminación MUST venir de cómo están guardados los datos, y MUST NOT depender de que
ninguna pantalla recorra semana por semana lo que hubiera que borrar.

El sistema MUST NOT alterar lo planificado de los demás empleados al dar de baja a uno.

Un empleado dado de alta después de una baja MUST empezar con el cuadrante vacío, aunque su
nombre coincida con el de alguien dado de baja antes.

#### Scenario: Dar de baja borra lo planificado del empleado

- **WHEN** `Bruno` tiene turnos planificados, una ausencia y vacaciones en varias semanas
- **AND** el encargado le da de baja
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** no queda ninguna celda de `Bruno` en ninguna semana

#### Scenario: La baja de uno no toca el cuadrante de los demás

- **WHEN** `Ana`, `Bruno` y `Carmen` tienen turnos planificados la misma semana
- **AND** el encargado da de baja a `Bruno`
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** `Ana` y `Carmen` conservan exactamente los turnos que tenían

#### Scenario: Un alta con el mismo nombre empieza sin cuadrante

- **WHEN** `Bruno` tenía turnos planificados y el encargado le da de baja
- **AND** después da de alta a un empleado llamado `Bruno`
- **THEN** todas las celdas del nuevo `Bruno` se presentan vacías
- **AND** siguen vacías tras cerrar y reabrir la app

### Requirement: La plantilla ya guardada no se altera al llegar el almacenamiento del cuadrante

Al abrir por primera vez una instalación que ya tenía plantilla guardada de una versión
anterior de la app, el sistema MUST conservar intactas todas las fichas.

El sistema MUST NOT pedir al encargado que haga nada para que eso ocurra, y MUST NOT mostrarle
ninguna pantalla de preparación ni de migración.

El cuadrante de esa instalación MUST presentarse vacío, porque lo planificado antes nunca llegó
a guardarse, y a partir de ese momento MUST conservarse.

#### Scenario: Una instalación con plantilla conserva sus fichas

- **WHEN** una instalación tiene dadas de alta a `Ana`, `Bruno` y `Carmen` con sus teléfonos,
  emails y notas
- **AND** se abre por primera vez la versión de la app que guarda el cuadrante
- **THEN** la plantilla sigue siendo `Ana`, `Bruno` y `Carmen`, con sus datos intactos
- **AND** no se muestra ninguna pantalla de preparación

#### Scenario: A partir de esa apertura el cuadrante ya se conserva

- **WHEN** se ha abierto por primera vez la versión de la app que guarda el cuadrante
- **AND** el encargado planifica un turno a `Ana`
- **AND** cierra la app por completo y la vuelve a abrir
- **THEN** el turno de `Ana` sigue ahí

### Requirement: Lo guardado del cuadrante no sale del dispositivo

Los turnos planificados, las ausencias y las vacaciones guardados MUST permanecer únicamente en
el dispositivo del encargado.

El sistema MUST NOT enviarlos a ningún servicio, servidor ni destinatario, y MUST NOT
sincronizarlos con ningún otro dispositivo. La única salida de lo planificado MUST seguir siendo
la exportación que el encargado lanza a mano.

#### Scenario: Planificar no envía nada a ninguna parte

- **WHEN** el encargado planifica turnos, ausencias y vacaciones durante toda una sesión
- **THEN** el sistema no envía lo planificado a ningún destino fuera del dispositivo
- **AND** lo único que puede salir del dispositivo es la exportación que el encargado lanza a
  mano
