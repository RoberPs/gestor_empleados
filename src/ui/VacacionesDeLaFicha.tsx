/**
 * Las vacaciones del empleado dentro de su ficha, como lista de rangos de fechas.
 *
 * Un rango es exactamente el conjunto de sus días marcados como vacaciones en el
 * cuadrante: no hay dos conceptos de vacaciones. Por eso esta lista no guarda los
 * rangos que se teclearon, sino que los recompone a partir de los días marcados —dos
 * rangos que se tocan salen como uno solo, y quitar las vacaciones de un día desde
 * la celda del cuadrante parte el rango en dos.
 *
 * Las fechas se teclean, no se eligen en un calendario: misma decisión que las
 * horas del turno. Un selector exigiría una dependencia nueva para ganar más
 * toques, no menos.
 */

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { analizarFecha, formatearFecha } from '../dominio/formatos';
import type { IdEmpleado } from '../dominio/tipos';
import {
  formatearRango,
  MOTIVO_FIN_ANTERIOR_AL_INICIO,
  sePuedeGuardarElRango,
  type RangoDeVacaciones,
} from '../dominio/vacaciones';
import { ConfirmacionEliminar } from './ConfirmacionEliminar';
import { LADO_PULSABLE_MINIMO } from './medidas';
import { CIFRAS_TABULARES, colores, pesos, tipografia } from './tema';
import { usarAlmacen } from './usarAlmacen';

export const MENSAJE_SIN_VACACIONES = 'No tiene ningún rango de vacaciones.';
export const ACCION_ANADIR_RANGO = 'Añadir un rango de vacaciones';
export const MOTIVO_FECHA_ILEGIBLE =
  'Escribe las fechas como dd/mm/aaaa. Valen 7/9/2026, 07/09/2026, 7-9-2026, 7.9.2026 o 07092026.';

/** Cuántos días del rango pierden lo que tenían al marcarlo como vacaciones. */
export function avisoDeDiasConContenido(dias: number): string {
  return dias === 1
    ? '1 día del rango tiene ya turno planificado o ausencia. Al confirmar pasará a vacaciones.'
    : `${dias} días del rango tienen ya turno planificado o ausencia. Al confirmar pasarán a vacaciones.`;
}

type Dialogo =
  /** Alta de un rango nuevo, o edición del rango que se estaba mirando. */
  | { readonly tipo: 'formulario'; readonly original: RangoDeVacaciones | null }
  | {
      readonly tipo: 'aviso';
      readonly rango: RangoDeVacaciones;
      readonly original: RangoDeVacaciones | null;
      readonly dias: number;
    }
  | { readonly tipo: 'eliminar'; readonly rango: RangoDeVacaciones };

