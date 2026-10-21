import { describe, expect, it } from 'vitest';
import { completedLines, dealCards, foundCount, newLines, rivalFinds, shuffle, standings, tilesInLines, TILES_PER_CARD } from './bingoRules';

const card = (foundIdx = []) =>
  Array.from({ length: 9 }, (_, i) => ({ tileId: `t${i}`, label: `item ${i}`, found: foundIdx.includes(i) }));

// A seeded generator, so a shuffle is the same every run.
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('lines', () => {
  it('finds no line on an empty or short card', () => {
    expect(completedLines(card())).toEqual([]);
    expect(completedLines(card([0, 1, 2]).slice(0, 5))).toEqual([]);
    expect(completedLines(undefined)).toEqual([]);
  });

  it('finds a row, a column and a diagonal', () => {
    expect(completedLines(card([0, 1, 2]))).toEqual([0]);
    expect(completedLines(card([1, 4, 7]))).toEqual([4]);
    expect(completedLines(card([2, 4, 6]))).toEqual([7]);
  });

  it('a full card is all eight lines', () => {
    expect(completedLines(card([0, 1, 2, 3, 4, 5, 6, 7, 8]))).toHaveLength(8);
  });

  it('reports only the lines a mark just completed', () => {
    // The centre completes the middle row, the middle column and both diagonals at once.
    const before = card([3, 5, 1, 7, 0, 8, 2, 6]);
    const after = card([3, 5, 1, 7, 0, 8, 2, 6, 4]);
    expect(newLines(before, after).sort()).toEqual([1, 4, 6, 7]);
    expect(newLines(after, after)).toEqual([]);
  });

  it('lists the tiles that sit in a complete line', () => {
    expect([...tilesInLines(card([0, 1, 2, 5]))].sort()).toEqual(['t0', 't1', 't2']);
  });
});

describe('rivalFinds', () => {
  const game = (cars) => ({ travelBingoConfig: { cars } });

  it('reports a new find on another car, not on mine', () => {
    const prev = game([
      { carId: 'me', name: 'Us', card: card() },
      { carId: 'them', name: 'The Smiths', card: card() },
    ]);
    const next = game([
      { carId: 'me', name: 'Us', card: card([0]) },
      { carId: 'them', name: 'The Smiths', card: card([3]) },
    ]);
    expect(rivalFinds(prev, next, 'me')).toEqual([{ carId: 'them', carName: 'The Smiths', label: 'item 3', at: undefined }]);
  });

  it('says nothing on the first load, or for a car that has just appeared', () => {
    const next = game([{ carId: 'them', name: 'The Smiths', card: card([3]) }]);
    expect(rivalFinds(null, next, 'me')).toEqual([]);
    expect(rivalFinds(game([]), next, 'me')).toEqual([]);
  });
});

describe('standings', () => {
  it('ranks by tiles found, then by who finished first', () => {
    const cars = [
      { carId: 'a', name: 'A', card: card([0, 1]) },
      { carId: 'b', name: 'B', card: card([0, 1, 2, 3, 4, 5, 6, 7, 8]), completedAt: '2026-10-21T10:05:00Z' },
      { carId: 'c', name: 'C', card: card([0, 1, 2, 3, 4, 5, 6, 7, 8]), completedAt: '2026-10-21T10:01:00Z' },
    ];
    expect(standings(cars).map((s) => s.carId)).toEqual(['c', 'b', 'a']);
    expect(foundCount(cars[0].card)).toBe(2);
  });
});

describe('dealCards', () => {
  const pool = ['cow', 'sheep', 'horse', 'tractor', 'bus', 'church', 'bridge', 'windmill', 'castle', 'pylon', 'river'];

  it('gives every car nine different items from the pool', () => {
    const cards = dealCards(pool, ['a', 'b'], seeded(7));
    expect(cards).toHaveLength(2);
    for (const c of cards) {
      expect(c.tiles).toHaveLength(TILES_PER_CARD);
      expect(new Set(c.tiles.map((t) => t.label)).size).toBe(TILES_PER_CARD);
      for (const t of c.tiles) expect(pool).toContain(t.label);
    }
  });

  it('does not deal two identical cards when the pool allows otherwise', () => {
    const [a, b] = dealCards(pool, ['a', 'b'], seeded(3));
    expect(a.tiles.map((t) => t.label)).not.toEqual(b.tiles.map((t) => t.label));
  });

  it('deals nothing from a pool too small for a card, counting duplicates once', () => {
    expect(dealCards(['cow', 'cow', 'sheep'], ['a'])).toEqual([]);
  });

  it('shuffle keeps every item exactly once', () => {
    expect(shuffle(pool, seeded(9)).sort()).toEqual([...pool].sort());
  });
});
