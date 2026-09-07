/**
 * Alta de un empleado: nombre, teléfono y email.
 *
 * El alta es el único punto del panel que se confirma con una acción explícita.
 * Hasta entonces no hay empleado, y el nombre —el único campo obligatorio— puede
 * faltar o estar repetido; una vez creada la ficha, cada campo se guarda solo al
 * terminar de editarlo.
 *
 * Cuando no se puede guardar, el formulario explica por qué y conserva lo tecleado:
 * el teléfono que ya se había escrito no se pierde por olvidar el nombre, y un
 * nombre repetido sigue ahí para poder distinguirlo ("María G.").
 */

import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { motivoPorElQueElNombreNoSeGuarda } from '../dominio/empleado';
import type { Empleado } from '../dominio/tipos';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, tipografia } from './tema';

export const TITULO_ALTA = 'Nuevo empleado';

interface Props {
  readonly visible: boolean;
  /** Plantilla actual, para comprobar que el nombre no está repetido. */
  readonly plantilla: readonly Empleado[];
  readonly onGuardar: (nombre: string, telefono: string, email: string) => void;
  readonly onCancelar: () => void;
}

export function FormularioAltaEmpleado({ visible, plantilla, onGuardar, onCancelar }: Props) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState<string | null>(null);

  /**
   * Al corregir el nombre desaparece la explicación de por qué no se pudo guardar.
   * Si se quedase en pantalla, el encargado leería que sigue sin poder guardarse un
   * alta que ya es válida.
   */
  function corregir(escribir: (texto: string) => void) {
    return (texto: string) => {
      escribir(texto);
      setMotivo(null);
    };
  }

  function intentarGuardar() {
    const problema = motivoPorElQueElNombreNoSeGuarda(nombre, plantilla);
    if (problema) {
      // No se pierde nada de lo introducido: solo se explica qué impide guardar.
      setMotivo(problema);
      return;
    }

    setMotivo(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    onGuardar(nombre, telefono, email);
  }

  function cancelar() {
    setMotivo(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    onCancelar();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancelar}>
      <View style={estilos.velo}>
        <View testID="formulario-alta-empleado" style={estilos.formulario}>
          <Text style={estilos.titulo}>{TITULO_ALTA}</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={estilos.etiqueta}>Nombre</Text>
            <TextInput
              testID="campo-nombre-empleado"
              accessibilityLabel="Nombre del empleado"
              value={nombre}
              onChangeText={corregir(setNombre)}
              placeholder="Bruno"
              style={estilos.campo}
            />

            <Text style={estilos.etiqueta}>Teléfono (opcional)</Text>
            <TextInput
              testID="campo-telefono-empleado"
              accessibilityLabel="Teléfono del empleado"
              value={telefono}
              onChangeText={corregir(setTelefono)}
              placeholder="600 11 22 33"
              keyboardType="phone-pad"
              style={estilos.campo}
            />

            <Text style={estilos.etiqueta}>Email (opcional)</Text>
            <TextInput
              testID="campo-email-empleado"
              accessibilityLabel="Email del empleado"
              value={email}
              onChangeText={corregir(setEmail)}
              placeholder="bruno@ejemplo.es"
              keyboardType="email-address"
              autoCapitalize="none"
              style={estilos.campo}
            />
          </ScrollView>

          {motivo ? (
            <Text testID="motivo-alta-no-se-guarda" style={estilos.motivo}>
              {motivo}
            </Text>
          ) : null}

          <View style={estilos.botones}>
            <Pressable
              testID="accion-cancelar-alta"
              accessibilityRole="button"
              onPress={cancelar}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Cancelar</Text>
            </Pressable>
            <Pressable
              testID="accion-confirmar-alta"
              accessibilityRole="button"
              onPress={intentarGuardar}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Dar de alta</Text>
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
    maxHeight: '90%',
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: '700',
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
    borderColor: colores.borde,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: tipografia.titulo,
    color: colores.texto,
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
    borderColor: colores.bordeFuerte,
    borderRadius: 8,
  },
  textoBoton: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
});
