export type ExerciseStatus = 'done' | 'skipped' | 'swapped' | 'added';

export type CatalogSource = 'live' | 'cached' | 'fallback';

export interface CatalogExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

export interface ExerciseSnapshot {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  images: string[];
  instructions: string[];
  category: string;
  mechanic: string | null;
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
  state: 'in_progress' | 'completed';
  startedAt: string;
  completedAt: string | null;
  exercises: SessionExercise[];
}

export type TodayPin =
  | { kind: 'plan'; id: string }
  | { kind: 'session'; id: string }
  | null;

export interface AppState {
  plans: Plan[];
  sessions: Session[];
  todayPin: TodayPin;
}

export interface CatalogCache {
  id: 'current';
  exercises: CatalogExercise[];
  savedAt: string;
}

export interface BackupV1 {
  schemaVersion: 1;
  app: 'treino-de-hoje';
  exportedAt: string;
  data: AppState;
}

export const STATUS_LABELS: Record<ExerciseStatus, string> = {
  done: 'Feito',
  skipped: 'Pulado',
  swapped: 'Trocado',
  added: 'Adicionado',
};

export const STATUS_HINTS: Record<ExerciseStatus, string> = {
  done: 'feito conforme a ficha',
  skipped: 'não realizado',
  swapped: 'planejado e feito diferentes',
  added: 'entrou durante a sessão',
};

