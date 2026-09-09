/**
 * Lo que hay que tener listo antes de abrir el almacenamiento. Versión del móvil: nada.
 *
 * En Android `expo-sqlite` está dentro de la app y abre al momento, así que este
 * componente pinta a sus hijos directamente, en el mismo pintado. No añade ni un
 * instante al arranque, que es lo que exige la spec de `cuadrante-semanal` —al abrir no
 * se ve ninguna pantalla por el camino, «ni siquiera un instante»— y la razón por la que
 * el proyecto no instaló nunca `expo-splash-screen`.
 *
 * La versión web (`PreparacionDeLaPlataforma.web.tsx`) sí espera: allí SQLite es un
 * módulo de WebAssembly que hay que descargar antes de poder abrir nada.
 */

import type { ReactNode } from 'react';

export function PreparacionDeLaPlataforma({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}
