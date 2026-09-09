## Why

La app está terminada y funcionando en el móvil, y ahora hay que **enseñarla a clientes
potenciales**. Hoy la única forma de que alguien la pruebe es instalarle el APK, es decir,
entregarle el producto entero antes de que haya decidido nada. Una vez instalado, el binario
está en su móvil, es extraíble y no se puede retirar.

Hace falta una vía de prueba que cumpla dos cosas a la vez: que el cliente la toque de verdad
con su propio móvil —una galería de capturas no enseña lo que se tarda en planificar una
semana—, y que no quede nada suyo en sus manos cuando la conversación termine.

## What Changes

- La app pasa a poder **ejecutarse también en el navegador**, publicada como sitio estático
  bajo un enlace que se manda al cliente. El cliente no instala nada.
- La demo arranca con **plantilla y cuadrante de ejemplo ya montados**: empleados ficticios y
  una semana planificada con turnos, alguna ausencia y unas vacaciones. Quien la abre ve la app
  funcionando desde el primer segundo, no una pantalla vacía que no sabe rellenar.
- Lo que el visitante toca **se conserva al recargar la página**, guardado en su propio
  navegador, para que la demo se comporte como una app de verdad y no como una maqueta que se
  reinicia sola. Existe además una forma explícita de **volver al estado de ejemplo**, para
  poder enseñarla desde cero a la siguiente persona.
- La demo **se identifica como demo** dentro de la propia pantalla, para que nadie la confunda
  con la app instalada ni empiece a meter en ella datos de su plantilla real.
- **Guardar y compartir el cuadrante funcionan de verdad**: producen el mismo PDF que la app
  instalada y lo entregan por la vía que ofrece el navegador. El documento que recibirían los
  empleados es medio argumento de venta y no puede quedarse fuera.
- **Nada del producto instalado cambia.** Ni una pantalla, ni un texto, ni un comportamiento en
  el móvil del encargado. El binario que se instala sigue siendo el mismo y sigue guardando sus
  datos en su dispositivo y en ningún otro sitio.

**Decisión de negocio (09/09/2026)**: la demo web es una **vía de demostración comercial, no un
canal de uso real**. Nadie planifica en ella el cuadrante de su local. El producto sigue siendo
el binario instalable, y el stack fijado del proyecto —un único binario, sin backend, sin
servidor propio, sin cuenta en la nube— **no se renegocia**: el sitio de la demo es estático, no
tiene servidor de aplicación detrás, no guarda nada de nadie y no existe ninguna cuenta.

**Decisión de negocio (09/09/2026)**: la demo lleva **datos inventados**. Ni un nombre, teléfono
o email real de la plantilla de La Esquina café puede acabar en un alojamiento público. Esto no es
una preferencia estética: el principio de privacidad del proyecto dice que los datos de contacto
viven únicamente en el dispositivo, y publicar los reales lo rompería de la forma más directa
posible.

Fuera de alcance, con su motivo:

- **Contraseña o control de acceso en la demo.** Decisión de negocio (09/09/2026): descartado.
  El enlace se manda a quien se quiera y se retira cuando se quiera; no hay nada que proteger
  dentro, porque los datos son inventados. Una pantalla de acceso añadiría un paso antes de ver
  el producto, que es justo lo contrario de lo que la demo busca.
- **Analítica de quién entra y qué toca.** Decisión de negocio (09/09/2026): descartado. El
  proyecto no lleva analítica ni telemetría en ninguna parte y la demo no va a ser la
  excepción. Los registros que el alojamiento guarde por su cuenta son suyos y la app no los
  consulta ni depende de ellos.
- **Soporte del navegador como plataforma del producto.** La demo se enseña en un móvil y ahí
  se prueba. Que la app quede utilizable en el navegador es un efecto de esto, no un compromiso
  de soporte, y no convierte al navegador en una plataforma que el proyecto mantenga.
- **Publicar la demo en una tienda o indexarla.** El enlace se reparte a mano.
- **Recuperar en la demo lo que el producto todavía no tiene**, como el registro de horas
  realmente trabajadas. La demo enseña lo que hay construido; lo que no existe, no se simula.

## Capabilities

### New Capabilities

