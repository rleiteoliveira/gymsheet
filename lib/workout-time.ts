export type WorkoutTimeState = 'in_progress' | 'completed';

const INVALID_TIME = 'Tempo indisponível';
const INVALID_CLOCK = 'Horário indisponível';

function dateFrom(value: string | Date | number): Date | null {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function elapsedMilliseconds(startedAt: string, endedAt: string | Date | number): number | null {
  const start = dateFrom(startedAt);
  const end = dateFrom(endedAt);
  if (!start || !end) return null;
  return Math.max(0, end.getTime() - start.getTime());
}

export function workoutElapsedMilliseconds(
  startedAt: string,
  state: WorkoutTimeState,
  completedAt: string | null,
  now = Date.now(),
): number | null {
  return elapsedMilliseconds(startedAt, state === 'completed' ? completedAt ?? '' : now);
}

export function formatElapsedDuration(milliseconds: number | null): string {
  if (milliseconds === null) return INVALID_TIME;
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${hours}:${clock}` : clock;
}

export function formatLocalClock(value: string | Date | number): string {
  const date = dateFrom(value);
  if (!date) return INVALID_CLOCK;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatLocalDate(value: string | Date | number): string {
  const date = dateFrom(value);
  if (!date) return INVALID_CLOCK;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatAccessibleDateTime(value: string | Date | number): string {
  const date = dateFrom(value);
  if (!date) return INVALID_CLOCK;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

export function localDateKey(value: string | Date | number): string | null {
  const date = dateFrom(value);
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatSetRecordedAt(savedAt: string, sessionStartedAt: string): string {
  const time = formatLocalClock(savedAt);
  const savedDate = localDateKey(savedAt);
  const sessionDate = localDateKey(sessionStartedAt);
  if (time === INVALID_CLOCK) return INVALID_CLOCK;
  if (savedDate && sessionDate && savedDate !== sessionDate) return `Registrada em ${formatLocalDate(savedAt)} às ${time}`;
  return time;
}
