import type { ExerciseSnapshot } from "./types";

export interface CatalogExercise extends ExerciseSnapshot {
  search: string;
}

export const MUSCLE_GROUPS = [
  "peito",
  "costas",
  "ombros",
  "bíceps",
  "tríceps",
  "quadríceps",
  "posteriores",
  "glúteos",
  "panturrilhas",
  "abdômen",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT_LABELS: Record<string, string> = {
  barra: "barra",
  halteres: "halteres",
  cabo: "cabo",
  maquina: "máquina",
  peso_corporal: "peso corporal",
  livre: "livre",
};

const rows: Array<[string, string, MuscleGroup, string]> = [
  ["supino-reto-barra", "Supino reto", "peito", "barra"],
  ["supino-inclinado-barra", "Supino inclinado", "peito", "barra"],
  ["supino-reto-halteres", "Supino reto com halteres", "peito", "halteres"],
  ["supino-inclinado-halteres", "Supino inclinado com halteres", "peito", "halteres"],
  ["crucifixo-halteres", "Crucifixo", "peito", "halteres"],
  ["crucifixo-cabo", "Crossover", "peito", "cabo"],
  ["flexao", "Flexão", "peito", "peso_corporal"],
  ["paralelas-peito", "Paralelas", "peito", "peso_corporal"],
  ["terra", "Levantamento terra", "costas", "barra"],
  ["remada-curvada", "Remada curvada", "costas", "barra"],
  ["remada-unilateral", "Remada unilateral", "costas", "halteres"],
  ["remada-baixa", "Remada baixa", "costas", "cabo"],
  ["puxada-frente", "Puxada frente", "costas", "maquina"],
  ["barra-fixa", "Barra fixa", "costas", "peso_corporal"],
  ["face-pull", "Face pull", "costas", "cabo"],
  ["desenvolvimento-barra", "Desenvolvimento", "ombros", "barra"],
  ["desenvolvimento-halteres", "Desenvolvimento com halteres", "ombros", "halteres"],
  ["arnold", "Desenvolvimento Arnold", "ombros", "halteres"],
  ["elevacao-lateral", "Elevação lateral", "ombros", "halteres"],
  ["elevacao-frontal", "Elevação frontal", "ombros", "halteres"],
  ["crucifixo-inverso", "Crucifixo inverso", "ombros", "halteres"],
  ["rosca-direta", "Rosca direta", "bíceps", "barra"],
  ["rosca-alternada", "Rosca alternada", "bíceps", "halteres"],
  ["rosca-martelo", "Rosca martelo", "bíceps", "halteres"],
  ["rosca-scott", "Rosca scott", "bíceps", "barra"],
  ["triceps-pulley", "Tríceps pulley", "tríceps", "cabo"],
  ["triceps-testa", "Tríceps testa", "tríceps", "barra"],
  ["triceps-frances", "Tríceps francês", "tríceps", "halteres"],
  ["supino-fechado", "Supino fechado", "tríceps", "barra"],
  ["agachamento", "Agachamento livre", "quadríceps", "barra"],
  ["agachamento-frontal", "Agachamento frontal", "quadríceps", "barra"],
  ["goblet", "Agachamento goblet", "quadríceps", "halteres"],
  ["leg-press", "Leg press", "quadríceps", "maquina"],
  ["extensora", "Cadeira extensora", "quadríceps", "maquina"],
  ["afundo", "Afundo", "quadríceps", "halteres"],
  ["stiff", "Stiff", "posteriores", "barra"],
  ["terra-romeno", "Terra romeno", "posteriores", "barra"],
  ["flexora", "Mesa flexora", "posteriores", "maquina"],
  ["hip-thrust", "Hip thrust", "glúteos", "barra"],
  ["elevacao-pelvica", "Elevação pélvica", "glúteos", "peso_corporal"],
  ["panturrilha-pe", "Panturrilha em pé", "panturrilhas", "maquina"],
  ["panturrilha-sentado", "Panturrilha sentado", "panturrilhas", "maquina"],
  ["prancha", "Prancha", "abdômen", "peso_corporal"],
  ["abdominal-infra", "Abdominal infra", "abdômen", "peso_corporal"],
  ["abdominal-cabo", "Abdominal no cabo", "abdômen", "cabo"],
];

export const CATALOG: CatalogExercise[] = rows.map(([id, name, muscle, equipment]) => ({
  id,
  name,
  equipment,
  primaryMuscles: [muscle],
  search: `${name} ${muscle} ${EQUIPMENT_LABELS[equipment] ?? equipment}`.toLocaleLowerCase("pt-BR"),
}));

export function toSnapshot(exercise: ExerciseSnapshot): ExerciseSnapshot {
  return {
    id: exercise.id,
    name: exercise.name,
    equipment: exercise.equipment,
    primaryMuscles: [...exercise.primaryMuscles],
  };
}

export function equipmentLabel(value: string | null | undefined) {
  if (!value) return "livre";
  return EQUIPMENT_LABELS[value] ?? value;
}

export function muscleLabel(value: string | undefined) {
  return value ?? "força";
}

export function filterCatalog(
  exercises: ExerciseSnapshot[],
  query: string,
  muscle: string | null,
) {
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  return exercises.filter((exercise) => {
    if (muscle && !exercise.primaryMuscles.includes(muscle)) return false;
    if (!needle) return true;
    const hay = `${exercise.name} ${exercise.primaryMuscles.join(" ")} ${equipmentLabel(exercise.equipment)}`.toLocaleLowerCase("pt-BR");
    return hay.includes(needle);
  });
}

export function makeCustomExercise(name: string, muscle?: string): ExerciseSnapshot {
  const trimmed = name.trim();
  return {
    id: `custom-${trimmed.toLocaleLowerCase("pt-BR").replace(/\s+/g, "-").slice(0, 40)}-${Date.now().toString(36)}`,
    name: trimmed,
    equipment: "livre",
    primaryMuscles: muscle ? [muscle] : ["livre"],
  };
}
