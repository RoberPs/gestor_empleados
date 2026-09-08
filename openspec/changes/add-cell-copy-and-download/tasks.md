## 1. Lo que se copia

- [x] 1.1 Definir en `src/dominio` el tipo de lo copiado —turnos como pares de horas, ausencia o vacaciones— **sin los identificadores de turno**, y la función pura que lo obtiene de una `ContenidoCelda`. Verificar con un test que copiar una celda de dos turnos devuelve las cuatro horas y que en el valor devuelto no aparece ningún `id` de turno.
- [x] 1.2 Devolver «nada que copiar» para la celda vacía, de modo que copiar no pueda invocarse sobre ella. Verificar con un test que la función devuelve el caso vacío para `{ tipo: 'vacia' }`.
- [x] 1.3 Crear el módulo que guarda lo copiado en memoria y avisa a quien se suscriba, fuera del árbol de React y sin tocar SQLite, con el mismo patrón que `usarAlmacen`. Verificar con un test que copiar dos veces deja solo lo último y que el módulo no importa nada de `src/datos`.

## 2. Pegar en la capa de datos

- [x] 2.1 Añadir a `AlmacenCuadrante` la operación de pegar, que recibe empleado, día y lo copiado, y deja la celda con ese contenido: vacía lo que hubiera y aplica lo nuevo. Verificar con un test que pegar sobre una celda con dos turnos deja exactamente el contenido copiado.
- [x] 2.2 Comprobar que la operación avisa a los suscriptores **una sola vez**, con la celda ya entera. Verificar con un test que cuenta los avisos al pegar unas vacaciones sobre una celda con dos turnos.
- [x] 2.3 Comprobar que pegar crea turnos nuevos y no reutiliza los del origen. Verificar con un test que los identificadores de la celda destino son distintos de los de la celda de origen y que la celda de origen conserva los suyos.
- [x] 2.4 Implementarla en el almacén sobre SQLite además de en el de memoria, sin migrar la base de datos. Verificar con los tests de `almacenEmpleadosSqlite`/`almacenCuadrante` que las dos implementaciones se comportan igual, y que `migraciones.ts` no cambia.

## 3. Copiar y pegar desde la celda

- [x] 3.1 Añadir las acciones de copiar y de pegar a `src/ui/accionesDeCelda.ts`, con sus etiquetas en palabras completas: copiar en los tres estados con contenido y nunca en la vacía, pegar en los cuatro y solo cuando hay algo copiado. Verificar con los tests que citan «Una celda vacía no se puede copiar» y «Sin nada copiado no se ofrece pegar».
- [x] 3.2 Colocarlas al final de la hoja de acciones, separadas de las que crean, editan o eliminan. Verificar con el test que cita «Las acciones se leen enteras en el estado más cargado»: en la anchura mínima y con dos turnos, las ocho acciones se leen sin truncar y conservan 44 puntos de alto.
- [x] 3.3 Conectar copiar en `PantallaCuadrante` sin tocar nada más: la celda de origen queda igual y el encargado sigue en su semana. Verificar con el test que cita «Copiar un turno planificado y repetirlo otro día».
- [x] 3.4 Conectar pegar sobre celda vacía, sin confirmación y con la celda destino ya actualizada. Verificar con los tests que citan «Pegar en una celda vacía no pregunta nada» y «Pegar el mismo turno en varias celdas sin volver a copiar».
- [x] 3.5 Comprobar el pegado de los otros dos estados de origen. Verificar con los tests que citan «Copiar una celda con dos turnos» y «Copiar unas vacaciones y extenderlas a los demás días».
- [x] 3.6 Comprobar que pegar funciona entre empleados y entre semanas, devolviendo siempre al encargado a la semana desde la que pegó. Verificar con el test que cita «Pegar en otra semana».
- [x] 3.7 Comprobar que copiar no arrastra nada de la ficha. Verificar con el test que cita «Copiar no se lleva los datos de la ficha», con teléfono, email, nota y motivo rellenos, y comprobar que falla si el contenido copiado gana cualquier campo de la ficha.
- [x] 3.8 Comprobar la duración de lo copiado: se pega tantas veces como haga falta, copiar otra celda lo sustituye y cerrar la app lo pierde sin tocar el cuadrante. Verificar con los tests que citan «Copiar otra celda sustituye lo copiado» y «Lo copiado no sobrevive a cerrar la app».

## 4. La confirmación de pegar encima

- [x] 4.1 Renombrar `ConfirmacionEliminar` por lo que hace —confirmar un acto irreversible sobre una celda— sin cambiar su comportamiento ni sus `testID`. Verificar que `npm test` pasa sin tocar ninguna expectativa de los tests de eliminación.
- [x] 4.2 Pedir confirmación al pegar sobre una celda con contenido, con un mensaje que nombre lo que va a sustituirse. Verificar con el test que cita «Pegar sobre un turno planificado existente».
- [x] 4.3 Dejar la celda intacta y lo copiado disponible cuando el encargado no confirma. Verificar con el test que cita «Desistir de pegar encima».
- [x] 4.4 Comprobar que no se ofrece deshacer un pegado confirmado, igual que no se ofrece deshacer una eliminación. Verificar con un test que tras confirmar no aparece ninguna acción de deshacer.

## 5. Los dos destinos de la exportación

