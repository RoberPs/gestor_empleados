## Context

Ver `proposal.md` — Why para la motivación y las decisiones de negocio del 07/09/2026.

Lo que condiciona el cómo es el estado del código:

- `src/ui/tema.ts` ya centraliza **todos** los colores de la app: no hay un solo literal hexadecimal fuera de ese fichero. Eso convierte el cambio de paleta en un cambio de un único fichero, más ajustes puntuales donde los componentes fijan pesos a mano.
- `tema.ts` exporta hoy dos objetos: `colores` (13 valores) y `tipografia` (7 tamaños). La escala tipográfica solo cubre tamaños; los pesos (`fontWeight`) y las variantes de cifra (`fontVariant`) están repartidos por catorce componentes, cada uno decidiendo por su cuenta.
- La geometría vive en `src/ui/medidas.ts` y está verificada a 360 puntos. La spec `identidad-visual` — «La identidad visual no altera el comportamiento ni la estructura» la deja fuera del cambio: `medidas.ts` no se toca.
- Las horas de la celda, el día del mes y el rango de la semana ya usan `fontVariant: ['tabular-nums']`; el resto de datos numéricos no.
- La suite de tests comprueba textos, `testID`, anchos declarados y área pulsable. No comprueba colores, así que no debería romperse; lo que no comprueba, y esta capability sí exige, se anota en `docs/verificacion-manual.md`.

## Goals / Non-Goals

**Goals:**

- Que `tema.ts` sea la única fuente de verdad del aspecto: color, tamaño, peso y variante de cifra. Un componente que quiera un peso lo pide al tema, no lo escribe.
- Que los valores de la paleta de la spec queden en el código con el mismo nombre de papel que usa la spec, para poder recorrer una y otro en paralelo.
- Que los mínimos de contraste de la spec queden comprobados con números, no a ojo.

**Non-Goals:**

- No se introduce un sistema de temas, ni un contexto de React, ni un proveedor: hay un solo aspecto y se lee por importación directa, como hoy.
- No se toca `medidas.ts`, ni la altura de fila, ni los márgenes internos, ni la jerarquía de la cabecera.
- No se refactorizan los componentes más allá de sustituir valores fijados a mano por valores del tema.
- No se añade soporte para el tamaño de letra del sistema (`fontScale`): sería comportamiento nuevo y necesita su propia propuesta.

## Decisions

### Extender `tema.ts` con `pesos` y `variantes`, en vez de dejar los pesos en los componentes

`tipografia` pasa a describir cada papel completo, no solo su tamaño. La forma más simple que cumple la spec es añadir dos objetos hermanos:

```ts
export const pesos = { regular: '400', medium: '500', bold: '700' } as const;
export const CIFRAS_TABULARES = ['tabular-nums'] as const;
```

y que cada componente componga `fontSize: tipografia.hora, fontWeight: pesos.medium`.

**Alternativa descartada**: exportar estilos ya compuestos por papel (`textos.hora`, `textos.titulo`). Es más limpio en el consumo, pero obliga a reescribir los catorce componentes y a mover decisiones de layout al tema; la spec no lo pide y contradice el «piel y micro-tipografía» acordado. Se puede hacer más adelante sin cambiar ningún requisito.

### Usar solo los pesos 400, 500 y 700

Android resuelve `fontWeight` mapeando a familias concretas de Roboto: 400 a `sans-serif`, 500 a `sans-serif-medium` y 700 a `sans-serif-bold`. Los pesos intermedios como 600 no tienen familia propia y caen a bold, con lo que la jerarquía prevista se aplana sin previo aviso. Por eso la escala de la spec habla de *regular*, *medium* y *bold* y nada más, aunque la referencia visual original pidiera un 600.

### Nombres de la paleta en español y por papel, no por color

Se conserva el criterio que ya sigue `tema.ts`: `lineaRejilla`, no `gris600`. Un nombre por papel permite comprobar la spec leyendo el código, y evita el clásico `azul` que acaba usándose para tres cosas distintas.

Cambios en la forma de `colores`:

| Clave de hoy | Clave nueva | Valor nuevo | Motivo |
| --- | --- | --- | --- |
| `fondo` | `fondo` | `#FFFFFF` | sin cambio |
| `fondoCabecera` | `fondoCabecera` | `#F1F3F5` | sin cambio |
| `texto` | `texto` | `#101418` | sin cambio |
| `textoSecundario` | `textoSecundario` | `#4A5560` | se oscurece: `#5b6570` da 5,9:1, suficiente, pero se unifica con el resto de la paleta |
| `borde` | `lineaRejilla` | `#848C95` | `#c7ccd1` da 1,5:1 contra blanco y no alcanza el 3:1 que exige la spec |
| `bordeFuerte` | `bordeFuerte` | `#101418` | sin cambio |
| `fondoSemanaEnCurso` | `fondoSemanaEnCurso` | `#E8EFFF` | sin cambio de papel |
| — | `accion` | `#1D4ED8` | nuevo: hoy las acciones son texto subrayado del color del cuerpo |
| `fondoAusencia` | `fondoAusencia` | `#FFF1DC` | pasa de rosa a ámbar para no confundirse con la acción destructiva |
| — | `tintaAusencia` | `#8A4008` | nuevo: texto y borde de la etiqueta `AUS` |
| `fondoVacaciones` | `fondoVacaciones` | `#E4F4E8` | sin cambio de papel |
| — | `tintaVacaciones` | `#14602F` | nuevo: texto y borde de la etiqueta `VAC` |
| `fondoAccionDestructiva` | `fondoAccionDestructiva` | `#FDECE7` | sin cambio |
| `textoAccionDestructiva` | `textoAccionDestructiva` | `#8C2F1A` | sin cambio |
| `velo` | `velo` | `rgba(16, 20, 24, 0.45)` | se tiñe con la tinta de la app en vez de negro puro |

