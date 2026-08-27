import { useCallback, useEffect, useRef, useState } from 'react';

// A countdown that moves the quiz on by itself.
//
// The quiz used to need three taps per question: Continue past the reveal,
// Continue past the points, Continue past the leaderboard. On a fast-paced game
// played round a table that is three interruptions a question, and whoever is
// holding the host device becomes a button operator rather than a player.
//
// Two things matter in how this is built:
//
//  - **Only one device runs the clock.** In multi-device play that is the host;
//    everyone else follows over SSE. Running a timer per device would let them
//    drift apart, and "everyone starts the next question together" is the whole
//    point of the change.
//  - **The countdown is visible.** A screen that advances on its own with no
//    warning feels broken rather than automatic; one that says "Next in 3" reads
//    as deliberate, and tells a slow reader exactly how long they have.
//
// `active` gates the whole thing, so a screen that is not on screen is not
// silently counting down in the background.
export default function useAutoAdvance({ active, seconds, onAdvance, enabled = true }) {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const onAdvanceRef = useRef(onAdvance);
  const firedRef = useRef(false);

  // Keep the callback fresh without restarting the countdown. Passing an inline
  // arrow from the render — which every call site does — would otherwise reset
  // the timer on every tick and it would never reach zero.
  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    if (!active || !enabled) {
      setSecondsLeft(seconds);
      firedRef.current = false;
      return undefined;
    }

    setSecondsLeft(seconds);
    firedRef.current = false;

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // Guard against a double fire if React re-runs the tick — advancing
          // twice would skip a question outright.
          if (!firedRef.current) {
            firedRef.current = true;
            onAdvanceRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [active, enabled, seconds]);

  // Let a caller cut the wait short without duplicating the fired-guard.
  const advanceNow = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setSecondsLeft(0);
    onAdvanceRef.current?.();
  }, []);

  return { secondsLeft, advanceNow };
}
