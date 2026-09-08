/**
 * Lo que ve el encargado cuando la app no consigue abrir sus datos.
 *
 * Ocupa la app entera y sustituye al cuadrante: es la única excepción a que el
 * cuadrante sea la pantalla de inicio. Mostrar la rejilla con la plantilla vacía
 * sería peor que no mostrar nada —le haría creer que ha perdido a sus empleados, y
 * le invitaría a teclearlos otra vez encima de los que sí están guardados—, así que
 * mientras los datos no se abran no hay cuadrante, ni panel, ni ficha alcanzables.
 *
 * El texto no nombra ficheros, ni versiones, ni códigos: el encargado no tiene
 * perfil técnico y ninguno de esos datos le sirve para nada. Solo dice lo que sí
 * necesita saber —que no se ha borrado nada— y le deja volver a intentarlo. Tampoco
 * se le ofrece borrar ni reiniciar sus datos: es justo lo que no debe hacer.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';

export const TITULO_ALMACENAMIENTO_NO_DISPONIBLE = 'No se han podido abrir tus datos';
export const EXPLICACION_ALMACENAMIENTO_NO_DISPONIBLE =
  'No se ha borrado nada: tus empleados siguen guardados en el móvil. ' +
  'Vuelve a intentarlo, o cierra la app por completo y ábrela otra vez.';
export const ACCION_VOLVER_A_INTENTARLO = 'Volver a intentarlo';

export function AvisoAlmacenamiento({ onVolverAIntentarlo }: { readonly onVolverAIntentarlo: () => void }) {
  return (
    <View testID="aviso-almacenamiento" style={estilos.contenedor}>
      <Text style={estilos.titulo}>{TITULO_ALMACENAMIENTO_NO_DISPONIBLE}</Text>
      <Text style={estilos.explicacion}>{EXPLICACION_ALMACENAMIENTO_NO_DISPONIBLE}</Text>
      <Pressable
        testID="accion-volver-a-intentarlo"
        accessibilityRole="button"
        accessibilityLabel={ACCION_VOLVER_A_INTENTARLO}
        onPress={onVolverAIntentarlo}
        style={estilos.boton}
      >
        <Text style={estilos.textoBoton}>{ACCION_VOLVER_A_INTENTARLO}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.fondo,
    padding: 24,
    gap: 16,
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
    textAlign: 'center',
  },
  explicacion: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
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
