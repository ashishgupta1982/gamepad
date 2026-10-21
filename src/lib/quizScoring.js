// The numbers, here with the formula since the old quiz's constants file went
// in the 2026-10-21 rebuild.
export const SCORING = {
  BASE_POINTS: 1000,
  SPEED_WEIGHT: 0.5, // up to half the points lost for using the whole clock
  STREAK_BONUS: 0.1, // 10% more per consecutive right answer
  MAX_STREAK_MULTIPLIER: 1.5,
  NO_ANSWER_POINTS: 0,
};

// The scoring formula, in one place.
//
// It existed twice: once in hooks/useQuizScoring.js for same-device play, and
// again inline in api/quiz/rooms/[roomCode]/answer.js for multi-device. The two
// were identical, which is the problem — nothing kept them that way, and a
// tuning change to one would have silently made the same quiz score differently
// depending on how it was being played.
//
// Points are speed-weighted and streak-multiplied:
//   speed  — answering instantly is worth full marks, and using the whole timer
//            costs SPEED_WEIGHT (currently half) of the base
//   streak — each consecutive correct answer adds STREAK_BONUS, capped at
//            MAX_STREAK_MULTIPLIER so a long run cannot run away with the game

/**
 * @param {boolean} correct
 * @param {number} timeMs        how long the player took
 * @param {number} totalTimeMs   the question's time limit
 * @param {number} currentStreak consecutive correct answers BEFORE this one
 * @returns {{points: number, streak: number}}
 */
export function scoreAnswer(correct, timeMs, totalTimeMs, currentStreak = 0) {
  if (!correct) return { points: SCORING.NO_ANSWER_POINTS, streak: 0 };

  // Guard the divisor. A room with timePerQuestion of 0 would otherwise make
  // this Infinity and the score NaN, which would then be written to the DB and
  // poison every later total.
  const limit = totalTimeMs > 0 ? totalTimeMs : 1;

  // Clamp the ratio. An answer that arrives after the timer (a slow network, a
  // clock skew between devices) would otherwise push the multiplier negative
  // and award negative points for a correct answer.
  const ratio = Math.min(Math.max(timeMs / limit, 0), 1);

  const speedMultiplier = 1 - ratio * SCORING.SPEED_WEIGHT;
  const streakMultiplier = Math.min(
    1 + currentStreak * SCORING.STREAK_BONUS,
    SCORING.MAX_STREAK_MULTIPLIER,
  );

  return {
    points: Math.round(SCORING.BASE_POINTS * speedMultiplier * streakMultiplier),
    streak: currentStreak + 1,
  };
}

// Classic mode: one point per correct answer, no speed, no streak.
export function scoreClassic(correct) {
  return { points: correct ? 1 : 0, streak: correct ? 1 : 0 };
}
