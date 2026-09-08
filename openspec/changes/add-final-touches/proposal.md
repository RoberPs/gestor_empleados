## Why

El 08/09/2026, con los dos changes anteriores ya archivados y la app funcionando en el móvil del encargado, una última pasada dejó cinco carencias. Cuatro son de uso —cosas que el encargado hace todos los días y le cuestan más toques de los necesarios— y una es una decisión de producto que se da la vuelta:

1. **La lista de empleados no dice quién es quién.** Solo muestra el nombre. Con 20 personas en plantilla, el encargado sabe el nombre pero no recuerda de memoria quién está en barra y quién en cocina, que es justo lo que necesita saber al planificar.
2. **Nada indica que una fila lleve a algún sitio.** La fila entera abre la ficha desde hace dos changes, pero no se ve: el encargado la toca por probar, no porque la pantalla se lo diga.
3. **Una ausencia no explica nada.** El cuadrante marca `AUS` y ahí se acaba. Si el encargado quiere recordar por qué faltó alguien el martes, no tiene dónde apuntarlo.
4. **El teclado tapa lo que se escribe.** En la ficha, al escribir en la nota, el teclado de Android se pone encima del campo y el encargado no ve lo que teclea.
5. **Los ajustes sobran.** Se añadieron el 08/09/2026 para editar el nombre del local. El encargado lo escribió una vez, quedó bien, y no va a haber más ajustes: una pantalla entera con un solo campo que se toca una vez en la vida es peso muerto en una app que se maneja de pie y con prisa.

Y en la rejilla del cuadrante el nombre del empleado se trunca a una línea, así que con nombres largos el encargado no sabe de quién es la fila que está mirando.

## What Changes

- **El empleado gana un puesto**: texto libre que escribe el encargado, se pide en el alta junto al teléfono y el email, y es editable desde la ficha como el resto. Aparece junto al nombre en la lista del panel.
- **La fila de la lista muestra un icono de editar** a la derecha del todo, que lleva a la ficha. La fila entera sigue siendo pulsable: el icono es la pista visual, no el único camino.
- **La ficha gana el motivo de la ausencia**: un campo de texto libre, como la nota. Desde el cuadrante, la hoja de acciones de una celda de ausencia ofrece «Ver la ausencia», que lleva a la ficha del empleado. La celda del cuadrante **no cambia**: sigue mostrando `AUS` y nada más.
- **La columna de nombres de la rejilla pasa a ser pulsable** y abre la ficha de ese empleado. El título de la ficha deja de truncarse a una línea.
- **Ningún campo queda tapado por el teclado**: al escribir en un campo largo —la nota, el motivo de la ausencia— el campo sigue viéndose.
- **Se retira la pantalla de ajustes** por completo: la pantalla, su ruta, el acceso desde la cabecera, el almacén de ajustes y su tabla. El nombre del local y el logo quedan fijos en el código, y la cabecera los sigue mostrando igual que hoy.
- **BREAKING** (solo para el dispositivo del encargado): el esquema de la base sube a la versión 3 para borrar la tabla `ajustes`. La plantilla y el cuadrante no se tocan.
- Se corrige de paso que la pista de escritura de las fechas de vacaciones enseñe barras que el teclado numérico de Android no tiene.

Decisiones tomadas el 08/09/2026:

