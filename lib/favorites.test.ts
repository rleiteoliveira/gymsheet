import { describe, expect, it } from 'vitest';
import { computeFavoriteScores, rankCatalogExercises } from './favorites';
import type { CatalogExercise, ExerciseSnapshot, Session, SessionExercise } from './types';

process.env.TZ = 'America/Fortaleza';

function snapshot(id: string, name = id): ExerciseSnapshot {
  return {
    id,
    name,
    equipment: 'barbell',
    primaryMuscles: ['chest'],
    images: [],
    instructions: [],
    category: 'strength',
    mechanic: 'compound',
  };
}

function exercise(id: string, status: SessionExercise['status'], performedId = id, plannedId = id): SessionExercise {
  return {
    id: `session-${id}-${status}`,
    order: 0,
    planned: plannedId ? { id: `plan-${plannedId}`, order: 0, exercise: snapshot(plannedId), targetSets: 3, targetReps: 10, targetKg: null } : null,
    performed: performedId ? snapshot(performedId) : null,
    status,
    sets: status === 'skipped' ? [] : [{ id: `set-${id}`, index: 1, kg: 10, reps: 10, savedAt: '2026-08-15T15:00:00.000Z' }],
  };
}

function session(id: string, startedAt: string, state: Session['state'], exercises: SessionExercise[]): Session {
  return { id, sourcePlanId: null, sourcePlanName: null, state, startedAt, completedAt: state === 'completed' ? startedAt : null, exercises };
}

function catalog(id: string, name: string): CatalogExercise {
  return { id, name, force: null, level: 'beginner', mechanic: 'compound', equipment: 'barbell', primaryMuscles: ['chest'], secondaryMuscles: [], instructions: [], category: 'strength', images: [] };
}

describe('favoritos automáticos', () => {
  it('pontua exercícios válidos em sessões concluídas nos últimos 30 dias', () => {
    const now = new Date('2026-08-29T09:00:00-03:00');
    const scores = computeFavoriteScores([
      session('one', '2026-08-28T15:00:00.000Z', 'completed', [exercise('bench', 'done'), exercise('skip', 'skipped')]),
      session('two', '2026-08-20T15:00:00.000Z', 'completed', [exercise('bench', 'added'), exercise('planned', 'swapped', 'arnold', 'planned')]),
      session('open', '2026-08-29T12:00:00.000Z', 'in_progress', [exercise('bench', 'done')]),
      session('old', '2026-07-30T15:00:00.000Z', 'completed', [exercise('bench', 'done')]),
    ], now);

    expect(scores.get('bench')).toEqual({ count: 2, lastUsedAt: '2026-08-28T15:00:00.000Z' });
    expect(scores.get('arnold')).toEqual({ count: 1, lastUsedAt: '2026-08-20T15:00:00.000Z' });
    expect(scores.has('planned')).toBe(false);
    expect(scores.has('skip')).toBe(false);
  });

  it('coloca favoritos antes dos demais e usa nome no desempate', () => {
    const scores = new Map([
      ['b', { count: 1, lastUsedAt: '2026-08-28T15:00:00.000Z' }],
      ['a', { count: 1, lastUsedAt: '2026-08-28T15:00:00.000Z' }],
    ]);
    const ranked = rankCatalogExercises([catalog('z', 'Zeta'), catalog('b', 'Beta'), catalog('a', 'Alpha')], scores);

    expect(ranked.map((item) => item.id)).toEqual(['a', 'b', 'z']);
  });
});
