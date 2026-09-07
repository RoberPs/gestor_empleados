/**
 * Ruta del panel de empleados: la lista de la plantilla.
 *
 * Un toque en una fila abre la ficha de ese empleado; el cuadrante queda detrás,
 * en la semana desde la que se vino. Ver `src/ui/PantallaEmpleados.tsx`.
 */

import { useRouter } from 'expo-router';

import { PantallaEmpleados } from '../src/ui/PantallaEmpleados';

export default function RutaEmpleados() {
  const router = useRouter();
  return (
    <PantallaEmpleados
      onAbrirFicha={(id) => router.push(`/empleados/${id}`)}
      onVolver={() => router.back()}
    />
  );
}
