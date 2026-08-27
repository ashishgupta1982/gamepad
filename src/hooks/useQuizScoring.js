import { useCallback } from 'react';
import { scoreAnswer, scoreClassic } from '@/lib/quizScoring';

// Thin wrapper over lib/quizScoring so same-device play and multi-device play
// score identically. The formula used to live here in full and again inline in
// the answer API route — identical by coincidence, with nothing keeping them so.
export default function useQuizScoring() {
  const calculatePoints = useCallback(
    (correct, timeMs, totalTimeMs, currentStreak) =>
      scoreAnswer(correct, timeMs, totalTimeMs, currentStreak),
    [],
  );

  const calculateClassicPoints = useCallback((correct) => scoreClassic(correct), []);

  return { calculatePoints, calculateClassicPoints };
}
