## 1. El nombre del local, guardado en el dispositivo

- [x] 1.1 Añadir la migración `CREAR_AJUSTES` al final de `MIGRACIONES` en `src/datos/sqlite/migraciones.ts`, con la tabla `ajustes (clave, valor)`. Verificar con un test que una base en versión 1 **con empleados dentro** pasa a versión 2 conservando la plantilla intacta.
- [x] 1.2 Implementar `src/datos/sqlite/almacenAjustesSqlite.ts` con la lectura y la escritura del nombre del local sobre esa tabla, saneando el nombre con `sanearCampo`. Verificar con tests contra SQLite de verdad: sin fila el nombre es vacío, y lo escrito se relee igual, incluidos tildes y eñes.
- [x] 1.3 Añadir `leerNombreDelLocal` y `escribirNombreDelLocal` a la interfaz `AlmacenCuadrante` y a las dos implementaciones —la SQLite y la de memoria de los tests—. Verificar con `npm run typecheck` que no queda ninguna implementación sin las dos operaciones.
- [x] 1.4 Añadir los tests de la capability que se comprueban sin pantalla, citando su nombre literal: «Primera apertura en un dispositivo nuevo», «El nombre escrito sobrevive al cierre de la app», «Cambiar el nombre del local no toca la plantilla» y «El nombre se guarda sin espacios sobrantes». Verificar que los cuatro fallan si se quita el saneado o la migración.

## 2. El logo

- [x] 2.1 Recortar `assets/logo.jpg` al círculo blanco y guardarlo como `assets/logo-del-local.png` con el exterior transparente, conservando el original. Verificar abriendo el PNG que no queda nada del fondo borroso y que el óvalo está centrado.
- [x] 2.2 Comprobar que el PNG resultante pesa lo razonable para un icono de cabecera (menos de 100 KB) y que se ve nítido a 32 puntos en pantalla de densidad alta. Verificar el tamaño del fichero y mirarlo en el dispositivo.

## 3. La cabecera del cuadrante

- [x] 3.1 Poner `headerShown: false` en la ruta raíz de `app/_layout.tsx`, dejando la cabecera nativa en las otras dos rutas. Verificar con `npm test` que la suite de rutas sigue en verde y que ninguna prueba dependía del título «Cuadrante semanal».
- [x] 3.2 Añadir a `src/ui/CabeceraSemana.tsx` la fila de identidad —logo, nombre del local y acceso a los ajustes— por encima del rango de fechas, aplicando el margen superior del área segura. Verificar con un test que el nombre del local se muestra por encima del rango y en una sola línea, truncado si no cabe.
- [x] 3.3 Mostrar, cuando el nombre del local está vacío, la invitación a escribirlo que lleva a los ajustes, sin dejar hueco en blanco ni inventar un nombre. Verificar con un test que cita «Abrir la app sin haber escrito todavía el nombre».
- [x] 3.4 No ofrecer el acceso a los ajustes en el estado vacío sin empleados. Verificar con un test que cita «El estado vacío no ofrece los ajustes».
- [x] 3.5 Comprobar que la rejilla no ha perdido alto con el cambio: con 20 empleados a 360 puntos, las siete columnas siguen sin scroll horizontal y las filas conservan su alto. Verificar con los tests de `rejilla` y `defectosDeLaPantalla` ya existentes, sin tocar sus expectativas.

## 4. La pantalla de ajustes

- [x] 4.1 Crear `src/ui/PantallaAjustes.tsx` con el campo del nombre del local, que se guarda según se escribe y avisa de que ha quedado guardado, y la acción de volver. Verificar con un test que cita «Escribir el nombre del local desde los ajustes».
- [x] 4.2 Crear la ruta `app/ajustes.tsx` y darle su entrada en el `Stack`, con el título de la pantalla. Verificar con un test de ruta que la pantalla se monta y que volver devuelve al cuadrante.
- [x] 4.3 Comprobar que los ajustes no ofrecen nada más que el nombre y volver. Verificar con un test que cita «Los ajustes no ofrecen nada más que el nombre».
- [x] 4.4 Comprobar que al volver de los ajustes el cuadrante sigue en la semana en la que estaba, con el nombre nuevo. Verificar con un test que cita «Ir a los ajustes y volver al cuadrante».

## 5. El aviso de guardado en la ficha

- [x] 5.1 Hacer que cada campo de `src/ui/PantallaFichaEmpleado.tsx` recuerde si ha sido tocado y muestre debajo la indicación de guardado, sin temporizadores. Verificar con un test que cita «El campo dice que ha quedado guardado».
- [x] 5.2 No mostrar ninguna indicación al abrir la ficha, ni en los campos que el encargado no ha tocado. Verificar con un test que cita «Al reabrir la ficha no hay avisos de guardado».
- [x] 5.3 No marcar como guardado un nombre que no se ha podido guardar por estar vacío o repetido. Verificar con un test que cita «Un nombre que no se puede guardar no dice que se ha guardado».
- [x] 5.4 Aplicar la misma indicación al nombre del local en la pantalla de ajustes, con el mismo aspecto que en la ficha. Verificar con un test que las dos pantallas declaran el mismo estilo para ese aviso.

## 6. Cierre

- [x] 6.1 Añadir los tests que citan los escenarios de guardado que la spec modificada añade a `panel-empleados`: «Un campo escrito queda guardado sin salir de él» y «La nota se guarda aunque se salga de la ficha desde ella». Verificar que fallan si el campo vuelve a guardar solo en `onEndEditing`.
- [x] 6.2 Ejecutar `npm run typecheck` y `npm test` completos y dejar los dos en verde. Verificar que ninguna expectativa de los tests que ya existían ha tenido que cambiar salvo las que la spec modificada obliga a cambiar.
- [x] 6.3 Anotar en `docs/verificacion-manual.md` los escenarios de esta propuesta que solo se resuelven mirando la pantalla, citando su nombre literal: «Abrir la app con el nombre del local ya escrito», «Un nombre de local muy largo no descoloca la rejilla» y «El nombre del local y la semana no se confunden». Verificar que ningún escenario de las specs vivas queda sin citar ni en un test ni ahí.
- [x] 6.4 Comprobar en el dispositivo, con la app recargada en Expo Go: que la cabecera se ve con el logo y el nombre sin comerse la rejilla, que los ajustes guardan y avisan, y que la ficha muestra sus avisos. Anotar el resultado y la fecha en `docs/verificacion-manual.md`.
