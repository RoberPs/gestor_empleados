## 1. Esquema

- [x] 1.1 Añadir la migración 4 al final de `MIGRACIONES` en `src/datos/sqlite/migraciones.ts`
      con las tablas `celdas` y `turnos` de design.md — D1, sin editar ninguna de las tres
      migraciones publicadas. Verificar con un test en
      `src/datos/sqlite/__tests__/migraciones.test.ts` que una base nueva queda en
      `user_version = 4` y que las dos tablas existen con sus columnas.
- [x] 1.2 Añadir los índices `celdas (dia)` y `turnos (empleado_id, dia)` de design.md — D4.
      Verificar consultando `PRAGMA index_list` en el mismo test.
- [x] 1.3 Verificar con un test que la migración 4 aplicada sobre una base que ya tiene
      plantilla conserva intactas todas las fichas, cubriendo el escenario literal «Una
      instalación con plantilla conserva sus fichas».
- [x] 1.4 Verificar con un test que `PRIMARY KEY (empleado_id, dia)` rechaza una segunda fila
      para el mismo empleado y día, y que el `CHECK` de `tipo` rechaza un valor que no sea
      `turnos`, `ausencia` ni `vacaciones`.

## 2. Adaptador del cuadrante sobre SQLite

- [x] 2.1 Crear `src/datos/sqlite/almacenCuadranteSqlite.ts` con la conversión de fila a
      `ContenidoCelda` y de `Hora` a texto `hh:mm` de design.md — D3, tomando
      `almacenEmpleadosSqlite.ts` como plantilla. Verificar con tests de ida y vuelta que una
      celda escrita se lee idéntica en los cuatro estados.
- [x] 2.2 Implementar `leerCelda` y `leerSemana` con la consulta por rango de design.md — D4.
      Verificar que `leerSemana` devuelve solo los días de la semana pedida y que una celda sin
      fila se lee como `CELDA_VACIA`.
- [x] 2.3 Implementar `crearTurno`, `editarTurno` y `eliminarTurno`, respetando que crear un
      tercer turno no haga nada (design.md — D2) y que eliminar el último turno borre la fila de
      `celdas`. Verificar con tests que la celda queda vacía al eliminar el último turno y que
      el identificador del turno que queda no cambia al eliminar el otro.
- [x] 2.4 Implementar al leer la tolerancia de design.md — D2: con tres filas de turno el mismo
      día se devuelven las dos primeras por hora de inicio en lugar de lanzar. Verificar
      insertando tres filas a mano en el test.
- [x] 2.5 Implementar `marcarAusencia`, `marcarVacaciones` y `vaciarCelda`. Verificar que
      cambiar de estado una celda con turnos borra sus turnos por la cascada, sin sentencia
      aparte.
- [x] 2.6 Implementar `leerRangosDeVacaciones` y `contarDiasConContenido` reutilizando
      `agruparEnRangos` del dominio (design.md — D6). Verificar que los tramos contiguos se
      agrupan igual que en la implementación en memoria.
- [x] 2.7 Implementar `marcarRangoDeVacaciones`, `eliminarRangoDeVacaciones` y `pegarEnCelda`
      en una sola transacción con un único `avisar()` al final (design.md — D5). Verificar con
      un oyente suscrito que cada una de las tres avisa **exactamente una vez**, sea cual sea el
      número de celdas que toque.
- [x] 2.8 Verificar que los tests existentes de `src/datos/__tests__/pegarEnCelda.test.ts` pasan
      también contra el adaptador de SQLite, no solo contra el almacén en memoria.

## 3. Composición y arranque

- [x] 3.1 Componer el almacén en `src/datos/almacenCuadrante.ts` con el adaptador nuevo, sin
      cambiar ni una firma de la interfaz `AlmacenCuadrante`. Verificar con `npm run typecheck`
      y comprobando que ningún fichero de `src/ui/` ni de `app/` aparece en el diff.
- [x] 3.2 Mantener `crearAlmacenCuadranteEnMemoria` para los tests de pantalla (design.md — D7).
      Verificar que los tests de `src/ui/__tests__/` siguen pasando sin tocarlos.
