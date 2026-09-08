import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { abrirConExpoSqlite } from '../src/datos/sqlite/bdExpoSqlite';
import { ArranqueDeLaApp } from '../src/ui/ArranqueDeLaApp';

export default function DisposicionRaiz() {
  return (
    // Los datos se abren y se migran aquí, antes de que ninguna pantalla lea nada.
    // Es el único sitio de la app que conoce `expo-sqlite`; a partir de aquí todo
    // pasa por `AlmacenCuadrante`.
    <SafeAreaProvider>
      <ArranqueDeLaApp abrirFichero={abrirConExpoSqlite}>
        <Stack>
          {/*
            La ruta raíz es el cuadrante: no hay pantalla intermedia. Y no lleva
            barra nativa: su cabecera es la identidad del local, que ya dice de
            quién es el cuadrante sin gastar una franja entera en repetirlo.
          */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="empleados" options={{ title: 'Empleados' }} />
          <Stack.Screen name="empleados/[id]" options={{ title: 'Ficha del empleado' }} />
          <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
        </Stack>
      </ArranqueDeLaApp>
    </SafeAreaProvider>
  );
}
