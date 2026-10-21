import { motion, useReducedMotion } from 'motion/react';
import { BookOpen, Trash2, X } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { replay, summary } from '@/lib/scrabble/rules';
import { SHOW_FONT, Tile, TopBar } from './ui';

// Scrabble's front door: carry on, start a game, check a word, look back. The
// title is dealt onto the lit middle of the table, one tile at a time.

const TITLE = 'SCRABBLE';

export default function ScrabbleHome({ resume, accountGames, onResume, onDismiss, onNew, onOpen, onDelete, onWords, onBack }) {
  const reduce = useReducedMotion();
  const games = accountGames || [];
  const inPlay = games.filter((g) => !g.scrabbleConfig.match.finished && g._id !== resume?.serverId);
  const done = games.filter((g) => g.scrabbleConfig.match.finished).slice(0, 12);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <TopBar onBack={onBack} backLabel="Back to the games room" />

      <div className="mt-[16dvh] flex flex-wrap justify-center gap-1 sm:gap-1.5" aria-label="Scrabble" role="heading" aria-level={1}>
        {[...TITLE].map((ch, i) => (
          <motion.span
            key={i}
            initial={reduce ? false : { y: -120, rotate: (i % 2 ? 1 : -1) * 25, opacity: 0 }}
            animate={{ y: 0, rotate: (i % 3) - 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 380, damping: 16 }}
            onAnimationComplete={() => i === TITLE.length - 1 && play('stamp')}
          >
            <Tile size="md" className="h-9 w-9 text-2xl min-[400px]:h-[42px] min-[400px]:w-[42px]">{ch}</Tile>
          </motion.span>
        ))}
      </div>
      <p className="mt-4 text-center text-lg font-semibold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">Keep the score. Settle the arguments.</p>

      <div className="mt-auto grid grid-cols-1 gap-3 pt-8">
        {resume && (
          <div className="relative">
            <Choice emoji="▶️" title="Carry on" text={`${resume.match.players.map((p) => p.name).join(', ')} · ${summary(resume.match)}`} tone="bg-violet-500 pr-14 text-white [--toy-edge:theme(colors.violet.800)]" onClick={onResume} />
            <button type="button" onClick={onDismiss} aria-label="Forget this game" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/85 hover:bg-white/15">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <Choice emoji="🔤" title="New game" text="Two to four players" tone="bg-[#fbf0d6] text-[#3b2414] [--toy-edge:#b08a4f]" onClick={onNew} />
        <button
          type="button"
          onClick={() => {
            play('tap');
            onWords();
          }}
          className="press flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-black/30 text-lg ring-1 ring-white/25"
          style={SHOW_FONT}
        >
          <BookOpen className="h-5 w-5" aria-hidden="true" /> Is that a word?
        </button>
      </div>

      {inPlay.length > 0 && (
        <Section title="Still going on your account">
          {inPlay.map((g) => (
            <Row key={g._id} game={g} onOpen={() => onOpen(g)} onDelete={() => onDelete(g)} />
          ))}
        </Section>
      )}

      {done.length > 0 && (
        <Section title="Recent games">
          {done.map((g) => (
            <Row key={g._id} game={g} onDelete={() => onDelete(g)} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Choice({ emoji, title, text, tone, onClick }) {
  return (
    <button
      type="button"
      onClick={() => {
        play('tap');
        onClick();
      }}
      className={`toy flex w-full min-w-0 items-center gap-4 rounded-3xl px-5 py-4 text-left ${tone}`}
    >
      <span className="text-4xl" aria-hidden="true">{emoji}</span>
      <span className="min-w-0">
        <span className="block text-3xl leading-tight" style={SHOW_FONT}>{title}</span>
        <span className="block truncate text-sm font-semibold opacity-85">{text}</span>
      </span>
    </button>
  );
}

function Section({ title, children }) {
  return (
    <section className="mt-7">
      <h2 className="text-2xl drop-shadow" style={SHOW_FONT}>{title}</h2>
      <ul className="mt-2 space-y-2">{children}</ul>
    </section>
  );
}

function Row({ game, onOpen, onDelete }) {
  const m = game.scrabbleConfig.match;
  const s = replay(m);
  const first = s.standings.filter((r) => r.place === 1);
  const headline = !m.finished
    ? m.players.map((p) => p.name).join(', ')
    : first.length > 1
      ? `${first.map((r) => m.players[r.index].name).join(' & ')} tied`
      : `${m.players[first[0].index].name} won`;
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/40 p-2.5 ring-1 ring-white/15">
      <span className="text-2xl" aria-hidden="true">{m.finished ? '🏆' : '🔤'}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg" style={SHOW_FONT}>{headline}</p>
        <p className="truncate text-xs font-semibold text-white/75">
          {s.standings.map((r) => `${m.players[r.index].name} ${r.total}`).join(' · ')} · {new Date(game.updatedAt || game.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      {onOpen && (
        <button type="button" onClick={onOpen} className="toy shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-base text-white [--toy-edge:theme(colors.emerald.800)]" style={SHOW_FONT}>
          Carry on
        </button>
      )}
      <button type="button" onClick={onDelete} aria-label="Delete this game" className="press shrink-0 rounded-full p-2 text-white/65 hover:text-rose-300">
        <Trash2 className="h-5 w-5" aria-hidden="true" />
      </button>
    </li>
  );
}
