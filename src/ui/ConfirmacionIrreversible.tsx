/**
 * Confirmación explícita antes de un acto que no se puede deshacer.
 *
 * Las celdas son contiguas y de 44 puntos, y se manejan con prisa y con una mano: un
 * cambio silencioso solo se detectaría cuando el turno ya no aparece. Por eso se pide
 * confirmación antes de eliminar el contenido de una celda, antes de dar de baja a un
 * empleado y antes de pegar encima de una celda que ya tiene algo —que borra lo que
 * hubiera igual que eliminarlo—. Una vez confirmada, no hay deshacer.
 *
 * Los `testID` siguen hablando de eliminar porque eliminar fue el primer acto que
 * pasó por aquí y son la referencia de los tests que ya existían: renombrarlos no
 * cambiaría nada de lo que el encargado ve.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';

interface Props {
  readonly visible: boolean;
  readonly mensaje: string;
  /**
   * Texto del botón que confirma. Por defecto "Eliminar", que es lo que se hace con
   * el contenido de una celda o con un rango de vacaciones. La baja de un empleado
   * lo cambia por su propio nombre: la pregunta y el botón tienen que hablar del
   * mismo acto para que no haya que releer el diálogo antes de tocarlo.
   */
  readonly textoConfirmar?: string;
  readonly onConfirmar: () => void;
  readonly onDesistir: () => void;
}

export function ConfirmacionIrreversible({
  visible,
  mensaje,
  textoConfirmar = 'Eliminar',
  onConfirmar,
  onDesistir,
}: Props) {
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
              <Text style={[estilos.textoBoton, estilos.textoBotonDestructivo]}>
                {textoConfirmar}
              </Text>
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
    borderColor: colores.accion,
    borderRadius: 8,
  },
  botonDestructivo: {
    backgroundColor: colores.fondoAccionDestructiva,
    borderColor: colores.textoAccionDestructiva,
  },
  textoBoton: {
    fontSize: tipografia.cuerpo,
    fontWeight: pesos.medium,
    color: colores.accion,
  },
  textoBotonDestructivo: {
    color: colores.textoAccionDestructiva,
  },
});
