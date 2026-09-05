import { addCivilDays } from './calendar';
import { FALLBACK_EXERCISES, toSnapshot } from './catalog';
import {
  applySessionEdit,
  completeSession,
  createSessionFromPlan,
} from './session';
import type {
  AppState,
  ExerciseSnapshot,
  Plan,
  Session,
  SessionExercise,
} from './types';

type MakeId = () => string;

interface PlanExerciseSpec {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  targetKg: number | null;
}

function makeIdFactory(): MakeId {
  let sequence = 0;
  return () => `demo-${String(++sequence).padStart(4, '0')}`;
}

function snapshotFor(exerciseId: string): ExerciseSnapshot {
  const catalogExercise = FALLBACK_EXERCISES.find(
    (exercise) => exercise.id === exerciseId,
  );
  if (!catalogExercise)
    throw new Error(`Exercício demonstrativo ausente: ${exerciseId}`);

  const snapshot = toSnapshot(catalogExercise);
  return {
    ...snapshot,
    primaryMuscles: [...snapshot.primaryMuscles],
    images: [...snapshot.images],
    instructions: [...snapshot.instructions],
  };
}

function localTime(day: Date, hour: number, minute: number): Date {
  const value = new Date(day);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function makePlan(
  name: string,
  emoji: string,
  exercises: PlanExerciseSpec[],
  createdAt: Date,
  updatedAt: Date,
  makeId: MakeId,
): Plan {
  return {
    id: makeId(),
    name,
    emoji,
    exercises: exercises.map((spec, order) => ({
      id: makeId(),
      order,
      exercise: snapshotFor(spec.exerciseId),
      targetSets: spec.targetSets,
      targetReps: spec.targetReps,
      targetKg: spec.targetKg,
    })),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

function saveDemoSet(
  session: Session,
  exerciseId: string,
  day: Date,
  kg: number,
  reps: number,
  makeId: MakeId,
): Session {
  const exercise = session.exercises.find((item) => item.id === exerciseId);
  if (!exercise)
    throw new Error(`Exercício da sessão demonstrativa ausente: ${exerciseId}`);

  return applySessionEdit(session, {
    type: 'save-set',
    exerciseId,
    set: {
      id: makeId(),
      index: exercise.sets.length + 1,
      kg,
      reps,
      savedAt: localTime(day, 8, 30).toISOString(),
    },
  });
}

function makeCompletedSession(
  plan: Plan,
  day: Date,
  swappedExerciseId: string,
  addedExerciseId: string,
  makeId: MakeId,
  baseKg: number,
): Session {
  let session = createSessionFromPlan(plan, localTime(day, 8, 0), makeId);
  const [done, skipped, swapped] = session.exercises;
  if (!done || !skipped || !swapped)
    throw new Error('A ficha demonstrativa precisa de três exercícios');

  session = saveDemoSet(session, done.id, day, baseKg, 8, makeId);
  session = applySessionEdit(session, { type: 'skip', exerciseId: skipped.id });
  session = applySessionEdit(session, {
    type: 'swap',
    exerciseId: swapped.id,
    performed: snapshotFor(swappedExerciseId),
  });
  session = saveDemoSet(
    session,
    swapped.id,
    day,
    Math.max(1, Math.round(baseKg / 2)),
    10,
    makeId,
  );

  const added: SessionExercise = {
    id: makeId(),
    order: session.exercises.length,
    planned: null,
    performed: snapshotFor(addedExerciseId),
    status: 'added',
    sets: [],
  };
  session = applySessionEdit(session, { type: 'add', exercise: added });
  session = saveDemoSet(
    session,
    added.id,
    day,
    Math.max(1, Math.round(baseKg / 3)),
    12,
    makeId,
  );

  return completeSession(session, localTime(day, 9, 15));
}

function makeInProgressSession(plan: Plan, day: Date, makeId: MakeId): Session {
  return createSessionFromPlan(plan, localTime(day, 12, 0), makeId);
}

export function buildDemoState(now = new Date()): AppState {
  const makeId = makeIdFactory();
  const today = addCivilDays(now, 0);
  const yesterday = addCivilDays(now, -1);
  const threeDaysAgo = addCivilDays(now, -3);
  const sevenDaysAgo = addCivilDays(now, -7);
  const tenDaysAgo = addCivilDays(now, -10);
  const planCreatedAt = localTime(tenDaysAgo, 7, 0);
  const planUpdatedAt = new Date(now);

  const chestPlan = makePlan(
    'Peito + ombro',
    '💪',
    [
      {
        exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
        targetSets: 4,
        targetReps: 8,
        targetKg: 60,
      },
      {
        exerciseId: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
        targetSets: 3,
        targetReps: 10,
        targetKg: 45,
      },
      {
        exerciseId: 'Barbell_Shoulder_Press',
        targetSets: 3,
        targetReps: 10,
        targetKg: 30,
      },
    ],
    planCreatedAt,
    planUpdatedAt,
    makeId,
  );
  const backPlan = makePlan(
    'Costa',
    '🥋',
    [
      {
        exerciseId: 'Bent_Over_Barbell_Row',
        targetSets: 4,
        targetReps: 8,
        targetKg: 55,
      },
      {
        exerciseId: 'Wide-Grip_Lat_Pulldown',
        targetSets: 3,
        targetReps: 10,
        targetKg: 50,
      },
      { exerciseId: 'Pullups', targetSets: 3, targetReps: 8, targetKg: null },
    ],
    planCreatedAt,
    planUpdatedAt,
    makeId,
  );
  const legPlan = makePlan(
    'Perna',
    '🦵',
    [
      {
        exerciseId: 'Barbell_Squat',
        targetSets: 4,
        targetReps: 8,
        targetKg: 70,
      },
      { exerciseId: 'Leg_Press', targetSets: 3, targetReps: 12, targetKg: 120 },
      {
        exerciseId: 'Romanian_Deadlift',
        targetSets: 3,
        targetReps: 10,
        targetKg: 60,
      },
    ],
    planCreatedAt,
    planUpdatedAt,
    makeId,
  );

  const sessions = [
    makeCompletedSession(
      chestPlan,
      today,
      'Arnold_Dumbbell_Press',
      'Dips_-_Chest_Version',
      makeId,
      62,
    ),
    makeCompletedSession(
      backPlan,
      yesterday,
      'Chin-Up',
      'T-Bar_Row_with_Handle',
      makeId,
      55,
    ),
    makeInProgressSession(legPlan, yesterday, makeId),
    makeCompletedSession(
      legPlan,
      threeDaysAgo,
      'Stiff-Legged_Dumbbell_Deadlift',
      'Dumbbell_Lunges',
      makeId,
      70,
    ),
    makeCompletedSession(
      backPlan,
      sevenDaysAgo,
      'Chin-Up',
      'T-Bar_Row_with_Handle',
      makeId,
      52,
    ),
    makeCompletedSession(
      chestPlan,
      tenDaysAgo,
      'Arnold_Dumbbell_Press',
      'Dips_-_Chest_Version',
      makeId,
      60,
    ),
  ];

  return {
    plans: [chestPlan, backPlan, legPlan],
    sessions,
    todayPin: { kind: 'plan', id: chestPlan.id },
  };
}
