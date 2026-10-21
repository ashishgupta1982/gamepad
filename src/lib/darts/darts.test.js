import { describe, expect, it } from 'vitest';
import { hitAt, label, parse, RINGS } from './board';
import { checkoutRoute } from './checkout';
import { endTurn, enterTotal, newMatch, replay, throwDart, undo } from './rules';

const P = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));
const D = (text) => (text === 'miss' ? { n: 0, m: 0 } : parse(text));
const play = (match, ...darts) => darts.reduce((m, d) => (typeof d === 'number' ? enterTotal(m, d) : throwDart(m, D(d))), match);

describe('the board', () => {
  it('finds the segment and ring under a finger', () => {
    expect(hitAt(0, -(RINGS.treble - 5))).toEqual({ n: 20, m: 3 });
    expect(hitAt(0, RINGS.double - 5)).toEqual({ n: 3, m: 2 });
    expect(hitAt(RINGS.innerSingle - 10, 0)).toEqual({ n: 6, m: 1 });
    expect(hitAt(0, 0)).toEqual({ n: 25, m: 2 });
    expect(hitAt(0, -(RINGS.outerBull - 2))).toEqual({ n: 25, m: 1 });
    expect(hitAt(0, -190)).toBeNull();
  });
  it('writes darts the way players say them', () => {
    expect(['T20', 'D16', 'S5', 'BULL', '25'].map((t) => label(parse(t)))).toEqual(['T20', 'D16', 'S5', 'BULL', '25']);
  });
});

describe('checkout routes', () => {
  it('uses the chart with three darts', () => {
    expect(checkoutRoute(170)).toEqual(['T20', 'T20', 'BULL']);
    expect(checkoutRoute(169)).toBeNull();
    expect(checkoutRoute(171)).toBeNull();
  });
  it('fits the darts that are left', () => {
    expect(checkoutRoute(100, 2)).toEqual(['T20', 'D20']);
    expect(checkoutRoute(99, 2)).toBeNull(); // 99 needs three
    expect(checkoutRoute(40, 1)).toEqual(['D20']);
    expect(checkoutRoute(41, 1)).toBeNull();
    expect(checkoutRoute(50, 1)).toEqual(['BULL']);
  });
  it('finishes on anything without double-out', () => {
    expect(checkoutRoute(57, 1, false)).toEqual(['T19']);
    expect(checkoutRoute(1, 1, false)).toEqual(['S1']);
  });
});

