import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { abrirFicheroDeLaApp } from '../src/datos/sqlite/bdDeLaApp';
import { ArranqueDeLaApp } from '../src/ui/ArranqueDeLaApp';
import { LaDemo } from '../src/ui/LaDemo';
import { PreparacionDeLaPlataforma } from '../src/ui/PreparacionDeLaPlataforma';

export default function DisposicionRaiz() {
  return (
    // Los datos se abren y se migran aquí, antes de que ninguna pantalla lea nada.
    // Este fichero ya no sabe en qué plataforma corre: `bdDeLaApp` es quien resuelve si
    // debajo hay `expo-sqlite` o el SQLite en WebAssembly de la demo, y
    // `PreparacionDeLaPlataforma` es quien espera al motor donde hay que esperarlo. A
    // partir de aquí todo pasa por `AlmacenCuadrante`.
    <SafeAreaProvider>
      <PreparacionDeLaPlataforma>
        <ArranqueDeLaApp abrirFichero={abrirFicheroDeLaApp}>
          <LaDemo>
            <Stack>
              {/*
                La ruta raíz es el cuadrante: no hay pantalla intermedia. Y no lleva
                barra nativa: su cabecera es la identidad del local, que ya dice de
                quién es el cuadrante sin gastar una franja entera en repetirlo.
              */}
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="empleados" options={{ title: 'Empleados' }} />
              <Stack.Screen name="empleados/[id]" options={{ title: 'Ficha del empleado' }} />
            </Stack>
          </LaDemo>
        </ArranqueDeLaApp>
      </PreparacionDeLaPlataforma>
    </SafeAreaProvider>
  );
}