- [x] 5.1 Reordenar `src/exportacion/compartirElCuadrante.ts` en un paso común —componer el HTML, producir el PDF en base64 y resolver el nombre de la semana— y el final de compartir, sin cambiar nada de `documentoDelCuadrante.ts`. Verificar que los tests de exportación existentes pasan sin tocar sus expectativas.
- [x] 5.2 Añadir el final de guardar: pedir carpeta con `Directory.pickDirectoryAsync()` y escribir allí el PDF con `createFile` y `write` en base64, sin pasar por la caché de la app. Verificar que no aparece ninguna dependencia nueva en `package.json`.
- [x] 5.3 Producir el PDF **antes** de pedir la carpeta, y cortar antes de todo cuando la plantilla está vacía. Verificar con el test que cita «Guardar con la plantilla vacía»: no se produce documento ni se pide carpeta.
- [x] 5.4 Tratar el cierre del selector sin elegir carpeta como desistimiento, no como fallo. Verificar con el test que cita «Desistir de guardar»: no se escribe ningún fichero y no se muestra ningún error.
- [x] 5.5 Ampliar `ResultadoDeExportar` con el caso de guardado y contar el fallo en lenguaje corriente. Verificar con el test que cita «El guardado falla» y con un test de que el mensaje no contiene ningún nombre de módulo, código de error ni ruta de fichero.
- [x] 5.6 Dar al fichero guardado el mismo nombre de semana con el que se comparte, resolviéndolo en el paso común. Verificar con el test que cita «El fichero guardado se reconoce por su nombre».
- [x] 5.7 Comprobar que lo guardado es el mismo documento que lo compartido, incluida la regla de privacidad. Verificar con el test que cita «Lo guardado es el mismo documento que se comparte», con teléfono, email, nota y motivo rellenos en toda la plantilla.
- [x] 5.8 Comprobar que guardar no escribe nada en el almacenamiento de la app. Verificar con el test que cita «Guardar no cambia nada de lo guardado en la app».

## 6. La elección de destino en el cuadrante

- [x] 6.1 Hacer que el icono de la cabecera abra una hoja con los dos destinos —compartir la semana y guardar una copia— en vez de compartir directamente, sin añadir un segundo botón a la fila de navegación. Verificar con los tests que citan «Compartir la semana que se está viendo» y «Guardar la semana que se está viendo».
- [x] 6.2 Permitir cerrar esa hoja sin exportar nada. Verificar con el test que cita «Desistir de exportar sin elegir destino».
- [x] 6.3 Comprobar que los dos destinos siguen disponibles en cualquier semana y que no se ofrecen sin plantilla. Verificar con los tests que citan «Compartir una semana ya pasada» y «El estado vacío no ofrece compartir».
- [x] 6.4 Comprobar que la cabecera no le ha quitado alto a la rejilla: con 20 empleados a 360 puntos, las siete columnas siguen sin scroll horizontal y se ven las mismas filas. Verificar con el test que cita «La acción de compartir no descoloca la rejilla».
- [x] 6.5 Mostrar en `AvisoDeLaExportacion` la confirmación de que el documento ha quedado guardado, sin ruta de fichero. Verificar con el test que cita «Guardar la semana en la carpeta que elige el encargado».

## 7. Cierre

- [x] 7.1 Ejecutar `npm run typecheck` y `npm test` completos y dejar los dos en verde. Verificar que ninguna expectativa de los tests que ya existían ha tenido que cambiar.

  - **Salvedad, 08/09/2026**: dos ficheros de test que ya existían **sí** tuvieron que cambiar sus expectativas, y no por conveniencia sino porque los dos requisitos MODIFIED de este change cambian justo lo que afirmaban:
    - `src/ui/__tests__/accionesDeCelda.test.ts`: las listas exactas de acciones de los estados con contenido ganan `copiar`, que es lo que el requisito «Toda celda es editable desde el cuadrante» ahora exige.
    - `src/ui/__tests__/compartirElCuadrante.test.tsx`: compartir pasa por elegir destino, y la etiqueta accesible del icono pasa a nombrar los dos. Lo exige «Exportar la semana desde el cuadrante». La expectativa «no hay ningún menú ni paso intermedio antes de compartir» era exactamente el comportamiento que este change sustituye.
    Ninguna otra expectativa se tocó: las 43 suites y los 409 tests quedan en verde.
- [x] 7.2 Anotar en `docs/verificacion-manual.md`, citando su nombre literal, los escenarios que solo se resuelven con el móvil delante: «Guardar la semana en la carpeta que elige el encargado», «Desistir de guardar» y «El guardado falla». Verificar que ningún escenario de los dos deltas queda sin citar ni en un test ni ahí.
- [x] 7.3 Comprobar en el móvil del encargado el recorrido de guardar entero: exportar una semana con la plantilla completa, elegir carpeta, y abrir después el PDF desde el gestor de ficheros. Anotar el resultado y la fecha en `docs/verificacion-manual.md`. Si `createFile` sobre la carpeta elegida falla en alguna plataforma, aplicar el camino alternativo previsto en `design.md` y registrar allí la decisión con su fecha.
- [x] 7.4 Comprobar en el móvil el recorrido de copiar y pegar planificando una semana real: copiar un turno y repetirlo cinco días, y comprobar que la hoja de acciones se maneja con una mano. Anotar el resultado y la fecha en `docs/verificacion-manual.md`.
- [x] 7.5 Comprobar en el PDF guardado que no aparece ningún teléfono, email, nota ni motivo de ausencia. Es la comprobación que cierra el change: si falla, no se guarda ni se comparte nada más hasta arreglarlo.
