import { Stack } from 'expo-router';

import { abrirConExpoSqlite } from '../src/datos/sqlite/bdExpoSqlite';
import { ArranqueDeLaApp } from '../src/ui/ArranqueDeLaApp';

export default function DisposicionRaiz() {
  return (
    // Los datos se abren y se migran aquí, antes de que ninguna pantalla lea nada.
    // Es el único sitio de la app que conoce `expo-sqlite`; a partir de aquí todo
    // pasa por `AlmacenCuadrante`.
    <ArranqueDeLaApp abrirFichero={abrirConExpoSqlite}>
      <Stack>
        {/* La ruta raíz es el cuadrante: no hay pantalla intermedia. */}
        <Stack.Screen name="index" options={{ title: 'Cuadrante semanal' }} />
        <Stack.Screen name="empleados" options={{ title: 'Empleados' }} />
        <Stack.Screen name="empleados/[id]" options={{ title: 'Ficha del empleado' }} />
      </Stack>
    </ArranqueDeLaApp>
  );
}
