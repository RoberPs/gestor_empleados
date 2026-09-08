## Context

Ver `proposal.md` — Why para la motivación, y `specs/exportacion-cuadrante/spec.md` para lo exigible.

Lo que condiciona el diseño:

- **Este change va después de `add-final-touches`.** La spec de privacidad del documento nombra el motivo de la ausencia, que solo existe tras aquel change; y el nombre del local que lleva el documento pasa allí a ser una constante. Implementar este antes obligaría a redactar las dos cosas dos veces.
- **`expo-print` compone el PDF a partir de HTML.** No hay una API de dibujo: se le pasa una cadena de HTML y devuelve la ruta de un fichero. Eso decide casi todo el diseño —el documento es una plantilla HTML— y también lo que se puede probar sin dispositivo.
- **La rejilla de la pantalla no sirve de molde.** `RejillaCuadrante` está resuelta con `View` y anchos en puntos para una pantalla de 360; el documento es una hoja apaisada. Comparten los datos y el orden, no la maquetación.
- **La app ya sabe componer lo que va en cada celda.** `ContenidoCelda` distingue los cuatro estados y `formatos.ts` ya formatea horas y fechas; el documento consume eso, no lo reinventa.
- **`identidad-visual` rige la pantalla, no el papel.** Un PDF que se imprime en blanco y negro no tiene por qué llevar los fondos de color de las celdas.

## Goals / Non-Goals

**Goals:**

- Que la composición del documento sea código puro y comprobable en la suite: dados una semana y una plantilla, qué filas, qué columnas, qué celdas y qué **no** aparece.
- Que la regla de privacidad se compruebe con un test, no con buena voluntad.
- Aislar en un único punto lo que solo funciona en el dispositivo —producir el PDF y abrir la hoja de compartir—, para que el resto se pruebe sin él.

**Non-Goals:**

- No se exporta CSV. Queda para el registro de horas, que todavía no existe.
- No se exportan varias semanas, ni un empleado suelto, ni un rango de fechas.
- No se guarda en el dispositivo una copia propia del documento ni un historial de exportaciones.
- No se toca la rejilla de la pantalla.

## Decisions

### La composición del HTML se separa de la producción del PDF

Un módulo puro compone la cadena HTML a partir de la semana, la plantilla y el contenido de las celdas. Otro, mínimo, se la pasa a `expo-print` y entrega el fichero a `expo-sharing`.

**Por qué**: la primera mitad es donde vive todo lo que la spec exige —el orden de las filas, el contenido de cada celda, el nombre del local, el rango, y sobre todo qué **no** puede aparecer— y así se comprueba en la suite sin dispositivo ni mocks de módulos nativos. La segunda mitad es una tubería de tres líneas que solo se puede comprobar mirando.

**Cómo se comprueba la privacidad**: un test que rellene teléfono, email, nota y motivo de **todos** los empleados y afirme que ninguna de esas cadenas aparece en el HTML producido. Es una comprobación sobre el texto entero, no sobre una plantilla concreta: sigue valiendo aunque la maquetación cambie de arriba abajo.

**Alternativa descartada**: componer el HTML dentro del mismo módulo que llama a `expo-print`. Ahorra un fichero y deja la regla de privacidad sin forma de comprobarse.

### El documento es una tabla HTML apaisada, con estilos en línea

Una `<table>` con una fila de cabecera de días y una fila por empleado, en A4 apaisado (`@page { size: A4 landscape }`), con los estilos dentro del propio HTML.

**Por qué**: siete columnas y 20 filas es una tabla, y el motor de impresión ya sabe repartir una tabla y partirla entre páginas si hace falta. Los estilos van en línea porque el HTML se le entrega a `expo-print` como una cadena suelta: no hay nada externo que pueda cargar.

**Alternativa descartada**: reutilizar los anchos de `medidas.ts`. Están calculados para 360 puntos de pantalla en vertical; en una hoja apaisada sobra sitio, y es justo donde los nombres largos pueden ir enteros.

### El documento no copia la paleta de la pantalla

Blanco y negro, con las líneas de la tabla marcadas. Los estados de la celda se distinguen por su texto —las horas, la palabra completa para ausencia y para vacaciones—, no por un fondo de color.

**Por qué**: `identidad-visual` ya exige que ningún estado dependa solo del color, y en papel eso es obligatorio, no recomendable: el encargado va a imprimir esto en la impresora de tickets o en la de casa. Además, en el documento hay sitio para las palabras completas, así que no hacen falta las abreviaturas `AUS` y `VAC` que la rejilla usa por estrechez.

### La acción vive en la cabecera, junto a la navegación

**Por qué**: es una acción sobre la semana mostrada, igual que ir a la anterior o a la siguiente. Ponerla en otro sitio obligaría al encargado a buscar dónde está lo que se hace con la semana que tiene delante.

**Riesgo**: la cabecera es la zona con menos sitio de la app y ya se reordenó una vez para meter la identidad del local. Si la acción no cabe sin comerle alto a la rejilla, entra como icono en la fila de identidad, no como un botón más en la fila de navegación.

### El fichero se produce con el nombre de la semana

El PDF se llama con el rango de la semana, para que el encargado lo distinga en la lista de la app a la que lo mande.

**Por qué**: sin eso, tres semanas compartidas al mismo grupo son tres ficheros con el mismo nombre y ningún modo de saber cuál es cuál.

### La plantilla vacía se corta antes de producir nada

**Por qué**: un PDF con la cabecera y ninguna fila no le sirve a nadie, y compartirlo es peor que decir que no hay nada que compartir. Encaja con que el estado vacío del cuadrante tampoco ofrezca la acción.

## Risks / Trade-offs

- **La maquetación no se ve en ningún test** → La suite comprueba qué datos entran en el HTML y cuáles no, pero no si la tabla cabe ni si se lee. Mitigación: el escenario de las 20 filas y el del nombre largo van a `docs/verificacion-manual.md` y se comprueban abriendo el PDF de verdad, antes de dar el change por terminado.
- **Dos dependencias nativas nuevas** → Instalar `expo-print` y `expo-sharing` obliga a recargar la app en el dispositivo, y un fallo de instalación no se ve hasta que se abre. Mitigación: las dos están fijadas en el contexto del proyecto para este uso exacto, y la app se prueba en el móvil en cuanto entren, antes de escribir nada de la maquetación.
- **`expo-sharing` no está disponible en todas las plataformas** → En web no existe. La app es solo para el móvil del encargado, así que se asume; la comprobación de disponibilidad se hace igualmente y su fallo se cuenta como exportación que no se puede completar, con el mensaje corriente que la spec exige.
- **El primer camino por el que un dato sale del dispositivo** → Hasta ahora nada salía. Cualquier descuido en la plantilla del documento se convierte en un dato de contacto en manos de terceros. Mitigación: la comprobación de privacidad es sobre el texto completo del HTML, no sobre los campos que uno se acuerde de mirar.
- **Depende de `add-final-touches`** → Si aquel change se retrasa, este se queda sin el motivo de la ausencia que su spec de privacidad nombra y sin el nombre del local como constante. Mitigación: se implementa después; no es un bloqueo de planificación, sino de orden.
