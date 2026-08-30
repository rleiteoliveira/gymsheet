import { describe, expect, it } from 'vitest';
import {
  applySessionEdit,
  completeSession,
  createSessionFromPlan,
  decideSessionStart,
  localCivilDateKey,
  localCivilDateTime,
} from './session';
import type { ExerciseSnapshot, Plan, SessionExercise } from './types';

process.env.TZ = 'America/Fortaleza';

function snapshot(id: string, name: string): ExerciseSnapshot {
  return {
    id,
    name,
    equipment: 'barbell',
    primaryMuscles: ['chest'],
    images: [`${id}.jpg`],
    instructions: [`Faça ${name}`],
    category: 'strength',
    mechanic: 'compound',
  };
}

function makePlan(): Plan {
  return {
    id: 'plan-push',
    name: 'Push completo',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-20T12:00:00.000Z',
    exercises: [
      {
        id: 'plan-bench',
        order: 0,
        exercise: snapshot('bench', 'Supino reto'),
        targetSets: 3,
        targetReps: 8,
        targetKg: 60,
      },
      {
        id: 'plan-dips',
        order: 1,
        exercise: snapshot('dips', 'Paralelas'),
        targetSets: 3,
        targetReps: 10,
        targetKg: null,
      },
      {
        id: 'plan-press',
        order: 2,
        exercise: snapshot('press', 'Desenvolvimento'),
        targetSets: 3,
        targetReps: 10,
        targetKg: 30,
      },
    ],
  };
}

function sequentialIds(prefix = 'id') {
  let value = 0;
  return () => `${prefix}-${++value}`;
}

describe('dia civil local', () => {
  it('não usa a data UTC para separar sessões à noite', () => {
    expect(localCivilDateKey('2026-08-29T01:30:00.000Z')).toBe('2026-08-28');
    expect(localCivilDateKey('2026-08-29T02:59:59.000Z')).toBe('2026-08-28');
    expect(localCivilDateKey('2026-08-29T03:00:00.000Z')).toBe('2026-08-29');
    expect(localCivilDateTime('2026-08-29T01:30:00.000Z')).toBe('2026-08-28T22:30:00-03:00');
  });

  it('retoma no mesmo dia e exige escolha para uma sessão anterior', () => {
    const plan = makePlan();
    const yesterday = createSessionFromPlan(plan, new Date('2026-08-28T22:00:00-03:00'), sequentialIds('old'));
    const today = new Date('2026-08-29T09:00:00-03:00');

    expect(decideSessionStart([yesterday], today)).toEqual({ kind: 'choose-previous', session: yesterday });

    const sameDay = createSessionFromPlan(plan, new Date('2026-08-29T06:00:00-03:00'), sequentialIds('today'));
    expect(decideSessionStart([yesterday, sameDay], today)).toEqual({ kind: 'resume-today', session: sameDay });
  });

  it('cria IDs independentes para a mesma ficha em dias diferentes', () => {
    const plan = makePlan();
    const makeId = sequentialIds('session');
    const first = createSessionFromPlan(plan, new Date('2026-08-28T08:00:00-03:00'), makeId);
    const second = createSessionFromPlan(plan, new Date('2026-08-29T08:00:00-03:00'), makeId);

    expect(first.id).not.toBe(second.id);
    expect(localCivilDateKey(first.startedAt)).toBe('2026-08-28');
    expect(localCivilDateKey(second.startedAt)).toBe('2026-08-29');
  });
});

describe('snapshot e edição da sessão', () => {
  it('mantém done, skipped, swapped e added isolados da ficha original', () => {
    const plan = makePlan();
    const originalPlan = structuredClone(plan);
    let session = createSessionFromPlan(plan, new Date('2026-08-29T08:00:00-03:00'), sequentialIds());
    const [done, skipped, swapped] = session.exercises;

    session = applySessionEdit(session, {
      type: 'save-set',
      exerciseId: done.id,
      set: { id: 'set-done', index: 1, kg: 62, reps: 8, savedAt: '2026-08-29T11:10:00.000Z' },
    });
    session = applySessionEdit(session, { type: 'skip', exerciseId: skipped.id });
    session = applySessionEdit(session, {
      type: 'swap',
      exerciseId: swapped.id,
      performed: snapshot('arnold-press', 'Desenvolvimento Arnold'),
    });
    session = applySessionEdit(session, {
      type: 'save-set',
      exerciseId: swapped.id,
      set: { id: 'set-swap', index: 1, kg: 16, reps: 10, savedAt: '2026-08-29T11:20:00.000Z' },
    });

    const added: SessionExercise = {
      id: 'added-fly',
      order: session.exercises.length,
      planned: null,
      performed: snapshot('fly', 'Crucifixo'),
      status: 'added',
      sets: [],
    };
    session = applySessionEdit(session, { type: 'add', exercise: added });
    session = applySessionEdit(session, {
      type: 'save-set',
      exerciseId: added.id,
      set: { id: 'set-added', index: 1, kg: 12, reps: 12, savedAt: '2026-08-29T11:30:00.000Z' },
    });

    expect(plan).toEqual(originalPlan);
    expect(session.exercises.map((exercise) => exercise.status)).toEqual(['done', 'skipped', 'swapped', 'added']);
    expect(session.exercises[2].planned?.exercise.name).toBe('Desenvolvimento');
    expect(session.exercises[2].performed?.name).toBe('Desenvolvimento Arnold');
  });

  it('preserva o nome e os exercícios capturados mesmo se a ficha mudar depois', () => {
    const plan = makePlan();
    const session = createSessionFromPlan(plan, new Date('2026-08-29T08:00:00-03:00'), sequentialIds());

    plan.name = 'Push editado';
    plan.exercises[0].exercise.name = 'Supino alterado';
    plan.exercises[0].exercise.primaryMuscles.push('triceps');

    expect(session.sourcePlanName).toBe('Push completo');
    expect(session.exercises[0].planned?.exercise.name).toBe('Supino reto');
    expect(session.exercises[0].planned?.exercise.primaryMuscles).toEqual(['chest']);
  });

  it('conclui a anterior sem alterar o objeto original e marca pendências como skipped', () => {
    const session = createSessionFromPlan(makePlan(), new Date('2026-08-28T08:00:00-03:00'), sequentialIds());
    const completedAt = new Date('2026-08-29T09:00:00-03:00');
    const completed = completeSession(session, completedAt);

    expect(session.state).toBe('in_progress');
    expect(session.exercises.every((exercise) => exercise.status === null)).toBe(true);
    expect(completed.state).toBe('completed');
    expect(completed.completedAt).toBe(completedAt.toISOString());
    expect(completed.exercises.every((exercise) => exercise.status === 'skipped')).toBe(true);
  });
});
