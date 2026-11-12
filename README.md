# Cuadrante — gestión de turnos para hostelería

App móvil para que el encargado de un bar o restaurante planifique los turnos de su
plantilla semana a semana, desde el móvil y con una sola mano. Está en uso real en un
local de hostelería con una plantilla de entre 10 y 20 personas.

> El nombre «La Esquina café», el logo y todos los datos de empleados de este repositorio
> son ficticios.

## Qué hace

- **Cuadrante semanal**: una rejilla de empleados por días, de lunes a domingo. Al tocar
  una celda se planifica un turno (o dos en el mismo día, incluidos los que cruzan la
  medianoche), una ausencia o unas vacaciones.
- **Copiar y pegar celdas** para repetir un turno rápidamente.
- **Panel de empleados**: alta, edición y baja con nombre, puesto, teléfono, email, nota
  y motivo de la ausencia.
- **Exportación a PDF** de la semana, para compartirla por mensajería o guardarla. Es la
  vía por la que los empleados reciben su horario, y el PDF no lleva datos de contacto.
- **Demo web**: la misma app en el navegador, con datos inventados, para enseñarla sin
  entregar el APK.

## Decisiones de diseño

- **Sin backend, sin cuentas y sin nube.** Todos los datos viven en SQLite dentro del
  móvil. Android no hace copia automática de los datos (`allowBackup: false`), porque los
  motivos de ausencia pueden ser datos de salud.
- **Privacidad comprobada por tests.** Un test falla si algún módulo de la capa de datos
  intenta hablar por la red o escribir fuera de la app.
- **Una capa de datos con tres implementaciones** de la misma interfaz `BaseDeDatos`:
  - `expo-sqlite` en el móvil;
  - `sql.js` (SQLite en WebAssembly, persistido en IndexedDB) en la demo web;
  - `node:sqlite` en los tests, que así ejercitan SQL y migraciones reales.
- **Interfaz pensada para usar de pie y con prisa**: una paleta única con contraste
  mínimo exigido, sin tema oscuro, y la semana completa visible sin scroll horizontal
  desde 360 puntos de ancho.

## Stack

| Área | Tecnología |
| --- | --- |
| App | React Native 0.86 con Expo SDK 57, React 19.2, TypeScript |
| Navegación | expo-router |
| Datos | SQLite: `expo-sqlite` (móvil), `sql.js` (web) |
| Exportación | `expo-print`, `expo-sharing`, `expo-file-system` |
| Tests | Jest (`jest-expo`) y Testing Library para React Native |
| Build | EAS Build (APK de Android) |

## Desarrollo guiado por specs

El proyecto se ha construido con **[OpenSpec](https://github.com/Fission-AI/OpenSpec)**.
Cada funcionalidad empieza como un *change* con su propuesta, diseño, specs y tareas, se
implementa y después se archiva publicando sus specs.

- `openspec/specs/`: las 7 capacidades vigentes (cuadrante semanal, panel de empleados,
  almacenamiento de empleados y del cuadrante, exportación, identidad visual y demo web).
- `openspec/changes/archive/`: el historial de los 9 changes, con las decisiones y su
  porqué.
- Cada escenario de una spec queda cubierto por un test que cita su nombre literal o, si
  solo se puede comprobar mirando la pantalla, por una entrada en
  [`docs/verificacion-manual.md`](docs/verificacion-manual.md).

La suite tiene **507 tests en 51 ficheros**.

## Puesta en marcha

Requisitos: Node.js 20 o superior y npm.

```bash
npm install
npm test             # suite completa
npm run typecheck    # comprobación de tipos
```

Para ver la app:

```bash
npm run web          # en el navegador (modo demo, con datos de ejemplo)
npx expo start       # en el móvil, con Expo Go
```

`npm run web` abre la app en http://localhost:8081. Se ve mejor con las herramientas
de desarrollo del navegador en vista de móvil.

> Si Jest se queda sin memoria en Windows, lánzalo en serie:
> `npx jest --runInBand`.

## Estructura

```
app/                rutas de expo-router (cuadrante, empleados, ficha)
src/dominio/        lógica pura: semanas, turnos, vacaciones, orden alfabético
src/datos/          almacenes y SQLite (migraciones y adaptadores por plataforma)
src/exportacion/    composición del PDF y su entrega (móvil y web)
src/ui/             pantallas y componentes
src/demo/           datos de ejemplo y arranque de la demo web
openspec/           specs vigentes y changes archivados
docs/               despliegue y verificación manual
```

## Despliegue

- **App**: APK de Android generado con EAS Build e instalado a mano. No hay
  publicación en tiendas.
- **Demo**: `npm run demo:build` genera un sitio estático en `dist/`, que se puede
  servir desde cualquier alojamiento estático.

El proceso completo está en [`docs/despliegue.md`](docs/despliegue.md).
