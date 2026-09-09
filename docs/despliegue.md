# Despliegue

Aquí se despliegan **dos cosas distintas**, y conviene no confundirlas:

1. **El producto**: un APK que se instala en el móvil del encargado. Es lo que cubre
   casi todo este documento.
2. **La demo web**: un sitio estático que sirve para enseñarle la app a un cliente sin
   entregarle el binario. Vive al final, en «La demo web», y **no es un canal de uso
   real**: nadie planifica en ella el cuadrante de su local.

El producto no se despliega en ningún servidor. Todo lo que hace ocurre dentro del móvil:
la plantilla y el cuadrante viven en SQLite en el almacenamiento privado de la aplicación,
y no hay API, ni cuentas, ni base de datos remota. Desplegarlo significa **una sola cosa**:
producir un APK e instalarlo en el móvil del encargado.

Que exista la demo no cambia nada de eso: es una copia de escaparate, con datos
inventados, que se sirve como ficheros estáticos y no tiene servidor de aplicación
detrás ni guarda nada de nadie.

Se instala el **mismo APK** en dos móviles:

- El del **encargado**, que es el que lleva los datos reales del local.
- El del **desarrollador**, como copia de trabajo para reproducir fallos, pasar la
  verificación manual de `verificacion-manual.md` y enseñar la app.

Las dos instalaciones son idénticas y **no comparten datos**: cada una tiene su propia base
de datos y ninguna sabe que la otra existe. La copia del desarrollador arranca vacía.

## Decisiones ya tomadas

Están aplicadas en `app.json` y `eas.json`. Se recogen aquí porque algunas no se pueden
deshacer.

| Decisión | Valor | Reversible |
| --- | --- | --- |
| Identificador de paquete | `com.los24cafe.cuadrante` | **No.** Cambiarlo publica una app distinta |
| Nombre bajo el icono | `Cuadrante` | Sí |
| `versionCode` | `3` | Sí, sube en cada build que se distribuya |
| Copia de seguridad de Android | `allowBackup: false` | Sí, una línea |
| Perfil de build | `produccion`, APK universal | Sí |
| Slug del proyecto | `gestor_empleados` (sin cambios) | Sí, mientras no exista el proyecto en EAS |

### Por qué `allowBackup: false`

Por omisión Android sube los datos de una app al Google Drive de su dueño
(`@expo/config-plugins/build/android/AllowBackup.js` — `?? true`). Eso metería en la nube el
fichero con los nombres, teléfonos, emails y motivos de ausencia de la plantilla, y los
motivos de ausencia pueden ser datos de salud.

Se desactiva por dos razones. La primera es de coherencia: el proyecto tiene un test,
`src/datos/__tests__/privacidad.test.ts`, que **falla** si algún módulo de la capa de datos
aprende a hablar por la red o a escribir fuera de la app. Dejar que el sistema operativo se
lleve la base de datos por detrás contradice esa decisión sin que ningún test se entere.

La segunda es práctica: la copia automática de Android **no sirve como copia de seguridad**.
Solo corre con el móvil cargando, en reposo y con wifi, como mucho una vez al día, y se puede
desactivar desde los ajustes sin avisar a nadie. Confiar en ella daría lo peor de las dos
opciones: los datos salen del móvil y aun así no se puede contar con recuperarlos.

Consecuencia que hay que asumir: **si el móvil se pierde o se rompe, los datos no se
recuperan**. Ver "Lo que este despliegue no resuelve".

### Por qué no hay pantalla de carga

`expo-splash-screen` no está instalado y no se ha añadido a propósito. La spec de
`cuadrante-semanal` dice, en el escenario *Abrir la app un día cualquiera de la semana*, que
al abrir «no se ve ninguna pantalla de bienvenida, resumen o menú por el camino, **ni siquiera
un instante**». Añadir una pantalla de carga propia iría justo en contra. Android mostrará su
arranque estándar, que es inevitable y no es parte de la app.

## Proceso

Todo se hace desde la raíz del proyecto. Hace falta una cuenta en https://expo.dev (gratuita).

### 1. Comprobar que el proyecto está sano

```bash
npm test
npm run typecheck
```

Las dos cosas deben pasar antes de construir nada.

### 2. Iniciar sesión en EAS

```bash
npx eas-cli login
```

No hace falta instalar nada en global: `npx` descarga la herramienta al vuelo.

### 3. Vincular el proyecto

```bash
npx eas-cli init
```

Crea el proyecto en tu cuenta de Expo y escribe el `projectId` en `app.json`. Se hace **una
sola vez**.

