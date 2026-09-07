# Tareas

Referencia de comportamiento: `specs/cuadrante-semanal/spec.md`. No se crea `design.md`: no hay dependencia nueva que justificar y el cambio se resuelve con el stack ya fijado.

Frontera con los changes pendientes listados en `proposal.md` — Dependencias: la pantalla lee empleados, turnos planificados, ausencias y vacaciones a través de una capa de acceso a datos cuya interfaz define esta pantalla. Mientras no existan los changes de persistencia y de panel de empleados, esa capa se implementa en memoria y se sustituye después sin tocar la pantalla. El panel de empleados se resuelve aquí con una ruta provisional (tarea 8.1) que el change del panel sustituye.

## 1. Andamiaje mínimo del proyecto

- [x] 1.1 Inicializar el proyecto Expo SDK 57 con TypeScript y expo-router usando únicamente el stack ya fijado, sin dependencias adicionales; verificar que `npx expo start` arranca y que `package.json` no incorpora ninguna dependencia fuera de las del stack
- [x] 1.2 Configurar la suite de tests automatizados del proyecto; verificar que `npm test` ejecuta y pasa con un test trivial
- [x] 1.3 Crear `docs/verificacion-manual.md` vacío con la estructura para anotar escenarios verificables solo mirando la pantalla; verificar que el fichero existe y explica cómo se cita el nombre literal del escenario

## 2. Modelo de semana y formatos

- [x] 2.1 Implementar el cálculo de la semana de lunes a domingo que contiene una fecha dada y el desplazamiento de ±7 días; verificar con tests que cubren el escenario "Abrir la app un día cualquiera de la semana" y "Abrir la app en domingo"
- [x] 2.2 Implementar el formateo de fechas dd/mm/aaaa y de horas 24h `hh:mm` en español de España; verificar con tests que cubren el escenario "Rango de fechas de la semana visible" y la parte de formatos del escenario "Formatos de la pantalla"
- [x] 2.3 Implementar el orden alfabético español de los nombres de empleado, sin ninguna agrupación adicional; verificar con un test que cubre el escenario "Orden alfabético estable entre semanas"
- [x] 2.4 Implementar la clasificación de un turno planificado según sus horas — normal, cruce de medianoche cuando el fin es anterior al inicio, e inválido cuando fin e inicio coinciden; verificar con tests que cubren la aceptación del cruce de medianoche y el rechazo del turno de duración nula

## 3. Capa de acceso a datos provisional

- [x] 3.1 Definir los tipos que la pantalla necesita — empleado con nombre mostrable, y contenido de celda en uno de sus cuatro estados: uno o dos turnos planificados con hora de inicio y fin, ausencia, vacaciones o vacío, con el tipo impidiendo por construcción un tercer turno; verificar que compilan con `tsc --noEmit`
- [x] 3.2 Implementar en memoria las lecturas y escrituras que consume la pantalla (empleados de la plantilla, contenido de la semana, crear/editar/eliminar un turno concreto de una celda, marcar y quitar ausencia o vacaciones); verificar con tests que una escritura queda reflejada en la lectura siguiente y que la plantilla devuelta es siempre la actual, sea cual sea la semana consultada
- [x] 3.3 Dejar documentado en el propio módulo que esta implementación es provisional y que el change de persistencia la sustituye sin cambiar la interfaz; verificar leyendo el módulo que la pantalla no accede a datos por ninguna otra vía

## 4. Rejilla del cuadrante

