import { BOGEY_NUMBERS, CHECKOUT_CHART, MAX_CHECKOUT } from '@/data/dartsConstants';
import { BULL, label, parse, value } from './board';

// The suggested way out from a score, for the darts this visit has left.
//
// With three darts and double-out, the chart in dartsConstants is the answer:
// it holds the routes players actually learn. With fewer darts, or with
// single-out, the chart's route may need more darts than are left, so a small
// search finds one that fits, preferring the doubles players aim for.

const TREBLES = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({ n, m: 3 }));
const SINGLES = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({ n, m: 1 }));
const SETUP = [...TREBLES, { n: BULL, m: 1 }, ...SINGLES, { n: BULL, m: 2 }];
// The doubles people like to finish on, best first.
const DOUBLES = [20, 16, 18, 12, 10, 8, 19, 17, 15, 14, 13, 11, 9, 7, 6, 5, 4, 3, 2, 1].map((n) => ({ n, m: 2 }));
const FINISH_DOUBLE = [...DOUBLES, { n: BULL, m: 2 }];
const FINISH_ANY = [...SINGLES, ...DOUBLES, { n: BULL, m: 1 }, { n: BULL, m: 2 }, ...TREBLES];

function search(remaining, darts, finishes) {
  for (const f of finishes) if (value(f) === remaining) return [f];
  if (darts < 2) return null;
  for (const s of SETUP) {
    const rest = remaining - value(s);
    if (rest < 2 && finishes === FINISH_DOUBLE) continue;
    if (rest < 1) continue;
    const tail = search(rest, darts - 1, finishes);
    if (tail) return [s, ...tail];
  }
  return null;
}

/**
 * The route as labels ("T20", "D16"), or null when there is none in the darts
 * left. `doubleOut` false means any dart can finish.
 */
export function checkoutRoute(remaining, dartsLeft = 3, doubleOut = true) {
  if (!remaining || remaining < (doubleOut ? 2 : 1) || dartsLeft < 1) return null;
  if (remaining > MAX_CHECKOUT) return null;
  if (doubleOut) {
    if (BOGEY_NUMBERS.includes(remaining)) return null;
    const chart = CHECKOUT_CHART[remaining];
    if (chart && chart.length <= dartsLeft) return chart;
  }
  // A failed three-dart search tries a few thousand routes; the board asks on
  // every render, so each answer is kept.
  const key = `${remaining}:${dartsLeft}:${doubleOut ? 'd' : 's'}`;
  if (!cache.has(key)) {
    const found = search(remaining, Math.min(3, dartsLeft), doubleOut ? FINISH_DOUBLE : FINISH_ANY);
    cache.set(key, found ? found.map(label) : null);
  }
  return cache.get(key);
}
const cache = new Map();

/** The same route as darts, for lighting up the board. */
export const routeDarts = (route) => (route || []).map(parse).filter(Boolean);
