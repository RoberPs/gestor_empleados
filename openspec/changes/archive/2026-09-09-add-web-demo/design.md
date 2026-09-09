## Context

Ver `proposal.md` — Why. Lo que hace falta aquí es el estado del código que condiciona el
enfoque:

- **La capa de datos ya está preparada para una tercera implementación.** `BaseDeDatos`
  (`src/datos/sqlite/bd.ts`) son cuatro métodos, y `abrirAlmacenamiento` (`src/datos/arranque.ts`)
  recibe el `AbrirFichero` desde fuera. Hoy hay dos implementaciones vivas: `expo-sqlite` en el
  móvil y `node:sqlite` en los tests. El SQL de las migraciones se escribe una sola vez y corre
  igual en las dos.
- **La apertura del almacenamiento es síncrona, y a propósito.** `ArranqueDeLaApp` abre en el
  inicializador de `useState`, no en un efecto, porque `AlmacenCuadrante` es síncrona y las
  pantallas leen la plantilla mientras se dibujan. Su cabecera lo deja escrito. Cualquier
  implementación web tiene que respetar eso, no cambiarlo.
- **La exportación tiene un solo punto de contacto con el sistema.**
  `src/exportacion/compartirElCuadrante.ts` expone `compartirElCuadrante`, `guardarElCuadrante`,
  el tipo `ResultadoDeExportar` y cuatro mensajes. Todo lo que decide *qué dice* el documento
  está en `documentoDelCuadrante.ts`, que es código puro y está cubierto por la suite.

Y dos comprobaciones sobre qué ofrecen de verdad las librerías en el navegador, hechas sobre el
código instalado en `node_modules`, porque las dos cambian el enfoque:

- **`expo-print` en web es `window.print()` y nada más.**
  `node_modules/expo-print/build/ExponentPrint.web.js` implementa `printToFileAsync` como
  `window.print()`: **ignora el HTML que se le pasa**, imprime la página que se está viendo y no
  devuelve ningún fichero. Llamarlo desde el código actual imprimiría el cuadrante de la
  pantalla en vez del documento, y `printToFileAsync(...).base64` sería `undefined`.
- **`expo-sharing` en web es `navigator.share({ url })`.**
  `node_modules/expo-sharing/build/SharingNativeModule.web.js` comparte una URL, no un fichero.
  No sirve para entregar un PDF.

## Goals / Non-Goals

**Goals:**

- Que la demo sea **la misma app**, no una reconstrucción parecida: mismas pantallas, mismo SQL,
  mismas reglas de negocio, mismo documento exportado.
- Que todo lo específico de la demo viva en ficheros que **solo existen para web**, de forma que
  el binario del móvil no pueda arrastrar nada de ella ni por descuido.
- Que la app instalada no cambie: ni una línea de comportamiento, ni una dependencia nueva en su
  binario.

**Non-Goals:**

- Convertir el navegador en plataforma soportada del producto. Se busca que la demo se vea bien
  en el móvil donde se enseñe, no compatibilidad con todo navegador.
- Reproducir en web las funciones que dependen del sistema operativo tal como son en el móvil
  (hoja de compartir, selector de carpetas). Se entrega el mismo documento por la vía que haya.

## Decisions

### D1 — La demo usa SQLite de verdad en el navegador, con `sql.js`

**Decisión**: tercera implementación de `BaseDeDatos` sobre `sql.js`, SQLite compilado a
WebAssembly. Dependencia nueva y única de este change.

**Justificación escrita** (regla del proyecto: ninguna dependencia nueva sin ella). `sql.js`
tiene **API síncrona** (`db.run`, `db.exec`, `db.prepare`), que es exactamente la forma de
`BaseDeDatos`, y es SQLite real: respeta `PRAGMA user_version`, `AUTOINCREMENT`, los índices
únicos y `PRAGMA foreign_keys`, que es de lo que dependen las migraciones y la cascada de baja
de un empleado. Con ella, el SQL del proyecto corre en la demo sin escribirse dos veces.

Alternativas descartadas:

- **El soporte web de `expo-sqlite`**: es experimental y expone solo la API **asíncrona**. La
  capa de datos entera está construida sobre la síncrona, y `ArranqueDeLaApp` abre el
  almacenamiento en el inicializador de `useState` justo para que las pantallas puedan leer
  mientras se dibujan. Adoptarla obligaría a volver asíncrona `AlmacenCuadrante` y a meter
  estados de carga en las pantallas, es decir, a cambiar la app real para poder enseñarla.
- **`wa-sqlite` sobre OPFS**: también asíncrona, y además pide cabeceras de aislamiento entre
  orígenes en el alojamiento. Más piezas que mantener para el mismo resultado.
- **Un almacén paralelo en memoria, sin SQLite**: habría que reimplementar el orden alfabético
  español del listado, la validez de los campos de la ficha, el borrado en cascada de la baja y
  las reglas de escritura. La demo dejaría de demostrar el producto para demostrar una copia
  suya que se parece hasta que deje de parecerse.

### D2 — `ultimoId` y `filasAfectadas` se obtienen aparte

`sql.js` no devuelve el identificador insertado en `run()`. El contrato `ResultadoEscritura` sí
lo exige, así que el adaptador lo resuelve con `SELECT last_insert_rowid()` y con
`db.getRowsModified()`, ambos inmediatamente después de la escritura y sobre la misma conexión.
Se anota aquí porque es la única diferencia de forma entre las tres implementaciones y no debe
descubrirse leyendo el código.

### D3 — La carga del WebAssembly va antes, y la apertura sigue siendo síncrona

`sql.js` se inicializa con una promesa (hay que traerse el `.wasm`), pero `AbrirFichero` es
síncrono y no se va a tocar. Se resuelve con una **fase previa solo-web**: un componente que
espera a tener el motor listo y solo entonces monta `ArranqueDeLaApp`. A partir de ahí, abrir la
base es tan síncrono como en el móvil.

Esa fase previa no existe en el móvil: su versión nativa no espera nada y monta directamente.
Así, la app instalada no gana ni un instante de arranque ni una pantalla intermedia, que es lo
que exige la spec de `cuadrante-semanal` y lo que ya decidió `docs/despliegue.md` al no instalar
`expo-splash-screen`.

### D4 — La elección de plataforma se resuelve por extensión de fichero, no con condicionales

Metro resuelve `fichero.web.ts` antes que `fichero.ts` al empaquetar para web. Se aprovecha eso
en lugar de repartir `Platform.OS === 'web'` por el código:

- `src/datos/sqlite/bdDeLaApp.ts` (móvil, `expo-sqlite`) y `bdDeLaApp.web.ts` (navegador,
  `sql.js`).
- La fase previa de D3, en sus dos versiones.
- `src/exportacion/compartirElCuadrante.web.ts`, con la misma superficie exportada que el
  original.

Dos consecuencias buenas: `app/_layout.tsx` deja de nombrar `expo-sqlite` y no aprende de
plataformas, y **el código de la demo no entra en el binario del móvil**, porque Metro no
empaqueta los `.web.ts` para Android.

### D5 — Lo que se prueba en la demo se guarda en IndexedDB

`sql.js` trabaja en memoria; la base se persiste exportando su contenido (`db.export()`, un
`Uint8Array`) y volviéndolo a cargar al abrir.

**IndexedDB y no `localStorage`**: `localStorage` solo guarda texto, así que habría que pasar la
base a base64 —un tercio más de tamaño— contra un tope que ronda los 5 MB. IndexedDB guarda el
binario tal cual y no tiene ese problema.

**Qué fichero se sirve**: `sql.js` trae varias compilaciones del motor y **cuál pide depende de
quién lo empaquete**. El bundle web acaba pidiendo `sql-wasm-browser.wasm`, mientras que en Node
se usa `sql-wasm.wasm`. Por eso `scripts/copiarSqlWasm.js` copia las dos y `prepararSqlJs`
resuelve por el nombre que le pidan, en lugar de dar por hecho cuál será. Descubierto el
09/09/2026 abriendo la demo ya construida en un navegador: con una sola variante copiada, la
petición de la otra devolvía el `index.html` del sitio y la demo arrancaba en el aviso «No se han
podido abrir tus datos».

