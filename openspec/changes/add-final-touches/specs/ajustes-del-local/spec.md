## REMOVED Requirements

### Requirement: El nombre del local es un dato editable, no un texto fijo

**Reason**: La decisión que sostenía este requisito —que el nombre del local no se fijara nunca en código— se tomó dando por hecho que habría más ajustes del negocio que justificaran una pantalla propia. No los hay: el encargado escribió el nombre una vez, quedó bien y no va a volver a tocarlo. Guardar en la base de datos un dato que cambia cada varios años, y sostener una pantalla entera para editarlo, es más maquinaria de la que el caso pide.

**Migration**: El nombre que el encargado escribió el 08/09/2026 queda fijado en el código de la app, de modo que la cabecera del cuadrante sigue mostrando exactamente lo mismo que mostraba. La tabla `ajustes` donde se guardaba se borra en la migración del esquema descrita en `almacenamiento-empleados`; ningún dato de la plantilla ni del cuadrante se ve afectado, y el encargado no tiene que hacer nada.

### Requirement: La pantalla de inicio identifica el local

**Reason**: El requisito no desaparece: se muda a `cuadrante-semanal`, que es la capability de la pantalla donde esa cabecera se dibuja. Sin ajustes que editar, no queda ninguna capability de «datos del propio negocio» en la que alojarlo.

**Migration**: Ninguna. La cabecera se sigue viendo igual; lo único que cambia es que el nombre y el logo pasan a ser fijos, y con ellos desaparece el caso del nombre todavía vacío. El requisito equivalente vive ahora en `cuadrante-semanal`.

### Requirement: Pantalla de ajustes del local

**Reason**: Con el nombre del local fijado en el código no queda ningún ajuste que editar, y una pantalla con un solo campo que se toca una vez en la vida es peso muerto en una app que se maneja de pie y con prisa.

**Migration**: La pantalla y su acceso desde la cabecera del cuadrante desaparecen. El encargado no pierde ningún dato: lo que había escrito queda fijado en la app.