- `demo-web`: qué es la demo y qué la distingue de la app instalada —que se abre por un enlace
  sin instalar nada, que arranca con datos de ejemplo inventados, que conserva en el navegador
  lo que el visitante toca, que se puede devolver al estado de ejemplo, y que se identifica
  como demo—, además de lo que la demo garantiza que **no** hace: no recoge datos de quien la
  usa, no envía a ninguna parte lo que se escriba en ella y no altera el comportamiento del
  producto instalado.

**Decisión de negocio (09/09/2026)**: se describe como capability propia y no repartida entre
las existentes. Lo que la demo añade no es una funcionalidad más del cuadrante ni del panel:
es una segunda forma de encontrarse con el mismo producto, con reglas propias sobre datos y
sobre lo que se le promete a quien la abre. Metida dentro de `cuadrante-semanal` obligaría a esa
spec a hablar de clientes potenciales, que no son su usuario.

### Modified Capabilities

- `exportacion-cuadrante`: la spec exige hoy que el documento salga por **la hoja de compartir
  del sistema** y que guardarlo pase por **el selector de carpetas del dispositivo**. En un
  navegador no existe ninguna de las dos cosas. Se añade el requisito que acota ese punto: dónde
  no hay hoja de compartir ni selector de carpetas, el mismo documento se entrega por la
  descarga del navegador, sin que cambie ni su contenido, ni su nombre, ni la regla de que no
  lleva datos de contacto.

Las dos capabilities de almacenamiento —`almacenamiento-cuadrante` y `almacenamiento-empleados`—
**no cambian**. Sus requisitos dicen que los datos del encargado permanecen únicamente en su
dispositivo, y eso sigue siendo cierto palabra por palabra: la demo es otra instalación, con
datos inventados, en el navegador de otra persona, y no tiene forma de tocar los del encargado.

## Impact

**Código**

- Implementación nueva de `BaseDeDatos` (`src/datos/sqlite/bd.ts`) para el navegador. La
  interfaz ya tiene dos implementaciones vivas —`expo-sqlite` en el móvil y `node:sqlite` en los
  tests—, así que esta es la tercera y no obliga a tocar ni el SQL de las migraciones ni la capa
  de almacén.
- `app/_layout.tsx` es hoy el único fichero que importa `expo-sqlite`, y así debe seguir: la
  elección de implementación pasa a resolverse por plataforma, sin que la disposición raíz
  aprenda de plataformas.
- `src/exportacion/compartirElCuadrante.ts` es el único punto que habla con `expo-print`,
  `expo-sharing` y `expo-file-system`; las dos últimas no funcionan en el navegador. Necesita su
  equivalente web. `documentoDelCuadrante.ts` es código puro, está cubierto por la suite y
  **no se toca**: el documento debe seguir componiéndose una sola vez y en un solo sitio.
- Módulo nuevo con los datos de ejemplo de la demo, que solo se carga en la demo y no entra en
  el binario del móvil.

**Dependencias**: una nueva, un SQLite para el navegador. La regla del proyecto pide
justificarla por escrito y `design.md` tiene que hacerlo, incluyendo qué se evaluó y por qué no
sirve el soporte web de `expo-sqlite`, que es experimental y no cubre la API síncrona sobre la
que está construida toda la capa de datos.

**Documentación**: `docs/despliegue.md` empieza diciendo que «esta app no se despliega en ningún
servidor». Deja de ser cierto y hay que reescribir esa parte, dejando claro que lo que se
despliega es la demo y no el producto. Hace falta además dejar escrito dónde se aloja, cómo se
publica una versión nueva y **cómo se corta el enlace** cuando ya no se quiera enseñar.

**Tests**: los tests actuales deben seguir verdes sin tocarlos. Los escenarios nuevos que solo
se puedan comprobar mirando la pantalla van a `docs/verificacion-manual.md` citando su nombre
literal, como exige el proyecto.

**Privacidad**: `src/datos/__tests__/privacidad.test.ts` falla si un módulo de la capa de datos
aprende a hablar por la red. La implementación web no puede saltárselo, y conviene comprobar que
ese test sigue teniendo criterio sobre la implementación nueva y no solo sobre la del móvil.
