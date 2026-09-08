# Verificación manual

Este documento recoge los escenarios de las specs que **solo se pueden comprobar
mirando la pantalla**: legibilidad, tamaño del área pulsable, ausencia de scroll
horizontal, distinción visual entre estados de una celda y comportamiento del
scroll. El resto de escenarios se comprueban en la suite automatizada (`npm test`).

Hay una segunda razón, más estrecha, por la que algo puede acabar aquí: que la pieza
que hay que ejercitar **no exista fuera del dispositivo**. Es el caso del adaptador
de `expo-sqlite` (ver "El almacenamiento funciona de verdad en el dispositivo"), y
solo de él: el SQL, las migraciones y las operaciones de empleados sí se comprueban
en `npm test`, contra SQLite de verdad.

## Cómo se cita un escenario

Cada anotación reproduce el **nombre literal del escenario** tal y como aparece en
la spec, sin traducirlo, resumirlo ni reformularlo, precedido de la capability y
del requisito al que pertenece. El nombre literal es la clave que permite recorrer
la spec escenario a escenario y comprobar que ninguno queda sin cubrir (ni aquí ni
en un test).

El formato de cada entrada es:

```
### <nombre literal del escenario>

- **Capability**: <nombre de la capability>
- **Requisito**: <título literal del requisito>
- **Cómo se comprueba**: pasos concretos que hay que seguir en el dispositivo.
- **Qué se debe observar**: el resultado esperado, en los mismos términos que la spec.
- **Última comprobación**: fecha dd/mm/aaaa, dispositivo y resultado.
```

Ningún escenario de una spec puede quedar sin citar: o aparece en un test, o aparece
aquí, o —cuando el test solo alcanza a comprobar una parte— en los dos sitios, y
entonces esta anotación dice explícitamente qué parte queda para el ojo.

## Dispositivo de referencia

Las comprobaciones de anchura se hacen en orientación vertical sobre una pantalla de
**360 puntos de ancho**, que es el ancho mínimo soportado. Si se comprueba en una
pantalla más ancha, hay que indicarlo en "Última comprobación", porque una pantalla
más ancha no demuestra nada sobre el ancho mínimo.

## Escenarios que necesitan un build instalable

> **`npm run web` no sirve para mirar esta app.** Desde que la plantilla vive en
> SQLite, en el navegador la app arranca directamente en el aviso «No se han podido
> abrir tus datos», y es correcto: `expo-sqlite` no funciona ahí. El porqué está en
> el `design.md` de `add-employee-storage` — Risks. Todo lo que hay debajo se
> comprueba en el móvil, con `npx expo start` y Expo Go.

Casi todo se comprueba con el servidor de desarrollo (`npx expo start`) y la app
abierta en Expo Go. Hay una excepción: los escenarios sobre **cómo arranca la app**
no se pueden comprobar así, porque en Expo Go la app no tiene icono propio —se
lanza desde dentro de Expo Go, con su pantalla de carga por delante— y lo que se
observaría sería el arranque de Expo Go, no el del producto.

Esos escenarios quedan pendientes hasta que exista un build instalable en el
dispositivo. Hoy el proyecto no tiene ninguno configurado: no hay `android/`, ni
`ios/`, ni `eas.json`. El icono sí está definido en `app.json`. Cuando se decida
cómo se construye el binario, esos escenarios se comprueban sobre la app instalada
y se anota aquí la fecha y el dispositivo.

## Escenarios

Los escenarios que siguen tienen además un test automatizado que comprueba lo que
se puede comprobar sin ver la pantalla (número de columnas, anchos declarados, área
pulsable mínima, textos). Lo que se anota aquí es la parte que solo se resuelve
mirando: si de verdad se lee, si de verdad no hay franja de scroll, si de verdad se
distinguen dos celdas de un vistazo.

### Abrir la app un día cualquiera de la semana

- **Capability**: cuadrante-semanal
- **Requisito**: El cuadrante semanal es la pantalla de inicio
- **Cómo se comprueba**: **requiere un build instalable en el dispositivo** (ver
  "Escenarios que necesitan un build instalable"). Con la app ya instalada: cerrarla
  del todo desde el selector de aplicaciones y volver a abrirla desde su icono, un
  día laborable cualquiera, con empleados dados de alta.
- **Qué se debe observar**: lo primero que aparece es la rejilla del cuadrante, con
  la semana que va del lunes anterior al domingo siguiente. No se ve ninguna pantalla
  de bienvenida, resumen o menú por el camino, ni siquiera un instante.
- **Última comprobación**: 07/09/2026, Expo Go sobre el servidor de desarrollo — **no
  realizada**. En Expo Go la app no tiene icono propio y se relanza a través del
  propio Expo Go, con la pantalla de carga de Expo por delante, así que el escenario
  no se puede reproducir: ni hay icono desde el que abrir, ni se puede distinguir la
  carga de Expo de una hipotética pantalla de bienvenida de la app. Queda pendiente
  del primer build instalable.

### La semana completa se ve sin scroll horizontal

