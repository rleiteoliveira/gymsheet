import type { CatalogExercise } from './types';

export interface MuscleGroup {
  id: string;
  label: string;
  muscles: readonly string[];
}

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  { id: 'chest', label: 'Peito', muscles: ['chest'] },
  { id: 'back', label: 'Costas', muscles: ['lats', 'middle back', 'lower back'] },
  { id: 'arms', label: 'Braços', muscles: ['biceps', 'triceps', 'forearms'] },
  { id: 'shoulders', label: 'Ombros', muscles: ['shoulders', 'traps'] },
  { id: 'legs', label: 'Pernas', muscles: ['quadriceps', 'hamstrings', 'adductors', 'abductors'] },
  { id: 'glutes', label: 'Glúteos', muscles: ['glutes'] },
  { id: 'calves', label: 'Panturrilhas', muscles: ['calves'] },
  { id: 'core', label: 'Core', muscles: ['abdominals'] },
  { id: 'neck', label: 'Pescoço', muscles: ['neck'] },
];

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function muscleGroupsForCatalog(catalog: CatalogExercise[]): MuscleGroup[] {
  return MUSCLE_GROUPS.filter((group) =>
    catalog.some((exercise) => exercise.primaryMuscles.some((muscle) => group.muscles.includes(muscle))),
  ).map((group) => ({ ...group, muscles: [...group.muscles] }));
}

export function filterCatalogExercises(
  catalog: CatalogExercise[],
  query: string,
  selectedGroupIds: readonly string[] = [],
): CatalogExercise[] {
  const normalizedQuery = normalizeSearchText(query);
  const selectedGroups = MUSCLE_GROUPS.filter((group) => selectedGroupIds.includes(group.id));

  return catalog
    .filter((exercise) => {
      const matchesGroup =
        selectedGroups.length === 0 ||
        selectedGroups.some((group) => exercise.primaryMuscles.some((muscle) => group.muscles.includes(muscle)));
      if (!matchesGroup) return false;
      if (!normalizedQuery) return true;
      return normalizeSearchText(
        `${exercise.name} ${exercise.equipment ?? ''} ${exercise.primaryMuscles.join(' ')}`,
      ).includes(normalizedQuery);
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}
