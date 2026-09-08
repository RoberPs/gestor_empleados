/**
 * Panel de empleados: la lista de la plantilla.
 *
 * Cada fila muestra **el nombre y el puesto**. Ni teléfono, ni email, ni nota, ni
 * motivo de la ausencia, ni ninguna indicación de vacaciones: por privacidad —una
 * lista de 20 filas con teléfonos queda expuesta a cualquiera que mire el móvil de
 * reojo— y porque una fila de una sola línea mantiene el área pulsable grande con la
 * plantilla entera en pantalla. El puesto queda fuera de esa restricción: describe la
 * función de una persona dentro del local y no permite localizarla fuera de él, y es
 * justo lo que el encargado necesita saber de un vistazo al planificar.
 *
 * Al repartir el ancho manda el nombre: cuando los dos no caben, el que se trunca es
 * el puesto. El nombre identifica a la persona; el puesto solo la describe.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IdEmpleado } from '../dominio/tipos';
import { FormularioAltaEmpleado } from './FormularioAltaEmpleado';
import { ANCHO_MINIMO_SOPORTADO, LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';
import { usarAlmacen } from './usarAlmacen';

export const MENSAJE_PLANTILLA_VACIA = 'Todavía no hay empleados en la plantilla.';
export const ACCION_ALTA_PRIMER_EMPLEADO = 'Dar de alta al primer empleado';
export const ACCION_ALTA = 'Dar de alta a un empleado';

/**
 * El acceso visible a la ficha, al final de cada fila.
 *
 * Un carácter y no un icono de librería: `@expo/vector-icons` no está instalado y
 * traerlo por un solo glifo añade peso y una fuente que cargar en el arranque. Como
 * texto, se le aplican la paleta y los pesos del tema igual que a cualquier otro, y
 * escala con la letra del sistema.
 *
 * No sustituye a la fila pulsable: si abrir una ficha exigiera acertar en él, el
 * área pulsable bajaría de toda la fila a un cuadrado de 44 puntos en la esquina.
 */
export const GLIFO_EDITAR = '✎';

interface Props {
  readonly onAbrirFicha: (id: IdEmpleado) => void;
  readonly onVolver?: () => void;
}

export function PantallaEmpleados({ onAbrirFicha, onVolver }: Props) {
  const datos = usarAlmacen();
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  // Las acciones de alta y de volver son lo último de la pantalla: sin este aire,
  // la barra de navegación del móvil las tapa y dejan de poder tocarse.
  const { bottom } = useSafeAreaInsets();

  // La plantilla se relee del almacén en cada repintado: la pantalla no guarda
  // copia propia. `listarEmpleados` ya la devuelve en orden alfabético español.
  const empleados = datos.listarEmpleados();

  function darDeAlta(nombre: string, telefono: string, email: string, puesto: string) {
    datos.altaEmpleado(nombre, telefono, email, puesto);
    setDandoDeAlta(false);
  }

  return (
    <View testID="pantalla-empleados" style={[estilos.pantalla, { paddingBottom: 12 + bottom }]}>
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

              {/* Quien no tiene puesto escrito no deja hueco ni texto de relleno:
                  su fila muestra el nombre a secas, con el mismo alto que las demás. */}
              {empleado.puesto ? (
                <Text
                  testID={`puesto-de-la-lista-${empleado.id}`}
                  style={estilos.puesto}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {empleado.puesto}
                </Text>
              ) : null}

              {/* El acceso visible a la ficha, al final de la fila. Tiene su propia
                  área pulsable de 44 × 44 puntos y no le quita la suya a la fila:
                  los dos caminos llevan al mismo sitio. */}
              <Pressable
                testID={`acceso-a-la-ficha-${empleado.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Editar la ficha de ${empleado.nombre}`}
                onPress={() => onAbrirFicha(empleado.id)}
                style={estilos.accesoALaFicha}
              >
                <Text style={estilos.glifoEditar}>{GLIFO_EDITAR}</Text>
              </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colores.lineaRejilla,
  },
  nombre: {
    // Mismo color y mismo peso que el nombre en la rejilla del cuadrante; aquí
    // va al cuerpo de la app porque es el contenido de una fila que se toca.
    //
    // El nombre cede ancho ocho veces más despacio que el puesto: cuando los dos no
    // caben, el que se trunca es el puesto, y el nombre solo empieza a recortarse
    // cuando al puesto ya no le queda nada que ceder. Aun así cede algo, porque el
    // acceso a la ficha tiene que seguir cabiendo en la fila.
    fontSize: tipografia.cuerpo,
    fontWeight: pesos.medium,
    color: colores.texto,
    flexShrink: 1,
  },
  puesto: {
    // Es el primero en encogerse. Va en el tono secundario porque describe la
    // función de la persona, no la identifica.
    flexShrink: 8,
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
  },
  accesoALaFicha: {
    // Su propia área pulsable, sin robarle la suya a la fila. `marginLeft: auto`
    // lo empuja al final de la fila tenga o no puesto el empleado.
    minWidth: LADO_PULSABLE_MINIMO,
    minHeight: LADO_PULSABLE_MINIMO,
    marginLeft: 'auto',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glifoEditar: {
    fontSize: tipografia.titulo,
    color: colores.accion,
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
    fontWeight: pesos.bold,
    color: colores.texto,
    textAlign: 'center',
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    alignItems: 'center',
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
