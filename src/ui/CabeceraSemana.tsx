/**
 * Cabecera de la pantalla: qué semana se está mirando y cómo moverse entre semanas.
 *
 * El rango de fechas está siempre visible, y cuando la semana mostrada es la
 * semana en curso se dice de forma explícita, para que el encargado no tenga que
 * contar fechas para saber si está en su semana.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatearRangoDeSemana } from '../dominio/formatos';
import type { Semana } from '../dominio/semana';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, tipografia } from './tema';

export const TEXTO_SEMANA_EN_CURSO = 'Semana en curso';

interface Props {
  readonly semana: Semana;
  readonly esLaSemanaEnCurso: boolean;
  readonly onSemanaAnterior: () => void;
  readonly onSemanaSiguiente: () => void;
  readonly onVolverALaSemanaEnCurso: () => void;
  readonly onIrAEmpleados: () => void;
}

export function CabeceraSemana({
  semana,
  esLaSemanaEnCurso,
  onSemanaAnterior,
  onSemanaSiguiente,
  onVolverALaSemanaEnCurso,
  onIrAEmpleados,
}: Props) {
  return (
    <View style={estilos.cabecera}>
      {/*
        El rango ocupa su propia fila, a lo ancho de la pantalla. Compartiéndola con
        las dos acciones de navegación se quedaba sin ancho a 360 puntos y el texto
        se partía carácter a carácter, en vertical.
      */}
      <View style={estilos.identificacion}>
        <Text testID="rango-de-la-semana" style={estilos.rango}>
          {formatearRangoDeSemana(semana)}
        </Text>
        {esLaSemanaEnCurso ? (
          <Text testID="indicacion-semana-en-curso" style={estilos.semanaEnCurso}>
            {TEXTO_SEMANA_EN_CURSO}
          </Text>
        ) : null}
      </View>

      <View style={estilos.filaSuperior}>
        <Pressable
          testID="accion-semana-anterior"
          accessibilityRole="button"
          accessibilityLabel="Semana anterior"
          onPress={onSemanaAnterior}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Semana anterior</Text>
        </Pressable>

        <Pressable
          testID="accion-semana-siguiente"
          accessibilityRole="button"
          accessibilityLabel="Semana siguiente"
          onPress={onSemanaSiguiente}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Semana siguiente</Text>
        </Pressable>
      </View>

      <View style={estilos.filaInferior}>
        {/* Solo se ofrece cuando la semana mostrada no es la semana en curso. */}
        {esLaSemanaEnCurso ? (
          <View style={estilos.hueco} />
        ) : (
          <Pressable
            testID="accion-volver-a-la-semana-en-curso"
            accessibilityRole="button"
            accessibilityLabel="Volver a la semana en curso"
            onPress={onVolverALaSemanaEnCurso}
            style={estilos.boton}
          >
            <Text style={estilos.textoBoton}>Volver a la semana en curso</Text>
          </Pressable>
        )}

        <Pressable
          testID="accion-ir-a-empleados"
          accessibilityRole="button"
          accessibilityLabel="Ir al panel de empleados"
          onPress={onIrAEmpleados}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Empleados</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    backgroundColor: colores.fondoCabecera,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filaInferior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identificacion: {
    // Sin `flexShrink`: es una fila entera para él, no compite por el ancho con nadie.
    alignItems: 'center',
    gap: 2,
  },
  rango: {
    fontSize: tipografia.titulo,
    fontWeight: '700',
    color: colores.texto,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  semanaEnCurso: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
    backgroundColor: colores.fondoSemanaEnCurso,
    paddingHorizontal: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    minWidth: LADO_PULSABLE_MINIMO,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  textoBoton: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
    textDecorationLine: 'underline',
  },
  hueco: {
    flex: 1,
  },
});
