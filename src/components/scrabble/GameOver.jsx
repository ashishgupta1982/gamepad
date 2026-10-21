import { motion } from 'motion/react';
import { Avatar, Marquee, Podium } from '@/components/quiz-show/ui';
import { cn } from '@/lib/cn';
import { BigButton, SHOW_FONT } from './ui';

// The end of a game, which the old scorer never had: the podium from the real
// standings (ties share a place), the final totals, and the awards.
// "Back to the game" is here for an End pressed by mistake.

export default function GameOver({ match, s, onBack, onAgain, onNew, onDone }) {
  const rows = s.standings.map(({ index, place, total }) => ({ ...match.players[index], index, place, score: total }));
  const winners = rows.filter((r) => r.place === 1);
  const headline = winners.length > 1 ? 'A tie!' : `${winners[0].name} wins!`;
  const names = (list) => list.map((i) => match.players[i].name).join(' & ');

  return (
    <motion.div className="fixed inset-0 z-40 overflow-y-auto bg-[#2a170a]/95 text-white backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <motion.div className="text-center" initial={{ scale: 0.4, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
          <Marquee>{headline}</Marquee>
        </motion.div>

        <div className="mt-8">
          <Podium rows={rows.slice(0, 3)} />
        </div>

        <ol className="mt-6 space-y-2">
          {rows.map((r, k) => {
            const st = s.stats[r.index];
            return (
              <motion.li key={r.id} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.2 + k * 0.08 }} className={cn('flex min-w-0 items-center gap-3 rounded-2xl bg-black/35 p-2.5 ring-1 ring-white/15', r.place === 1 && 'ring-2 ring-amber-300')}>
                <span className="w-6 text-center text-2xl text-amber-200" style={SHOW_FONT}>{r.place}</span>
                <Avatar player={r} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xl" style={SHOW_FONT}>{r.name}</span>
                    <span className="shrink-0 text-2xl tnum" style={SHOW_FONT}>{r.score}</span>
                  </div>
                  <p className="truncate text-xs font-semibold text-white/75">
                    {st.turns} turns · average {st.average} · best {st.best}
                    {s.bingos[r.index] ? ` · ${s.bingos[r.index]} bingo${s.bingos[r.index] === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>

        {s.awards.length > 0 && (
          <section className="mt-6">
            <h2 className="text-2xl" style={SHOW_FONT}>Awards</h2>
            <ul className="mt-2 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              {s.awards.map((a, k) => (
                <motion.li
                  key={a.id}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.6 + k * 0.15, type: 'spring', stiffness: 300, damping: 16 }}
                  className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#fbf0d6] p-3 text-[#3b2414]"
                >
                  <span className="text-3xl" aria-hidden="true">{a.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#a0702e]">{a.title}</p>
                    <p className="truncate text-xl leading-tight" style={SHOW_FONT}>{names(a.players)}</p>
                    <p className="truncate text-xs font-semibold text-[#7a5c3e]">{a.text}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-auto grid grid-cols-1 gap-3 pt-8">
          <BigButton onClick={onAgain}>Play again</BigButton>
          <BigButton onClick={onNew} className="bg-[#fbf0d6] text-[#3b2414] [--toy-edge:#b08a4f]">
            New game
          </BigButton>
          <button type="button" onClick={onDone} className="press min-h-[48px] text-lg text-white/85" style={SHOW_FONT}>
            Back to Scrabble
          </button>
          <button type="button" onClick={onBack} className="press text-sm font-semibold text-white/60 underline underline-offset-4">
            Ended it by mistake? Back to the game
          </button>
        </div>
      </div>
    </motion.div>
  );
}
