/**
 * El icono de compartir: tres nodos unidos por dos trazos, el mismo dibujo que
 * Android usa en la galería, en el navegador y en cualquier sitio desde el que se
 * manda un fichero.
 *
 * Está dibujado con vistas y no con una fuente de iconos a propósito. La única
 * alternativa era `@expo/vector-icons`, que arrastra `expo-font` y `expo-asset` —dos
 * dependencias más, y una fuente entera empaquetada— para un solo símbolo de 24
 * puntos. En una app de tres pantallas eso es peso muerto.
 *
 * Sus medidas son fijas y no crecen con la letra del sistema: es un símbolo, no
 * texto, y la fila de navegación tiene que medir siempre lo mismo para no comerle
 * alto a la rejilla. Quien no lo vea no se queda sin la acción: el botón que lo
 * envuelve lleva su etiqueta de accesibilidad completa.
 */

import { StyleSheet, View } from 'react-native';

/** Lado del cuadro del icono, en puntos. */
export const LADO_DEL_ICONO = 24;

/** Diámetro de cada uno de los tres nodos. */
const NODO = 7;
/** Grosor de los dos trazos que los unen. */
const TRAZO = 2;

/**
 * Geometría, en el cuadro de 24 × 24: el nodo de la izquierda en el centro del lado,
 * y los dos de la derecha arriba y abajo. Los trazos van del primero a cada uno de
 * los otros dos, girados el mismo ángulo en sentidos opuestos.
 */
const LARGO_DEL_TRAZO = 17.5;
const GIRO_DEL_TRAZO = '23.6deg';

interface Props {
  readonly color: string;
  readonly testID?: string;
}

export function IconoDeCompartir({ color, testID }: Props) {
  const nodo = [estilos.nodo, { backgroundColor: color }];
  const trazo = [estilos.trazo, { backgroundColor: color }];

  return (
    <View testID={testID} style={estilos.icono}>
      {/* Los trazos van debajo de los nodos: se cruzan con ellos, no por encima. */}
      <View style={[trazo, estilos.trazoDeArriba]} />
      <View style={[trazo, estilos.trazoDeAbajo]} />

      <View style={[nodo, estilos.nodoDeLaIzquierda]} />
      <View style={[nodo, estilos.nodoDeArriba]} />
      <View style={[nodo, estilos.nodoDeAbajo]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  icono: {
    width: LADO_DEL_ICONO,
    height: LADO_DEL_ICONO,
  },
  nodo: {
    position: 'absolute',
    width: NODO,
    height: NODO,
    borderRadius: NODO / 2,
  },
  nodoDeLaIzquierda: {
    left: 0.5,
    top: (LADO_DEL_ICONO - NODO) / 2,
  },
  nodoDeArriba: {
    left: LADO_DEL_ICONO - NODO - 0.5,
    top: 1.5,
  },
  nodoDeAbajo: {
    left: LADO_DEL_ICONO - NODO - 0.5,
    top: LADO_DEL_ICONO - NODO - 1.5,
  },
  trazo: {
    position: 'absolute',
    width: LARGO_DEL_TRAZO,
    height: TRAZO,
    left: (LADO_DEL_ICONO - LARGO_DEL_TRAZO) / 2,
  },
  trazoDeArriba: {
    top: 8.5 - TRAZO / 2,
    transform: [{ rotate: `-${GIRO_DEL_TRAZO}` }],
  },
  trazoDeAbajo: {
    top: 15.5 - TRAZO / 2,
    transform: [{ rotate: GIRO_DEL_TRAZO }],
  },
});
