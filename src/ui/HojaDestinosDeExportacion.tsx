/**
 * Los dos destinos de la semana exportada: compartirla o guardarse una copia.
 *
 * Son dos actos distintos con consecuencias distintas —uno manda el cuadrante a
 * terceros, el otro lo deja en el móvil del encargado—, así que el sitio donde se
 * eligen tiene que ser explícito. La app no elige por él, y cerrar esta hoja sin
 * elegir nada no exporta nada ni se cuenta como fallo.
 *
 * Vive aquí y no en la fila de navegación de la cabecera por el ancho: a 360 puntos,
 * un segundo botón junto a las dos acciones de semana repetiría el problema que
 * `add-schedule-export` ya resolvió quitándole la palabra al de compartir.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';

export const TEXTO_COMPARTIR = 'Compartir la semana';
export const TEXTO_GUARDAR = 'Guardar una copia';

interface Props {
  readonly visible: boolean;
  /** El rango de la semana que se va a exportar, para que se vea cuál es. */
  readonly semana: string;
  readonly onCompartir: () => void;
  readonly onGuardar: () => void;
  readonly onCancelar: () => void;
}

export function HojaDestinosDeExportacion({
  visible,
  semana,
  onCompartir,
  onGuardar,
  onCancelar,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={estilos.velo}>
        <View testID="destinos-de-exportacion" style={estilos.hoja}>
          <Text style={estilos.titulo}>{semana}</Text>

          <Pressable
            testID="accion-compartir-el-cuadrante"
            accessibilityRole="button"
            onPress={onCompartir}
            style={estilos.accion}
          >
            <Text style={estilos.textoAccion}>{TEXTO_COMPARTIR}</Text>
          </Pressable>

          <Pressable
            testID="accion-guardar-el-cuadrante"
            accessibilityRole="button"
            onPress={onGuardar}
            style={estilos.accion}
          >
            <Text style={estilos.textoAccion}>{TEXTO_GUARDAR}</Text>
          </Pressable>

          <Pressable
            testID="accion-cancelar-la-exportacion"
            accessibilityRole="button"
            onPress={onCancelar}
            style={estilos.accion}
          >
            <Text style={estilos.textoAccion}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  velo: {
    flex: 1,
    backgroundColor: colores.velo,
    justifyContent: 'flex-end',
  },
  hoja: {
    backgroundColor: colores.fondo,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 12,
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
    marginBottom: 8,
  },
  accion: {
    minHeight: LADO_PULSABLE_MINIMO,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.lineaRejilla,
  },
  textoAccion: {
    fontSize: tipografia.cuerpo,
    fontWeight: pesos.medium,
    color: colores.accion,
  },
});
