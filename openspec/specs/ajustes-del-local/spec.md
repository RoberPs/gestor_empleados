## Purpose

Los ajustes del local son los datos del propio negocio que el encargado mantiene desde la app —hoy, su nombre— y con los que la pantalla de inicio deja de ser anónima: al abrir la app se ve de quién es el cuadrante que se está mirando.

## Requirements

### Requirement: El nombre del local es un dato editable, no un texto fijo

El sistema MUST guardar el nombre del local en el dispositivo, junto al resto de los datos de la app, y MUST poder cambiarlo el encargado desde la propia app cuantas veces quiera.

El sistema MUST NOT dar por hecho ningún nombre de local: en un dispositivo donde nunca se ha escrito, el nombre MUST estar vacío, no traer uno de ejemplo.

El nombre MUST sobrevivir al cierre de la app, igual que la plantilla. Cambiarlo MUST NOT afectar a ningún empleado, turno planificado, ausencia ni vacaciones.

El sistema MUST admitir cualquier nombre que el encargado escriba, incluidos los que llevan tildes, eñes, números y signos. El sistema MUST recortar los espacios sobrantes del principio y del final antes de guardarlo.

#### Scenario: Primera apertura en un dispositivo nuevo

- **WHEN** el encargado abre la app por primera vez en un dispositivo donde nunca ha escrito el nombre de su local
- **THEN** el nombre del local está vacío
- **AND** no aparece ningún nombre de ejemplo ni ningún nombre puesto por el sistema

#### Scenario: El nombre escrito sobrevive al cierre de la app

- **WHEN** el encargado escribe `La Esquina café` como nombre de su local
- **AND** cierra la app por completo y vuelve a abrirla
- **THEN** el nombre del local sigue siendo `La Esquina café`

#### Scenario: Cambiar el nombre del local no toca la plantilla

- **WHEN** hay tres empleados dados de alta con sus turnos planificados
- **AND** el encargado cambia el nombre del local
- **THEN** los tres empleados siguen en la plantilla
- **AND** sus turnos planificados siguen en las mismas celdas

#### Scenario: El nombre se guarda sin espacios sobrantes

- **WHEN** el encargado escribe `  La Esquina café  ` como nombre del local
- **THEN** el nombre guardado es `La Esquina café`

### Requirement: La pantalla de inicio identifica el local

La pantalla del cuadrante MUST mostrar de forma permanente la identidad del local: su logo y su nombre.

El logo MUST ser el mismo siempre y MUST venir con la app: el sistema MUST NOT ofrecer cambiarlo desde la interfaz ni pedir acceso a las fotos del dispositivo.

Cuando el nombre del local está vacío, la pantalla MUST mostrar el logo igualmente y MUST ofrecer, en su lugar, una invitación a escribir el nombre que lleve a los ajustes. La pantalla MUST NOT quedarse con un hueco en blanco ni mostrar un nombre inventado.

La identidad del local MUST NOT robarle sitio a la rejilla: con la plantilla completa, el cuadrante MUST seguir mostrando los siete días sin scroll horizontal y las mismas filas de empleado que mostraba antes de existir la cabecera de identidad.

El nombre del local MUST mostrarse completo cuando quepa y truncado con puntos suspensivos cuando no, en una sola línea. El sistema MUST NOT reducir por ello el ancho ni el alto de la rejilla.

#### Scenario: Abrir la app con el nombre del local ya escrito

- **WHEN** el nombre del local es `La Esquina café`
- **AND** el encargado abre la app
- **THEN** la pantalla del cuadrante muestra el logo y el nombre `La Esquina café`
- **AND** debajo sigue viéndose el rango de la semana, la navegación entre semanas y la rejilla

#### Scenario: Abrir la app sin haber escrito todavía el nombre

- **WHEN** el nombre del local está vacío
- **AND** el encargado abre la app
- **THEN** la pantalla muestra el logo
- **AND** ofrece una invitación a escribir el nombre del local que lleva a los ajustes

#### Scenario: Un nombre de local muy largo no descoloca la rejilla

- **WHEN** el nombre del local es más largo de lo que cabe en la pantalla
- **THEN** se muestra truncado con puntos suspensivos, en una sola línea
- **AND** las siete columnas de día siguen viéndose a la vez, sin scroll horizontal

### Requirement: Pantalla de ajustes del local

El sistema MUST ofrecer una pantalla de ajustes alcanzable desde el cuadrante con un solo toque, donde el encargado edite el nombre de su local.

La pantalla de ajustes MUST guardar el nombre según se escribe, sin acción de guardar adicional, y MUST avisar de que ha quedado guardado, igual que hace la ficha del empleado.

La pantalla MUST ofrecer volver al cuadrante en todo momento. Al volver, el cuadrante MUST mostrar ya el nombre nuevo, en la misma semana en la que estaba el encargado.

La pantalla de ajustes MUST NOT ofrecer nada más: ni copias de seguridad, ni borrado de datos, ni idioma, ni tema. Solo el nombre del local.

#### Scenario: Escribir el nombre del local desde los ajustes

- **WHEN** el encargado está en el cuadrante y toca el acceso a los ajustes
- **THEN** se abre la pantalla de ajustes con el nombre del local
- **WHEN** escribe `La Esquina café`
- **THEN** el sistema avisa de que ha quedado guardado
- **WHEN** vuelve al cuadrante
- **THEN** la cabecera muestra `La Esquina café`
- **AND** el cuadrante sigue en la semana en la que estaba

#### Scenario: Corregir el nombre del local

- **WHEN** el nombre del local es `La Esquina cafe`
- **AND** el encargado abre los ajustes y lo corrige a `La Esquina café`
- **AND** vuelve al cuadrante
- **THEN** la cabecera muestra `La Esquina café`

#### Scenario: Los ajustes no ofrecen nada más que el nombre

- **WHEN** el encargado abre la pantalla de ajustes
- **THEN** solo se le ofrece editar el nombre del local y volver
- **AND** no se le ofrece borrar sus datos, hacer copias de seguridad, cambiar el idioma ni cambiar el tema
