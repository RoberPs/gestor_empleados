# Verificación manual

Este documento recoge los escenarios de las specs que **solo se pueden comprobar
mirando la pantalla**: legibilidad, tamaño del área pulsable, ausencia de scroll
horizontal, distinción visual entre estados de una celda y comportamiento del
scroll. El resto de escenarios se comprueban en la suite automatizada (`npm test`).

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

### Ver la ficha de un empleado sin vacaciones y sin notas

- **Capability**: panel-empleados
- **Requisito**: La plantilla completa es alcanzable y legible en el panel
- **Cómo se comprueba**: dar de alta a un empleado solo con su nombre y abrir su
  ficha, sin añadirle ningún rango de vacaciones ni escribirle nota.
- **Qué se debe observar**: el nombre, el teléfono y el email se muestran y se puede
  escribir en los tres; la zona de vacaciones dice que no hay ninguno y ofrece la
  acción de añadir un rango; el campo de nota se ve vacío y admite escritura. No
  aparece ningún mensaje de error ni ninguna zona en blanco sin explicación. El test
  automatizado comprueba que los cinco campos están presentes; lo que queda para el
  ojo es que la ficha vacía se lea como una ficha vacía y no como una pantalla rota.
- **Última comprobación**: pendiente.