**Cuándo se vuelca**: después de cada escritura, coalescido para que una ráfaga de cambios no
escriba diez veces, y una vez más cuando la página se oculta o se cierra. La base de la demo son
decenas de KB, así que el volcado es barato; el volcado al ocultarse está para el caso de cerrar
la pestaña justo después de tocar una celda.

**Cuando el navegador no deja guardar** (ventana privada, almacenamiento bloqueado), el fallo se
traga y la demo sigue en memoria: se usa igual y solo se pierde lo escrito al recargar, como
exige la spec. Lo que **no** se hace es mostrar el aviso de almacenamiento no disponible, que
está pensado para el encargado y para un problema que en la demo no lo es.

### D6 — Los datos de ejemplo se siembran una vez y se anclan a la semana en curso

Al abrir la demo, si la base está vacía se siembra el ejemplo; si ya tiene contenido, no se toca
nada. Las fechas del ejemplo se calculan **a partir del día en que se abre**, no se escriben
fijas: la spec exige que la demo abra sobre la semana en curso aunque se visite meses después.

Devolver la demo a su estado de ejemplo es, por tanto, una sola cosa: borrar la base del
navegador y volver a sembrar. No hace falta ninguna función de deshacer.

El módulo con los datos de ejemplo es `.web.ts` como todo lo demás, y escribe **por la misma vía
que el encargado**: da de alta empleados y planifica celdas a través del almacén, no metiendo
filas a mano en SQLite. Si sembrar el ejemplo se rompe, es que la app está rota.

### D7 — En web el documento se entrega imprimiendo el documento, no la página

Es la consecuencia de las dos comprobaciones del Context. `compartirElCuadrante.web.ts`:

1. compone el documento con `componerDocumentoDelCuadrante`, **el mismo de siempre**, del que
   salen su HTML y su nombre de fichero;
2. lo escribe en un `iframe` fuera de pantalla, con el nombre de la semana como `<title>`;
3. imprime **ese** `iframe`, no la página.

Así lo que se imprime es el documento compuesto, con sus reglas de contenido y de privacidad
intactas, y no lo que hubiera en pantalla. El navegador ofrece «Guardar como PDF» en ese
diálogo, y propone como nombre de fichero el título del documento.

**Dos límites que esto impone, y que la spec recoge**:

- El nombre del fichero es el **propuesto**: quien exporta puede cambiarlo en el diálogo. En el
  móvil el nombre lo pone la app; aquí lo puede pisar el navegador.
- **No se puede saber si llegó a guardarse**. El diálogo no lo cuenta. Por eso en web no se
  muestra el mensaje de confirmación de guardado: afirmar que ha quedado guardado cuando puede
  haberse cancelado sería mentirle a quien lo usa.

Los dos botones de exportar siguen existiendo y siguen entregando el mismo documento; lo que
cambia es que en el navegador los dos desembocan en el mismo diálogo, porque no hay dos destinos
distintos que ofrecer. Los mensajes de plantilla vacía y de fallo se reutilizan tal cual.

Alternativa descartada: **una librería de PDF en el cliente** (`jsPDF` y compañía). Añadiría una
dependencia grande, y las que convierten HTML lo hacen rasterizando: el cuadrante saldría como
una imagen, con el texto no seleccionable y los nombres borrosos al ampliar. El documento es
medio argumento de venta; entregarlo peor que en el móvil sería tirar piedras contra el propio
tejado.

### D8 — La demo se publica como sitio estático y se retira borrándolo

`npx expo export -p web` produce una carpeta estática. Se publica en **Netlify**, por ser de los
que menos ceremonia piden para lo que hace falta aquí: subir una carpeta, tener un enlace y
poder borrar el sitio entero cuando ya no se quiera enseñar, que es como se cumple el requisito
de retirar la demo. Cambiar a Vercel o a Cloudflare Pages afectaría solo al paso de publicación.

