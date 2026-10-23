import { useEffect, useRef, useState } from 'react';
import { Lilita_One } from 'next/font/google';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { play } from '@/components/arcade/sfx';
import { cn } from '@/lib/cn';

// The quiz's game-show pieces (REDESIGN-PLAN.md, Phase 3): the studio, the
// marquee title, the answer tiles, the clock, the leaderboard and the podium.
// Shared by solo, shout and multi-phone play, and by the TV screen.

// The show's face: chunky and bold, for titles, questions and scores. Loaded
// here so only the quiz pays for it.
const show = Lilita_One({ weight: '400', subsets: ['latin'], display: 'swap' });
export const SHOW_FONT = { fontFamily: show.style.fontFamily };

// The four answers keep the colours and shapes of the TV in the games room.
export const ANSWERS = [
  { shape: '▲', tile: 'bg-rose-500 [--toy-edge:theme(colors.rose.700)]', ring: 'ring-rose-300' },
  { shape: '◆', tile: 'bg-sky-500 [--toy-edge:theme(colors.sky.700)]', ring: 'ring-sky-300' },
  { shape: '●', tile: 'bg-amber-400 text-amber-950 [--toy-edge:theme(colors.amber.600)]', ring: 'ring-amber-200' },
  { shape: '■', tile: 'bg-emerald-500 [--toy-edge:theme(colors.emerald.700)]', ring: 'ring-emerald-300' },
];

