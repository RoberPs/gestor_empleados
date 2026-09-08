## Context

Ver `proposal.md` — Why para la motivación, y los deltas de `specs/` para lo exigible.

Lo que condiciona el diseño:

- **Son dos piezas que no se tocan entre sí.** Copiar y pegar vive dentro del cuadrante; guardar el PDF vive en la exportación. Comparten change porque las pidió el encargado el mismo día, no porque compartan código. Se diseñan y se implementan por separado, y ninguna bloquea a la otra.
- **La capa de datos ya tiene todas las operaciones de celda.** `AlmacenCuadrante` ofrece `crearTurno`, `marcarAusencia`, `marcarVacaciones`, `vaciarCelda` y `leerCelda`. Pegar no necesita ninguna primitiva nueva de SQLite: es una combinación de las que ya hay.
- **`ContenidoCelda` lleva los identificadores de los turnos.** Es el tipo que devuelve `leerCelda`, y sus turnos tienen `id`. Un identificador copiado no significa nada en la celda destino: allí los turnos son otros.
- **La hoja de acciones de celda ya va justa.** Con dos turnos ofrece seis acciones; el principio de uso real —una mano, de pie, con prisa— es lo que más presiona aquí.
- **La exportación ya está partida en dos.** `documentoDelCuadrante.ts` compone el HTML y es código puro; `compartirElCuadrante.ts` es la única pieza que habla con los módulos nativos. Guardar entra por la segunda, sin tocar la primera.
- **`expo-file-system` 57 trae el selector de carpetas.** `Directory.pickDirectoryAsync()` abre el selector del sistema y devuelve un `Directory` sobre el que se puede `createFile(nombre, tipo)`. Está en la API moderna del módulo —la misma `File`/`Paths` que ya usa la app—, no en la heredada, y el módulo ya está declarado en `package.json`.

## Goals / Non-Goals

**Goals:**

- Que lo que se copia sea un dato pequeño, comprobable y sin identificadores prestados de la celda de origen.
- Que pegar sea **una** operación de la capa de datos, y no una secuencia que la pantalla vaya componiendo a mano cada vez.
- Que la duración de lo copiado sea una propiedad del sitio donde vive, y no dependa de si expo-router desmontó la pantalla al ir a la ficha.
- Que guardar reutilice íntegro el PDF que ya se comparte: mismo HTML, mismo nombre, mismas reglas de contenido, sin una segunda ruta de composición que pueda divergir.
- Aislar en el mismo punto de siempre lo que solo se puede comprobar con un móvil delante.

**Non-Goals:**

- No se copia una columna de día ni la fila de un empleado. Celda a celda y nada más.
- No se copia entre dispositivos ni al portapapeles del sistema: lo copiado no sale de la app.
- No se guarda lo copiado en SQLite, ni hay migración de la base de datos.
- No hay deshacer, ni para pegar ni para nada.
- No se toca la composición del documento: ni su maquetación, ni su contenido, ni su nombre.
- No se guarda un historial de exportaciones ni una copia propia del PDF.

## Decisions

### Lo copiado es un contenido sin identificadores, no una `ContenidoCelda`

Se introduce un tipo propio para lo que se copia —los turnos como pares de horas, o la ausencia, o las vacaciones— y una función pura que lo obtiene de una `ContenidoCelda`. Los `id` de los turnos se quedan fuera.

**Por qué**: al pegar se crean turnos nuevos en la celda destino; el `id` del turno de origen no identifica nada allí. Guardarlo invita a que alguien lo use en un `editarTurno` sobre la celda equivocada, que es un fallo silencioso: edita el turno del empleado de origen mientras el encargado mira el destino. Un tipo que no lo lleva hace ese fallo imposible de escribir.

**Alternativa descartada**: guardar la `ContenidoCelda` tal cual e ignorar los `id` al pegar. Ahorra un tipo y deja un campo cargado en la recámara.

### Pegar es una operación del almacén, no una receta de la pantalla

`AlmacenCuadrante` gana una operación de pegar que recibe el empleado, el día y lo copiado, y deja la celda con ese contenido: vacía lo que hubiera y aplica lo nuevo.

**Por qué**: pegar sobre una celda con dos turnos y unas vacaciones copiadas son tres llamadas en un orden concreto. Si esa receta vive en la pantalla, el siguiente sitio que necesite pegar la repetirá mal, y además cada llamada suelta avisa a los suscriptores: la rejilla se repintaría a media operación, con la celda en un estado que nunca debió verse. Una operación única deja la celda entera o no la deja.

