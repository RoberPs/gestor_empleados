/**
 * Panel de empleados — PANTALLA PROVISIONAL.
 *
 * ── SUSTITUIBLE SIN TOCAR EL CUADRANTE ──────────────────────────────────────
 * El panel de empleados de verdad (ficha con nombre, teléfono y email, edición y
 * borrado) es un change aparte, todavía sin especificar. Esta pantalla existe solo
 * para que la pantalla de entrada del producto no quede bloqueada esperándolo:
 * hace lo mínimo —dar de alta un empleado por su nombre y borrarlo— y nada más.
 *
 * El cuadrante no depende de nada de este módulo salvo de que la ruta
 * `/empleados` exista y se pueda volver de ella: no importa ningún componente ni
 * ninguna función de aquí. Cuando el change del panel de empleados sustituya esta
 * pantalla, el cuadrante no cambia.
 *
 * Restricciones que este change traslada a ese futuro panel:
 * - El campo nombre se piensa corto: la rejilla lo trunca con puntos suspensivos.
 * - No existe el concepto de empleado inactivo ni histórico de plantilla.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LADO_PULSABLE_MINIMO } from './medidas';
import { colores, tipografia } from './tema';
import { usarAlmacen } from './usarAlmacen';

export function PantallaEmpleadosProvisional({ onVolver }: { readonly onVolver?: () => void }) {
  const datos = usarAlmacen();
  const [nombre, setNombre] = useState('');
  const empleados = datos.listarEmpleados();

  function darDeAlta() {
    if (nombre.trim().length === 0) return;
    datos.altaEmpleado(nombre);
    setNombre('');
  }

  return (
    <View testID="pantalla-empleados" style={estilos.pantalla}>
      <View style={estilos.alta}>
        <TextInput
          testID="campo-nombre-empleado"
          accessibilityLabel="Nombre del empleado"
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre"
          style={estilos.campo}
        />
        <Pressable
          testID="accion-dar-de-alta"
          accessibilityRole="button"
          onPress={darDeAlta}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Dar de alta</Text>
        </Pressable>
      </View>

      <ScrollView>
        {empleados.map((empleado) => (
          <View key={empleado.id} style={estilos.fila}>
            <Text style={estilos.nombre}>{empleado.nombre}</Text>
            <Pressable
              testID={`accion-borrar-empleado-${empleado.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Borrar a ${empleado.nombre}`}
              onPress={() => datos.borrarEmpleado(empleado.id)}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Borrar</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

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
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
    padding: 12,
    gap: 8,
  },
  alta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  campo: {
    flex: 1,
    minHeight: LADO_PULSABLE_MINIMO,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.borde,
  },
  nombre: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colores.bordeFuerte,
    borderRadius: 8,
  },
  textoBoton: {
    fontSize: tipografia.cuerpo,
    color: colores.texto,
  },
});
