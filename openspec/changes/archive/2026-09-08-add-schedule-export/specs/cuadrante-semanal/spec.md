## ADDED Requirements

### Requirement: Exportar la semana desde el cuadrante

La pantalla del cuadrante MUST ofrecer una acción permanente de compartir la semana mostrada, alcanzable con un solo toque y disponible en cualquier semana, sea pasada, en curso o futura.

Esa acción MUST exportar la semana que se está viendo en ese momento, tal y como describe `exportacion-cuadrante`, y MUST devolver al encargado al cuadrante en esa misma semana al terminar o al desistir.

La acción MUST NOT ofrecerse en el estado vacío sin empleados dados de alta: sin plantilla no hay cuadrante que compartir.

La acción MUST NOT robarle sitio a la rejilla: con la plantilla completa, el cuadrante MUST seguir mostrando los siete días sin scroll horizontal y las mismas filas de empleado que mostraba antes de existir esa acción.

#### Scenario: Compartir la semana que se está viendo

- **WHEN** el encargado se ha desplazado a la semana `14/09/2026 - 20/09/2026`
- **AND** toca la acción de compartir
- **THEN** se comparte el cuadrante de la semana `14/09/2026 - 20/09/2026`
- **WHEN** termina o desiste
- **THEN** ve de nuevo el cuadrante en la semana `14/09/2026 - 20/09/2026`

#### Scenario: Compartir una semana ya pasada

- **WHEN** el encargado navega a una semana ya pasada
- **THEN** se le sigue ofreciendo la acción de compartir
- **AND** no se le pide ninguna confirmación adicional por ser una semana pasada

#### Scenario: El estado vacío no ofrece compartir

- **WHEN** el encargado abre la app y no hay ningún empleado dado de alta
- **THEN** se le ofrece dar de alta al primer empleado
- **AND** no se le ofrece la acción de compartir

#### Scenario: La acción de compartir no descoloca la rejilla

- **WHEN** el encargado abre el cuadrante con 20 empleados dados de alta, en la anchura mínima soportada
- **THEN** la acción de compartir es visible y pulsable
- **AND** las siete columnas de día siguen viéndose a la vez, sin scroll horizontal
- **AND** se ven tantas filas de empleado como antes de existir esa acción