**Alternativa descartada**: que la pantalla llame a `vaciarCelda` y luego a `crearTurno` tantas veces como haga falta. Es lo que ya hace al sustituir una ausencia por un turno, y ahí son dos pasos fijos; aquí son variables y con más estados de origen.

### Lo copiado vive fuera del árbol de React, en memoria y sin persistir

Un módulo pequeño guarda lo copiado y avisa a quien se suscriba, con el mismo patrón que ya usa el acceso al almacén. No es el almacén: no pasa por SQLite y no sobrevive a cerrar la app.

**Por qué**: la spec exige que dure mientras la app está abierta. Si vive en el estado de `PantallaCuadrante`, su duración pasa a depender de si expo-router mantiene montada la pantalla al abrir la ficha de un empleado —algo que hoy hace y que nadie ha prometido—. Fuera del árbol, la respuesta no depende de la navegación.

**Por qué no en el almacén**: el almacén escribe en SQLite. Meter ahí lo copiado obligaría a decidir qué columna lo guarda y a migrar la base de datos para un dato que dura treinta segundos y que no describe al local.

**Alternativa descartada**: el portapapeles del sistema (`Clipboard`). Copiar un turno dejaría en el portapapeles del móvil un texto que pisa lo que el encargado tuviera copiado, y pegar tendría que interpretar cualquier cosa que hubiera allí, incluida la de otra app.

### Copiar y pegar entran en la hoja de acciones, separadas de las demás

Van en la misma hoja que el resto de acciones de celda, agrupadas al final y separadas visualmente de las que crean, editan o eliminan contenido.

**Por qué**: es donde el encargado ya busca lo que se puede hacer con una celda, y una segunda vía —un toque largo, un modo de selección— sería un gesto que nadie descubre y que además hay que explicar. Separarlas al final evita que crezcan por en medio de las que ya tenía memorizadas.

**Riesgo asumido y cómo se cierra**: el estado con dos turnos pasa a ocho acciones, y la hoja tiene que seguir recorriéndose con el pulgar en una pantalla de 360 puntos sin truncar ningún texto. La spec lo exige y hay un escenario para ello; si al verlo en el móvil no cabe, lo que se recorta es el texto de las acciones de turno —hoy incluyen las horas completas—, no el área pulsable.

### La confirmación de pegar reutiliza el diálogo que ya existe

`ConfirmacionEliminar` recibe ya el mensaje y el texto del botón por props. Se usa tal cual, con el texto que corresponda a pegar. El componente pasa a llamarse por lo que hace —confirmar un acto irreversible sobre una celda— y no por uno solo de los actos.

**Por qué**: es el mismo diálogo, el mismo aviso de que no hay deshacer y el mismo par de botones. Duplicarlo para cambiar dos cadenas dejaría dos diálogos que se parecen y que se van a separar solos en el siguiente change.

**Cuidado**: el nombre del componente cambia, su comportamiento no. Los tests que lo localizan por `testID` no deben tener que cambiar.

### La acción de exportar pregunta el destino antes de hacer nada

El icono de la cabecera deja de compartir directamente: abre una hoja con los dos destinos —compartir la semana y guardar una copia—, y desde ella se puede desistir sin exportar nada.

**Por qué**: son dos actos distintos con consecuencias distintas —uno manda el cuadrante a terceros, el otro lo deja en el móvil—, y el sitio donde se eligen tiene que ser explícito. Meter un segundo icono en la fila de navegación repetiría el problema de ancho que `add-schedule-export` ya resolvió quitando palabras: a 360 puntos no caben dos botones más junto a las dos semanas.

**Alternativa descartada**: guardar siempre y ofrecer compartir después, o al revés. Convierte cada exportación en la operación que el encargado no pidió más un paso para deshacerla.

### Guardar comparte con compartir todo menos el último paso

`compartirElCuadrante.ts` se reordena en un paso común —componer el HTML, producir el PDF, tenerlo en base64 con su nombre de semana— y dos finales: entregarlo a la hoja del sistema, o pedir carpeta con `Directory.pickDirectoryAsync()` y escribirlo allí con `createFile` y `write` en base64.

**Por qué**: que el documento guardado sea el mismo que el compartido no puede depender de que nadie toque una de las dos ramas. Con un solo paso de composición, la regla de privacidad se sigue comprobando una vez y vale para los dos destinos.

**Por qué el PDF se produce antes de pedir la carpeta**: si la producción falla, el encargado se entera sin haber recorrido el selector de carpetas para nada. Es el mismo orden que ya sigue compartir, que pregunta por la hoja del sistema antes de producir.