- **Capability**: cuadrante-semanal
- **Requisito**: Rejilla de empleados por días
- **Cómo se comprueba**: abrir la app en el móvil en orientación vertical, con al
  menos un empleado dado de alta. Intentar arrastrar la rejilla hacia los lados.
- **Qué se debe observar**: las siete columnas, de lunes a domingo, están las siete
  en pantalla a la vez. La rejilla no se mueve horizontalmente ni aparece ninguna
  barra o rebote lateral.
- **Última comprobación**: pendiente.

### Cabeceras de día con su fecha

- **Capability**: cuadrante-semanal
- **Requisito**: Rejilla de empleados por días
- **Cómo se comprueba**: abrir el cuadrante y leer la fila de cabecera.
- **Qué se debe observar**: cada columna muestra el nombre completo del día —Lunes,
  Martes, Miércoles, Jueves, Viernes, Sábado, Domingo, sin abreviar— y debajo su día
  del mes. El nombre del día se lee sin acercar el móvil. El de la primera columna
  es Lunes y el de la última, Domingo.
- **Última comprobación**: pendiente.

### Rango de fechas de la semana visible

- **Capability**: cuadrante-semanal
- **Requisito**: Identificación de la semana en pantalla
- **Cómo se comprueba**: abrir el cuadrante en un dispositivo de 360 puntos de ancho
  en orientación vertical y mirar la cabecera, primero en la semana en curso y
  después tras tocar `Semana siguiente`.
- **Qué se debe observar**: el rango se lee de corrido en horizontal,
  `07/09/2026 - 13/09/2026`, en una sola línea y sin partirse. La indicación
  `Semana en curso` se lee igual, en horizontal, y desaparece al desplazarse a otra
  semana. Las acciones `Semana anterior` y `Semana siguiente` se leen enteras, cada
  una en su lado. Ningún texto de la cabecera aparece en vertical, letra bajo letra.
- **Por qué está aquí**: el test comprueba el **contenido** del texto, no su
  geometría. El 07/09/2026 el rango compartía fila con las dos acciones de
  navegación, se quedaba sin ancho y se dibujaba en vertical, un carácter por línea,
  con la suite en verde. Solo se ve mirando la pantalla.
- **Última comprobación**: pendiente.

### El cuadrante en la pantalla más estrecha soportada

- **Capability**: cuadrante-semanal
- **Requisito**: La plantilla completa es alcanzable y legible
- **Cómo se comprueba**: abrir el cuadrante en un dispositivo de 360 puntos de ancho
  en orientación vertical (o en el emulador con ese ancho), con turnos planificados
  en varias celdas.
- **Qué se debe observar**: las siete columnas caben a la vez, ninguna se ve más
  estrecha que la yema de un dedo, y las horas de los turnos se leen enteras: `09:00`
  y `17:00`, nunca `9:0…` ni `9h`.
- **Última comprobación**: pendiente.

### Ver el cuadrante con 20 empleados en plantilla

- **Capability**: cuadrante-semanal
- **Requisito**: La plantilla completa es alcanzable y legible
- **Cómo se comprueba**: dar de alta a 20 empleados desde el panel de empleados,
  volver al cuadrante y recorrerlo de arriba abajo tocando celdas al azar.
- **Qué se debe observar**: se llega a los 20 desplazándose verticalmente; las horas
  se siguen leyendo completas; al tocar una celda se abre la de esa celda y no la de
  la de al lado; y sigue sin haber scroll horizontal.
- **Última comprobación**: pendiente.

### La cabecera de días acompaña al scroll vertical

- **Capability**: cuadrante-semanal
- **Requisito**: La plantilla completa es alcanzable y legible
- **Cómo se comprueba**: con una plantilla que no quepa en pantalla, desplazarse
  hasta el último empleado.
- **Qué se debe observar**: la fila con los días de la semana sigue visible arriba
  durante todo el recorrido; en ningún momento hay que recordar de memoria a qué día
  corresponde la columna que se está mirando.
- **Última comprobación**: pendiente.

### Ver un turno partido en su celda

- **Capability**: cuadrante-semanal
- **Requisito**: Contenido observable de una celda
- **Cómo se comprueba**: planificar a un empleado un turno de 12:00 a 16:00 y otro de
  20:00 a 00:00 el mismo día, en una pantalla de 360 puntos de ancho.
- **Qué se debe observar**: los cuatro números se leen enteros, el par de arriba es
  el que empieza antes, se distingue a simple vista que son dos tramos y no un
  intervalo largo, y no aparece ningún «+1», puntos suspensivos ni indicador de que
  haya algo más que no se está viendo.
- **Última comprobación**: pendiente.

### Ver una celda de vacaciones

- **Capability**: cuadrante-semanal
- **Requisito**: Contenido observable de una celda
- **Cómo se comprueba**: marcar vacaciones un día, dejar el día de al lado vacío y
  poner un turno planificado en un tercer día de la misma fila.
- **Qué se debe observar**: la celda de vacaciones se distingue de la vacía y de la
  del turno de un vistazo, a un brazo de distancia. Comprobarlo también con el móvil
  en escala de grises (Ajustes → Accesibilidad): la diferencia debe seguir siendo
  evidente sin color.
