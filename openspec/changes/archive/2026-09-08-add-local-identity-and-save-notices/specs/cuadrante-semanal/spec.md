## MODIFIED Requirements

### Requirement: Identificación de la semana en pantalla

La pantalla MUST identificar en todo momento qué semana se está mostrando, indicando el rango de fechas de lunes a domingo en formato dd/mm/aaaa.

Cuando la semana mostrada es la semana en curso, la pantalla MUST indicarlo de forma explícita, de manera que el encargado distinga sin contar fechas si está mirando su semana o se ha desplazado a otra.

La identidad del local que define `ajustes-del-local` MUST mostrarse por encima del rango de fechas, y MUST NOT confundirse con él: el nombre del local y el rango de la semana MUST leerse como dos cosas distintas, no como un único título.

#### Scenario: Rango de fechas de la semana visible

- **WHEN** el cuadrante muestra la semana del lunes 7 de septiembre de 2026 al domingo 13 de septiembre de 2026
- **THEN** la pantalla muestra el rango como `07/09/2026 - 13/09/2026`

#### Scenario: La semana en curso se distingue de las demás

- **WHEN** el cuadrante muestra la semana en curso
- **THEN** la pantalla lo indica de forma explícita junto al rango de fechas
- **WHEN** el encargado se desplaza a otra semana
- **THEN** esa indicación desaparece

#### Scenario: El nombre del local y la semana no se confunden

- **WHEN** el nombre del local es `La Esquina café` y el cuadrante muestra la semana `07/09/2026 - 13/09/2026`
- **THEN** el nombre del local se muestra por encima del rango de fechas
- **AND** los dos se distinguen a simple vista como dos datos distintos

## ADDED Requirements

### Requirement: Acceso a los ajustes desde el cuadrante

La pantalla del cuadrante MUST ofrecer un acceso permanente a la pantalla de ajustes del local, alcanzable con un solo toque.

Al volver de los ajustes, el sistema MUST devolver al encargado al cuadrante en la misma semana en la que estaba, con el nombre del local ya actualizado si lo ha cambiado.

Ese acceso MUST NOT ofrecerse en el estado vacío sin empleados dados de alta: allí lo único que hace falta es dar de alta al primero.

#### Scenario: Ir a los ajustes y volver al cuadrante

- **WHEN** el encargado se ha desplazado a la semana `14/09/2026 - 20/09/2026`
- **AND** toca el acceso a los ajustes
- **THEN** se abre la pantalla de ajustes del local
- **WHEN** cambia el nombre del local y vuelve
- **THEN** ve de nuevo el cuadrante en la semana `14/09/2026 - 20/09/2026`
- **AND** la cabecera muestra el nombre nuevo

#### Scenario: El estado vacío no ofrece los ajustes

- **WHEN** el encargado abre la app y no hay ningún empleado dado de alta
- **THEN** se le ofrece dar de alta al primer empleado
- **AND** no se le ofrece el acceso a los ajustes
