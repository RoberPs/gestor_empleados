# Tareas

Referencia de comportamiento: `specs/panel-empleados/spec.md`. No se crea `design.md`: no hay dependencia nueva que justificar, no se introduce ningún patrón nuevo y todas las decisiones abiertas quedaron cerradas en `proposal.md` — Decisiones de negocio.

Frontera con los changes pendientes listados en `proposal.md` — Dependencias: el panel lee y escribe empleados, vacaciones y notas a través de la capa de acceso a datos `src/datos/almacenCuadrante.ts`, que sigue siendo la implementación provisional en memoria hasta el change de persistencia. Este change amplía esa interfaz; no la sustituye ni introduce SQLite ni Zustand.

Este change sustituye la pantalla provisional `src/ui/PantallaEmpleadosProvisional.tsx` creada en `add-weekly-roster-screen`. La spec viva de `cuadrante-semanal` no se toca: el cuadrante solo depende de que la ruta `app/empleados.tsx` exista y de que se pueda volver de ella.

## 1. Modelo de la ficha y de las vacaciones por rango

- [x] 1.1 Ampliar el tipo `Empleado` de `src/dominio/tipos.ts` con teléfono, email y nota, los tres opcionales y con el nombre como único campo obligatorio; verificar que `npx tsc --noEmit` pasa y que el cuadrante sigue compilando sin cambios
- [x] 1.2 Implementar en `src/dominio/formatos.ts` el análisis de una fecha tecleada —`7/9/2026`, `07/09/2026`, `7-9-2026`, `7.9.2026`, `07092026`— normalizándola a dd/mm/aaaa y rechazando lo que no sea una fecha real del calendario; verificar con tests que cubren el escenario "Teclear la fecha sin separadores" y el rechazo de `31/02/2026`
- [x] 1.3 Implementar en un módulo nuevo `src/dominio/vacaciones.ts` el agrupamiento de un conjunto de días de vacaciones en rangos de días contiguos y la expansión de un rango a sus días; verificar con tests que cubren los escenarios "Dos rangos contiguos se muestran como uno solo" y "Quitar las vacaciones de un día desde el cuadrante parte el rango"
- [x] 1.4 Implementar en `src/dominio/vacaciones.ts` la validación de un rango —fin anterior al inicio inválido, fin igual al inicio válido como día único—; verificar con tests que cubren los escenarios "Un rango de un solo día" y la parte de rechazo de "Un rango cuyo fin es anterior a su inicio no se guarda"
- [x] 1.5 Implementar en un módulo nuevo `src/dominio/empleado.ts` la validación del nombre —no vacío tras quitar espacios sobrantes y único en la plantilla ignorando mayúsculas y espacios— y el saneado de teléfono y email quitando solo los espacios del principio y del final; verificar con tests que cubren el rechazo del nombre vacío, el rechazo de `ana` cuando ya existe `Ana` y que `600 11 22 33` se guarda tal cual

## 2. Capa de acceso a datos

- [x] 2.1 Ampliar la interfaz `AlmacenCuadrante` de `src/datos/almacenCuadrante.ts` con la lectura de un empleado por su id, la edición de nombre, teléfono, email y nota, y la lectura de los rangos de vacaciones de un empleado; verificar que `npx tsc --noEmit` pasa y que ningún componente del cuadrante necesita cambios
- [x] 2.2 Implementar en el almacén en memoria el alta con nombre, teléfono y email y la edición de cada campo por separado, respetando la unicidad del nombre; verificar con tests que una escritura queda reflejada en la lectura siguiente y que un alta con nombre repetido no altera la plantilla
- [x] 2.3 Implementar en el almacén el marcado de un rango de vacaciones como conjunto de días —reutilizando `marcarVacaciones` día a día— y el recuento previo de los días del rango que tienen turno planificado o ausencia, sin contar los que ya estaban de vacaciones; verificar con tests que el recuento es exacto y que marcar el rango deja esos días como vacaciones
- [x] 2.4 Implementar en el almacén la eliminación de un rango de vacaciones vaciando sus días y la lectura de los rangos de un empleado a partir de sus días marcados; verificar con un test que eliminar un rango deja vacías sus celdas en el cuadrante
- [x] 2.5 Actualizar el comentario de cabecera de `src/datos/almacenCuadrante.ts` para que refleje que la ficha completa ya vive aquí y que sigue siendo provisional hasta el change de persistencia; verificar leyendo el módulo que ya no anuncia la ficha como pendiente

