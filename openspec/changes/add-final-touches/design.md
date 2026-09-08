## Context

Ver `proposal.md` — Why para la motivación, y los deltas de `specs/` para lo exigible.

Lo que condiciona el diseño es el estado real del dispositivo del encargado:

- **El esquema del móvil ya está en la versión 2.** La tabla `ajustes` se creó y se usó: el 08/09/2026 el encargado escribió `La Esquina café` y quedó guardado. `migraciones.ts` se niega a abrir una base cuya versión sea mayor que la que la app conoce, así que **retirar la migración 2 dejaría la app sin arrancar** en el único móvil donde corre. La única salida es avanzar a la versión 3.
- **Las migraciones de este proyecto solo han añadido.** La 1 creó la plantilla, la 2 creó los ajustes. Esta es la primera que borra, y la primera que toca una tabla con datos que el encargado no quiere perder.
- **Edge-to-edge está activo** (Expo 57 / RN 0.86 en Android): la ventana ya no se encoge al abrir el teclado, lo pinta por encima. Por eso el `ScrollView` de la ficha, que está bien puesto, no evita que el teclado tape la nota.
- **No hay librería de iconos.** `@expo/vector-icons` no está instalado, y `identidad-visual` prohíbe que una pantalla introduzca colores o tamaños propios.
- **La ficha hoy solo se abre desde el panel** y su acción de volver siempre regresa a la lista.

## Goals / Non-Goals

**Goals:**

- Una migración a la versión 3 que añada `puesto` y `motivo_ausencia` y borre `ajustes` **sin perder un solo empleado ni una sola celda**.
- Que la ficha sea alcanzable desde el cuadrante y devuelva al encargado a donde estaba.
- Que ningún campo quede tapado por el teclado, sin dependencias nuevas.
- Dejar el repositorio coherente: sin código muerto de ajustes y sin un contexto de proyecto que contradiga la decisión tomada.

**Non-Goals:**

- No se toca el aspecto: la paleta, los pesos y los tamaños de `identidad-visual` se consumen tal cual.
- No se toca el reparto de anchos de la rejilla ni el área pulsable mínima.
- No se guarda histórico de ausencias: un motivo por empleado, no uno por día.
- No se añade selector de puesto, ni catálogo, ni autocompletado.

## Decisions

### La migración 3 hace las tres cosas de golpe, no tres migraciones

Añadir dos columnas y borrar una tabla en una sola migración, no en tres seguidas.

**Por qué**: el mecanismo aplica las migraciones pendientes en una transacción por número de versión. Tres versiones son tres oportunidades de quedarse a medias en un móvil que se queda sin batería a mitad del arranque. Una sola versión hace que el salto sea todo o nada.

**Alternativa descartada**: dejar la tabla `ajustes` en su sitio y limitarse a no leerla. Sale más barato hoy y más caro dentro de seis meses, cuando alguien encuentre una tabla con el nombre del local dentro mientras el nombre vive en el código y no sepa cuál de los dos manda.

### `ALTER TABLE ADD COLUMN` y `DROP TABLE`, sin recrear `empleados`

Las dos columnas nuevas entran con `ALTER TABLE empleados ADD COLUMN`, con `DEFAULT ''`.

**Por qué**: SQLite añade una columna sin reescribir la tabla, así que la plantilla ni se copia ni se toca, y el índice único sobre `nombre_comparable` sigue en pie sin recrearse. El patrón de copiar a una tabla nueva —el que SQLite obliga a usar para *quitar* una columna— es justo el que puede perder filas, y aquí no hace falta.

**Cómo se comprueba**: un test que parta de una base **en versión 2 con empleados, turnos, ausencias y vacaciones dentro**, la haga saltar a la 3, y afirme que todo sigue exactamente igual y que la tabla `ajustes` ya no existe. Este test es el que justifica la migración; sin él no se sube nada al móvil.

### El puesto es una columna de `empleados`, no una tabla de puestos

**Por qué**: es texto libre por decisión del encargado. Una tabla de puestos solo tendría sentido con lista cerrada, y entonces habría que darle pantalla de mantenimiento, y ya son dos pantallas para lo que hoy es una palabra.

### El motivo de la ausencia también es una columna de `empleados`

Se comporta exactamente como `nota`: un campo por empleado, texto libre, opcional.

**Por qué**: el caso real es «recordar por qué falta Bruno estos días», no «llevar el historial de bajas de 2026». Un motivo por empleado × día exigiría tabla nueva, y dejaría al encargado escribiendo el mismo texto siete veces para una semana de baja.

**Consecuencia asumida y explícita**: el motivo **no se archiva**. Si Bruno falta en marzo por una cosa y en septiembre por otra, la segunda pisa a la primera. Es el precio de la simplicidad, y encaja con que la nota funcione igual desde hace tres changes.

