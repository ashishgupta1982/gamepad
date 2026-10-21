import { motion } from 'motion/react';
import { Avatar } from '@/components/quiz-show/ui';
import { CLOCK, CRICKET } from '@/lib/darts/rules';
import { cn } from '@/lib/cn';
import { Hearts, SHOW_FONT } from './ui';

// The scores, one board per game, big enough to read from the oche. The player
// throwing is lifted and ringed in gold.

const cols = (n) => (n <= 4 ? 'grid-cols-2' : 'grid-cols-3');

function Card({ player, active, out, children, className }) {
  return (
    <motion.div
      layout
      animate={{ scale: active ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'min-w-0 rounded-2xl p-2.5 ring-1 transition-colors',
        active ? 'bg-white/95 text-[#16302f] ring-4 ring-amber-300' : 'bg-black/35 ring-white/15',
        out && 'opacity-45',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <Avatar player={player} size={26} />
        <span className={cn('min-w-0 flex-1 truncate text-base leading-tight', out && 'line-through')} style={SHOW_FONT}>{player.name}</span>
      </div>
      {children}
    </motion.div>
  );
}

export function X01Board({ match, s }) {
  const { start, legs } = match.settings;
  const big = match.players.length <= 2;
  return (
    <div className={cn('grid gap-2', cols(match.players.length))}>
      {match.players.map((p, i) => {
        const st = s.stats[i];
        const avg = st.darts ? ((st.points / st.darts) * 3).toFixed(1) : '–';
        const last = [...s.visits].reverse().find((v) => v.player === i && v.leg === s.leg);
        return (
          <Card key={p.id} player={p} active={i === s.current && !s.finished}>
            <div className={cn('mt-0.5 text-center leading-none tnum', big ? 'text-6xl' : 'text-5xl')} style={SHOW_FONT}>{s.remaining[i]}</div>
            {/* Down from this game's starting score, not 501's. */}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/15">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(1 - s.remaining[i] / start) * 100}%`, background: p.color }} />
            </div>
            <div className="mt-1 flex items-center justify-between gap-1 text-xs font-semibold opacity-80">
              <span>avg {avg}</span>
              {last && <span>last {last.bust ? 'bust' : last.total}</span>}
            </div>
            {legs > 1 && (
              <div className="mt-1 flex justify-center gap-1" aria-label={`${s.legsWon[i]} legs won`}>
                {Array.from({ length: Math.ceil(legs / 2) }, (_, k) => (
                  <span key={k} className={cn('h-2.5 w-2.5 rounded-full', k < s.legsWon[i] ? 'bg-amber-400' : 'bg-black/20')} />
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/** Cricket's marks: /, X, then a ringed X when closed. */
function Mark({ count }) {
  if (!count) return <span className="h-6 w-6" />;
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-label={`${count} marks`}>
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
        <line x1="6" y1="18" x2="18" y2="6" />
        {count >= 2 && <line x1="6" y1="6" x2="18" y2="18" />}
        {count >= 3 && <circle cx="12" cy="12" r="10" strokeWidth="2.5" />}
      </g>
    </svg>
  );
}

export function CricketBoard({ match, s }) {
  const allClosed = (t) => s.marks.every((row) => row[t] >= 3);
  return (
    <div className="overflow-hidden rounded-2xl bg-black/35 ring-1 ring-white/15">
      <div className="grid" style={{ gridTemplateColumns: `3rem repeat(${match.players.length}, minmax(0, 1fr))` }}>
        <span />
        {match.players.map((p, i) => (
          <div key={p.id} className={cn('flex min-w-0 flex-col items-center px-1 py-1.5', i === s.current && !s.finished && 'bg-amber-300 text-amber-950')}>
            <Avatar player={p} size={24} />
            <span className="w-full truncate text-center text-sm leading-tight" style={SHOW_FONT}>{p.name}</span>
            <span className="text-2xl leading-none tnum" style={SHOW_FONT}>{s.points[i]}</span>
          </div>
        ))}
        {CRICKET.map((n, t) => (
          <div key={n} className="contents">
            <span className={cn('flex items-center justify-center border-t border-white/10 py-0.5 text-xl', allClosed(t) && 'text-white/35 line-through')} style={SHOW_FONT}>
              {n === 25 ? 'B' : n}
            </span>
            {match.players.map((p, i) => (
              <span key={p.id} className={cn('flex items-center justify-center border-t border-white/10 py-0.5', i === s.current && !s.finished && 'bg-amber-300/15', s.marks[i][t] >= 3 ? 'text-emerald-300' : 'text-white')}>
                <Mark count={s.marks[i][t]} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClockBoard({ match, s }) {
  return (
    <div className={cn('grid gap-2', cols(match.players.length))}>
      {match.players.map((p, i) => {
        const done = s.target[i] >= CLOCK.length;
        const next = done ? '✓' : CLOCK[s.target[i]] === 25 ? 'Bull' : CLOCK[s.target[i]];
        return (
          <Card key={p.id} player={p} active={i === s.current && !s.finished}>
            <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
              <span className="text-xs font-semibold opacity-75">on</span>
              <span className="text-5xl leading-none tnum" style={SHOW_FONT}>{next}</span>
            </div>
            <div className="mt-1.5 flex gap-[2px]" aria-label={`${s.target[i]} of 21`}>
              {CLOCK.map((n, k) => (
                <span key={n} className="h-2 flex-1 rounded-full" style={{ background: k < s.target[i] ? p.color : 'rgba(0,0,0,0.18)' }} />
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function KillerBoard({ match, s }) {
  return (
    <div className={cn('grid gap-2', cols(match.players.length))}>
      {match.players.map((p, i) => (
        <Card key={p.id} player={p} active={i === s.current && !s.finished} out={!s.alive[i]}>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="rounded-lg px-1.5 text-xl leading-snug text-white" style={{ ...SHOW_FONT, background: p.color }}>D{s.numbers[i]}</span>
            {s.killer[i] && s.alive[i] && <span className="text-xl" title="Killer" aria-label="Killer">💀</span>}
            {!s.alive[i] && <span className="text-sm font-bold">OUT</span>}
          </div>
          <div className="mt-1.5">
            <Hearts lives={s.lives[i]} of={match.settings.lives || 3} />
          </div>
        </Card>
      ))}
    </div>
  );
}

export const BOARDS = { x01: X01Board, cricket: CricketBoard, 'around-the-clock': ClockBoard, killer: KillerBoard };
