import { applySessionEdit, completeSession } from './session';
import type { AppState, Session, SessionExercise, SetRecord } from './types';

/**
 * Intents of the live workout capture. Every identifier and timestamp is minted
 * by the caller before the transaction, so replaying the same intent after a
 * failure is the same operation and not a new one.
 */
export type WorkoutIntent =
  | { kind: 'start-session'; session: Session; supersedes: string | null }
  | { kind: 'add-exercise'; sessionId: string; exercise: SessionExercise; expectedState: Session['state'] }
  | { kind: 'mark-set'; sessionId: string; exerciseId: string; setId: string; savedAt: string; expectedState: Session['state'] }
  | { kind: 'finish-session'; sessionId: string; completedAt: string };

export type WorkoutIntentStatus = 'applied' | 'already-applied' | 'stale';

export interface WorkoutIntentResult {
  status: WorkoutIntentStatus;
  // Present only when the stored state must change.
  nextState?: AppState;
  reason?: string;
}

function findSession(state: AppState, sessionId: string): Session | undefined {
  return state.sessions.find((session) => session.id === sessionId);
}

function replaceSession(state: AppState, next: Session): AppState {
  return {
    ...state,
    sessions: state.sessions.map((session) => (session.id === next.id ? next : session)),
  };
}

function clearSessionPin(state: AppState, sessionId: string): AppState['todayPin'] {
  return state.todayPin?.kind === 'session' && state.todayPin.id === sessionId ? null : state.todayPin;
}

/**
 * Applies one capture intent over the freshest committed state. Rejections are
 * explicit: a tab holding an old view never reopens or rewrites a session that
 * another tab already closed.
 */
export function applyWorkoutIntent(current: AppState, intent: WorkoutIntent): WorkoutIntentResult {
  if (intent.kind === 'start-session') {
    if (findSession(current, intent.session.id)) {
      return { status: 'already-applied' };
    }
    const previous = intent.supersedes ? findSession(current, intent.supersedes) : undefined;
    const startedAt = new Date(intent.session.startedAt);
    return {
      status: 'applied',
      nextState: {
        ...current,
        sessions: [
          ...current.sessions.map((session) =>
            previous && session.id === previous.id && session.state === 'in_progress'
              ? completeSession(session, startedAt)
              : session,
          ),
          intent.session,
        ],
        todayPin: { kind: 'session', id: intent.session.id },
      },
    };
  }

  const session = findSession(current, intent.sessionId);
  if (!session) {
    return { status: 'stale', reason: 'Este treino não está mais no aparelho.' };
  }

  if (intent.kind === 'finish-session') {
    if (session.state === 'completed') {
      return session.completedAt === intent.completedAt
        ? { status: 'already-applied' }
        : { status: 'stale', reason: 'Este treino já foi finalizado em outra aba.' };
    }
    return {
      status: 'applied',
      nextState: {
        ...replaceSession(current, completeSession(session, new Date(intent.completedAt))),
        todayPin: clearSessionPin(current, session.id),
      },
    };
  }

  // The intent revalidates the target it was written for. A live capture from a
  // stale tab is refused once the session closed elsewhere, while a deliberate
  // correction of an already closed record keeps working.
  if (session.state !== intent.expectedState) {
    return {
      status: 'stale',
      reason: session.state === 'completed'
        ? 'Este treino já foi finalizado em outra aba.'
        : 'Este treino foi reaberto em outra aba.',
    };
  }

  if (intent.kind === 'add-exercise') {
    if (session.exercises.some((exercise) => exercise.id === intent.exercise.id)) {
      return { status: 'already-applied' };
    }
    // The position comes from the committed state, never from the tab's view.
    const exercise: SessionExercise = { ...intent.exercise, order: session.exercises.length };
    return {
      status: 'applied',
      nextState: replaceSession(current, applySessionEdit(session, { type: 'add', exercise })),
    };
  }

  const exercise = session.exercises.find((item) => item.id === intent.exerciseId);
  if (!exercise) {
    return { status: 'stale', reason: 'Este exercício não está mais neste treino.' };
  }
  if (exercise.sets.some((set) => set.id === intent.setId)) {
    return { status: 'already-applied' };
  }
  const set: SetRecord = {
    id: intent.setId,
    index: exercise.sets.length + 1,
    kg: null,
    reps: 0,
    savedAt: intent.savedAt,
  };
  return {
    status: 'applied',
    nextState: replaceSession(
      current,
      applySessionEdit(session, { type: 'save-set', exerciseId: exercise.id, set }),
    ),
  };
}