- [x] 4.1 Implementar la ruta raíz de expo-router con la pantalla del cuadrante, sin pantalla intermedia; verificar con un test de navegación que la ruta raíz renderiza el cuadrante y anotar en `docs/verificacion-manual.md` el escenario "Abrir la app un día cualquiera de la semana"
- [x] 4.2 Implementar la cabecera de la pantalla con el rango de fechas de la semana y la indicación explícita de semana en curso; verificar con tests que cubren los escenarios "Rango de fechas de la semana visible" y "La semana en curso se distingue de las demás"
- [x] 4.3 Implementar la rejilla de filas de empleado por columnas de lunes a domingo, con cabecera de día y fecha y sin scroll horizontal; verificar con un test que se renderizan siete columnas en orden y anotar en `docs/verificacion-manual.md` los escenarios "La semana completa se ve sin scroll horizontal" y "Cabeceras de día con su fecha"
- [x] 4.4 Implementar el scroll vertical de la plantilla con la cabecera de días fija; verificar en `docs/verificacion-manual.md` el escenario "La cabecera de días acompaña al scroll vertical"
- [x] 4.5 Implementar el reparto de anchos — siete columnas de día iguales de al menos 44 puntos y columna de nombres con el resto — con 360 puntos como ancho mínimo soportado; verificar con un test que a 360 puntos ninguna columna de día baja de 44 puntos y anotar en `docs/verificacion-manual.md` el escenario "El cuadrante en la pantalla más estrecha soportada"
- [x] 4.6 Ajustar el dimensionado de la celda para que con 20 empleados las horas se muestren completas y el área pulsable sea de al menos 44 × 44 puntos; verificar con un test que la celda declara ese área mínima y anotar en `docs/verificacion-manual.md` el escenario "Ver el cuadrante con 20 empleados en plantilla"
- [x] 4.7 Implementar el truncado con puntos suspensivos del nombre que no cabe en su columna, sin estrechar las columnas de día; verificar con un test que cubre el escenario "Un nombre largo se trunca sin estrechar los días"
- [x] 4.8 Comprobar que la fila del empleado muestra solo el nombre, nunca teléfono ni email; verificar con un test que la pantalla no renderiza esos campos
- [x] 4.9 Comprobar que las filas son siempre la plantilla actual en cualquier semana; verificar con un test que cubre el escenario "Un empleado borrado desaparece también de las semanas pasadas"

## 5. Navegación entre semanas

- [x] 5.1 Implementar las acciones de semana anterior y semana siguiente, siempre disponibles y sin límite de desplazamiento; verificar con tests que cubren los escenarios "Navegar a la semana anterior" y la primera mitad de "Navegar a la semana siguiente y volver a la semana en curso"
- [x] 5.2 Implementar la acción de regreso a la semana en curso, visible solo fuera de ella y efectiva con un toque desde cualquier semana; verificar con tests que cubren los escenarios "Navegar a la semana siguiente y volver a la semana en curso" y "Regreso desde una semana lejana con un solo toque"
- [x] 5.3 Implementar el recálculo de la semana en curso cuando la app vuelve a primer plano, sin mover la semana mostrada mientras la pantalla sigue en primer plano; verificar con un test que cubre el escenario "La app vuelve a primer plano ya en la semana siguiente"

## 6. Contenido y estados de la celda

- [x] 6.1 Implementar la celda con turno planificado mostrando hora de inicio y fin en 24h; verificar con un test que cubre el escenario "Ver un turno planificado en su celda"
- [x] 6.2 Implementar la celda con dos turnos el mismo día, con los dos pares de horas completos, ordenados por hora de inicio y sin indicador de contenido oculto; verificar con un test que cubre el escenario "Ver un turno partido en su celda" y anotar en `docs/verificacion-manual.md` su legibilidad a 360 puntos de ancho
- [x] 6.3 Implementar la celda de un turno que cruza la medianoche, mostrado en el día de inicio y sin marca en el día siguiente; verificar con un test que cubre el escenario "Ver un turno que cruza la medianoche"
- [x] 6.4 Implementar las celdas de ausencia y de vacaciones con las etiquetas `AUS` y `VAC` y sin horas, distinguibles entre sí y de las demás sin depender solo del color; verificar con tests que cubren los escenarios "Ver una celda de vacaciones" y "Ver una celda de ausencia", y anotar la distinción visual en `docs/verificacion-manual.md`
- [x] 6.5 Implementar la leyenda permanente que asocia `AUS` con Ausencia y `VAC` con Vacaciones, visible sin desplazarse por la rejilla; verificar con un test que cubre el escenario "La leyenda explica las etiquetas de la celda"
- [x] 6.6 Implementar la celda vacía, pulsable y sin texto que sugiera turno planificado; verificar con un test que cubre el escenario "Semana sin ningún turno planificado"
- [x] 6.7 Comprobar que la celda nunca muestra horas realmente trabajadas ni ningún aviso de cumplimiento normativo; verificar con un test que cubre el escenario "La pantalla no valora el cumplimiento normativo"

