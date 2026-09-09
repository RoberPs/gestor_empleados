/**
 * Lo que hay que tener listo antes de abrir el almacenamiento. Versión de la demo web.
 *
 * En el navegador SQLite es un módulo de WebAssembly que hay que descargar, y lo
 * guardado de una visita anterior hay que ir a buscarlo a IndexedDB. Las dos cosas son
 * asíncronas y las dos tienen que estar hechas antes de que `ArranqueDeLaApp` abra la
 * base, que abre de forma síncrona y antes del primer pintado (design.md — D3).
 *
 * ── QUÉ SE VE MIENTRAS TANTO ────────────────────────────────────────────────
 * El fondo de la app y nada más. Ni logo, ni rueda, ni «cargando»: la spec de
 * `cuadrante-semanal` dice que al abrir no se ve ninguna pantalla de bienvenida, resumen
 * o menú por el camino, y una pantalla de carga con identidad sería exactamente eso. El
 * navegador ya enseña por su cuenta que la página está cargando.
 *
 * ── SI EL MOTOR NO CARGA ────────────────────────────────────────────────────
 * No se hace nada especial: se deja pasar a los hijos. `ArranqueDeLaApp` intentará abrir,
 * no podrá, y mostrará el aviso de almacenamiento con su botón de volver a intentarlo,
 * que es el camino que la app ya tiene para esto. Un manejo propio aquí sería un segundo
 * sitio donde arreglar lo mismo.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { prepararElAlmacenamiento } from '../datos/sqlite/bdDeLaApp';
import { FICHERO_BASE_DE_DATOS } from '../datos/sqlite/conexion';
import { colores } from './tema';

export function PreparacionDeLaPlataforma({ children }: { readonly children: ReactNode }) {
  const [preparada, setPreparada] = useState(false);

  useEffect(() => {
    let vigente = true;
    // El fallo se traga a propósito: quien decide qué enseñar cuando no hay
    // almacenamiento es `ArranqueDeLaApp`, no este componente.
    prepararElAlmacenamiento(FICHERO_BASE_DE_DATOS).finally(() => {
      if (vigente) setPreparada(true);
    });
    return () => {
      vigente = false;
    };
  }, []);

  if (!preparada) return <View style={{ flex: 1, backgroundColor: colores.fondo }} />;

  return <>{children}</>;
}
