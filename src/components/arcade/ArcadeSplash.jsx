import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSession } from 'next-auth/react';

// GamePad powering up: the cover held while the sign-in session resolves on a
// cold load of the home page (Ash, 2026-10-23: the shared spinner was "super
// dull"). The same job as @aspiro/auth's SessionSplashGate, whose look cannot
// be changed per app: shown until the session is known and at least `minMs`
// has passed, then it fades out over the page already drawn underneath.
//
// The logo drops in and bounces like a pressed button, the games orbit it
// (darts, Scrabble, quiz, travel, Egypt, board games), the wordmark pops in a
// letter at a time and waves, the line underneath keeps changing, and arcade
// blocks light up in turn. With reduced motion it is a still card.
//
// Nothing random at render: the server draws it too, and the two must match.

const FADE_MS = 320;
const TOKENS = [
  { emoji: '🎯', bg: '#f43f5e' },
  { emoji: '🔤', bg: '#f59e0b' },
  { emoji: '🎤', bg: '#8b5cf6' },
  { emoji: '🚗', bg: '#0ea5e9' },
  { emoji: '🏺', bg: '#d97706' },
  { emoji: '🎲', bg: '#10b981' },
];
const LETTERS = [
  ['G', '#fcd34d'],
  ['a', '#fb7185'],
  ['m', '#38bdf8'],
  ['e', '#34d399'],
  ['P', '#fcd34d'],
  ['a', '#c4b5fd'],
  ['d', '#fb923c'],
];
const LINES = [
  'Signing you in…',
  'Chalking the oche…',
  'Warming up the quizmaster…',
  'Shuffling the letter tiles…',
  'Dusting off the pyramids…',
  'Packing snacks for the car…',
  'Rolling the dice…',
];
// Sparkles drifting up: left %, size px, seconds to rise, delay, colour.
const SPARKS = [
  [6, 6, 5.2, 0, '#fcd34d'], [14, 4, 6.4, 1.2, '#fb7185'], [23, 7, 4.8, 2.1, '#38bdf8'], [31, 5, 6, 0.6, '#fff'],
  [40, 4, 5.4, 1.8, '#34d399'], [48, 6, 4.6, 0.3, '#fcd34d'], [57, 5, 6.2, 2.4, '#c4b5fd'], [65, 7, 5, 1, '#fb923c'],
  [73, 4, 5.8, 0.9, '#fff'], [81, 6, 4.9, 2.7, '#38bdf8'], [89, 5, 6.6, 1.5, '#fb7185'], [95, 4, 5.3, 0.2, '#fcd34d'],
];
const BLOCKS = ['#fb7185', '#fb923c', '#fcd34d', '#34d399', '#38bdf8', '#818cf8', '#c084fc', '#f472b6'];
const RING = 118; // orbit radius, px

