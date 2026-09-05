import { CATALOG, toSnapshot } from "./catalog";
import { addCivilDays } from "./dates";
import { makeId } from "./ids";
import { completeSession, createSessionFromPlan, saveSet } from "./session";
import type { AppState, ExerciseSnapshot, Plan, PlanExercise, Session } from "./types";

function snapshot(id: string): ExerciseSnapshot {
  const found = CATALOG.find((item) => item.id === id);
  if (!found) throw new Error(`Catálogo sem ${id}`);
  return toSnapshot(found);
}

function atHour(day: Date, hour: number, minute: number) {
  const value = new Date(day);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function planExercise(
  exerciseId: string,
  targetSets: number,
  targetReps: number,
  targetKg: number | null,
  order: number,
): PlanExercise {
  return {
    id: makeId(),
    order,
    exercise: snapshot(exerciseId),
    targetSets,
    targetReps,
    targetKg,
  };
}

function makePlan(name: string, specs: Array<[string, number, number, number | null]>, createdAt: Date): Plan {
  const now = createdAt.toISOString();
  return {
    id: makeId(),
    name,
    exercises: specs.map(([id, sets, reps, kg], order) => planExercise(id, sets, reps, kg, order)),
    createdAt: now,
    updatedAt: now,
  };
}

function fillSession(plan: Plan, day: Date, loads: Array<number | null>): Session {
  const start = atHour(day, 19, 10);
  let session = createSessionFromPlan(plan, start, makeId);
  session.exercises.forEach((exercise, index) => {
    const planned = exercise.planned;
    if (!planned) return;
    const kg = index < loads.length ? loads[index]! : planned.targetKg;
    for (let setIndex = 0; setIndex < planned.targetSets; setIndex += 1) {
      const drop = setIndex === planned.targetSets - 1 ? Math.max(0, planned.targetReps - 1) : planned.targetReps;
      session = saveSet(session, exercise.id, {
        id: makeId(),
        index: setIndex + 1,
        kg,
        reps: drop,
        savedAt: atHour(day, 19, 18 + index * 6 + setIndex).toISOString(),
      });
    }
  });
  return completeSession(session, atHour(day, 20, 5));
}

export function buildDemoState(now = new Date()): AppState {
  const created = atHour(addCivilDays(now, -18), 8, 0);
  const peito = makePlan(
    "Peito",
    [
      ["supino-reto-barra", 4, 8, 60],
      ["supino-inclinado-halteres", 3, 10, 24],
      ["crucifixo-halteres", 3, 12, 14],
      ["desenvolvimento-halteres", 3, 10, 18],
      ["triceps-pulley", 3, 12, 22],
    ],
    created,
  );
  const costas = makePlan(
    "Costas",
    [
      ["terra", 3, 5, 90],
      ["remada-curvada", 4, 8, 55],
      ["puxada-frente", 3, 10, 50],
      ["barra-fixa", 3, 6, null],
      ["rosca-alternada", 3, 10, 12],
    ],
    created,
  );
  const pernas = makePlan(
    "Pernas",
    [
      ["agachamento", 4, 6, 80],
      ["leg-press", 3, 12, 140],
      ["stiff", 3, 10, 60],
      ["flexora", 3, 12, 40],
      ["panturrilha-pe", 4, 15, 80],
    ],
    created,
  );

  return {
    plans: [peito, costas, pernas],
    sessions: [
      fillSession(costas, addCivilDays(now, -1), [90, 55, 50, null, 12]),
      fillSession(pernas, addCivilDays(now, -3), [80, 140, 60, 40, 80]),
      fillSession(peito, addCivilDays(now, -4), [60, 24, 14, 18, 22]),
      fillSession(costas, addCivilDays(now, -8), [85, 50, 47.5, null, 12]),
    ],
    todayPin: { kind: "plan", id: peito.id },
    customExercises: [],
  };
}
