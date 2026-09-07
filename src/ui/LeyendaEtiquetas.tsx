/**
 * Leyenda permanente de las etiquetas de la celda.
 *
 * `AUS` y `VAC` son las dos únicas abreviaturas de la pantalla, así que van
 * siempre acompañadas de su palabra completa. La leyenda vive fuera de la rejilla
 * que hace scroll, de modo que se ve sin desplazarse.
 */

import { StyleSheet, Text, View } from 'react-native';

import {
  ETIQUETA_AUSENCIA,
  ETIQUETA_VACACIONES,
  PALABRA_AUSENCIA,
  PALABRA_VACACIONES,
} from '../dominio/tipos';
import { colores, tipografia } from './tema';

export function LeyendaEtiquetas() {
  return (
    <View testID="leyenda-etiquetas" style={estilos.leyenda}>
      <Text style={estilos.texto}>
        {ETIQUETA_AUSENCIA} = {PALABRA_AUSENCIA} · {ETIQUETA_VACACIONES} = {PALABRA_VACACIONES}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  leyenda: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.borde,
    backgroundColor: colores.fondoCabecera,
  },
  texto: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
  },
});