- **Última comprobación**: pendiente.

### Ver una celda de ausencia

- **Capability**: cuadrante-semanal
- **Requisito**: Contenido observable de una celda
- **Cómo se comprueba**: marcar ausencia a un empleado y vacaciones a otro el mismo
  día, de forma que las dos celdas queden en la misma columna.
- **Qué se debe observar**: `AUS` y `VAC` se distinguen entre sí sin tener que leer
  con atención: además del fondo, el recuadro de una es continuo y el de la otra
  discontinuo. Comprobarlo también en escala de grises.
- **Última comprobación**: pendiente.

### Ver la lista con 20 empleados

- **Capability**: panel-empleados
- **Requisito**: La plantilla completa es alcanzable y legible en el panel
- **Cómo se comprueba**: dar de alta a 20 empleados, abrir el panel de empleados en
  un dispositivo de 360 puntos de ancho en orientación vertical (o en el emulador
  con ese ancho) y recorrer la lista de arriba abajo tocando filas al azar.
- **Qué se debe observar**: se llega a los 20 desplazándose verticalmente; cada fila
  se toca sin esfuerzo con el pulgar y de un toque se abre la ficha de esa persona y
  no la de la de al lado; la acción de dar de alta sigue a la vista sin tener que
  recorrer la lista entera. El test automatizado ya comprueba que cada fila declara
  44 puntos de alto y todo el ancho; lo que queda para el ojo es si de verdad se
  acierta con el dedo y si la acción de alta sigue alcanzable en la mano.
- **Última comprobación**: pendiente.

### Los datos de contacto se quedan en el dispositivo

- **Capability**: almacenamiento-empleados
- **Requisito**: Los datos guardados no salen del dispositivo
- **Cómo se comprueba**: con la app instalada y algún empleado dado de alta, poner el
  móvil en modo avión, abrir la ficha de `Bruno` y rellenarle el teléfono, el email y
  la nota. Cerrar la app por completo, volver a abrirla y mirar su ficha. Después,
  con el móvil ya conectado, comprobar en Ajustes → Uso de datos que la app no ha
  consumido nada.
- **Qué se debe observar**: los tres datos se guardan sin conexión y siguen ahí al
  reabrir; no aparece ningún error de red, ningún indicador de sincronización y
  ningún consumo de datos atribuido a la app. El test automatizado
  `src/datos/__tests__/privacidad.test.ts` ya comprueba la mitad que se puede leer en
  el código —ningún módulo de `src/datos/` sabe hacer peticiones de red, compartir
  ficheros ni escribir fuera del almacenamiento de la app—; lo que queda para el
  dispositivo es que el sistema operativo confirme que, efectivamente, no sale nada.
- **Última comprobación**: pendiente.

### El almacenamiento funciona de verdad en el dispositivo

- **Capability**: almacenamiento-empleados
- **Requisito**: cubre la parte de «La plantilla sobrevive al cierre de la app» y
  «Primera ejecución con la plantilla vacía» que los tests no alcanzan.
- **Por qué no hay test**: `expo-sqlite` no se puede ejecutar fuera del dispositivo.
  En Node, la propia librería instala una implementación vacía —`web/SQLiteModule.node.ts`:
  «expo-sqlite is not supported on server runtime»— que abre, ejecuta y devuelve
  vacío **sin lanzar ningún error**. La suite ejercita el mismo SQL contra
  `node:sqlite` (ver `openspec/specs/.../design.md` — D10), así que lo único que queda
  sin cubrir es `src/datos/sqlite/bdExpoSqlite.ts`: la envoltura de cuatro métodos
  que traduce la interfaz a la API de la librería.
- **Cómo se comprueba**: **requiere un build instalable en el dispositivo** (ver
  "Escenarios que necesitan un build instalable"). Con la app recién instalada, sin
  haberla abierto nunca: abrirla, dar de alta a `Ana`, `Bruno` y `Carmen`, rellenar
  la ficha de `Bruno` entera, cerrar la app desde el selector de aplicaciones y
  volver a abrirla.
- **Qué se debe observar**: la primera apertura no pide ninguna confirmación sobre
  los datos y la plantilla está vacía; tras reabrir, los tres siguen ahí, en el orden
  `Ana`, `Bruno`, `Carmen`, y la ficha de `Bruno` conserva su teléfono, su email y su
  nota. Si el adaptador estuviera mal, la plantilla aparecería vacía en la segunda
  apertura.
- **Última comprobación**: pendiente.

### Ver la ficha de un empleado sin vacaciones y sin notas

- **Capability**: panel-empleados
- **Requisito**: La plantilla completa es alcanzable y legible en el panel
- **Cómo se comprueba**: dar de alta a un empleado solo con su nombre y abrir su
  ficha, sin añadirle ningún rango de vacaciones ni escribirle nota.
