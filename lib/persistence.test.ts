import { describe, expect, it } from 'vitest';
import { applyWorkoutIntent, type WorkoutIntent } from './persistence';
import { createQuickExercise, createQuickSessionWithStarter } from './session';
import type { AppState, Session } from './types';

const startedAt = new Date('2026-09-14T18:42:00.000Z');

function makeIdFactory(prefix: string) {
  let count = 0;
  return () => `${prefix}-${++count}`;
}

function stateWithOpenSession(): { state: AppState; session: Session } {
  const session = createQuickSessionWithStarter(null, startedAt, makeIdFactory('open'));
  return {
    state: { plans: [], sessions: [session], todayPin: { kind: 'session', id: session.id } },
    session,
  };
}

function markSet(session: Session, setId: string, expectedState: Session['state'] = 'in_progress'): WorkoutIntent {
  return {
    kind: 'mark-set',
    sessionId: session.id,
    exerciseId: session.exercises[0].id,
    setId,
    savedAt: '2026-09-14T18:45:00.000Z',
    expectedState,
  };
}

describe('applyWorkoutIntent — marcar série', () => {
  it('numera a série pelo estado confirmado, não pela visão da aba', () => {
    const { state, session } = stateWithOpenSession();
    const first = applyWorkoutIntent(state, markSet(session, 'set-1'));
    expect(first.status).toBe('applied');
    const second = applyWorkoutIntent(first.nextState!, markSet(session, 'set-2'));

    expect(second.status).toBe('applied');
    expect(second.nextState!.sessions[0].exercises[0].sets.map((set) => set.index)).toEqual([1, 2]);
  });

  it('repetir a mesma marca é a mesma operação, não uma série nova', () => {
    const { state, session } = stateWithOpenSession();
    const intent = markSet(session, 'set-1');
    const applied = applyWorkoutIntent(state, intent);
    const retry = applyWorkoutIntent(applied.nextState!, intent);

    expect(retry.status).toBe('already-applied');
    expect(retry.nextState).toBeUndefined();
    expect(applied.nextState!.sessions[0].exercises[0].sets).toHaveLength(1);
  });

  it('preserva o ID e o horário da intenção no retry', () => {
    const { state, session } = stateWithOpenSession();
    const intent = markSet(session, 'set-1');
    const applied = applyWorkoutIntent(state, intent);
    const [set] = applied.nextState!.sessions[0].exercises[0].sets;

    expect(set.id).toBe('set-1');
    expect(set.savedAt).toBe('2026-09-14T18:45:00.000Z');
    expect(set.kg).toBeNull();
    expect(set.reps).toBe(0);
  });

  it('recusa marca de aba obsoleta sobre sessão já encerrada', () => {
    const { state, session } = stateWithOpenSession();
    const closed = applyWorkoutIntent(state, {
      kind: 'finish-session',
      sessionId: session.id,
      completedAt: '2026-09-14T19:10:00.000Z',
    });
    const late = applyWorkoutIntent(closed.nextState!, markSet(session, 'set-tarde'));

    expect(late.status).toBe('stale');
    expect(late.nextState).toBeUndefined();
    expect(closed.nextState!.sessions[0].state).toBe('completed');
    expect(closed.nextState!.sessions[0].exercises[0].sets).toHaveLength(0);
  });

  it('mantém a correção deliberada de um registro já encerrado', () => {
    const { state, session } = stateWithOpenSession();
    const closed = applyWorkoutIntent(state, {
      kind: 'finish-session',
      sessionId: session.id,
      completedAt: '2026-09-14T19:10:00.000Z',
    });
    const correction = applyWorkoutIntent(closed.nextState!, markSet(session, 'set-correcao', 'completed'));

    expect(correction.status).toBe('applied');
    expect(correction.nextState!.sessions[0].state).toBe('completed');
    expect(correction.nextState!.sessions[0].completedAt).toBe('2026-09-14T19:10:00.000Z');
    expect(correction.nextState!.sessions[0].exercises[0].sets.map((set) => set.id)).toEqual(['set-correcao']);
  });

  it('recusa marca em exercício que não está mais na sessão', () => {
    const { state, session } = stateWithOpenSession();
    const orphan = applyWorkoutIntent(state, {
      kind: 'mark-set',
      sessionId: session.id,
      exerciseId: 'exercicio-fantasma',
      setId: 'set-1',
      savedAt: '2026-09-14T18:45:00.000Z',
      expectedState: 'in_progress',
    });

    expect(orphan.status).toBe('stale');
    expect(orphan.nextState).toBeUndefined();
  });
});

