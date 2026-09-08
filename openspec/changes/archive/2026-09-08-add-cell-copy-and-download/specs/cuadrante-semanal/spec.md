## ADDED Requirements

### Requirement: Copiar el contenido de una celda y pegarlo en otra

El encargado MUST poder copiar lo que contiene una celda y pegarlo en otra celda del cuadrante, para no tener que volver a teclear un turno planificado que se repite.

**Qué se copia**. Copiar MUST guardar el contenido observable de la celda: sus turnos planificados con sus horas —uno o los dos—, su ausencia o sus vacaciones. Copiar MUST NOT llevarse nada de la ficha del empleado: ni su nombre, ni su teléfono, ni su email, ni su nota, ni el motivo de su ausencia.

**Qué no se copia**. La acción de copiar MUST ofrecerse únicamente sobre una celda con turno planificado, con ausencia o con vacaciones. Sobre una celda vacía MUST NOT ofrecerse: no hay nada que copiar.

**Copiar no cambia nada**. Copiar MUST NOT modificar la celda de origen, ni la semana mostrada, ni ningún otro dato: al terminar, la celda de origen MUST conservar exactamente el contenido que tenía.

**Dónde se puede pegar**. La acción de pegar MUST ofrecerse en cualquier celda, sea cual sea su estado, siempre que haya algo copiado. MUST poder pegarse en la celda de otro empleado, en la de otro día y en la de otra semana, sea pasada, en curso o futura. Cuando no hay nada copiado, la acción de pegar MUST NOT ofrecerse.

**Qué produce el pegado**. Pegar MUST dejar la celda destino con el mismo contenido observable que tenía la celda copiada: los mismos turnos planificados con las mismas horas, la misma ausencia o las mismas vacaciones. Cuando lo copiado eran dos turnos, la celda destino MUST quedar con los dos. Pegar MUST NOT vaciar la celda de origen ni convertir el contenido copiado en otra cosa.

**Cuánto dura lo copiado**. Lo copiado MUST poder pegarse tantas veces como el encargado quiera, sin volver a copiar. Copiar otra celda MUST sustituir lo copiado anteriormente. Lo copiado MUST durar mientras la app está abierta y MUST desaparecer al cerrarla: el sistema MUST NOT guardarlo en el almacenamiento del dispositivo.

**Dónde se ofrecen**. Copiar y pegar MUST ofrecerse entre las acciones de la celda, junto a las demás, y MUST usar las palabras completas igual que ellas. Al terminar o cancelar, el encargado MUST volver al cuadrante en la misma semana desde la que lo inició.

#### Scenario: Copiar un turno planificado y repetirlo otro día

- **WHEN** Bruno tiene el lunes un turno planificado de `09:00` a `17:00`
- **AND** el encargado toca esa celda y elige copiar
- **THEN** vuelve al cuadrante en la misma semana
- **AND** la celda de Bruno del lunes sigue mostrando `09:00` y `17:00`
- **WHEN** toca la celda vacía de Bruno del martes y elige pegar
- **THEN** la celda de Bruno del martes muestra `09:00` y `17:00`
- **AND** la celda de Bruno del lunes sigue mostrando `09:00` y `17:00`

#### Scenario: Pegar el mismo turno en varias celdas sin volver a copiar

- **WHEN** el encargado ha copiado la celda del lunes de Bruno, con un turno de `09:00` a `17:00`
- **AND** pega en la celda vacía del martes de Bruno
- **AND** pega en la celda vacía del miércoles de Bruno
- **AND** pega en la celda vacía del lunes de Ana
- **THEN** las tres celdas muestran `09:00` y `17:00`
- **AND** no ha tenido que volver a copiar entre un pegado y otro

#### Scenario: Copiar una celda con dos turnos

- **WHEN** Ana tiene el lunes un turno de `12:00` a `16:00` y otro de `20:00` a `00:00`
- **AND** el encargado copia esa celda y pega en la celda vacía de Ana del jueves
- **THEN** la celda de Ana del jueves muestra `12:00` y `16:00`, y debajo `20:00` y `00:00`
- **WHEN** vuelve a tocar la celda de Ana del jueves
- **THEN** ya no se le ofrece añadir otro turno

