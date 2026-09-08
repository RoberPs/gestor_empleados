/**
 * La rejilla del cuadrante: una fila por empleado, una columna por día de lunes a
 * domingo.
 *
 * Los siete días se ven a la vez: no hay ningún scroll horizontal en la pantalla.
 * La cabecera de días queda fuera del scroll vertical, de modo que sigue visible
 * mientras el encargado recorre la plantilla y nunca pierde la referencia de a qué
 * día pertenece la celda que está mirando.
 */

import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { formatearDiaDelMes, formatearFecha, nombreDeDia } from '../dominio/formatos';
import type { FechaISO, Semana } from '../dominio/semana';
import { diasDeLaSemana } from '../dominio/semana';
import type { ContenidoCelda, Empleado, IdEmpleado } from '../dominio/tipos';
import { CELDA_VACIA } from '../dominio/tipos';
import { CeldaCuadrante } from './CeldaCuadrante';
import { altoDeFila, repartirAnchos } from './medidas';
import { CIFRAS_TABULARES, colores, pesos, tipografia } from './tema';

interface Props {
  readonly semana: Semana;
  readonly empleados: readonly Empleado[];
  readonly contenido: ReadonlyMap<IdEmpleado, ReadonlyMap<FechaISO, ContenidoCelda>>;
  readonly anchoDePantalla: number;
  /** Escala de letra del dispositivo. Fija el alto de fila; por defecto, la del sistema. */
  readonly escalaDeLetra?: number;
  readonly onTocarCelda: (empleado: Empleado, dia: FechaISO) => void;
}

export function testIDdeCelda(idEmpleado: IdEmpleado, dia: FechaISO): string {
  return `celda-${idEmpleado}-${dia}`;
}

export function RejillaCuadrante({
  semana,
  empleados,
  contenido,
  anchoDePantalla,
  escalaDeLetra,
  onTocarCelda,
}: Props) {
  const { fontScale } = useWindowDimensions();
  const dias = diasDeLaSemana(semana);
  const anchos = repartirAnchos(anchoDePantalla);
  const alto = altoDeFila(escalaDeLetra ?? fontScale);
  // La caja del nombre del día mide siempre lo mismo, aunque el nombre no quepa y
  // haya que encogerlo: si no, «Miércoles» y «Domingo» —los dos únicos que se
  // encogen— quedan a distinta altura que los otros cinco.
  const altoDelNombreDeDia = Math.ceil(tipografia.nombreDeDia * (escalaDeLetra ?? fontScale) * 1.6);

  return (
    <View testID="rejilla-cuadrante" style={estilos.rejilla}>
      {/* Cabecera de días: fuera del scroll, para que acompañe al recorrido vertical. */}
      <View testID="cabecera-de-dias" style={estilos.filaCabecera}>
        <View style={[estilos.columnaNombres, { width: anchos.nombres }]} />
        {dias.map((dia) => (
          <View
            key={dia}
            testID={`cabecera-dia-${dia}`}
            style={[estilos.cabeceraDia, { width: anchos.dia }]}
          >
            <View style={[estilos.cajaNombreDeDia, { height: altoDelNombreDeDia }]}>
              <Text
                style={estilos.nombreDeDia}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {nombreDeDia(dia)}
              </Text>
            </View>
            <Text style={estilos.diaDelMes}>{formatearDiaDelMes(dia)}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        testID="scroll-plantilla"
        style={estilos.scroll}
        contentContainerStyle={estilos.contenidoScroll}
      >
        {empleados.map((empleado) => {
          const diasDelEmpleado = contenido.get(empleado.id);
          return (
            <View
              key={empleado.id}
              testID={`fila-empleado-${empleado.id}`}
              style={[estilos.fila, { height: alto }]}
            >
              <View style={[estilos.columnaNombres, { width: anchos.nombres }]}>
                {/* El nombre que no cabe se trunca con puntos suspensivos; las
                    columnas de día no se estrechan por ello. */}
                <Text
                  testID={`nombre-empleado-${empleado.id}`}
                  style={estilos.nombreEmpleado}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {empleado.nombre}
                </Text>
              </View>

              {dias.map((dia) => (
                <CeldaCuadrante
                  key={dia}
                  testID={testIDdeCelda(empleado.id, dia)}
                  ancho={anchos.dia}
                  contenido={diasDelEmpleado?.get(dia) ?? CELDA_VACIA}
                  descripcionDeLaCelda={`${empleado.nombre}, ${nombreDeDia(dia).toLowerCase()} ${formatearFecha(dia)}`}
                  onPress={() => onTocarCelda(empleado, dia)}
                />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  rejilla: {
    flex: 1,
  },
  filaCabecera: {
    flexDirection: 'row',
    backgroundColor: colores.fondoCabecera,
    // La cabecera se separa de la plantilla con la línea marcada, no con la de
    // la rejilla: es la que estructura la pantalla.
    borderBottomWidth: 1,
    borderBottomColor: colores.bordeFuerte,
  },
  cabeceraDia: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    borderRightWidth: 1,
    borderRightColor: colores.lineaRejilla,
  },
  cajaNombreDeDia: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  nombreDeDia: {
    fontSize: tipografia.nombreDeDia,
    fontWeight: pesos.medium,
    color: colores.texto,
  },
  diaDelMes: {
    fontSize: tipografia.diaDelMes,
    fontWeight: pesos.bold,
    color: colores.texto,
    fontVariant: CIFRAS_TABULARES,
  },
  scroll: {
    flex: 1,
  },
  contenidoScroll: {
    paddingBottom: 8,
  },
  fila: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colores.lineaRejilla,
  },
  columnaNombres: {
    justifyContent: 'center',
    paddingHorizontal: 4,
    // La columna de nombres separa quién de cuándo: línea marcada.
    borderRightWidth: 1,
    borderRightColor: colores.bordeFuerte,
  },
  nombreEmpleado: {
    fontSize: tipografia.nombreEmpleado,
    fontWeight: pesos.medium,
    color: colores.texto,
  },
});