- **Qué se debe observar**: el nombre, el puesto, el teléfono y el email se muestran y
  se puede escribir en los cuatro; la zona de vacaciones dice que no hay ninguno y
  ofrece la acción de añadir un rango; los campos de nota y de motivo de la ausencia
  se ven vacíos y admiten escritura. No aparece ningún mensaje de error ni ninguna
  zona en blanco sin explicación. El test automatizado comprueba que todos los campos
  están presentes; lo que queda para el ojo es que la ficha vacía se lea como una
  ficha vacía y no como una pantalla rota.
- **Última comprobación**: pendiente.

## Escenarios de la identidad del local

Los tres tienen test automatizado —que el nombre está donde toca, que se trunca en
una línea, que el logo no crece con la letra del sistema—. Lo que se anota aquí es
la parte que solo se resuelve mirando: si la cabecera se lee como la cabecera de un
negocio y no como un adorno que le quita sitio al cuadrante.

> El 08/09/2026 se retiró la pantalla de ajustes y el nombre del local pasó a estar
> fijado en el código, junto al logo. Con ella desaparecieron los escenarios que
> hablaban de escribirlo, corregirlo o verlo todavía vacío, y el escenario de un
> nombre muy largo, que ya no puede darse. Los que siguen aquí son los que quedan, y
> pertenecen ahora a `cuadrante-semanal`, que es la capability de la pantalla donde
> se dibuja esa cabecera.

### Abrir la app con el nombre del local ya escrito

- **Capability**: cuadrante-semanal
- **Requisito**: La pantalla de inicio identifica el local
- **Cómo se comprueba**: con 20 empleados dados de alta, abrir la app en el móvil en
  vertical.
- **Qué se debe observar**: el logo se ve nítido y redondo, sin restos del fondo
  gris de la foto original; el nombre `La Esquina café` se lee entero junto a él; y
  debajo caben el rango de la semana, la navegación y la rejilla, con **al menos
  tantas filas de empleado visibles como antes del cambio**. Si la cabecera ha
  empujado la rejilla hacia abajo, el cambio no vale.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. La cabecera muestra el nombre junto al logo, que se ve redondo y sin
  restos del fondo de la foto. No se contó fila a fila si se ven tantas como antes
  del cambio, pero la rejilla no da sensación de haber perdido sitio. Comprobado
  entonces con el nombre escrito desde los ajustes; desde que el nombre viene fijo
  con la app, lo que se ve en pantalla es exactamente lo mismo.

### La identidad del local no le quita sitio a la rejilla

- **Capability**: cuadrante-semanal
- **Requisito**: La pantalla de inicio identifica el local
- **Cómo se comprueba**: con 20 empleados dados de alta, abrir la app en una pantalla
  de 360 puntos de ancho en vertical y contar las filas de empleado que se ven sin
  desplazarse. Intentar arrastrar la rejilla hacia los lados.
- **Qué se debe observar**: las siete columnas de día se ven a la vez y la rejilla no
  se mueve horizontalmente. Se ven tantas filas de empleado como se veían antes de
  existir la cabecera de identidad: la fila del logo y el nombre no se ha llevado
  ninguna. El test automatizado ya comprueba que las siete columnas y las 20 filas
  están montadas; lo que queda para el ojo es cuántas de esas filas caben de verdad
  en la pantalla.
- **Última comprobación**: pendiente.

### El nombre del local y la semana no se confunden

- **Capability**: cuadrante-semanal
- **Requisito**: Identificación de la semana en pantalla
- **Cómo se comprueba**: abrir el cuadrante con el nombre escrito y mirar la
  cabecera de un vistazo, sin detenerse a leer.
- **Qué se debe observar**: se distinguen dos cosas —de quién es el cuadrante, y qué
  semana se está mirando—, no un único bloque de título. El nombre va arriba, junto
  al logo; el rango, centrado y debajo.
- **Última comprobación**: pendiente.

## La migración a la versión 3 en el dispositivo

Es la primera migración de este proyecto que **borra** algo, y corrió sobre el único
móvil donde están los datos reales del encargado. No tiene vuelta atrás: el mecanismo
solo avanza. Por eso se comprobó en el dispositivo antes de dar el change por
cerrado, y por eso queda anotado aquí aunque no sea el escenario de ninguna spec.

### El salto de la versión 2 a la 3 no se llevó nada por delante

- **Capability**: almacenamiento-empleados
- **Requisito**: cubre en el dispositivo lo que el test de `migraciones.test.ts`
  comprueba contra `node:sqlite`: que la adaptación conserve la plantilla, las fichas
  y el cuadrante, y retire únicamente lo que la app ha dejado de usar.
- **Cómo se comprueba**: con la app ya instalada y datos reales en la versión 2 del
  esquema, recargarla y recorrer la plantilla y el cuadrante, incluidas semanas
  anteriores con turnos, ausencias y vacaciones.
- **Qué se debe observar**: no falta ningún empleado ni ninguna ficha; el cuadrante
  conserva todo su contenido; no aparece ningún aviso ni se pide nada al encargado; y
  el nombre del local se sigue viendo en la cabecera, ahora desde el código.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. La plantilla y el cuadrante siguen enteros tras la migración.

### Abrir la ficha desde el nombre de la fila no se dispara al deslizar

