## Purpose

La exportación del cuadrante es la única vía por la que lo planificado sale del móvil del encargado: la que hace que un empleado sepa su horario sin entrar en la app, y la única copia del cuadrante que existe fuera del dispositivo.

## Requirements

### Requirement: El cuadrante de una semana se exporta como documento

El sistema MUST poder producir, a partir de la semana mostrada en el cuadrante, un documento en formato PDF con el contenido de esa semana.

El documento MUST corresponder a **una sola semana**: la que el encargado está viendo cuando lanza la exportación. El sistema MUST NOT exportar varias semanas en un mismo documento ni pedir al encargado que elija un rango.

La exportación MUST NOT modificar nada: ni la plantilla, ni el cuadrante, ni la semana mostrada. Al terminar, el encargado MUST seguir en el cuadrante, en la misma semana desde la que la lanzó.

#### Scenario: Exportar la semana que se está viendo

- **WHEN** el encargado se ha desplazado a la semana `14/09/2026 - 20/09/2026`
- **AND** lanza la exportación
- **THEN** el documento producido corresponde a la semana `14/09/2026 - 20/09/2026`
- **AND** al terminar sigue viendo el cuadrante en esa misma semana

#### Scenario: Exportar no cambia nada de lo guardado

- **WHEN** el encargado exporta una semana con turnos planificados, ausencias y vacaciones
- **THEN** la plantilla y el contenido del cuadrante quedan exactamente como estaban
- **AND** al reabrir la app nada ha cambiado

### Requirement: Contenido del documento exportado

El documento MUST contener una fila por empleado dado de alta y una columna por día, de lunes a domingo en ese orden, igual que la rejilla de la pantalla.

Cada celda del documento MUST reflejar lo que muestra la celda equivalente del cuadrante:

- Con turno planificado, sus horas en formato 24h `hh:mm`, y los dos turnos cuando el día tiene dos.
- Con ausencia, que ese día es una ausencia.
- Con vacaciones, que ese día son vacaciones.
- Vacía, sin contenido.

El documento MUST identificar de qué es y de cuándo: MUST llevar el nombre del local y el rango de fechas de la semana en formato dd/mm/aaaa.

Los empleados MUST aparecer en el mismo orden que en el cuadrante: alfabético ascendente del español.

Cuando la plantilla está vacía, el sistema MUST NOT producir un documento, y MUST decir al encargado que no hay nada que exportar.

#### Scenario: El documento recoge la semana completa

- **WHEN** la plantilla es Ana, Bruno y Carmen
- **AND** Ana tiene un turno de `09:00` a `17:00` el lunes, Bruno tiene ausencia el martes y Carmen tiene vacaciones toda la semana
- **AND** el encargado exporta esa semana
- **THEN** el documento tiene una fila para cada uno, en el orden Ana, Bruno, Carmen
- **AND** tiene siete columnas, de lunes a domingo
- **AND** la celda de Ana del lunes muestra `09:00` y `17:00`
- **AND** la celda de Bruno del martes indica que es una ausencia
- **AND** las siete celdas de Carmen indican que son vacaciones

#### Scenario: Un día con dos turnos planificados

- **WHEN** Bruno tiene el miércoles un turno de `09:00` a `13:00` y otro de `20:00` a `23:00`
- **AND** el encargado exporta esa semana
- **THEN** la celda de Bruno del miércoles muestra los dos turnos con sus cuatro horas

#### Scenario: El documento dice de qué local y de qué semana es

- **WHEN** el encargado exporta la semana `14/09/2026 - 20/09/2026`
- **THEN** el documento muestra el nombre del local
- **AND** muestra el rango `14/09/2026 - 20/09/2026`

#### Scenario: Exportar con la plantilla vacía

- **WHEN** no hay ningún empleado dado de alta
- **AND** el encargado intenta exportar
- **THEN** no se produce ningún documento
- **AND** se le indica que no hay nada que exportar

### Requirement: El documento exportado no contiene datos de contacto

El documento MUST contener, de cada empleado, únicamente su nombre.

