## Context

Ver `proposal.md` — Why. Lo que condiciona el cómo:

- **Todo el acceso a datos pasa por `AlmacenCuadrante`**, y su propio docblock lo declara: ninguna pantalla conoce SQLite ni guarda estado propio. El nombre del local tiene que entrar por ahí, no por una segunda vía.
- **El esquema se versiona con `PRAGMA user_version`** y `migraciones.ts` impone dos reglas que no se saltan: una migración publicada no se edita nunca, y toda tabla que se refiera a un empleado usa clave ajena con borrado en cascada. La tabla de ajustes no se refiere a ningún empleado, así que solo aplica la primera.
- **La cabecera del cuadrante ya iba justa de alto.** Hoy son tres filas —rango, navegación, y volver/empleados— y encima el título nativo de `expo-router` («Cuadrante semanal»). En el móvil del encargado, con la letra del sistema agrandada, eso deja la rejilla contra la barra de navegación.
- **La ficha guarda según se escribe** desde la corrección del 08/09/2026: `CampoDeLaFicha` escribe en el almacén en cada `onChangeText`. El aviso de guardado se apoya en eso.
- El logo entregado (`assets/logo.jpg`, 1080 × 1114) trae el óvalo sobre un **fondo borroso gris y marrón** que no sirve para una cabecera.

## Goals / Non-Goals

**Goals:**

- Que el nombre del local se guarde y se lea por el mismo camino que la plantilla, con su migración y sin tocar lo ya guardado.
- Que la cabecera gane la identidad del local **sin quitarle alto a la rejilla**, que es lo que el encargado va a mirar.
- Que el aviso de guardado no necesite temporizadores: nada que aparezca y se desvanezca, nada que dependa de cuándo mire el encargado.

**Non-Goals:**

- No se añade elegir el logo desde la galería, ni ninguna otra preferencia (idioma, tema, copias de seguridad).
- No se toca la persistencia de turnos, ausencias ni vacaciones: siguen en memoria, como hasta ahora.
- No se toca el alto de fila ni el reparto de anchos de la rejilla, recién corregidos y verificados en el dispositivo.

## Decisions

### El ajuste se guarda en una tabla de clave y valor

Migración 2, `CREAR_AJUSTES`:

```sql
CREATE TABLE ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
)
```

El nombre del local vive en la clave `nombre_del_local`. Que no haya fila significa que nunca se ha escrito, que es exactamente lo que la spec pide para la primera apertura: nombre vacío, sin nombre de ejemplo.

**Alternativa descartada**: una tabla `local` de una sola fila con una columna por dato. Es más estricta —el tipo de cada dato está en el esquema—, pero cada ajuste futuro sería una migración con `ALTER TABLE`, y el propio fichero de migraciones avisa de lo caro que sale equivocarse ahí. Con clave y valor, un ajuste nuevo es una clave nueva y ninguna migración.

**Alternativa descartada**: `AsyncStorage`. Sería otra forma de almacenamiento en un proyecto que ya tiene una, con su propio ciclo de vida y su propia forma de fallar. La app guarda sus datos en un único fichero SQLite y así sigue.

### El nombre del local entra por `AlmacenCuadrante`

Se añaden dos operaciones a la interfaz: `leerNombreDelLocal(): string` y `escribirNombreDelLocal(nombre: string): void`, con su implementación SQLite (`sqlite/almacenAjustesSqlite.ts`) y su equivalente en memoria para los tests, igual que la plantilla.

El saneado del nombre —recortar espacios— reutiliza `sanearCampo` de `src/dominio/empleado.ts`, que ya hace eso mismo para el teléfono y el email.

**Alternativa descartada**: un almacén de ajustes aparte, inyectado por su cuenta en las pantallas. Serían dos contextos y dos formas de leer datos en una app que hoy tiene una sola. La interfaz crece un poco; el número de caminos, no.

### La cabecera de identidad sustituye al título nativo

La ruta raíz pasa a `headerShown: false`. La barra nativa que hoy dice «Cuadrante semanal» ocupa una franja entera para repetir dónde estás, y ninguna spec ni ningún test la exigen. En su lugar, la primera fila de la pantalla es la identidad del local:

