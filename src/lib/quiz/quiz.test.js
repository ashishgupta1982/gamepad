import { describe, expect, it } from 'vitest';
import { CATEGORIES, MAX_TOPICS, cleanCustomCategory, fromLegacy, normaliseCustomList, pickName, surprisePicks, togglePick, topicsFor } from './catalogue';
import { acceptQuestions, balancePositions, checkQuestion, fingerprint, shuffleOptions } from './questions';
import {
  addPlayer, addQuestions, allAnswered, answer, createGame, due, finish, judge, next, reveal, standings, start, tick, toScores,
  GRACE_MS, REVEAL_MS, SCORES_MS,
} from './machine';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
let n = 0;
const makeId = () => `c_test${String(++n).padStart(4, '0')}`;

const q = (i, correct = 0) => ({ id: `q${i}`, question: `Question ${i}?`, options: ['A', 'B', 'C', 'D'], correctAnswer: correct, category: 'x', explanation: '' });
const players = [
  { id: 'p1', name: 'Asha' },
  { id: 'p2', name: 'Ben' },
];

describe('custom categories', () => {
  it('reads the old "Name: description" strings, colons in the description and all', () => {
    expect(fromLegacy('custom:Harry Potter: the books, not the films: really', makeId)).toMatchObject({
      name: 'Harry Potter',
      description: 'the books, not the films: really',
    });
    expect(fromLegacy('Dinosaurs', makeId)).toMatchObject({ name: 'Dinosaurs', description: '' });
  });

  it('keeps an id on edit, drops nameless ones, de-duplicates by name', () => {
    expect(cleanCustomCategory({ id: 'c_keepme123', name: ' Space ' }, makeId).id).toBe('c_keepme123');
    expect(cleanCustomCategory({ name: '   ' }, makeId)).toBeNull();
    expect(normaliseCustomList(['Space', { name: 'space' }, 'Trains: steam'], makeId).map((c) => c.name)).toEqual(['Space', 'Trains']);
  });

  it('turns a game’s picks into topics, built-in and custom', () => {
    const custom = [{ id: 'c_trains0001', name: 'Trains', description: 'steam engines' }];
    expect(topicsFor(['geography', 'c_trains0001', 'nonsense'], custom)).toEqual([
      expect.objectContaining({ name: 'Geography' }),
      { name: 'Trains', brief: 'steam engines' },
    ]);
    expect(topicsFor([])).toEqual([expect.objectContaining({ name: 'Mixed bag' })]);
    expect(topicsFor(['group:sport'])).toEqual([{ name: 'Sport', brief: 'a mix of Football, Olympics, Sport Mix, Formula 1, Sporting Legends, Which Sport?' }]);
  });

  it('names every pick, and keeps category ids unique', () => {
    expect(pickName('group:big-worlds')).toBe('Big Worlds');
    expect(pickName('dinosaurs')).toBe('Dinosaurs');
    expect(pickName({ id: 'c_trains0001', name: 'Trains' })).toBe('Trains');
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(41);
  });

  it('picks: Mixed bag alone, whole groups, and one category out of a group', () => {
    expect(togglePick(['mixed'], 'space')).toEqual(['space']);
    expect(togglePick(['space', 'football'], 'mixed')).toEqual(['mixed']);
    expect(togglePick(['space'], 'space')).toEqual(['mixed']);
    // A whole group replaces its categories.
    expect(togglePick(['space', 'football'], 'group:science')).toEqual(['football', 'group:science']);
    // One category off a picked group leaves the rest.
    expect(togglePick(['group:sport'], 'olympics')).toEqual(['football', 'sport-mix', 'formula-1', 'sporting-legends', 'which-sport']);
    // Every category of a group, one by one, becomes the group.
    expect(togglePick(['football', 'olympics', 'sport-mix', 'formula-1', 'sporting-legends'], 'which-sport')).toEqual(['group:sport']);
    // Over the limit, nothing changes.
    const full = ['films', 'tv', 'music', 'space', 'football', 'dinosaurs', 'animals', 'tv-x'].slice(0, MAX_TOPICS);
    expect(togglePick(full, 'marvel')).toBe(full);
    // Custom categories are objects.
    const trains = { id: 'c_trains0001', name: 'Trains' };
    expect(togglePick(['mixed'], trains)).toEqual([trains]);
  });

  it('Surprise me picks three categories from three groups', () => {
    let seed = 0.37;
    const random = () => (seed = (seed * 9301 + 0.49297) % 1);
    const picks = surprisePicks(random);
    expect(picks).toHaveLength(3);
    const groups = picks.map((id) => CATEGORIES.find((c) => c.id === id)?.group);
    expect(groups.every(Boolean)).toBe(true);
    expect(new Set(groups).size).toBe(3);
  });
});

