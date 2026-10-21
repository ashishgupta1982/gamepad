// Vibration and confetti: the two non-sound halves of a game moment.

// Android vibrates; iOS Safari has no Vibration API at all, so this is never the
// only signal that something happened.
export function buzz(pattern = 30) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {}
}

// canvas-confetti is loaded on first use, so a game that never celebrates never
// downloads it. It honours prefers-reduced-motion by itself.
let confettiPromise = null;
function confetti() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!confettiPromise) confettiPromise = import('canvas-confetti').then((m) => m.default).catch(() => null);
  return confettiPromise;
}

const BASE = { disableForReducedMotion: true, zIndex: 60 };

/** `small` for a line, `big` for a win. `colors` are hex strings. */
export async function celebrate(size = 'small', colors) {
  const fire = await confetti();
  if (!fire) return;
  const opts = { ...BASE, ...(colors ? { colors } : {}) };
  if (size === 'small') {
    fire({ ...opts, particleCount: 70, spread: 70, startVelocity: 38, origin: { y: 0.6 } });
    return;
  }
  // Two cannons from the bottom corners, then a burst from the top.
  fire({ ...opts, particleCount: 120, angle: 60, spread: 70, startVelocity: 60, origin: { x: 0, y: 0.9 } });
  fire({ ...opts, particleCount: 120, angle: 120, spread: 70, startVelocity: 60, origin: { x: 1, y: 0.9 } });
  setTimeout(() => fire({ ...opts, particleCount: 160, spread: 120, startVelocity: 45, origin: { y: 0.3 } }), 450);
}
