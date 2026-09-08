## Purpose

La identidad visual es el aspecto único de la app: la paleta, la escala tipográfica y el contraste mínimo con los que se dibujan todas las pantallas, para que el encargado reconozca el mismo producto en el cuadrante, en el panel de empleados y en cualquier pantalla que se añada después, y lea sus datos de pie, con prisa y con el móvil en la mano.

## Requirements

### Requirement: Una sola identidad visual para toda la app

Todas las pantallas de la app MUST dibujarse con la misma paleta y la misma escala tipográfica: cuadrante semanal, panel de empleados, ficha del empleado, formularios, hojas de acciones, confirmaciones y avisos.

Un mismo tipo de elemento MUST verse igual en todas las pantallas donde aparezca: el mismo color de texto principal, el mismo color de texto secundario, el mismo tratamiento para una acción y el mismo tratamiento para una acción destructiva.

Ninguna pantalla MUST introducir un color ni un tamaño de letra propios que no formen parte de la paleta y de la escala definidas en esta capability.

La app MUST tener un único aspecto, claro. El sistema MUST NOT ofrecer un tema oscuro, ni un selector de tema, ni cambiar de aspecto según la preferencia de tema del dispositivo.

#### Scenario: El mismo elemento se ve igual en dos pantallas distintas

- **WHEN** el encargado ve el nombre de un empleado en el cuadrante y el nombre del mismo empleado en el panel de empleados
- **THEN** los dos se muestran con el mismo color de texto y el mismo peso

#### Scenario: La acción destructiva se reconoce en cualquier pantalla

- **WHEN** el encargado abre la confirmación de eliminar el contenido de una celda
- **AND** después abre la confirmación de dar de baja a un empleado desde su ficha
- **THEN** en las dos la acción destructiva se presenta con el mismo color de texto y el mismo fondo
- **AND** ese tratamiento es distinto del de las acciones que no destruyen nada

#### Scenario: El tema oscuro del dispositivo no cambia la app

- **WHEN** el encargado tiene el móvil en tema oscuro y abre la app
- **THEN** la app se muestra con su aspecto claro, igual que con el móvil en tema claro
- **AND** no se ofrece en ninguna pantalla una opción de cambiar el tema

### Requirement: Paleta de la aplicación

La app MUST usar exactamente esta paleta, y cada color MUST usarse solo para el papel indicado:

| Papel | Valor |
| --- | --- |
| Fondo de pantalla | `#FFFFFF` |
| Fondo de cabecera y de barras | `#F1F3F5` |
| Texto principal | `#101418` |
| Texto secundario | `#4A5560` |
| Línea de la rejilla y separadores | `#848C95` |
| Borde marcado (etiquetas, delimitación fuerte) | `#101418` |
| Acción (botones y accesos de la interfaz) | `#1D4ED8` |
| Fondo de la indicación de semana en curso | `#E8EFFF` |
| Fondo de una celda de ausencia | `#FFF1DC` |
| Texto y borde de una celda de ausencia | `#8A4008` |
| Fondo de una celda de vacaciones | `#E4F4E8` |
| Texto y borde de una celda de vacaciones | `#14602F` |
| Fondo de una acción destructiva | `#FDECE7` |
| Texto de una acción destructiva | `#8C2F1A` |
| Velo sobre el que se abren hojas y confirmaciones | `rgba(16, 20, 24, 0.45)` |

El fondo de una celda de ausencia y el de una acción destructiva MUST ser distintos entre sí: una ausencia es un estado del cuadrante, no un aviso de que algo se va a borrar.

#### Scenario: Los estados de la celda se distinguen por su color

- **WHEN** el encargado ve una semana con una celda de ausencia, una de vacaciones y una con turno planificado
- **THEN** la celda de ausencia se muestra sobre fondo `#FFF1DC` y la de vacaciones sobre fondo `#E4F4E8`
- **AND** la celda con turno planificado se muestra sobre el fondo de pantalla, sin fondo propio

#### Scenario: Una ausencia no se confunde con un aviso de borrado

- **WHEN** el encargado ve una celda de ausencia
- **AND** abre después una confirmación de eliminación
- **THEN** el fondo de la celda de ausencia y el de la acción destructiva no son el mismo color

### Requirement: El color no es el único portador de significado

La identidad visual MUST NOT hacer que ningún estado dependa únicamente del color para reconocerse. Cada estado de una celda MUST conservar, además de su color, su propio texto —las horas, `AUS`, `VAC`— y su propio borde.

Vista la pantalla en escala de grises, el encargado MUST seguir distinguiendo una celda de ausencia, una de vacaciones, una con turno planificado y una vacía.

#### Scenario: El cuadrante en escala de grises

- **WHEN** se mira el cuadrante en escala de grises con celdas en los cuatro estados
- **THEN** la celda de ausencia se reconoce por su etiqueta `AUS` y su borde continuo
- **AND** la celda de vacaciones se reconoce por su etiqueta `VAC` y su borde discontinuo
- **AND** la celda con turno planificado se reconoce por sus horas
- **AND** la celda vacía se reconoce por no mostrar nada

### Requirement: Escala tipográfica de la aplicación

La app MUST componer sus textos con la fuente del sistema del dispositivo. El sistema MUST NOT empaquetar ni descargar una fuente propia.

Todo texto de la app MUST usar uno de estos papeles, con el tamaño en puntos y el peso indicados:

| Papel | Tamaño | Peso |
| --- | --- | --- |
| Horas del turno planificado en la celda | 12 | medium |
| Etiquetas `AUS` y `VAC` | 13 | bold |
| Nombre del día en la cabecera de la rejilla | 9 | medium |
| Día del mes en la cabecera de la rejilla | 13 | bold |
| Nombre del empleado en la rejilla | 13 | medium |
| Nombre del empleado en la lista del panel | 15 | medium |
| Cuerpo (textos, campos, acciones) | 15 | regular |
| Título | 17 | bold |

El nombre del empleado tiene dos tamaños porque tiene dos papeles: en la rejilla comparte ancho con siete columnas de día, y en la lista del panel es el contenido de una fila que se toca. El color y el peso MUST ser los mismos en los dos sitios.

Los tamaños MUST ser exactamente estos: la identidad visual no altera la densidad ya verificada de la rejilla ni el reparto de anchos de sus columnas.

El nombre del día MUST seguir mostrándose completo, sin abreviar, ajustando su tamaño cuando no quepa, tal y como exige `cuadrante-semanal`. El sistema MUST NOT ponerlo en mayúsculas: a la anchura mínima soportada, la caja alta obligaría a reducirlo por debajo de lo legible.

#### Scenario: Jerarquía dentro de la cabecera de la rejilla

- **WHEN** el encargado ve la cabecera de días del cuadrante
- **THEN** el día del mes se muestra a 13 puntos en bold y el nombre del día a 9 puntos en medium
- **AND** el nombre del día aparece completo y en minúsculas salvo su inicial, no en mayúsculas

#### Scenario: Las horas de la celda se leen a un brazo de distancia

- **WHEN** el encargado ve una celda con un turno planificado de 09:00 a 17:00
- **THEN** las dos horas se muestran a 12 puntos en medium, con el color de texto principal
- **AND** se muestran completas, sin truncar ni abreviar

### Requirement: Todo dato numérico se compone con cifras de ancho fijo

Todo texto de la app que muestre un dato numérico MUST componerse con cifras de ancho fijo (cifras tabulares), de modo que los números queden alineados en columna y no bailen al cambiar de valor.

Esto MUST aplicarse al menos a: las horas del turno planificado en la celda, las horas en los formularios y en las acciones de celda, el rango de fechas de la semana, el día del mes en la cabecera de la rejilla y las fechas de vacaciones de la ficha del empleado.

#### Scenario: Las horas de dos filas quedan alineadas

- **WHEN** el cuadrante muestra un turno de `09:00` a `17:00` en una fila y otro de `11:00` a `18:00` en la fila de abajo, en la misma columna de día
- **THEN** los dígitos de las dos filas quedan alineados verticalmente entre sí

#### Scenario: El rango de la semana no cambia de ancho al navegar

- **WHEN** el encargado ve el rango `07/09/2026 - 13/09/2026`
- **AND** toca la acción de semana siguiente hasta llegar a `28/09/2026 - 04/10/2026`
- **THEN** el rango sigue ocupando el mismo ancho en pantalla
- **AND** su posición no se desplaza al cambiar los dígitos

### Requirement: Contraste mínimo legible

Todo texto de la app MUST alcanzar un contraste mínimo de 4,5 a 1 contra el fondo sobre el que se dibuja, incluido el texto sobre el fondo de una celda de ausencia, de vacaciones o de una acción destructiva.

Las líneas que separan las celdas de la rejilla, las que separan las filas de un listado y los bordes de las etiquetas `AUS` y `VAC` MUST alcanzar un contraste mínimo de 3 a 1 contra el fondo sobre el que se dibujan: delimitan a qué empleado y a qué día pertenece lo que el encargado está mirando, y sin ellas la rejilla deja de leerse.

Ningún texto de la app MUST quedar por debajo de esos mínimos, tampoco el texto secundario ni el de una acción deshabilitada.

#### Scenario: La rejilla se lee con luz fuerte

- **WHEN** el encargado mira el cuadrante en la terraza, a plena luz
- **THEN** distingue las líneas que separan unas celdas de otras
- **AND** distingue a qué fila y a qué columna pertenece cada celda

#### Scenario: El texto sobre un fondo de estado sigue siendo legible

- **WHEN** el encargado ve una celda de ausencia y una celda de vacaciones
- **THEN** las etiquetas `AUS` y `VAC` se leen con claridad sobre su fondo

### Requirement: La identidad visual no altera el comportamiento ni la estructura

La identidad visual MUST limitarse al aspecto: colores, pesos, variantes de cifra y color de bordes.

El sistema MUST conservar sin cambios el reparto de anchos de la rejilla, el ancho mínimo soportado de 360 puntos, el área pulsable mínima de 44 × 44 puntos de cada celda y de cada acción, la ausencia de scroll horizontal, la estructura de cada pantalla, sus textos y su flujo de toques.

#### Scenario: El cuadrante conserva su geometría

- **WHEN** el encargado abre el cuadrante en una pantalla de 360 puntos de ancho en orientación vertical con 20 empleados dados de alta
- **THEN** las siete columnas de día siguen siendo visibles a la vez sin scroll horizontal
- **AND** cada celda conserva un área pulsable de al menos 44 × 44 puntos
- **AND** las horas de los turnos planificados se siguen mostrando completas, sin truncar ni abreviar

#### Scenario: Ningún texto de la interfaz cambia

- **WHEN** el encargado recorre el cuadrante, el panel de empleados y la ficha de un empleado
- **THEN** lee los mismos textos que antes del cambio de aspecto
- **AND** las acciones disponibles en cada pantalla son las mismas
