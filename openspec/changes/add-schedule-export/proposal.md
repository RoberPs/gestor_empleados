## Why

La app planifica el cuadrante desde hace cuatro changes, pero el cuadrante **no sale del móvil del encargado**. Los empleados no entran nunca en la app —es un principio del proyecto, no una carencia—, así que hoy no hay ninguna forma de que sepan su horario salvo que el encargado se lo diga de viva voz o les enseñe la pantalla.

El contexto del proyecto ya lo tenía previsto: la exportación es «la única vía por la que un empleado recibe su horario y la única copia de seguridad que existe». Hasta ahora no existía. Eso significa además que **si el móvil se pierde, se pierde el cuadrante entero**: no hay servidor, ni sincronización, ni copia en ninguna parte.

El 08/09/2026 el encargado lo pidió con estas palabras: un botón de descarga del cuadrante, por semana, compartido por la hoja del sistema.

## What Changes

- El cuadrante gana una acción de **compartir la semana que se está viendo** como documento PDF.
- El PDF recoge la misma rejilla que la pantalla: los empleados de la plantilla como filas, los siete días de lunes a domingo como columnas, y en cada celda lo que la celda muestra —las horas del turno planificado, la ausencia o las vacaciones—.
- El documento se identifica solo: lleva el nombre del local y el rango de fechas de la semana, para que quien lo reciba sepa de qué semana es sin preguntar.
- El PDF sale por la **hoja de compartir del sistema**, la misma que usa el móvil para cualquier otro fichero: desde ahí el encargado lo manda por mensajería, lo envía por email, lo guarda o lo imprime.
- El documento **no incluye teléfono, email, nota ni motivo de la ausencia** de nadie: solo nombres y lo planificado.

Decisiones tomadas el 08/09/2026:

- **PDF, no CSV ni imagen.** Es lo que se manda al grupo de mensajería del local y lo que se puede imprimir y colgar en la pared. Un CSV no se lee en el móvil de un camarero y una captura de pantalla se corta con 20 empleados. El CSV que menciona el contexto del proyecto queda para el registro de horas, que es donde tiene sentido.
- **Una semana por documento.** Es la unidad con la que el encargado planifica y con la que el empleado pregunta. Exportar un rango de semanas multiplicaría las decisiones —¿una página por semana?, ¿cómo se elige el rango?— para un caso que nadie ha pedido.
- **La hoja de compartir, no la carpeta de Descargas.** En Android, escribir en Descargas obliga a pasar por el selector del sistema y deja el fichero donde el encargado luego no lo encuentra. La hoja de compartir lleva al sitio donde el documento va a acabar de todas formas, y desde ella también se puede guardar o imprimir.
- **Se exporta lo que se ve, no lo que se ha trabajado.** Este change exporta turnos planificados; el registro de horas realmente trabajadas todavía no existe en la app.
- **Sin datos de contacto en el documento.** El PDF sale del dispositivo y acaba en manos de terceros: es exactamente el caso que el principio de privacidad del proyecto contempla.

## Capabilities

### New Capabilities

- `exportacion-cuadrante`: cómo sale del dispositivo el cuadrante de una semana —qué contiene el documento, qué no puede contener, cómo se identifica y por dónde se entrega—.

### Modified Capabilities

- `cuadrante-semanal`: la pantalla gana una acción permanente de compartir la semana mostrada, junto a las de navegación.

## Impact

- **Dependencias**: dos nuevas, `expo-print` y `expo-sharing`. Las dos están fijadas en el contexto del proyecto para este uso, así que no se renegocia el stack; es la primera vez que se instalan. Al implementarlo apareció una tercera, `expo-file-system`, que ya venía instalada con `expo` y ahora se declara. Resultó **imprescindible**, y no un adorno: las dos primeras no encajan solas. `expo-print` deja el PDF en una carpeta de trabajo suya que queda fuera de la carpeta de la app, y a ese fichero no llega nadie más: ni la hoja de compartir puede leerlo ni el sistema de ficheros puede moverlo (comprobado en el móvil del encargado el 08/09/2026). `expo-file-system` es lo que escribe el PDF —recogido en base64 del motor de impresión— dentro de la caché de la app, de paso con el nombre de la semana. No se usa para nada más —ni se lee ni se escribe ningún otro fichero— y no la toca la capa de datos.
- **Datos**: ninguno nuevo. La exportación solo lee lo que ya está guardado y no escribe nada en el almacenamiento.
- **Código**: un módulo nuevo que compone el documento a partir de la semana y la plantilla, y la acción en `src/ui/CabeceraSemana.tsx`.
- **Privacidad**: es el primer camino por el que un dato sale del dispositivo. Lo que el documento incluye y lo que no es una regla de la spec, no un detalle de maquetación.
- **Tests**: la composición del documento se prueba en la suite —qué filas, qué columnas, qué celdas y qué no aparece—. Que el PDF se genere y que la hoja de compartir se abra solo se comprueba en el dispositivo, y va a `docs/verificacion-manual.md`.
- **Riesgo**: el ancho. Siete columnas y 20 filas en una hoja A4 apaisada es justo lo que puede salir ilegible; y la maquetación de un PDF no se ve en un test, solo abriéndolo.