El sistema MUST NOT incluir en el documento el teléfono, el email, la nota ni el motivo de la ausencia de ningún empleado, ni ningún otro dato de su ficha.

Esta regla MUST cumplirse sea cual sea el contenido de las fichas: el documento sale del dispositivo y llega a personas que no son el encargado.

#### Scenario: Las fichas rellenas no ensucian el documento

- **WHEN** todos los empleados de la plantilla tienen teléfono, email, nota y motivo de la ausencia escritos
- **AND** el encargado exporta la semana
- **THEN** el documento muestra de cada uno solo su nombre
- **AND** no aparece ningún teléfono, email, nota ni motivo de ausencia

#### Scenario: Una ausencia no arrastra su motivo al documento

- **WHEN** Bruno tiene ausencia el martes y el motivo `Baja médica` escrito en su ficha
- **AND** el encargado exporta esa semana
- **THEN** la celda de Bruno del martes indica que es una ausencia
- **AND** el documento no muestra el motivo

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

### Requirement: El documento es legible con la plantilla completa

El documento MUST seguir siendo legible con la plantilla completa de 20 empleados: las 20 filas y las siete columnas MUST caber sin que ninguna hora quede cortada, truncada ni abreviada.

Los nombres de los empleados MUST mostrarse completos en el documento. El sistema MUST NOT truncarlos aunque la pantalla sí lo haga.

Las horas del documento MUST mostrarse en formato 24h y las fechas como dd/mm/aaaa, igual que en la pantalla.

#### Scenario: Exportar una semana con 20 empleados

- **WHEN** la plantilla tiene 20 empleados, varios con turnos los siete días
- **AND** el encargado exporta esa semana
- **THEN** el documento incluye las 20 filas y las siete columnas
- **AND** todas las horas se leen completas, sin cortes ni abreviaturas

#### Scenario: Un nombre largo se lee entero en el documento

- **WHEN** la plantilla incluye a `Maricarmen de la Fuente Etxebarria`
- **AND** el encargado exporta la semana
- **THEN** el documento muestra su nombre completo
- **AND** no aparecen puntos suspensivos ni ninguna otra marca de texto recortado

### Requirement: El documento distingue sus partes de un vistazo

El documento MUST distinguir visualmente sus tres partes, para que se lea como un cuadrante y no como una lista de números:

- La **cabecera de días** MUST separarse del contenido.
- La **columna de empleados** MUST separarse de las columnas de día.
- Las **filas de empleado** MUST poder seguirse de lunes a domingo sin perder la línea, también con la plantilla completa de 20 empleados.

Ninguna de esas distinciones MUST depender únicamente del color: el documento se imprime, y a menudo en blanco y negro. Cada parte MUST seguir reconociéndose cuando el color desaparece.

Los estados de una celda MUST seguir distinguiéndose por su texto —las horas, la palabra completa para ausencia y para vacaciones—, y el color, cuando lo hay, MUST ser un refuerzo y nunca la única señal.

#### Scenario: La cabecera y la columna de empleados se distinguen del contenido

- **WHEN** el encargado exporta una semana con la plantilla dada de alta
- **THEN** la cabecera de días se distingue de las filas de empleado
- **AND** la columna de empleados se distingue de las siete columnas de día
- **AND** los nombres de los días y de los empleados siguen leyéndose enteros

#### Scenario: Las filas se siguen sin perder la línea

- **WHEN** la plantilla tiene 20 empleados, varios con turnos los siete días
- **AND** el encargado exporta esa semana
- **THEN** al recorrer la fila de un empleado de lunes a domingo no se salta a la fila de al lado
- **AND** las filas se distinguen entre sí sin depender de percibir el color

#### Scenario: El documento impreso en blanco y negro sigue distinguiendo sus partes

- **WHEN** el encargado imprime el documento en una impresora en blanco y negro
- **THEN** la cabecera de días, la columna de empleados y las filas siguen distinguiéndose
- **AND** una celda de ausencia sigue diciendo que es una ausencia y una de vacaciones que son vacaciones
- **AND** ninguna hora queda ilegible sobre su fondo

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