#### Scenario: Copiar unas vacaciones y extenderlas a los demás días

- **WHEN** Carmen tiene vacaciones el lunes
- **AND** el encargado copia esa celda y pega en las celdas vacías del martes y del miércoles de Carmen
- **THEN** las celdas de Carmen del lunes, del martes y del miércoles muestran la etiqueta `VAC`

#### Scenario: Pegar en otra semana

- **WHEN** el encargado copia una celda con un turno de `09:00` a `17:00` de la semana `07/09/2026 - 13/09/2026`
- **AND** navega a la semana `14/09/2026 - 20/09/2026`
- **THEN** se le sigue ofreciendo pegar
- **WHEN** pega en una celda vacía de esa semana
- **THEN** esa celda muestra `09:00` y `17:00`
- **AND** sigue viendo el cuadrante en la semana `14/09/2026 - 20/09/2026`

#### Scenario: Una celda vacía no se puede copiar

- **WHEN** el encargado toca una celda vacía
- **THEN** entre las acciones ofrecidas no está copiar

#### Scenario: Sin nada copiado no se ofrece pegar

- **WHEN** el encargado abre la app y no ha copiado ninguna celda
- **AND** toca una celda cualquiera
- **THEN** entre las acciones ofrecidas no está pegar

#### Scenario: Lo copiado no sobrevive a cerrar la app

- **WHEN** el encargado copia una celda con un turno planificado
- **AND** cierra la app y vuelve a abrirla
- **AND** toca una celda
- **THEN** no se le ofrece pegar
- **AND** el cuadrante muestra los mismos turnos planificados que antes de cerrarla

#### Scenario: Copiar otra celda sustituye lo copiado

- **WHEN** el encargado copia una celda con un turno de `09:00` a `17:00`
- **AND** después copia una celda con un turno de `20:00` a `23:00`
- **AND** pega en una celda vacía
- **THEN** esa celda muestra `20:00` y `23:00`

#### Scenario: Copiar no se lleva los datos de la ficha

- **WHEN** Bruno tiene teléfono, email, nota y el motivo `Baja médica` escritos en su ficha
- **AND** su celda del martes está marcada como ausencia
- **AND** el encargado copia esa celda y pega en la celda vacía del jueves de Ana
- **THEN** la celda de Ana del jueves muestra la etiqueta `AUS`
- **AND** ni la celda ni sus acciones muestran el teléfono, el email, la nota ni el motivo de nadie
- **AND** la ficha de Ana no ha cambiado

### Requirement: Pegar sobre una celda con contenido pide confirmación

Pegar sobre una celda que ya tiene turno planificado, ausencia o vacaciones sustituye lo que hubiera, y eso hace desaparecer contenido igual que eliminarlo. Por eso el sistema MUST pedir una confirmación explícita al encargado antes de sustituirlo.

Si el encargado no confirma, la celda destino MUST conservar exactamente el contenido que tenía, y lo copiado MUST seguir disponible para pegarlo en otro sitio.

Sobre una celda vacía el sistema MUST NOT pedir ninguna confirmación: no hay nada que perder y pedirla convertiría en dos toques la operación que este requisito existe para abreviar.

El sistema MUST NOT ofrecer deshacer un pegado ya confirmado, igual que no ofrece deshacer una eliminación.

#### Scenario: Pegar sobre un turno planificado existente

- **WHEN** el encargado ha copiado una celda con un turno de `09:00` a `17:00`
- **AND** pega sobre una celda que tiene un turno de `20:00` a `23:00`
- **THEN** el sistema le pide que confirme que va a sustituir el contenido de esa celda
- **WHEN** confirma
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda muestra `09:00` y `17:00`
- **AND** ya no muestra `20:00` ni `23:00`

#### Scenario: Desistir de pegar encima

