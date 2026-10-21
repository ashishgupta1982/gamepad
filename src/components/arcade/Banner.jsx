import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';

// The big message across the screen: "LINE!", "The Smiths spotted a red
// tractor", "You couldn't save that". One at a time, queued, each held for a
// moment and then springing away.
//
//   const banner = useBanner();
//   banner.show({ title: 'LINE!', tone: 'win' });

const BannerContext = createContext({ show: () => {} });

export const useBanner = () => useContext(BannerContext);

// Written out, never interpolated: Tailwind only emits classes it can see.
const TONES = {
  win: 'bg-amber-400 text-amber-950 [--toy-edge:theme(colors.amber.600)]',
  info: 'bg-white text-foreground [--toy-edge:hsl(var(--border))]',
  rival: 'bg-sky-500 text-white [--toy-edge:theme(colors.sky.700)]',
  error: 'bg-destructive text-destructive-foreground [--toy-edge:hsl(var(--destructive)/0.6)]',
};

export function BannerProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const idRef = useRef(0);
  const current = queue[0];

  const show = useCallback((msg) => {
    idRef.current += 1;
    setQueue((q) => [...q, { id: idRef.current, tone: 'info', hold: 2200, ...msg }]);
  }, []);

  useEffect(() => {
    if (!current) return undefined;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), current.hold);
    return () => clearTimeout(t);
  }, [current]);

  // Stable, so a game that lists `banner` as a dependency does not re-run its
  // effects every time a banner comes and goes.
  const value = useMemo(() => ({ show }), [show]);

  return (
    <BannerContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[max(4.5rem,env(safe-area-inset-top))] z-50 flex justify-center px-4" aria-live="polite">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={current.id}
              initial={{ y: -40, scale: 0.6, opacity: 0, rotate: -4 }}
              animate={{ y: 0, scale: 1, opacity: 1, rotate: 0 }}
              exit={{ y: -30, scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}
              className={cn('toy-flat max-w-md rounded-3xl px-6 py-3 text-center', TONES[current.tone] || TONES.info)}
            >
              <p className={cn('font-display font-extrabold leading-tight', current.big ? 'text-4xl tracking-wide' : 'text-lg')}>
                {current.title}
              </p>
              {current.text && <p className="mt-0.5 text-sm font-semibold opacity-90">{current.text}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BannerContext.Provider>
  );
}
