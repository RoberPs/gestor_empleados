/**
 * Lo que se le dice al encargado cuando la exportación no llega a completarse.
 *
 * Solo aparece cuando hay algo que decir: si el documento sale y se comparte —o si
 * el encargado cierra la hoja del sistema sin elegir nada, que no es un fallo— no se
 * muestra nada en absoluto.
 *
 * El texto llega ya escrito desde `compartirElCuadrante.ts`, en lenguaje corriente:
 * aquí no se compone ningún mensaje ni se traduce ningún error. Es un aviso de una
 * sola salida —«Entendido»— porque no hay nada que decidir: se cierra y el encargado
 * sigue en el cuadrante, en la misma semana.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';

export const TEXTO_ENTENDIDO = 'Entendido';

interface Props {
  /** El aviso a mostrar, o `null` cuando no hay nada que decir. */
  readonly mensaje: string | null;
  readonly onCerrar: () => void;
}

export function AvisoDeLaExportacion({ mensaje, onCerrar }: Props) {
  return (
    <Modal visible={mensaje !== null} transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.velo}>
        <View testID="aviso-de-la-exportacion" style={estilos.dialogo}>
          <Text testID="mensaje-de-la-exportacion" style={estilos.mensaje}>
            {mensaje}
          </Text>

          <View style={estilos.botones}>
            <Pressable
              testID="accion-cerrar-el-aviso"
              accessibilityRole="button"
              onPress={onCerrar}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>{TEXTO_ENTENDIDO}</Text>
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
  botones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  textoBoton: {
    fontSize: tipografia.cuerpo,
    fontWeight: pesos.medium,
    color: colores.accion,
  },
});