- **El nombre del local se fija en código**, y con él «La Esquina café». Se da la vuelta a la decisión del 08/09/2026 de que no se fijara nunca en código: aquella se tomó pensando en que habría más ajustes que justificaran la pantalla, y no los hay. Esto **obliga a corregir el contexto de proyecto** de `openspec/config.yaml`, que hoy prohíbe explícitamente dar por hecho un nombre concreto; si no se corrige, todo artefacto que se genere después contradirá esta decisión.
- **Se retira la pantalla, pero no se rehace la historia.** La migración que creó la tabla `ajustes` ya corrió en el móvil del encargado, así que no se puede desandar: la única salida limpia es una migración nueva que la borre. Dejar la tabla muerta se descartó: una tabla con el nombre del local dentro, mientras el nombre vive en el código, es una trampa para quien lea esto dentro de seis meses.
- **El icono no sustituye a la fila pulsable.** Si abrir una ficha pasara a exigir acertar en el icono, el área pulsable bajaría de toda la fila a un cuadrado de 44 puntos en la esquina. Se conservan los dos caminos.
- **El motivo de la ausencia vive en la ficha, no en la celda.** La celda del cuadrante sigue mostrando `AUS` y nada más: la rejilla es para planificar de un vistazo, y un motivo ahí dentro no cabe ni hace falta.
- **El motivo es del empleado, no del día.** Es un campo por empleado, como la nota, no un dato por cada día marcado. Es lo más simple que resuelve el caso real —recordar por qué falta alguien— sin abrir una tabla nueva de motivos por fecha.
- **El puesto deja de ser privado.** Sale de la ficha y se muestra en la lista. El teléfono, el email y la nota siguen sin salir de la ficha: un puesto no identifica ni localiza a nadie fuera del local, un teléfono sí.
- **El título de la ficha pasa a dos líneas.** Llevar a la ficha un nombre que allí también se trunca no resolvería nada.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `panel-empleados`: la lista muestra el puesto y un acceso visible a la ficha; el alta y la edición incluyen el puesto; la ficha gana el motivo de la ausencia; la ficha se abre también desde el cuadrante y vuelve allí; ningún campo queda tapado por el teclado; el nombre del empleado se lee entero en la ficha; la privacidad distingue el puesto de los datos de contacto.
- `cuadrante-semanal`: desaparece el acceso a los ajustes; la identidad del local pasa a ser fija; la columna de nombres abre la ficha; la hoja de acciones de una celda de ausencia ofrece ver la ausencia.
- `almacenamiento-empleados`: el puesto y el motivo de la ausencia se guardan y sobreviven al cierre; la tabla de ajustes se retira del esquema.

### Removed Capabilities

- `ajustes-del-local`: sin pantalla de ajustes y con el nombre fijo en código, la capability se queda sin objeto. Su único requisito que sobrevive —que la pantalla de inicio identifique el local— se muda a `cuadrante-semanal`, que es donde se dibuja esa cabecera.

## Impact

- **Datos**: columnas nuevas `puesto` y `motivo_ausencia` en `empleados`, y borrado de la tabla `ajustes`. Todo en una migración a la versión 3 que **no puede perder ni un empleado ni un turno**: es la primera migración de este proyecto que destruye algo.
- **Código**: `src/dominio/tipos.ts` y `empleado.ts` (dos campos nuevos), `src/datos/` (almacén y migración, y retirada de `almacenAjustes*`), `src/ui/PantallaEmpleados.tsx`, `PantallaFichaEmpleado.tsx`, `RejillaCuadrante.tsx`, `HojaAccionesCelda.tsx`, `CabeceraSemana.tsx`, `FormularioAltaEmpleado.tsx` y `VacacionesDeLaFicha.tsx`.
- **Se borran**: `src/ui/PantallaAjustes.tsx`, `app/ajustes.tsx`, `src/datos/almacenAjustes.ts`, `src/datos/sqlite/almacenAjustesSqlite.ts` y sus tests, más las dos operaciones de nombre del local en la interfaz `AlmacenCuadrante`.
- **Documentación**: hay que corregir el bloque `context` de `openspec/config.yaml`, y retirar de `docs/verificacion-manual.md` los escenarios de `ajustes-del-local` que dejan de existir.
- **Dependencias**: ninguna nueva. El icono de editar es un glifo de texto; no se añade librería de iconos.
- **Riesgo**: la migración destructiva es el punto delicado. El segundo es el teclado: en Expo 57 con edge-to-edge, Android ya no encoge la ventana al abrir el teclado, así que el arreglo no es una opción de configuración sino código que reserva el hueco.
