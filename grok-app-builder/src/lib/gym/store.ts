import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBackup, emptyState, parseBackup } from "./backup";
import { buildDemoState } from "./demo";
import { makeId } from "./ids";
import {
  addExercise,
  completeSession as completeSessionRecord,
  createQuickSession,
  createSessionFromPlan,
  decideSessionStart,
  saveSet,
  skipExercise,
  swapExercise,
  undoExercise,
  type SessionStartDecision,
} from "./session";
import type {
  AppState,
  ExerciseSnapshot,
  Plan,
  PlanExercise,
  Session,
  SessionExercise,
  TodayPin,
} from "./types";

export type Tab = "today" | "plans" | "week";

interface GymStore extends AppState {
  ready: boolean;
  markReady: () => void;
  replace: (next: AppState) => void;
  loadDemo: () => void;
  clearAll: () => void;
  setPin: (pin: TodayPin) => void;
  savePlan: (plan: Plan) => void;
  deletePlan: (planId: string) => void;
  rememberCustom: (exercise: ExerciseSnapshot) => void;
  startFromPlan: (plan: Plan, startedAt?: Date) => SessionStartDecision | Session;
  startFree: (name: string, startedAt?: Date) => SessionStartDecision | Session;
  resumeSession: (sessionId: string) => Session | null;
  startAnyway: (session: Session) => Session;
  logSet: (sessionId: string, exerciseId: string, kg: number | null, reps: number) => void;
  skip: (sessionId: string, exerciseId: string) => void;
  undo: (sessionId: string, exerciseId: string) => void;
  swap: (sessionId: string, exerciseId: string, performed: ExerciseSnapshot) => void;
  addToSession: (sessionId: string, exercise: ExerciseSnapshot) => string;
  finish: (sessionId: string) => void;
  exportBackup: () => string;
  importBackup: (raw: unknown) => boolean;
}

const initial = buildDemoState();

function withSession(sessions: Session[], session: Session) {
  return sessions.map((item) => (item.id === session.id ? session : item));
}

export const useGymStore = create<GymStore>()(
  persist(
    (set, get) => ({
      ...initial,
      ready: false,
      markReady: () => set({ ready: true }),
      replace: (next) => set({ ...next }),
      loadDemo: () => set({ ...buildDemoState() }),
      clearAll: () => set({ ...emptyState() }),
      setPin: (todayPin) => set({ todayPin }),
      savePlan: (plan) =>
        set((state) => {
          const exists = state.plans.some((item) => item.id === plan.id);
          const plans = exists
            ? state.plans.map((item) => (item.id === plan.id ? plan : item))
            : [...state.plans, plan];
          const todayPin = state.todayPin ?? { kind: "plan" as const, id: plan.id };
          return { plans, todayPin };
        }),
      deletePlan: (planId) =>
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== planId),
          todayPin:
            state.todayPin?.kind === "plan" && state.todayPin.id === planId ? null : state.todayPin,
        })),
      rememberCustom: (exercise) =>
        set((state) => {
          if (state.customExercises.some((item) => item.id === exercise.id)) return state;
          return { customExercises: [...state.customExercises, exercise] };
        }),
      startFromPlan: (plan, startedAt = new Date()) => {
        const decision = decideSessionStart(get().sessions, startedAt);
        if (decision.kind !== "create") return decision;
        const session = createSessionFromPlan(plan, startedAt, makeId);
        set((state) => ({
          sessions: [...state.sessions, session],
          todayPin: { kind: "plan", id: plan.id },
        }));
        return session;
      },
      startFree: (name, startedAt = new Date()) => {
        const decision = decideSessionStart(get().sessions, startedAt);
        if (decision.kind !== "create") return decision;
        const session = createQuickSession(name, startedAt, makeId);
        set((state) => ({ sessions: [...state.sessions, session] }));
        return session;
      },
      resumeSession: (sessionId) => get().sessions.find((session) => session.id === sessionId) ?? null,
      startAnyway: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session],
          todayPin: session.sourcePlanId ? { kind: "plan", id: session.sourcePlanId } : state.todayPin,
        }));
        return session;
      },
      logSet: (sessionId, exerciseId, kg, reps) =>
        set((state) => {
          const current = state.sessions.find((item) => item.id === sessionId);
          if (!current || current.state !== "in_progress") return state;
          const exercise = current.exercises.find((item) => item.id === exerciseId);
          if (!exercise) return state;
          const next = saveSet(current, exerciseId, {
            id: makeId(),
            index: exercise.sets.length + 1,
            kg,
            reps,
            savedAt: new Date().toISOString(),
          });
          return { sessions: withSession(state.sessions, next) };
        }),
      skip: (sessionId, exerciseId) =>
        set((state) => {
          const current = state.sessions.find((item) => item.id === sessionId);
          if (!current || current.state !== "in_progress") return state;
          return { sessions: withSession(state.sessions, skipExercise(current, exerciseId)) };
        }),
      undo: (sessionId, exerciseId) =>
        set((state) => {
          const current = state.sessions.find((item) => item.id === sessionId);
          if (!current || current.state !== "in_progress") return state;
          return { sessions: withSession(state.sessions, undoExercise(current, exerciseId)) };
        }),
      swap: (sessionId, exerciseId, performed) =>
        set((state) => {
          const current = state.sessions.find((item) => item.id === sessionId);
          if (!current || current.state !== "in_progress") return state;
          return { sessions: withSession(state.sessions, swapExercise(current, exerciseId, performed)) };
        }),
      addToSession: (sessionId, exercise) => {
        const id = makeId();
        set((state) => {
          const current = state.sessions.find((item) => item.id === sessionId);
          if (!current || current.state !== "in_progress") return state;
          const added: SessionExercise = {
            id,
            order: current.exercises.length,
            planned: null,
            performed: exercise,
            status: "added",
            sets: [],
          };
          return { sessions: withSession(state.sessions, addExercise(current, added)) };
        });
        return id;
      },
      finish: (sessionId) =>
        set((state) => {
          const current = state.sessions.find((item) => item.id === sessionId);
          if (!current || current.state !== "in_progress") return state;
          return {
            sessions: withSession(state.sessions, completeSessionRecord(current, new Date())),
          };
        }),
      exportBackup: () =>
        JSON.stringify(
          createBackup({
            plans: get().plans,
            sessions: get().sessions,
            todayPin: get().todayPin,
            customExercises: get().customExercises,
          }),
          null,
          2,
        ),
      importBackup: (raw) => {
        try {
          const data = parseBackup(raw);
          set({ ...data });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "gymsheet-v1",
      skipHydration: true,
      partialize: (state) => ({
        plans: state.plans,
        sessions: state.sessions,
        todayPin: state.todayPin,
        customExercises: state.customExercises,
      }),
    },
  ),
);

export function draftFromPlan(plan?: Plan): { id?: string; name: string; exercises: PlanExercise[] } {
  if (!plan) return { name: "", exercises: [] };
  return {
    id: plan.id,
    name: plan.name,
    exercises: plan.exercises.map((exercise) => ({
      ...exercise,
      exercise: { ...exercise.exercise, primaryMuscles: [...exercise.exercise.primaryMuscles] },
    })),
  };
}
