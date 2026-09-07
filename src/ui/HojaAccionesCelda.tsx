/**
 * Acciones de una celda, abiertas con un toque sobre ella.
 *
 * Se muestran encima del cuadrante, sin salir del contexto de la semana: al
 * terminar o cancelar, el encargado sigue en la misma semana desde la que la
 * abrió. No hay aviso ni confirmación adicional por tratarse de una semana pasada.
 */

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ContenidoCelda } from '../dominio/tipos';
import { accionesPara, etiquetaDeAccion, idDeAccion, type AccionCelda } from './accionesDeCelda';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, tipografia } from './tema';

interface Props {
  readonly visible: boolean;
  readonly titulo: string;
  readonly contenido: ContenidoCelda;
  readonly onElegir: (accion: AccionCelda) => void;
  readonly onCancelar: () => void;
}

export function HojaAccionesCelda({ visible, titulo, contenido, onElegir, onCancelar }: Props) {
  const acciones = accionesPara(contenido);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={estilos.velo}>
        <View testID="acciones-de-celda" style={estilos.hoja}>
          <Text style={estilos.titulo}>{titulo}</Text>

          <ScrollView>
            {acciones.map((accion) => (
              <Pressable
                key={idDeAccion(accion)}
                testID={idDeAccion(accion)}
                accessibilityRole="button"
                onPress={() => onElegir(accion)}
                style={[
                  estilos.accion,
                  esDestructiva(accion) ? estilos.accionDestructiva : undefined,
                ]}
              >
                <Text
                  style={[
                    estilos.textoAccion,
                    esDestructiva(accion) ? estilos.textoAccionDestructiva : undefined,
                  ]}
                >
                  {etiquetaDeAccion(accion, contenido)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            testID="accion-cancelar"
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

function esDestructiva(accion: AccionCelda): boolean {
  return accion.tipo === 'eliminar-turno' || accion.tipo === 'eliminar-contenido';
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
    maxHeight: '80%',
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: '700',
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
    borderColor: colores.borde,
  },
  accionDestructiva: {
    backgroundColor: colores.fondoAccionDestructiva,
  },
  textoAccion: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
  textoAccionDestructiva: {
    color: colores.textoAccionDestructiva,
  },
});