export function VacacionesDeLaFicha({ idEmpleado }: { readonly idEmpleado: IdEmpleado }) {
  const datos = usarAlmacen();
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

  const rangos = datos.leerRangosDeVacaciones(idEmpleado);

  /** Escribe el rango en el cuadrante. Al editar, el rango anterior se va primero. */
  function aplicar(rango: RangoDeVacaciones, original: RangoDeVacaciones | null) {
    if (original) datos.eliminarRangoDeVacaciones(idEmpleado, original);
    datos.marcarRangoDeVacaciones(idEmpleado, rango);
    setDialogo(null);
  }

  function proponer(rango: RangoDeVacaciones, original: RangoDeVacaciones | null) {
    // Los días que ya estaban de vacaciones no cuentan: el rango no les cambia nada.
    const dias = datos.contarDiasConContenido(idEmpleado, rango);
    if (dias > 0) {
      // La celda tiene un único estado, así que el rango sustituye lo que hubiera.
      // Hacerlo en silencio borraría turnos ya planificados sin enterarse.
      setDialogo({ tipo: 'aviso', rango, original, dias });
      return;
    }
    aplicar(rango, original);
  }

  return (
    <View testID="vacaciones-de-la-ficha" style={estilos.zona}>
      <Text style={estilos.titulo}>Vacaciones</Text>

      {rangos.length === 0 ? (
        <Text testID="sin-vacaciones" style={estilos.mensajeVacio}>
          {MENSAJE_SIN_VACACIONES}
        </Text>
      ) : (
        rangos.map((rango) => (
          <View key={rango.inicio} testID={`rango-${rango.inicio}`} style={estilos.fila}>
            <Text testID={`fechas-del-rango-${rango.inicio}`} style={estilos.fechas}>
              {formatearRango(rango)}
            </Text>
            <View style={estilos.accionesDelRango}>
              <Pressable
                testID={`accion-editar-rango-${rango.inicio}`}
                accessibilityRole="button"
                accessibilityLabel={`Editar el rango ${formatearRango(rango)}`}
                onPress={() => setDialogo({ tipo: 'formulario', original: rango })}
                style={estilos.boton}
              >
                <Text style={estilos.textoBoton}>Editar</Text>
              </Pressable>
              <Pressable
                testID={`accion-eliminar-rango-${rango.inicio}`}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar el rango ${formatearRango(rango)}`}
                onPress={() => setDialogo({ tipo: 'eliminar', rango })}
                style={estilos.boton}
              >
                <Text style={estilos.textoBoton}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      <Pressable
        testID="accion-anadir-rango"
        accessibilityRole="button"
        accessibilityLabel={ACCION_ANADIR_RANGO}
        onPress={() => setDialogo({ tipo: 'formulario', original: null })}
        style={estilos.boton}
      >
        <Text style={estilos.textoBoton}>{ACCION_ANADIR_RANGO}</Text>
      </Pressable>

      {dialogo?.tipo === 'formulario' ? (
        <FormularioRango
          original={dialogo.original}
          onGuardar={(rango) => proponer(rango, dialogo.original)}
          onCancelar={() => setDialogo(null)}
        />
      ) : null}

      {dialogo?.tipo === 'aviso' ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setDialogo(null)}>
          <View style={estilos.velo}>
            <View testID="aviso-dias-con-contenido" style={estilos.dialogo}>
              <Text style={estilos.mensaje}>{avisoDeDiasConContenido(dialogo.dias)}</Text>
              <View style={estilos.botones}>
                <Pressable
                  testID="accion-desistir-del-rango"
                  accessibilityRole="button"
                  onPress={() => setDialogo(null)}
                  style={estilos.boton}
                >
                  <Text style={estilos.textoBoton}>Cancelar</Text>
                </Pressable>
                <Pressable
                  testID="accion-confirmar-rango"
                  accessibilityRole="button"
                  onPress={() => aplicar(dialogo.rango, dialogo.original)}
                  style={estilos.boton}
                >
                  <Text style={estilos.textoBoton}>Marcar vacaciones</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}

      <ConfirmacionEliminar
        visible={dialogo?.tipo === 'eliminar'}
        mensaje={
          dialogo?.tipo === 'eliminar'
            ? `¿Eliminar las vacaciones del ${formatearRango(dialogo.rango)}?`
            : ''
        }
        onConfirmar={() => {
          if (dialogo?.tipo !== 'eliminar') return;
          datos.eliminarRangoDeVacaciones(idEmpleado, dialogo.rango);
          setDialogo(null);
        }}
        onDesistir={() => setDialogo(null)}
      />
    </View>
  );
}

/**
 * Formulario de un rango: fecha de inicio y fecha de fin, tecleadas.
 *
 * Cuando el rango no se puede guardar, explica por qué y conserva lo introducido,
 * y la explicación desaparece en cuanto se corrige la fecha.
 */
function FormularioRango({
  original,
  onGuardar,
  onCancelar,
}: {
  readonly original: RangoDeVacaciones | null;
  readonly onGuardar: (rango: RangoDeVacaciones) => void;
  readonly onCancelar: () => void;
}) {
  const [inicio, setInicio] = useState(original ? formatearFecha(original.inicio) : '');
  const [fin, setFin] = useState(original ? formatearFecha(original.fin) : '');
  const [motivo, setMotivo] = useState<string | null>(null);

  function corregir(escribir: (texto: string) => void) {
    return (texto: string) => {
      escribir(texto);
      setMotivo(null);
    };
  }

  function intentarGuardar() {
    const fechaInicio = analizarFecha(inicio);
    const fechaFin = analizarFecha(fin);

    if (!fechaInicio || !fechaFin) {
      setMotivo(MOTIVO_FECHA_ILEGIBLE);
      return;
    }

    const rango = { inicio: fechaInicio, fin: fechaFin };
    if (!sePuedeGuardarElRango(rango)) {
      setMotivo(MOTIVO_FIN_ANTERIOR_AL_INICIO);
      return;
    }

    setMotivo(null);
    onGuardar(rango);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={estilos.velo}>
        <View testID="formulario-rango" style={estilos.dialogo}>
          <Text style={estilos.titulo}>
            {original ? 'Editar las vacaciones' : 'Vacaciones'}
          </Text>

          <Text style={estilos.etiqueta}>Fecha de inicio</Text>
          <TextInput
            testID="campo-fecha-de-inicio"
            accessibilityLabel="Fecha de inicio"
            value={inicio}
            onChangeText={corregir(setInicio)}
            placeholder="10/09/2026"
            keyboardType="numeric"
            style={estilos.campo}
          />

          <Text style={estilos.etiqueta}>Fecha de fin</Text>
          <TextInput
            testID="campo-fecha-de-fin"
            accessibilityLabel="Fecha de fin"
            value={fin}
            onChangeText={corregir(setFin)}
            placeholder="14/09/2026"
            keyboardType="numeric"
            style={estilos.campo}
          />

          {motivo ? (
            <Text testID="motivo-rango-no-se-guarda" style={estilos.motivo}>
              {motivo}
            </Text>
          ) : null}

          <View style={estilos.botones}>
            <Pressable
              testID="accion-cancelar-rango"
              accessibilityRole="button"
              onPress={onCancelar}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Cancelar</Text>
            </Pressable>
            <Pressable
              testID="accion-guardar-rango"
              accessibilityRole="button"
              onPress={intentarGuardar}
              style={estilos.boton}
            >
              <Text style={estilos.textoBoton}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  zona: {
    gap: 8,
  },
  titulo: {
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
  },
  mensajeVacio: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: LADO_PULSABLE_MINIMO,
    borderBottomWidth: 1,
    borderBottomColor: colores.lineaRejilla,
  },
  fechas: {
    flex: 1,
    fontSize: tipografia.cuerpo,
    color: colores.texto,
    fontVariant: CIFRAS_TABULARES,
  },
  accionesDelRango: {
    flexDirection: 'row',
    gap: 8,
  },
  velo: {
    flex: 1,
    backgroundColor: colores.velo,
    justifyContent: 'center',
    padding: 16,
  },
  dialogo: {
    backgroundColor: colores.fondo,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  mensaje: {
    fontSize: tipografia.titulo,
    color: colores.texto,
  },
  etiqueta: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
  },
  campo: {
    minHeight: LADO_PULSABLE_MINIMO,
    borderWidth: 1,
    borderColor: colores.lineaRejilla,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: tipografia.titulo,
    color: colores.texto,
    fontVariant: CIFRAS_TABULARES,
    marginBottom: 8,
  },
  motivo: {
    fontSize: tipografia.cuerpo,
    color: colores.textoAccionDestructiva,
    marginBottom: 8,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  boton: {
    minHeight: LADO_PULSABLE_MINIMO,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
