/**
 * Leyenda permanente de las etiquetas de la celda.
 *
 * `AUS` y `VAC` son las dos únicas abreviaturas de la pantalla, así que van
 * siempre acompañadas de su palabra completa. La leyenda vive fuera de la rejilla
 * que hace scroll, de modo que se ve sin desplazarse.
 */

import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ETIQUETA_AUSENCIA,
  ETIQUETA_VACACIONES,
  PALABRA_AUSENCIA,
  PALABRA_VACACIONES,
} from '../dominio/tipos';
import { colores, pesos, tipografia } from './tema';

export function LeyendaEtiquetas() {
  // La leyenda es lo último de la pantalla: se aparta de la barra de navegación
  // del móvil, que si no la tapa a medias.
  const { bottom } = useSafeAreaInsets();

  return (
    <View testID="leyenda-etiquetas" style={[estilos.leyenda, { paddingBottom: 6 + bottom }]}>
      <Text style={estilos.texto}>
        <Text style={estilos.ausencia}>{ETIQUETA_AUSENCIA}</Text> = {PALABRA_AUSENCIA} ·{' '}
        <Text style={estilos.vacaciones}>{ETIQUETA_VACACIONES}</Text> = {PALABRA_VACACIONES}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  leyenda: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colores.lineaRejilla,
    backgroundColor: colores.fondoCabecera,
  },
  texto: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
  },
  /** Las muestras de la leyenda llevan la misma tinta que la etiqueta de la celda. */
  ausencia: {
    color: colores.tintaAusencia,
    fontWeight: pesos.bold,
  },
  vacaciones: {
    color: colores.tintaVacaciones,
    fontWeight: pesos.bold,
  },
});
