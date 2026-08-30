import { describe, expect, it } from 'vitest';
import { createBackup, parseBackup } from './storage';
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
