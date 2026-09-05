export function formatKg(value: number | null | undefined) {
  if (value === null || value === undefined) return "corpo";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
}

export function formatSet(kg: number | null, reps: number) {
  if (kg === null) return `${reps} reps`;
  return `${formatKg(kg)} × ${reps}`;
}

export function formatTarget(sets: number, reps: number, kg: number | null) {
  const load = kg === null ? "corpo" : formatKg(kg);
  return `${sets} × ${reps} · ${load}`;
}

export function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function kgInput(value: number | null) {
  if (value === null) return "";
  return String(value).replace(".", ",");
}
