import { describe, expect, it } from 'vitest';
import { commitAppState, createBackup, loadAppState, parseBackup, PersistenceUnavailableError, saveAppState } from './storage';
import type { AppState } from './types';

const emptyState: AppState = { plans: [], sessions: [], todayPin: null };

describe('backup schema', () => {
  it('migra backup v1 para v2 e preenche emoji ausente', () => {
    const parsed = parseBackup({
      schemaVersion: 1,
      app: 'treino-de-hoje',
      exportedAt: '2026-08-29T12:00:00.000Z',
      data: {
        plans: [{ id: 'plan-1', name: 'Treino A', exercises: [], createdAt: '2026-08-01T12:00:00.000Z', updatedAt: '2026-08-01T12:00:00.000Z' }],
        sessions: [],
        todayPin: null,
      },
    });

    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.data.plans[0].emoji).toBeNull();
  });

  it('cria novos backups na versão 2 preservando emoji', () => {
    const state: AppState = {
      ...emptyState,
      plans: [{ id: 'plan-1', name: 'Treino A', emoji: '🏋️', exercises: [], createdAt: '2026-08-01T12:00:00.000Z', updatedAt: '2026-08-01T12:00:00.000Z' }],
    };
    const backup = createBackup(state);

    expect(backup.schemaVersion).toBe(2);
    expect(backup.data.plans[0].emoji).toBe('🏋️');
  });
});

describe('roundtrip do backup', () => {
  // A9: o que volta do JSON precisa ser idêntico ao registro confirmado.
  it('preserva sessão, exercícios, séries, IDs e horários', () => {
    const state: AppState = {
      plans: [],
      todayPin: null,
      sessions: [{
        id: 'sessao-1',
        sourcePlanId: null,
        sourcePlanName: null,
        state: 'completed',
        startedAt: '2026-09-14T21:42:00.000Z',
        completedAt: '2026-09-14T22:30:00.000Z',
        exercises: [{
          id: 'exercicio-1',
          order: 0,
          planned: null,
          performed: {
            id: 'custom-exercicio-1',
            name: 'Exercício 1',
            equipment: null,
            primaryMuscles: [],
            images: [],
            instructions: [],
            category: 'strength',
            mechanic: null,
          },
          status: 'added',
          sets: [
            { id: 'set-1', index: 1, kg: null, reps: 0, savedAt: '2026-09-14T21:45:00.000Z' },
            { id: 'set-2', index: 2, kg: 80, reps: 8, savedAt: '2026-09-14T21:49:00.000Z' },
          ],
        }],
      }],
    };

    const roundtrip = parseBackup(JSON.parse(JSON.stringify(createBackup(state))));

    expect(roundtrip.schemaVersion).toBe(2);
    expect(roundtrip.data).toEqual(state);
  });
});

describe('armazenamento indisponível', () => {
  // Sem IndexedDB (ambiente de teste sem janela), leitura e escrita falham de
  // forma explícita: nada de estado vazio silencioso nem sucesso sem gravação.
  it('recusa a leitura em vez de devolver um aparelho vazio', async () => {
    await expect(loadAppState()).rejects.toBeInstanceOf(PersistenceUnavailableError);
  });

  it('recusa a gravação em vez de resolver como sucesso', async () => {
    await expect(saveAppState(emptyState)).rejects.toBeInstanceOf(PersistenceUnavailableError);
  });

  it('não executa a operação de domínio quando não há transação', async () => {
    let applied = false;
    await expect(
      commitAppState((current) => {
        applied = true;
        return { nextState: current, outcome: null };
      }),
    ).rejects.toBeInstanceOf(PersistenceUnavailableError);
    expect(applied).toBe(false);
  });
});
