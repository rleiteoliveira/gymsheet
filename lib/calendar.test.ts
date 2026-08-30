import { describe, expect, it } from 'vitest';
import { calendarGrid, localNoonIso, monthTitle, sessionsForDate } from './calendar';
import { localCivilDateKey } from './session';
import type { Session } from './types';

process.env.TZ = 'America/Fortaleza';

function session(id: string, startedAt: string, state: Session['state'] = 'completed'): Session {
  return {
    id,
    sourcePlanId: null,
    sourcePlanName: null,
    state,
    startedAt,
    completedAt: state === 'completed' ? startedAt : null,
    exercises: [],
  };
}

describe('calendário civil local', () => {
  it('cria sessões retroativas ao meio-dia local sem trocar o dia', () => {
    const startedAt = localNoonIso('2026-08-28');
    expect(localCivilDateKey(startedAt)).toBe('2026-08-28');
    expect(new Date(startedAt).getHours()).toBe(12);
  });

  it('mantém várias sessões no mesmo dia ordenadas pelo início', () => {
    const sessions = [
      session('later', '2026-08-28T17:00:00.000Z'),
      session('first', '2026-08-28T15:00:00.000Z'),
      session('other-day', '2026-08-29T15:00:00.000Z'),
    ];

    expect(sessionsForDate(sessions, '2026-08-28').map((item) => item.id)).toEqual(['first', 'later']);
  });

  it('começa a grade na segunda e marca hoje/futuro', () => {
    const days = calendarGrid('2026-08-01', [session('today', '2026-08-15T15:00:00.000Z')], new Date('2026-08-15T09:00:00-03:00'));

    expect(days).toHaveLength(42);
    expect(days[0].date.getDay()).toBe(1);
    expect(days.find((day) => day.dateKey === '2026-08-15')?.isToday).toBe(true);
    expect(days.find((day) => day.dateKey === '2026-08-16')?.isFuture).toBe(true);
    expect(monthTitle('2026-08-15')).toContain('2026');
  });
});