## 7. Acciones de la celda

- [x] 7.1 Implementar la apertura de las acciones de celda al tocarla, con el juego de acciones que corresponde a cada estado —incluido el de dos turnos, que no ofrece añadir un tercero y ofrece editar y eliminar cada turno por separado— y usando siempre las palabras completas Ausencia y Vacaciones; verificar con tests que cada estado ofrece exactamente las acciones que la spec le asigna
- [x] 7.2 Implementar crear turno planificado con horas en 24h desde una celda vacía; verificar con un test que cubre el escenario "Crear un turno planificado en una celda vacía"
- [x] 7.3 Implementar editar un turno planificado existente; verificar con un test que cubre el escenario "Editar un turno planificado existente"
- [x] 7.4 Implementar añadir un segundo turno el mismo día y editar o eliminar cada uno por separado; verificar con tests que cubren los escenarios "Añadir un segundo turno el mismo día" y "Eliminar solo uno de los dos turnos de un día"
- [x] 7.5 Implementar el rechazo del turno cuyo fin coincide con su inicio, con explicación y sin perder lo introducido, y la aceptación del turno que cruza la medianoche; verificar con tests que cubren los escenarios "Un turno cuyo fin coincide con su inicio no se guarda" y "Crear un turno que cruza la medianoche"
- [x] 7.6 Implementar marcar y cambiar ausencia y vacaciones desde la celda, incluida la sustitución por turno planificado; verificar con un test que cubre el escenario "Ver una celda de vacaciones y editarla desde el propio cuadrante"
- [x] 7.7 Implementar eliminar el contenido de la celda con confirmación explícita y sin deshacer; verificar con tests que cubren los escenarios "Eliminar el contenido de una celda" y "Desistir de una eliminación"
- [x] 7.8 Comprobar que una celda de una semana pasada ofrece las mismas acciones y sin avisos adicionales; verificar con un test que cubre el escenario "Editar una celda de una semana ya pasada"
- [x] 7.9 Implementar la vuelta al cuadrante en la misma semana al terminar o cancelar la acción; verificar con tests que cubren los escenarios "Cancelar sin cambiar nada" y "Editar una celda de una semana distinta de la actual"

## 8. Panel de empleados y estado vacío

- [x] 8.1 Crear la ruta provisional del panel de empleados: una pantalla mínima que solo permite dar de alta y borrar empleados por nombre, documentada en el propio módulo como sustituible por el change del panel de empleados sin tocar el cuadrante; verificar leyendo el módulo que el cuadrante no depende de nada más que de esa ruta
- [x] 8.2 Implementar el acceso permanente al panel de empleados desde el cuadrante y el regreso a la misma semana; verificar con un test de navegación que cubre el escenario "Ir al panel de empleados y volver al cuadrante"
- [x] 8.3 Implementar la actualización de las filas al volver del panel; verificar con un test que cubre el escenario "Un empleado nuevo aparece como fila al volver"
- [x] 8.4 Implementar el estado vacío sin empleados, con mensaje y acción hacia el panel de empleados, y sin cabecera de semana, navegación entre semanas ni leyenda de etiquetas; verificar con un test que cubre el escenario "Abrir la app sin ningún empleado dado de alta"
- [x] 8.5 Implementar la transición del estado vacío a la rejilla tras dar de alta al primer empleado; verificar con un test que cubre el escenario "El cuadrante aparece tras dar de alta al primer empleado"

## 9. Cierre

- [x] 9.1 Revisar que todos los textos de la pantalla están en español de España, que no hay ningún literal en otro idioma y que las únicas abreviaturas son `AUS` y `VAC` dentro de la celda; verificar con un test que cubre el escenario "Formatos de la pantalla"
- [x] 9.2 Comprobar que cada escenario de `specs/cuadrante-semanal/spec.md` está citado literalmente en un test o en `docs/verificacion-manual.md`; verificar recorriendo la spec escenario a escenario que ninguno queda sin cubrir
- [x] 9.3 Ejecutar `npm test` y `tsc --noEmit`; verificar que ambos pasan sin errores
