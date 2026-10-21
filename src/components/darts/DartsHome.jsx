import { motion, useReducedMotion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { GAME_MODES } from '@/data/dartsConstants';
import { isMatch, replay, summary } from '@/lib/darts/rules';
import Dartboard from './Dartboard';
import { SHOW_FONT, TopBar } from './ui';

// Darts' front door. The room only leads here: carrying on, starting a game
// and looking back are all chosen here (Ash, 2026-10-21). The board hangs in
// the lamp-lit spot on the wall, and a dart flies into the treble 20.

const modeName = (id) => GAME_MODES.find((m) => m.id === id)?.name || 'Darts';

export default function DartsHome({ resume, accountGames, onResume, onNew, onOpen, onDelete, onBack }) {
  const reduce = useReducedMotion();
  const games = accountGames || [];
  const saved = games.filter((g) => isMatch(g.dartsConfig?.match));
  const inPlay = saved.filter((g) => g.status === 'active' && g._id !== resume?.serverId && !replay(g.dartsConfig.match).finished);
  const done = saved.filter((g) => g.status === 'completed').slice(0, 12);
  const older = games.filter((g) => !isMatch(g.dartsConfig?.match));

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <TopBar onBack={onBack} backLabel="Back to the games room" />

      <div className="relative mx-auto mt-[6dvh] w-[62%] max-w-[300px]">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }} className="rounded-full shadow-[0_18px_40px_-8px_rgba(0,0,0,0.6)]">
          <Dartboard font={SHOW_FONT} />
        </motion.div>
        {/* The dart's tip is near the bottom-right of the picture (176×340). */}
        <motion.img
          src="/home/dart.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ left: '36.9%', top: '-5.9%', width: '16%', transformOrigin: '82% 95%' }}
          initial={reduce ? false : { x: '-320%', y: '-160%', rotate: -14, opacity: 0 }}
          animate={{ x: '0%', y: '0%', rotate: [null, 0, 7, -3, 0], opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.9, times: [0, 0.35, 0.55, 0.75, 1], ease: 'easeOut' }}
          onAnimationComplete={() => play('thunk')}
        />
      </div>

      <h1 className="mt-5 text-center text-6xl drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]" style={SHOW_FONT}>
        Darts
      </h1>
      <p className="mt-1 text-center text-lg font-semibold text-white/90">Tap the board, we do the maths.</p>

      <div className="mt-auto grid grid-cols-1 gap-3 pt-8">
        {resume && (
          <Choice emoji="▶️" title="Carry on" text={`${modeName(resume.match.mode)} · ${summary(resume.match)}`} tone="bg-violet-500 text-white [--toy-edge:theme(colors.violet.800)]" onClick={onResume} />
        )}
        <Choice emoji="🎯" title="New game" text="X01, Cricket, Around the Clock or Killer" tone="bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]" onClick={onNew} />
      </div>

      {inPlay.length > 0 && (
        <Section title="Still going on your account">
          {inPlay.map((g) => (
            <Row key={g._id} game={g} onOpen={() => onOpen(g)} onDelete={() => onDelete(g)} action="Carry on" />
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

      {older.length > 0 && (
        <Section title="From the old scorer">
          {older.slice(0, 12).map((g) => (
            <li key={g._id} className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/35 p-2.5 ring-1 ring-white/15">
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg" style={SHOW_FONT}>{g.players?.map((p) => p.name).join(', ')}</p>
                <p className="truncate text-xs font-semibold text-white/70">
                  {modeName(g.dartsConfig?.gameMode)} · {new Date(g.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <DeleteButton onClick={() => onDelete(g)} />
            </li>
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
      <h2 className="text-2xl" style={SHOW_FONT}>{title}</h2>
      <ul className="mt-2 space-y-2">{children}</ul>
    </section>
  );
}

function Row({ game, onOpen, onDelete, action }) {
  const m = game.dartsConfig.match;
  const s = replay(m);
  const winner = s.finished ? m.players[s.winner] : null;
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-2xl bg-black/35 p-2.5 ring-1 ring-white/15">
      <span className="text-2xl" aria-hidden="true">{winner ? '🏆' : GAME_MODES.find((x) => x.id === m.mode)?.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg" style={SHOW_FONT}>{winner ? `${winner.name} won` : m.players.map((p) => p.name).join(', ')}</p>
        <p className="truncate text-xs font-semibold text-white/70">
          {modeName(m.mode)}
          {m.mode === 'x01' ? ` ${m.settings.start}` : ''} · {new Date(game.updatedAt || game.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          {winner && m.players.length > 1 ? ` · ${m.players.map((p) => p.name).join(', ')}` : ''}
        </p>
      </div>
      {onOpen && (
        <button type="button" onClick={onOpen} className="toy shrink-0 rounded-xl bg-emerald-500 px-3 py-1.5 text-base text-white [--toy-edge:theme(colors.emerald.800)]" style={SHOW_FONT}>
          {action}
        </button>
      )}
      <DeleteButton onClick={onDelete} />
    </li>
  );
}

function DeleteButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Delete this game" className="press shrink-0 rounded-full p-2 text-white/60 hover:text-rose-300">
      <Trash2 className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
