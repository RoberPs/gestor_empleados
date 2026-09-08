/**
 * La indicación de que un dato ha quedado guardado.
 *
 * Es un estado, no un mensaje que pasa: mientras la pantalla siga abierta, el aviso
 * sigue ahí. No hay temporizador ni animación a propósito. Con el guardado en cada
 * pulsación, un aviso que se desvanece parpadearía en cada tecla, y quien mire la
 * pantalla dos segundos después no vería nada —que es justo lo que llevó al
 * encargado a decir que no sabía si sus datos se estaban guardando—.
 *
 * Es el mismo aviso en la ficha del empleado y en los ajustes del local: un dato
 * guardado se anuncia igual en toda la app.
 */

import { StyleSheet, Text } from 'react-native';

import { colores, pesos, tipografia } from './tema';

export const TEXTO_GUARDADO = 'Guardado';

interface Props {
  readonly visible: boolean;
  readonly testID: string;
}

export function AvisoDeGuardado({ visible, testID }: Props) {
  if (!visible) return null;

  return (
    <Text testID={testID} style={estilos.aviso}>
      {TEXTO_GUARDADO}
    </Text>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    fontSize: tipografia.cuerpo,
    fontWeight: pesos.medium,
    // El verde de las vacaciones: en esta app es el color de lo que está en orden.
    color: colores.tintaVacaciones,
  },
});
