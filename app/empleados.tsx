/**
 * Ruta provisional del panel de empleados.
 *
 * El change del panel de empleados sustituye esta ruta sin tocar el cuadrante.
 * Ver `src/ui/PantallaEmpleadosProvisional.tsx`.
 */

import { useRouter } from 'expo-router';

import { PantallaEmpleadosProvisional } from '../src/ui/PantallaEmpleadosProvisional';

export default function RutaEmpleados() {
  const router = useRouter();
  return <PantallaEmpleadosProvisional onVolver={() => router.back()} />;
}
