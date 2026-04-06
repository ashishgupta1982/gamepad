import { useCallback } from 'react';
import { SCORING } from '@/data/quizConstants';

export default function useQuizScoring() {
  const calculatePoints = useCallback((correct, timeMs, totalTimeMs, currentStreak) => {
    if (!correct) return { points: 0, streak: 0 };

    const speedMultiplier = 1.0 - ((timeMs / totalTimeMs) * SCORING.SPEED_WEIGHT);
    const streakMultiplier = Math.min(
      1.0 + (currentStreak * SCORING.STREAK_BONUS),
      SCORING.MAX_STREAK_MULTIPLIER
    );

    const points = Math.round(SCORING.BASE_POINTS * speedMultiplier * streakMultiplier);
    return { points, streak: currentStreak + 1 };
  }, []);

  const calculateClassicPoints = useCallback((correct) => {
    return { points: correct ? 1 : 0, streak: correct ? 1 : 0 };
  }, []);

  return { calculatePoints, calculateClassicPoints };
}
