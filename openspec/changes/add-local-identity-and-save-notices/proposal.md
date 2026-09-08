## Why

El 08/09/2026, con la app ya instalada en el móvil del encargado, la revisión dejó dos carencias que no son defectos de código sino comportamiento que falta:

1. **La app no dice de quién es.** La pantalla de inicio abre directamente en una rejilla anónima: nada identifica el local. El encargado quiere ver el nombre y el logo de su negocio, y el contexto del proyecto ya tenía previsto que el nombre del local no se fije en código, sino que se edite desde la propia app.
2. **La ficha del empleado no confirma nada.** Los campos se guardan solos, sin botón de guardar, y eso deja al encargado sin saber si lo que ha escrito ha quedado guardado o se ha perdido. En sus palabras: «no es intuitivo».

## What Changes

- Se introduce un ajuste del local, guardado en el dispositivo: **el nombre del local**, editable por el encargado desde una pantalla de ajustes nueva, alcanzable desde el cuadrante.
- La pantalla del cuadrante gana una **cabecera de identidad**: el logo del local y su nombre, por encima del rango de la semana y de las acciones. La cabecera se reordena para que quepa sin comerse la rejilla.
- El **logo va empaquetado en el proyecto** (`assets/`), no se elige desde la app. Solo el nombre es editable.
- La ficha del empleado **avisa de que cada dato queda guardado**: junto al campo que se acaba de cambiar aparece una indicación de guardado, que desaparece al volver a abrir la ficha.
- Se regulariza en la spec lo que ya se corrigió como defecto el 08/09/2026: los campos de la ficha se guardan **según se escriben**, no al terminar de editarlos. La redacción anterior describía un comportamiento que en Android perdía la nota.

Decisiones tomadas el 08/09/2026:

- **Nombre editable, logo empaquetado**: elegir el logo desde la galería exigiría `expo-image-picker` y copiar el fichero al almacenamiento de la app. No compensa para un solo local que cambia de logo cada varios años; el nombre, que es lo que puede escribirse mal o cambiar, sí es editable.
- **El nombre del local no se fija en código**: vive en el almacenamiento, como los empleados. La app no da por hecho ningún nombre, ni siquiera «La Esquina café»: al abrirla por primera vez el ajuste está vacío y la cabecera se comporta en consecuencia.
- **Aviso de guardado permanente, no efímero**: el aviso se queda mientras la ficha está abierta, en vez de aparecer y desvanecerse. Un aviso que se va no sirve a quien mira la pantalla dos segundos después, y uno que parpadea en cada tecla es ruido.
- **Sin botón de guardar**: se mantiene el guardado automático. Un botón obligaría a añadir el diálogo de «¿descartar cambios?» al volver, que es justo el camino en el que hoy no se pierde nada.

## Capabilities

### New Capabilities

- `ajustes-del-local`: los datos del propio negocio —hoy, su nombre— guardados en el dispositivo y editables desde la app, y cómo se identifica el local en la pantalla de inicio.

### Modified Capabilities

- `panel-empleados`: «Edición de los datos de la ficha» pasa a describir el guardado según se escribe y a exigir el aviso de guardado; «Nota del empleado» se alinea con esa misma regla.
- `cuadrante-semanal`: «Identificación de la semana en pantalla» convive ahora con la identidad del local en la cabecera, y la pantalla gana el acceso a los ajustes.

## Impact

- **Datos**: una tabla de ajustes nueva en SQLite, con su migración. No toca las tablas de empleados ni de cuadrante, y la migración no puede perder nada de lo ya guardado.
- **Código**: `src/datos/` (almacén de ajustes y migración), `src/ui/CabeceraSemana.tsx` (reordenación), una pantalla de ajustes nueva y su ruta en `app/`, y `src/ui/PantallaFichaEmpleado.tsx` (avisos).
- **Assets**: el logo entra en `assets/`. Hay que recortarlo: el fichero entregado trae el óvalo sobre un fondo borroso que no sirve para una cabecera.
- **Dependencias**: ninguna nueva.
- **Riesgo**: la cabecera del cuadrante es la zona con menos sitio de la app —a 360 puntos y con la letra del sistema agrandada ya iba justa—. Añadir una fila de identidad obliga a reordenarla, no solo a insertar contenido.
