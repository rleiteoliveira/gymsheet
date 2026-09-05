import { useEffect, useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { equipmentLabel } from "@/lib/gym/catalog";
import { formatElapsed } from "@/lib/gym/dates";
import { formatSet, formatTarget } from "@/lib/gym/format";
import { currentExercise, exerciseTitle, lastLoadFor, sessionProgress } from "@/lib/gym/session";
import { useGymStore } from "@/lib/gym/store";
import type { ExerciseSnapshot, SessionExercise } from "@/lib/gym/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExercisePicker } from "./exercise-picker";
import { Stepper } from "./stepper";

export function SessionView({
  sessionId,
  readOnly = false,
  onClose,
}: {
  sessionId: string;
  readOnly?: boolean;
  onClose: () => void;
}) {
  const session = useGymStore((state) => state.sessions.find((item) => item.id === sessionId));
  const sessions = useGymStore((state) => state.sessions);
  const logSet = useGymStore((state) => state.logSet);
  const skip = useGymStore((state) => state.skip);
  const undo = useGymStore((state) => state.undo);
  const swap = useGymStore((state) => state.swap);
  const addToSession = useGymStore((state) => state.addToSession);
  const finish = useGymStore((state) => state.finish);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [kg, setKg] = useState<number | null>(20);
  const [reps, setReps] = useState(10);
  const [bodyweight, setBodyweight] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [pickerMode, setPickerMode] = useState<"swap" | "add" | null>(null);

  useEffect(() => {
    if (readOnly) return;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [readOnly]);

  const active = useMemo(() => {
    if (!session) return null;
    if (activeId) {
      return session.exercises.find((item) => item.id === activeId) ?? currentExercise(session);
    }
    return currentExercise(session);
  }, [session, activeId]);

  useEffect(() => {
    if (!session || activeId) return;
    const first = currentExercise(session) ?? session.exercises[0];
    if (first) setActiveId(first.id);
  }, [session, activeId]);

  const setCount = active?.sets.length ?? 0;
  const activeKey = active?.id ?? "";

  useEffect(() => {
    if (!session || !active) return;
    const lastSet = active.sets[active.sets.length - 1];
    const snapshotId = active.performed?.id ?? active.planned?.exercise.id;
    const previous = snapshotId ? lastLoadFor(sessions, snapshotId) : null;
    const plannedKg = active.planned?.targetKg ?? null;
    const nextKg = lastSet?.kg ?? previous?.kg ?? plannedKg;
    const nextReps = lastSet?.reps ?? previous?.reps ?? active.planned?.targetReps ?? 10;
    setKg(nextKg);
    setReps(nextReps);
    setBodyweight(nextKg === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reseed when the exercise or its set count changes
  }, [activeKey, setCount, session, sessions]);

  if (!session) return null;

  const live = session;
  const progress = sessionProgress(live);
  const title = live.sourcePlanName ?? "Treino";
  const locked = readOnly || live.state === "completed";

  function commitSet() {
    if (!active || locked) return;
    const nextCount = active.sets.length + 1;
    const target = active.planned?.targetSets ?? 0;
    logSet(live.id, active.id, bodyweight ? null : kg, reps);
    if (target > 0 && nextCount >= target) {
      const upcoming = live.exercises.find((item) => item.id !== active.id && item.status === null);
      if (upcoming) setActiveId(upcoming.id);
    } else {
      setActiveId(active.id);
    }
  }

  function pickExercise(exercise: ExerciseSnapshot) {
    if (pickerMode === "swap" && active) {
      swap(live.id, active.id, exercise);
    }
    if (pickerMode === "add") {
      const id = addToSession(live.id, exercise);
      setActiveId(id);
    }
    setPickerMode(null);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg pb-[env(safe-area-inset-bottom)]">
      <header className="flex items-start justify-between gap-3 px-5 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        <div className="min-w-0 pt-2 text-center">
          <p className="truncate text-sm font-medium text-fg">{title}</p>
          <p className="text-xs text-muted tabular-nums">
            {locked ? (session.completedAt ? "encerrado" : "leitura") : formatElapsed(session.startedAt, now)}
          </p>
        </div>
        <div className="w-11" />
      </header>

      {session.exercises.length > 0 ? (
        <div className="mt-5 px-6">
          <div className="h-px bg-border">
            <div
              className="h-px bg-fg transition-[width] duration-200 ease-out"
              style={{ width: progress.total ? `${(progress.done / progress.total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-6 pb-4 pt-8">
        {active ? (
          <ActiveExercise
            exercise={active}
            index={session.exercises.findIndex((item) => item.id === active.id)}
            total={session.exercises.length}
          />
        ) : (
          <div className="py-10">
            <h2 className="font-display text-4xl tracking-tight">Treino livre</h2>
            <p className="mt-3 text-sm text-muted">Adicione o primeiro exercício.</p>
          </div>
        )}

        {active && !locked ? (
          <div className="mt-8 space-y-3">
            <Stepper
              label="kg"
              value={bodyweight ? "" : String(kg ?? "")}
              display={bodyweight ? "—" : String(kg ?? 0)}
              disabled={bodyweight}
              onStep={(direction) =>
                setKg((current) => {
                  const base = current ?? 0;
                  const next = Math.round((base + direction * 2.5) * 4) / 4;
                  return Math.max(0, next);
                })
              }
            />
            <Stepper
              label="reps"
              value={String(reps)}
              display={String(reps)}
              onStep={(direction) => setReps((current) => Math.max(1, current + direction))}
            />
            <button
              type="button"
              onClick={() => {
                setBodyweight((current) => !current);
                if (bodyweight && kg === null) setKg(20);
              }}
              className="w-full py-2 text-center text-xs font-medium tracking-wide text-subtle uppercase"
            >
              {bodyweight ? "usar carga" : "peso corporal"}
            </button>
          </div>
        ) : null}

        {active?.sets.length ? (
          <ol className="mt-8 space-y-2">
            {active.sets.map((set) => (
              <li key={set.id} className="flex items-baseline justify-between text-sm text-muted">
                <span className="tabular-nums text-subtle">{set.index}</span>
                <span className="tabular-nums text-fg">{formatSet(set.kg, set.reps)}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {session.exercises.length > 1 ? (
          <ol className="mt-10 space-y-1 border-t border-border pt-5">
            {session.exercises.map((exercise, index) => (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(exercise.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left text-sm",
                    exercise.id === active?.id ? "text-fg" : "text-muted",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-5 tabular-nums text-subtle">{index + 1}</span>
                    <span className="truncate">{exerciseTitle(exercise)}</span>
                  </span>
                  {exercise.status === "done" || exercise.status === "swapped" || exercise.status === "added" ? (
                    <Check size={14} className="text-ok" />
                  ) : exercise.status === "skipped" ? (
                    <span className="text-xs text-subtle">pulado</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      {!locked ? (
        <div className="space-y-2 px-5 pb-5 pt-2">
          {active ? (
            <Button className="w-full" size="lg" data-testid="log-set" onClick={commitSet}>
              Registrar série
            </Button>
          ) : (
            <Button className="w-full" size="lg" onClick={() => setPickerMode("add")}>
              Adicionar exercício
            </Button>
          )}
          <div className="flex items-center justify-between gap-2 px-1">
            {active ? (
              <button
                type="button"
                className="h-11 px-2 text-sm text-muted hover:text-fg"
                onClick={() => skip(live.id, active.id)}
              >
                Pular
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1">
              {active?.status ? (
                <button
                  type="button"
                  className="h-11 px-2 text-sm text-muted hover:text-fg"
                  onClick={() => undo(live.id, active.id)}
                >
                  Desfazer
                </button>
              ) : null}
              {active ? (
                <button
                  type="button"
                  className="h-11 px-2 text-sm text-muted hover:text-fg"
                  onClick={() => setPickerMode("swap")}
                >
                  Trocar
                </button>
              ) : null}
              <button
                type="button"
                className="grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
                onClick={() => setPickerMode("add")}
                aria-label="Adicionar exercício"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                data-testid="finish-session"
                className="h-11 px-2 text-sm text-muted hover:text-fg"
                onClick={() => {
                  finish(live.id);
                  onClose();
                }}
              >
                Encerrar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-6 pt-2">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Voltar
          </Button>
        </div>
      )}

      <ExercisePicker
        open={pickerMode !== null}
        onOpenChange={(open) => {
          if (!open) setPickerMode(null);
        }}
        title={pickerMode === "swap" ? "Trocar exercício" : "Adicionar"}
        onPick={pickExercise}
      />
    </div>
  );
}

function ActiveExercise({
  exercise,
  index,
  total,
}: {
  exercise: SessionExercise;
  index: number;
  total: number;
}) {
  const planned = exercise.planned;
  const snapshot = exercise.performed ?? planned?.exercise;
  return (
    <div>
      <p className="text-xs font-medium tracking-widest text-subtle uppercase">
        {total ? `${index + 1} / ${total}` : "livre"}
      </p>
      <h2 className="font-display mt-2 text-4xl leading-none tracking-tight text-fg">{exerciseTitle(exercise)}</h2>
      <p className="mt-3 text-sm text-muted">
        {planned
          ? formatTarget(planned.targetSets, planned.targetReps, planned.targetKg)
          : snapshot
            ? `${snapshot.primaryMuscles[0] ?? ""} · ${equipmentLabel(snapshot.equipment)}`.trim()
            : "sem meta"}
      </p>
    </div>
  );
}