/** The studio behind every quiz screen: upright on a phone, wide on a big screen. */
export function Stage({ children, className, dim = 0.45 }) {
  return (
    <div className={cn('relative min-h-dvh overflow-hidden bg-[#1b1036] text-white', className)}>
      <picture>
        <source media="(min-aspect-ratio: 4/5)" srcSet="/quiz/studio-wide.webp" />
        <img src="/quiz/studio-portrait.webp" alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full select-none object-cover" />
      </picture>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ background: `linear-gradient(to bottom, rgba(27,16,54,${dim * 0.6}) 0%, rgba(27,16,54,${dim}) 45%, rgba(27,16,54,${Math.min(0.92, dim + 0.4)}) 100%)` }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** A title framed by chasing marquee bulbs. */
export function Marquee({ children, small = false }) {
  const reduce = useReducedMotion();
  const bulbs = small ? 14 : 22;
  return (
    <div className="relative mx-auto inline-block rounded-[2rem] bg-gradient-to-b from-fuchsia-600 to-violet-800 px-7 py-4 shadow-[0_8px_0_#3b0764,0_20px_40px_-10px_rgba(0,0,0,0.6)] ring-4 ring-amber-300/80">
      <div aria-hidden="true" className="pointer-events-none absolute inset-1.5 flex flex-wrap content-between justify-between">
        {Array.from({ length: bulbs }, (_, i) => (
          <span
            key={i}
            className={cn('h-2.5 w-2.5 rounded-full bg-amber-200 shadow-[0_0_8px_2px_rgba(253,230,138,0.9)]', !reduce && 'animate-[bulb_1.2s_ease-in-out_infinite]')}
            style={{ animationDelay: `${(i % 6) * 0.2}s` }}
          />
        ))}
      </div>
      <div className={cn('relative text-center leading-none text-white drop-shadow-[0_3px_0_#3b0764]', small ? 'text-3xl' : 'text-5xl')} style={SHOW_FONT}>
        {children}
      </div>
    </div>
  );
}

/**
 * The four answers. `picked` is the option this player chose; `reveal` shows
 * which was right. `onPick` makes them tappable; without it they are display
 * only (the shout screen, the TV).
 */
export function AnswerTiles({ options, onPick, picked = null, reveal = false, correct = null, counts = null, big = false }) {
  return (
    <div className={cn('grid grid-cols-2', big ? 'gap-4' : 'gap-3')}>
      {options.map((text, i) => {
        const a = ANSWERS[i];
        const isRight = reveal && i === correct;
        const isWrongPick = reveal && picked === i && i !== correct;
        const faded = (reveal && !isRight) || (!reveal && picked !== null && picked !== i);
        return (
          <motion.button
            key={i}
            type="button"
            disabled={!onPick || picked !== null || reveal}
            onClick={() => onPick?.(i)}
            animate={isRight ? { scale: [1, 1.06, 1] } : isWrongPick ? { x: [0, -8, 8, -5, 5, 0] } : { scale: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className={cn(
              'toy relative flex items-center gap-3 rounded-3xl px-4 text-left text-white transition-opacity disabled:cursor-default',
              big ? 'min-h-[120px] py-5' : 'min-h-[88px] py-3',
              a.tile,
              faded && 'opacity-35',
              isRight && 'ring-4 ring-white',
              picked === i && !reveal && 'ring-4 ring-white',
            )}
            aria-label={`${a.shape} ${text}`}
          >
            <span aria-hidden="true" className={cn('shrink-0 leading-none opacity-90', big ? 'text-5xl' : 'text-3xl')}>{a.shape}</span>
            <span className={cn('min-w-0 flex-1 leading-tight', big ? 'text-3xl' : 'text-lg')} style={SHOW_FONT}>
              {text}
            </span>
            {counts && reveal && (
              <span className="shrink-0 rounded-full bg-black/25 px-2 py-0.5 text-sm font-bold tnum">{counts[i] || 0}</span>
            )}
            {isRight && (
              <span aria-hidden="true" className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl text-emerald-600 shadow-lg">✓</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * The clock: a bar draining towards `endsAt`, ticking in its last five
 * seconds. `offset` is server time minus this device's time, for multi-phone.
 */
export function Clock({ endsAt, total, running = true, offset = 0, sound = true }) {
  const [now, setNow] = useState(() => Date.now() + offset);
  const lastTick = useRef(null);
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setNow(Date.now() + offset), 100);
    return () => clearInterval(t);
  }, [running, offset]);
  const left = Math.max(0, endsAt - now);
  const secs = Math.ceil(left / 1000);
  useEffect(() => {
    if (!running || !sound || secs > 5 || secs < 1 || lastTick.current === secs) return;
    lastTick.current = secs;
    play(secs <= 3 ? 'tickHigh' : 'tick');
  }, [secs, running, sound]);
  const frac = total ? left / total : 0;
  return (
    <div className="flex items-center gap-3" role="timer" aria-label={`${secs} seconds left`}>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/30">
        <div
          className={cn('h-full rounded-full transition-[width] duration-100 ease-linear', secs <= 5 ? 'bg-rose-400' : 'bg-amber-300')}
          style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }}
        />
      </div>
      <span className={cn('w-10 text-right text-3xl tnum', secs <= 5 && running && 'text-rose-300')} style={SHOW_FONT}>
        {secs}
      </span>
    </div>
  );
}

/** A player's face: their emoji in their colour. */
export function Avatar({ player, size = 44, className }) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full ring-2 ring-white/70', className)}
      style={{ width: size, height: size, background: player.color, fontSize: size * 0.55 }}
      aria-hidden="true"
    >
      {player.avatar}
    </span>
  );
}

/** The scores as a race: bars that grow and players that overtake. */
export function Leaderboard({ rows, highlight, gained = {} }) {
  const top = Math.max(1, ...rows.map((r) => r.score));
  return (
    <ol className="space-y-2.5">
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <motion.li
            key={r.id}
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={cn('flex items-center gap-3 rounded-2xl bg-black/30 p-2 pr-3 ring-1 ring-white/15', r.id === highlight && 'ring-2 ring-amber-300')}
          >
            <span className="w-7 text-center text-2xl text-amber-200" style={SHOW_FONT}>{r.place}</span>
            <Avatar player={r} size={38} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-lg" style={SHOW_FONT}>{r.name}</span>
                <span className="flex items-baseline gap-2">
                  {gained[r.id] > 0 && (
                    <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-bold text-emerald-300 tnum">
                      +{gained[r.id]}
                    </motion.span>
                  )}
                  <span className="text-xl tnum" style={SHOW_FONT}>{r.score}</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/15">
                <motion.div className="h-full rounded-full" style={{ background: r.color }} initial={false} animate={{ width: `${(r.score / top) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
              </div>
            </div>
            {r.streak >= 3 && <span className="text-sm font-bold text-orange-300" title="Streak">🔥{r.streak}</span>}
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}

/** First, second and third on blocks that rise. */
export function Podium({ rows }) {
  const order = [rows[1], rows[0], rows[2]];
  const heights = ['h-24', 'h-36', 'h-16'];
  const medals = ['🥈', '🥇', '🥉'];
  return (
    <div className="flex items-end justify-center gap-3">
      {order.map((r, i) =>
        r ? (
          <motion.div
            key={r.id}
            className="flex w-24 flex-col items-center"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: [0.6, 1.1, 0.2][i], type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Avatar player={r} size={i === 1 ? 64 : 52} />
            <span className="mt-1 w-full truncate text-center text-lg" style={SHOW_FONT}>{r.name}</span>
            <span className="text-sm text-white/80 tnum">{r.score}</span>
            <div className={cn('mt-1 flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b from-amber-300 to-amber-500 pt-2 text-3xl shadow-[inset_0_-6px_0_rgba(0,0,0,0.15)]', heights[i])}>
              {medals[i]}
            </div>
          </motion.div>
        ) : (
          <div key={i} className="w-24" />
        ),
      )}
    </div>
  );
}

/** A big toy button in the show's style. */
export function ShowButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'toy flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 text-2xl text-amber-950 [--toy-edge:theme(colors.amber.600)] disabled:opacity-50',
        className,
      )}
      style={SHOW_FONT}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Names this account has played under, as pills to tap instead of typing
 * (Ash, 2026-10-21). `isOn(name)` marks the ones already in; `onPick(name)`
 * adds or takes off. Nothing shows for a guest or an account with no names.
 */
export function NamePills({ names, isOn, onPick, label = 'Played before', me = null }) {
  // The signed-in player first, marked as them (Ash, 2026-10-23).
  const list = me ? [me, ...(names || []).filter((n) => n.trim().toLowerCase() !== me.trim().toLowerCase())] : names || [];
  if (!list.length) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-sm font-bold text-white/80">{label}</p>
      <div className="flex flex-wrap gap-2">
        {list.map((n) => {
          const on = isOn(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              aria-pressed={on}
              className={cn(
                'press flex items-center gap-1 rounded-full px-3 py-1.5 text-base font-bold',
                on ? 'bg-amber-300 text-amber-950 ring-2 ring-inset ring-amber-500' : 'bg-white/90 text-[#241a45]',
              )}
            >
              {on ? '✓ ' : '+ '}
              {n}
              {n === me && <span className={cn('ml-1 rounded-full px-1.5 text-xs', on ? 'bg-amber-950/15' : 'bg-[#241a45]/10')}>you</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
