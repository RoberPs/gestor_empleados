## 1. La migración a la versión 3

- [ ] 1.1 Escribir **antes que nada** el test del salto 2 → 3 en `src/datos/sqlite/__tests__/migraciones.test.ts`: partir de una base en versión 2 con empleados, turnos planificados, ausencias, vacaciones y una fila en `ajustes`, y afirmar que tras el salto siguen todos los empleados con sus fichas intactas, todo el contenido del cuadrante, y que la tabla `ajustes` ya no existe. Verificar que el test **falla** por no existir todavía la migración.
- [ ] 1.2 Añadir la migración `AMPLIAR_FICHA_Y_RETIRAR_AJUSTES` al final de `MIGRACIONES` en `src/datos/sqlite/migraciones.ts`: `ALTER TABLE empleados ADD COLUMN puesto`, `ALTER TABLE empleados ADD COLUMN motivo_ausencia` (las dos con `DEFAULT ''`) y `DROP TABLE ajustes`. Verificar que el test de 1.1 pasa a verde sin tocar sus expectativas.
- [ ] 1.3 Comprobar que la migración no recrea `empleados` ni su índice único: tras el salto, dar de alta un nombre repetido debe seguir fallando por el índice. Verificar con un test que cita «Un nombre repetido no se guarda» partiendo de una base migrada desde la versión 2.
- [ ] 1.4 Comprobar que arrancar dos veces seguidas sobre una base ya en versión 3 no vuelve a migrar nada. Verificar con un test que cita «Arrancar dos veces seguidas no vuelve a adaptar nada».
- [ ] 1.5 Añadir el test que cita «Una adaptación que retira datos no toca la plantilla». Verificar que falla si la migración borrase cualquier otra cosa además de `ajustes`.

## 2. El puesto y el motivo de la ausencia en el dominio y en los datos

- [ ] 2.1 Añadir `puesto` y `motivoAusencia` como campos opcionales de `Empleado` en `src/dominio/tipos.ts`, documentando en el propio tipo que el motivo es uno por empleado y que un motivo nuevo pisa al anterior. Verificar con `npm run typecheck` que señala todas las construcciones de `Empleado` pendientes de actualizar.
- [ ] 2.2 Sanear el puesto con `sanearCampo` al guardarlo y dejar el motivo de la ausencia sin longitud máxima, igual que la nota. Verificar con los tests que citan «El puesto se guarda sin los espacios de los extremos» y «Dos empleados con el mismo puesto se guardan».
- [ ] 2.3 Añadir `editarPuesto` y `editarMotivoAusencia` a la interfaz `AlmacenCuadrante` y a sus dos implementaciones —la SQLite y la de memoria de los tests—, y aceptar el puesto en el alta. Verificar con `npm run typecheck` que no queda ninguna implementación incompleta.
- [ ] 2.4 Comprobar que el puesto no interviene en la unicidad del nombre ni en el orden de la lista. Verificar con un test que dos empleados con el mismo puesto se guardan y que el orden alfabético no cambia al escribir puestos.
- [ ] 2.5 Añadir los tests de persistencia que citan «El puesto y el motivo de la ausencia sobreviven al cierre», «Guardar un empleado solo con nombre» y «Vaciar el puesto de un empleado». Verificar que los tres fallan si se quita alguna de las dos columnas.

## 3. Retirada de los ajustes

