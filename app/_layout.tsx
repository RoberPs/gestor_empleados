import { Stack } from 'expo-router';

export default function DisposicionRaiz() {
  return (
    <Stack>
      {/* La ruta raíz es el cuadrante: no hay pantalla intermedia. */}
      <Stack.Screen name="index" options={{ title: 'Cuadrante semanal' }} />
      <Stack.Screen name="empleados" options={{ title: 'Empleados' }} />
      <Stack.Screen name="empleados/[id]" options={{ title: 'Ficha del empleado' }} />
    </Stack>
  );
}
