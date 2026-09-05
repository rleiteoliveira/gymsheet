export function localCivilDateKey(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error(`Data inválida: ${dateKey}`);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}

export function addCivilDays(input: Date | string, amount: number): Date {
  const date = typeof input === "string" ? parseLocalDateKey(input) : new Date(input);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12, 0, 0, 0);
}

export function startOfWeek(now = new Date()) {
  const date = new Date(now);
  const fromMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - fromMonday);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function weekDays(now = new Date()): Date[] {
  const start = startOfWeek(now);
  return [0, 1, 2, 3, 4, 5, 6].map((index) => addCivilDays(start, index));
}


export function formatWeekday(input: Date | string, style: "long" | "short" = "long") {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", { weekday: style }).format(date);
}

export function formatDayMonth(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(date);
}

export function formatShortDate(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

export function formatRelativeDay(input: Date | string, now = new Date()) {
  const key = localCivilDateKey(input);
  const today = localCivilDateKey(now);
  if (key === today) return "hoje";
  if (key === localCivilDateKey(addCivilDays(now, -1))) return "ontem";
  return formatShortDate(input);
}

export function formatClock(input: Date | string) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatElapsed(startedAt: string, now: Date) {
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function formatDuration(startedAt: string, completedAt: string | null) {
  if (!completedAt) return null;
  const minutes = Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000));
  return `${minutes} min`;
}
