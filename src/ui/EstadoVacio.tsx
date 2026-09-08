/**
 * Lo que se ve cuando no hay ningún empleado dado de alta.
 *
 * Sin plantilla no hay cuadrante que recorrer ni etiquetas que explicar, así que
 * esta pantalla no ofrece identificación de la semana, ni navegación entre
 * semanas, ni leyenda: solo el mensaje y el camino al panel de empleados.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';

export const MENSAJE_SIN_EMPLEADOS = 'Todavía no hay empleados en la plantilla.';
export const ACCION_DAR_DE_ALTA = 'Dar de alta al primer empleado';

export function EstadoVacio({ onIrAEmpleados }: { readonly onIrAEmpleados: () => void }) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View testID="estado-vacio" style={[estilos.contenedor, { paddingBottom: 24 + bottom }]}>
      <Text style={estilos.mensaje}>{MENSAJE_SIN_EMPLEADOS}</Text>
      <Pressable
        testID="accion-dar-de-alta-primer-empleado"
        accessibilityRole="button"
        accessibilityLabel={ACCION_DAR_DE_ALTA}
        onPress={onIrAEmpleados}
        style={estilos.boton}
      >
        <Text style={estilos.textoBoton}>{ACCION_DAR_DE_ALTA}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  mensaje: {
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
    textAlign: 'center',
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
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
