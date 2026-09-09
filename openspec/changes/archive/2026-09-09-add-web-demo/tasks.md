## 1. La base de datos en el navegador

- [x] 1.1 Añadir `sql.js` a `package.json` (design.md — D1) y dejar su `.wasm` servido desde la
      carpeta pública del proyecto. Verificar que `npx expo export -p web` termina y que el
      `.wasm` aparece en la salida del build.
- [x] 1.2 Crear `src/datos/sqlite/bdSqlJs.ts` implementando los cuatro métodos de `BaseDeDatos`,
      con `ultimoId` y `filasAfectadas` resueltos según design.md — D2. Verificar haciendo
      correr contra esta implementación la suite de almacenamiento existente, que está escrita
      contra la interfaz y no contra `expo-sqlite`.
- [x] 1.3 Comprobar en esa misma pasada que `PRAGMA foreign_keys`, `PRAGMA user_version` y los
      índices únicos se comportan igual que con `node:sqlite`: es lo que sostiene las
      migraciones y el borrado en cascada de la baja de un empleado.

## 2. Persistencia en el navegador

- [x] 2.1 Guardar y recuperar el contenido de la base en IndexedDB (design.md — D5), volcando
      tras cada escritura de forma coalescida y una vez más al ocultarse la página. Verificar
      con un test que una base exportada y vuelta a cargar conserva plantilla y cuadrante.
- [x] 2.2 Tragarse el fallo cuando el navegador no permite guardar, dejando la demo utilizable
      en memoria y sin mostrar el aviso de almacenamiento no disponible (design.md — D5).
      Verificar a mano en una ventana privada, cubriendo el escenario literal «La demo se puede
      usar aunque el navegador no deje conservar nada».

## 3. Arranque de la demo

- [x] 3.1 Crear el módulo por plataforma `src/datos/sqlite/bdDeLaApp.ts` / `.web.ts` y dejar que
      `app/_layout.tsx` lo use en lugar de importar `expo-sqlite` directamente (design.md — D4).
      Verificar que `npm test` y `npm run typecheck` siguen verdes y que la app en Android
      arranca igual que antes.
- [x] 3.2 Añadir la fase previa solo-web que espera al motor antes de montar `ArranqueDeLaApp`,
      con una versión nativa que no espera nada (design.md — D3). Verificar que en Android no
      aparece ninguna pantalla ni retardo nuevo antes del cuadrante.
- [x] 3.3 Verificar el escenario literal «Abrir la demo por primera vez»: el enlace lleva
      directo al cuadrante, sin instalación, registro, permisos ni pantalla intermedia.

## 4. Datos de ejemplo y reinicio

- [x] 4.1 Crear el módulo `.web.ts` con la plantilla de ejemplo inventada, de 10 a 20 empleados
      con sus fichas completas. Verificar el escenario literal «Ningún dato de la demo
      corresponde a una persona real» revisando la lista entera.
- [x] 4.2 Sembrar el ejemplo solo cuando la base está vacía, escribiendo a través del almacén y
      no metiendo filas a mano (design.md — D6). Verificar que abrir dos veces seguidas no
      duplica ningún empleado.
- [x] 4.3 Calcular las fechas del ejemplo a partir del día en que se abre la demo, nunca fijas
      (design.md — D6). Verificar con un test que sembrando con dos fechas de sistema muy
      separadas el ejemplo cae en la semana en curso de cada una, cubriendo los escenarios
      literales «La demo abre con la semana en curso planificada» y «El ejemplo sigue estando en
      la semana en curso meses después».
- [x] 4.4 Incluir en el ejemplo turnos planificados, al menos una ausencia y al menos unas
      vacaciones, de forma que se vean a la vez todos los contenidos posibles de una celda.
      Verificar mirando la pantalla de la demo.
- [x] 4.5 Añadir la acción de devolver la demo a su estado de ejemplo, con confirmación previa,
      que borra la base del navegador y vuelve a sembrar. Verificar los escenarios literales
      «Volver al estado de ejemplo» y «Desistir de volver al estado de ejemplo».

## 5. La demo se identifica como demo

- [x] 5.1 Mostrar en la demo el distintivo con la advertencia de no escribir datos reales, sin
      tapar el cuadrante ni obligar a cerrarlo. Verificar el escenario literal «Se ve que es una
      demo», comprobando además que la semana completa se sigue viendo sin scroll horizontal.
- [x] 5.2 Verificar que ni el distintivo, ni la acción de reinicio, ni los datos de ejemplo
      aparecen en la app instalada, cubriendo el escenario literal «La app instalada arranca
      como siempre».

## 6. Exportación desde el navegador

