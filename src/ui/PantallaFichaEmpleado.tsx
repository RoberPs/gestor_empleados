/**
 * Ficha de un empleado: nombre, teléfono, email, vacaciones y nota.
 *
 * Nada es de solo lectura para el encargado, y **cada campo queda guardado según
 * se escribe**: no hay botón de guardar global ni diálogo de "¿descartar
 * cambios?" al volver. Son pocos toques por operación y ningún camino en el que
 * volver atrás pierda lo escrito. A cambio se acepta conscientemente que una
 * edición accidental quede guardada: no hay deshacer en este producto.
 *
 * El nombre es la excepción parcial: se revalida al guardarlo —no puede quedar
 * vacío ni repetir el de otro empleado— y, cuando no se puede guardar, se explica
 * por qué y se conserva lo tecleado para corregirlo.
 *
 * El teléfono, el email y la nota no salen de esta pantalla: ni la lista de
 * empleados ni el cuadrante los muestran.
 */

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motivoPorElQueElNombreNoSeGuarda } from '../dominio/empleado';
import type { IdEmpleado } from '../dominio/tipos';
import { AvisoDeGuardado } from './AvisoDeGuardado';
import { ConfirmacionEliminar } from './ConfirmacionEliminar';
import { ANCHO_MINIMO_SOPORTADO, LADO_PULSABLE_MINIMO } from './medidas';
import { colores, pesos, tipografia } from './tema';
import { usarAlmacen } from './usarAlmacen';
import { VacacionesDeLaFicha } from './VacacionesDeLaFicha';

export const ACCION_BAJA = 'Dar de baja';

/** Lo que se advierte antes de borrar: qué se pierde, y que no vuelve. */
export function advertenciaDeBaja(nombre: string): string {
  return `¿Dar de baja a ${nombre}? Sus turnos planificados, sus ausencias y sus vacaciones desaparecen del cuadrante, también en las semanas ya pasadas.`;
}

interface Props {
  readonly idEmpleado: IdEmpleado;
  readonly onVolver: () => void;
}

export function PantallaFichaEmpleado({ idEmpleado, onVolver }: Props) {
  const datos = usarAlmacen();
  const empleado = datos.leerEmpleado(idEmpleado);

  const [nombre, setNombre] = useState(empleado?.nombre ?? '');
  const [motivoDelNombre, setMotivoDelNombre] = useState<string | null>(null);
  const [nombreGuardado, setNombreGuardado] = useState(false);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);
  // La ficha termina en la acción de baja: sin este aire queda bajo la barra de
  // navegación del móvil.
  const { bottom } = useSafeAreaInsets();

  /**
   * La ficha de alguien que ya no está en la plantilla no es una pantalla de este
   * producto: ningún requisito la describe, y una pantalla que la spec no describe
   * es un defecto aunque funcione. Se vuelve a la lista, que sí está especificada.
   * Solo se llega aquí abriendo la ruta con el id de un empleado ya dado de baja.
   */
  useEffect(() => {
    if (!empleado) onVolver();
  }, [empleado, onVolver]);

  if (!empleado) return null;

  /** El nombre se guarda al terminar de editarlo, si se puede guardar. */
  function terminarDeEditarElNombre() {
    const problema = motivoPorElQueElNombreNoSeGuarda(
      nombre,
      datos.listarEmpleados(),
      idEmpleado,
    );
    if (problema) {
      // No se guarda, se explica y lo tecleado sigue ahí para corregirlo. Y no se
      // dice que haya quedado guardado, porque no lo está.
      setMotivoDelNombre(problema);
      setNombreGuardado(false);
      return;
    }
    setMotivoDelNombre(null);
    setNombreGuardado(datos.editarNombre(idEmpleado, nombre));
  }

  return (
    <View testID="ficha-empleado" style={estilos.pantalla}>
      {/* La acción de volver está siempre disponible, arriba y fuera del scroll. */}
      <View style={estilos.cabecera}>
        <Pressable
          testID="accion-volver-a-la-lista"
          accessibilityRole="button"
          accessibilityLabel="Volver a la lista"
          onPress={onVolver}
          style={estilos.boton}
        >
          <Text style={estilos.textoBoton}>Volver</Text>
        </Pressable>
        {/* La ficha identifica de quién es con el nombre ya guardado. */}
        <Text testID="titulo-de-la-ficha" style={estilos.titulo} numberOfLines={1}>
          {empleado.nombre}
        </Text>
      </View>

      {/* Todo el contenido se recorre con scroll vertical: ningún campo queda
          fuera de alcance por muchos rangos de vacaciones que haya. */}
      <ScrollView
        testID="scroll-de-la-ficha"
        contentContainerStyle={[estilos.contenido, { paddingBottom: 24 + bottom }]}
      >
        <Text style={estilos.etiqueta}>Nombre</Text>
        <TextInput
          testID="campo-nombre"
          accessibilityLabel="Nombre"
          value={nombre}
          onChangeText={(texto) => {
            setNombre(texto);
            // Al corregir desaparece la explicación: no debe leerse que sigue sin
            // poder guardarse un nombre que ya es válido.
            setMotivoDelNombre(null);
            setNombreGuardado(false);
          }}
          onEndEditing={terminarDeEditarElNombre}
          onBlur={terminarDeEditarElNombre}
          style={estilos.campo}
        />
        {motivoDelNombre ? (
          <Text testID="motivo-nombre-no-se-guarda" style={estilos.motivo}>
            {motivoDelNombre}
          </Text>
        ) : null}
        <AvisoDeGuardado
          visible={nombreGuardado && motivoDelNombre === null}
          testID="guardado-campo-nombre"
        />

        <CampoDeLaFicha
          testID="campo-telefono"
          etiqueta="Teléfono"
          valorGuardado={empleado.telefono ?? ''}
          onGuardar={(texto) => datos.editarTelefono(idEmpleado, texto)}
          keyboardType="phone-pad"
        />

        <CampoDeLaFicha
          testID="campo-email"
          etiqueta="Email"
          valorGuardado={empleado.email ?? ''}
          onGuardar={(texto) => datos.editarEmail(idEmpleado, texto)}
          keyboardType="email-address"
        />

        <VacacionesDeLaFicha idEmpleado={idEmpleado} />

        <CampoDeLaFicha
          testID="campo-nota"
          etiqueta="Nota"
          valorGuardado={empleado.nota ?? ''}
          onGuardar={(texto) => datos.editarNota(idEmpleado, texto)}
          multilinea
        />

        <Pressable
          testID="accion-dar-de-baja"
          accessibilityRole="button"
          accessibilityLabel={`${ACCION_BAJA} a ${empleado.nombre}`}
          onPress={() => setDandoDeBaja(true)}
          style={[estilos.boton, estilos.botonDestructivo]}
        >
          <Text style={[estilos.textoBoton, estilos.textoBotonDestructivo]}>{ACCION_BAJA}</Text>
        </Pressable>
      </ScrollView>

      <ConfirmacionEliminar
        visible={dandoDeBaja}
        mensaje={advertenciaDeBaja(empleado.nombre)}
        textoConfirmar={ACCION_BAJA}
        onConfirmar={() => {
          setDandoDeBaja(false);
          datos.borrarEmpleado(idEmpleado);
          onVolver();
        }}
        // Si no confirma, sigue en la ficha y no se toca nada suyo.
        onDesistir={() => setDandoDeBaja(false)}
      />
    </View>
  );
}