- **WHEN** el encargado ha copiado una celda con un turno de `09:00` a `17:00`
- **AND** pega sobre una celda que tiene vacaciones y no confirma
- **THEN** vuelve al cuadrante en la misma semana
- **AND** esa celda sigue mostrando la etiqueta `VAC`
- **WHEN** toca una celda vacía
- **THEN** se le sigue ofreciendo pegar

#### Scenario: Pegar en una celda vacía no pregunta nada

- **WHEN** el encargado ha copiado una celda con un turno de `09:00` a `17:00`
- **AND** pega sobre una celda vacía
- **THEN** no se le pide ninguna confirmación
- **AND** esa celda muestra `09:00` y `17:00`

## MODIFIED Requirements

### Requirement: Toda celda es editable desde el cuadrante

Ninguna celda MUST ser de solo lectura para el encargado. Un toque sobre cualquier celda, sea cual sea su estado, MUST abrir las acciones disponibles para ese empleado y ese día, sin salir del contexto de la semana mostrada.

El estado de la celda MUST NOT depender de la semana a la que pertenece: una celda de una semana ya pasada MUST ofrecer exactamente las mismas acciones que una de la semana en curso o de una futura, sin aviso ni confirmación adicional por ser pasada.

Las acciones ofrecidas MUST depender del estado de la celda:

- Sobre una celda vacía, el sistema MUST ofrecer: crear turno planificado, marcar ausencia y marcar vacaciones.
- Sobre una celda con un turno planificado, el sistema MUST ofrecer: editar ese turno, añadir un segundo turno ese mismo día, sustituir el contenido por ausencia, sustituirlo por vacaciones, copiar el contenido de la celda y eliminar el turno.
- Sobre una celda con dos turnos planificados, el sistema MUST ofrecer: editar cada uno de los dos por separado, eliminar cada uno de los dos por separado, sustituir el contenido por ausencia, sustituirlo por vacaciones y copiar el contenido de la celda. El sistema MUST NOT ofrecer añadir un tercer turno.
- Sobre una celda con ausencia, el sistema MUST ofrecer: ver la ausencia, cambiarla a vacaciones, sustituirla por un turno planificado, copiar el contenido de la celda y eliminarla.
- Sobre una celda con vacaciones, el sistema MUST ofrecer: cambiarlas a ausencia, sustituirlas por un turno planificado, copiar el contenido de la celda y eliminarlas.

A esas acciones se suma pegar, que MUST ofrecerse en cualquiera de los cuatro estados cuando hay algo copiado, tal y como describe «Copiar el contenido de una celda y pegarlo en otra».

Ver la ausencia MUST llevar a la ficha del empleado de esa celda, donde vive el motivo de la ausencia. El sistema MUST NOT mostrar el motivo dentro de la celda ni dentro de las acciones: la rejilla sigue mostrando la ausencia como una etiqueta y nada más. Esa acción MUST ofrecerse tenga o no tenga escrito un motivo ese empleado.

Al terminar o cancelar la acción, el encargado MUST volver al cuadrante en la misma semana desde la que la inició, con la celda ya actualizada si hubo cambio.

Las horas del turno planificado MUST mostrarse siempre en formato 24h `hh:mm`.

Al introducirlas, el sistema MUST admitir las formas naturales de teclear una hora con el teclado numérico de un móvil, y MUST normalizarlas a `hh:mm`: con separador (`9:30`, `09:30`, `9.30`, `9,30`, `9h30`), solo dígitos (`930`, `0930`) y la hora sola cuando es en punto (`9` equivale a `09:00`). El sistema MUST NOT exigir una única forma de escritura, y MUST seguir rechazando lo que no sea una hora del día.

El sistema MUST NOT permitir guardar un turno planificado cuya hora de fin coincide con su hora de inicio, e informará de por qué no puede guardarse sin perder lo ya introducido. Una hora de fin anterior a la de inicio MUST aceptarse: es un turno que cruza la medianoche.

Cuando el encargado corrige una hora, esa explicación MUST desaparecer: no debe leerse que sigue sin poder guardarse un turno que ya es válido.

Eliminar un turno planificado, una ausencia o unas vacaciones MUST requerir una confirmación explícita del encargado antes de que el contenido desaparezca de la celda. Si el encargado no confirma, la celda MUST conservar el contenido que tenía. El sistema MUST NOT ofrecer deshacer una eliminación ya confirmada.

