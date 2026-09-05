import { z } from 'zod';
import { loadCatalogCache, saveCatalogCache } from './storage';
import type { CatalogExercise, CatalogSource } from './types';

export const CATALOG_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
export const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const catalogExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  force: z.string().nullable(),
  level: z.string(),
  mechanic: z.string().nullable(),
  equipment: z.string().nullable(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  instructions: z.array(z.string()),
  category: z.string(),
  images: z.array(z.string()),
});

const fallbackRows: Array<[string, string, string, string]> = [
  ['Barbell_Bench_Press_-_Medium_Grip', 'Barbell Bench Press - Medium Grip', 'chest', 'barbell'],
  ['Barbell_Incline_Bench_Press_-_Medium_Grip', 'Barbell Incline Bench Press - Medium Grip', 'chest', 'barbell'],
  ['Dumbbell_Bench_Press', 'Dumbbell Bench Press', 'chest', 'dumbbell'],
  ['Decline_Dumbbell_Bench_Press', 'Decline Dumbbell Bench Press', 'chest', 'dumbbell'],
  ['Pushups', 'Pushups', 'chest', 'body only'],
  ['Dips_-_Chest_Version', 'Dips - Chest Version', 'chest', 'body only'],
  ['Close-Grip_Barbell_Bench_Press', 'Close-Grip Barbell Bench Press', 'chest', 'barbell'],
  ['Machine_Bench_Press', 'Machine Bench Press', 'chest', 'machine'],
  ['Barbell_Deadlift', 'Barbell Deadlift', 'lower back', 'barbell'],
  ['Bent_Over_Barbell_Row', 'Bent Over Barbell Row', 'middle back', 'barbell'],
  ['Bent_Over_Two-Dumbbell_Row', 'Bent Over Two-Dumbbell Row', 'middle back', 'dumbbell'],
  ['One-Arm_Dumbbell_Row', 'One-Arm Dumbbell Row', 'middle back', 'dumbbell'],
  ['Pullups', 'Pullups', 'lats', 'body only'],
  ['Chin-Up', 'Chin-Up', 'biceps', 'body only'],
  ['Wide-Grip_Lat_Pulldown', 'Wide-Grip Lat Pulldown', 'lats', 'machine'],
  ['Close-Grip_Front_Lat_Pulldown', 'Close-Grip Front Lat Pulldown', 'lats', 'machine'],
  ['Seated_Cable_Rows', 'Seated Cable Rows', 'middle back', 'cable'],
  ['T-Bar_Row_with_Handle', 'T-Bar Row with Handle', 'middle back', 'barbell'],
  ['Barbell_Squat', 'Barbell Squat', 'quadriceps', 'barbell'],
  ['Front_Barbell_Squat', 'Front Barbell Squat', 'quadriceps', 'barbell'],
  ['Goblet_Squat', 'Goblet Squat', 'quadriceps', 'dumbbell'],
  ['Bodyweight_Squat', 'Bodyweight Squat', 'quadriceps', 'body only'],
  ['Leg_Press', 'Leg Press', 'quadriceps', 'machine'],
  ['Hack_Squat', 'Hack Squat', 'quadriceps', 'machine'],
  ['Barbell_Lunge', 'Barbell Lunge', 'quadriceps', 'barbell'],
  ['Dumbbell_Lunges', 'Dumbbell Lunges', 'quadriceps', 'dumbbell'],
  ['Bodyweight_Walking_Lunge', 'Bodyweight Walking Lunge', 'quadriceps', 'body only'],
  ['Romanian_Deadlift', 'Romanian Deadlift', 'hamstrings', 'barbell'],
  ['Stiff-Legged_Dumbbell_Deadlift', 'Stiff-Legged Dumbbell Deadlift', 'hamstrings', 'dumbbell'],
  ['Split_Squat_with_Dumbbells', 'Split Squat with Dumbbells', 'quadriceps', 'dumbbell'],
  ['Barbell_Shoulder_Press', 'Barbell Shoulder Press', 'shoulders', 'barbell'],
  ['Dumbbell_Shoulder_Press', 'Dumbbell Shoulder Press', 'shoulders', 'dumbbell'],
  ['Arnold_Dumbbell_Press', 'Arnold Dumbbell Press', 'shoulders', 'dumbbell'],
  ['Standing_Military_Press', 'Standing Military Press', 'shoulders', 'barbell'],
  ['Clean_and_Press', 'Clean and Press', 'shoulders', 'barbell'],
  ['Kettlebell_Thruster', 'Kettlebell Thruster', 'quadriceps', 'kettlebells'],
  ['Two-Arm_Kettlebell_Military_Press', 'Two-Arm Kettlebell Military Press', 'shoulders', 'kettlebells'],
  ['Ab_Roller', 'Ab Roller', 'abdominals', 'other'],
  ['Air_Bike', 'Air Bike', 'abdominals', 'body only'],
  ['Bent-Knee_Hip_Raise', 'Bent-Knee Hip Raise', 'abdominals', 'body only'],
];

export const FALLBACK_EXERCISES: CatalogExercise[] = fallbackRows.map(
  ([id, name, primaryMuscle, equipment]) => ({
    id,
    name,
    force: null,
    level: 'beginner',
    mechanic: 'compound',
    equipment,
    primaryMuscles: [primaryMuscle],
    secondaryMuscles: [],
    instructions: [],
    category: 'strength',
    images: [`${id}/0.jpg`, `${id}/1.jpg`],
  }),
);

export function toSnapshot(exercise: CatalogExercise) {
  return {
    id: exercise.id,
    name: exercise.name,
    equipment: exercise.equipment,
    primaryMuscles: exercise.primaryMuscles,
    images: exercise.images,
    instructions: exercise.instructions,
    category: exercise.category,
    mechanic: exercise.mechanic,
  };
}

export function imageUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${IMAGE_BASE_URL}${path}`;
}

function validateCatalog(raw: unknown): CatalogExercise[] {
  if (!Array.isArray(raw)) throw new Error('Formato de catálogo inválido');
  const parsed = z.array(catalogExerciseSchema).safeParse(raw);
  if (!parsed.success) throw new Error('Catálogo fora do formato esperado');
  return parsed.data;
}

export async function loadCatalog(): Promise<{
  exercises: CatalogExercise[];
  source: CatalogSource;
  savedAt?: string;
  error?: string;
}> {
  let liveError = '';
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    const response = await fetch(CATALOG_URL, {
      signal: controller.signal,
      cache: 'no-store',
    });
    window.clearTimeout(timeout);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const exercises = validateCatalog(await response.json());
    const savedAt = new Date().toISOString();
    await saveCatalogCache({ id: 'current', exercises, savedAt });
    return { exercises, source: 'live', savedAt };
  } catch (error) {
    liveError = error instanceof Error ? error.message : 'falha desconhecida';
  }

  const cached = await loadCatalogCache();
  if (cached?.exercises?.length) {
    return {
      exercises: cached.exercises,
      source: 'cached',
      savedAt: cached.savedAt,
      error: liveError,
    };
  }

  return { exercises: FALLBACK_EXERCISES, source: 'fallback', error: liveError };
}

