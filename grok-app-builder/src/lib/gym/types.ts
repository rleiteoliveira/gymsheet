export type ExerciseStatus = "done" | "skipped" | "swapped" | "added";

export interface ExerciseSnapshot {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
}

export interface PlanExercise {
  id: string;
  order: number;
  exercise: ExerciseSnapshot;
  targetSets: number;
  targetReps: number;
  targetKg: number | null;
}

export interface Plan {
  id: string;
  name: string;
  exercises: PlanExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface SetRecord {
  id: string;
  index: number;
  kg: number | null;
  reps: number;
  savedAt: string;
}

export interface SessionExercise {
  id: string;
  order: number;
  planned: PlanExercise | null;
  performed: ExerciseSnapshot | null;
  status: ExerciseStatus | null;
  sets: SetRecord[];
}

export interface Session {
  id: string;
  sourcePlanId: string | null;
  sourcePlanName: string | null;
  state: "in_progress" | "completed";
  startedAt: string;
  completedAt: string | null;
  exercises: SessionExercise[];
}

export type TodayPin = { kind: "plan"; id: string } | { kind: "session"; id: string } | null;

export interface AppState {
  plans: Plan[];
  sessions: Session[];
  todayPin: TodayPin;
  customExercises: ExerciseSnapshot[];
}

export const EMPTY_STATE: AppState = {
  plans: [],
  sessions: [],
  todayPin: null,
  customExercises: [],
};
