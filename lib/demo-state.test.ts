import { describe, expect, it } from 'vitest';
import { addCivilDays } from './calendar';
import { buildDemoState } from './demo-state';
import { localCivilDateKey } from './session';

process.env.TZ = 'America/Fortaleza';

describe('diário demonstrativo', () => {
  const now = new Date('2026-08-30T09:00:00-03:00');

  it('gera fichas e sessões em dias civis relativos ao agora', () => {
    const state = buildDemoState(now);
    const completedDays = new Set(
      state.sessions
        .filter((session) => session.state === 'completed')
        .map((session) => localCivilDateKey(session.startedAt)),
    );

    expect(state.plans).toHaveLength(3);
    expect(completedDays.size).toBeGreaterThanOrEqual(4);
    expect([...completedDays]).toEqual(
      expect.arrayContaining([
        localCivilDateKey(now),
        localCivilDateKey(addCivilDays(now, -1)),
        localCivilDateKey(addCivilDays(now, -3)),
        localCivilDateKey(addCivilDays(now, -7)),
        localCivilDateKey(addCivilDays(now, -10)),
      ]),
    );
  });

  it('inclui a sessão de ontem em andamento ao meio-dia local', () => {
    const state = buildDemoState(now);
    const inProgress = state.sessions.find(
      (session) => session.state === 'in_progress',
    );

    expect(inProgress).toBeDefined();
    expect(localCivilDateKey(inProgress!.startedAt)).toBe(
      localCivilDateKey(addCivilDays(now, -1)),
    );
    expect(new Date(inProgress!.startedAt).getHours()).toBe(12);
  });

  it('inclui estados de exercício e fixa a ficha de peito em Hoje', () => {
    const state = buildDemoState(now);
    const completedExercises = state.sessions
      .filter((session) => session.state === 'completed')
      .flatMap((session) => session.exercises);
    const swapped = completedExercises.find(
      (exercise) => exercise.status === 'swapped',
    );

    expect(completedExercises.map((exercise) => exercise.status)).toEqual(
      expect.arrayContaining(['skipped', 'swapped']),
    );
    expect(swapped?.planned?.exercise.id).not.toBe(swapped?.performed?.id);
    expect(swapped?.sets.length).toBeGreaterThan(0);
    expect(
      completedExercises
        .filter((exercise) => exercise.status !== 'skipped')
        .every(
          (exercise) =>
            exercise.sets.length > 0 &&
            exercise.sets.every((set) => set.kg !== null && set.reps > 0),
        ),
    ).toBe(true);
    expect(state.todayPin?.kind).toBe('plan');
    expect(state.todayPin?.id).toBe(state.plans[0].id);
  });
});
