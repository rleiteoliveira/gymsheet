import type {
  ExerciseSnapshot,
  Plan,
  PlanExercise,
  Session,
  SessionExercise,
  SetRecord,
} from './types';

type IdFactory = () => string;

export type SessionStartDecision =
  | { kind: 'create' }
  | { kind: 'resume-today'; session: Session }
  | { kind: 'choose-previous'; session: Session };

export type SessionEdit =
  | { type: 'save-set'; exerciseId: string; set: SetRecord }
  | { type: 'skip'; exerciseId: string }
  | { type: 'undo'; exerciseId: string }
  | { type: 'swap'; exerciseId: string; performed: ExerciseSnapshot }
  | { type: 'add'; exercise: SessionExercise };

function cloneExerciseSnapshot(exercise: ExerciseSnapshot): ExerciseSnapshot {
  return {
    ...exercise,
    primaryMuscles: [...exercise.primaryMuscles],
    images: [...exercise.images],
    instructions: [...exercise.instructions],
  };
}

export function clonePlanExercise(exercise: PlanExercise): PlanExercise {
  return {
    ...exercise,
    exercise: cloneExerciseSnapshot(exercise.exercise),
  };
}

function cloneSessionExercise(exercise: SessionExercise): SessionExercise {
  return {
    ...exercise,
    planned: exercise.planned ? clonePlanExercise(exercise.planned) : null,
    performed: exercise.performed ? cloneExerciseSnapshot(exercise.performed) : null,
    sets: exercise.sets.map((set) => ({ ...set })),
  };
}

export function localCivilDateKey(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localCivilDateTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const seconds = `${date.getSeconds()}`.padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHours = `${Math.floor(Math.abs(offsetMinutes) / 60)}`.padStart(2, '0');
  const offsetRemainder = `${Math.abs(offsetMinutes) % 60}`.padStart(2, '0');
  return `${localCivilDateKey(date)}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetRemainder}`;
}

export function decideSessionStart(sessions: Session[], now: Date): SessionStartDecision {
  const inProgress = sessions.filter((session) => session.state === 'in_progress');
  const today = inProgress.find((session) => localCivilDateKey(session.startedAt) === localCivilDateKey(now));
  if (today) return { kind: 'resume-today', session: today };

  const previous = [...inProgress].sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
  return previous ? { kind: 'choose-previous', session: previous } : { kind: 'create' };
}

export function createSessionFromPlan(plan: Plan | undefined, startedAt: Date, makeId: IdFactory): Session {
  return {
    id: makeId(),
    sourcePlanId: plan?.id ?? null,
    sourcePlanName: plan?.name ?? null,
    state: 'in_progress',
    startedAt: startedAt.toISOString(),
    completedAt: null,
    exercises: plan
      ? plan.exercises.map((exercise, index) => ({
          id: makeId(),
          order: index,
          planned: clonePlanExercise(exercise),
          performed: null,
          status: null,
          sets: [],
        }))
      : [],
  };
}

export function applySessionEdit(session: Session, edit: SessionEdit): Session {
  if (edit.type === 'add') {
    return { ...session, exercises: [...session.exercises, cloneSessionExercise(edit.exercise)] };
  }

  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.id !== edit.exerciseId) return exercise;

      if (edit.type === 'save-set') {
        return {
          ...exercise,
          status: exercise.status ?? (exercise.planned ? 'done' : 'added'),
          performed: exercise.performed
            ? cloneExerciseSnapshot(exercise.performed)
            : exercise.planned
              ? cloneExerciseSnapshot(exercise.planned.exercise)
              : null,
          sets: [...exercise.sets, { ...edit.set }],
        };
      }
      if (edit.type === 'skip') {
        return { ...exercise, status: 'skipped', performed: null, sets: [] };
      }
      if (edit.type === 'undo') {
        return { ...exercise, status: null, performed: null, sets: [] };
      }
      return {
        ...exercise,
        status: 'swapped',
        performed: cloneExerciseSnapshot(edit.performed),
        sets: [],
      };
    }),
  };
}

export function completeSession(session: Session, completedAt: Date): Session {
  return {
    ...session,
    state: 'completed',
    completedAt: completedAt.toISOString(),
    exercises: session.exercises.map((exercise) =>
      exercise.status === null ? { ...exercise, status: 'skipped' } : exercise,
    ),
  };
}