### El teclado se resuelve reservando hueco, no con `KeyboardAvoidingView`

Escuchar `Keyboard` (`keyboardDidShow` / `keyboardDidHide`), guardar la altura en estado y sumarla al `paddingBottom` del `contentContainerStyle` del `ScrollView` de la ficha; al enfocar un campo, desplazar el scroll hasta él.

**Por qué**: con edge-to-edge, `KeyboardAvoidingView` es errático en Android —`behavior="height"` depende de que la ventana se encoja, y ya no se encoge—. Reservar el hueco a mano es determinista, funciona igual en las dos plataformas y **se puede comprobar con un test**: que el contenedor declara el hueco cuando el teclado está abierto y no lo declara cuando está cerrado.

**Alternativa descartada**: `react-native-keyboard-controller`. Lo resuelve mejor y es una dependencia nativa nueva; desproporcionado para dos campos de texto en una app de una sola pantalla de datos.

### El icono de editar es un glifo de texto

Un carácter (`✎`) pintado con el color de acción del tema, dentro de un área pulsable de 44 × 44 puntos.

**Por qué**: cero dependencias, se le aplican la paleta y los pesos del tema como a cualquier otro texto, y escala con la letra del sistema. Instalar `@expo/vector-icons` para un icono añade peso y una fuente que cargar en el arranque.

**Riesgo aceptado**: el glifo se dibuja distinto en Android y en iOS. Ya se asumió lo mismo con la fuente del sistema en `adopt-workshop-visual-direction`, y el único dispositivo real es el móvil del encargado.

### La ficha recuerda de dónde vino por su ruta, no por estado global

La ruta de la ficha recibe de dónde se abrió, y su acción de volver decide el destino con eso.

**Por qué**: es lo que ya hace `expo-router` con sus parámetros, y evita meter en el store un dato de navegación que solo importa mientras la ficha está abierta.

**Comprobación**: al volver, el cuadrante tiene que seguir en la semana en la que estaba. Esa semana ya vive en la pantalla del cuadrante, no en la ruta, así que basta con que la ficha no la reinicie.

### El nombre del local queda como constante junto al logo

Una constante en el módulo de la cabecera, al lado de la referencia al PNG del logo.

**Por qué**: los dos son ahora el mismo tipo de dato —identidad fija empaquetada con la app—, y tenerlos juntos evita que alguien cambie el logo y deje el nombre a dos ficheros de distancia.

## Risks / Trade-offs

- **La migración borra una tabla en el móvil donde están los datos reales del encargado** → Es el riesgo principal. Se mitiga con el test de salto 2 → 3 sobre una base poblada (plantilla + turnos + ausencias + vacaciones) que afirme que no falta nada, y ejecutando `npm test` antes de recargar nada en el dispositivo. La tabla que se borra solo contenía el nombre del local, que queda fijado en el código: aunque el borrado saliera mal, no hay dato del encargado que no se pueda volver a ver en pantalla.
- **La migración no tiene vuelta atrás** → Si la 3 se aplica y algo falla, no se puede volver a la 2: el mecanismo solo avanza. Mitigación: no se recarga en el móvil hasta que la suite completa esté en verde, y el salto se prueba antes contra una base poblada, que es lo más parecido al móvil que se puede montar en un test.
- **El nombre de la fila pasa a ser pulsable, pegado a siete celdas que también lo son** → Un toque impreciso mientras se planifica podría sacar al encargado de la rejilla. Mitigación: es la columna del extremo izquierdo, y volver es un solo toque. Se comprueba en el dispositivo que no se dispara al deslizar la lista.
- **El puesto le quita ancho al nombre en la lista** → A 360 puntos, con nombre + puesto + icono, un nombre largo se trunca antes que hoy. Mitigación: el nombre tiene prioridad al repartir el ancho y el puesto se trunca primero; y ahora hay dos caminos para leer el nombre entero, porque la ficha ya no lo trunca.
- **El contexto de `openspec/config.yaml` deja de decir la verdad en cuanto se implemente esto** → Se corrige dentro del mismo change, no después: si se olvida, cada artefacto que se genere a partir de ahora nacerá contradiciendo esta decisión.

## Migration Plan

1. Escribir el test del salto 2 → 3 sobre una base poblada **antes** que la migración, y verlo fallar.
2. Añadir la migración 3 y dejar ese test en verde.
3. Implementar el resto del change.
4. `npm run typecheck` y `npm test` completos en verde.
5. Recién entonces, recargar en el móvil del encargado y comprobar que la plantilla y el cuadrante siguen ahí.

No hay rollback en el dispositivo: el paso 5 no se da hasta que el 4 está limpio.
