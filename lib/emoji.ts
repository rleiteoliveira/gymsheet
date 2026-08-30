const emojiCodePointPattern = /[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2500}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

export function normalizeEmojiInput(value: string): { value: string | null; valid: boolean } {
  const trimmed = value.trim();
  if (!trimmed) return { value: null, valid: true };
  const segments = typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter('pt-BR', { granularity: 'grapheme' }).segment(trimmed)].map((item) => item.segment)
    : Array.from(trimmed);
  const candidate = segments[0] ?? '';
  const isEmoji = emojiCodePointPattern.test(candidate) || candidate.includes('\uFE0F') || candidate.includes('\u20E3');
  return segments.length === 1 && isEmoji ? { value: candidate, valid: true } : { value: null, valid: false };
}
