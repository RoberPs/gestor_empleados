/**
 * Ruta de la ficha de un empleado.
 *
 * La ficha se abre desde la lista y se vuelve a ella con la acción de volver, que
 * está disponible en todo momento. Ver `src/ui/PantallaFichaEmpleado.tsx`.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';

import { PantallaFichaEmpleado } from '../../src/ui/PantallaFichaEmpleado';

export default function RutaFichaEmpleado() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PantallaFichaEmpleado idEmpleado={String(id)} onVolver={() => router.back()} />;
}
