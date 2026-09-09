## Purpose

La demo web es la forma de enseñar la app a un cliente potencial sin entregarle el binario: se
abre desde un enlace en el navegador de su móvil, trae un cuadrante de ejemplo con datos
inventados y se puede tocar entera. Aquí se llama **quien prueba la demo** a esa persona, para
distinguirla del **encargado**, que es quien usa la app instalada con los datos reales del
local.

## Requirements

### Requirement: La demo se abre desde un enlace sin instalar nada

El sistema MUST poder publicarse de forma que quien prueba la demo llegue a la app abriendo un
enlace en el navegador de su móvil.

Abrir ese enlace MUST llevar directamente al cuadrante, igual que abrir la app instalada. El
sistema MUST NOT pedir por el camino ninguna instalación, ningún registro, ninguna cuenta,
ninguna contraseña ni ningún permiso del dispositivo, y MUST NOT mostrar ninguna pantalla de
bienvenida, resumen o menú antes del cuadrante.

Quien prueba la demo MUST poder usarla con una sola mano y en vertical, con las mismas
condiciones de uso real que la app instalada.

#### Scenario: Abrir la demo por primera vez

- **WHEN** quien prueba la demo abre el enlace en el navegador de su móvil
- **THEN** ve el cuadrante
- **AND** no se le ha pedido instalar nada, registrarse ni aceptar ningún permiso
- **AND** no ha pasado por ninguna pantalla intermedia

### Requirement: La demo arranca con un cuadrante de ejemplo

La primera vez que se abre en un navegador, el sistema MUST presentar la demo con una plantilla
de empleados dada de alta y con la semana que se está viendo ya planificada: turnos
planificados, al menos una ausencia y al menos unas vacaciones, de forma que se vea a la vez
cada uno de los contenidos que puede tener una celda.

El ejemplo MUST montarse sobre **la semana en curso** el día en que se abre la demo, sea cual
sea ese día. El sistema MUST NOT presentar un ejemplo anclado a unas fechas fijas que con el
tiempo dejarían la demo abriéndose en una semana vacía o pasada.

La plantilla de ejemplo MUST tener el tamaño real del local —entre 10 y 20 empleados— para que
lo que se enseñe sea la pantalla que el encargado va a usar y no una versión de tres filas que
oculte cómo se comporta llena.

#### Scenario: La demo abre con la semana en curso planificada

- **WHEN** quien prueba la demo la abre por primera vez
- **THEN** el cuadrante muestra la semana en curso
- **AND** esa semana tiene turnos planificados, alguna ausencia y unas vacaciones
- **AND** la plantilla tiene entre 10 y 20 empleados dados de alta

#### Scenario: El ejemplo sigue estando en la semana en curso meses después

- **WHEN** la demo se abre por primera vez en un navegador varios meses después de publicarse
- **THEN** el cuadrante muestra la semana en curso de ese momento
- **AND** esa semana está planificada igual que el primer día

### Requirement: Los datos de la demo son inventados

Los empleados de la demo, sus datos de contacto, sus notas y los motivos de sus ausencias MUST
ser inventados.

El sistema MUST NOT incluir en la demo el nombre, el teléfono, el email, la nota ni el motivo de
ausencia de ninguna persona real, ni ningún dato tomado de la plantilla del local.

#### Scenario: Ningún dato de la demo corresponde a una persona real

- **WHEN** se revisan la plantilla de ejemplo y sus fichas completas
- **THEN** ningún nombre, teléfono, email, nota ni motivo de ausencia corresponde a una persona
  real
- **AND** ninguno procede de los datos guardados en la app del encargado

### Requirement: Lo que se prueba en la demo se conserva al recargar

Lo que quien prueba la demo escriba en ella —turnos planificados, ausencias, vacaciones, altas,
bajas y cambios de ficha— MUST conservarse en su propio navegador y MUST volver a estar
disponible tal cual al recargar la página o al volver a abrir el enlace más tarde.

Esa conservación MUST NOT depender de que guarde nada a mano ni de que cierre la página de
ninguna forma concreta, igual que en la app instalada.

Cuando el navegador no permite conservar nada —una ventana privada, o el almacenamiento del
sitio bloqueado—, la demo MUST seguir siendo utilizable durante la sesión: lo único que MUST
perderse es lo escrito al recargar. El sistema MUST NOT dejar la demo inservible por ese motivo
y MUST NOT mostrar ningún detalle técnico.

#### Scenario: Lo planificado en la demo sigue ahí al recargar

- **WHEN** quien prueba la demo planifica a un empleado un turno de `09:00` a `17:00` el jueves
- **AND** recarga la página
- **THEN** la celda de ese empleado en la columna del jueves muestra `09:00` y `17:00`

#### Scenario: La demo se puede usar aunque el navegador no deje conservar nada

- **WHEN** quien prueba la demo la abre en una ventana privada
- **THEN** ve el cuadrante de ejemplo y puede planificar, editar fichas y exportar con
  normalidad
