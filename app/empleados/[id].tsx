/**
 * Ruta de la ficha de un empleado.
 *
 * La ficha se abre desde la lista del panel y también desde el cuadrante —desde el
 * nombre de una fila o desde las acciones de una celda de ausencia—, y su acción de
 * volver devuelve a la pantalla desde la que se abrió.
 *
 * De dónde vino llega en la propia ruta y no en el store: es un dato de navegación
 * que solo importa mientras la ficha está abierta, y es lo que `expo-router` ya hace
 * con sus parámetros. La semana en la que estaba el cuadrante no viaja aquí —vive en
 * la pantalla del cuadrante—, así que basta con que la ficha no la reinicie.
 *
 * Ver `src/ui/PantallaFichaEmpleado.tsx`.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';

import { PantallaFichaEmpleado } from '../../src/ui/PantallaFichaEmpleado';

export default function RutaFichaEmpleado() {
  const router = useRouter();
  const { id, desde } = useLocalSearchParams<{ id: string; desde?: string }>();

  return (
    <PantallaFichaEmpleado
      idEmpleado={String(id)}
      seAbrioDesde={desde === 'cuadrante' ? 'cuadrante' : 'lista'}
      onVolver={() => router.back()}
    />
  );
}