- **Capability**: cuadrante-semanal
- **Requisito**: Rejilla de empleados por días
- **Cómo se comprueba**: recorrer la rejilla de arriba abajo deslizando con el pulgar
  sobre la columna de nombres, varias veces, y después tocar un nombre a propósito.
- **Qué se debe observar**: el desplazamiento no abre ninguna ficha; solo el toque
  intencionado lo hace. Al volver, el cuadrante sigue en la misma semana.
- **Por qué está aquí**: es el riesgo que `design.md` — Risks dejó abierto. El nombre
  pasó a ser pulsable pegado a siete celdas que también lo son, y si el gesto de
  desplazar sacara al encargado de la rejilla habría que replantearlo. El test
  comprueba que el toque abre la ficha, no que el deslizamiento no la abra.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. El nombre abre la ficha al tocarlo y no se dispara al deslizar la
  rejilla, así que el riesgo previsto no se ha materializado.

## Escenarios del puesto y del teclado

Los cuatro tienen test automatizado de lo que se puede leer en el código —qué ancho
cede cada texto, qué hueco declara el contenido del scroll—. Lo que queda para el ojo
es lo que ningún test alcanza: si el nombre se sigue leyendo, y si el campo se ve de
verdad por encima del teclado.

### El puesto se trunca antes que el nombre

- **Capability**: panel-empleados
- **Requisito**: Lista de empleados del panel
- **Cómo se comprueba**: dar de alta a `Maricarmen de la Fuente Etxebarria` con el
  puesto `Responsable de sala y barra` y abrir el panel de empleados en un
  dispositivo de 360 puntos de ancho en orientación vertical.
- **Qué se debe observar**: el nombre se lee entero, o recortado lo mínimo
  imprescindible para saber de quién es la fila; el que aparece con puntos
  suspensivos es el puesto. El icono `✎` del final de la fila sigue viéndose entero y
  se toca sin esfuerzo con el pulgar. La fila conserva su alto: no se parte en dos
  líneas ni se estira.
- **Por qué está aquí**: el test comprueba que el puesto cede ancho antes que el
  nombre —lo declaran sus `flexShrink`—, no cuántos caracteres sobreviven de cada uno
  en una pantalla real. Eso solo se ve mirando.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. La lista muestra el nombre y el puesto sin que el puesto se coma el
  nombre, y el icono `✎` del final de la fila sigue visible y se toca sin esfuerzo.

### Escribir en la nota con el teclado abierto

- **Capability**: panel-empleados
- **Requisito**: El teclado no tapa el campo que se está escribiendo
- **Cómo se comprueba**: en el móvil, abrir la ficha de un empleado, tocar el campo
  de la nota y escribir cuatro o cinco líneas seguidas sin cerrar el teclado.
- **Qué se debe observar**: al tocar el campo, la ficha se desplaza sola hasta él y
  la nota queda por encima del teclado. Lo que se teclea se ve **mientras** se
  teclea, línea a línea, sin tener que cerrar el teclado para comprobarlo. El campo
  no queda ni parcialmente tapado.
- **Por qué está aquí**: el test comprueba que el contenido reserva el alto del
  teclado, no que el campo quede efectivamente por encima de él. Con edge-to-edge
  eso depende del dispositivo, y era justo el defecto que se vio el 08/09/2026.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. El teclado ya no tapa la nota: se ve lo que se teclea mientras se
  teclea. El defecto que se vio esa misma mañana queda resuelto.

### Escribir en el motivo de la ausencia con el teclado abierto

- **Capability**: panel-empleados
- **Requisito**: El teclado no tapa el campo que se está escribiendo
- **Cómo se comprueba**: lo mismo que el anterior, pero con el campo del motivo de la
  ausencia, que es el último de la ficha y por tanto el que más abajo queda.
- **Qué se debe observar**: al tocarlo, la ficha se desplaza hasta él y el campo se ve
  entero por encima del teclado mientras se escribe.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. El campo del motivo, que es el último de la ficha, se ve entero por
  encima del teclado.

### Al cerrar el teclado la ficha recupera su sitio

- **Capability**: panel-empleados
- **Requisito**: El teclado no tapa el campo que se está escribiendo
- **Cómo se comprueba**: tras escribir en la nota, cerrar el teclado con el gesto de
  volver del móvil y recorrer la ficha hasta el final.
- **Qué se debe observar**: la ficha vuelve a verse como antes de abrir el teclado.
  Al llegar abajo del todo, la acción de dar de baja es lo último que hay: no queda
  una franja en blanco del alto del teclado por debajo de ella.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. Al cerrar el teclado la ficha recupera su sitio y no queda franja en
  blanco al final.

## Escenarios de la identidad visual

Casi todos los escenarios de `identidad-visual` acaban aquí, y por la misma razón:
un test puede leer qué color y qué peso **declara** un texto, pero no si ese texto
se lee de pie, al sol y a un brazo de distancia. Lo que sí se puede leer en el
código ya está en `src/ui/__tests__/identidadVisual.test.tsx`.

### La rejilla se lee con luz fuerte

