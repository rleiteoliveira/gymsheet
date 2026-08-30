import { describe, expect, it } from 'vitest';
import { normalizeEmojiInput } from './emoji';

describe('emoji de ficha', () => {
  it('aceita vazio e um único grapheme emoji', () => {
    expect(normalizeEmojiInput('')).toEqual({ value: null, valid: true });
    expect(normalizeEmojiInput('🏋️‍♂️')).toEqual({ value: '🏋️‍♂️', valid: true });
  });

  it('rejeita texto ou mais de um grapheme', () => {
    expect(normalizeEmojiInput('Treino')).toEqual({ value: null, valid: false });
    expect(normalizeEmojiInput('💪 🦵')).toEqual({ value: null, valid: false });
  });
});
