import { ChevronRight } from "lucide-react";
import { formatDayMonth, formatDuration, formatRelativeDay, formatWeekday, localCivilDateKey } from "@/lib/gym/dates";
import { sessionProgress } from "@/lib/gym/session";
import { useGymStore } from "@/lib/gym/store";
import type { Plan, Session } from "@/lib/gym/types";
import { Button } from "@/components/ui/button";

export function TodayView({
  onStart,
  onResume,
  onOpenPlans,
  onOpenSession,
}: {
  onStart: (plan?: Plan) => void;
  onResume: (session: Session) => void;
  onOpenPlans: () => void;
  onOpenSession: (session: Session) => void;
}) {
  const plans = useGymStore((state) => state.plans);
  const sessions = useGymStore((state) => state.sessions);
  const todayPin = useGymStore((state) => state.todayPin);
  const now = new Date();
  const todayKey = localCivilDateKey(now);

  const liveToday = sessions.find(
    (session) => session.state === "in_progress" && localCivilDateKey(session.startedAt) === todayKey,
  );
  const pinnedPlan =
    todayPin?.kind === "plan" ? plans.find((plan) => plan.id === todayPin.id) : undefined;
  const suggested = pinnedPlan ?? plans[0];
  const lastCompleted = [...sessions]
    .filter((session) => session.state === "completed")
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];

  return (
    <section className="flex min-h-[calc(100dvh-8.5rem)] flex-col px-6 pb-8 pt-6 md:min-h-0 md:pt-10">
      <header className="stagger-in">
        <p className="text-sm font-medium tracking-wide text-muted lowercase">{formatWeekday(now)}</p>
        <h1 className="font-display mt-1 text-5xl leading-none tracking-tight text-fg">
          {formatDayMonth(now)}
        </h1>
      </header>

      <div className="mt-auto space-y-8 pt-16 md:mt-20">
        {liveToday ? (
          <div>
            <p className="text-xs font-medium tracking-widest text-subtle uppercase">em andamento</p>
            <h2 className="font-display mt-2 text-4xl leading-none tracking-tight">{liveToday.sourcePlanName ?? "Treino"}</h2>
            <p className="mt-3 text-sm text-muted">
              {sessionProgress(liveToday).done} de {sessionProgress(liveToday).total || "—"} exercícios
            </p>
            <Button className="mt-8 w-full" size="lg" data-testid="start-workout" onClick={() => onResume(liveToday)}>
              Continuar
            </Button>
          </div>
        ) : suggested ? (
          <div>
            <p className="text-xs font-medium tracking-widest text-subtle uppercase">hoje</p>
            <h2 className="font-display mt-2 text-4xl leading-none tracking-tight">{suggested.name}</h2>
            <p className="mt-3 text-sm text-muted">
              {suggested.exercises.length} exercícios
              {lastForPlan(sessions, suggested.id)
                ? ` · última vez ${formatRelativeDay(lastForPlan(sessions, suggested.id)!.startedAt)}`
                : null}
            </p>
            <Button className="mt-8 w-full" size="lg" data-testid="start-workout" onClick={() => onStart(suggested)}>
              Começar
            </Button>
            {plans.length > 1 ? (
              <button
                type="button"
                onClick={onOpenPlans}
                className="mt-3 w-full py-2 text-sm text-muted transition-colors duration-150 hover:text-fg"
              >
                Outra ficha
              </button>
            ) : null}
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium tracking-widest text-subtle uppercase">hoje</p>
            <h2 className="font-display mt-2 text-4xl leading-none tracking-tight">Sem ficha</h2>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Monte uma ficha, ou comece um treino livre e vá adicionando na hora.
            </p>
            <Button className="mt-8 w-full" size="lg" data-testid="start-workout" onClick={() => onStart()}>
              Começar livre
            </Button>
            <button
              type="button"
              onClick={onOpenPlans}
              className="mt-3 w-full py-2 text-sm text-muted transition-colors duration-150 hover:text-fg"
            >
              Nova ficha
            </button>
          </div>
        )}

        {lastCompleted && lastCompleted.id !== liveToday?.id ? (
          <button
            type="button"
            onClick={() => onOpenSession(lastCompleted)}
            className="flex w-full items-center justify-between border-t border-border pt-5 text-left"
          >
            <span>
              <span className="block text-xs font-medium tracking-wide text-subtle uppercase">último</span>
              <span className="mt-1 block text-sm text-fg">
                {lastCompleted.sourcePlanName ?? "Treino"} · {formatRelativeDay(lastCompleted.startedAt)}
                {formatDuration(lastCompleted.startedAt, lastCompleted.completedAt)
                  ? ` · ${formatDuration(lastCompleted.startedAt, lastCompleted.completedAt)}`
                  : ""}
              </span>
            </span>
            <ChevronRight size={16} className="text-subtle" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function lastForPlan(sessions: Session[], planId: string) {
  return [...sessions]
    .filter((session) => session.sourcePlanId === planId && session.state === "completed")
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
}