Renombrar `borde` a `lineaRejilla` obliga a tocar los componentes que lo usan, pero es deliberado: el valor cambia de papel —pasa a ser una línea que debe verse— y un rename fuerza a revisar cada uso en lugar de heredarlo en silencio.

### Contraste: se comprueba con números y queda escrito

Ratios calculados contra el fondo sobre el que se dibuja cada color (WCAG 2.1):

| Pareja | Ratio | Mínimo exigido |
| --- | --- | --- |
| `#101418` sobre `#FFFFFF` | 17,6:1 | 4,5:1 |
| `#4A5560` sobre `#FFFFFF` | 7,3:1 | 4,5:1 |
| `#1D4ED8` sobre `#FFFFFF` | 6,7:1 | 4,5:1 |
| `#8A4008` sobre `#FFF1DC` | 6,7:1 | 4,5:1 |
| `#14602F` sobre `#E4F4E8` | 6,7:1 | 4,5:1 |
| `#8C2F1A` sobre `#FDECE7` | 7,2:1 | 4,5:1 |
| `#101418` sobre `#E8EFFF` | 15,9:1 | 4,5:1 |
| `#848C95` sobre `#FFFFFF` | 3,4:1 | 3:1 (línea) |
| `#101418` sobre `#FFF1DC` | 15,7:1 | 3:1 (borde) |

Los ratios se dejan escritos en el propio `tema.ts`, junto a cada valor. No se añade ninguna herramienta ni dependencia para calcularlos: son quince parejas fijas que solo cambian si cambia la paleta, y entonces se recalculan a mano y se actualiza el comentario.

**Alternativa descartada**: un test automático que calcule el contraste de cada pareja. Es tentador, pero exige codificar en el test qué color va sobre qué fondo —una segunda fuente de verdad que se desincroniza con el diseño real en cuanto una pantalla cambia—. Con quince parejas fijas, el comentario y la revisión manual salen más baratos que mantener ese test.

### La rejilla pasa de `hairlineWidth` a 1 punto

Con `#848C95`, una línea de medio punto en pantallas de densidad alta se ve gris clarito y desaparece al sol: el contraste se cumple sobre el papel pero no en la mano. Las separaciones entre celdas y entre filas pasan a 1 punto, que es el grosor que ya usa la columna de nombres. No afecta al reparto de anchos: `repartirAnchos` trabaja sobre el ancho de pantalla y los bordes se dibujan dentro de la celda.

### Las acciones dejan el subrayado y pasan a color de acción

Hoy los botones de la cabecera son texto subrayado del color del cuerpo. Con `accion` (`#1D4ED8`) el subrayado sobra y resta legibilidad a 15 puntos. Se quita el subrayado y se aplica color más peso medium. El área pulsable no cambia: sigue saliendo de `LADO_PULSABLE_MINIMO`.

## Risks / Trade-offs

- **`fontVariant: ['tabular-nums']` puede no aplicarse en Android** → El código ya lo usa en las horas y el día del mes, pero nunca se ha comprobado en el dispositivo si Android lo respeta o lo ignora en silencio. La verificación manual incluye una comprobación explícita: dos filas con horas distintas en la misma columna deben quedar alineadas. Si Android lo ignora, la salida es fijar `fontFamily: 'sans-serif'` con `fontFeatureSettings`, y si tampoco, aceptar la desalineación y anotarlo como limitación conocida en la spec. No se añade una fuente empaquetada por esto.
- **La línea de rejilla a `#848C95` y 1 punto puede resultar demasiado presente** con 20 empleados en pantalla, convirtiendo la rejilla en una reja → Se comprueba en el dispositivo con la plantilla completa antes de dar el cambio por bueno. Si sobrecarga, la salida es aclarar la línea horizontal entre filas manteniendo la vertical entre días, que es la que de verdad hace falta para saber a qué día pertenece una celda.
- **El aspecto solo se valida en el móvil del encargado** (Android) → En iOS la fuente del sistema es otra y los anchos de texto cambian ligeramente. Es la contrapartida aceptada de no empaquetar Inter. La rejilla no depende del ancho del texto salvo en el nombre del día, que ya se ajusta solo.
- **Renombrar `borde` a `lineaRejilla` toca varios componentes a la vez** → El compilador de TypeScript señala todos los usos; `npm run typecheck` cierra el riesgo por completo.
- **Los tests no comprueban color, así que un error de paleta no lo detecta nadie automáticamente** → Es asumido y es la razón de que los escenarios de esta capability vayan casi todos a `docs/verificacion-manual.md` citando su nombre literal.

## Migration Plan

No hay migración: no cambian datos, ni almacenamiento, ni formato de nada guardado. El cambio es un despliegue normal de código.

Vuelta atrás: revertir el commit. Como todo el aspecto vive en `tema.ts` más ajustes puntuales, no queda estado que deshacer.
