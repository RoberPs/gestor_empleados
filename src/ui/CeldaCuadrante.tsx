/**
 * Una celda del cuadrante: un empleado y un día concretos.
 *
 * Muestra uno de los cuatro estados posibles y nunca es de solo lectura: siempre
 * es pulsable, también cuando está vacía y también en semanas pasadas. Las horas
 * que muestra son siempre turno planificado, nunca hora realmente trabajada.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatearHora } from '../dominio/formatos';
import {
  ETIQUETA_AUSENCIA,
  ETIQUETA_VACACIONES,
  PALABRA_AUSENCIA,
  PALABRA_VACACIONES,
  type ContenidoCelda,
} from '../dominio/tipos';
import { describirTurno, ordenarPorHoraDeInicio } from '../dominio/turno';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, tipografia } from './tema';

interface Props {
  readonly contenido: ContenidoCelda;
  readonly ancho: number;
  /** Para la etiqueta de accesibilidad: "Ana, lunes 07/09/2026". */
  readonly descripcionDeLaCelda: string;
  readonly testID: string;
  readonly onPress: () => void;
}

function descripcionDelContenido(contenido: ContenidoCelda): string {
  switch (contenido.tipo) {
    case 'vacia':
      return 'sin nada planificado';
    case 'ausencia':
      return PALABRA_AUSENCIA.toLowerCase();
    case 'vacaciones':
      return PALABRA_VACACIONES.toLowerCase();
    case 'turnos':
      return contenido.turnos.map(describirTurno).join(' y ');
  }
}

export function CeldaCuadrante({ contenido, ancho, descripcionDeLaCelda, testID, onPress }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${descripcionDeLaCelda}: ${descripcionDelContenido(contenido)}`}
      onPress={onPress}
      style={[estilos.celda, { width: ancho }, estiloDeFondo(contenido)]}
    >
      <ContenidoDeLaCelda contenido={contenido} />
    </Pressable>
  );
}

function ContenidoDeLaCelda({ contenido }: { readonly contenido: ContenidoCelda }) {
  switch (contenido.tipo) {
    case 'vacia':
      // Visiblemente vacía: ni un texto que sugiera un turno planificado.
      return <View testID="celda-vacia" style={estilos.vacia} />;

    case 'ausencia':
      return (
        <Text style={[estilos.etiqueta, estilos.etiquetaAusencia]} numberOfLines={1}>
          {ETIQUETA_AUSENCIA}
        </Text>
      );

    case 'vacaciones':
      return (
        <Text style={[estilos.etiqueta, estilos.etiquetaVacaciones]} numberOfLines={1}>
          {ETIQUETA_VACACIONES}
        </Text>
      );

    case 'turnos':
      // Los dos pares de horas se muestran completos, uno debajo del otro y en
      // orden de hora de inicio ascendente. No hay indicador de contenido oculto.
      return (
        <View style={estilos.turnos}>
          {ordenarPorHoraDeInicio(contenido.turnos).map((turno) => (
            <View key={turno.id} style={estilos.turno}>
              <Text style={estilos.hora} numberOfLines={1}>
                {formatearHora(turno.inicio)}
              </Text>
              <Text style={estilos.hora} numberOfLines={1}>
                {formatearHora(turno.fin)}
              </Text>
            </View>
          ))}
        </View>
      );
  }
}

function estiloDeFondo(contenido: ContenidoCelda) {
  switch (contenido.tipo) {
    case 'ausencia':
      return estilos.fondoAusencia;
    case 'vacaciones':
      return estilos.fondoVacaciones;
    default:
      return undefined;
  }
}

const estilos = StyleSheet.create({
  celda: {
    minWidth: LADO_PULSABLE_MINIMO,
    minHeight: LADO_PULSABLE_MINIMO,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  vacia: {
    width: '100%',
    height: '100%',
  },
  turnos: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  turno: {
    alignItems: 'center',
    marginVertical: 1,
  },
  hora: {
    fontSize: tipografia.hora,
    color: colores.texto,
    fontVariant: ['tabular-nums'],
  },
  etiqueta: {
    fontSize: tipografia.etiqueta,
    fontWeight: '700',
    color: colores.texto,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  // Además del fondo, cada etiqueta lleva su propio texto y su propio borde,
  // para que se distingan sin depender únicamente del color.
  etiquetaAusencia: {
    borderStyle: 'solid',
  },
  etiquetaVacaciones: {
    borderStyle: 'dashed',
  },
  fondoAusencia: {
    backgroundColor: colores.fondoAusencia,
  },
  fondoVacaciones: {
    backgroundColor: colores.fondoVacaciones,
  },
});
