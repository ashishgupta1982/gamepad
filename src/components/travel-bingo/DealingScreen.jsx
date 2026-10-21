import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

// Cards being dealt. If the deal has been going far longer than it should (the
// function was killed mid-flight), the host gets a button to deal again; the
// server allows it once the 'generating' phase is stale.
const STALE_AFTER_MS = 80 * 1000;

export default function DealingScreen({ since, isHost, onRetry }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(t);
  }, []);
  const stuck = since && now - new Date(since).getTime() > STALE_AFTER_MS;

  return (
    <div className="flex flex-col items-center pt-14 text-center">
      <div className="relative h-40 w-32" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="toy-flat absolute inset-0 rounded-2xl bg-white [--toy-edge:hsl(var(--border))]"
            animate={{ rotate: [i * 6 - 9, i * 6 - 9 + 14, i * 6 - 9], x: [0, i % 2 ? 26 : -26, 0], y: [0, -10, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          >
            <div className="grid h-full grid-cols-3 gap-1 p-2.5">
              {Array.from({ length: 9 }, (_, j) => (
                <span key={j} className="rounded-md bg-game-bingo/15" />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <h2 className="mt-8 font-display text-2xl font-extrabold text-foreground">Dealing the cards…</h2>
      <p className="mt-1 text-sm text-muted-foreground">Mixing everyone&apos;s lists. A few seconds.</p>

      {stuck && isHost && (
        <button
          type="button"
          onClick={onRetry}
          className="toy mt-6 rounded-2xl bg-game-bingo px-6 py-3 font-display text-lg font-extrabold text-white [--toy-edge:hsl(var(--game-bingo-deep))]"
        >
          Taking too long. Deal again
        </button>
      )}
      {stuck && !isHost && <p className="mt-6 text-sm font-semibold text-muted-foreground">Taking a while. The host can deal again.</p>}
    </div>
  );
}
