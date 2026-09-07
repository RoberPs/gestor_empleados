/**
 * Ruta raíz de la app: el cuadrante semanal.
 *
 * Al abrir la app, esto es lo primero y lo único que se ve. No hay pantalla de
 * bienvenida, de resumen ni de menú por delante.
 */

import { useRouter } from 'expo-router';

import { PantallaCuadrante } from '../src/ui/PantallaCuadrante';

export default function RutaCuadrante() {
  const router = useRouter();
  return <PantallaCuadrante onIrAEmpleados={() => router.push('/empleados')} />;
}
