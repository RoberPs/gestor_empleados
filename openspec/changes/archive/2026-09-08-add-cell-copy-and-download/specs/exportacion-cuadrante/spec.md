## ADDED Requirements

### Requirement: El documento se puede guardar en el dispositivo

Además de compartirlo, el encargado MUST poder guardar el documento producido en su propio dispositivo, para quedárselo sin tener que mandárselo a nadie.

**El encargado elige dónde**. El sistema MUST pedirle el destino a través del selector de carpetas del propio dispositivo. El sistema MUST NOT escribir el documento en una carpeta elegida por él sin decírselo, MUST NOT dar por hecho ninguna carpeta concreta y MUST NOT pedir permisos de acceso al almacenamiento del dispositivo que no le haga falta para eso.

**El fichero llega con su nombre**. El documento guardado MUST llevar el mismo nombre con el que se comparte, el que identifica la semana, para que el encargado lo reconozca en la carpeta donde lo puso sin abrirlo.

**Es el mismo documento**. Lo guardado MUST ser exactamente el mismo documento que se comparte: mismo contenido, mismo formato y las mismas reglas de qué puede y qué no puede aparecer, incluida la de no contener datos de contacto.

**Guardar no cambia nada**. Guardar MUST NOT modificar la plantilla, el cuadrante ni la semana mostrada. Al terminar, el encargado MUST seguir en el cuadrante, en la misma semana desde la que lanzó la exportación.

**Desistir no es un fallo**. Si el encargado cierra el selector de carpetas sin elegir ninguna, el sistema MUST devolverlo al cuadrante sin error y sin haber escrito ningún fichero.

**Confirmación de que ha quedado guardado**. Cuando el documento se guarda, el sistema MUST decírselo al encargado. Cuando no se puede guardar, el sistema MUST decírselo en un lenguaje que entienda y MUST NOT mostrarle ningún detalle técnico ni ninguna ruta de fichero.

**La app no se queda una copia**. Guardar MUST dejar el documento donde el encargado dijo y en ningún otro sitio: el sistema MUST NOT llevar un historial de exportaciones ni conservar una copia propia del documento en su almacenamiento.

**Sin plantilla no se guarda nada**. Cuando la plantilla está vacía, el sistema MUST NOT producir ni guardar ningún documento, y MUST decir al encargado que no hay nada que exportar, igual que al compartir.

#### Scenario: Guardar la semana en la carpeta que elige el encargado

- **WHEN** el encargado lanza la exportación de una semana con la plantilla dada de alta
- **AND** elige guardar una copia
- **THEN** se abre el selector de carpetas del dispositivo
- **WHEN** elige una carpeta
- **THEN** el documento queda guardado en esa carpeta
- **AND** el sistema le indica que ha quedado guardado
- **AND** sigue en el cuadrante, en la misma semana

#### Scenario: El fichero guardado se reconoce por su nombre

- **WHEN** el encargado guarda la semana `07/09/2026 - 13/09/2026`
- **THEN** el fichero guardado lleva el mismo nombre con el que se comparte esa semana
- **AND** ese nombre identifica la semana sin necesidad de abrir el documento

#### Scenario: Lo guardado es el mismo documento que se comparte

- **WHEN** todos los empleados de la plantilla tienen teléfono, email, nota y motivo de la ausencia escritos
- **AND** el encargado guarda la semana en una carpeta de su dispositivo
- **THEN** el documento guardado muestra de cada uno solo su nombre
- **AND** no aparece ningún teléfono, email, nota ni motivo de ausencia
- **AND** su contenido es el mismo que tendría el documento compartido de esa semana

#### Scenario: Desistir de guardar

- **WHEN** se ha abierto el selector de carpetas y el encargado lo cierra sin elegir ninguna
- **THEN** vuelve al cuadrante en la misma semana
- **AND** no se ha escrito ningún fichero en el dispositivo
- **AND** no se le muestra ningún error

#### Scenario: El guardado falla

- **WHEN** el documento no se puede guardar en la carpeta elegida
- **THEN** el sistema se lo indica al encargado en lenguaje corriente
- **AND** no se le muestra ningún mensaje técnico ni ninguna ruta de fichero
- **AND** sigue en el cuadrante, en la misma semana

#### Scenario: Guardar con la plantilla vacía

- **WHEN** no hay ningún empleado dado de alta
- **AND** el encargado intenta guardar una copia
- **THEN** no se produce ni se guarda ningún documento
- **AND** se le indica que no hay nada que exportar

#### Scenario: Guardar no cambia nada de lo guardado en la app

- **WHEN** el encargado guarda una semana con turnos planificados, ausencias y vacaciones
- **THEN** la plantilla y el contenido del cuadrante quedan exactamente como estaban
- **AND** al reabrir la app nada ha cambiado

## MODIFIED Requirements

### Requirement: El documento se entrega por la hoja de compartir del sistema

Una vez producido el documento, el sistema MUST poder ofrecerlo a través de la hoja de compartir del dispositivo, desde la que el encargado elige qué hacer con él.

Compartir MUST ser uno de los dos destinos posibles de la exportación; el otro es guardarlo en el dispositivo, según describe «El documento se puede guardar en el dispositivo». El sistema MUST NOT elegir el destino por el encargado.

Al compartir, el sistema MUST NOT elegir por él una aplicación de destino, MUST NOT guardarlo en una carpeta del dispositivo sin decírselo y MUST NOT enviarlo a ningún servicio por su cuenta.

Si el encargado cierra la hoja de compartir sin elegir nada, el sistema MUST devolverlo al cuadrante sin error y sin haber enviado nada a ninguna parte.

Cuando el documento no se puede producir o no se puede compartir, el sistema MUST decírselo en un lenguaje que entienda y MUST NOT mostrarle ningún detalle técnico.

#### Scenario: Compartir la semana exportada

- **WHEN** el encargado lanza la exportación de una semana con la plantilla dada de alta
- **AND** elige compartir
- **THEN** se abre la hoja de compartir del dispositivo con el documento
- **AND** desde ella puede enviarlo, guardarlo o imprimirlo

#### Scenario: Desistir de compartir

- **WHEN** se ha abierto la hoja de compartir y el encargado la cierra sin elegir nada
- **THEN** vuelve al cuadrante en la misma semana
- **AND** no se ha enviado el documento a ninguna parte
- **AND** no se le muestra ningún error

#### Scenario: La exportación falla

- **WHEN** el documento no se puede producir en el dispositivo
- **THEN** el sistema se lo indica al encargado en lenguaje corriente
- **AND** no se le muestra ningún mensaje técnico
- **AND** sigue en el cuadrante, en la misma semana
