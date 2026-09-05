import { formatRelativeDay } from "@/lib/gym/dates";
import { useGymStore } from "@/lib/gym/store";
import type { Plan } from "@/lib/gym/types";
import { Button } from "@/components/ui/button";

export function PlansView({
  onEdit,
  onStart,
}: {
  onEdit: (plan?: Plan) => void;
  onStart: (plan: Plan) => void;
}) {
  const plans = useGymStore((state) => state.plans);
  const sessions = useGymStore((state) => state.sessions);
  const todayPin = useGymStore((state) => state.todayPin);
  const setPin = useGymStore((state) => state.setPin);
  const deletePlan = useGymStore((state) => state.deletePlan);

  return (
    <section className="px-6 pb-8 pt-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-muted">fichas</p>
          <h1 className="font-display mt-1 text-4xl leading-none tracking-tight">O que você treina</h1>
        </div>
        <Button size="sm" onClick={() => onEdit()}>
          Nova
        </Button>
      </header>

      <ul className="mt-10 divide-y divide-border">
        {plans.length === 0 ? (
          <li className="py-16 text-center text-sm text-muted">Nenhuma ficha ainda.</li>
        ) : (
          plans.map((plan) => {
            const last = [...sessions]
              .filter((session) => session.sourcePlanId === plan.id && session.state === "completed")
              .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
            const pinned = todayPin?.kind === "plan" && todayPin.id === plan.id;
            return (
              <li key={plan.id} className="py-5">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onEdit(plan)} className="min-w-0 text-left">
                    <p className="text-lg font-medium tracking-tight text-fg">{plan.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {plan.exercises.length} exercícios
                      {last ? ` · ${formatRelativeDay(last.startedAt)}` : ""}
                      {pinned ? " · hoje" : ""}
                    </p>
                  </button>
                  <Button size="sm" onClick={() => onStart(plan)}>
                    Treinar
                  </Button>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-subtle">
                  <button type="button" onClick={() => setPin({ kind: "plan", id: plan.id })}>
                    {pinned ? "fixada" : "usar hoje"}
                  </button>
                  <button
                    type="button"
                    className="hover:text-danger"
                    onClick={() => {
                      if (window.confirm(`Apagar ${plan.name}?`)) deletePlan(plan.id);
                    }}
                  >
                    apagar
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
