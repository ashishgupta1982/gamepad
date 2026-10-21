import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'motion/react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import MuteButton from '@/components/arcade/MuteButton';
import { play } from '@/components/arcade/sfx';
import { useSeenPlayers } from './data';
import { Marquee, SHOW_FONT } from './ui';

// The quiz's front door. The room only leads here; carrying on, starting,
// joining and looking back are all chosen here (Ash, 2026-10-21).
export default function QuizHome({ resume, onResume, onStart, onJoin, onHistory, onBack }) {
  const { status } = useSession();
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Back to the games room" className="toy flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="rounded-full bg-white/85 text-[#241a45]">
          <MuteButton />
        </span>
      </div>

      <motion.div className="mt-8 text-center" initial={{ scale: 0.5, rotate: -6, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 13 }}>
        <Marquee>Quiz Night</Marquee>
        <p className="mt-4 text-lg font-semibold text-white/90">Fresh questions every game, for any age.</p>
      </motion.div>

      {/* grid-cols-1 is minmax(0, 1fr): a bare grid sizes its column to the
          widest line, and a one-line subtitle pushed the buttons off a phone. */}
      <div className="mt-auto grid grid-cols-1 gap-3 pt-10">
        {resume && (
          <BigChoice emoji="▶️" title="Carry on" text={resume} tone="bg-violet-500 text-white [--toy-edge:theme(colors.violet.800)]" onClick={onResume} />
        )}
        <BigChoice emoji="🎬" title="Start a quiz" text="Just you, shout it out, or everyone on their phones" tone="bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]" onClick={onStart} />
        <BigChoice emoji="📱" title="Join a quiz" text="Got a code on someone’s screen?" tone="bg-sky-400 text-sky-950 [--toy-edge:theme(colors.sky.700)]" onClick={onJoin} />
        {status === 'authenticated' && (
          <BigChoice emoji="🏆" title="Your quizzes" text="Winners and scores from past games" tone="bg-white/95 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]" onClick={onHistory} />
        )}
      </div>
      <Remembered />
    </div>
  );
}

// Who this account remembers questions for, so nobody gets one twice, and the
// easy reset: forgetting a name lets their questions come round again.
function Remembered() {
  const { players, forget } = useSeenPlayers();
  const [busy, setBusy] = useState('');
  if (!players.length) return null;
  return (
    <section className="mt-6 rounded-3xl bg-black/30 p-4 ring-1 ring-white/15">
      <h2 className="text-xl" style={SHOW_FONT}>No repeats for</h2>
      <p className="text-sm font-semibold text-white/75">Each player is kept from questions they have had before. Forget someone to let theirs come round again.</p>
      <ul className="mt-3 space-y-2">
        {players.map((p) => (
          <li key={p.name} className="flex min-w-0 items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-lg" style={SHOW_FONT}>{p.name}</span>
            <span className="shrink-0 text-sm font-semibold text-white/70">{p.count} seen</span>
            <button
              type="button"
              disabled={!!busy}
              onClick={async () => {
                if (!window.confirm(`Forget the questions ${p.name} has seen?`)) return;
                setBusy(p.name);
                await forget(p.name).catch(() => {});
                setBusy('');
              }}
              className="press shrink-0 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-[#241a45] disabled:opacity-50"
            >
              {busy === p.name ? 'Forgetting…' : 'Forget'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function BigChoice({ emoji, title, text, tone, onClick }) {
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

// Past quizzes for a signed-in player, newest first, each deletable.
export function History({ onBack }) {
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/quiz/history')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load your quizzes.'))))
      .then((d) => setGames(d.games))
      .catch((err) => setError(err.message));
  }, []);

  const remove = async (id) => {
    if (!window.confirm('Delete this quiz from your history?')) return;
    const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
    if (res.ok) setGames((list) => list.filter((g) => g.id !== id));
    else setError('Could not delete that one. Try again?');
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <button type="button" onClick={onBack} aria-label="Back" className="toy flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <h1 className="text-4xl" style={SHOW_FONT}>Your quizzes</h1>
      {error && <p className="rounded-xl bg-rose-500/90 px-3 py-2 font-semibold">{error}</p>}
      {games && !games.length && <p className="text-lg text-white/85">No finished quizzes yet. Play one and it shows up here.</p>}
      <ul className="space-y-3">
        {(games || []).map((g) => {
          const winner = g.players[0];
          return (
            <li key={g.id} className="flex items-center gap-3 rounded-3xl bg-white/95 p-3 text-[#241a45]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl" style={{ background: winner?.color || '#e5e7eb' }} aria-hidden="true">
                {winner?.avatar || '🏆'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xl" style={SHOW_FONT}>
                  {g.players.length > 1 ? `${winner?.name} won` : `${winner?.name}: ${winner?.score}`}
                </p>
                <p className="truncate text-sm font-semibold text-[#6b6390]">
                  {new Date(g.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {g.categories.join(', ')} · {g.count} questions
                </p>
                {g.players.length > 1 && <p className="truncate text-xs text-[#6b6390]">{g.players.map((p) => `${p.name} ${p.score}`).join(' · ')}</p>}
              </div>
              <button type="button" onClick={() => remove(g.id)} aria-label="Delete this quiz" className="press rounded-full p-2 text-[#6b6390] hover:text-rose-600">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <Link href="/" className="mt-auto text-center text-sm font-semibold text-white/70">Back to the games room</Link>
    </div>
  );
}
