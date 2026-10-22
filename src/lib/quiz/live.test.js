import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/mongodb', () => ({ default: async () => {} }));

import { answer, createGame, reveal, start } from './machine';
import { project } from './live';

const q = (i) => ({ id: `q${i}`, question: `Q${i}?`, options: ['a', 'b', 'c', 'd'], correctAnswer: 2, category: 'x', explanation: 'because' });

describe('what a phone is sent', () => {
  const t0 = 1000;
  const base = () =>
    start(
      createGame({ mode: 'multi', settings: { count: 3, timer: 20 }, players: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }], questions: [q(0), q(1), q(2)] }),
      t0,
    );

  it('never the answer, the explanation or the questions to come while a question is open', () => {
    const out = project({ game: base() });
    expect(out.questions).toHaveLength(1);
    expect(out.questions[0]).toMatchObject({ question: 'Q0?', correctAnswer: null, explanation: '' });
    expect(out.questionsReady).toBe(3);
  });

  it('only that another player has answered, not what they picked; your own pick in full', () => {
    const g = answer(answer(base(), 'p1', 2, t0 + 500), 'p2', 1, t0 + 900);
    const forP1 = project({ game: g }, { playerId: 'p1' });
    expect(forP1.players[0].answers[0]).toMatchObject({ option: 2 });
    expect(forP1.players[1].answers[0]).toEqual({ answered: true });
  });

  it('everything once the answer is revealed', () => {
    const g = reveal(answer(base(), 'p2', 1, t0 + 900), t0 + 2000);
    const out = project({ game: g }, { playerId: 'p1' });
    expect(out.questions[0]).toMatchObject({ correctAnswer: 2, explanation: 'because' });
    expect(out.players[1].answers[0]).toMatchObject({ option: 1, correct: false });
  });

  it("a close-up's whole picture only once the answer is revealed", () => {
    const zoomed = { kind: 'image', src: 'https://x/near.jpg', reveal: 'https://x/whole.jpg' };
    const g = start(createGame({ mode: 'multi', settings: { count: 1, timer: 20 }, players: [{ id: 'p1', name: 'A' }], questions: [{ ...q(0), media: zoomed }] }), t0);
    expect(project({ game: g }).questions[0].media).toEqual({ kind: 'image', src: 'https://x/near.jpg', reveal: undefined });
    expect(project({ game: reveal(g, t0 + 2000) }).questions[0].media.reveal).toBe('https://x/whole.jpg');
  });
});
