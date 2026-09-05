import type {
  ExerciseSnapshot,
  Plan,
  PlanExercise,
  Session,
  SessionExercise,
  SetRecord,
} from "./types";
import { localCivilDateKey } from "./dates";

type IdFactory = () => string;

export type SessionStartDecision =
  | { kind: "create" }
  | { kind: "resume-today"; session: Session }
  | { kind: "choose-previous"; session: Session };

export function cloneSnapshot(exercise: ExerciseSnapshot): ExerciseSnapshot {
  return {
    ...exercise,
    primaryMuscles: [...exercise.primaryMuscles],
  };
}

export function clonePlanExercise(exercise: PlanExercise): PlanExercise {
  return {
    ...exercise,
    exercise: cloneSnapshot(exercise.exercise),
  };
}

export function decideSessionStart(sessions: Session[], now = new Date()): SessionStartDecision {
  const inProgress = sessions.filter((session) => session.state === "in_progress");
  const today = inProgress.find(
    (session) => localCivilDateKey(session.startedAt) === localCivilDateKey(now),
  );
  if (today) return { kind: "resume-today", session: today };
  const previous = [...inProgress].sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
  return previous ? { kind: "choose-previous", session: previous } : { kind: "create" };
}

export function createSessionFromPlan(plan: Plan | undefined, startedAt: Date, makeId: IdFactory): Session {
  return {
    id: makeId(),
    sourcePlanId: plan?.id ?? null,
    sourcePlanName: plan?.name ?? null,
    state: "in_progress",
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

export function createQuickSession(name: string, startedAt: Date, makeId: IdFactory): Session {
  return {
    id: makeId(),
    sourcePlanId: null,
    sourcePlanName: name,
    state: "in_progress",
    startedAt: startedAt.toISOString(),
    completedAt: null,
    exercises: [],
  };
}

export function saveSet(session: Session, exerciseId: string, set: SetRecord): Session {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;
      return {
        ...exercise,
        status: exercise.status ?? (exercise.planned ? "done" : "added"),
        performed: exercise.performed
          ? cloneSnapshot(exercise.performed)
          : exercise.planned
            ? cloneSnapshot(exercise.planned.exercise)
            : null,
        sets: [...exercise.sets, { ...set }],
      };
    }),
  };
}

export function skipExercise(session: Session, exerciseId: string): Session {
  return {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id === exerciseId
        ? { ...exercise, status: "skipped" as const, performed: null, sets: [] }
        : exercise,
    ),
  };
}

export function undoExercise(session: Session, exerciseId: string): Session {
  return {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id === exerciseId
        ? { ...exercise, status: null, performed: null, sets: [] }
        : exercise,
    ),
  };
}

export function swapExercise(session: Session, exerciseId: string, performed: ExerciseSnapshot): Session {
  return {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.id === exerciseId
        ? { ...exercise, status: "swapped" as const, performed: cloneSnapshot(performed), sets: [] }
        : exercise,
    ),
  };
}

export function addExercise(session: Session, exercise: SessionExercise): Session {
  return { ...session, exercises: [...session.exercises, exercise] };
}

export function completeSession(session: Session, completedAt: Date): Session {
  return {
    ...session,
    state: "completed",
    completedAt: completedAt.toISOString(),
    exercises: session.exercises.map((exercise) =>
      exercise.status === null ? { ...exercise, status: "skipped" as const } : exercise,
    ),
  };
}

export function exerciseTitle(exercise: SessionExercise) {
  return exercise.performed?.name ?? exercise.planned?.exercise.name ?? "Exercício";
}

export function currentExercise(session: Session) {
  return (
    session.exercises.find((exercise) => exercise.status === null) ??
    session.exercises.find((exercise) => exercise.status === "done" || exercise.status === "swapped" || exercise.status === "added") ??
    session.exercises[0] ??
    null
  );
}

export function lastLoadFor(sessions: Session[], exerciseId: string): { kg: number | null; reps: number } | null {
  const completed = [...sessions]
    .filter((session) => session.state === "completed")
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt));

  for (const session of completed) {
    for (const exercise of session.exercises) {
      const id = exercise.performed?.id ?? exercise.planned?.exercise.id;
      if (id === exerciseId && exercise.sets.length > 0) {
        const last = exercise.sets[exercise.sets.length - 1];
        return { kg: last.kg, reps: last.reps };
      }
    }
  }
  return null;
}

export function sessionProgress(session: Session) {
  const total = session.exercises.length;
  const done = session.exercises.filter((exercise) => exercise.status !== null).length;
  return { done, total };
}
