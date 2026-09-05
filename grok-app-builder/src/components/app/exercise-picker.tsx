import { useMemo, useState } from "react";
import { CATALOG, MUSCLE_GROUPS, equipmentLabel, filterCatalog, makeCustomExercise } from "@/lib/gym/catalog";
import { useGymStore } from "@/lib/gym/store";
import type { ExerciseSnapshot } from "@/lib/gym/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

export function ExercisePicker({
  open,
  onOpenChange,
  onPick,
  title = "Exercício",
  description = "Busque ou filtre pelo músculo.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (exercise: ExerciseSnapshot) => void;
  title?: string;
  description?: string;
}) {
  const customExercises = useGymStore((state) => state.customExercises);
  const rememberCustom = useGymStore((state) => state.rememberCustom);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);

  const library = useMemo(
    () => [...customExercises, ...CATALOG.filter((item) => !customExercises.some((custom) => custom.id === item.id))],
    [customExercises],
  );

  const results = useMemo(() => filterCatalog(library, query, muscle), [library, query, muscle]);

  function pick(exercise: ExerciseSnapshot) {
    onPick(exercise);
    setQuery("");
    setMuscle(null);
    onOpenChange(false);
  }

  function addCustom() {
    const exercise = makeCustomExercise(query, muscle ?? undefined);
    rememberCustom(exercise);
    pick(exercise);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="sticky top-0 z-10 space-y-3 bg-surface pb-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar exercício"
          autoCapitalize="none"
        />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setMuscle(null)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
              muscle === null ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
            )}
          >
            todos
          </button>
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setMuscle(group === muscle ? null : group)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                muscle === group ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
              )}
            >
              {group}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1">
        {results.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted">Nada com esse nome.</p>
            {query.trim() ? (
              <Button className="mt-4" onClick={addCustom}>
                Usar “{query.trim()}”
              </Button>
            ) : null}
          </div>
        ) : (
          results.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => pick(exercise)}
              className="flex w-full items-baseline justify-between gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-150 hover:bg-elevated"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-fg">{exercise.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {exercise.primaryMuscles[0]} · {equipmentLabel(exercise.equipment)}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </Drawer>
  );
}
