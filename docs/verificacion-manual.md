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

## Escenarios

Los escenarios que siguen tienen además un test automatizado que comprueba lo que
se puede comprobar sin ver la pantalla (número de columnas, anchos declarados, área
pulsable mínima, textos). Lo que se anota aquí es la parte que solo se resuelve
mirando: si de verdad se lee, si de verdad no hay franja de scroll, si de verdad se
distinguen dos celdas de un vistazo.

### Abrir la app un día cualquiera de la semana

- **Capability**: cuadrante-semanal
- **Requisito**: El cuadrante semanal es la pantalla de inicio
- **Cómo se comprueba**: cerrar la app del todo y volver a abrirla desde el icono, un
  día laborable cualquiera, con empleados dados de alta.
- **Qué se debe observar**: lo primero que aparece es la rejilla del cuadrante, con
  la semana que va del lunes anterior al domingo siguiente. No se ve ninguna pantalla
  de bienvenida, resumen o menú por el camino, ni siquiera un instante.
- **Última comprobación**: pendiente.

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