- [ ] 3.1 Borrar `src/ui/PantallaAjustes.tsx`, `app/ajustes.tsx`, `src/datos/almacenAjustes.ts`, `src/datos/sqlite/almacenAjustesSqlite.ts` y sus tests, y quitar `leerNombreDelLocal` y `escribirNombreDelLocal` de `AlmacenCuadrante` y de sus dos implementaciones. Verificar con `npm run typecheck` que no queda ninguna referencia colgando.
- [ ] 3.2 Fijar el nombre del local como constante junto a la referencia al logo, y hacer que `src/ui/CabeceraSemana.tsx` lo lea de ahí en vez del almacén. Verificar con un test que cita «Abrir la app con el nombre del local ya escrito».
- [ ] 3.3 Quitar de `src/ui/CabeceraSemana.tsx` el acceso a los ajustes y su entrada del `Stack` en `app/_layout.tsx`. Verificar con un test que cita «La app no ofrece cambiar el nombre ni el logo» y con la suite de rutas, que no debe montar ya ninguna ruta de ajustes.
- [ ] 3.4 Comprobar que la cabecera no ha perdido ni ganado alto al quitarle el acceso: con 20 empleados a 360 puntos, las siete columnas siguen sin scroll horizontal y se ven las mismas filas. Verificar con un test que cita «La identidad del local no le quita sitio a la rejilla».
- [ ] 3.5 Retirar de `docs/verificacion-manual.md` los escenarios de `ajustes-del-local` que dejan de existir, y dejar los que se mudan a `cuadrante-semanal` citando su nombre nuevo. Verificar que ningún escenario de las specs vivas queda sin citar ni en un test ni ahí.

## 4. El panel de empleados

- [ ] 4.1 Añadir el campo de puesto a `src/ui/FormularioAltaEmpleado.tsx`, opcional y de texto libre. Verificar con los tests que citan «Dar de alta un empleado con nombre, teléfono y email» y «Dar de alta un empleado sin teléfono ni email».
- [ ] 4.2 Mostrar el puesto junto al nombre en cada fila de `src/ui/PantallaEmpleados.tsx`, con el nombre quedándose el ancho sobrante y el puesto truncándose primero. Verificar con los tests que citan «Ver la lista de la plantilla», «Un empleado sin puesto escrito» y «El puesto se trunca antes que el nombre».
- [ ] 4.3 Añadir al final de cada fila el acceso a la ficha como glifo `✎`, con el color de acción del tema y un área pulsable de 44 × 44 puntos, sin quitarle a la fila su propia pulsabilidad. Verificar con el test que cita «El acceso de la fila y la fila llevan al mismo sitio» y comprobando que el área pulsable de la fila no ha bajado.
- [ ] 4.4 Añadir el campo de puesto a `src/ui/PantallaFichaEmpleado.tsx`, con el mismo guardado según se escribe y el mismo aviso que el resto. Verificar con el test que cita «Editar el puesto de un empleado existente».
- [ ] 4.5 Comprobar que el puesto no se muestra en el cuadrante y que el teléfono, el email, la nota y el motivo siguen sin salir de la ficha. Verificar con el test que cita «El teléfono y el email no salen de la ficha».

## 5. El motivo de la ausencia

- [ ] 5.1 Añadir a la ficha el campo de motivo de la ausencia, de texto libre y multilínea, con el mismo comportamiento que la nota. Verificar con los tests que citan «Escribir el motivo de la ausencia de un empleado» y «El motivo de la ausencia se puede vaciar».
- [ ] 5.2 Añadir «Ver la ausencia» a las acciones que `src/ui/HojaAccionesCelda.tsx` ofrece sobre una celda de ausencia, llevando a la ficha de ese empleado. Verificar con el test que cita «Ver la ausencia desde la celda».
- [ ] 5.3 Comprobar que la acción se ofrece también cuando el empleado no tiene motivo escrito, y que la celda no cambia de aspecto por tenerlo. Verificar con los tests que citan «Ver la ausencia de quien no tiene motivo escrito» y «La celda de ausencia no muestra el motivo».
- [ ] 5.4 Comprobar que escribir el motivo no marca ninguna celda y que marcar una ausencia no pide motivo. Verificar con los tests que citan «El motivo no obliga a marcar ausencias» y «Marcar una ausencia no exige escribir el motivo».
- [ ] 5.5 Comprobar que las acciones de una celda de vacaciones no han cambiado. Verificar con los tests de `accionesDeCelda` ya existentes, sin tocar sus expectativas.

