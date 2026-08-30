import type { Session } from './types';
import { localCivilDateKey } from './session';

export interface CalendarDay {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  sessions: Session[];
}

function dateAtNoon(year: number, month: number, day: number) {
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function parseLocalDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) throw new Error(`Data civil inválida: ${dateKey}`);
  return dateAtNoon(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function addCivilDays(input: Date | string, amount: number): Date {
  const date = typeof input === 'string' ? parseLocalDateKey(input) : new Date(input);
  return dateAtNoon(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function monthStart(input: Date | string): Date {
  const date = typeof input === 'string' ? parseLocalDateKey(input) : new Date(input);
  return dateAtNoon(date.getFullYear(), date.getMonth(), 1);
}

export function monthTitle(input: Date | string): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(monthStart(input));
}

export function localNoonIso(dateKey: string): string {
  return parseLocalDateKey(dateKey).toISOString();
}

export function sessionsForDate(sessions: Session[], dateKey: string): Session[] {
  return sessions
    .filter((session) => localCivilDateKey(session.startedAt) === dateKey)
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt));
}

export function calendarGrid(input: Date | string, sessions: Session[], now = new Date()): CalendarDay[] {
  const currentMonth = monthStart(input);
  const firstOffset = (currentMonth.getDay() + 6) % 7;
  const firstDay = addCivilDays(currentMonth, -firstOffset);
  const todayKey = localCivilDateKey(now);
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();

  return Array.from({ length: 42 }, (_, index) => {
    const date = addCivilDays(firstDay, index);
    const dateKey = localCivilDateKey(date);
    return {
      date,
      dateKey,
      inCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
      isToday: dateKey === todayKey,
      isFuture: dateKey > todayKey,
      sessions: sessionsForDate(sessions, dateKey),
    };
  });
}
