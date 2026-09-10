import { describe, expect, it } from 'vitest';
import {
  elapsedMilliseconds,
  formatElapsedDuration,
  formatSetRecordedAt,
  workoutElapsedMilliseconds,
} from './workout-time';

describe('workout time', () => {
  it('clamps a negative interval and formats minutes, hours and more than a day', () => {
    expect(elapsedMilliseconds('2026-09-06T15:00:00.000Z', '2026-09-06T14:59:00.000Z')).toBe(0);
    expect(formatElapsedDuration(0)).toBe('00:00');
    expect(formatElapsedDuration(65_000)).toBe('01:05');
    expect(formatElapsedDuration(3_661_000)).toBe('1:01:01');
    expect(formatElapsedDuration(86_401_000)).toBe('24:00:01');
  });

  it('freezes a completed duration and uses the current time for an open session', () => {
    const startedAt = '2026-09-06T15:00:00.000Z';
    expect(workoutElapsedMilliseconds(startedAt, 'in_progress', null, Date.parse('2026-09-06T15:01:05.000Z'))).toBe(65_000);
    expect(workoutElapsedMilliseconds(startedAt, 'completed', '2026-09-06T15:01:05.000Z', Date.parse('2026-09-06T18:00:00.000Z'))).toBe(65_000);
    expect(workoutElapsedMilliseconds('invalid', 'in_progress', null, Date.now())).toBeNull();
    expect(workoutElapsedMilliseconds(startedAt, 'completed', 'invalid', Date.now())).toBeNull();
  });

  it('marks a record from another local day without changing its timestamp', () => {
    const startedAt = '2026-09-06T15:00:00.000Z';
    expect(formatSetRecordedAt('2026-09-06T15:12:00.000Z', startedAt)).toMatch(/^\d{2}:\d{2}$/);
    expect(formatSetRecordedAt('2026-09-07T15:12:00.000Z', startedAt)).toMatch(/^Registrada em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}$/);
    expect(formatSetRecordedAt('invalid', startedAt)).toBe('Horário indisponível');
  });
});