**Por qué se escribe directamente en la carpeta elegida**: la copia guardada no pasa por la caché de la app. La caché es lo que compartir necesita porque la hoja del sistema exige un fichero dentro de la carpeta de la app; aquí el destino ya es una carpeta a la que la app ha recibido acceso, y un fichero intermedio solo añade una copia que luego habría que limpiar.

**Alternativa descartada**: escribir en la carpeta de Descargas sin preguntar. Pide permisos de almacenamiento que la app hoy no necesita y deja el fichero donde el encargado no lo busca.

### El resultado de guardar se cuenta con el mismo aviso que ya hay

`AvisoDeLaExportacion` muestra hoy los fallos. Pasa a mostrar también la confirmación de que el documento ha quedado guardado, y `ResultadoDeExportar` gana el caso correspondiente.

**Por qué**: guardar un fichero en una carpeta del sistema no deja ni rastro dentro de la app —no se abre nada, no cambia ninguna pantalla—, así que sin un aviso el encargado no distingue haber guardado de no haber hecho nada. Compartir no lo necesita porque la hoja del sistema ya es la señal.

**Cuidado con el mensaje**: no lleva la ruta del fichero. La spec prohíbe los detalles técnicos, y una ruta de `content://` no le dice al encargado dónde ha guardado nada.

### Desistir del selector y que el selector falle no se distinguen (08/09/2026, al implementarlo)

`Directory.pickDirectoryAsync()` avisa de que el encargado ha cerrado el selector sin elegir carpeta **de la misma forma** en que avisaría de un fallo suyo: rechazando la promesa, sin un valor que separe un caso del otro. La app trata los dos como **desistimiento**: vuelve al cuadrante sin aviso y sin haber escrito nada.

**Por qué así y no al revés**: desistir es lo que va a pasar de verdad, y muchas veces; un fallo del propio selector, casi nunca. Tratar los dos como fallo le enseñaría al encargado un error cada vez que se lo piensa mejor, que es exactamente lo que la spec prohíbe en «Desistir de guardar». La consecuencia asumida es la contraria y es menor: si algún día el selector no llega a abrirse, el encargado verá que no pasa nada en lugar de un mensaje. El fallo que sí se cuenta —y que es el que la spec nombra en «El guardado falla»— es el de escribir en la carpeta elegida, que sí se distingue.

Los dos casos quedan anotados en el terminal de desarrollo, así que en el móvil se pueden separar mirando el registro.

## Risks / Trade-offs

- **El selector de carpetas solo se ve en el dispositivo** → Que `pickDirectoryAsync` abra el selector, que el encargado desista, y que el fichero acabe donde eligió, no se comprueba en ningún test. Mitigación: los escenarios de guardar, desistir y fallo van a `docs/verificacion-manual.md` y se comprueban abriendo el fichero de verdad antes de dar el change por terminado. Es el mismo trato que ya recibió compartir.
- **`pickDirectoryAsync` puede comportarse distinto en Android y en iOS** → En Android es el selector del sistema de ficheros; en iOS, el de Archivos. Que `createFile` sobre la carpeta devuelta funcione igual en las dos no está comprobado aquí. Mitigación: se prueba en el móvil del encargado en cuanto la tubería exista y antes de escribir los textos; si en una de las dos plataformas no se puede escribir, esa plataforma cae al camino que ya funciona —la hoja del sistema en modo guardar—, y la decisión se registra en este documento con su fecha.
- **Pegar es una vía nueva por la que se pierde contenido** → Un pegado confirmado sobre la celda equivocada borra un turno sin deshacer posible. Mitigación: la confirmación nombra lo que va a sustituirse, igual que la de eliminar; y sobre celda vacía no se pregunta, que es el caso masivo.
- **Ocho acciones en la hoja de celda** → Es justo lo que el principio de uso real prohíbe: una hoja que hay que recorrer con el pulgar. Mitigación: el escenario de la anchura mínima con el estado más cargado está en la spec y se comprueba mirando; el recorte, si hace falta, sale del texto de las acciones y nunca del área pulsable.
- **Dos piezas sin relación en un mismo change** → Si una se atasca, arrastra a la otra al archivarlas juntas. Mitigación: las tareas van separadas y cada pieza queda comprobable por su cuenta; si una tuviera que caerse, la otra se archiva sola.
- **El PDF guardado queda fuera de la carpeta de la app** → Cualquier app con acceso a esa carpeta puede leerlo, y la app ya no lo controla. Mitigación: es lo que el encargado pide al guardar, y el documento no lleva ningún dato de contacto —la misma regla que ya se comprueba sobre el texto completo del HTML—.