- **Capability**: identidad-visual
- **Requisito**: Contraste mínimo legible
- **Cómo se comprueba**: con 20 empleados dados de alta, sacar el móvil a plena luz
  —una terraza al sol, no una ventana— y mirar el cuadrante con el brillo al máximo
  y después al 50 %.
- **Qué se debe observar**: las líneas que separan una celda de otra se ven sin
  esforzarse, y se sabe a qué fila y a qué columna pertenece una celda cualquiera sin
  seguirla con el dedo. La línea que separa la columna de nombres y la que hay bajo
  la cabecera de días son más marcadas que las de dentro de la rejilla.
- **Por qué está aquí**: el contraste calculado (3,4:1) se cumple sobre el papel;
  lo que no se puede calcular es si a un punto de grosor y con reflejos la línea
  sigue estando. Es el riesgo abierto de este cambio: si la rejilla resulta ser una
  reja, la salida prevista es aclarar solo la línea horizontal entre filas.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. La rejilla se lee sin esforzarse y no resulta una reja, así que no
  ha hecho falta la salida prevista de aclarar la línea horizontal entre filas.

### El texto sobre un fondo de estado sigue siendo legible

- **Capability**: identidad-visual
- **Requisito**: Contraste mínimo legible
- **Cómo se comprueba**: marcar una ausencia y unas vacaciones el mismo día en dos
  filas contiguas y mirarlas a un brazo de distancia, con el brillo a la mitad.
- **Qué se debe observar**: `AUS` en su ámbar y `VAC` en su verde se leen enteras y
  sin bizquear sobre su fondo; ninguna de las dos se "apaga" contra él.
- **Última comprobación**: pendiente.

### El cuadrante en escala de grises

- **Capability**: identidad-visual
- **Requisito**: El color no es el único portador de significado
- **Cómo se comprueba**: dejar en una misma fila una celda con turno planificado, una
  con ausencia, una con vacaciones y una vacía. Poner el móvil en escala de grises
  (Ajustes → Accesibilidad → Corrección de color / Escala de grises) y mirarlas.
- **Qué se debe observar**: las cuatro se siguen distinguiendo: las horas, `AUS` con
  su recuadro continuo, `VAC` con su recuadro discontinuo y la vacía sin nada. En
  ningún momento hay que recordar de qué color era cada una.
- **Última comprobación**: pendiente.

### Los estados de la celda se distinguen por su color

- **Capability**: identidad-visual
- **Requisito**: Paleta de la aplicación
- **Cómo se comprueba**: con la misma fila del escenario anterior y el móvil ya en
  color, mirar el cuadrante de un vistazo, sin detenerse a leer.
- **Qué se debe observar**: la celda de ausencia tiene un fondo cálido, la de
  vacaciones uno verde, y la del turno planificado ninguno: se lee sobre el blanco de
  la pantalla. Los dos fondos se distinguen entre sí de un vistazo.
- **Última comprobación**: pendiente.

### Una ausencia no se confunde con un aviso de borrado

- **Capability**: identidad-visual
- **Requisito**: Paleta de la aplicación
- **Cómo se comprueba**: mirar una celda de ausencia, y a continuación tocar una
  celda con turno y elegir eliminarlo para ver la confirmación.
- **Qué se debe observar**: el fondo cálido de la ausencia y el rojizo de la acción
  destructiva no se parecen: al ver la confirmación no se duda de si se está
  marcando una ausencia. El test comprueba que los dos valores son distintos; lo que
  queda para el ojo es que además lo parezcan.
- **Última comprobación**: pendiente.

### Las horas de la celda se leen a un brazo de distancia

- **Capability**: identidad-visual
- **Requisito**: Escala tipográfica de la aplicación
- **Cómo se comprueba**: con turnos planificados en varias celdas, sostener el móvil
  como se sostiene en la sala —a un brazo, sin acercarlo— en una pantalla de 360
  puntos de ancho.
- **Qué se debe observar**: `09:00` y `17:00` se leen sin acercar el móvil ni
  entornar los ojos, también en una celda con dos turnos.
- **Última comprobación**: pendiente.

### Las horas de dos filas quedan alineadas

- **Capability**: identidad-visual
- **Requisito**: Todo dato numérico se compone con cifras de ancho fijo
- **Cómo se comprueba**: planificar un turno de 09:00 a 17:00 a un empleado y otro de
  11:00 a 18:00 al de la fila de abajo, el mismo día, y mirar las dos celdas.
- **Qué se debe observar**: los dígitos de las dos filas caen uno debajo del otro,
  como en una columna de números. Si bailan —el `1` más estrecho que el `0`—, Android
  está ignorando las cifras tabulares.
- **Por qué está aquí**: `fontVariant: ['tabular-nums']` no falla si el sistema no lo
  soporta: lo ignora en silencio. Solo se ve mirando. Si se confirma que Android lo
  ignora, la salida prevista está en el `design.md` del change — Risks.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. Android sí aplica las cifras tabulares: los dígitos de las dos filas
  caen uno debajo del otro, así que no ha hecho falta la salida prevista en
  `design.md` — Risks.

### El rango de la semana no cambia de ancho al navegar

