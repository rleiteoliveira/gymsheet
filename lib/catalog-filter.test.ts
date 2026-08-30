import { describe, expect, it } from 'vitest';
import { filterCatalogExercises, muscleGroupsForCatalog } from './catalog-filter';
import type { CatalogExercise } from './types';

function exercise(id: string, name: string, primaryMuscle: string, equipment = 'barbell'): CatalogExercise {
  return {
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
    images: [],
  };
}

const catalog = [
  exercise('bench', 'Barbell Bench Press', 'chest'),
  exercise('incline', 'Incline Dumbbell Press', 'chest', 'dumbbell'),
  exercise('curl', 'Barbell Curl', 'biceps'),
  exercise('pushdown', 'Cable Triceps Pushdown', 'triceps', 'cable'),
  exercise('squat', 'Barbell Squat', 'quadriceps'),
];

describe('filtro do catálogo', () => {
  it('expõe grupos em pt-BR somente quando há exercícios correspondentes', () => {
    expect(muscleGroupsForCatalog(catalog).map((group) => group.label)).toEqual(['Peito', 'Braços', 'Pernas']);
  });

  it('filtra Peito e permite refinar por nome dentro do grupo', () => {
    expect(filterCatalogExercises(catalog, '', ['chest']).map((item) => item.id)).toEqual(['bench', 'incline']);
    expect(filterCatalogExercises(catalog, 'incline', ['chest']).map((item) => item.id)).toEqual(['incline']);
  });

  it('trata Braços como biceps OU triceps e combina chips com OU', () => {
    expect(filterCatalogExercises(catalog, '', ['arms']).map((item) => item.id)).toEqual(['curl', 'pushdown']);
    expect(filterCatalogExercises(catalog, '', ['chest', 'legs']).map((item) => item.id)).toEqual(expect.arrayContaining(['bench', 'incline', 'squat']));
  });

  it('mantém a busca textual atual quando nenhum grupo está selecionado', () => {
    expect(filterCatalogExercises(catalog, 'cable').map((item) => item.id)).toEqual(['pushdown']);
    expect(filterCatalogExercises(catalog, 'PRESS').map((item) => item.id)).toEqual(['bench', 'incline']);
  });
});