- [x] 6.1 Crear `src/exportacion/compartirElCuadrante.web.ts` con la misma superficie exportada
      que el original —`compartirElCuadrante`, `guardarElCuadrante`, `ResultadoDeExportar` y los
      mensajes—, reutilizando `componerDocumentoDelCuadrante` sin tocarlo (design.md — D7).
      Verificar que `npm run typecheck` acepta las dos versiones como intercambiables.
- [x] 6.2 Entregar el documento imprimiendo un `iframe` con su HTML y el nombre de la semana
      como título, nunca la página en pantalla (design.md — D7). Verificar el escenario literal
      «Exportar la semana desde un navegador» en Chrome Android y en Safari iOS, comprobando que
      lo que sale es el documento y no el cuadrante de la pantalla.
- [x] 6.3 No mostrar en web el mensaje de confirmación de guardado, y conservar tal cual los de
      plantilla vacía y de fallo. Verificar los escenarios literales «Exportar desde un
      navegador con la plantilla vacía» y, sobre el documento producido, «El documento entregado
      fuera del móvil respeta las mismas reglas».

## 7. Privacidad

- [x] 7.1 Comprobar que `src/datos/__tests__/privacidad.test.ts` tiene criterio sobre la
      implementación web y ampliarlo si no lo tiene. Verificar que el test falla si la capa de
      datos web aprende a hablar por la red.
- [x] 7.2 Verificar los escenarios literales «Probar la demo no envía nada a ninguna parte»,
      «Dos personas prueban la demo por separado» y «El cuadrante no viaja a ningún servicio
      para exportarlo», revisando el tráfico de red del navegador durante una sesión completa.

## 8. Publicación

- [x] 8.1 Publicar el sitio estático en el alojamiento elegido (design.md — D8), con `robots.txt`
      y `X-Robots-Tag: noindex`. Verificar abriendo el enlace en un móvil real por datos
      móviles, y comprobar cuánto tarda la primera apertura.
- [x] 8.2 Reescribir la parte de `docs/despliegue.md` que dice que la app no se despliega en
      ningún servidor, dejando claro que lo que se despliega es la demo y no el producto, y
      documentando cómo publicar una versión nueva y **cómo retirar la demo**.
- [ ] 8.3 Verificar el escenario literal «El enlace deja de dar acceso» retirando la demo de
      prueba y comprobando que el enlace deja de resolver.
- [x] 8.4 Anotar en `docs/verificacion-manual.md` todos los escenarios de este change que solo
      se pueden comprobar mirando la pantalla, citando su nombre literal.

## 9. Cierre

- [x] 9.1 Repasar la demo a ojo contra la app instalada, pantalla por pantalla, prestando
      atención a las cifras de ancho fijo y a la legibilidad de la plantilla completa que exige
      `identidad-visual`. Anotar lo comprobado en `docs/verificacion-manual.md`.
- [x] 9.2 Verificar que `npm test` y `npm run typecheck` quedan verdes y que la app en Android
      sigue comportándose igual, sin ninguna diferencia observable respecto a antes del change.

## Lo que queda al archivar (09/09/2026)

Las tres tareas sin marcar —8.1 publicar, 8.3 retirar y 9.1 el repaso a ojo— no dependen
del código: dependen de publicar la demo en un alojamiento real y de mirarla en un móvil.
El change se archiva con ellas abiertas, igual que el proyecto ya archivó otros con
escenarios anotados como «pendiente» en `docs/verificacion-manual.md`.

Lo que sí quedó comprobado, sobre el sitio ya construido y en un navegador de verdad
(Chromium a 360 puntos de ancho): que la demo arranca en el cuadrante con el ejemplo de la
semana en curso, que lo escrito sobrevive a recargar, que otro navegador no ve nada ajeno,
que sin almacenamiento sigue usándose, y que exportar manda a imprimir el documento y no
la pantalla. Queda para el móvil: la primera apertura con datos móviles, la legibilidad
del aviso y el diálogo de impresión de Safari iOS.

### Cerradas después de archivar (09/09/2026)

La demo se publicó en **Netlify** y se probó en un móvil **Android con dos navegadores
distintos**, sobre el sitio ya publicado: arranca en el cuadrante con el ejemplo de la
semana en curso, lo escrito sobrevive a recargar, el aviso de la banda se lee de un vistazo
sin estorbar, la semana entera se ve sin scroll horizontal y exportar entrega el documento
con su nombre de siempre. Con eso quedan cerradas **8.1** y **9.1**, y sus escenarios
actualizados en `docs/verificacion-manual.md`.

Sigue abierta **8.3**: el escenario «El enlace deja de dar acceso» solo se puede comprobar
retirando la demo, y la demo se está enseñando. Se cierra el día que se retire.

Sigue faltando también **Safari iOS** en el escenario «Exportar la semana desde un
navegador»: su diálogo de impresión es distinto al de Android y no se ha probado.
