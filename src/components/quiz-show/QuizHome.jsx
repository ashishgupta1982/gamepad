import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronDown, Trash2, X } from 'lucide-react';
import MuteButton from '@/components/arcade/MuteButton';
import { play } from '@/components/arcade/sfx';
import { useSeenPlayers } from './data';
import { MIN_FOR_RANKING, leaderboard, playerStats } from '@/lib/quiz/stats';
import { Avatar, Marquee, SHOW_FONT } from './ui';

// The quiz's front door. The room only leads here; carrying on, starting,
// joining and looking back are all chosen here (Ash, 2026-10-21).
export default function QuizHome({ resume, onResume, onDismissResume, onStart, onJoin, onHistory, onBack }) {
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
          <div className="relative">
            <BigChoice emoji="▶️" title="Carry on" text={resume} tone="bg-violet-500 pr-14 text-white [--toy-edge:theme(colors.violet.800)]" onClick={onResume} />
            <button
              type="button"
              onClick={() => {
                play('back');
                onDismissResume();
              }}
              aria-label="Forget this game"
              className="press absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
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
// easy reset: forgetting a name lets their questions come round again. Folded
// to one line until opened (Ash, 2026-10-21: it was too prominent). Everyone
// sees the list; only an admin gets Forget (Ash, 2026-10-23), and the server
// refuses it from anyone else (api/quiz/seen.js).
function Remembered() {
  const { players, forget } = useSeenPlayers();
  const { data: session } = useSession();
  const admin = session?.user?.role === 'admin';
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState(false);
  if (!players.length) return null;
  return (
    <section className="mt-5 rounded-2xl bg-black/25 ring-1 ring-white/10">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full min-w-0 items-center gap-2 px-4 py-2.5 text-left">
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-white/85">
          No repeats for {players.length === 1 ? players[0].name : `${players.length} players`}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm font-semibold text-white/75">
            Each player is kept from questions they have had before.{admin && ' Forget someone to let theirs come round again.'}
          </p>
          <ul className="mt-3 space-y-2">
            {players.map((p) => (
              <li key={p.name} className="flex min-w-0 items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-lg" style={SHOW_FONT}>{p.name}</span>
                <span className="shrink-0 text-sm font-semibold text-white/70">{p.count} seen</span>
                {admin && (
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
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
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

// Your quizzes, for a signed-in player (Ash, 2026-10-22): a leaderboard by
// wins or by share right, each player's numbers with their best and worst
// category, then the past games, Together and Solo apart, each deletable.
export function History({ onBack }) {
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');
  const [rankBy, setRankBy] = useState('wins');
  const [who, setWho] = useState(null);
  const [tab, setTab] = useState('together');
  useEffect(() => {
    fetch('/api/quiz/history')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load your quizzes.'))))
      .then((d) => setGames(d.games))
      .catch((err) => setError(err.message));
  }, []);
  const stats = useMemo(() => playerStats(games || []), [games]);
  const board = useMemo(() => leaderboard(stats, rankBy), [stats, rankBy]);
  const me = stats.find((s) => s.key === who) || stats[0] || null;
  const together = (games || []).filter((g) => g.players.length > 1);
  const solo = (games || []).filter((g) => g.players.length <= 1);
  const shown = tab === 'together' ? together : solo;

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

      {games?.length > 0 && (
        <>
          <section className="rounded-3xl bg-white/95 p-4 text-[#241a45]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-2xl" style={SHOW_FONT}>Leaderboard</h2>
              <Toggle
                value={rankBy}
                onChange={setRankBy}
                options={[
                  ['wins', 'Most wins'],
                  ['pct', '% right'],
                ]}
              />
            </div>
            {board.length ? (
              <ol className="mt-3 space-y-2">
                {board.map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => {
                        play('tap');
                        setWho(s.key);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left ${me?.key === s.key ? 'bg-violet-100 ring-2 ring-violet-400' : 'bg-[#f1eefb]'}`}
                    >
                      <span className="w-8 text-center text-2xl" style={SHOW_FONT}>{MEDALS[s.place - 1] || s.place}</span>
                      <Avatar player={s} size={36} />
                      <span className="min-w-0 flex-1 truncate text-lg" style={SHOW_FONT}>{s.name}</span>
                      <span className="text-right">
                        <span className="block text-xl tnum" style={SHOW_FONT}>{rankBy === 'pct' ? `${s.pct}%` : s.wins}</span>
                        <span className="block text-xs font-semibold text-[#6b6390]">
                          {rankBy === 'pct' ? `of ${s.asked} questions` : `${s.wins === 1 ? 'win' : 'wins'} in ${s.together} ${s.together === 1 ? 'game' : 'games'}`}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm font-semibold text-[#6b6390]">
                {rankBy === 'pct' ? `A player joins once they have answered ${MIN_FOR_RANKING} questions.` : 'Wins count in games with two or more players. Play one together!'}
              </p>
            )}
          </section>

          {me && (
            <section className="rounded-3xl bg-white/95 p-4 text-[#241a45]">
              <div className="-mx-1 flex flex-wrap gap-2">
                {stats.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      play('tap');
                      setWho(s.key);
                    }}
                    aria-pressed={me.key === s.key}
                    className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-sm font-bold ${me.key === s.key ? 'bg-violet-600 text-white' : 'bg-[#f1eefb] text-[#241a45]'}`}
                  >
                    <Avatar player={s} size={26} />
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat label="Questions" value={me.asked} />
                <Stat label="Right" value={`${me.right}`} sub={`${me.pct}%`} />
                <Stat label="Games" value={me.games} />
                <Stat label="Wins" value={me.wins} sub={me.together ? `of ${me.together} together` : 'none together yet'} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <CategoryStat label="Best category" tone="bg-emerald-100 text-emerald-900" cat={me.best} />
                <CategoryStat label="Worst category" tone="bg-rose-100 text-rose-900" cat={me.worst} />
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-2xl" style={SHOW_FONT}>Past games</h2>
              <Toggle
                value={tab}
                onChange={setTab}
                light
                options={[
                  ['together', `Together (${together.length})`],
                  ['solo', `Solo (${solo.length})`],
                ]}
              />
            </div>
            {!shown.length && <p className="text-white/80">{tab === 'together' ? 'No games with two or more players yet.' : 'No solo games yet.'}</p>}
            <ul className="space-y-3">
              {shown.map((g) => (
                <PastGame key={g.id} game={g} onRemove={() => remove(g.id)} />
              ))}
            </ul>
          </section>
        </>
      )}
      <Link href="/" className="mt-auto text-center text-sm font-semibold text-white/70">Back to the games room</Link>
    </div>
  );
}

const MEDALS = ['🥇', '🥈', '🥉'];

function Toggle({ value, onChange, options, light = false }) {
  return (
    <div className={`flex shrink-0 rounded-full p-1 ${light ? 'bg-white/20' : 'bg-[#f1eefb]'}`} role="group">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            play('tap');
            onChange(id);
          }}
          aria-pressed={value === id}
          className={`rounded-full px-3 py-1 text-sm font-bold ${value === id ? 'bg-violet-600 text-white' : light ? 'text-white' : 'text-[#6b6390]'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-[#f1eefb] px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6b6390]">{label}</p>
      <p className="text-3xl tnum" style={SHOW_FONT}>
        {value}
        {sub && <span className="ml-1.5 text-sm font-semibold text-[#6b6390]">{sub}</span>}
      </p>
    </div>
  );
}

function CategoryStat({ label, tone, cat }) {
  return (
    <div className={`rounded-2xl px-3 py-2 ${tone}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-75">{label}</p>
      {cat ? (
        <>
          <p className="truncate text-lg leading-tight" style={SHOW_FONT}>{cat.name}</p>
          <p className="text-xs font-semibold opacity-80">{cat.pct}% of {cat.asked}</p>
        </>
      ) : (
        <p className="text-sm font-semibold opacity-80">Play a few more to find out</p>
      )}
    </div>
  );
}

function PastGame({ game: g, onRemove }) {
  const winner = g.players[0];
  return (
    <li className="flex items-center gap-3 rounded-3xl bg-white/95 p-3 text-[#241a45]">
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
      <button type="button" onClick={onRemove} aria-label="Delete this quiz" className="press rounded-full p-2 text-[#6b6390] hover:text-rose-600">
        <Trash2 className="h-5 w-5" aria-hidden="true" />
      </button>
    </li>
  );
}
