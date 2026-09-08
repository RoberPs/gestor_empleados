/**
 * Ajustes del local: el nombre del negocio, y nada más.
 *
 * Ni copias de seguridad, ni borrado de datos, ni idioma, ni tema. Es una pantalla
 * de un solo dato a propósito: todo lo que se añada aquí es una decisión que el
 * encargado tendrá que tomar cada vez que entre a corregir una tilde.
 *
 * El nombre se guarda según se escribe y se dice que ha quedado guardado, igual que
 * los campos de la ficha del empleado.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvisoDeGuardado } from './AvisoDeGuardado';
import { ANCHO_MINIMO_SOPORTADO, LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';
import { usarAlmacen } from './usarAlmacen';

export const ETIQUETA_NOMBRE_DEL_LOCAL = 'Nombre del local';
export const AYUDA_NOMBRE_DEL_LOCAL =
  'Es el nombre que aparece en la pantalla del cuadrante, junto al logo.';

export function PantallaAjustes({ onVolver }: { readonly onVolver: () => void }) {
  const datos = usarAlmacen();
  const { bottom } = useSafeAreaInsets();

  const [nombre, setNombre] = useState(() => datos.leerNombreDelLocal());
  const [guardado, setGuardado] = useState(false);

  function escribir(texto: string) {
    setNombre(texto);
    datos.escribirNombreDelLocal(texto);
    setGuardado(true);
  }

  return (
    <View testID="pantalla-ajustes" style={[estilos.pantalla, { paddingBottom: 12 + bottom }]}>
      <View style={estilos.cabecera}>
        <Pressable
          testID="accion-volver-al-cuadrante"
          accessibilityRole="button"
          accessibilityLabel="Volver al cuadrante"
          onPress={onVolver}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Volver</Text>
        </Pressable>
        <Text style={estilos.titulo}>Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text style={estilos.etiqueta}>{ETIQUETA_NOMBRE_DEL_LOCAL}</Text>
        <TextInput
          testID="campo-nombre-del-local"
          accessibilityLabel={ETIQUETA_NOMBRE_DEL_LOCAL}
          value={nombre}
          onChangeText={escribir}
          style={estilos.campo}
        />
        <AvisoDeGuardado visible={guardado} testID="guardado-nombre-del-local" />
        <Text style={estilos.ayuda}>{AYUDA_NOMBRE_DEL_LOCAL}</Text>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    minWidth: ANCHO_MINIMO_SOPORTADO,
    backgroundColor: colores.fondo,
    padding: 12,
    gap: 8,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titulo: {
    flex: 1,
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
  },
  contenido: {
    paddingBottom: 24,
    gap: 4,
  },
  etiqueta: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
    marginTop: 8,
  },
  campo: {
    minHeight: LADO_PULSABLE_MINIMO,
    borderWidth: 1,
    borderColor: colores.lineaRejilla,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: tipografia.titulo,
    color: colores.texto,
  },
  ayuda: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
    marginTop: 8,
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
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