## 3. Lista de empleados

- [x] 3.1 Crear la pantalla de lista `src/ui/PantallaEmpleados.tsx` con una fila por empleado mostrando solo el nombre, en orden alfabético español reutilizando `ordenarEmpleadosPorNombre`, y montarla en `app/empleados.tsx`; verificar con un test que cubre el escenario "Ver la lista de la plantilla"
- [x] 3.2 Borrar `src/ui/PantallaEmpleadosProvisional.tsx` y sus referencias; verificar con `npx tsc --noEmit` y `npm test` que nada lo importa y que el test de navegación del cuadrante sigue pasando
- [x] 3.3 Comprobar que la lista no ofrece ninguna acción de baja —ni botón, ni deslizamiento, ni pulsación larga—; verificar con un test que cubre el escenario "La lista no ofrece dar de baja"
- [x] 3.4 Implementar el estado vacío de la lista con su mensaje y la acción que abre el alta del primer empleado; verificar con tests que cubren los escenarios "Abrir el panel con la plantilla vacía" y "La lista aparece tras dar de alta al primer empleado"
- [x] 3.5 Implementar el scroll vertical de la lista, el ancho mínimo de 360 puntos, el área pulsable de al menos 44 puntos de alto por fila ocupando todo el ancho, y la acción de alta siempre alcanzable; verificar con un test que la fila declara ese área mínima y anotar en `docs/verificacion-manual.md` el escenario "Ver la lista con 20 empleados"
- [x] 3.6 Implementar el truncado con puntos suspensivos del nombre que no cabe en su fila; verificar con un test que cubre el escenario "Un nombre largo se trunca en su fila"

## 4. Alta de un empleado

- [x] 4.1 Crear el formulario de alta `src/ui/FormularioAltaEmpleado.tsx` con los campos nombre, teléfono y email y una acción explícita de confirmación; verificar con un test que cubre el escenario "Dar de alta un empleado con nombre, teléfono y email"
- [x] 4.2 Implementar el alta solo con nombre, dejando teléfono y email vacíos y rellenables después; verificar con un test que cubre el escenario "Dar de alta un empleado sin teléfono ni email"
- [x] 4.3 Implementar el rechazo del alta sin nombre, con explicación, sin perder lo introducido y con la explicación desapareciendo al corregir; verificar con un test que cubre el escenario "Un alta sin nombre no se guarda"
- [x] 4.4 Implementar el rechazo del alta con un nombre ya existente, ignorando mayúsculas y espacios sobrantes; verificar con un test que cubre el escenario "Un alta con un nombre que ya existe no se guarda"

## 5. Ficha del empleado

- [x] 5.1 Crear la pantalla de ficha `src/ui/PantallaFichaEmpleado.tsx` y su ruta `app/empleados/[id].tsx`, con la fila de la lista pulsable en toda su superficie y la acción de volver siempre disponible; verificar con un test de navegación que cubre el escenario "Abrir la ficha de un empleado y volver a la lista"
- [x] 5.2 Implementar la edición de nombre, teléfono y email con guardado al terminar cada campo, sin botón de guardar global ni diálogo de descartar cambios; verificar con tests que cubren los escenarios "Editar el teléfono de un empleado existente" y "Vaciar el email de un empleado"
- [x] 5.3 Implementar la revalidación del nombre al editarlo —no vacío y no repetido— con explicación y sin perder lo tecleado; verificar con un test que editar el nombre de un empleado poniéndole el de otro no se guarda y lo explica
- [x] 5.4 Implementar la reordenación de la lista al volver tras cambiar un nombre; verificar con un test que cubre el escenario "Cambiar el nombre reordena la lista"
- [x] 5.5 Implementar el scroll vertical de la ficha cuando su contenido no cabe, sin dejar ningún campo fuera de alcance; verificar con un test que los campos de nombre, teléfono, email, vacaciones y nota están todos presentes, y anotar en `docs/verificacion-manual.md` el escenario "Ver la ficha de un empleado sin vacaciones y sin notas"

## 6. Vacaciones desde la ficha

