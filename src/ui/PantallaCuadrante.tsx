/**
 * Pantalla del cuadrante semanal: la pantalla de inicio de la app.
 *
 * Al abrir la app se ve directamente la rejilla de la semana en curso, sin
 * pantalla de bienvenida, de resumen ni de menú intermedia. Todas las acciones
 * sobre una celda ocurren encima de esta misma pantalla, de modo que al terminar o
 * cancelar el encargado sigue en la semana desde la que las inició.
 */

import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  compartirElCuadrante,
  guardarElCuadrante,
  MENSAJE_GUARDADO,
  MENSAJE_SIN_PLANTILLA,
} from '../exportacion/compartirElCuadrante';
import type { DatosDelDocumento } from '../exportacion/documentoDelCuadrante';
import {
  formatearFecha,
  formatearRangoDeSemana,
  nombreDeDia,
  type Hora,
} from '../dominio/formatos';
import {
  esLaMismaSemana,
  semanaAnterior,
  semanaEnCurso,
  semanaSiguiente,
  type FechaISO,
  type Semana,
} from '../dominio/semana';
import type { ContenidoCelda, Empleado, IdEmpleado, TurnoPlanificado } from '../dominio/tipos';
import { paraCopiar, type ContenidoCopiado } from '../dominio/copia';
import { CELDA_VACIA, PALABRA_AUSENCIA, PALABRA_VACACIONES } from '../dominio/tipos';
import { describirTurno } from '../dominio/turno';
import type { AccionCelda } from './accionesDeCelda';
import { AvisoDeLaExportacion } from './AvisoDeLaExportacion';
import { CabeceraSemana, NOMBRE_DEL_LOCAL } from './CabeceraSemana';
import { ConfirmacionIrreversible } from './ConfirmacionIrreversible';
import { EstadoVacio } from './EstadoVacio';
import { FormularioTurno } from './FormularioTurno';
import { HojaAccionesCelda } from './HojaAccionesCelda';
import { HojaDestinosDeExportacion } from './HojaDestinosDeExportacion';
import { LeyendaEtiquetas } from './LeyendaEtiquetas';
import { copiar, usarLoCopiado } from './loCopiado';
import { RejillaCuadrante } from './RejillaCuadrante';
import { colores } from './tema';
import { usarAlmacen } from './usarAlmacen';

/** Texto del botón que confirma un pegado: el diálogo dice "Eliminar" por defecto. */
const TEXTO_PEGAR = 'Pegar';

interface CeldaAbierta {
  readonly empleado: Empleado;
  readonly dia: FechaISO;
}

type Dialogo =
  | { readonly tipo: 'acciones' }
  | { readonly tipo: 'crear-turno' }
  | { readonly tipo: 'editar-turno'; readonly turno: TurnoPlanificado }
  | { readonly tipo: 'eliminar-turno'; readonly turno: TurnoPlanificado }
  | { readonly tipo: 'eliminar-contenido' }
  /** Pegar sobre una celda que ya tiene contenido: sustituye, y por eso se confirma. */
  | { readonly tipo: 'pegar-encima'; readonly copiado: ContenidoCopiado };

export interface PropsPantallaCuadrante {
  /** Reloj del dispositivo. Los tests lo inyectan para fijar la fecha actual. */
  readonly reloj?: () => Date;
  /** Ancho de pantalla en puntos. Por defecto, el de la ventana. */
  readonly anchoDePantalla?: number;
  /** Navegación al panel de empleados. */
  readonly onIrAEmpleados?: () => void;
  /** Navegación a la ficha de un empleado, desde el nombre de su fila o desde una celda. */
  readonly onAbrirFicha?: (idEmpleado: IdEmpleado) => void;
}

