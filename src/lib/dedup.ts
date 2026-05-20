import {
  AgendaItem,
  EjercicioTemplate,
  EJERCICIOS_TEMPLATE,
  getGruposDeJugador,
  PosicionFinal,
} from "@/mocks/rugbyData";

export interface ItemAgendaResuelto {
  agendaItemId: string;
  ejercicio: EjercicioTemplate;
  fecha: string;
}

/**
 * Regla de negocio crítica: deduplicación para jugadores polifuncionales.
 *
 * Un jugador ve una tarjeta por ejercicio por día, incluso si ese ejercicio
 * fue asignado a múltiples jerarquías que el jugador cumple simultáneamente.
 * La clave de deduplicación es: ejercicioId + fecha.
 */
export function getItemsParaJugador(
  posiciones: PosicionFinal[],
  fecha: string,
  agenda: AgendaItem[],
  ejercicios: EjercicioTemplate[] = EJERCICIOS_TEMPLATE
): ItemAgendaResuelto[] {
  const gruposDelJugador = getGruposDeJugador(posiciones);

  const itemsDelDia = agenda.filter(
    (item) =>
      item.fecha === fecha &&
      item.targets.some((t) => gruposDelJugador.includes(t))
  );

  const seen = new Map<string, ItemAgendaResuelto>();
  for (const item of itemsDelDia) {
    if (seen.has(item.ejercicioId)) continue;
    const ejercicio = ejercicios.find((e) => e.id === item.ejercicioId);
    if (!ejercicio) continue;
    seen.set(item.ejercicioId, {
      agendaItemId: item.id,
      ejercicio,
      fecha: item.fecha,
    });
  }

  return Array.from(seen.values());
}

/**
 * Para la vista del planificador: todos los items de un día sin filtrar por jugador.
 * El entrenador ve cada assignment individualmente (sin dedup por ejercicioId).
 */
export function getItemsUnicosPorDia(
  fecha: string,
  agenda: AgendaItem[],
  ejercicios: EjercicioTemplate[] = EJERCICIOS_TEMPLATE
): (AgendaItem & { ejercicio: EjercicioTemplate })[] {
  const itemsDelDia = agenda.filter((item) => item.fecha === fecha);
  const seen = new Map<string, AgendaItem & { ejercicio: EjercicioTemplate }>();

  for (const item of itemsDelDia) {
    const ejercicio = ejercicios.find((e) => e.id === item.ejercicioId);
    if (!ejercicio) continue;
    seen.set(item.id, { ...item, ejercicio });
  }

  return Array.from(seen.values());
}
