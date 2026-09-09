## Why

Lo que el encargado planifica se pierde al cerrar la app. La plantilla persiste desde
`add-employee-storage`, pero los turnos planificados, las ausencias y las vacaciones viven en
un `Map` en memoria: al cerrar, el cuadrante vuelve vacío. Planificar la semana es el trabajo
principal del encargado y es justo lo único que no sobrevive.

No es un hueco meramente pendiente: la spec viva de `cuadrante-semanal` **ya lo exige**. Su
escenario «Lo copiado no sobrevive a cerrar la app» termina diciendo que, tras cerrar y
reabrir, «el cuadrante muestra los mismos turnos planificados que antes de cerrarla». El
sistema no lo cumple. Es un defecto contra una spec publicada.

Pasó desapercibido porque el escenario está cubierto a medias: `src/ui/__tests__/loCopiado.test.ts`
comprueba que el portapapeles no se rehidrata, pero no comprueba la frase sobre los turnos, y
esa mitad no aparece tampoco en `docs/verificacion-manual.md`. Es el único escenario del
proyecto que hoy no está cubierto ni por un test ni por el ojo.

**Decisión de negocio (09/09/2026)**: detectado al probar el primer build instalable en el
dispositivo. Hasta que esto quede resuelto, **el APK no se entrega al encargado**: una app que
pierde el cuadrante al cerrarse no es utilizable, y entregarla enseñaría al encargado a
desconfiar de ella.

## What Changes

- Los turnos planificados, las ausencias y las vacaciones pasan a guardarse en la base de
  datos del dispositivo, igual que ya se guarda la ficha del empleado. Se conservan al cerrar
  y reabrir la app, sin que el encargado guarde nada a mano.
- La persistencia alcanza a **todas las semanas**, no solo a la que se está viendo: el
  cuadrante ya se navega hacia atrás y hacia delante, y lo planificado en cualquier semana
  debe seguir ahí al volver.
- Dar de baja a un empleado sigue sin dejar nada suyo detrás, ahora también en lo guardado:
  sus turnos, ausencias y vacaciones desaparecen con él.
- **No cambia nada de lo que se ve ni de cómo se usa.** Ninguna pantalla nueva, ningún botón
  nuevo, ningún paso más por operación. El único cambio observable es que lo planificado sigue
  ahí al volver a abrir.

Fuera de alcance, con su motivo:

- **Un botón o icono para cerrar la app a mano.** Decisión de negocio (09/09/2026): descartado.
  No resolvería el problema —un fallo inesperado o Android matando la app en segundo plano no
  consultan a nadie—, no es convención de Android, y contradice lo que ya exige
  `almacenamiento-empleados`: que conservar los datos no dependa de que el encargado «cierre la
  app de ninguna forma concreta».
- **Extender el aviso «Guardado» al cuadrante.** Decisión de negocio (09/09/2026): va aparte si
  algún día hace falta. En la ficha el aviso resuelve que escribir texto no confirma nada; en
  el cuadrante, la celda cambia y muestra el turno, así que la rejilla ya es la confirmación.
- **El registro de horas realmente trabajadas.** Es la tercera pata del producto y tampoco está
  construida, pero es un change propio y no bloquea la entrega.
- **Copia de seguridad o exportación de la base de datos.** Sigue pendiente y sigue siendo el
  otro hueco conocido del despliegue.

## Capabilities

### New Capabilities

- `almacenamiento-cuadrante`: qué se conserva del cuadrante en el dispositivo —turnos
  planificados, ausencias y vacaciones, de cualquier semana—, que se conserva sin intervención
  del encargado, que sobrevive al cierre de la app, y que no queda nada de un empleado dado de
  baja.

**Decisión de negocio (09/09/2026)**: se describe como capability nueva y no ampliando
`almacenamiento-empleados`. Esa capability habla de la ficha —nombre, puesto, teléfono, email,
nota, motivo— y su propósito lo dice explícitamente; meterle el cuadrante la haría mentir sobre
sí misma. La organización de las specs ya separa el almacenamiento de la pantalla
(`almacenamiento-empleados` frente a `panel-empleados`), así que `almacenamiento-cuadrante`
junto a `cuadrante-semanal` sigue la casa.

### Modified Capabilities

Ninguna. `cuadrante-semanal` describe ya el comportamiento correcto y no cambia ni una línea:
lo que cambia es que pase a cumplirse. El escenario «Lo copiado no sobrevive a cerrar la app»
se queda tal cual —lo copiado debe seguir sin sobrevivir— y gana por fin la cobertura de su
segunda mitad.

## Impact

**Datos**

- Migración nueva al final de `src/datos/sqlite/migraciones.ts`, con las tablas de turnos,
  ausencias y vacaciones. Las tres cuelgan del empleado con
  `empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE`, que es la regla 2
  que el propio fichero fija para toda tabla futura. `PRAGMA foreign_keys = ON` ya se activa en
  cada apertura desde `conexion.ts` precisamente para que esa cascada funcione.
- Adaptador nuevo en `src/datos/sqlite/`, hermano de `almacenEmpleadosSqlite.ts`.
- `src/datos/almacenCuadrante.ts` deja de guardar celdas en memoria y pasa a delegar en el
  adaptador. Su cabecera, que hoy avisa de que «las celdas del cuadrante siguen en memoria y se
  pierden al cerrar la app», deja de ser cierta y hay que reescribirla.

**Interfaz**: sin cambios esperados. `instalarAlmacen` ya abstrae el almacén y ninguna pantalla
accede a los datos por otra vía.

**Tests**: `src/ui/__tests__/loCopiado.test.ts` cubre hoy media escena y su nombre promete la
entera; hay que cerrar la mitad que falta. Los 409 tests actuales deben seguir verdes.

**Dependencias**: ninguna nueva.

**Despliegue**: `docs/despliegue.md` marca hoy esto como bloqueante para entregar el APK. Al
terminar, ese bloqueo se retira y se construye un binario nuevo con el `versionCode` subido.