describe('X01', () => {
  const m = (settings = {}) => newMatch({ mode: 'x01', players: P(2), settings: { start: 101, ...settings } });

  it('takes three darts a visit and passes the throw', () => {
    const s = replay(play(m(), 'T20', 'S1', 'S5'));
    expect(s.remaining).toEqual([35, 101]);
    expect(s.current).toBe(1);
    expect(s.visits[0]).toMatchObject({ player: 0, total: 66 });
  });

  it('busts below zero, on one, and on a non-double finish, and puts the score back', () => {
    expect(replay(play(m(), 'T20', 'T20')).remaining[0]).toBe(101); // 101-120
    const onOne = replay(play(m(), 'T20', 'D20')); // leaves 1
    expect(onOne.remaining[0]).toBe(101);
    expect(onOne.visits[0].bust).toBe(true);
    const single = replay(play(m(), 'T20', 'S1', 'miss', 'miss', 'miss', 'miss', 'S20', 'S20'));
    expect(single.remaining[0]).toBe(40);
    expect(single.current).toBe(1); // 40 then S20 twice = 0 on a single: bust, turn over
  });

  it('wins on a double, and undo takes the winning dart back', () => {
    const won = play(m(), 'T20', 'S1', 'miss', 'miss', 'miss', 'miss', 'D20');
    const s = replay(won);
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(0);
    expect(s.standings[0]).toEqual({ index: 0, place: 1 });
    const back = replay(undo(won));
    expect(back.finished).toBe(false);
    expect(back.remaining[0]).toBe(40);
  });

  it('plays legs, rotating who throws first', () => {
    const match = m({ legs: 3 });
    const leg1 = play(match, 'T20', 'S1', 'miss', 'miss', 'miss', 'miss', 'D20');
    const s = replay(leg1);
    expect(s.finished).toBe(false);
    expect(s.legsWon).toEqual([1, 0]);
    expect(s.leg).toBe(2);
    expect(s.current).toBe(1);
    expect(s.remaining).toEqual([101, 101]);
    expect(replay(undo(leg1)).leg).toBe(1); // undo across a leg
  });

  it('counts nothing until a double with double-in', () => {
    const s = replay(play(m({ doubleIn: true }), 'T20', 'D10', 'S5'));
    expect(s.remaining[0]).toBe(76);
  });

  it('takes a typed total as a whole visit, at the start of one only', () => {
    let match = play(m(), 60);
    expect(replay(match).remaining[0]).toBe(41);
    match = play(match, 'S1');
    expect(enterTotal(match, 40)).toBe(match);
  });

  it('ends a visit early with misses', () => {
    const s = replay(endTurn(play(m(), 'T20')));
    expect(s.current).toBe(1);
    expect(s.stats[0].darts).toBe(3);
  });

  it('keeps averages, tons and 180s', () => {
    const match = newMatch({ mode: 'x01', players: P(1), settings: { start: 501 } });
    const s = replay(play(match, 'T20', 'T20', 'T20', 'T20', 'T20', 'S20'));
    expect(s.stats[0]).toMatchObject({ points: 320, darts: 6, max: 1, tons: 2, best: 180 });
  });
});

describe('Cricket', () => {
  const m = () => newMatch({ mode: 'cricket', players: P(2) });
  it('closes on three marks and scores on the extra while it is open', () => {
    const s = replay(play(m(), 'T20', 'D20', 'S7'));
    expect(s.marks[0][0]).toBe(3);
    expect(s.points[0]).toBe(40);
  });
  it('stops scoring once everyone has closed it', () => {
    const s = replay(play(m(), 'T20', 'miss', 'miss', 'T20', 'miss', 'miss', 'S20'));
    expect(s.points).toEqual([0, 0]);
  });
  it('wins on every number closed with the points ahead', () => {
    const closeAll = ['T20', 'T19', 'T18', 'miss', 'miss', 'miss', 'T17', 'T16', 'T15', 'miss', 'miss', 'miss', 'BULL', '25'];
    const s = replay(play(m(), ...closeAll));
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(0);
  });
});

describe('Around the Clock', () => {
  it('moves on one number per hit, any ring, and finishes on the bull', () => {
    const match = newMatch({ mode: 'around-the-clock', players: P(1) });
    let mm = play(match, 'S1', 'T2', 'S4');
    expect(replay(mm).target[0]).toBe(2);
    const darts = [];
    for (let k = 3; k <= 20; k++) darts.push(`S${k}`);
    mm = play(mm, ...darts, '25');
    expect(replay(mm).finished).toBe(true);
  });
});

describe('Killer', () => {
  const m = () => newMatch({ mode: 'killer', players: P(3), settings: { lives: 2, numbers: [5, 10, 15] } });
  it('needs your own double first, then takes lives with others', () => {
    let s = replay(play(m(), 'D10', 'D5', 'D10'));
    expect(s.killer[0]).toBe(true);
    expect(s.lives).toEqual([2, 1, 2]); // the first D10 did nothing
  });
  it('skips players who are out and crowns the last one standing', () => {
    const match = play(m(), 'D5', 'D10', 'D10', 'miss', 'miss', 'miss', 'D15', 'D15');
    const s = replay(match);
    expect(s.alive).toEqual([true, false, false]);
    expect(s.finished).toBe(true);
    expect(s.winner).toBe(0);
    expect(s.standings.map((r) => r.index)).toEqual([0, 2, 1]);
  });
});
