import { useEffect, useState } from "react";
import { CalendarDays, Dumbbell, Settings2, Sun } from "lucide-react";
import { Toaster, toast } from "sonner";
import { formatWeekday } from "@/lib/gym/dates";
import { createQuickSession, createSessionFromPlan, type SessionStartDecision } from "@/lib/gym/session";
import { makeId } from "@/lib/gym/ids";
import { useGymStore, type Tab } from "@/lib/gym/store";
import type { Plan, Session } from "@/lib/gym/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { HistoryView } from "./history-view";
import { PlanEditor } from "./plan-editor";
import { PlansView } from "./plans-view";
import { SessionView } from "./session-view";
import { SettingsSheet } from "./settings-sheet";
import { TodayView } from "./today-view";

export function GymApp() {
  const ready = useGymStore((state) => state.ready);
  const markReady = useGymStore((state) => state.markReady);
  const startFromPlan = useGymStore((state) => state.startFromPlan);
  const startFree = useGymStore((state) => state.startFree);
  const startAnyway = useGymStore((state) => state.startAnyway);
  const [tab, setTab] = useState<Tab>("today");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionReadOnly, setSessionReadOnly] = useState(false);
  const [editorPlan, setEditorPlan] = useState<Plan | null | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pending, setPending] = useState<{
    decision: Extract<SessionStartDecision, { kind: "choose-previous" }>;
    next: Session;
  } | null>(null);

  useEffect(() => {
    void Promise.resolve(useGymStore.persist.rehydrate()).then(() => markReady());
  }, [markReady]);

  const editorOpen = editorPlan !== undefined;

  function openSession(session: Session, readOnly = session.state === "completed") {
    setSessionReadOnly(readOnly);
    setSessionId(session.id);
  }

  function handleDecision(result: Session | SessionStartDecision, fallback: Session) {
    if ("kind" in result) {
      if (result.kind === "resume-today") {
        openSession(result.session, false);
        return;
      }
      if (result.kind === "choose-previous") {
        setPending({ decision: result, next: fallback });
      }
      return;
    }
    openSession(result, false);
  }

  function start(plan?: Plan) {
    if (plan) {
      const draft = createSessionFromPlan(plan, new Date(), makeId);
      handleDecision(startFromPlan(plan), draft);
      return;
    }
    const name = `Treino · ${formatWeekday(new Date())}`;
    const draft = createQuickSession(name, new Date(), makeId);
    handleDecision(startFree(name), draft);
  }

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-fg">
        <p className="font-display text-3xl italic tracking-tight">GymSheet</p>
      </div>
    );
  }

  if (sessionId) {
    return (
      <>
        <SessionView sessionId={sessionId} readOnly={sessionReadOnly} onClose={() => setSessionId(null)} />
        <Toaster theme="dark" position="top-center" />
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto w-full max-w-lg pb-24">
        <div className="flex items-center justify-between px-6 pt-5">
          <p className="font-display text-lg italic tracking-tight">GymSheet</p>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="grid size-11 place-items-center rounded-xl text-muted hover:text-fg"
            aria-label="Dados"
          >
            <Settings2 size={18} />
          </button>
        </div>

        {tab === "today" ? (
          <TodayView
            onStart={start}
            onResume={(session) => openSession(session, false)}
            onOpenPlans={() => {
              setTab("plans");
              setEditorPlan(undefined);
            }}
            onOpenSession={(session) => openSession(session, session.state === "completed")}
          />
        ) : null}
        {tab === "plans" ? (
          <PlansView onEdit={(plan) => setEditorPlan(plan ?? null)} onStart={start} />
        ) : null}
        {tab === "week" ? (
          <HistoryView onOpenSession={(session) => openSession(session, session.state === "completed")} />
        ) : null}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-3 px-4 py-2">
          <NavItem icon={Sun} label="Hoje" active={tab === "today"} onClick={() => setTab("today")} />
          <NavItem icon={Dumbbell} label="Fichas" active={tab === "plans"} onClick={() => setTab("plans")} />
          <NavItem icon={CalendarDays} label="Semana" active={tab === "week"} onClick={() => setTab("week")} />
        </div>
      </nav>

      {editorOpen ? (
        <PlanEditor
          key={editorPlan?.id ?? "new"}
          open={editorOpen}
          onOpenChange={(open) => {
            if (!open) setEditorPlan(undefined);
          }}
          plan={editorPlan ?? undefined}
        />
      ) : null}

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />

      <Drawer
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Treino ainda aberto"
        description={
          pending ? `${pending.decision.session.sourcePlanName ?? "Treino"} não foi encerrado.` : undefined
        }
      >
        <div className="space-y-3 pt-2">
          <Button
            className="w-full"
            onClick={() => {
              if (!pending) return;
              openSession(pending.decision.session, false);
              setPending(null);
            }}
          >
            Continuar o anterior
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              if (!pending) return;
              const started = startAnyway(pending.next);
              openSession(started, false);
              setPending(null);
              toast("O treino anterior ficou na semana");
            }}
          >
            Começar outro
          </Button>
        </div>
      </Drawer>
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Sun;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium tracking-wide",
        active ? "text-fg" : "text-subtle",
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
      {label}
    </button>
  );
}