- **AND** no se le muestra ningún mensaje técnico

### Requirement: La demo se puede devolver al estado de ejemplo

El sistema MUST ofrecer, dentro de la demo, una forma explícita de devolverla al estado con el
que se abre por primera vez, para poder enseñarla desde cero a la siguiente persona.

Como esa acción borra lo que haya en la demo, el sistema MUST pedir confirmación antes de
hacerla, y MUST NOT ejecutarla con un solo toque accidental.

Al terminar, la demo MUST quedar exactamente como recién abierta: la plantilla de ejemplo, la
semana en curso planificada, y nada de lo que se hubiera escrito antes.

#### Scenario: Volver al estado de ejemplo

- **WHEN** quien enseña la demo ha planificado, dado de alta y borrado varias cosas
- **AND** pide devolver la demo a su estado de ejemplo
- **AND** confirma
- **THEN** el cuadrante vuelve a mostrar la plantilla y la semana de ejemplo
- **AND** no queda nada de lo que se había escrito

#### Scenario: Desistir de volver al estado de ejemplo

- **WHEN** se pide devolver la demo a su estado de ejemplo y no se confirma
- **THEN** no se borra nada
- **AND** la demo sigue como estaba

### Requirement: La demo se identifica como demo

El sistema MUST indicar de forma visible, dentro de la propia demo, que lo que se está usando es
una demostración y no la app instalada.

Esa indicación MUST advertir de que no se escriban en ella datos reales de ninguna plantilla.

La indicación MUST NOT tapar el cuadrante ni obligar a cerrarla para poder usar la app, y MUST
NOT robarle a la semana el espacio que necesita para verse completa sin scroll horizontal.

#### Scenario: Se ve que es una demo

- **WHEN** quien prueba la demo abre el enlace
- **THEN** ve indicado que se trata de una demostración
- **AND** ve advertido que no escriba en ella datos reales
- **AND** el cuadrante de la semana se sigue viendo completo sin desplazarse en horizontal

### Requirement: Lo que se escribe en la demo no sale del navegador

Lo que quien prueba la demo escriba en ella MUST permanecer únicamente en su navegador.

El sistema MUST NOT enviarlo al alojamiento desde el que se sirve la demo, a ningún servicio ni
a ningún destinatario, y MUST NOT sincronizarlo con ningún otro dispositivo. La única salida
MUST seguir siendo la exportación que se lanza a mano.

El sistema MUST NOT recoger analítica ni telemetría de quien prueba la demo: ni qué toca, ni
cuánto tiempo está, ni desde dónde entra.

#### Scenario: Probar la demo no envía nada a ninguna parte

- **WHEN** quien prueba la demo planifica turnos, edita fichas y navega entre semanas durante
  toda una sesión
- **THEN** el sistema no envía nada de lo escrito fuera de su navegador
- **AND** no se recoge ninguna medida de lo que ha hecho
- **AND** lo único que puede salir es la exportación que lanza a mano

### Requirement: Cada navegador tiene su propia demo

Lo que alguien escriba en la demo MUST ser visible únicamente para él.

El sistema MUST NOT compartir entre visitantes la plantilla, el cuadrante ni ningún otro dato de
la demo: quien la abra MUST encontrarla siempre en su estado de ejemplo la primera vez, sin
rastro de lo que hayan hecho otros.

#### Scenario: Dos personas prueban la demo por separado

- **WHEN** una persona planifica turnos en la demo desde su móvil
- **AND** otra persona abre el mismo enlace por primera vez desde otro móvil
- **THEN** la segunda ve la demo en su estado de ejemplo
- **AND** no ve nada de lo que hizo la primera

### Requirement: La demo no altera la app instalada

Lo que la demo añade —los datos de ejemplo, la indicación de que es una demo y la acción de
devolverla a su estado inicial— MUST existir únicamente en la demo.

La app instalada en el móvil del encargado MUST NOT mostrar ninguna de esas tres cosas, MUST NOT
arrancar con ningún dato de ejemplo y MUST NOT cambiar en nada su comportamiento por la
existencia de la demo.

#### Scenario: La app instalada arranca como siempre

- **WHEN** se instala la app en un móvil y se abre por primera vez
- **THEN** arranca con la plantilla vacía, como hasta ahora
- **AND** no aparece ningún dato de ejemplo
- **AND** no aparece ninguna indicación de demostración ni ninguna acción para reiniciarla

### Requirement: La demo se puede retirar

El sistema MUST poder dejar de estar publicado cuando ya no se quiera enseñar, de forma que el
enlace repartido deje de dar acceso a la demo.

Retirarla MUST NOT afectar en nada a la app instalada en ningún móvil.

#### Scenario: El enlace deja de dar acceso

- **WHEN** se retira la demo
- **AND** alguien abre el enlace que se le había repartido
- **THEN** no accede a la demo
- **AND** la app instalada en el móvil del encargado sigue funcionando igual