Las acciones de la celda MUST seguir siendo manejables con una mano y con la pantalla más estrecha soportada: cada acción MUST poder leerse entera, sin truncar ni abreviar, y MUST conservar un área pulsable de al menos 44 puntos de alto. Esto MUST cumplirse también en el estado que más acciones ofrece.

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

#### Scenario: Las acciones se leen enteras en el estado más cargado

- **WHEN** el encargado ha copiado una celda
- **AND** toca, en la anchura mínima soportada, una celda con dos turnos planificados
- **THEN** se le ofrecen todas las acciones de ese estado, incluidas copiar y pegar
- **AND** cada una se lee entera, sin truncar ni abreviar
- **AND** cada una conserva un área pulsable de al menos 44 puntos de alto

### Requirement: Exportar la semana desde el cuadrante

La pantalla del cuadrante MUST ofrecer una acción permanente de exportar la semana mostrada, alcanzable con un solo toque y disponible en cualquier semana, sea pasada, en curso o futura.

Esa acción MUST ofrecer al encargado los dos destinos que describe `exportacion-cuadrante`: **compartir** la semana por la hoja del sistema y **guardar una copia** del documento en el dispositivo. El sistema MUST NOT elegir uno de los dos por él, y MUST permitirle desistir sin haber exportado nada.

La exportación MUST ser siempre la de la semana que se está viendo en ese momento, y el sistema MUST devolver al encargado al cuadrante en esa misma semana al terminar o al desistir, por cualquiera de los dos destinos.

La acción MUST NOT ofrecerse en el estado vacío sin empleados dados de alta: sin plantilla no hay cuadrante que exportar.

La acción MUST NOT robarle sitio a la rejilla: con la plantilla completa, el cuadrante MUST seguir mostrando los siete días sin scroll horizontal y las mismas filas de empleado que mostraba antes de existir esa acción.

#### Scenario: Compartir la semana que se está viendo

- **WHEN** el encargado se ha desplazado a la semana `14/09/2026 - 20/09/2026`
- **AND** toca la acción de exportar y elige compartir
- **THEN** se comparte el cuadrante de la semana `14/09/2026 - 20/09/2026`
- **WHEN** termina o desiste
- **THEN** ve de nuevo el cuadrante en la semana `14/09/2026 - 20/09/2026`

#### Scenario: Guardar la semana que se está viendo

- **WHEN** el encargado se ha desplazado a la semana `14/09/2026 - 20/09/2026`
- **AND** toca la acción de exportar y elige guardar una copia
- **THEN** se guarda el cuadrante de la semana `14/09/2026 - 20/09/2026`
- **WHEN** termina o desiste
- **THEN** ve de nuevo el cuadrante en la semana `14/09/2026 - 20/09/2026`

#### Scenario: Desistir de exportar sin elegir destino

- **WHEN** el encargado toca la acción de exportar y no elige ni compartir ni guardar
- **THEN** vuelve al cuadrante en la misma semana
- **AND** no se ha compartido ni guardado ningún documento
- **AND** no se le muestra ningún error

#### Scenario: Compartir una semana ya pasada

- **WHEN** el encargado navega a una semana ya pasada
- **THEN** se le sigue ofreciendo la acción de exportar, con sus dos destinos
- **AND** no se le pide ninguna confirmación adicional por ser una semana pasada

#### Scenario: El estado vacío no ofrece compartir

- **WHEN** el encargado abre la app y no hay ningún empleado dado de alta
- **THEN** se le ofrece dar de alta al primer empleado
- **AND** no se le ofrece la acción de exportar

#### Scenario: La acción de compartir no descoloca la rejilla

- **WHEN** el encargado abre el cuadrante con 20 empleados dados de alta, en la anchura mínima soportada
- **THEN** la acción de exportar es visible y pulsable
- **AND** las siete columnas de día siguen viéndose a la vez, sin scroll horizontal
- **AND** se ven tantas filas de empleado como antes de existir esa acción
