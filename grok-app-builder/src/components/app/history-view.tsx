import { formatDuration, formatRelativeDay, formatWeekday, localCivilDateKey, weekDays } from "@/lib/gym/dates";
import { sessionProgress } from "@/lib/gym/session";
import { useGymStore } from "@/lib/gym/store";
import type { Session } from "@/lib/gym/types";
import { cn } from "@/lib/utils";

export function HistoryView({ onOpenSession }: { onOpenSession: (session: Session) => void }) {
  const sessions = useGymStore((state) => state.sessions);
  const now = new Date();
  const days = weekDays(now);
  const todayKey = localCivilDateKey(now);
  const ordered = [...sessions].sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  const weekStart = localCivilDateKey(days[0] ?? now);
  const weekEnd = localCivilDateKey(days[6] ?? now);
  const weekCount = sessions.filter((session) => {
    const key = localCivilDateKey(session.startedAt);
    return key >= weekStart && key <= weekEnd && session.state === "completed";
  }).length;

  return (
    <section className="px-6 pb-8 pt-6">
      <header>
        <p className="text-sm font-medium tracking-wide text-muted">semana</p>
        <h1 className="font-display mt-1 text-4xl leading-none tracking-tight">
          {weekCount === 0 ? "Nada ainda" : `${weekCount} treino${weekCount === 1 ? "" : "s"}`}
        </h1>
      </header>

      <ol className="mt-8 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = localCivilDateKey(day);
          const trained = sessions.some(
            (session) => localCivilDateKey(session.startedAt) === key && session.state === "completed",
          );
          const live = sessions.some(
            (session) => localCivilDateKey(session.startedAt) === key && session.state === "in_progress",
          );
          return (
            <li key={key} className="text-center">
              <p className="text-xs font-medium tracking-wide text-subtle uppercase">
                {formatWeekday(day, "short").slice(0, 3)}
              </p>
              <div
                className={cn(
                  "mx-auto mt-2 grid size-9 place-items-center rounded-full text-sm tabular-nums",
                  key === todayKey && "shadow-border",
                  trained ? "bg-fg text-primary-fg" : "text-muted",
                )}
              >
                {day.getDate()}
              </div>
              {live && !trained ? <span className="mt-1 inline-block size-1 rounded-full bg-muted" /> : null}
            </li>
          );
        })}
      </ol>

      <ul className="mt-10 divide-y divide-border">
        {ordered.length === 0 ? (
          <li className="py-16 text-center text-sm text-muted">Os treinos vão aparecer aqui.</li>
        ) : (
          ordered.map((session) => {
            const progress = sessionProgress(session);
            return (
              <li key={session.id}>
                <button
                  type="button"
                  onClick={() => onOpenSession(session)}
                  className="flex w-full items-baseline justify-between gap-4 py-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">
                      {session.sourcePlanName ?? "Treino"}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {formatRelativeDay(session.startedAt)}
                      {session.state === "in_progress"
                        ? " · aberto"
                        : formatDuration(session.startedAt, session.completedAt)
                          ? ` · ${formatDuration(session.startedAt, session.completedAt)}`
                          : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-subtle">
                    {progress.done}/{progress.total || 0}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
