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

import { formatearFecha, nombreDeDia, type Hora } from '../dominio/formatos';
import {
  esLaMismaSemana,
  semanaAnterior,
  semanaEnCurso,
  semanaSiguiente,
  type FechaISO,
  type Semana,
} from '../dominio/semana';
import type { ContenidoCelda, Empleado, IdEmpleado, TurnoPlanificado } from '../dominio/tipos';
import { CELDA_VACIA, PALABRA_AUSENCIA, PALABRA_VACACIONES } from '../dominio/tipos';
import { describirTurno } from '../dominio/turno';
import type { AccionCelda } from './accionesDeCelda';
import { CabeceraSemana } from './CabeceraSemana';
import { ConfirmacionEliminar } from './ConfirmacionEliminar';
import { EstadoVacio } from './EstadoVacio';
import { FormularioTurno } from './FormularioTurno';
import { HojaAccionesCelda } from './HojaAccionesCelda';
import { LeyendaEtiquetas } from './LeyendaEtiquetas';
import { RejillaCuadrante } from './RejillaCuadrante';
import { colores } from './tema';
import { usarAlmacen } from './usarAlmacen';

interface CeldaAbierta {
  readonly empleado: Empleado;
  readonly dia: FechaISO;
}

type Dialogo =
  | { readonly tipo: 'acciones' }
  | { readonly tipo: 'crear-turno' }
  | { readonly tipo: 'editar-turno'; readonly turno: TurnoPlanificado }
  | { readonly tipo: 'eliminar-turno'; readonly turno: TurnoPlanificado }
  | { readonly tipo: 'eliminar-contenido' };

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
  const { width } = useWindowDimensions();
  const ancho = anchoDePantalla ?? width;

  const [semanaActual, setSemanaActual] = useState<Semana>(() => semanaEnCurso(reloj()));
  const [semanaMostrada, setSemanaMostrada] = useState<Semana>(semanaActual);
  const [celdaAbierta, setCeldaAbierta] = useState<CeldaAbierta | null>(null);
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

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

  function confirmarEliminacion() {
    if (!celdaAbierta || !dialogo) return;
    const { empleado, dia } = celdaAbierta;

    if (dialogo.tipo === 'eliminar-turno') datos.eliminarTurno(empleado.id, dia, dialogo.turno.id);
    else if (dialogo.tipo === 'eliminar-contenido') datos.vaciarCelda(empleado.id, dia);

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

      <ConfirmacionEliminar
        visible={dialogo?.tipo === 'eliminar-turno' || dialogo?.tipo === 'eliminar-contenido'}
        mensaje={mensajeDeConfirmacion(dialogo, contenidoDeLaCeldaAbierta)}
        onConfirmar={confirmarEliminacion}
        onDesistir={cerrarDialogos}
      />
    </View>
  );
}

function mensajeDeConfirmacion(dialogo: Dialogo | null, contenido: ContenidoCelda): string {
  if (dialogo?.tipo === 'eliminar-turno') {
    return `¿Eliminar el turno planificado de ${describirTurno(dialogo.turno)}?`;
  }
  if (contenido.tipo === 'ausencia') return `¿Eliminar la ${PALABRA_AUSENCIA.toLowerCase()}?`;
  if (contenido.tipo === 'vacaciones') return `¿Eliminar las ${PALABRA_VACACIONES.toLowerCase()}?`;
  return '¿Eliminar el contenido de la celda?';
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
});
