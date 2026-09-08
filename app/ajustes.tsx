/**
 * Ruta de los ajustes del local.
 *
 * Se llega desde la cabecera del cuadrante y se vuelve a él, a la misma semana en
 * la que estaba el encargado. Ver `src/ui/PantallaAjustes.tsx`.
 */

import { useRouter } from 'expo-router';

import { PantallaAjustes } from '../src/ui/PantallaAjustes';

export default function RutaAjustes() {
  const router = useRouter();
  return <PantallaAjustes onVolver={() => router.back()} />;
}