### 4. Construir el APK

```bash
npx eas-cli build --platform android --profile produccion
```

La primera vez pregunta por la **clave de firma** (keystore). Responde que la genere y
gestione EAS: es lo más simple y queda guardada en tu cuenta.

> **La clave de firma es irrecuperable.** Si pierdes el acceso a la cuenta de Expo, no podrás
> volver a actualizar esta app nunca: una app firmada con otra clave es, para Android, una app
> distinta que no se puede instalar encima. Mientras no haya actualizaciones previstas esto no
> molesta, pero cierra la puerta si algún día las hay.

El build tarda entre 10 y 20 minutos según la cola del plan gratuito. Al terminar da un
enlace de descarga y un QR.

### 5. Guardar el APK

**Descarga el `.apk` y guárdalo en un disco y en la nube.** Los artefactos de build de EAS se
borran al cabo de unas semanas en el plan gratuito. El día que haya que reinstalar —móvil
nuevo, móvil roto, app desinstalada por error— querrás el fichero a mano, no reconstruir el
proyecto con el toolchain de dentro de tres años.

Guarda junto al APK una nota con la versión (`1.0.0`), el `versionCode` (`3`) y la fecha.

**Historia de los `versionCode`.** Un `versionCode` no se reutiliza jamás, ni siquiera si su
build se tira, así que conviene saber en qué se gastó cada uno:

- El `1` se gastó en un primer build que se descartó: `expo doctor` avisó de que `expo` y
  `expo-router` iban una patch por detrás de lo que espera el SDK 57, y se prefirió corregirlo
  antes de entregar nada. En una app que no se va a actualizar, una corrección de fallos que no
  se coge hoy no se coge nunca.
- El `2` es el build del 09/09/2026, el primero que se llegó a instalar. Se probó en el móvil
  del desarrollador y **no se entregó al encargado**: fue el que destapó que el cuadrante no se
  guardaba (ver "Lo que este despliegue no resuelve").
- El `3` es el primero que lleva el cuadrante guardado, y por tanto el primero entregable.

### 6. Instalar en los dos móviles

En cada móvil:

1. Abrir el enlace de descarga (o pasar el `.apk` por cable, correo o nube).
2. Android pedirá permiso para **instalar aplicaciones de esta fuente**. Concederlo.
3. Puede aparecer un aviso de Play Protect por ser una app fuera de la tienda. Continuar.
4. Comprobar que bajo el icono se lee **Cuadrante**.

No hay límite de instalaciones ni activación: es el mismo fichero en los dos sitios.

### 7. Cerrar la verificación manual

En `verificacion-manual.md` hay escenarios anotados como pendientes «del primer build
instalable». Ahora se pueden comprobar, y **se hacen en la copia del desarrollador**, con
empleados de prueba, sin tocar los datos reales del encargado:

- *Abrir la app un día cualquiera de la semana* — cerrarla del todo y abrirla desde su icono.
- *El cuadrante guardado funciona de verdad en el dispositivo* — planificar una semana, cerrar
  la app desde el selector de aplicaciones y comprobar que al reabrir sigue todo ahí. Es el
  escenario que justifica este build: hasta ahora el cuadrante se perdía.
- *El almacenamiento funciona de verdad en el dispositivo* — la plantilla y las fichas.
- *La semana completa se ve sin scroll horizontal* — en vertical, sobre 360 puntos de ancho.
- *Cabeceras de día con su fecha*, y el resto de escenarios de legibilidad.

Anotar en ese documento la fecha, el dispositivo y el resultado de cada uno.

## Lo que este despliegue no resuelve

Dos huecos conocidos. Ninguno es un fallo del despliegue: son cosas del producto que conviene
tener por escrito.

> **Resuelto el 09/09/2026: el cuadrante ya se guarda.** Al probar el primer build en el
> dispositivo se vio que solo persistía la plantilla: los turnos, las ausencias y las
> vacaciones vivían en memoria y se perdían al cerrar la app. Mientras eso siguió así **no se
> entregó el APK al encargado**, porque planificar la semana es su trabajo principal y era
> justo lo que no sobrevivía.
>
> El change `add-roster-storage` lo cerró: las celdas del cuadrante bajaron a SQLite en la
> migración 4, con las tablas `celdas` y `turnos`. Ese bloqueo queda retirado y el APK ya se
> puede entregar.

