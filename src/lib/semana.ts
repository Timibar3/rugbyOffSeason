export interface DiaSemana {
  fecha: string;   // "YYYY-MM-DD"
  label: string;   // "LUN", "MAR", …
  numero: number;
}

const LABELS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

function toISO(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getFechaHoy(): string {
  return toISO(new Date());
}

/** Lunes de la semana actual (ISO). */
export function getLunesSemana(): string {
  const hoy = new Date();
  const dow = hoy.getDay();
  const d = new Date(hoy);
  d.setDate(hoy.getDate() - (dow === 0 ? 6 : dow - 1));
  return toISO(d);
}

/** Domingo de la semana actual (ISO). */
export function getDomingoSemana(): string {
  const hoy = new Date();
  const dow = hoy.getDay();
  const d = new Date(hoy);
  d.setDate(hoy.getDate() + (dow === 0 ? 0 : 7 - dow));
  return toISO(d);
}

/** 7 días Mon→Sun de la semana actual. */
export function getSemanaActual(): DiaSemana[] {
  const hoy = new Date();
  const dow = hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - (dow === 0 ? 6 : dow - 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return { fecha: toISO(d), label: LABELS[i], numero: d.getDate() };
  });
}
