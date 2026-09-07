## Why

El encargado abre la app en la sala, de pie y con prisa, para una sola cosa: ver y tocar el cuadrante de la semana. Hoy no hay ninguna pantalla especificada, así que no está definido qué ve al abrir la app ni cómo pasa de mirar la semana a cambiar un turno. Esta es la pantalla de entrada del producto y de ella cuelga todo lo demás, así que es lo primero que hay que especificar.

## What Changes

- Se especifica la pantalla de inicio de la app: la rejilla del cuadrante semanal, en la ruta raíz de expo-router. Al abrir la app se ve directamente, sin pantalla de resumen ni de bienvenida intermedia.
- Se especifica la rejilla: empleados en filas, días de lunes a domingo en columnas, una sola semana a la vez, con la semana completa visible sin scroll horizontal.
- Se especifica la identificación de la semana en pantalla y la navegación a semana anterior, semana siguiente y vuelta a la semana en curso.
- Se especifica el contenido observable de cada celda: turno planificado —uno o dos tramos el mismo día, con hora de inicio y fin en formato 24h—, ausencia, vacaciones o celda vacía, y cómo se distinguen entre sí, incluida la leyenda permanente de las etiquetas `AUS` y `VAC`.
- Se especifica la interacción de la celda: un toque abre las acciones de esa celda para ese empleado y ese día — crear turno planificado, añadir un segundo turno, editarlos, marcar ausencia o vacaciones, y eliminar lo que hubiera previa confirmación. Ninguna celda es de solo lectura, tampoco en semanas pasadas.
- Se especifica el acceso al panel de empleados desde el cuadrante y el regreso al cuadrante.
- Se especifica el orden de los empleados en las filas y el estado vacío cuando no hay ningún empleado dado de alta.
- Se especifica que la pantalla sigue siendo legible y pulsable con una plantilla de 20 empleados, el ancho mínimo de pantalla soportado y qué hace la rejilla con un nombre que no cabe en su columna.

No hay cambios que rompan comportamiento existente: no existe todavía comportamiento especificado que romper.

## Capabilities

### New Capabilities

- `cuadrante-semanal`: la pantalla del cuadrante semanal — qué semana se muestra, cómo se navega entre semanas, qué se ve en cada celda de la rejilla empleado × día, qué acciones ofrece una celda al tocarla, cómo se llega al panel de empleados y qué se ve cuando no hay plantilla.

### Modified Capabilities

Ninguna. No existe ninguna spec viva en `openspec/specs/`: este es el primer change del proyecto.

## Decisiones de negocio

- **2026-09-07 — Nombre de la capability: `cuadrante-semanal`.** No hay ninguna capability existente que reutilizar, así que se adopta este nombre siguiendo la terminología del proyecto (el propio documento se llama "cuadrante", no "horario" ni "planning"). **Confirmado por el responsable del proyecto**: el directorio de la spec no se renombra.
- **2026-09-07 — La pantalla del cuadrante es la ruta raíz.** No hay pantalla de resumen, panel de inicio ni menú previo. El encargado abre la app y ve la semana. Motivo: uso de pie y con prisa, un toque menos por operación.
- **2026-09-07 — Ninguna celda es de solo lectura.** El cuadrante no es solo un visor: se planifica desde la propia rejilla, tocando la celda. Motivo: evitar una pantalla de edición separada a la que haya que navegar.
- **2026-09-07 — Ausencia y vacaciones se marcan desde la misma celda que el turno.** Son estados alternativos de la misma casilla empleado × día, no una pantalla aparte.
- **2026-09-07 — La celda admite hasta dos turnos planificados el mismo día (turno partido).** Motivo: el turno partido es la forma habitual de trabajar en un restaurante español; forzarlo a un único tramo `12:00`-`00:00` haría que la pantalla mintiese sobre el hueco de la tarde. Se limita a dos: un tercer tramo en un mismo día no es un caso real de este restaurante y multiplicaría el alto de fila. La regla de dominio (solapamientos, duración) sigue siendo spec pendiente; aquí solo se decide lo que la celda muestra y ofrece.
- **2026-09-07 — Ausencia y vacaciones se marcan día a día, no por rango.** Motivo: simplicidad. Se acepta conscientemente el coste de que dos semanas de vacaciones sean catorce toques hasta que el change de dominio de ausencias especifique el marcado por rango.
- **2026-09-07 — Las etiquetas de la celda son `AUS` y `VAC`, con leyenda permanente en pantalla.** Motivo: en una columna de 44 pt no cabe "Vacaciones" sin reducir la fuente por debajo de lo legible de pie. La palabra completa se usa siempre en la hoja de acciones, y la leyenda `AUS = Ausencia · VAC = Vacaciones` es visible sin desplazarse. La prohibición de abreviar sigue aplicándose a las horas, que nunca se abrevian.
- **2026-09-07 — Ancho mínimo de pantalla soportado: 360 pt en orientación vertical.** Motivo: es el ancho del móvil pequeño de gama de entrada; por debajo, las cuatro exigencias de la rejilla (siete columnas, sin scroll horizontal, 44 pt pulsables, horas sin abreviar) son geométricamente incompatibles. Las siete columnas de día se reparten el ancho a partes iguales con un mínimo de 44 pt y la columna de nombres se queda con el resto (52 pt a 360 pt).
- **2026-09-07 — El nombre que no cabe en su columna se trunca con puntos suspensivos.** Motivo: consecuencia de la decisión anterior. Con una plantilla de 10 a 20 personas de un mismo local, el nombre de pila basta para identificar la fila. Se anota como restricción para el change de la ficha de empleado: el campo nombre se piensa corto.
- **2026-09-07 — Un turno que cruza la medianoche pertenece a la celda del día en que empieza.** Se muestra tal cual (`20:00` y `02:00`) y no ocupa ni marca la celda del día siguiente. Motivo: el encargado planifica el cierre como trabajo de la noche del viernes, no de la madrugada del sábado.
- **2026-09-07 — No existe el concepto de empleado inactivo o dado de baja.** El cuadrante muestra la plantilla actual en todas las semanas: quien causa baja desaparece también de las semanas ya trabajadas y quien entra hoy aparece con filas vacías en las semanas pasadas. Motivo: simplicidad; el historial de plantilla no es un objetivo del producto. Se anota como limitación aceptada para el change del panel de empleados.
- **2026-09-07 — Eliminar el contenido de una celda exige confirmación explícita; no hay deshacer.** Motivo: celdas contiguas de 44 pt manejadas con prisa y con una mano hacen probable el toque erróneo, y un borrado silencioso solo se detecta cuando el turno ya no aparece. Se descarta el deshacer por el estado adicional que exige.
- **2026-09-07 — Las semanas pasadas se editan sin límite.** Motivo: coherencia con "ninguna celda es de solo lectura" y necesidad real de corregir el cuadrante después. El cuadrante planificado no es el registro de horas realmente trabajadas, así que editarlo hacia atrás no falsea ningún dato de jornada.
- **2026-09-07 — Un turno cuyo fin coincide con su inicio no se puede guardar; un fin anterior al inicio se interpreta como cruce de medianoche.** Motivo: es la validación mínima que la pantalla necesita para no aceptar en silencio un turno imposible, y es coherente con la decisión sobre el cruce de medianoche. El resto de reglas (duración máxima, solapamiento entre los dos tramos) sigue siendo spec pendiente.
- **2026-09-07 — El acceso al panel de empleados apunta a una pantalla provisional dentro de este change.** Una ruta mínima que solo confirma la navegación y el regreso a la misma semana; el change del panel de empleados la sustituye sin tocar el cuadrante. Motivo: no bloquear la pantalla de entrada del producto a la espera de otro change.
- **2026-09-07 — Las filas se ordenan alfabéticamente por el campo nombre, sin agrupar por puesto.** Motivo: el puesto (cocina, sala) no existe en la ficha de empleado y no se introduce aquí; el orden alfabético es estable y predecible entre semanas.
- **2026-09-07 — La semana en curso se recalcula cada vez que la app vuelve a primer plano.** Motivo: la app se queda abierta en el bolsillo; si el encargado la retoma pasada la medianoche del domingo debe ver la semana nueva, no la anterior. No se recalcula mientras la pantalla está en primer plano, para no mover el cuadrante bajo el dedo.