describe('questions from the writer', () => {
  it('accepts an answer given as text or as an index', () => {
    expect(checkQuestion({ question: 'Capital of France?', options: ['Paris', 'Rome', 'Oslo', 'Bern'], answer: 'paris' }).correctAnswer).toBe(0);
    expect(checkQuestion({ question: 'x?', options: ['a', 'b', 'c', 'd'], answer: 2 }).correctAnswer).toBe(2);
  });

  it('rejects three options, repeated options, or an answer that is not an option', () => {
    expect(checkQuestion({ question: 'x?', options: ['a', 'b', 'c'], answer: 'a' })).toBeNull();
    expect(checkQuestion({ question: 'x?', options: ['a', 'A', 'c', 'd'], answer: 'a' })).toBeNull();
    expect(checkQuestion({ question: 'x?', options: ['a', 'b', 'c', 'd'], answer: 'e' })).toBeNull();
  });

  it('shuffling moves the answer with its text', () => {
    const s = shuffleOptions({ question: 'x', options: ['right', 'w1', 'w2', 'w3'], correctAnswer: 0 }, seeded(5));
    expect(s.options[s.correctAnswer]).toBe('right');
    expect([...s.options].sort()).toEqual(['right', 'w1', 'w2', 'w3']);
  });

  it('drops repeats within a batch and against what was played before, up to the count', () => {
    const raw = [
      { question: 'What is 2+2?', options: ['4', '3', '5', '6'], answer: '4' },
      { question: 'what is 2 + 2', options: ['4', '3', '5', '6'], answer: '4' },
      { question: 'Old one?', options: ['a', 'b', 'c', 'd'], answer: 'a' },
      { question: 'New one?', options: ['a', 'b', 'c', 'd'], answer: 'a' },
      { question: 'Another?', options: ['a', 'b', 'c', 'd'], answer: 'a' },
    ];
    const out = acceptQuestions(raw, { count: 2, avoid: [fingerprint('Old one?')], random: seeded(2) });
    expect(out.map((x) => x.question)).toEqual(['What is 2+2?', 'New one?']);
    expect(out[0].id).toBe(fingerprint('What is 2+2?'));
  });

  it('spreads the right answer across the four positions', () => {
    const qs = Array.from({ length: 12 }, (_, i) => ({ question: `q${i}`, options: [`r${i}`, 'b', 'c', 'd'], correctAnswer: 0 }));
    const out = balancePositions(qs, seeded(3));
    const counts = [0, 0, 0, 0];
    out.forEach((x, i) => {
      counts[x.correctAnswer] += 1;
      expect(x.options[x.correctAnswer]).toBe(`r${i}`);
    });
    expect(counts).toEqual([3, 3, 3, 3]);
  });
});

describe('a solo game', () => {
  const t0 = 1_000_000;
  const game = () => start(createGame({ mode: 'solo', settings: { count: 2, timer: 10 }, players: [players[0]], questions: [q(0, 1), q(1, 2)] }), t0);

  it('opens the first question with a deadline', () => {
    const g = game();
    expect(g).toMatchObject({ phase: 'question', index: 0, startedAt: t0, endsAt: t0 + 10_000 });
  });

  it('scores a quick right answer near full points, and reveals at once', () => {
    let g = answer(game(), 'p1', 1, t0 + 1000);
    expect(due(g, t0 + 1000)).toBe('reveal');
    g = reveal(g, t0 + 1000);
    expect(g.players[0].score).toBe(950);
    expect(g.players[0].answers[0]).toMatchObject({ correct: true, points: 950 });
  });

  it('ignores a second answer, a late answer, and a nonsense option', () => {
    let g = answer(game(), 'p1', 0, t0 + 500);
    expect(answer(g, 'p1', 1, t0 + 600)).toBe(g);
    expect(answer(game(), 'p1', 1, t0 + 10_000 + GRACE_MS + 1).players[0].answers[0]).toBeUndefined();
    expect(answer(game(), 'p1', 7, t0)).toEqual(game());
  });

  it('runs itself to the end on the clock, skipping the scores screen', () => {
    let g = game();
    g = tick(g, t0 + 10_000 + REVEAL_MS + 10_000 + REVEAL_MS + 5);
    expect(g.phase).toBe('finished');
    expect(g.players[0].score).toBe(0);
    expect(g.players[0].answers[1]).toMatchObject({ correct: false, option: null });
  });
});

