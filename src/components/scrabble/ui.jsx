import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import MuteButton from '@/components/arcade/MuteButton';
import { SHOW_FONT } from '@/components/quiz-show/ui';
import { cn } from '@/lib/cn';

// The Scrabble table (REDESIGN-PLAN.md, Phase 5): a lamp-lit wooden table seen
// from above, tile racks round the edge and a clear pool of light in the
// middle, behind every Scrabble screen, the way Darts has its oche wall. The
// art is Higgsfield, drawn with the middle left empty for the game. The show
// font is the Quiz's, so the arcade reads as one.

export { SHOW_FONT };

export function Table({ children, dim = 0.5 }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#3a2212] text-white">
      <img src="/scrabble/table.webp" alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full select-none object-cover" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ background: `linear-gradient(to bottom, rgba(38,19,7,${dim * 0.6}) 0%, rgba(38,19,7,${dim}) 40%, rgba(38,19,7,${Math.min(0.94, dim + 0.35)}) 100%)` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Back on the left, the title in the middle, the sound switch on the right. */
export function TopBar({ onBack, backLabel = 'Back', children, right }) {
  return (
    <div className="flex items-center gap-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" onClick={onBack} aria-label={backLabel} className="toy flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fbf0d6] text-[#3b2414] [--toy-edge:rgba(0,0,0,0.3)]">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1 truncate text-center text-lg leading-tight drop-shadow" style={SHOW_FONT}>
        {children}
      </div>
      {right}
      <span className="shrink-0 rounded-full bg-[#fbf0d6] text-[#3b2414]">
        <MuteButton />
      </span>
    </div>
  );
}

// Scrabble's letter values, for the little number in a tile's corner.
const VALUES = { A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10 };
export const letterValue = (ch) => VALUES[String(ch).toUpperCase()] ?? null;

/** A cream letter tile. `value` defaults to the letter's own. */
export function Tile({ children, value, size = 'md', className, style }) {
  const v = value === undefined ? letterValue(children) : value;
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-[22%] bg-gradient-to-b from-[#fbefd2] to-[#ecd7a6] text-[#3b2414] shadow-[inset_0_-3px_0_rgba(120,80,30,0.25),0_3px_0_#b08a4f,0_6px_10px_-4px_rgba(0,0,0,0.5)]',
        size === 'sm' && 'h-8 w-8 text-xl',
        size === 'md' && 'h-12 w-12 text-3xl',
        size === 'lg' && 'h-16 w-16 text-5xl',
        className,
      )}
      style={{ ...SHOW_FONT, ...style }}
    >
      {children}
      {v != null && <span className={cn('absolute bottom-[8%] right-[12%] leading-none', size === 'sm' ? 'text-[0.5rem]' : 'text-[0.6rem]')}>{v}</span>}
    </span>
  );
}

/** A word spelled out in tiles. */
export function TileWord({ word, size = 'md', className }) {
  return (
    <span className={cn('inline-flex flex-wrap justify-center gap-1', className)} aria-label={word}>
      {[...word].map((ch, i) => (
        <Tile key={i} size={size}>{ch}</Tile>
      ))}
    </span>
  );
}

/** The big toy button. */
export function BigButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn('toy flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-2xl text-white [--toy-edge:theme(colors.emerald.800)] disabled:opacity-50', className)}
      style={SHOW_FONT}
      {...props}
    >
      {children}
    </button>
  );
}

/** A total that rolls up to its new value like an arcade counter. */
export function CountUp({ value, duration = 700 }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (reduce || start === value) {
      setShown(value);
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - k) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return <>{shown}</>;
}

/** A sheet that rises from the bottom, for the history and the word check. */
export function Sheet({ open, onClose, label, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={label}
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl bg-[#fbf3e1] p-5 text-[#3b2414]"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
