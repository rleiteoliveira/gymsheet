import { useState } from "react";
import { Trash2 } from "lucide-react";
import { equipmentLabel } from "@/lib/gym/catalog";
import { formatTarget } from "@/lib/gym/format";
import { makeId } from "@/lib/gym/ids";
import { draftFromPlan, useGymStore } from "@/lib/gym/store";
import type { ExerciseSnapshot, Plan, PlanExercise } from "@/lib/gym/types";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ExercisePicker } from "./exercise-picker";

export function PlanEditor({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan;
}) {
  const savePlan = useGymStore((state) => state.savePlan);
  const [draft, setDraft] = useState(() => draftFromPlan(plan));
  const [pickerOpen, setPickerOpen] = useState(false);

  function reset() {
    setDraft(draftFromPlan(plan));
  }

  function addExercise(exercise: ExerciseSnapshot) {
    const next: PlanExercise = {
      id: makeId(),
      order: draft.exercises.length,
      exercise,
      targetSets: 3,
      targetReps: 10,
      targetKg: 20,
    };
    setDraft((current) => ({ ...current, exercises: [...current.exercises, next] }));
  }

  function update(id: string, patch: Partial<PlanExercise>) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function remove(id: string) {
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.filter((item) => item.id !== id).map((item, order) => ({ ...item, order })),
    }));
  }

  function save() {
    const name = draft.name.trim();
    if (!name || draft.exercises.length === 0) return;
    const now = new Date().toISOString();
    savePlan({
      id: draft.id ?? makeId(),
      name,
      exercises: draft.exercises,
      createdAt: plan?.createdAt ?? now,
      updatedAt: now,
    });
    onOpenChange(false);
  }

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) reset();
          onOpenChange(next);
        }}
        title={plan ? "Editar ficha" : "Nova ficha"}
        description="Nome, exercícios, séries. Só isso."
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-medium tracking-wide text-subtle uppercase">Nome</span>
            <Input
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Peito, Costas, Superior…"
            />
          </label>

          <div className="space-y-2">
            {draft.exercises.map((exercise, index) => (
              <div key={exercise.id} className="rounded-2xl bg-elevated p-3 shadow-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">
                      {index + 1}. {exercise.exercise.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {exercise.exercise.primaryMuscles[0]} · {equipmentLabel(exercise.exercise.equipment)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Remover"
                    onClick={() => remove(exercise.id)}
                    className="grid size-10 place-items-center rounded-lg text-subtle hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniField
                    label="séries"
                    value={String(exercise.targetSets)}
                    onChange={(value) => update(exercise.id, { targetSets: clampInt(value, 1, 12) })}
                  />
                  <MiniField
                    label="reps"
                    value={String(exercise.targetReps)}
                    onChange={(value) => update(exercise.id, { targetReps: clampInt(value, 1, 50) })}
                  />
                  <MiniField
                    label="kg"
                    value={exercise.targetKg === null ? "" : String(exercise.targetKg)}
                    placeholder="—"
                    onChange={(value) =>
                      update(exercise.id, { targetKg: value.trim() === "" ? null : clampNum(value, 0, 500) })
                    }
                  />
                </div>
                <p className="mt-2 text-xs text-subtle">
                  {formatTarget(exercise.targetSets, exercise.targetReps, exercise.targetKg)}
                </p>
              </div>
            ))}
          </div>

          <Button variant="secondary" className="w-full" onClick={() => setPickerOpen(true)}>
            Adicionar exercício
          </Button>
          <Button className="w-full" onClick={save} disabled={!draft.name.trim() || draft.exercises.length === 0}>
            Salvar ficha
          </Button>
        </div>
      </Drawer>
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={addExercise} />
    </>
  );
}

function MiniField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-center text-xs font-medium tracking-wide text-subtle uppercase">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl bg-surface text-center text-base tabular-nums text-fg outline-none"
      />
    </label>
  );
}

function clampInt(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

function clampNum(value: string, min: number, max: number) {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}