/**
 * Un campo de la ficha que se guarda solo, según se escribe.
 *
 * Guardaba al terminar de editar —`onEndEditing` y `onBlur`—, y con la nota eso
 * no bastaba: en Android, un campo multilínea del que se sale con el gesto de
 * volver no llega a emitir ninguno de los dos, así que lo escrito se perdía sin
 * que nada lo advirtiera. Se guarda en cada cambio, que es la única forma que no
 * depende de por dónde se salga de la pantalla.
 *
 * El teléfono, el email y la nota se pueden vaciar: no hay nada que validar en
 * ellos.
 */
function CampoDeLaFicha({
  testID,
  etiqueta,
  valorGuardado,
  onGuardar,
  multilinea = false,
  keyboardType,
}: {
  readonly testID: string;
  readonly etiqueta: string;
  readonly valorGuardado: string;
  readonly onGuardar: (texto: string) => void;
  readonly multilinea?: boolean;
  readonly keyboardType?: 'phone-pad' | 'email-address';
}) {
  const [texto, setTexto] = useState(valorGuardado);
  // Lo que se acaba de escribir queda guardado, y el campo lo dice. Se queda dicho
  // mientras la ficha siga abierta: al reabrirla nadie ha tocado nada todavía.
  const [guardado, setGuardado] = useState(false);

  function escribir(nuevo: string) {
    setTexto(nuevo);
    onGuardar(nuevo);
    setGuardado(true);
  }

  return (
    <>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={etiqueta}
        value={texto}
        onChangeText={escribir}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        // La nota es de texto libre y crece con lo que se escriba: la interfaz no
        // le impone ninguna longitud máxima ni recorta lo ya escrito.
        multiline={multilinea}
        style={[estilos.campo, multilinea ? estilos.campoMultilinea : null]}
      />
      <AvisoDeGuardado visible={guardado} testID={`guardado-${testID}`} />
    </>
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
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titulo: {
    flex: 1,
    fontSize: tipografia.titulo,
    fontWeight: pesos.bold,
    color: colores.texto,
  },
  contenido: {
    paddingBottom: 24,
    gap: 4,
  },
  etiqueta: {
    fontSize: tipografia.cuerpo,
    color: colores.textoSecundario,
    marginTop: 8,
  },
  campo: {
    minHeight: LADO_PULSABLE_MINIMO,
    borderWidth: 1,
    borderColor: colores.lineaRejilla,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: tipografia.titulo,
    color: colores.texto,
  },
  campoMultilinea: {
    minHeight: LADO_PULSABLE_MINIMO * 2,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  motivo: {
    fontSize: tipografia.cuerpo,
    color: colores.textoAccionDestructiva,
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
  botonDestructivo: {
    backgroundColor: colores.fondoAccionDestructiva,
    borderColor: colores.textoAccionDestructiva,
    marginTop: 24,
  },
  textoBoton: {
    fontSize: tipografia.cuerpo,
    fontWeight: pesos.medium,
    color: colores.accion,
  },
  /** El mismo tratamiento que la acción destructiva de la hoja de acciones. */
  textoBotonDestructivo: {
    color: colores.textoAccionDestructiva,
  },
});
