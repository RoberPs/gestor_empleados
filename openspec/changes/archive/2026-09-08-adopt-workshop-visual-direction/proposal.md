## Why

La app ya tiene sus tres pantallas en pie —cuadrante, panel de empleados y ficha— pero su aspecto nunca se decidió: los colores y los tamaños de `src/ui/tema.ts` se fueron poniendo pantalla a pantalla, no los describe ninguna spec y nada impide que la próxima pantalla invente los suyos. Con el producto ya usable, toca fijar una dirección visual única antes de que crezca el número de pantallas que habría que rehacer después.

El 07/09/2026 el encargado eligió entre tres direcciones propuestas la llamada **«Señal de taller»**: alto contraste sobre blanco, rejilla marcada y cifras tabulares en todo dato numérico. Es la que mejor encaja con el uso real —de pie, con prisa, mirando una rejilla densa de 20 empleados— y la que menos riesgo tiene, porque respeta la estructura que ya está verificada.

## What Changes

- Se introduce una identidad visual única, escrita como spec, que rige **todas** las pantallas de la app: cuadrante, panel de empleados, ficha, formularios, hojas de acciones, confirmaciones y el aviso de almacenamiento.
- Se fija la paleta de la dirección «Señal de taller» con sus valores exactos y el papel de cada color: fondo, tinta, rejilla, cabecera, semana en curso, turno, ausencia, vacaciones y acción destructiva.
- Se fija la escala tipográfica y sus pesos: nombre de empleado, horas de la celda, etiquetas `AUS`/`VAC`, cabecera de día, cuerpo y título. Los tamaños en puntos se conservan tal como están; lo que cambia es el peso, el color y la variante numérica.
- Se fija el uso de **cifras tabulares en todo dato numérico** (horas, fechas, días del mes), no solo en las horas de la celda como hoy.
- Se fija un contraste mínimo comprobable para texto y para los bordes que separan celdas, de modo que la rejilla siga leyéndose al sol de una terraza.
- Se mantienen intactos, sin excepción: la estructura de las pantallas, el reparto de anchos de `medidas.ts`, el área pulsable mínima de 44 × 44 puntos, los textos y el flujo de toques. Este cambio es piel y micro-tipografía, nunca comportamiento.
- Se mantiene la regla ya vigente de que los estados de una celda no se distinguen solo por el color: la nueva paleta conserva el texto y el borde propio de cada estado.

Decisiones tomadas el 07/09/2026:

- **Dirección visual**: «Señal de taller». Descartadas «Cuaderno del local» (cálida, serif) y «Turno de noche» (oscura).
- **Tipografía**: se usa la fuente del sistema (Roboto en Android, San Francisco en iOS) con la variante de cifras tabulares. No se empaqueta Inter: evita una dependencia y ~400 KB, y ahorra gestionar la carga de la fuente en el arranque, a cambio de que la app no se vea idéntica en Android y en iOS. Se acepta esa diferencia porque el único dispositivo real es el móvil del encargado.
- **Alcance**: piel y micro-tipografía. No se tocan densidad, altura de fila, márgenes internos ni jerarquía de la cabecera, para no invalidar la verificación manual ya hecha de anchos y área pulsable.
- **Sin tema oscuro**: la app tiene un único aspecto, claro. Un segundo tema se propondría por separado si alguna vez hace falta.
- **Sin versalitas en la cabecera de día**, pese a que la referencia visual las pedía: a 360 puntos de ancho «MIÉRCOLES» en mayúsculas obliga a bajar el cuerpo por debajo de lo legible, y las specs vivas prohíben abreviar el nombre del día. La cabecera gana presencia por peso y color, no por caja.

**No** hay cambios en datos, almacenamiento, navegación ni en ninguna regla de negocio.

## Capabilities

### New Capabilities

- `identidad-visual`: cómo se ve la app. Paleta con el papel de cada color, escala tipográfica y pesos, cifras tabulares, contraste mínimo exigible y la regla de que ninguna pantalla define colores ni tamaños por su cuenta.

### Modified Capabilities

Ninguna. Las specs vivas (`cuadrante-semanal`, `panel-empleados`, `almacenamiento-empleados`) no fijan color ni tipografía: solo exigen que los estados de una celda se distingan sin depender únicamente del color, y esa exigencia se conserva. Ningún requisito existente cambia.

## Impact

- **Código**: `src/ui/tema.ts` es el único fichero que cambia de contenido de fondo —nuevos valores y nuevos tokens—. Los catorce componentes de `src/ui/` que ya consumen `colores` y `tipografia` se ajustan solo donde hoy fijan pesos o variantes a mano (`fontWeight`, `fontVariant`, subrayados de botón), para que pasen a leerlos del tema.
- **No cambia**: `src/ui/medidas.ts`, `src/dominio/`, `src/datos/`, `app/` ni ningún texto de la interfaz.
- **Dependencias**: ninguna nueva. No se añade `expo-font` ni ningún paquete de fuentes.
- **Tests**: la suite actual comprueba textos, anchos y área pulsable, no colores; no debería romperse. Los escenarios nuevos de esta capability son en su mayoría de los que solo se resuelven mirando la pantalla, así que se anotan en `docs/verificacion-manual.md` citando su nombre literal.
- **Riesgo asumido**: un aspecto validado en el móvil del encargado; en un iPhone el mismo texto ocupará un ancho ligeramente distinto por usar otra fuente del sistema.
