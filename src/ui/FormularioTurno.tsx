/**
 * Formulario de un turno planificado: hora de inicio y hora de fin, en 24h.
 *
 * Cuando el turno no se puede guardar, el formulario explica por qué y conserva
 * lo que el encargado había introducido, para que solo tenga que corregirlo. Una
 * hora de fin anterior a la de inicio sí se guarda: es un turno que cruza la
 * medianoche.
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { analizarHora, formatearHora, type Hora } from '../dominio/formatos';
import { MOTIVO_DURACION_NULA, sePuedeGuardar } from '../dominio/turno';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { CIFRAS_TABULARES, colores, pesos, tipografia } from './tema';

export const MOTIVO_HORA_ILEGIBLE =
  'Escribe las horas del día en 24h. Valen 09:30, 9:30, 9.30 o 930; también 9 para las nueve en punto.';

interface Props {
  readonly visible: boolean;
  readonly titulo: string;
  /** Horas de partida al editar un turno existente. */
  readonly valorInicial?: { readonly inicio: Hora; readonly fin: Hora };
  readonly onGuardar: (inicio: Hora, fin: Hora) => void;
  readonly onCancelar: () => void;
}

export function FormularioTurno({ visible, titulo, valorInicial, onGuardar, onCancelar }: Props) {
  const [inicio, setInicio] = useState(valorInicial ? formatearHora(valorInicial.inicio) : '');
  const [fin, setFin] = useState(valorInicial ? formatearHora(valorInicial.fin) : '');
  const [motivo, setMotivo] = useState<string | null>(null);

  /**
   * Al corregir una hora desaparece la explicación de por qué no se pudo guardar.
   * Si se quedase en pantalla, el encargado leería que sigue sin poder guardar un
   * turno que ya es válido.
   */
  function corregir(escribir: (texto: string) => void) {
    return (texto: string) => {
      escribir(texto);
      setMotivo(null);
    };
  }

  function intentarGuardar() {
    const horaInicio = analizarHora(inicio);
    const horaFin = analizarHora(fin);

    if (!horaInicio || !horaFin) {
      // No se pierde nada de lo introducido: solo se explica qué falta.
      setMotivo(MOTIVO_HORA_ILEGIBLE);
      return;
    }
    if (!sePuedeGuardar(horaInicio, horaFin)) {
      setMotivo(MOTIVO_DURACION_NULA);
      return;
    }

    setMotivo(null);
    onGuardar(horaInicio, horaFin);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={estilos.velo}>
        <View testID="formulario-turno" style={estilos.formulario}>
          <Text style={estilos.titulo}>{titulo}</Text>

          <Text style={estilos.etiqueta}>Hora de inicio</Text>
          <TextInput
            testID="campo-hora-de-inicio"
            accessibilityLabel="Hora de inicio"
            value={inicio}
            onChangeText={corregir(setInicio)}
            placeholder="09:30"
            // `numeric` es el único teclado numérico que existe en las dos
            // plataformas. `numbers-and-punctuation` es solo de iOS y en Android
            // puede dejar los dos puntos fuera del teclado.
            keyboardType="numeric"
            style={estilos.campo}
          />

          <Text style={estilos.etiqueta}>Hora de fin</Text>
          <TextInput
            testID="campo-hora-de-fin"
            accessibilityLabel="Hora de fin"
            value={fin}
            onChangeText={corregir(setFin)}
            placeholder="17:30"
            keyboardType="numeric"
            style={estilos.campo}
          />

          {motivo ? (
            <Text testID="motivo-no-se-guarda" style={estilos.motivo}>
              {motivo}
            </Text>
          ) : null}

          <View style={estilos.botones}>
            <Pressable
              testID="accion-cancelar-turno"
              accessibilityRole="button"
              onPress={onCancelar}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Cancelar</Text>
            </Pressable>
            <Pressable
              testID="accion-guardar-turno"
              accessibilityRole="button"
              onPress={intentarGuardar}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Guardar</Text>
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
  formulario: {
    backgroundColor: colores.fondo,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
    marginBottom: 8,
  },
  etiqueta: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
  },
  campo: {
    minHeight: LADO_PULSABLE_MINIMO,
    borderWidth: 1,
    borderColor: colores.lineaRejilla,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: tipografia.titulo,
    color: colores.texto,
    fontVariant: CIFRAS_TABULARES,
    marginBottom: 8,
  },
  motivo: {
    fontSize: tipografia.cuerpo,
    color: colores.textoAccionDestructiva,
    marginBottom: 8,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
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
