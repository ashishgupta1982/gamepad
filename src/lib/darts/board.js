// The dartboard as numbers: where each segment sits, what a dart is worth and
// how it is written. Shared by the rules, the checkout routes and the board
// you tap.
//
// A dart is { n, m }: n is the number (1-20, or 25 for the bull), m the ring
// (1 single, 2 double, 3 treble; 0 a miss). The bullseye is { n: 25, m: 2 },
// worth 50 and counted as a double, which is what lets it finish a leg.

// Clockwise from the top.
export const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

export const BULL = 25;
export const MISS = { n: 0, m: 0 };

export const value = (d) => (d && d.n ? d.n * d.m : 0);
export const isDouble = (d) => !!d && d.m === 2 && d.n > 0;

/** "T20", "D16", "S5", "25", "BULL", "Miss". */
export function label(d) {
  if (!d || !d.n || !d.m) return 'Miss';
  if (d.n === BULL) return d.m === 2 ? 'BULL' : '25';
  return `${['S', 'D', 'T'][d.m - 1]}${d.n}`;
}

/** The reverse of `label`, for the checkout chart's routes. */
export function parse(text) {
  if (text === 'BULL' || text === '50') return { n: BULL, m: 2 };
  if (text === '25' || text === 'OUTER') return { n: BULL, m: 1 };
  const m = { S: 1, D: 2, T: 3 }[text[0]];
  const n = parseInt(text.slice(1), 10);
  return m && n >= 1 && n <= 20 ? { n, m } : null;
}

/** "Treble 20", "Double 16", "Bullseye": what the caller would say. */
export function longLabel(d) {
  if (!d || !d.n || !d.m) return 'Miss';
  if (d.n === BULL) return d.m === 2 ? 'Bullseye' : 'Outer bull';
  return `${['', 'Double ', 'Treble '][d.m - 1]}${d.n}`;
}

// The board as drawn, in a 400-unit square centred on 0. A "big-target" board:
// the trebles, doubles and bull are much wider than a real board's, paid for
// by the inner single, since both singles score the same. The order and the
// colours are a real board's.
export const RINGS = {
  bull: 12,
  outerBull: 27,
  innerSingle: 66,
  treble: 106,
  outerSingle: 134,
  double: 176,
  numbers: 200,
};

/**
 * Where a point on the board landed, x and y in board units from the centre.
 * Inside the number band or beyond it is null: lifting a finger there is a
 * change of mind, not a miss (Miss is its own button).
 */
export function hitAt(x, y) {
  const r = Math.hypot(x, y);
  if (r > RINGS.double) return null;
  if (r <= RINGS.bull) return { n: BULL, m: 2 };
  if (r <= RINGS.outerBull) return { n: BULL, m: 1 };
  // Degrees clockwise from straight up.
  const deg = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  const n = SEGMENTS[Math.floor(((deg + 9) % 360) / 18)];
  if (r <= RINGS.innerSingle) return { n, m: 1 };
  if (r <= RINGS.treble) return { n, m: 3 };
  if (r <= RINGS.outerSingle) return { n, m: 1 };
  return { n, m: 2 };
}

/** The centre angle of a number's segment, degrees clockwise from the top. */
export const angleOf = (n) => SEGMENTS.indexOf(n) * 18;
