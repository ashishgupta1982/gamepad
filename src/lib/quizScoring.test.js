import { describe, it, expect } from 'vitest';
import { scoreAnswer, scoreClassic } from './quizScoring';
import { SCORING } from '@/data/quizConstants';

// Pins the formula that was duplicated between hooks/useQuizScoring.js and the
// answer API route. The numbers below are what BOTH copies already produced, so
// these tests hold the extraction honest: the same quiz must score identically
// whether it is played on one phone or several.

describe('scoreAnswer', () => {
  it('gives nothing for a wrong answer and breaks the streak', () => {
    expect(scoreAnswer(false, 1000, 20000, 5)).toEqual({ points: 0, streak: 0 });
  });

  it('gives full base points for an instant first answer', () => {
    expect(scoreAnswer(true, 0, 20000, 0)).toEqual({
      points: SCORING.BASE_POINTS,
      streak: 1,
    });
  });

  it('takes the full speed penalty when the timer runs out', () => {
    // 1 - (1 * 0.5) = 0.5 of base.
    expect(scoreAnswer(true, 20000, 20000, 0).points).toBe(
      Math.round(SCORING.BASE_POINTS * (1 - SCORING.SPEED_WEIGHT)),
    );
  });

  it('scales the penalty with time taken', () => {
    // Half the timer used -> 1 - (0.5 * 0.5) = 0.75 of base.
    expect(scoreAnswer(true, 10000, 20000, 0).points).toBe(750);
  });

  it('adds the streak bonus', () => {
    // Instant answer on a streak of 3 -> 1000 * 1 * 1.3
    expect(scoreAnswer(true, 0, 20000, 3).points).toBe(1300);
  });

  it('caps the streak multiplier', () => {
    // A streak of 20 would be 3x uncapped; MAX_STREAK_MULTIPLIER holds it.
    expect(scoreAnswer(true, 0, 20000, 20).points).toBe(
      Math.round(SCORING.BASE_POINTS * SCORING.MAX_STREAK_MULTIPLIER),
    );
  });

  it('increments the streak it was given', () => {
    expect(scoreAnswer(true, 0, 20000, 4).streak).toBe(5);
  });

  // ─── Guards added during the extraction ─────────────────────────────────
  //
  // Neither original copy had these. They are the cases that would have
  // written a nonsense number into the database, where it would then be added
  // to a running total and be very hard to trace back.

  it('never awards negative points for a late answer', () => {
    // An answer arriving after the timer — slow network, or two devices whose
    // clocks disagree — drove the multiplier negative in both originals.
    const { points } = scoreAnswer(true, 60000, 20000, 0);
    expect(points).toBeGreaterThanOrEqual(0);
    expect(points).toBe(Math.round(SCORING.BASE_POINTS * (1 - SCORING.SPEED_WEIGHT)));
  });

  it('does not produce NaN when the question has no time limit', () => {
    // timePerQuestion of 0 made this divide by zero, and NaN then propagated
    // into the player's score and every total after it.
    const { points } = scoreAnswer(true, 5000, 0, 0);
    expect(Number.isNaN(points)).toBe(false);
  });

  it('handles a negative elapsed time without inflating the score', () => {
    expect(scoreAnswer(true, -5000, 20000, 0).points).toBe(SCORING.BASE_POINTS);
  });
});

describe('scoreClassic', () => {
  it('is one point per correct answer', () => {
    expect(scoreClassic(true)).toEqual({ points: 1, streak: 1 });
    expect(scoreClassic(false)).toEqual({ points: 0, streak: 0 });
  });
});
