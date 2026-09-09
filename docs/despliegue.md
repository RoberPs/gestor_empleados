# Despliegue

Esta app no se despliega en ningún servidor. Todo lo que hace ocurre dentro del móvil:
la plantilla y el cuadrante viven en SQLite en el almacenamiento privado de la aplicación,
y no hay API, ni cuentas, ni base de datos remota. Desplegar aquí significa **una sola cosa**:
producir un APK e instalarlo en el móvil del encargado.

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
| `versionCode` | `2` | Sí, sube en cada build que se distribuya |
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

Guarda junto al APK una nota con la versión (`1.0.0`), el `versionCode` (`2`) y la fecha.

El `versionCode` empieza en `2` y no en `1` porque el `1` se gastó en un primer build que se
descartó: `expo doctor` avisó de que `expo` y `expo-router` iban una patch por detrás de lo que
espera el SDK 57, y se prefirió corregirlo antes de entregar nada. En una app que no se va a
actualizar, una corrección de fallos que no se coge hoy no se coge nunca. Un `versionCode` no
se reutiliza jamás, ni siquiera si su build se tira.

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
- *La semana completa se ve sin scroll horizontal* — en vertical, sobre 360 puntos de ancho.
- *Cabeceras de día con su fecha*, y el resto de escenarios de legibilidad.

Anotar en ese documento la fecha, el dispositivo y el resultado de cada uno.

## Lo que este despliegue no resuelve

Dos huecos conocidos. Ninguno es un fallo del despliegue: son decisiones del producto que
conviene tener por escrito.

**No hay copia de seguridad de los datos.** Todo el cuadrante y toda la plantilla viven en un
único móvil, y con `allowBackup: false` no salen de ahí. Lo único que sale es el PDF de una
semana, que sirve para leerlo pero no para restaurar nada. Un móvil perdido se lleva la
plantilla entera. Cerrarlo requiere un change de exportación/importación de la base de datos.

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