## 6. La ficha alcanzable desde el cuadrante

- [ ] 6.1 Hacer pulsable el nombre de la fila en `src/ui/RejillaCuadrante.tsx`, con su propia etiqueta de accesibilidad y sin robarle área a las celdas de día. Verificar con el test que cita «Abrir la ficha desde el nombre de la fila».
- [ ] 6.2 Hacer que la ficha sepa de dónde se abrió y que su acción de volver devuelva al cuadrante o a la lista según corresponda, dejando el cuadrante en la misma semana. Verificar con los tests que citan «Abrir la ficha de un empleado y volver a la lista» y «Ir a los ajustes y volver al cuadrante» sustituido por el nuevo recorrido desde la rejilla.
- [ ] 6.3 Dejar que el título de la ficha ocupe las líneas que necesite en vez de truncarse. Verificar con los tests que citan «El nombre largo se lee entero en la ficha» y «Un nombre truncado se lee entero abriendo su ficha».
- [ ] 6.4 Comprobar que la rejilla conserva su geometría con la columna de nombres ya pulsable. Verificar con los tests de `rejilla` y `defectosDeLaPantalla` ya existentes, sin tocar sus expectativas.

## 7. El teclado

- [ ] 7.1 Hacer que la ficha escuche `keyboardDidShow` y `keyboardDidHide` y reserve la altura del teclado en el `paddingBottom` del contenido del scroll, retirándola al cerrarse. Verificar con un test que cita «Al cerrar el teclado la ficha recupera su sitio».
- [ ] 7.2 Desplazar el scroll hasta el campo que recibe el foco, para que no quede por debajo del teclado. Verificar con los tests que citan «Escribir en la nota con el teclado abierto» y «Escribir en el motivo de la ausencia con el teclado abierto».
- [ ] 7.3 Poner `keyboardShouldPersistTaps="handled"` en el scroll de la ficha para que el primer toque fuera del campo no se pierda cerrando el teclado. Verificar con un test que un toque sobre otra acción de la ficha con el teclado abierto la ejecuta.
- [ ] 7.4 Corregir la pista de escritura de las fechas de vacaciones para que no muestre caracteres que el teclado numérico de Android no ofrece. Verificar con el test que cita «La pista de la fecha se puede teclear con el teclado que se abre» y con el ya existente «Teclear la fecha sin separadores».

## 8. Cierre

- [ ] 8.1 Corregir el bloque `context` de `openspec/config.yaml`: el nombre del local pasa a estar fijado en la app, así que el párrafo que prohíbe dar por hecho un nombre concreto deja de valer para el local. Verificar leyendo el bloque que no queda ninguna frase que contradiga la decisión del 08/09/2026.
- [ ] 8.2 Ejecutar `npm run typecheck` y `npm test` completos y dejar los dos en verde. Verificar que ninguna expectativa de los tests que ya existían ha tenido que cambiar salvo las que las specs modificadas obligan a cambiar.
- [ ] 8.3 Anotar en `docs/verificacion-manual.md` los escenarios nuevos que solo se resuelven mirando la pantalla, citando su nombre literal: «El puesto se trunca antes que el nombre», «Escribir en la nota con el teclado abierto», «Escribir en el motivo de la ausencia con el teclado abierto» y «Al cerrar el teclado la ficha recupera su sitio». Verificar que ningún escenario de las specs vivas queda sin citar ni en un test ni ahí.
- [ ] 8.4 Comprobar en el móvil del encargado, **solo con 8.2 en verde**: que la plantilla y el cuadrante siguen enteros tras la migración, que el teclado ya no tapa la nota, que el nombre de la fila abre la ficha sin dispararse al deslizar la rejilla, y que la lista muestra puesto e icono sin comerse el nombre. Anotar el resultado y la fecha en `docs/verificacion-manual.md`.
