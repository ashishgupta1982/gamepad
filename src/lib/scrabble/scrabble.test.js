import { describe, expect, it } from 'vitest';
import { addTurn, cleanWord, finish, isMatch, newMatch, pass, reopen, replay, summary, undo } from './rules';

const P = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
// Plays a list of turns: a number scores, 'pass' passes, [score, word, bingo] a fuller turn.
const play = (match, ...turns) =>
  turns.reduce((m, t) => {
    if (t === 'pass') return pass(m);
    if (Array.isArray(t)) return addTurn(m, { score: t[0], word: t[1], bingo: t[2] });
    return addTurn(m, { score: t });
  }, match);

describe('a match', () => {
  it('is a small object that passes isMatch', () => {
    const m = newMatch({ players: P(2) });
    expect(isMatch(m)).toBe(true);
    expect(m.log).toEqual([]);
    expect(m.finished).toBe(false);
    expect(isMatch(JSON.parse(JSON.stringify(m)))).toBe(true);
  });
  it('rejects old games and the wrong number of players', () => {
    expect(isMatch(null)).toBe(false);
    expect(isMatch({ players: [{ name: 'A', scores: [3] }] })).toBe(false);
    expect(isMatch({ ...newMatch({ players: P(2) }), v: 2 })).toBe(false);
    expect(isMatch({ ...newMatch({ players: P(2) }), players: P(1) })).toBe(false);
    expect(isMatch({ ...newMatch({ players: P(2) }), players: P(5) })).toBe(false);
  });
});

describe('turns', () => {
  it('go round the table in seat order', () => {
    const m = play(newMatch({ players: P(3) }), 10, 20, 30, 5);
    const s = replay(m);
    expect(m.log.map((t) => t.p)).toEqual([0, 1, 2, 0]);
    expect(s.totals).toEqual([15, 20, 30]);
    expect(s.current).toBe(1);
    expect(s.round).toBe(2);
    expect(s.turns[0].map((t) => t.round)).toEqual([1, 2]);
  });
  it('start from whoever goes first', () => {
    const m = play(newMatch({ players: P(3), first: 2 }), 10, 20);
    expect(m.log.map((t) => t.p)).toEqual([2, 0]);
    expect(replay(m).current).toBe(1);
    expect(replay(newMatch({ players: P(3), first: 7 })).current).toBe(0);
  });
  it('only take whole scores from 0 to 999', () => {
    const m = newMatch({ players: P(2) });
    for (const bad of [-1, 1000, 2.5, NaN, '12', null]) expect(addTurn(m, { score: bad })).toBe(m);
    expect(addTurn(m, { score: 0 }).log).toHaveLength(1);
    expect(addTurn(m, { score: 999 }).log[0].score).toBe(999);
  });
  it('keep the word in capitals, letters only', () => {
    const m = play(newMatch({ players: P(2) }), [24, ' qu-iz '], [8, '12'], [9, '']);
    expect(m.log.map((t) => t.word)).toEqual(['QUIZ', undefined, undefined]);
    expect(cleanWord('abcdefghijklmnop')).toBe('');
  });
  it('count a bingo only when it includes the 50', () => {
    const m = newMatch({ players: P(2) });
    expect(addTurn(m, { score: 40, bingo: true })).toBe(m);
    expect(addTurn(m, { score: 72, bingo: true }).log[0]).toEqual({ p: 0, score: 72, bingo: true });
  });
  it('pass for nothing', () => {
    const m = play(newMatch({ players: P(2) }), 'pass', 12);
    const s = replay(m);
    expect(s.totals).toEqual([0, 12]);
    expect(s.stats[0]).toMatchObject({ turns: 1, passes: 1, best: 0 });
  });
});

describe('undo', () => {
  it('takes back the last turn and hands the go back', () => {
    const m = play(newMatch({ players: P(2) }), 10, 20);
    const back = undo(m);
    expect(back.log).toEqual(m.log.slice(0, 1));
    expect(replay(back).current).toBe(1);
    expect(replay(back).totals).toEqual([10, 0]);
  });
  it('does nothing on an empty game or a finished one', () => {
    const m = newMatch({ players: P(2) });
    expect(undo(m)).toBe(m);
    const done = finish(play(m, 5));
    expect(undo(done)).toBe(done);
    expect(undo(reopen(done)).log).toEqual([]);
  });
});