## Dependencias

Comportamientos de dominio que esta pantalla necesita y que **no se especifican en este change**. Se anotan aquí como specs pendientes; este change no los inventa ni los da por resueltos, y la delta de `cuadrante-semanal` se limita a lo observable en la pantalla.

- **Ficha de empleado y panel de empleados** (spec pendiente, change aparte). Este change asume que existe una lista de empleados dados de alta con un nombre mostrable, y especifica el acceso al panel y el regreso, pero no el alta, la edición ni el borrado de la ficha, ni qué campos tiene. Le traslada dos restricciones ya decididas aquí: el campo nombre se piensa corto porque la rejilla lo trunca, y no existe el concepto de empleado inactivo.
- **Turno planificado como concepto de dominio** (spec pendiente). Este change especifica qué muestra la celda de un turno (hasta dos tramos, con hora de inicio y fin en 24h), qué acciones ofrece, a qué día pertenece un turno que cruza la medianoche y la validación mínima de las horas introducidas. No especifica las reglas del turno: solapamiento entre los dos tramos de un mismo día, duración mínima o máxima, ni el cómputo de horas planificadas.
- **Ausencia y vacaciones como concepto de dominio** (spec pendiente). Este change las trata como dos estados distinguibles de la celda que se marcan día a día, pero no especifica si hay más tipos de ausencia, el marcado por rango de días, ni si se justifica o se computa de alguna forma.
- **Registro de horas realmente trabajadas** (spec pendiente, fuera de alcance). El cuadrante muestra turno planificado, nunca hora registrada. La distinción entre ambos términos se mantiene en toda la delta.
- **Ajustes de la app** (spec pendiente, fuera de alcance): nombre comercial, nombre del local y nombre del responsable. La pantalla del cuadrante no da por hecho ningún nombre concreto.
- **Persistencia** (fuera de alcance): esquema SQLite y store de Zustand. La delta describe comportamiento observable; el `design.md` del change de persistencia decidirá el cómo.
- **Exportación a PDF/CSV** (spec pendiente, fuera de alcance). No se especifica ningún acceso a exportación desde esta pantalla en este change.

## Impact

- **Código nuevo**: ruta raíz de expo-router con la pantalla del cuadrante, componentes de rejilla, cabecera de semana con navegación, leyenda de etiquetas, celda con uno o dos tramos, hoja de acciones de celda con confirmación de borrado, estado vacío. Una ruta provisional para el panel de empleados que el change del panel sustituye.
- **Dependencias**: ninguna nueva. Se implementa con el stack ya fijado (Expo SDK 57, expo-router, React Native, TypeScript).
- **Datos**: ninguno propio. La pantalla lee turnos planificados, ausencias, vacaciones y empleados de los modelos que definan los changes de persistencia y de panel de empleados.
- **Privacidad**: la pantalla muestra únicamente el nombre del empleado; no muestra teléfono ni email.
- **Verificación**: buena parte de los escenarios son visuales (legibilidad y área pulsable con 20 empleados, ausencia de scroll horizontal en una pantalla de 360 pt, legibilidad de una celda con dos tramos) y se comprobarán en `docs/verificacion-manual.md` citando el nombre literal del escenario.
