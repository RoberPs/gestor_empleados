## ADDED Requirements

### Requirement: La entrega del documento donde no hay hoja de compartir ni selector de carpetas

Los dos destinos de la exportación —«El documento se entrega por la hoja de compartir del
sistema» y «El documento se puede guardar en el dispositivo»— dan por hecho dos cosas del móvil:
que hay una hoja de compartir y que hay un selector de carpetas. Donde la app corre sin ninguna
de las dos, como en un navegador, el sistema MUST entregar igualmente el documento por la vía
que ese entorno ofrezca para quedarse con un fichero.

**Es el mismo documento**. Lo entregado así MUST ser exactamente el mismo documento que se
comparte y se guarda en el móvil: mismo contenido, mismo formato y las mismas reglas de qué
puede y qué no puede aparecer, incluida la de no contener datos de contacto. El sistema MUST
proponer para el fichero el mismo nombre que identifica la semana en el móvil; donde el entorno
deje cambiarlo antes de quedárselo, la última palabra MUST ser de quien lo exporta.

**Solo se afirma lo que se sabe**. Donde la entrega la resuelve un diálogo del propio entorno y
el sistema no puede saber si el fichero llegó a guardarse, el sistema MUST NOT afirmar que ha
quedado guardado. MUST NOT dar por hecho tampoco lo contrario ni mostrar un error por ello.

**Se produce donde se lanza**. El documento MUST producirse en el propio dispositivo desde el
que se lanza la exportación. El sistema MUST NOT enviar el cuadrante a ningún servicio externo
para componerlo, convertirlo ni entregarlo, y MUST NOT dejar una copia en ningún sitio distinto
de donde quien lo lanzó lo haya recibido.

**Entregar no cambia nada**. La entrega MUST NOT modificar la plantilla, el cuadrante ni la
semana mostrada. Al terminar, quien lanzó la exportación MUST seguir en el cuadrante, en la
misma semana.

**Desistir no es un fallo**. Si la entrega se interrumpe sin llegar a completarse, el sistema
MUST devolverlo al cuadrante sin error y sin haber enviado nada a ninguna parte.

**Los avisos no cambian**. Cuando el documento no se puede producir o no se puede entregar, el
sistema MUST decírselo en un lenguaje que entienda y MUST NOT mostrarle ningún detalle técnico
ni ninguna ruta de fichero. Cuando la plantilla está vacía, el sistema MUST NOT producir ningún
documento y MUST decir que no hay nada que exportar, igual que en el móvil.

Este requisito **no relaja** los otros dos: donde sí existen la hoja de compartir y el selector
de carpetas, siguen aplicándose tal cual están escritos.

#### Scenario: Exportar la semana desde un navegador

- **WHEN** quien prueba la demo lanza la exportación de una semana con la plantilla dada de alta
- **THEN** recibe el documento de esa semana como fichero
- **AND** el nombre que se le propone al fichero es el mismo con el que se comparte esa semana
  desde el móvil
- **AND** no se le afirma que haya quedado guardado, porque quien lo decide es el diálogo del
  navegador
- **AND** sigue en el cuadrante, en la misma semana

#### Scenario: El documento entregado fuera del móvil respeta las mismas reglas

- **WHEN** todos los empleados de la plantilla tienen teléfono, email, nota y motivo de la
  ausencia escritos
- **AND** se exporta la semana desde un navegador
- **THEN** el documento muestra de cada uno solo su nombre
- **AND** no aparece ningún teléfono, email, nota ni motivo de ausencia
- **AND** su contenido es el mismo que tendría el documento compartido de esa semana desde el
  móvil

#### Scenario: El cuadrante no viaja a ningún servicio para exportarlo

- **WHEN** se lanza la exportación de una semana desde un navegador
- **THEN** el documento se produce sin enviar el cuadrante fuera del dispositivo
- **AND** no queda ninguna copia del documento fuera de donde quien lo lanzó lo recibió

#### Scenario: Exportar desde un navegador con la plantilla vacía

- **WHEN** no hay ningún empleado dado de alta
- **AND** se lanza la exportación desde un navegador
- **THEN** no se produce ningún documento
- **AND** se indica que no hay nada que exportar
