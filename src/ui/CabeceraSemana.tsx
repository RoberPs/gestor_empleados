/**
 * Cabecera de la pantalla: de quién es el cuadrante, qué semana se está mirando y
 * cómo moverse entre semanas.
 *
 * La primera fila identifica el local —su logo y su nombre— y hace de cabecera de
 * la app: la ruta raíz no lleva la barra nativa de `expo-router`, que gastaba una
 * franja entera en repetir dónde estás. Por eso esta fila aplica el margen superior
 * del dispositivo.
 *
 * El rango de fechas está siempre visible, y cuando la semana mostrada es la
 * semana en curso se dice de forma explícita, para que el encargado no tenga que
 * contar fechas para saber si está en su semana.
 */

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatearRangoDeSemana } from '../dominio/formatos';
import type { Semana } from '../dominio/semana';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { CIFRAS_TABULARES, colores, pesos, tipografia } from './tema';

export const TEXTO_SEMANA_EN_CURSO = 'Semana en curso';
export const INVITACION_A_ESCRIBIR_EL_NOMBRE = 'Escribe el nombre de tu local';
export const ACCION_AJUSTES = 'Ajustes';

/** El logo viene con la app: no se elige desde la interfaz ni se pide la galería. */
const LOGO_DEL_LOCAL = require('../../assets/logo-del-local.png');

/** Lado del logo, en puntos. No crece con la letra del sistema: es una imagen. */
const LADO_DEL_LOGO = 32;

interface Props {
  readonly semana: Semana;
  readonly esLaSemanaEnCurso: boolean;
  /** Nombre del local, o cadena vacía si el encargado no lo ha escrito todavía. */
  readonly nombreDelLocal: string;
  readonly onSemanaAnterior: () => void;
  readonly onSemanaSiguiente: () => void;
  readonly onVolverALaSemanaEnCurso: () => void;
  readonly onIrAEmpleados: () => void;
  readonly onIrAAjustes: () => void;
}

export function CabeceraSemana({
  semana,
  esLaSemanaEnCurso,
  nombreDelLocal,
  onSemanaAnterior,
  onSemanaSiguiente,
  onVolverALaSemanaEnCurso,
  onIrAEmpleados,
  onIrAAjustes,
}: Props) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[estilos.cabecera, { paddingTop: 6 + top }]}>
      {/*
        La identidad del local. Cuando todavía no hay nombre, la invitación ocupa su
        sitio y hace ella misma de acceso a los ajustes: dos botones seguidos al
        mismo sitio no ayudan a nadie.
      */}
      <View testID="identidad-del-local" style={estilos.identidad}>
        <Image
          testID="logo-del-local"
          source={LOGO_DEL_LOCAL}
          style={estilos.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />

        {nombreDelLocal ? (
          <>
            <Text
              testID="nombre-del-local"
              style={estilos.nombreDelLocal}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {nombreDelLocal}
            </Text>
            <Pressable
              testID="accion-ir-a-ajustes"
              accessibilityRole="button"
              accessibilityLabel="Ajustes del local"
              onPress={onIrAAjustes}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>{ACCION_AJUSTES}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            testID="accion-escribir-el-nombre-del-local"
            accessibilityRole="button"
            accessibilityLabel={INVITACION_A_ESCRIBIR_EL_NOMBRE}
            onPress={onIrAAjustes}
            style={[estilos.boton, estilos.invitacion]}
          >
            <Text style={estilos.textoBoton}>{INVITACION_A_ESCRIBIR_EL_NOMBRE}</Text>
          </Pressable>
        )}
      </View>

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
    paddingBottom: 6,
    gap: 4,
  },
  identidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: LADO_DEL_LOGO,
    height: LADO_DEL_LOGO,
  },
  nombreDelLocal: {
    // Se lleva el ancho que sobra, y el que no cabe se trunca: el nombre del local
    // no puede empujar a la rejilla ni partirse en dos líneas.
    flex: 1,
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
  },
  invitacion: {
    flex: 1,
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
    fontWeight: pesos.bold,
    color: colores.texto,
    fontVariant: CIFRAS_TABULARES,
    textAlign: 'center',
  },
  semanaEnCurso: {
    fontSize: tipografia.cuerpo,
    fontWeight: pesos.medium,
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
    fontWeight: pesos.medium,
    // El color de acción ya distingue el botón del texto: el subrayado solo le
    // restaba legibilidad a 15 puntos.
    color: colores.accion,
  },
  hueco: {
    flex: 1,
  },
});
