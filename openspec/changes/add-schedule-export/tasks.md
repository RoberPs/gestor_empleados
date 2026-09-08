## 1. Las dependencias

- [ ] 1.1 Instalar `expo-print` y `expo-sharing` con la versión que corresponde a Expo SDK 57, sin actualizar ninguna otra dependencia. Verificar con `npx expo install --check` que no queda ningún paquete fuera de la versión esperada por el SDK.
- [ ] 1.2 Recargar la app en el móvil del encargado con las dos dependencias ya dentro, antes de escribir nada de la exportación, y comprobar que arranca y que el cuadrante sigue funcionando igual. Anotar el resultado en `docs/verificacion-manual.md`.

## 2. La composición del documento

- [ ] 2.1 Crear el módulo que compone el HTML del documento a partir de la semana, la plantilla y el contenido de las celdas, sin importar nada de `expo-print` ni de `expo-sharing`: es código puro. Verificar con un test que, dada una plantilla de tres empleados, devuelve una cadena con una fila por empleado y siete columnas.
- [ ] 2.2 Componer cada celda según su estado, reutilizando `formatos.ts` para las horas y las fechas: horas en `hh:mm` para los turnos —los dos cuando el día tiene dos—, la palabra completa para ausencia y para vacaciones, y nada para la celda vacía. Verificar con los tests que citan «El documento recoge la semana completa» y «Un día con dos turnos planificados».
- [ ] 2.3 Poner en el documento el nombre del local y el rango de fechas de la semana en dd/mm/aaaa. Verificar con el test que cita «El documento dice de qué local y de qué semana es».
- [ ] 2.4 Ordenar las filas con el mismo orden alfabético español que usa el cuadrante, reutilizando `orden.ts` en vez de ordenar aparte. Verificar con un test que el orden del documento coincide con el de `listarEmpleados` para una plantilla con tildes y eñes.
- [ ] 2.5 **Añadir el test de privacidad**: con teléfono, email, nota y motivo de la ausencia rellenos en **todos** los empleados, ninguna de esas cadenas aparece en el HTML completo. Verificar con los tests que citan «Las fichas rellenas no ensucian el documento» y «Una ausencia no arrastra su motivo al documento», y comprobar que fallan si se añade cualquiera de esos campos a la plantilla del documento.
- [ ] 2.6 Devolver que no hay nada que exportar cuando la plantilla está vacía, sin componer documento alguno. Verificar con el test que cita «Exportar con la plantilla vacía».

## 3. El documento en papel

- [ ] 3.1 Maquetar el HTML como tabla en A4 apaisado con los estilos en línea, con la línea de la tabla marcada y sin fondos de color: los estados se distinguen por su texto. Verificar abriendo el PDF que las siete columnas y las 20 filas caben y que se lee impreso en blanco y negro.
- [ ] 3.2 Dejar que los nombres de los empleados vayan completos en el documento, sin truncar, aprovechando que la hoja apaisada tiene más sitio que la pantalla. Verificar con un test que el nombre entero aparece en el HTML, y abriendo el PDF que no se corta.
- [ ] 3.3 Comprobar que el documento no usa las abreviaturas `AUS` y `VAC` sino las palabras completas. Verificar con un test que el HTML contiene `Ausencia` y `Vacaciones` y no las dos abreviaturas.

## 4. Producir y compartir

- [ ] 4.1 Crear el módulo mínimo que pasa el HTML a `expo-print`, nombra el fichero con el rango de la semana y lo entrega a `expo-sharing`. Verificar que no contiene ninguna decisión sobre el contenido del documento: todo eso vive en el módulo de composición.
- [ ] 4.2 Comprobar la disponibilidad de la hoja de compartir antes de usarla, y tratar su ausencia como exportación que no se puede completar. Verificar con un test que cita «La exportación falla».
- [ ] 4.3 Devolver al encargado al cuadrante, en la misma semana, tanto al terminar como al desistir, sin error en el segundo caso. Verificar con los tests que citan «Desistir de compartir» y «Exportar la semana que se está viendo».
- [ ] 4.4 Explicar los fallos en lenguaje corriente, sin detalle técnico. Verificar con un test que el mensaje mostrado no contiene ningún nombre de módulo, código de error ni ruta de fichero.
- [ ] 4.5 Comprobar que exportar no escribe nada en el almacenamiento de la app. Verificar con el test que cita «Exportar no cambia nada de lo guardado».

## 5. La acción en el cuadrante

- [ ] 5.1 Añadir la acción de compartir a `src/ui/CabeceraSemana.tsx`, permanente y disponible en cualquier semana. Verificar con los tests que citan «Compartir la semana que se está viendo» y «Compartir una semana ya pasada».
- [ ] 5.2 No ofrecer la acción en el estado vacío sin empleados. Verificar con el test que cita «El estado vacío no ofrece compartir».
- [ ] 5.3 Comprobar que la cabecera no le ha quitado alto a la rejilla: con 20 empleados a 360 puntos, las siete columnas siguen sin scroll horizontal y se ven las mismas filas. Verificar con el test que cita «La acción de compartir no descoloca la rejilla». Si no cabe en la fila de navegación, pasarla a la fila de identidad como icono y volver a comprobarlo.
- [ ] 5.4 Comprobar que las acciones de navegación entre semanas no han cambiado. Verificar con los tests de `semana` ya existentes, sin tocar sus expectativas.

## 6. Cierre

- [ ] 6.1 Ejecutar `npm run typecheck` y `npm test` completos y dejar los dos en verde. Verificar que ninguna expectativa de los tests que ya existían ha tenido que cambiar.
- [ ] 6.2 Anotar en `docs/verificacion-manual.md` los escenarios de `exportacion-cuadrante` que solo se resuelven abriendo el PDF, citando su nombre literal: «Exportar una semana con 20 empleados», «Un nombre largo se lee entero en el documento» y «Compartir la semana exportada». Verificar que ningún escenario de la spec queda sin citar ni en un test ni ahí.
- [ ] 6.3 Comprobar en el móvil del encargado el recorrido entero: exportar una semana con la plantilla completa, abrir el PDF, mandarlo por mensajería y comprobar que quien lo recibe lo abre y lo lee. Anotar el resultado y la fecha en `docs/verificacion-manual.md`.
- [ ] 6.4 Comprobar en el PDF recibido que no aparece ningún teléfono, email, nota ni motivo de ausencia. Es la comprobación que cierra el change: si falla, no se comparte nada más hasta arreglarlo.