```
┌──────────────────────────────────────────────┐
│ (logo)  La Esquina café                 Ajustes  │  ← identidad, sustituye al título nativo
│           07/09/2026 - 13/09/2026            │
│             Semana en curso                  │
│  Semana anterior        Semana siguiente     │
│  Volver a la semana…            Empleados    │
└──────────────────────────────────────────────┘
```

El logo mide 32 puntos de lado y no escala con la letra del sistema: es una imagen, y hacerla crecer con el texto se comería la pantalla justo en los dispositivos donde menos sitio hay. El nombre del local va en el papel de título de la identidad visual, en una línea, truncado con puntos suspensivos si no cabe.

Al quitar el header nativo, la cabecera pasa a ser lo más alto de la pantalla: aplica `insets.top` del área segura, igual que las otras pantallas ya aplican `insets.bottom`.

**Balance de alto**: se quita una barra nativa (unos 56 puntos) y se añade una fila de 40. La rejilla gana sitio en vez de perderlo, que es lo que exige la spec de `ajustes-del-local` — «La identidad del local no le roba sitio a la rejilla».

Las demás rutas conservan su cabecera nativa: en ellas el botón de volver del sistema es útil y no hay identidad que mostrar.

### El aviso de guardado es un estado, no un mensaje que pasa

Cada campo de la ficha recuerda si el encargado lo ha tocado desde que se abrió; si lo ha tocado, muestra debajo «Guardado». No hay `setTimeout`, no hay animación y no hay nada que se desvanezca: mientras la ficha siga abierta, el aviso sigue ahí, y al reabrirla no hay ninguno porque nadie ha tocado nada todavía.

El nombre es la excepción que la spec ya recoge: solo se marca como guardado cuando `editarNombre` devuelve que sí, de modo que un nombre repetido enseña su explicación y no el aviso.

**Alternativa descartada**: un aviso efímero tipo *toast* de dos segundos. Con el guardado en cada tecla parpadearía en cada pulsación, y quien mire la pantalla un momento después no vería nada. Además obligaría a manejar temporizadores en los tests.

### El logo se recorta al círculo antes de entrar en el proyecto

`assets/logo.jpg` se recorta al círculo blanco que contiene el óvalo y se guarda como `assets/logo-del-local.png` con fondo transparente fuera del círculo. Se hace una vez, con Pillow, y lo que entra en el repositorio es el resultado; el original se conserva.

En la app se dibuja con `resizeMode="contain"` sobre el fondo de la cabecera. Sin ese recorte, la cabecera enseñaría el degradado gris y marrón de la foto original.

**Alternativa descartada**: recortar en tiempo de ejecución con un contenedor circular y la imagen sobredimensionada. Funciona, pero deja el encuadre a merced de números mágicos en el estilo y carga 240 KB de foto para enseñar un óvalo.

## Risks / Trade-offs

- **Quitar el header nativo de la ruta raíz cambia la navegación de esa pantalla** → Es la ruta raíz: no tiene botón de volver que perder. Las otras dos rutas lo conservan. Se comprueba en el dispositivo que desde el panel se sigue volviendo al cuadrante con el gesto del sistema.
- **La migración 2 corre sobre bases de datos que ya tienen empleados dentro** → Solo crea una tabla nueva, no toca `empleados`, y va en su transacción como todas. La suite ya ejercita migrar desde la versión 1 contra SQLite de verdad; se añade el caso «versión 1 con empleados dentro → versión 2 conserva los empleados».
- **El aviso «Guardado» puede leerse como que hace falta hacer algo más** → El texto es una afirmación en pasado, no una acción, y no es pulsable. Se comprueba mirando la pantalla en el dispositivo.
- **El nombre del local es un dato del negocio en un móvil sin contraseña de app** → No es dato personal de nadie y no sale del dispositivo, como el resto. Nada que añadir a la privacidad ya especificada.

## Migration Plan

Al abrir la app con una base de datos en versión 1, la migración 2 crea la tabla vacía. El nombre del local queda sin escribir, la cabecera enseña el logo con la invitación a escribirlo, y la plantilla y las fichas siguen exactamente como estaban.

Vuelta atrás: revertir el commit deja la app en la versión 1 del esquema mientras el dispositivo tiene la 2, y `migrar` lanza a propósito en ese caso —«el almacenamiento es de una versión posterior»—, que es el comportamiento ya especificado en `almacenamiento-empleados`. Es decir: la vuelta atrás exige desinstalar o vaciar los datos del dispositivo de prueba, no basta con revertir el código.