El sitio se publica **sin indexar**: `robots.txt` que lo excluye y cabecera `X-Robots-Tag:
noindex`. El enlace se reparte a mano y no tiene por qué aparecer en un buscador. No lleva
contraseña, por la decisión de negocio ya tomada en la propuesta.

## Risks / Trade-offs

- **El `.wasm` de SQLite pesa alrededor de un mega y la demo se abre con datos móviles** → se
  descarga una sola vez y queda en la caché del navegador; se comprueba a mano cuánto tarda la
  primera apertura en un móvil con 4G antes de dar el enlace a nadie. Si molestase, el sitio
  puede servirlo comprimido.
- **`react-native-web` no pinta exactamente igual que Android**: sombras, elevaciones y sobre
  todo las cifras de ancho fijo que exige `identidad-visual` son los sospechosos habituales →
  la demo se repasa a ojo contra la app instalada, pantalla por pantalla, y lo que se compruebe
  así queda anotado en `docs/verificacion-manual.md`.
- **La demo podría comportarse distinto que la app sin que nadie se entere**, si `sql.js` y
  `expo-sqlite` difieren en algún detalle → la suite de almacenamiento está escrita contra la
  interfaz `BaseDeDatos`, no contra una implementación. Se hace correr también contra `sql.js`,
  y así la diferencia sale en la suite y no delante del cliente.
- **El diálogo de impresión es distinto en Chrome Android y en Safari iOS** → la exportación se
  verifica a mano en los dos antes de enseñar la demo.
- **Alguien confunde la demo con el producto y mete en ella datos reales de su plantilla** → de
  ahí el distintivo visible y la advertencia expresa que pide la spec. Es el riesgo por el que
  ese requisito existe.
- **La demo se queda publicada y olvidada** → `docs/despliegue.md` recoge cómo retirarla, y el
  `noindex` evita que aparezca por su cuenta en un buscador.
- **`src/datos/__tests__/privacidad.test.ts` vigila la capa de datos del móvil**; la
  implementación web es capa de datos nueva → se comprueba que ese test tenga criterio sobre
  ella, o se amplía. Una demo que aprendiera a hablar por la red sin que la suite se enterase
  sería justo el fallo que ese test existe para impedir.

## Migration Plan

No hay migración de datos: la demo nace vacía en cada navegador y el almacenamiento del
encargado no se toca.

**Publicar**: construir el sitio, publicarlo, comprobar el enlace en un móvil de verdad y
repartirlo.

**Volver atrás**: borrar el sitio. El enlace deja de resolver y no queda nada que deshacer. Lo
que hubiera quedado en el navegador de quien la probó son datos inventados.

**Sobre el APK**: este change no cambia el comportamiento de la app instalada, así que no
obliga a reconstruirla. La próxima vez que se construya, hay que comprobar que el binario no
arrastra nada de la demo —no debería: Metro no empaqueta los `.web.ts` para Android— y que
arranca con la plantilla vacía, como exige la spec.

## Lo que quedó comprobado al implementarlo

Sobre el sitio ya construido, en Chromium a 360 puntos de ancho (09/09/2026):

- La demo arranca en el cuadrante, con la plantilla de ejemplo y la semana en curso, sin errores
  de consola y sin scroll horizontal.
- Lo que se escribe sobrevive a recargar la página y a abrirla en otra pestaña.
- Un segundo navegador ve la demo en su estado de ejemplo, sin rastro de lo ajeno.
- Con `indexedDB` inutilizable, la demo se usa igual y no aparece el aviso de almacenamiento.
- Exportar manda a imprimir **el documento**, no la pantalla, con el nombre
  `Cuadrante 07-09-2026 a 13-09-2026`, y no afirma que haya quedado guardado.
- El bundle web no contiene ni una referencia a `expo-sqlite`.

Falta lo que solo puede decir un móvil de verdad: cuánto tarda la primera apertura con datos
móviles, si el aviso de la banda se lee de un vistazo, y el diálogo de impresión de Safari iOS.
