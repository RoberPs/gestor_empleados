/**
 * Panel de empleados: la lista de la plantilla.
 *
 * Cada fila muestra **solo el nombre**. Ni teléfono, ni email, ni nota, ni ninguna
 * indicación de vacaciones: por privacidad —una lista de 20 filas con teléfonos
 * queda expuesta a cualquiera que mire el móvil de reojo— y porque una fila de una
 * sola línea mantiene el área pulsable grande con la plantilla entera en pantalla.
 *
 * El orden es el mismo que el de las filas del cuadrante, alfabético del español:
 * el encargado busca aquí lo que ya sabe buscar en la rejilla.
 *
 * La lista no ofrece dar de baja: ni botón, ni deslizamiento, ni pulsación larga.
 * Con filas contiguas manejadas de pie y con una mano, y un borrado irreversible al
 * otro lado, obligar a abrir la ficha convierte el toque erróneo en un viaje sin
 * consecuencias.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { IdEmpleado } from '../dominio/tipos';
import { FormularioAltaEmpleado } from './FormularioAltaEmpleado';
import { ANCHO_MINIMO_SOPORTADO, LADO_PULSABLE_MINIMO } from './medidas';
import { colores, tipografia } from './tema';
import { usarAlmacen } from './usarAlmacen';

export const MENSAJE_PLANTILLA_VACIA = 'Todavía no hay empleados en la plantilla.';
export const ACCION_ALTA_PRIMER_EMPLEADO = 'Dar de alta al primer empleado';
export const ACCION_ALTA = 'Dar de alta a un empleado';

interface Props {
  readonly onAbrirFicha: (id: IdEmpleado) => void;
  readonly onVolver?: () => void;
}

export function PantallaEmpleados({ onAbrirFicha, onVolver }: Props) {
  const datos = usarAlmacen();
  const [dandoDeAlta, setDandoDeAlta] = useState(false);

  // La plantilla se relee del almacén en cada repintado: la pantalla no guarda
  // copia propia. `listarEmpleados` ya la devuelve en orden alfabético español.
  const empleados = datos.listarEmpleados();

  function darDeAlta(nombre: string, telefono: string, email: string) {
    datos.altaEmpleado(nombre, telefono, email);
    setDandoDeAlta(false);
  }

  return (
    <View testID="pantalla-empleados" style={estilos.pantalla}>
      {empleados.length === 0 ? (
        // Sin plantilla no se muestra una lista vacía sin explicación: se dice qué
        // pasa y se ofrece el camino para salir de ahí.
        <View testID="plantilla-vacia" style={estilos.plantillaVacia}>
          <Text style={estilos.mensajeVacio}>{MENSAJE_PLANTILLA_VACIA}</Text>
          <Pressable
            testID="accion-dar-de-alta-primer-empleado"
            accessibilityRole="button"
            accessibilityLabel={ACCION_ALTA_PRIMER_EMPLEADO}
            onPress={() => setDandoDeAlta(true)}
            style={estilos.boton}
          >
            <Text style={estilos.textoBoton}>{ACCION_ALTA_PRIMER_EMPLEADO}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView testID="lista-de-empleados" style={estilos.lista}>
          {empleados.map((empleado) => (
            <Pressable
              key={empleado.id}
              testID={`fila-de-la-lista-${empleado.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Abrir la ficha de ${empleado.nombre}`}
              onPress={() => onAbrirFicha(empleado.id)}
              style={estilos.fila}
            >
              {/* Toda la fila es pulsable, no solo el texto. El nombre que no cabe
                  se trunca con puntos suspensivos y la fila no crece por ello. */}
              <Text
                testID={`nombre-de-la-lista-${empleado.id}`}
                style={estilos.nombre}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {empleado.nombre}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* La acción de alta es permanente y queda fuera del scroll: sigue siendo
          alcanzable sin recorrer la lista entera, tenga 3 empleados o 20. */}
      {empleados.length > 0 ? (
        <Pressable
          testID="accion-dar-de-alta"
          accessibilityRole="button"
          accessibilityLabel={ACCION_ALTA}
          onPress={() => setDandoDeAlta(true)}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>{ACCION_ALTA}</Text>
        </Pressable>
      ) : null}

      {onVolver ? (
        <Pressable
          testID="accion-volver-al-cuadrante"
          accessibilityRole="button"
          onPress={onVolver}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Volver al cuadrante</Text>
        </Pressable>
      ) : null}

      <FormularioAltaEmpleado
        visible={dandoDeAlta}
        plantilla={empleados}
        onGuardar={darDeAlta}
        onCancelar={() => setDandoDeAlta(false)}
      />
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
  lista: {
    flex: 1,
  },
  fila: {
    // El área pulsable no baja de 44 puntos de alto y ocupa todo el ancho, de modo
    // que al tocar una fila se abre su ficha y no la de la de al lado.
    minHeight: LADO_PULSABLE_MINIMO,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.borde,
  },
  nombre: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
  plantillaVacia: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  mensajeVacio: {
    fontSize: tipografia.titulo,
    color: colores.texto,
    textAlign: 'center',
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: 8,
  },
  textoBoton: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
});
