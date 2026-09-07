/**
 * Abre los datos antes de dejar entrar a ninguna pantalla.
 *
 * Envuelve a toda la app: hasta que el almacenamiento no está abierto y al día no se
 * pinta el cuadrante, porque `AlmacenCuadrante` es síncrona y las pantallas leen la
 * plantilla mientras se dibujan. Por eso la apertura va en el inicializador del
 * estado y no en un efecto: un efecto correría después del primer pintado, y para
 * entonces el cuadrante ya habría intentado leer.
 *
 * Si la apertura falla, en lugar del cuadrante se muestra el aviso, y desde él se
 * puede volver a intentarlo sin cerrar la app.
 */

import { useState, type ReactNode } from 'react';

import { abrirAlmacenamiento } from '../datos/arranque';
import type { AbrirFichero } from '../datos/sqlite/bd';
import { AvisoAlmacenamiento } from './AvisoAlmacenamiento';

export function ArranqueDeLaApp({
  abrirFichero,
  nombreDelFichero,
  children,
}: {
  readonly abrirFichero: AbrirFichero;
  readonly nombreDelFichero?: string;
  readonly children: ReactNode;
}) {
  const [disponible, setDisponible] = useState(() =>
    abrirAlmacenamiento(abrirFichero, nombreDelFichero),
  );

  if (!disponible) {
    return (
      <AvisoAlmacenamiento
        onVolverAIntentarlo={() => setDisponible(abrirAlmacenamiento(abrirFichero, nombreDelFichero))}
      />
    );
  }

  return <>{children}</>;
}