export function PantallaCuadrante({
  reloj = () => new Date(),
  anchoDePantalla,
  onIrAEmpleados = () => {},
  onAbrirFicha = () => {},
}: PropsPantallaCuadrante) {
  const datos = usarAlmacen();
  const copiado = usarLoCopiado();
  const { width } = useWindowDimensions();
  const ancho = anchoDePantalla ?? width;

  const [semanaActual, setSemanaActual] = useState<Semana>(() => semanaEnCurso(reloj()));
  const [semanaMostrada, setSemanaMostrada] = useState<Semana>(semanaActual);
  const [celdaAbierta, setCeldaAbierta] = useState<CeldaAbierta | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);
  /** Lo que hay que decirle al encargado de la última exportación, si es que algo. */
  const [avisoDeLaExportacion, setAvisoDeLaExportacion] = useState<string | null>(null);
  /** Si está abierta la hoja donde elige a dónde va la semana que está viendo. */
  const [eligiendoDestino, setEligiendoDestino] = useState(false);

  /**
   * La semana en curso se recalcula cada vez que la app vuelve a primer plano: si
   * el encargado retoma la app pasada la medianoche del domingo, debe ver la
   * semana nueva. Mientras la pantalla sigue en primer plano no se mueve nada.
   */
  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      const nueva = semanaEnCurso(reloj());
      setSemanaActual((anterior) => {
        if (esLaMismaSemana(anterior, nueva)) return anterior;
        // Si estaba mirando la semana en curso, sigue mirándola: ahora es la nueva.
        setSemanaMostrada((mostrada) => (esLaMismaSemana(mostrada, anterior) ? nueva : mostrada));
        return nueva;
      });
    });
    return () => suscripcion.remove();
  }, [reloj]);

  // La plantilla y el contenido de la semana se releen del almacén en cada
  // repintado: la pantalla no guarda copia propia de ninguno de los dos.
  const empleados = datos.listarEmpleados();
  const contenidoDeLaSemana = datos.leerSemana(semanaMostrada);

  const cerrarDialogos = useCallback(() => {
    setDialogo(null);
    setCeldaAbierta(null);
  }, []);

  const contenidoDeLaCeldaAbierta: ContenidoCelda = celdaAbierta
    ? datos.leerCelda(celdaAbierta.empleado.id, celdaAbierta.dia)
    : CELDA_VACIA;

  function elegirAccion(accion: AccionCelda) {
    if (!celdaAbierta) return;
    const { empleado, dia } = celdaAbierta;

    switch (accion.tipo) {
      case 'crear-turno':
      case 'anadir-segundo-turno':
        setDialogo({ tipo: 'crear-turno' });
        return;
      case 'editar-turno':
        setDialogo({ tipo: 'editar-turno', turno: accion.turno });
        return;
      case 'eliminar-turno':
        setDialogo({ tipo: 'eliminar-turno', turno: accion.turno });
        return;
      case 'eliminar-contenido':
        setDialogo({ tipo: 'eliminar-contenido' });
        return;
      case 'marcar-ausencia':
        datos.marcarAusencia(empleado.id, dia);
        cerrarDialogos();
        return;
      case 'marcar-vacaciones':
        datos.marcarVacaciones(empleado.id, dia);
        cerrarDialogos();
        return;
      case 'copiar': {
        // Copiar no toca la celda de origen ni la semana mostrada: solo se lleva lo
        // que la celda muestra, sin sus identificadores de turno y sin nada de la ficha.
        const paraElPortapapeles = paraCopiar(contenidoDeLaCeldaAbierta);
        if (paraElPortapapeles) copiar(paraElPortapapeles);
        cerrarDialogos();
        return;
      }
      case 'pegar': {
        if (!copiado) return;
        // Sobre celda vacía no hay nada que perder y se pega de un toque; sobre una
        // celda con contenido se confirma, porque pegar encima lo borra igual que
        // eliminarlo y no hay deshacer.
        if (contenidoDeLaCeldaAbierta.tipo === 'vacia') {
          datos.pegarEnCelda(empleado.id, dia, copiado);
          cerrarDialogos();
          return;
        }
        setDialogo({ tipo: 'pegar-encima', copiado });
        return;
      }
      case 'ver-ausencia':
        // El motivo vive en la ficha, no en la celda ni en esta hoja: se cierra el
        // diálogo y se abre la ficha de ese empleado, de donde se vuelve aquí, a
        // esta misma semana.
        cerrarDialogos();
        onAbrirFicha(empleado.id);
        return;
    }
  }

  function guardarTurno(inicio: Hora, fin: Hora) {
    if (!celdaAbierta || !dialogo) return;
    const { empleado, dia } = celdaAbierta;

    if (dialogo.tipo === 'editar-turno') {
      datos.editarTurno(empleado.id, dia, dialogo.turno.id, inicio, fin);
    } else {
      // Crear un turno sobre una ausencia o unas vacaciones las sustituye.
      if (contenidoDeLaCeldaAbierta.tipo === 'ausencia' || contenidoDeLaCeldaAbierta.tipo === 'vacaciones') {
        datos.vaciarCelda(empleado.id, dia);
      }
      datos.crearTurno(empleado.id, dia, inicio, fin);
    }
    cerrarDialogos();
  }

  /** La semana que se está viendo, tal y como la espera la exportación. */
  const laSemanaQueSeEstaViendo = (): DatosDelDocumento => ({
    semana: semanaMostrada,
    empleados,
    contenido: contenidoDeLaSemana,
    nombreDelLocal: NOMBRE_DEL_LOCAL,
  });

  /**
   * Exporta la semana que se está viendo por el destino que el encargado ha elegido.
   *
   * No navega a ninguna parte ni toca la semana mostrada: al terminar —o al desistir,
   * que no es un fallo ni en la hoja del sistema ni en el selector de carpetas— el
   * encargado sigue exactamente donde estaba. Solo se le dice algo cuando la
   * exportación no llega a completarse, y cuando el documento queda guardado, que es
   * lo único que no deja ninguna señal en la pantalla.
   */
  async function exportarLaSemana(destino: 'compartir' | 'guardar') {
    setEligiendoDestino(false);

    const resultado =
      destino === 'compartir'
        ? await compartirElCuadrante(laSemanaQueSeEstaViendo())
        : await guardarElCuadrante(laSemanaQueSeEstaViendo());

    if (resultado.tipo === 'fallo') setAvisoDeLaExportacion(resultado.mensaje);
    else if (resultado.tipo === 'sin-plantilla') setAvisoDeLaExportacion(MENSAJE_SIN_PLANTILLA);
    else if (resultado.tipo === 'guardado') setAvisoDeLaExportacion(MENSAJE_GUARDADO);
  }

  /**
   * Lo que el encargado acaba de confirmar. Los tres actos que pasan por aquí
   * —eliminar un turno, vaciar la celda y pegar encima— hacen desaparecer contenido
   * sin deshacer posible, y por eso comparten diálogo.
   */
  function confirmarElActo() {
    if (!celdaAbierta || !dialogo) return;
    const { empleado, dia } = celdaAbierta;

    if (dialogo.tipo === 'eliminar-turno') datos.eliminarTurno(empleado.id, dia, dialogo.turno.id);
    else if (dialogo.tipo === 'eliminar-contenido') datos.vaciarCelda(empleado.id, dia);
    else if (dialogo.tipo === 'pegar-encima') datos.pegarEnCelda(empleado.id, dia, dialogo.copiado);

    cerrarDialogos();
  }

  // Sin plantilla no hay cuadrante que recorrer: ni semana, ni navegación, ni leyenda.
  if (empleados.length === 0) {
    return (
      <View testID="pantalla-cuadrante" style={estilos.pantalla}>
        <EstadoVacio onIrAEmpleados={onIrAEmpleados} />
      </View>
    );
  }

  const tituloDeLaCelda = celdaAbierta
    ? `${celdaAbierta.empleado.nombre} · ${nombreDeDia(celdaAbierta.dia)} ${formatearFecha(celdaAbierta.dia)}`
    : '';

  return (
    <View testID="pantalla-cuadrante" style={estilos.pantalla}>
      <CabeceraSemana
        semana={semanaMostrada}
        esLaSemanaEnCurso={esLaMismaSemana(semanaMostrada, semanaActual)}
        onSemanaAnterior={() => setSemanaMostrada(semanaAnterior(semanaMostrada))}
        onSemanaSiguiente={() => setSemanaMostrada(semanaSiguiente(semanaMostrada))}
        onVolverALaSemanaEnCurso={() => setSemanaMostrada(semanaActual)}
        onIrAEmpleados={onIrAEmpleados}
        onExportarLaSemana={() => setEligiendoDestino(true)}
      />

      <RejillaCuadrante
        semana={semanaMostrada}
        empleados={empleados}
        contenido={contenidoDeLaSemana}
        anchoDePantalla={ancho}
        onTocarCelda={(empleado, dia) => {
          setCeldaAbierta({ empleado, dia });
          setDialogo({ tipo: 'acciones' });
        }}
        onTocarNombre={(empleado) => onAbrirFicha(empleado.id)}
      />

      <LeyendaEtiquetas />

      <HojaAccionesCelda
        visible={dialogo?.tipo === 'acciones'}
        titulo={tituloDeLaCelda}
        contenido={contenidoDeLaCeldaAbierta}
        hayAlgoCopiado={copiado !== null}
        onElegir={elegirAccion}
        onCancelar={cerrarDialogos}
      />

      {dialogo?.tipo === 'crear-turno' || dialogo?.tipo === 'editar-turno' ? (
        <FormularioTurno
          visible
          titulo={dialogo.tipo === 'editar-turno' ? 'Editar turno planificado' : 'Turno planificado'}
          valorInicial={dialogo.tipo === 'editar-turno' ? dialogo.turno : undefined}
          onGuardar={guardarTurno}
          onCancelar={cerrarDialogos}
        />
      ) : null}

      <ConfirmacionIrreversible
        visible={
          dialogo?.tipo === 'eliminar-turno' ||
          dialogo?.tipo === 'eliminar-contenido' ||
          dialogo?.tipo === 'pegar-encima'
        }
        mensaje={mensajeDeConfirmacion(dialogo, contenidoDeLaCeldaAbierta)}
        textoConfirmar={dialogo?.tipo === 'pegar-encima' ? TEXTO_PEGAR : undefined}
        onConfirmar={confirmarElActo}
        onDesistir={cerrarDialogos}
      />

      <HojaDestinosDeExportacion
        visible={eligiendoDestino}
        semana={formatearRangoDeSemana(semanaMostrada)}
        onCompartir={() => exportarLaSemana('compartir')}
        onGuardar={() => exportarLaSemana('guardar')}
        onCancelar={() => setEligiendoDestino(false)}
      />

      <AvisoDeLaExportacion
        mensaje={avisoDeLaExportacion}
        onCerrar={() => setAvisoDeLaExportacion(null)}
      />
    </View>
  );
}

