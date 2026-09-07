/**
 * Confirmación explícita antes de eliminar el contenido de una celda.
 *
 * Las celdas son contiguas y de 44 puntos, y se manejan con prisa y con una mano:
 * un borrado silencioso solo se detectaría cuando el turno ya no aparece. Por eso
 * se pide confirmación. Una vez confirmada, no hay deshacer.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, tipografia } from './tema';

interface Props {
  readonly visible: boolean;
  readonly mensaje: string;
  readonly onConfirmar: () => void;
  readonly onDesistir: () => void;
}

export function ConfirmacionEliminar({ visible, mensaje, onConfirmar, onDesistir }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDesistir}>
      <View style={estilos.velo}>
        <View testID="confirmacion-eliminar" style={estilos.dialogo}>
          <Text style={estilos.mensaje}>{mensaje}</Text>
          <Text style={estilos.aviso}>Esta acción no se puede deshacer.</Text>

          <View style={estilos.botones}>
            <Pressable
              testID="accion-desistir"
              accessibilityRole="button"
              onPress={onDesistir}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Cancelar</Text>
            </Pressable>
            <Pressable
              testID="accion-confirmar-eliminacion"
              accessibilityRole="button"
              onPress={onConfirmar}
              style={[estilos.boton, estilos.botonDestructivo]}
            >
              <Text style={[estilos.textoBoton, estilos.textoBotonDestructivo]}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  velo: {
    flex: 1,
    backgroundColor: colores.velo,
    justifyContent: 'center',
    padding: 16,
  },
  dialogo: {
    backgroundColor: colores.fondo,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  mensaje: {
    fontSize: tipografia.titulo,
    color: colores.texto,
  },
  aviso: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: 8,
  },
  botonDestructivo: {
    backgroundColor: colores.fondoAccionDestructiva,
  },
  textoBoton: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
  textoBotonDestructivo: {
    color: colores.textoAccionDestructiva,
  },
});
