import { describe, expect, it } from 'vitest';
import { needsReview } from './bank';
import { SEEN_CAP, addSeen, nameKey, playerKeys } from './seen';

describe('who has seen what', () => {
  it('matches a name however it is typed', () => {
    expect(nameKey('  Dad ')).toBe('dad');
    expect(nameKey('Big   Sis')).toBe('big sis');
    expect(playerKeys(['Dad', 'dad', 'Mum', '', null])).toEqual(['dad', 'mum']);
  });

  it('adds a game to a player, newest last, no repeats, capped', () => {
    expect(addSeen(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(addSeen([], ['x', 'x', 7, 'a-very-long-key-that-is-not-ours'])).toEqual(['x']);
    const full = Array.from({ length: SEEN_CAP }, (_, i) => `q${i}`);
    const after = addSeen(full, ['new']);
    expect(after).toHaveLength(SEEN_CAP);
    expect(after.at(-1)).toBe('new');
    expect(after[0]).toBe('q1');
  });
});

describe('the thumbs', () => {
  it('sends a question to review on two wrong-answer flags, or mostly thumbs down', () => {
    expect(needsReview({ up: 0, down: 0, wrong: 1 })).toBe(false);
    expect(needsReview({ wrong: 2 })).toBe(true);
    expect(needsReview({ up: 0, down: 4 })).toBe(false);
    expect(needsReview({ up: 1, down: 4 })).toBe(true);
    expect(needsReview({ up: 3, down: 4 })).toBe(false);
    expect(needsReview({ up: 10, down: 2 })).toBe(false);
  });
});