describe('finishing', () => {
  it('stops any more turns until reopened', () => {
    const done = finish(play(newMatch({ players: P(2) }), 10));
    expect(done.finished).toBe(true);
    expect(addTurn(done, { score: 5 })).toBe(done);
    expect(pass(done)).toBe(done);
    expect(replay(done).finished).toBe(true);
    expect(addTurn(reopen(done), { score: 5 }).log).toHaveLength(2);
  });
});

describe('standings', () => {
  it('share places on a tie', () => {
    const s = replay(play(newMatch({ players: P(4) }), 40, 40, 10, 50));
    expect(s.standings.map((r) => [r.index, r.place])).toEqual([
      [3, 1],
      [0, 2],
      [1, 2],
      [2, 4],
    ]);
  });
  it('name a leader only when one player is ahead', () => {
    expect(replay(newMatch({ players: P(2) })).leader).toBeNull();
    expect(replay(play(newMatch({ players: P(2) }), 10, 10)).leader).toBeNull();
    expect(replay(play(newMatch({ players: P(2) }), 10, 11)).leader).toBe(1);
  });
});

describe('records and awards', () => {
  const game = () => play(newMatch({ players: P(3) }), [30, 'jinx'], [74, 'ratings', true], 12, [30, 'zoo'], [61, 'quartzy', true], 'pass');

  it('keep the best turn and the best word, first to reach a score keeping it', () => {
    const s = replay(game());
    expect(s.bestTurn).toMatchObject({ p: 1, score: 74, word: 'RATINGS' });
    expect(s.bestWord).toMatchObject({ p: 1, score: 74 });
    const early = replay(play(newMatch({ players: P(2) }), [30, 'jinx'], [30, 'zoo']));
    expect(early.bestWord.word).toBe('JINX');
  });
  it('find the best word among turns that have one', () => {
    const s = replay(play(newMatch({ players: P(2) }), 80, [20, 'cat']));
    expect(s.bestTurn.score).toBe(80);
    expect(s.bestWord).toMatchObject({ word: 'CAT', score: 20 });
  });
  it('hand out best word, biggest turn, most bingos and the wooden spoon', () => {
    const s = replay(game());
    const by = Object.fromEntries(s.awards.map((a) => [a.id, a]));
    expect(by.word.players).toEqual([1]);
    expect(by.word.text).toBe('RATINGS for 74');
    expect(by.turn.players).toEqual([1]);
    expect(by.bingo.players).toEqual([1]);
    expect(by.bingo.text).toMatch(/2 times/);
    expect(by.spoon.players).toEqual([2]);
  });
  it('share an award on a tie', () => {
    const s = replay(play(newMatch({ players: P(3) }), [60, 'a', true], [60, 'b', true], 5));
    expect(s.awards.find((a) => a.id === 'bingo').players).toEqual([0, 1]);
  });
  it('keep the wooden spoon for three or more, with someone behind', () => {
    const two = replay(play(newMatch({ players: P(2) }), 10, 5));
    expect(two.awards.some((a) => a.id === 'spoon')).toBe(false);
    const level = replay(play(newMatch({ players: P(3) }), 10, 10, 10));
    expect(level.awards.some((a) => a.id === 'spoon')).toBe(false);
    const joint = replay(play(newMatch({ players: P(4) }), 30, 5, 20, 5));
    expect(joint.awards.find((a) => a.id === 'spoon').players).toEqual([1, 3]);
  });
  it('give nothing for a game nobody scored in', () => {
    expect(replay(play(newMatch({ players: P(3) }), 'pass', 'pass')).awards).toEqual([]);
  });
});

describe('summary', () => {
  it('says the round and who leads', () => {
    expect(summary(newMatch({ players: P(2) }))).toBe('Round 1 · not started');
    expect(summary(play(newMatch({ players: P(2) }), 12, 30))).toBe('Round 2 · P1 leads 30');
    expect(summary(play(newMatch({ players: P(2) }), 12, 12))).toBe('Round 2 · level on 12');
  });
});
