/**
 * Lo que la demo web añade por encima de la app: el ejemplo y el distintivo.
 *
 * Hace dos cosas, en este orden:
 *
 * 1. **Siembra el ejemplo** si la base está vacía, en el inicializador de `useState` y
 *    no en un efecto. Un efecto correría después del primer pintado y el cuadrante se
 *    vería un instante vacío antes de llenarse, que es exactamente la primera impresión
 *    que la demo no se puede permitir.
 * 2. **Pinta el distintivo** que avisa de que esto es una demostración, con la acción de
 *    devolverla a su estado de ejemplo.
 *
 * El distintivo va arriba, en una banda propia, y el cuadrante debajo ocupando el resto:
 * no lo tapa, no hay que cerrarlo para usar la app y no le quita ancho a la semana, que
 * tiene que seguir viéndose entera sin desplazarse en horizontal.
 */

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { almacen } from '../datos/almacenCuadrante';
import { sembrarElEjemplo } from '../demo/ejemploDeLaDemo';
import { reiniciarLaDemo } from '../demo/laDemo';
import { ConfirmacionIrreversible } from './ConfirmacionIrreversible';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';

const AVISO = 'Demostración. No escribas aquí datos reales de tu plantilla.';
const PREGUNTA_DE_REINICIO =
  '¿Devolver la demostración a su estado inicial? Se borrará todo lo que hayas escrito en ella.';

export function LaDemo({ children }: { readonly children: ReactNode }) {
  // Sembrar antes del primer pintado. `useState` con inicializador se ejecuta una sola
  // vez y de forma síncrona, que es justo lo que hace falta.
  useState(() => {
    sembrarElEjemplo(almacen());
    return null;
  });

  const [preguntando, setPreguntando] = useState(false);

  return (
    <View style={estilos.marco}>
      <View style={estilos.banda}>
        <Text style={estilos.aviso} numberOfLines={2}>
          {AVISO}
        </Text>
        <Pressable
          testID="accion-reiniciar-demo"
          accessibilityRole="button"
          onPress={() => setPreguntando(true)}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Reiniciar</Text>
        </Pressable>
      </View>

      <View style={estilos.contenido}>{children}</View>

      <ConfirmacionIrreversible
        visible={preguntando}
        mensaje={PREGUNTA_DE_REINICIO}
        textoConfirmar="Reiniciar"
        onConfirmar={() => {
          setPreguntando(false);
          void reiniciarLaDemo();
        }}
        onDesistir={() => setPreguntando(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: { flex: 1, backgroundColor: colores.fondo },
  banda: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colores.fondoAusencia,
    borderBottomWidth: 1,
    borderBottomColor: colores.tintaAusencia,
  },
  aviso: {
    flex: 1,
    fontSize: tipografia.nombreEmpleado,
    fontWeight: pesos.bold,
    color: colores.tintaAusencia,
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textoBoton: {
    fontSize: tipografia.nombreEmpleado,
    fontWeight: pesos.bold,
    color: colores.tintaAusencia,
    textDecorationLine: 'underline',
  },
  contenido: { flex: 1 },
});
