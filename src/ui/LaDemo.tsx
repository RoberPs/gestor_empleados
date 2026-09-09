/**
 * Lo que la demo web añade por encima de la app. Versión del móvil: nada.
 *
 * En la app instalada no hay distintivo de demostración, ni datos de ejemplo, ni acción
 * de reinicio: arranca con la plantilla vacía y se comporta exactamente igual que antes
 * de que la demo existiera. Este componente pinta a sus hijos y se acaba.
 *
 * Que sea un fichero aparte y no un condicional dentro de la app es lo que garantiza
 * esa separación: Metro no empaqueta `LaDemo.web.tsx` para Android, así que el código de
 * la demo no puede colarse en el binario ni por descuido (design.md — D4).
 */

import type { ReactNode } from 'react';

export function LaDemo({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}
