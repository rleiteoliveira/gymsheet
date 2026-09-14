import type { DBSchema, IDBPDatabase } from 'idb';
import { z } from 'zod';
import type { AppState, BackupV2, CatalogCache, Plan } from './types';

interface TreinoDb extends DBSchema {
  app: {
    key: 'state';
    value: AppState;
  };
  catalog: {
    key: 'current';
    value: CatalogCache;
  };
}

const DB_NAME = 'treino-de-hoje';
const DEFAULT_STATE: AppState = { plans: [], sessions: [], todayPin: null };

// Raised when the browser refuses IndexedDB. A write that never reached disk is never a success.
export class PersistenceUnavailableError extends Error {
  constructor() {
    super('Armazenamento local indisponível neste navegador.');
    this.name = 'PersistenceUnavailableError';
  }
}

let dbPromise: Promise<IDBPDatabase<TreinoDb>> | undefined;

async function openDatabase() {
  // Keep IndexedDB browser-only. The storage module is imported by the client
  // route during the server render, while persistence starts after hydration.
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
  if (!dbPromise) {
    const { openDB } = await import('idb');
    dbPromise = openDB<TreinoDb>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('app')) db.createObjectStore('app');
        if (!db.objectStoreNames.contains('catalog')) db.createObjectStore('catalog');
      },
    }).catch((error: unknown) => {
      // A rejected handle cannot stay cached, or the retry offered to the owner would never recover.
      dbPromise = undefined;
      throw error;
    });
  }
  return dbPromise;
}

// Handle for caches that may degrade without touching the owner's data.
async function optionalDb() {
  try {
    return await openDatabase();
  } catch {
    return null;
  }
}

// Handle for the owner's data. Absence is an explicit failure, never an empty state.
async function requireDb() {
  const db = await openDatabase();
  if (!db) throw new PersistenceUnavailableError();
  return db;
}

function normalizePlan(plan: Omit<Plan, 'emoji'> & { emoji?: string | null }): Plan {
  return { ...plan, emoji: plan.emoji ?? null };
}

function normalizeAppState(state: AppState): AppState {
  return {
    ...state,
    plans: state.plans.map((plan) => normalizePlan(plan)),
  };
}

export async function loadAppState(): Promise<AppState> {
  const db = await requireDb();
  const stored = await db.get('app', 'state');
  return stored ? normalizeAppState(stored) : structuredClone(DEFAULT_STATE);
}

export async function saveAppState(state: AppState): Promise<void> {
  const db = await requireDb();
  await db.put('app', state, 'state');
}

export interface CommitPlan<T> {
  // Omit to leave the stored state untouched, as in an already applied or rejected intent.
  nextState?: AppState;
  outcome: T;
}

export interface CommitResult<T> {
  state: AppState;
  outcome: T;
}

/**
 * Applies a domain operation over the last committed state inside a single
 * read/write transaction. Nothing is announced before `tx.done` resolves, so a
 * tab can neither overwrite what another tab confirmed nor report a write that
 * never landed.
 */
export async function commitAppState<T>(
  apply: (current: AppState) => CommitPlan<T>,
): Promise<CommitResult<T>> {
  const db = await requireDb();
  const tx = db.transaction('app', 'readwrite');
  try {
    const stored = await tx.store.get('state');
    const current = stored ? normalizeAppState(stored) : structuredClone(DEFAULT_STATE);
    // `apply` stays synchronous: awaiting anything else here would auto-commit the transaction.
    const plan = apply(current);
    if (plan.nextState) await tx.store.put(plan.nextState, 'state');
    await tx.done;
    return { state: plan.nextState ?? current, outcome: plan.outcome };
  } catch (error) {
    // Either the whole operation lands or nothing changes.
    try {
      tx.abort();
    } catch {
      // The transaction had already settled.
    }
    void tx.done.catch(() => undefined);
    throw error;
  }
}

export async function loadCatalogCache(): Promise<CatalogCache | undefined> {
  const db = await optionalDb();
  return db?.get('catalog', 'current');
}

export async function saveCatalogCache(cache: CatalogCache): Promise<void> {
  const db = await optionalDb();
  if (db) await db.put('catalog', cache, 'current');
}

const snapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  equipment: z.string().nullable(),
  primaryMuscles: z.array(z.string()),
  images: z.array(z.string()),
  instructions: z.array(z.string()),
  category: z.string(),
  mechanic: z.string().nullable(),
});

const planExerciseSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  exercise: snapshotSchema,
  targetSets: z.number().int().min(1).max(30),
  targetReps: z.number().int().min(1).max(999),
  targetKg: z.number().nonnegative().nullable(),
});

const setSchema = z.object({
  id: z.string(),
  index: z.number().int().min(1),
  kg: z.number().nonnegative().nullable(),
  reps: z.number().int().min(0).max(999),
  savedAt: z.string(),
});

const sessionExerciseSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  planned: planExerciseSchema.nullable(),
  performed: snapshotSchema.nullable(),
  status: z.enum(['done', 'skipped', 'swapped', 'added']).nullable(),
  sets: z.array(setSchema),
});

const planSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  emoji: z.string().nullable().optional(),
  exercises: z.array(planExerciseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
}).transform((plan) => ({ ...plan, emoji: plan.emoji ?? null }));

const appStateSchema = z.object({
  plans: z.array(planSchema),
  sessions: z.array(
    z.object({
      id: z.string(),
      sourcePlanId: z.string().nullable(),
      sourcePlanName: z.string().nullable(),
      state: z.enum(['in_progress', 'completed']),
      startedAt: z.string(),
      completedAt: z.string().nullable(),
      exercises: z.array(sessionExerciseSchema),
    }),
  ),
  todayPin: z
    .object({ kind: z.enum(['plan', 'session']), id: z.string() })
    .nullable(),
});

const backupDataSchema = z.object({
  app: z.literal('treino-de-hoje'),
  exportedAt: z.string(),
  data: appStateSchema,
});

const backupV1Schema = backupDataSchema.extend({ schemaVersion: z.literal(1) });
const backupV2Schema = backupDataSchema.extend({ schemaVersion: z.literal(2) });

export const backupSchema = z.union([backupV1Schema, backupV2Schema]);

export function parseBackup(raw: unknown): BackupV2 {
  const parsed = backupSchema.parse(raw);
  return {
    ...parsed,
    schemaVersion: 2,
    data: normalizeAppState(parsed.data),
  };
}

export async function restoreAppState(backup: BackupV2): Promise<void> {
  const db = await requireDb();
  const tx = db.transaction('app', 'readwrite');
  await tx.store.put(backup.data, 'state');
  await tx.done;
}

export function createBackup(data: AppState): BackupV2 {
  return {
    schemaVersion: 2,
    app: 'treino-de-hoje',
    exportedAt: new Date().toISOString(),
    data: normalizeAppState(data),
  };
}