function mensajeDeConfirmacion(dialogo: Dialogo | null, contenido: ContenidoCelda): string {
  if (dialogo?.tipo === 'pegar-encima') {
    // La pregunta nombra lo que va a desaparecer, no lo que va a entrar: es lo que el
    // encargado se juega si se ha equivocado de celda.
    return `¿Pegar aquí y sustituir ${loQueHayEnLaCelda(contenido)}?`;
  }
  if (dialogo?.tipo === 'eliminar-turno') {
    return `¿Eliminar el turno planificado de ${describirTurno(dialogo.turno)}?`;
  }
  if (contenido.tipo === 'ausencia') return `¿Eliminar la ${PALABRA_AUSENCIA.toLowerCase()}?`;
  if (contenido.tipo === 'vacaciones') return `¿Eliminar las ${PALABRA_VACACIONES.toLowerCase()}?`;
  return '¿Eliminar el contenido de la celda?';
}

/** Lo que hay ahora en la celda, con sus horas y con las palabras completas. */
function loQueHayEnLaCelda(contenido: ContenidoCelda): string {
  switch (contenido.tipo) {
    case 'ausencia':
      return `la ${PALABRA_AUSENCIA.toLowerCase()} de este día`;
    case 'vacaciones':
      return `las ${PALABRA_VACACIONES.toLowerCase()} de este día`;
    case 'turnos':
      return contenido.turnos.length === 1
        ? `el turno planificado de ${describirTurno(contenido.turnos[0])}`
        : `los turnos planificados de ${contenido.turnos.map(describirTurno).join(' y de ')}`;
    case 'vacia':
      // No llega a mostrarse: sobre una celda vacía se pega sin preguntar nada.
      return 'el contenido de la celda';
  }
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
});
