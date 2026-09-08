/**
 * Ruta raíz de la app: el cuadrante semanal.
 *
 * Al abrir la app, esto es lo primero y lo único que se ve. No hay pantalla de
 * bienvenida, de resumen ni de menú por delante.
 *
 * La ficha se puede abrir también desde aquí —desde el nombre de una fila o desde
 * las acciones de una celda de ausencia—, y se le dice de dónde viene para que su
 * acción de volver devuelva al cuadrante y no a la lista del panel.
 */

import { useRouter } from 'expo-router';

import { PantallaCuadrante } from '../src/ui/PantallaCuadrante';

export default function RutaCuadrante() {
  const router = useRouter();
  return (
    <PantallaCuadrante
      onIrAEmpleados={() => router.push('/empleados')}
      onAbrirFicha={(id) => router.push(`/empleados/${id}?desde=cuadrante`)}
    />
  );
}