export default function ArcadeSplash({ active = true, minMs = 1200 }) {
  const { status } = useSession();
  const still = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);
  const [gone, setGone] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), minMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured from mount, once
  }, []);
  const leaving = minElapsed && status !== 'loading';
  useEffect(() => {
    if (!leaving) return undefined;
    const t = setTimeout(() => setGone(true), FADE_MS);
    return () => clearTimeout(t);
  }, [leaving]);
  useEffect(() => {
    if (still) return undefined;
    const t = setInterval(() => setLine((i) => (i + 1) % LINES.length), 1100);
    return () => clearInterval(t);
  }, [still]);

  if (!active || gone) return null;

  return (
    <div
      aria-busy="true"
      aria-label="Signing you in"
      className={`fixed inset-0 z-[500] overflow-hidden transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
        leaving ? 'pointer-events-none scale-105 opacity-0' : 'scale-100 opacity-100'
      }`}
      style={{ background: 'radial-gradient(circle at 50% 42%, #9a3412 0%, #431407 42%, #1e0b33 100%)' }}
    >
      {/* Two spotlights sweeping the stage. */}
      {!still &&
        [-1, 1].map((side) => (
          <motion.div
            key={side}
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 h-[85vh] w-[45vw] origin-top"
            style={{
              left: side < 0 ? '8%' : 'auto',
              right: side > 0 ? '8%' : 'auto',
              background: 'linear-gradient(to bottom, rgba(253,224,71,0.28), rgba(253,224,71,0) 80%)',
              clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
              filter: 'blur(6px)',
            }}
            animate={{ rotate: side < 0 ? [-18, 14, -18] : [18, -14, 18] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}

      {/* Sparkles rising. */}
      {!still &&
        SPARKS.map(([left, size, secs, delay, color], i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="absolute bottom-0 rounded-full"
            style={{ left: `${left}%`, width: size, height: size, background: color, boxShadow: `0 0 ${size * 2}px ${color}` }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: '-105vh', opacity: [0, 1, 1, 0] }}
            transition={{ duration: secs, delay, repeat: Infinity, ease: 'linear' }}
          />
        ))}

      <div className="relative flex h-full flex-col items-center justify-center px-4">
        {/* The logo, its glow, and the games going round it. */}
        <div className="relative flex items-center justify-center" style={{ width: RING * 2 + 64, height: RING * 2 + 64 }}>
          {!still && (
            <motion.div
              aria-hidden="true"
              className="absolute h-40 w-40 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.55), rgba(251,191,36,0) 70%)' }}
              animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {!still && (
            <motion.div
              aria-hidden="true"
              className="absolute inset-0"
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 270, opacity: 1, scale: 1 }}
              transition={{ rotate: { duration: 10, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.4, delay: 0.3 }, scale: { type: 'spring', stiffness: 160, damping: 12, delay: 0.3 } }}
            >
              {TOKENS.map((t, i) => {
                const angle = (360 / TOKENS.length) * i;
                return (
                  <div
                    key={t.emoji}
                    className="absolute left-1/2 top-1/2"
                    style={{ transform: `rotate(${angle}deg) translateX(${RING}px) rotate(${-angle}deg)` }}
                  >
                    {/* Turning back against the orbit keeps each token upright. */}
                    <motion.div animate={{ rotate: [90, -270] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="-ml-6 -mt-6">
                      <motion.div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                        style={{ background: t.bg, boxShadow: '0 4px 0 rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.35)' }}
                        animate={{ y: [0, -7, 0], scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.2, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {t.emoji}
                      </motion.div>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          )}

          <motion.div
            initial={still ? false : { y: -260, scale: 0.4, rotate: -25 }}
            animate={{ y: 0, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="relative"
          >
            <motion.img
              src="/icon-192.png"
              alt=""
              className="h-24 w-24 rounded-[28px]"
              style={{ boxShadow: '0 8px 0 rgba(0,0,0,0.35), 0 0 40px rgba(251,191,36,0.45)' }}
              animate={still ? undefined : { scaleY: [1, 0.86, 1.06, 1], scaleX: [1, 1.1, 0.96, 1], y: [0, 6, -10, 0] }}
              transition={{ duration: 0.9, delay: 0.8, repeat: Infinity, repeatDelay: 0.5, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>

        {/* The wordmark, a letter at a time, then a wave. */}
        <div className="-mt-2 flex font-display text-5xl font-extrabold tracking-tight" aria-label="GamePad" role="img">
          {LETTERS.map(([ch, color], i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              initial={still ? false : { y: -50, opacity: 0, rotate: i % 2 ? 18 : -18 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 13, delay: 0.25 + i * 0.07 }}
              style={{ color, textShadow: '0 4px 0 rgba(0,0,0,0.35)' }}
            >
              <motion.span
                className="inline-block"
                animate={still ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 0.7, delay: 1 + i * 0.08, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
              >
                {ch}
              </motion.span>
            </motion.span>
          ))}
        </div>

        {/* What it is doing, never the same for long. */}
        <div className="mt-5 h-7 text-lg font-semibold text-amber-100/90">
          <AnimatePresence mode="wait">
            <motion.p
              key={line}
              initial={still ? false : { y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {LINES[line]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Arcade loading blocks. */}
        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {BLOCKS.map((c, i) => (
            <motion.span
              key={c}
              className="h-3.5 w-5 rounded-[4px]"
              style={{ background: c, boxShadow: `0 0 10px ${c}` }}
              initial={{ opacity: still ? 1 : 0.15 }}
              animate={still ? undefined : { opacity: [0.15, 1, 1, 0.15], scaleY: [0.7, 1.15, 1, 0.7] }}
              transition={{ duration: 1.6, delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