- [x] 6.1 Crear el componente de vacaciones de la ficha `src/ui/VacacionesDeLaFicha.tsx` que lista los rangos en formato dd/mm/aaaa y ofrece añadir, editar y eliminar cada uno; verificar con un test que cubre el escenario "Añadir un rango de vacaciones a un empleado y verlo en su ficha"
- [x] 6.2 Implementar la entrada de fechas tecleadas con normalización a dd/mm/aaaa reutilizando el análisis de la tarea 1.2; verificar con un test que cubre el escenario "Teclear la fecha sin separadores"
- [x] 6.3 Implementar el rechazo del rango con fin anterior al inicio, con explicación, sin perder lo tecleado y con la explicación desapareciendo al corregir, y la aceptación del rango de un solo día; verificar con tests que cubren los escenarios "Un rango cuyo fin es anterior a su inicio no se guarda" y "Un rango de un solo día"
- [x] 6.4 Implementar la agrupación de rangos contiguos en la presentación de la ficha; verificar con un test que cubre el escenario "Dos rangos contiguos se muestran como uno solo"
- [x] 6.5 Implementar la edición de un rango existente y su efecto sobre las celdas del cuadrante; verificar con un test que cubre el escenario "Editar un rango de vacaciones existente"
- [x] 6.6 Implementar la eliminación de un rango con confirmación explícita y sin deshacer, reutilizando `src/ui/ConfirmacionEliminar.tsx`; verificar con tests que cubren los escenarios "Eliminar un rango de vacaciones existente" y "Desistir de eliminar un rango de vacaciones"
- [x] 6.7 Implementar el aviso con el recuento de días del rango que ya tienen turno planificado o ausencia y su confirmación explícita antes de guardar; verificar con tests que cubren los escenarios "Un rango de vacaciones que pisa turnos planificados" y "Desistir de un rango que pisa turnos planificados"
- [x] 6.8 Comprobar que quitar las vacaciones de un día desde la celda del cuadrante parte el rango de la ficha; verificar con un test que cubre el escenario "Quitar las vacaciones de un día desde el cuadrante parte el rango"

## 7. Nota del empleado

- [x] 7.1 Implementar el campo de nota de texto libre multilínea en la ficha, sin longitud máxima impuesta por la interfaz, guardado al terminar de editarlo y vaciable; verificar con un test que cubre el escenario "Escribir y modificar la nota de un empleado"
- [x] 7.2 Comprobar que una nota larga se guarda y se recupera entera, sin recortar ni indicar contenido oculto; verificar con un test que cubre el escenario "Una nota larga no se recorta"

## 8. Baja de un empleado

- [x] 8.1 Implementar la acción de baja en la ficha con confirmación explícita que nombre al empleado y advierta de la pérdida de sus turnos planificados, ausencias y vacaciones, también en semanas pasadas; verificar con un test que cubre el escenario "Dar de baja a un empleado que tiene turnos planificados"
- [x] 8.2 Implementar la conservación íntegra del empleado y su contenido cuando no se confirma la baja, permaneciendo en la ficha; verificar con un test que cubre el escenario "Desistir de una baja"

## 9. Privacidad, idioma y cierre

- [x] 9.1 Comprobar que teléfono, email y nota no se muestran en la lista de empleados ni en ninguna pantalla del cuadrante; verificar con un test que cubre el escenario "El teléfono y el email no salen de la ficha"
- [x] 9.2 Revisar que todos los textos del panel y de la ficha están en español de España y que las fechas se muestran como dd/mm/aaaa; verificar con un test que cubre el escenario "Formatos del panel de empleados"
- [x] 9.3 Comprobar que el panel no muestra ningún texto que valore días disponibles, límites de jornada ni normativa laboral; verificar con un test que cubre el escenario "El panel no valora el cumplimiento normativo"
- [x] 9.4 Anotar en `docs/verificacion-manual.md` los escenarios "Ver la lista con 20 empleados" y "Ver la ficha de un empleado sin vacaciones y sin notas" citando su nombre literal, con capability, requisito, cómo se comprueba y qué se debe observar; verificar que ambas entradas siguen el formato ya documentado en ese fichero
- [x] 9.5 Comprobar que cada escenario de `specs/panel-empleados/spec.md` está citado literalmente en un test o en `docs/verificacion-manual.md`; verificar recorriendo la spec escenario a escenario que ninguno queda sin cubrir
- [x] 9.6 Ejecutar `npm test` y `npx tsc --noEmit`; verificar que ambos pasan sin errores y que los tests del cuadrante siguen pasando sin haber sido modificados
