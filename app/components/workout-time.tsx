'use client';

import { useEffect, useState } from 'react';
import {
  formatAccessibleDateTime,
  formatElapsedDuration,
  formatSetRecordedAt,
  workoutElapsedMilliseconds,
  type WorkoutTimeState,
} from '@/lib/workout-time';

interface WorkoutTimerProps {
  startedAt: string;
  completedAt: string | null;
  state: WorkoutTimeState;
}

export function WorkoutTimer({ startedAt, completedAt, state }: WorkoutTimerProps) {
  const running = state === 'in_progress';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    if (!running) return undefined;
    const interval = window.setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [running, startedAt, completedAt]);

  const elapsed = workoutElapsedMilliseconds(startedAt, state, completedAt, now);
  const label = running ? 'Tempo de treino' : 'Intervalo registrado';
  return (
    <p className="essential-session-timer" data-testid="workout-timer">
      <span>{label}</span>
      <span aria-hidden="true"> · </span>
      <time>{formatElapsedDuration(elapsed)}</time>
    </p>
  );
}

interface SetRecordedAtProps {
  savedAt: string;
  sessionStartedAt: string;
}

export function SetRecordedAt({ savedAt, sessionStartedAt }: SetRecordedAtProps) {
  const visible = formatSetRecordedAt(savedAt, sessionStartedAt);
  const accessible = formatAccessibleDateTime(savedAt);
  return (
    <time
      className="essential-set-time"
      dateTime={savedAt}
      title={accessible}
      aria-label={`Registrada em ${accessible}`}
    >
      {visible}
    </time>
  );
}
