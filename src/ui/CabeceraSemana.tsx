/**
 * Cabecera de la pantalla: de quién es el cuadrante, qué semana se está mirando y
 * cómo moverse entre semanas.
 *
 * La primera fila identifica el local —su logo y su nombre— y hace de cabecera de
 * la app: la ruta raíz no lleva la barra nativa de `expo-router`, que gastaba una
 * franja entera en repetir dónde estás. Por eso esta fila aplica el margen superior
 * del dispositivo.
 *
 * El nombre y el logo **vienen con la app y no se editan desde ninguna pantalla**.
 * Hubo unos ajustes para escribir el nombre; se retiraron el 08/09/2026, porque una
 * pantalla entera con un solo campo que se toca una vez en la vida es peso muerto en
 * una app que se maneja de pie y con prisa.
 *
 * El rango de fechas está siempre visible, y cuando la semana mostrada es la
 * semana en curso se dice de forma explícita, para que el encargado no tenga que
 * contar fechas para saber si está en su semana.
 *
 * Compartir la semana es una acción **sobre la semana mostrada**, igual que ir a la
 * anterior o a la siguiente, y por eso vive en la fila de navegación, entre las dos.
 * Entra ahí y no en la fila de identidad porque esa fila mide ya lo que mide un
 * botón —44 puntos— y admite un tercero sin crecer ni un punto: la rejilla no pierde
 * ni una fila. La fila de identidad, en cambio, la marca un logo de 32 puntos y un
 * botón la habría estirado.
 *
 * Va como **icono** y no como palabra por una razón medida en el móvil del encargado:
 * con las tres palabras, a 360 puntos la fila se quedaba sin ancho y Android truncaba
 * las tres —«Semana ant…», «Comp…», «Semana sigu…»—, que es exactamente lo que la
 * rejilla lleva evitando desde el principio. El icono de compartir del sistema ocupa
 * su cuadro pulsable de 44 puntos y devuelve a las dos acciones de navegación el
 * ancho que necesitan para leerse enteras.
 */

import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatearRangoDeSemana } from '../dominio/formatos';
import type { Semana } from '../dominio/semana';
import { IconoDeCompartir } from './IconoDeCompartir';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { CIFRAS_TABULARES, colores, pesos, tipografia } from './tema';

export const TEXTO_SEMANA_EN_CURSO = 'Semana en curso';

/**
 * La identidad del local: viene con la app, no se elige desde la interfaz y no se
 * pide la galería del dispositivo.
 *
 * El nombre está aquí, pegado a la referencia del logo, y no en un fichero aparte:
 * los dos son el mismo tipo de dato —identidad fija empaquetada con la app— y así
 * nadie cambia el logo dejándose el nombre a dos ficheros de distancia.
 */
export const NOMBRE_DEL_LOCAL = 'La Esquina café';
const LOGO_DEL_LOCAL = require('../../assets/logo-del-local.png');

/** Lado del logo, en puntos. No crece con la letra del sistema: es una imagen. */
const LADO_DEL_LOGO = 32;

interface Props {
  readonly semana: Semana;
  readonly esLaSemanaEnCurso: boolean;
  readonly onSemanaAnterior: () => void;
  readonly onSemanaSiguiente: () => void;
  readonly onVolverALaSemanaEnCurso: () => void;
  readonly onIrAEmpleados: () => void;
  /** Comparte la semana mostrada. Se ofrece en cualquier semana, pasada o futura. */
  readonly onExportarLaSemana: () => void;
}

export function CabeceraSemana({
  semana,
  esLaSemanaEnCurso,
  onSemanaAnterior,
  onSemanaSiguiente,
  onVolverALaSemanaEnCurso,
  onIrAEmpleados,
  onExportarLaSemana,
}: Props) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[estilos.cabecera, { paddingTop: 6 + top }]}>
      {/*
        La identidad del local: el logo y el nombre, siempre los mismos y siempre
        ahí. No hay caso de "nombre todavía vacío" ni acceso a ninguna pantalla que
        los cambie, así que la fila mide siempre lo mismo y no le quita sitio a la
        rejilla.
      */}
      <View testID="identidad-del-local" style={estilos.identidad}>
        <Image
          testID="logo-del-local"
          source={LOGO_DEL_LOCAL}
          style={estilos.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />

        <Text
          testID="nombre-del-local"
          style={estilos.nombreDelLocal}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {NOMBRE_DEL_LOCAL}
        </Text>
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
          style={[estilos.boton, estilos.botonDeNavegacion]}
        >
          <Text style={estilos.textoBoton} numberOfLines={1}>
            Semana anterior
          </Text>
        </Pressable>

        {/*
          Un solo toque, sin confirmación y sin preguntar de qué semana: es la que
          se está viendo. Se ofrece igual en una semana pasada que en una futura.

          Sin palabra al lado: es el icono de compartir del propio sistema, el mismo
          que el encargado toca a diario en la galería y en el navegador. Quien
          navega con el lector de pantalla oye su etiqueta entera.
        */}
        <Pressable
          testID="accion-exportar-la-semana"
          accessibilityRole="button"
          accessibilityLabel="Compartir o guardar la semana"
          onPress={onExportarLaSemana}
          style={[estilos.boton, estilos.botonDeCompartir]}
        >
          <IconoDeCompartir testID="icono-de-compartir" color={colores.accion} />
        </Pressable>

        <Pressable
          testID="accion-semana-siguiente"
          accessibilityRole="button"
          accessibilityLabel="Semana siguiente"
          onPress={onSemanaSiguiente}
          style={[estilos.boton, estilos.botonDeNavegacion]}
        >
          <Text style={estilos.textoBoton} numberOfLines={1}>
            Semana siguiente
          </Text>
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
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /**
   * Los dos botones de navegación se encogen antes que desbordar, y su texto va a
   * una línea: la fila mide siempre lo que mide un botón, así que la acción de
   * compartir no le ha quitado ni un punto de alto a la rejilla.
   */
  botonDeNavegacion: {
    flexShrink: 1,
  },
  /**
   * El de compartir no se encoge: es un cuadro de icono y ya está en su tamaño
   * mínimo. Los que ceden ancho son los de texto, que es lo que sobra en ellos.
   */
  botonDeCompartir: {
    flexShrink: 0,
    alignItems: 'center',
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