- **Capability**: identidad-visual
- **Requisito**: Todo dato numérico se compone con cifras de ancho fijo
- **Cómo se comprueba**: partiendo de `07/09/2026 - 13/09/2026`, tocar `Semana
  siguiente` tres veces seguidas mirando fijamente el rango.
- **Qué se debe observar**: el rango no se ensancha ni se desplaza al cambiar los
  dígitos; se queda quieto en su sitio y solo cambian los números.
- **Última comprobación**: pendiente.

### El mismo elemento se ve igual en dos pantallas distintas

- **Capability**: identidad-visual
- **Requisito**: Una sola identidad visual para toda la app
- **Cómo se comprueba**: mirar el nombre de un empleado en la rejilla del cuadrante,
  ir al panel de empleados y mirar el mismo nombre en su fila; después abrir su ficha
  y comparar las acciones de las tres pantallas.
- **Qué se debe observar**: el nombre tiene el mismo color y el mismo trazo en las
  tres; las acciones se reconocen como acciones en todas —el mismo azul, el mismo
  peso— y ninguna pantalla parece de otra app.
- **Última comprobación**: pendiente.

### El tema oscuro del dispositivo no cambia la app

- **Capability**: identidad-visual
- **Requisito**: Una sola identidad visual para toda la app
- **Cómo se comprueba**: poner el móvil en tema oscuro (Ajustes → Pantalla → Tema
  oscuro), abrir la app y recorrer el cuadrante, el panel y una ficha. Volver a tema
  claro y repetir.
- **Qué se debe observar**: la app se ve igual en los dos casos, con su fondo blanco
  y su tinta oscura. No hay ninguna opción de tema en ninguna pantalla, y ningún
  texto queda claro sobre claro ni oscuro sobre oscuro.
- **Última comprobación**: pendiente.

### Ningún texto de la interfaz cambia

- **Capability**: identidad-visual
- **Requisito**: La identidad visual no altera el comportamiento ni la estructura
- **Cómo se comprueba**: recorrer el cuadrante, el panel de empleados y una ficha
  completa, comparando con lo que se leía antes del cambio de aspecto.
- **Qué se debe observar**: se leen exactamente los mismos textos y se ofrecen las
  mismas acciones; lo único distinto es cómo se ven. La suite completa en verde ya
  cubre la parte comprobable —los tests existentes afirman los textos y las acciones
  de cada pantalla, y no se ha tocado ninguna de esas expectativas—; lo que queda
  para el ojo es que tampoco haya cambiado nada en pantalla que ningún test mire.
- **Última comprobación**: pendiente.

## Escenarios de la exportación del cuadrante

> El documento se compone en `src/exportacion/documentoDelCuadrante.ts` y esa parte
> —qué filas, qué columnas, qué dice cada celda y, sobre todo, qué **no** aparece—
> se comprueba entera en `npm test`, sobre el HTML completo. Lo que ningún test
> alcanza es el papel: si la tabla cabe, si se lee y si el PDF llega abrible a quien
> lo recibe. Eso es lo que se anota aquí.

### Se recarga la app con `expo-print` y `expo-sharing` dentro

- **Capability**: exportacion-cuadrante
- **Requisito**: (no es un escenario de spec: es la comprobación de que las dos
  dependencias nativas nuevas no rompen nada, previa a escribir la exportación)
- **Cómo se comprueba**: con `expo-print`, `expo-sharing` y `expo-file-system` ya
  instalados, parar el servidor de desarrollo, volver a lanzarlo con `npx expo start
  --clear` y abrir la app en Expo Go.
- **Qué se debe observar**: la app arranca sin pantalla de error, se ve el cuadrante
  de la semana en curso con su plantilla, y navegar entre semanas y editar una celda
  siguen funcionando igual que antes.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado — **correcto**.

### Exportar una semana con 20 empleados

- **Capability**: exportacion-cuadrante
- **Requisito**: El documento es legible con la plantilla completa
- **Cómo se comprueba**: con los 20 empleados dados de alta y varios con turnos los
  siete días —alguno con dos turnos el mismo día—, tocar `Compartir`, elegir
  «Guardar» o abrir el PDF desde la hoja del sistema, y mirarlo entero. Después
  imprimirlo, o verlo en escala de grises.
- **Qué se debe observar**: el documento incluye las 20 filas y las siete columnas de
  lunes a domingo. Todas las horas se leen completas, en `hh:mm`, sin cortes,
  truncados ni abreviaturas. Si la tabla se parte en dos páginas, la cabecera de días
  se repite en la segunda. En blanco y negro se distinguen igual las horas, la
  palabra `Ausencia` y la palabra `Vacaciones`: ningún estado depende de un fondo de
  color.
- **Por qué está aquí**: la suite comprueba que las 20 filas y las siete columnas
  están en el HTML, pero si caben en la hoja y si se leen impresas no se ve más que
  abriendo el PDF.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado —
  **correcto**. Se exportó la semana con la plantilla completa, se abrió el PDF y se
  mandó por mensajería; quien lo recibió lo abrió y lo leyó. Las 20 filas y las siete
  columnas caben y las horas se leen enteras.

### Un nombre largo se lee entero en el documento

