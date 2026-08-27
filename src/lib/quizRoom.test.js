import { describe, it, expect } from 'vitest';
import {
  ROOM_STATUSES,
  canTransition,
  nextStatus,
  allAnswered,
  canAnswer,
} from './quizRoom';

// The multi-device quiz room is the one piece of GamePad with enough moving
// parts to break quietly, and the SSE stream depends on it. These tests were
// written against the behaviour as it stood BEFORE the quiz reskin, so they
// describe what the game already did rather than what the redesign left behind.

const room = (over = {}) => ({
  status: 'question',
  currentQuestionIndex: 0,
  questions: [{ correctAnswer: 0 }, { correctAnswer: 1 }],
  players: [
    { id: 'a', answers: [] },
    { id: 'b', answers: [] },
  ],
  ...over,
});

describe('room statuses', () => {
  it('matches the enum on the model', () => {
    // If the model gains a status and this list does not, the machine will
    // reject a state the database happily stores.
    expect(ROOM_STATUSES).toEqual([
      'lobby',
      'playing',
      'question',
      'reveal',
      'scores',
      'finished',
    ]);
  });
});

describe('canTransition', () => {
  it('allows the normal round trip', () => {
    expect(canTransition('lobby', 'question')).toBe(true);
    expect(canTransition('question', 'reveal')).toBe(true);
    expect(canTransition('reveal', 'scores')).toBe(true);
    expect(canTransition('scores', 'question')).toBe(true);
  });

  it('lets any live state be abandoned to finished', () => {
    ['lobby', 'playing', 'question', 'reveal', 'scores'].forEach((from) => {
      expect(canTransition(from, 'finished')).toBe(true);
    });
  });

  it('treats finished as terminal', () => {
    ROOM_STATUSES.forEach((to) => {
      expect(canTransition('finished', to)).toBe(false);
    });
  });

  it('rejects skipping the reveal', () => {
    // Going straight from question to scores would show a leaderboard before
    // anyone had seen the right answer.
    expect(canTransition('question', 'scores')).toBe(false);
  });

  it('rejects going backwards', () => {
    expect(canTransition('reveal', 'question')).toBe(false);
    expect(canTransition('scores', 'reveal')).toBe(false);
    expect(canTransition('question', 'lobby')).toBe(false);
  });

  it('rejects unknown statuses rather than throwing', () => {
    expect(canTransition('nonsense', 'question')).toBe(false);
    expect(canTransition('question', 'nonsense')).toBe(false);
  });
});

describe('nextStatus', () => {
  it('starts the first question from the lobby', () => {
    expect(nextStatus(room({ status: 'lobby' }))).toBe('question');
  });

  it('will not start a quiz with no questions', () => {
    expect(nextStatus(room({ status: 'lobby', questions: [] }))).toBe(null);
  });

  it('moves a legacy playing room on rather than stranding it', () => {
    expect(nextStatus(room({ status: 'playing' }))).toBe('question');
  });

  it('goes question -> reveal -> scores', () => {
    expect(nextStatus(room({ status: 'question' }))).toBe('reveal');
    expect(nextStatus(room({ status: 'reveal' }))).toBe('scores');
  });

  it('loops back for another question when one is left', () => {
    expect(nextStatus(room({ status: 'scores', currentQuestionIndex: 0 }))).toBe('question');
  });

  it('finishes after the last question', () => {
    expect(nextStatus(room({ status: 'scores', currentQuestionIndex: 1 }))).toBe('finished');
  });

  it('returns null from finished', () => {
    expect(nextStatus(room({ status: 'finished' }))).toBe(null);
  });
});

describe('allAnswered', () => {
  it('is false while anyone is still deciding', () => {
    expect(
      allAnswered(
        room({
          players: [
            { id: 'a', answers: [{ questionIndex: 0 }] },
            { id: 'b', answers: [] },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('is true once everyone has answered this question', () => {
    expect(
      allAnswered(
        room({
          players: [
            { id: 'a', answers: [{ questionIndex: 0 }] },
            { id: 'b', answers: [{ questionIndex: 0 }] },
          ],
        }),
      ),
    ).toBe(true);
  });

  it('ignores answers to earlier questions', () => {
    // The bug this guards: counting any answer at all would auto-advance the
    // room the moment question two opened, because everyone had answered one.
    expect(
      allAnswered(
        room({
          currentQuestionIndex: 1,
          players: [
            { id: 'a', answers: [{ questionIndex: 0 }] },
            { id: 'b', answers: [{ questionIndex: 0 }] },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('is false for an empty room', () => {
    expect(allAnswered(room({ players: [] }))).toBe(false);
  });
});

describe('canAnswer', () => {
  it('allows a known player during the question phase', () => {
    expect(canAnswer(room(), 'a')).toBe(true);
  });

  it('refuses outside the question phase', () => {
    ['lobby', 'reveal', 'scores', 'finished'].forEach((status) => {
      expect(canAnswer(room({ status }), 'a')).toBe(false);
    });
  });

  it('refuses a player who is not in the room', () => {
    expect(canAnswer(room(), 'nobody')).toBe(false);
  });

  it('refuses a second answer to the same question', () => {
    expect(
      canAnswer(
        room({ players: [{ id: 'a', answers: [{ questionIndex: 0 }] }] }),
        'a',
      ),
    ).toBe(false);
  });

  it('allows the same player to answer the next question', () => {
    expect(
      canAnswer(
        room({
          currentQuestionIndex: 1,
          players: [{ id: 'a', answers: [{ questionIndex: 0 }] }],
        }),
        'a',
      ),
    ).toBe(true);
  });
});