describe('applyWorkoutIntent — exercício e sessão', () => {
  it('ordena o exercício pela sessão confirmada e ignora a repetição', () => {
    const { state, session } = stateWithOpenSession();
    const exercise = { ...createQuickExercise(0, makeIdFactory('novo')), order: 9 };
    const intent: WorkoutIntent = { kind: 'add-exercise', sessionId: session.id, exercise, expectedState: 'in_progress' };
    const applied = applyWorkoutIntent(state, intent);

    expect(applied.status).toBe('applied');
    expect(applied.nextState!.sessions[0].exercises.map((item) => item.order)).toEqual([0, 1]);
    expect(applyWorkoutIntent(applied.nextState!, intent).status).toBe('already-applied');
  });

  it('cria a sessão uma única vez quando a mesma partida é repetida', () => {
    const { state } = stateWithOpenSession();
    const session = createQuickSessionWithStarter(null, startedAt, makeIdFactory('nova'));
    const intent: WorkoutIntent = { kind: 'start-session', session, supersedes: null };
    const applied = applyWorkoutIntent(state, intent);

    expect(applied.status).toBe('applied');
    expect(applied.nextState!.sessions).toHaveLength(2);
    expect(applied.nextState!.todayPin).toEqual({ kind: 'session', id: session.id });
    expect(applyWorkoutIntent(applied.nextState!, intent).status).toBe('already-applied');
  });

  it('encerra a sessão anterior e abre a nova na mesma operação', () => {
    const { state, session: previous } = stateWithOpenSession();
    const session = createQuickSessionWithStarter(null, new Date('2026-09-15T18:00:00.000Z'), makeIdFactory('nova'));
    const applied = applyWorkoutIntent(state, { kind: 'start-session', session, supersedes: previous.id });

    expect(applied.status).toBe('applied');
    const [closed, opened] = applied.nextState!.sessions;
    expect(closed.state).toBe('completed');
    expect(closed.completedAt).toBe(session.startedAt);
    expect(closed.startedAt).toBe(previous.startedAt);
    expect(opened.state).toBe('in_progress');
  });

  it('finalizar duas vezes com o mesmo horário é idempotente e libera o pin', () => {
    const { state, session } = stateWithOpenSession();
    const intent: WorkoutIntent = {
      kind: 'finish-session',
      sessionId: session.id,
      completedAt: '2026-09-14T19:10:00.000Z',
    };
    const applied = applyWorkoutIntent(state, intent);

    expect(applied.status).toBe('applied');
    expect(applied.nextState!.todayPin).toBeNull();
    expect(applyWorkoutIntent(applied.nextState!, intent).status).toBe('already-applied');
  });

  it('recusa finalizar de novo com horário diferente do encerramento confirmado', () => {
    const { state, session } = stateWithOpenSession();
    const applied = applyWorkoutIntent(state, {
      kind: 'finish-session',
      sessionId: session.id,
      completedAt: '2026-09-14T19:10:00.000Z',
    });
    const late = applyWorkoutIntent(applied.nextState!, {
      kind: 'finish-session',
      sessionId: session.id,
      completedAt: '2026-09-14T19:30:00.000Z',
    });

    expect(late.status).toBe('stale');
    expect(applied.nextState!.sessions[0].completedAt).toBe('2026-09-14T19:10:00.000Z');
  });

  it('recusa operar sobre sessão que não existe mais no aparelho', () => {
    const { state } = stateWithOpenSession();
    const missing = applyWorkoutIntent(state, {
      kind: 'finish-session',
      sessionId: 'sessao-removida',
      completedAt: '2026-09-14T19:10:00.000Z',
    });

    expect(missing.status).toBe('stale');
    expect(missing.nextState).toBeUndefined();
  });
});
