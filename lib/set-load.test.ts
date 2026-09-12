import { describe, expect, it } from 'vitest';
import { formatSetLoad } from './set-load';

describe('set load copy', () => {
    it('omits bodyweight language when kg and reps are empty', () => {
        expect(formatSetLoad(null, 0)).toBe('');
        expect(formatSetLoad(undefined, 0)).toBe('');
    });

    it('shows only the values that exist', () => {
        expect(formatSetLoad(80, 8)).toBe('80 kg · 8 reps');
        expect(formatSetLoad(62.5, 0)).toBe('62,5 kg');
        expect(formatSetLoad(null, 12)).toBe('12 reps');
    });
});
