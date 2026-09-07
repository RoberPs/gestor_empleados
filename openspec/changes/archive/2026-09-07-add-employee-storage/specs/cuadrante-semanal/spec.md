## MODIFIED Requirements

### Requirement: El cuadrante semanal es la pantalla de inicio

La pantalla del cuadrante semanal MUST ser la ruta raíz de la app. Al abrir la app, el sistema MUST mostrar directamente la rejilla del cuadrante, sin pantalla de bienvenida, de resumen ni de menú intermedia.

La única excepción MUST ser que el almacenamiento no pueda abrirse: en ese caso el sistema MUST mostrar el aviso que define `almacenamiento-empleados` — «Comportamiento cuando el almacenamiento no puede abrirse» en lugar del cuadrante, porque no hay plantilla que dibujar y una rejilla vacía haría creer al encargado que ha perdido a sus empleados. Ese aviso MUST NOT aparecer cuando el almacenamiento se abre bien, ni siquiera un instante, ni cuando la plantilla está simplemente vacía.

La semana mostrada por defecto MUST ser la semana en curso: la semana de lunes a domingo que contiene la fecha actual del dispositivo.

El sistema MUST recalcular cuál es la semana en curso cada vez que la app vuelve a primer plano. Mientras la pantalla está en primer plano, el sistema MUST NOT cambiar por sí solo la semana mostrada.

#### Scenario: Abrir la app un día cualquiera de la semana

- **WHEN** el encargado abre la app un miércoles
- **THEN** la primera pantalla que ve es la rejilla del cuadrante
- **AND** la semana mostrada es la que va del lunes anterior a ese miércoles al domingo siguiente
- **AND** no se muestra ninguna pantalla previa de bienvenida, resumen o menú

#### Scenario: Abrir la app en domingo

- **WHEN** el encargado abre la app un domingo
- **THEN** la semana mostrada es la que termina en ese domingo, no la que empieza al día siguiente

#### Scenario: La app vuelve a primer plano ya en la semana siguiente

- **WHEN** el encargado deja la app abierta mostrando la semana en curso un domingo
- **AND** vuelve a la app pasada la medianoche, ya en lunes
- **THEN** la semana mostrada es la semana nueva, indicada como semana en curso
- **AND** la semana anterior deja de presentarse como semana en curso

#### Scenario: Abrir la app con la plantilla vacía sigue llevando al cuadrante

- **WHEN** el encargado abre la app en un dispositivo donde no ha dado de alta a nadie
- **AND** el almacenamiento se abre sin problemas
- **THEN** la primera pantalla que ve es la rejilla del cuadrante
- **AND** no ve ningún aviso sobre sus datos
