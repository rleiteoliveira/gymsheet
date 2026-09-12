import { describe, expect, it } from 'vitest';
import { parseSkin, setCountCopy } from './skin';

describe('skin', () => {
    it('accepts calor, studio and pulse and falls back to calor', () => {
        expect(parseSkin('calor')).toBe('calor');
        expect(parseSkin('studio')).toBe('studio');
        expect(parseSkin('pulse')).toBe('pulse');
        expect(parseSkin(null)).toBe('calor');
        expect(parseSkin('neon')).toBe('calor');
    });

    it('describes set counts without inventing a ring or a cap', () => {
        expect(setCountCopy(0, null)).toEqual({
            count: '0',
            label: 'séries',
            accessibleName: '0 séries registradas',
        });
        expect(setCountCopy(1, null)).toEqual({
            count: '1',
            label: 'série',
            accessibleName: '1 série registrada',
        });
        expect(setCountCopy(4, 3)).toEqual({
            count: '4',
            label: '4 de 3 séries',
            accessibleName: '4 de 3 séries',
        });
        expect(setCountCopy(0, 0)).toMatchObject({ count: '0', label: 'séries' });
    });
});
