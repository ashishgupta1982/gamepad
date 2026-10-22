import { describe, expect, it } from 'vitest';
import { categoryTally, leaderboard, playerStats } from './stats';

const g = (players, extra = {}) => ({ id: Math.random().toString(36), at: '2026-10-22', mode: players.length > 1 ? 'multi' : 'solo', categories: ['Films', 'Music'], count: 10, players, ...extra });
const p = (name, place, correct, cats) => ({ name, place, correct, score: correct * 100, ...(cats ? { cats } : {}) });

describe('Your quizzes numbers', () => {
  it('tallies each player by category from the questions played', () => {
    const game = {
      index: 2,
      players: [{ id: 'a', answers: { 0: { correct: true }, 1: { correct: false }, 2: { correct: true } } }],
    };
    const qs = [{ category: 'Films' }, { category: 'Films' }, { category: 'Music' }];
    expect(categoryTally(game, qs)).toEqual({ a: { Films: [1, 2], Music: [1, 1] } });
  });

  it('adds up a player across games by name, wins only when playing with others', () => {
    const stats = playerStats([g([p('Anya', 1, 7), p('Dad', 2, 5)]), g([p(' anya ', 1, 9)]), g([p('Dad', 1, 8), p('Anya', 2, 6)])]);
    const anya = stats.find((s) => s.key === 'anya');
    expect(anya).toMatchObject({ games: 3, together: 2, wins: 1, asked: 30, right: 22, pct: 73 });
  });

  it('best and worst category need five questions, and an old one-category game still counts', () => {
    const stats = playerStats([
      g([p('Nik', 1, 4, { Films: [4, 5], Music: [1, 5], Space: [1, 1] })]),
      g([p('Nik', 1, 9)], { categories: ['Football'], count: 10 }),
    ]);
    expect(stats[0].best).toMatchObject({ name: 'Football', pct: 90 });
    expect(stats[0].worst).toMatchObject({ name: 'Music', pct: 20 });
  });

  it('ranks by wins, or by share right once a player has answered enough', () => {
    const stats = playerStats([g([p('A', 1, 9), p('B', 2, 2)]), g([p('A', 2, 3), p('B', 1, 4)]), g([p('A', 1, 8), p('C', 2, 1)])]);
    expect(leaderboard(stats, 'wins').map((s) => [s.name, s.place])).toEqual([['A', 1], ['B', 2], ['C', 3]]);
    expect(leaderboard(stats, 'pct').map((s) => s.name)).toEqual(['A', 'B']);
  });
});
