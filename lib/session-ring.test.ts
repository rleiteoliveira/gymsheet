import { describe, expect, it } from 'vitest';
import { sessionRingView } from './session-ring';

describe('session ring', () => {
  it('fills a planned ring from sets done versus targetSets and completes at the target', () => {
    expect(sessionRingView({ kind: 'planned', done: 0, target: 3 })).toEqual({
      ratio: 0,
      label: '0/3',
      complete: false,
      accessibleName: '0 de 3 séries',
    });
    expect(sessionRingView({ kind: 'planned', done: 2, target: 3 })).toEqual({
      ratio: 2 / 3,
      label: '2/3',
      complete: false,
      accessibleName: '2 de 3 séries',
    });
    expect(sessionRingView({ kind: 'planned', done: 3, target: 3 })).toEqual({
      ratio: 1,
      label: '3/3',
      complete: true,
      accessibleName: '3 de 3 séries, meta atingida',
    });
    expect(sessionRingView({ kind: 'planned', done: 5, target: 3 }).ratio).toBe(1);
  });

  it('grows an open ring per recorded set without inventing a goal or completing', () => {
    expect(sessionRingView({ kind: 'open', done: 0 })).toEqual({
      ratio: 0,
      label: '0',
      complete: false,
      accessibleName: '0 séries registradas',
    });
    expect(sessionRingView({ kind: 'open', done: 1 })).toMatchObject({
      ratio: 0.12,
      label: '1',
      complete: false,
      accessibleName: '1 série registrada',
    });
    expect(sessionRingView({ kind: 'open', done: 8 })).toMatchObject({
      ratio: 0.92,
      complete: false,
      label: '8',
    });
    expect(sessionRingView({ kind: 'open', done: 20 }).complete).toBe(false);
    expect(sessionRingView({ kind: 'open', done: 20 }).ratio).toBe(0.92);
  });

  it('treats a missing planned target as an open ring and clamps invalid counts', () => {
    expect(sessionRingView({ kind: 'planned', done: 2, target: 0 })).toMatchObject({
      label: '2',
      complete: false,
    });
    expect(sessionRingView({ kind: 'planned', done: -4, target: 3 }).label).toBe('0/3');
    expect(sessionRingView({ kind: 'open', done: Number.NaN }).label).toBe('0');
  });
});