- [x] 3.3 Reescribir la cabecera de `almacenCuadrante.ts`: hoy dice que «las celdas del cuadrante
      siguen en memoria y se pierden al cerrar la app» y pasa a ser falsa. Verificar leyéndola
      contra la spec nueva.
- [x] 3.4 Verificar que `src/datos/__tests__/privacidad.test.ts` sigue pasando con el adaptador
      nuevo dentro de `src/datos/`, cubriendo el escenario literal «Planificar no envía nada a
      ninguna parte».

## 4. Cobertura de los escenarios de la spec

- [x] 4.1 Cubrir los siete escenarios literales del requisito «El cuadrante sobrevive al cierre
      de la app», simulando el cierre con una base de datos reabierta sobre el mismo fichero:
      «Un turno planificado sigue en su celda tras reabrir la app», «Un día con dos turnos
      sobrevive entero», «Un turno que cruza la medianoche sobrevive en el día en que empieza»,
      «Una ausencia sobrevive al cierre», «Unas vacaciones sobreviven al cierre», «Una celda
      vaciada sigue vacía tras reabrir» y «El cuadrante entero sobrevive a varias reaperturas».
- [x] 4.2 Cubrir los tres escenarios literales de «Se conserva el cuadrante de cualquier semana»:
      «Una semana pasada sigue planificada», «Una semana futura sigue planificada» y
      «Planificar una semana no borra las demás».
- [x] 4.3 Cubrir los dos escenarios literales de «Toda escritura del cuadrante queda reflejada en
      la lectura siguiente»: «Sustituir el contenido de una celda» y «Lo pegado en una celda se
      conserva».
- [x] 4.4 Cubrir los tres escenarios literales de «La baja de un empleado no deja nada suyo en el
      cuadrante»: «Dar de baja borra lo planificado del empleado», «La baja de uno no toca el
      cuadrante de los demás» y «Un alta con el mismo nombre empieza sin cuadrante». El primero
      debe comprobar la cascada de punta a punta —ni fila en `celdas` ni fila en `turnos`—, no
      que el SQL la declare.
- [x] 4.5 Cubrir el escenario literal «A partir de esa apertura el cuadrante ya se conserva».
- [x] 4.6 Cerrar la mitad huérfana del escenario de `cuadrante-semanal` «Lo copiado no sobrevive
      a cerrar la app»: hoy `src/ui/__tests__/loCopiado.test.ts` comprueba que el portapapeles
      no se rehidrata, pero no que «el cuadrante muestra los mismos turnos planificados que
      antes de cerrarla». Verificar que el test cubre las dos mitades.
- [x] 4.7 Verificar que no queda ningún escenario de `almacenamiento-cuadrante` sin cubrir:
      recorrer la spec escenario a escenario y comprobar que cada nombre literal aparece en un
      test o en `docs/verificacion-manual.md`.

## 5. Comprobación completa

- [x] 5.1 Ejecutar `npm test` y verificar que pasan los 409 tests previos más los nuevos, sin
      ninguno saltado.
- [x] 5.2 Ejecutar `npm run typecheck` y verificar que termina sin errores.

## 6. Entrega

- [x] 6.1 Retirar de `docs/despliegue.md` el bloqueante «el cuadrante no se guarda» y dejar
      anotada la fecha en que se resolvió. Verificar que el documento ya no dice que el APK no
      se entrega.
- [x] 6.2 Subir `versionCode` en `app.json` y construir el APK con
      `npx eas-cli build --platform android --profile produccion`. Verificar que el build termina
      en `FINISHED` y que `expo doctor` pasa sus 21 checks.
- [x] 6.3 Instalar el APK en la copia del desarrollador y comprobar a mano lo que solo se ve en
      el dispositivo: planificar una semana, cerrar la app del todo desde el selector de
      aplicaciones, reabrirla desde su icono y ver que el cuadrante sigue ahí. Anotar fecha,
      dispositivo y resultado en `docs/verificacion-manual.md`.
- [x] 6.4 Aprovechar la instalación para cerrar los escenarios que seguían pendientes de un build
      instalable en `docs/verificacion-manual.md`, empezando por «Abrir la app un día cualquiera
      de la semana».