describe('a shout game', () => {
  const t0 = 5_000_000;
  const game = () => start(createGame({ mode: 'shout', settings: { count: 2, timer: 20 }, players, questions: [q(0), q(1)] }), t0);

  it('takes no answers on the device and waits at the reveal for the quizmaster', () => {
    let g = game();
    expect(answer(g, 'p1', 0, t0)).toBe(g);
    expect(allAnswered(g)).toBe(false);
    g = tick(g, t0 + 60_000);
    expect(g.phase).toBe('reveal');
    expect(toScores(g, t0 + 60_000)).toBe(g);
  });

  it('scores whoever the quizmaster taps, full points, and keeps their streak', () => {
    let g = reveal(game(), t0 + 5000);
    g = judge(g, ['p2'], t0 + 6000);
    expect(g.phase).toBe('scores');
    expect(g.players.map((p) => p.score)).toEqual([0, 1000]);
    g = next(g, t0 + 7000);
    g = judge(reveal(g, t0 + 8000), ['p2'], t0 + 9000);
    expect(g.players[1]).toMatchObject({ score: 2100, streak: 2, best: 2 });
    expect(judge(g, ['p1'], t0 + 9500)).toBe(g);
  });
});

describe('a multi-phone game', () => {
  const t0 = 9_000_000;

  it('lets players join before the start only, and a rejoin is not a second player', () => {
    let g = createGame({ mode: 'multi', settings: { count: 1, timer: 20 }, questions: [q(0)] });
    g = addPlayer(addPlayer(addPlayer(g, players[0]), players[1]), players[0]);
    expect(g.players).toHaveLength(2);
    g = start(g, t0);
    expect(addPlayer(g, { id: 'p3', name: 'Late' }).players).toHaveLength(2);
  });

  it('reveals as soon as everyone has answered, then scores, then finishes', () => {
    let g = start(createGame({ mode: 'multi', settings: { count: 1, timer: 20 }, players, questions: [q(0, 3)] }), t0);
    g = answer(g, 'p1', 3, t0 + 2000);
    expect(due(g, t0 + 2000)).toBeNull();
    g = answer(g, 'p2', 0, t0 + 4000);
    g = tick(g, t0 + 4000);
    expect(g.phase).toBe('reveal');
    expect(g.players.map((p) => p.score)).toEqual([950, 0]);
    g = tick(g, t0 + 4000 + REVEAL_MS + SCORES_MS);
    expect(g.phase).toBe('finished');
  });

  it('waits for the writer when the next question has not arrived, and carries on when it does', () => {
    let g = start(createGame({ mode: 'multi', settings: { count: 2, timer: 10 }, players: [players[0]], questions: [q(0)] }), t0);
    g = tick(g, t0 + 10_000 + REVEAL_MS + SCORES_MS);
    expect(g.phase).toBe('loading');
    g = addQuestions(g, [q(0), q(1)], t0 + 30_000);
    expect(g).toMatchObject({ phase: 'question', index: 1, startedAt: t0 + 30_000 });
    expect(g.questions).toHaveLength(2);
  });
});

describe('standings', () => {
  it('shares a place on a tie', () => {
    let g = createGame({ mode: 'shout', settings: { count: 1 }, players: [...players, { id: 'p3', name: 'Cat' }], questions: [q(0)] });
    g = judge(reveal(start(g, 0), 1), ['p1', 'p2'], 2);
    expect(standings(finish(g, 3)).map((p) => [p.name, p.place])).toEqual([['Asha', 1], ['Ben', 1], ['Cat', 3]]);
  });
});
