import { addCivilDays } from './calendar';
import { localCivilDateKey } from './session';
import type { CatalogExercise, Session, SessionExercise } from './types';

export interface FavoriteScore {
  count: number;
  lastUsedAt: string;
}

export type FavoriteScores = Map<string, FavoriteScore>;

function performedExerciseId(exercise: SessionExercise): string | null {
  if (exercise.status === 'done') return exercise.performed?.id ?? exercise.planned?.exercise.id ?? null;
  if (exercise.status === 'added' || exercise.status === 'swapped') return exercise.performed?.id ?? null;
  return null;
}

function isWithinWindow(session: Session, now: Date): boolean {
  const today = localCivilDateKey(now);
  const firstDay = localCivilDateKey(addCivilDays(today, -29));
  const sessionDay = localCivilDateKey(session.startedAt);
  return sessionDay >= firstDay && sessionDay <= today;
}

export function computeFavoriteScores(sessions: Session[], now = new Date()): FavoriteScores {
  const scores: FavoriteScores = new Map();
  for (const session of sessions) {
    if (session.state !== 'completed' || !isWithinWindow(session, now)) continue;
    for (const exercise of session.exercises) {
      const exerciseId = performedExerciseId(exercise);
      if (!exerciseId) continue;
      const current = scores.get(exerciseId);
      if (!current) {
        scores.set(exerciseId, { count: 1, lastUsedAt: session.startedAt });
      } else {
        scores.set(exerciseId, {
          count: current.count + 1,
          lastUsedAt: current.lastUsedAt > session.startedAt ? current.lastUsedAt : session.startedAt,
        });
      }
    }
  }
  return scores;
}

export function rankCatalogExercises(exercises: CatalogExercise[], scores: FavoriteScores): CatalogExercise[] {
  return [...exercises].sort((left, right) => {
    const leftScore = scores.get(left.id);
    const rightScore = scores.get(right.id);
    if ((leftScore?.count ?? 0) !== (rightScore?.count ?? 0)) {
      return (rightScore?.count ?? 0) - (leftScore?.count ?? 0);
    }
    if (leftScore?.lastUsedAt !== rightScore?.lastUsedAt) {
      return (rightScore?.lastUsedAt ?? '').localeCompare(leftScore?.lastUsedAt ?? '');
    }
    return left.name.localeCompare(right.name, 'pt-BR');
  });
}