- **Capability**: exportacion-cuadrante
- **Requisito**: El documento es legible con la plantilla completa
- **Cómo se comprueba**: dar de alta a `Maricarmen de la Fuente Etxebarria`, exportar
  la semana y mirar su fila en el PDF.
- **Qué se debe observar**: el nombre aparece completo, sin puntos suspensivos ni
  ninguna otra marca de recorte. Si no cabe en una línea, parte de línea dentro de su
  celda —la fila crece— pero no pierde ni una letra. En la rejilla de la pantalla ese
  mismo nombre sí se trunca, y es correcto: el papel tiene más sitio.
- **Por qué está aquí**: la suite comprueba que el nombre entero está en el HTML; que
  no lo recorte la maquetación solo se ve en el PDF.
- **Última comprobación**: pendiente.

### Compartir la semana exportada

- **Capability**: exportacion-cuadrante
- **Requisito**: El documento se entrega por la hoja de compartir del sistema
- **Cómo se comprueba**: tocar `Compartir` en el cuadrante y recorrer el camino
  entero: elegir la app de mensajería del grupo del local, enviarlo, y pedir a quien
  lo reciba que lo abra. Repetir eligiendo «Imprimir» y «Guardar».
- **Qué se debe observar**: se abre la hoja de compartir del propio móvil, la misma
  que para cualquier otro fichero, con el PDF dentro y con el rango de la semana en
  el nombre del fichero (`Cuadrante 14-09-2026 a 20-09-2026.pdf`). Desde ella se
  puede enviar, guardar o imprimir. Quien lo recibe lo abre y lo lee sin instalar
  nada. Al cerrar la hoja sin elegir nada, la app vuelve al cuadrante en la misma
  semana y no muestra ningún error.
- **Por qué está aquí**: `expo-print` y `expo-sharing` no existen fuera del
  dispositivo. La suite comprueba que se pregunta por la hoja antes de producir el
  PDF, que desistir no es un fallo y que un fallo no enseña nada técnico; que la hoja
  se abra de verdad y que el PDF llegue abrible, solo se ve en el móvil.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado — **correcto**. La hoja de
  compartir se abre y el PDF llega abrible. Para llegar aquí hubo que resolver dos
  cierres del sistema —el PDF que escribe `expo-print` queda fuera de la carpeta de
  la app y no se puede ni leer ni mover desde ella—; la salida está en el `design.md`
  del change, en la decisión del nombre del fichero.

### El PDF recibido no lleva ningún dato de contacto

- **Capability**: exportacion-cuadrante
- **Requisito**: El documento exportado no contiene datos de contacto
- **Cómo se comprueba**: rellenar teléfono, email, nota y motivo de la ausencia de
  **todos** los empleados de la plantilla, marcar alguna ausencia, exportar la semana
  y mandarse el PDF a uno mismo. Abrirlo en el móvil que lo recibe y buscar dentro
  del texto del documento cada uno de esos cuatro datos.
- **Qué se debe observar**: de cada empleado aparece únicamente su nombre. Ni un
  teléfono, ni un email, ni una nota, ni el motivo de ninguna ausencia: la celda de
  una ausencia dice `Ausencia` y nada más.
- **Por qué está aquí**: la suite ya lo comprueba sobre el HTML completo, y es la
  comprobación que no puede fallar. Se repite en el PDF recibido porque es el único
  sitio donde se ve lo que de verdad sale del dispositivo, y porque es la que cierra
  el change: si falla, no se comparte nada más hasta arreglarlo.
- **Última comprobación**: 08/09/2026, Expo Go en el móvil del encargado — **correcto**. En el PDF
  recibido aparece solo el nombre de cada empleado: ningún teléfono, ningún email,
  ninguna nota y ningún motivo de ausencia.

### El documento impreso en blanco y negro sigue distinguiendo sus partes

- **Capability**: exportacion-cuadrante
- **Requisito**: El documento distingue sus partes de un vistazo
- **Cómo se comprueba**: exportar una semana con la plantilla completa, alguna
  ausencia y alguna semana de vacaciones, e imprimir el PDF en una impresora en
  blanco y negro (o pedir en el diálogo de impresión «escala de grises»). Mirar la
  hoja impresa a un brazo de distancia.
- **Qué se debe observar**: la cabecera de días sigue siendo la franja más oscura y
  su texto se lee en blanco sobre ella. La columna de empleados se distingue de las
  siete columnas de día. Las bandas alternas de las filas se ven como dos grises
  distintos y permiten seguir la semana de un empleado sin irse a la fila de al lado.
  Una celda de ausencia sigue diciendo `Ausencia` y una de vacaciones `Vacaciones`:
  el fondo es un refuerzo, y sin él la celda informa igual. Ninguna hora queda
  ilegible sobre su fondo.
- **Por qué está aquí**: la suite comprueba que ningún fondo es oscuro salvo el de la
  cabecera y que los fondos se separan lo bastante en claridad como para no
  confundirse en gris. Cómo sale eso de una impresora concreta, con su tóner y su
  papel, solo se ve imprimiendo.
- **Última comprobación**: pendiente.
