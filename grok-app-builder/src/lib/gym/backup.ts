import { z } from "zod";
import { EMPTY_STATE, type AppState, type Plan } from "./types";

const snapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  equipment: z.string().nullable(),
  primaryMuscles: z.array(z.string()),
});

const planExerciseSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  exercise: snapshotSchema,
  targetSets: z.number().int().min(1).max(30),
  targetReps: z.number().int().min(1).max(999),
  targetKg: z.number().nonnegative().nullable(),
});

const planSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    emoji: z.string().nullable().optional(),
    exercises: z.array(planExerciseSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .transform(({ emoji: _emoji, ...plan }) => plan);

const setSchema = z.object({
  id: z.string(),
  index: z.number().int().min(1),
  kg: z.number().nonnegative().nullable(),
  reps: z.number().int().min(0).max(999),
  savedAt: z.string(),
});

const sessionExerciseSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  planned: planExerciseSchema.nullable(),
  performed: snapshotSchema.nullable(),
  status: z.enum(["done", "skipped", "swapped", "added"]).nullable(),
  sets: z.array(setSchema),
});

const appStateSchema = z.object({
  plans: z.array(planSchema),
  sessions: z.array(
    z.object({
      id: z.string(),
      sourcePlanId: z.string().nullable(),
      sourcePlanName: z.string().nullable(),
      state: z.enum(["in_progress", "completed"]),
      startedAt: z.string(),
      completedAt: z.string().nullable(),
      exercises: z.array(sessionExerciseSchema),
    }),
  ),
  todayPin: z
    .object({ kind: z.enum(["plan", "session"]), id: z.string() })
    .nullable(),
  customExercises: z.array(snapshotSchema).optional(),
});

const backupSchema = z.object({
  schemaVersion: z.number().int(),
  app: z.string(),
  exportedAt: z.string(),
  data: appStateSchema,
});

function normalize(state: z.infer<typeof appStateSchema>): AppState {
  return {
    plans: state.plans as Plan[],
    sessions: state.sessions,
    todayPin: state.todayPin,
    customExercises: state.customExercises ?? [],
  };
}

export function parseBackup(raw: unknown): AppState {
  const parsed = backupSchema.parse(raw);
  return normalize(parsed.data);
}

export function createBackup(data: AppState) {
  return {
    schemaVersion: 3,
    app: "gymsheet",
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function safeParseBackup(raw: unknown): AppState | null {
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) return null;
  return normalize(parsed.data.data);
}

export function emptyState(): AppState {
  return structuredClone(EMPTY_STATE);
}
