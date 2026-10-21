import { motion } from 'motion/react';
import { Avatar, Marquee, Podium } from '@/components/quiz-show/ui';
import { CLOCK } from '@/lib/darts/rules';
import { cn } from '@/lib/cn';
import { BigButton, SHOW_FONT } from './ui';

// The end of a game: the podium from the real standings (the old screen
// crowned whoever was first in the list), each player's numbers, and the way
// on. "Undo the last dart" is here too, for a winning dart tapped by mistake.

function scoreLabel(match, s, i) {
  if (match.mode === 'x01') {
    if (match.settings.legs > 1) return `${s.legsWon[i]} leg${s.legsWon[i] === 1 ? '' : 's'}`;
    return s.remaining[i] === 0 ? 'Out!' : `${s.remaining[i]} left`;
  }
  if (match.mode === 'cricket') return `${s.points[i]} pts`;
  if (match.mode === 'around-the-clock') return s.target[i] >= CLOCK.length ? 'All the way' : `on ${CLOCK[s.target[i]] === 25 ? 'Bull' : CLOCK[s.target[i]]}`;
  return s.alive[i] ? `${s.lives[i]} ❤️` : 'Out';
}

function statsLine(match, s, i) {
  const st = s.stats[i];
  if (match.mode === 'x01') {
    const avg = st.darts ? ((st.points / st.darts) * 3).toFixed(1) : '0.0';
    return [`Average ${avg}`, `best visit ${st.best}`, st.max ? `${st.max}× 180` : null, st.bestCheckout ? `checkout ${st.bestCheckout}` : null, `${st.darts} darts`].filter(Boolean).join(' · ');
  }
  if (match.mode === 'cricket') {
    const mpr = st.darts ? (st.hits / (st.darts / 3)).toFixed(1) : '0.0';
    return `${st.hits} marks · ${mpr} a round · ${st.darts} darts`;
  }
  if (match.mode === 'around-the-clock') return `${s.target[i]} of 21 · ${st.darts} darts`;
  return `${st.kills} li${st.kills === 1 ? 'fe' : 'ves'} taken · ${st.darts} darts`;
}

export default function GameOver({ match, s, onUndo, onAgain, onNew, onDone }) {
  const winner = match.players[s.winner];
  const rows = s.standings.map(({ index, place }) => ({ ...match.players[index], index, place, score: scoreLabel(match, s, index) }));
  return (
    <motion.div className="fixed inset-0 z-40 overflow-y-auto bg-[#0b2425]/95 text-white backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <motion.div className="text-center" initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
          <Marquee>{match.players.length > 1 ? `${winner?.name} wins!` : 'Done it!'}</Marquee>
        </motion.div>

        {match.players.length > 1 && (
          <div className="mt-8">
            <Podium rows={rows.slice(0, 3)} />
          </div>
        )}

        <ol className="mt-6 space-y-2">
          {rows.map((r, k) => (
            <motion.li key={r.id} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.2 + k * 0.08 }} className={cn('flex min-w-0 items-center gap-3 rounded-2xl bg-black/35 p-2.5 ring-1 ring-white/15', r.index === s.winner && 'ring-2 ring-amber-300')}>
              <span className="w-6 text-center text-2xl text-amber-200" style={SHOW_FONT}>{r.place}</span>
              <Avatar player={r} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xl" style={SHOW_FONT}>{r.name}</span>
                  <span className="shrink-0 text-lg tnum" style={SHOW_FONT}>{r.score}</span>
                </div>
                <p className="text-xs font-semibold text-white/75">{statsLine(match, s, r.index)}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <div className="mt-auto grid grid-cols-1 gap-3 pt-8">
          <BigButton onClick={onAgain}>Play again</BigButton>
          <BigButton onClick={onNew} className="bg-white/95 text-[#16302f] [--toy-edge:rgba(0,0,0,0.3)]">
            Another game
          </BigButton>
          <button type="button" onClick={onDone} className="press min-h-[48px] text-lg text-white/85" style={SHOW_FONT}>
            Back to darts
          </button>
          <button type="button" onClick={onUndo} className="press text-sm font-semibold text-white/60 underline underline-offset-4">
            Tapped the last dart wrong? Undo it
          </button>
        </div>
      </div>
    </motion.div>
  );
}