**No hay copia de seguridad de los datos.** La plantilla vive en un único móvil, y con
`allowBackup: false` no sale de ahí. Lo único que sale es el PDF de una semana, que sirve para
leerlo pero no para restaurar nada. Un móvil perdido se lleva la plantilla entera. Cerrarlo
requiere un change de exportación/importación de la base de datos.

**La app no tiene bloqueo propio.** No pide PIN ni huella: quien tenga el móvil desbloqueado
en la mano ve todos los nombres, teléfonos, emails y notas, incluidos los motivos de ausencia.
Es la decisión D9 de `add-employee-storage` —«la protección es la del almacenamiento privado
de la aplicación más el desbloqueo del móvil»— y hoy el bloqueo de pantalla del móvil es el
único control que existe. Cerrarlo requiere añadir `expo-local-authentication`.

## Si algún día hay que actualizar

1. Subir `version` y **`versionCode`** en `app.json`. Si el `versionCode` no sube, Android
   rechaza la instalación encima de la anterior.
2. Repetir los pasos 1, 4, 5 y 6.
3. La actualización conserva los datos: instalar encima no borra la base de datos.

`expo-updates` no está instalado, así que no hay actualizaciones por aire: cada cambio es un
APK nuevo entregado a mano.

## La demo web

Sirve para que un cliente potencial pruebe la app desde su móvil, con un enlace, sin
instalar nada y sin que el APK salga de nuestras manos. Es una vía de demostración
comercial: el producto sigue siendo el binario.

### Qué lleva dentro, y qué no

- Arranca con una plantilla de ejemplo de catorce personas y la **semana en curso** ya
  planificada, con turnos, una ausencia y unas vacaciones. Las fechas se calculan el día
  que se abre, así que la demo no envejece.
- Todos los datos son **inventados** (`src/demo/ejemploDeLaDemo.ts`): ni un nombre,
  teléfono o email de la plantilla real puede acabar en un sitio público. Los teléfonos
  son del rango de ficción que usan los tests y los emails van a `ejemplo.es`.
- Lo que el cliente toque se guarda **en su propio navegador** (IndexedDB) y no sale de
  ahí. Cada navegador tiene su demo; dos personas no comparten nada.
- Lleva una banda que avisa de que es una demostración y un botón para devolverla a su
  estado inicial.
- **No lleva analítica**, ni contraseña, ni forma de saber quién ha entrado.

### Publicar

```
npm run demo:build
```

Deja el sitio en `dist/`. El script copia antes el motor de SQLite
(`public/sql-wasm.wasm`, 643 KB) desde `node_modules`, para que no se quede atrás
respecto a la versión de `sql.js` del `package.json`.

Ese `dist/` se sube a un alojamiento estático. En Netlify basta con arrastrar la carpeta
o usar su CLI; en Vercel o Cloudflare Pages el paso equivalente. Lo único que hace falta
del alojamiento es servir ficheros, dar un enlace y poder borrarlo.

**Dónde está publicada hoy**: en **Netlify**, desde el 09/09/2026. Comprobada en un móvil
Android con dos navegadores distintos, sobre el sitio ya publicado. Es el alojamiento para
el que sirve el `_headers` de este repositorio: si algún día se mueve a Vercel, esa
cabecera deja de aplicarse y el `noindex` habría que declararlo de otra forma.

**Publicarla sin indexar**: la demo se reparte a mano y no tiene por qué aparecer en un
buscador. El sitio incluye `robots.txt` excluyéndolo entero, y conviene añadir en el
alojamiento la cabecera `X-Robots-Tag: noindex` (en Netlify, un fichero `_headers`).

Antes de dar el enlace a nadie, abrirlo en un móvil de verdad y con datos móviles: la
primera apertura descarga el motor de SQLite, y es la única vez que se nota.

### Retirar la demo

**Borrar el sitio en el alojamiento.** El enlace deja de resolver y no queda nada que
deshacer. Lo que se hubiera quedado en el navegador de quien la probó son datos
inventados.

Retirarla no afecta a ninguna app instalada. Conviene hacerlo cuando la conversación con
ese cliente termine: una demo publicada y olvidada es una copia del producto ahí fuera
sin motivo.

### Lo que la demo no puede enseñar

- **La hoja de compartir y el selector de carpetas del móvil**: en el navegador no
  existen. Exportar abre el diálogo de impresión, desde donde se guarda como PDF. Es el
  mismo documento, con las mismas reglas de privacidad, pero el camino se ve distinto.
- **El arranque desde el icono**, porque no hay icono.
- **Lo que todavía no está construido**, como el registro de horas realmente trabajadas.
  La demo enseña lo que hay; lo que no existe, no se simula.
