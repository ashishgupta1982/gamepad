import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Pencil, Plus, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { play } from '@/components/arcade/sfx';
import { CATEGORIES, LEVELS, QUESTION_COUNTS, TIMERS } from '@/lib/quiz/catalogue';
import { cn } from '@/lib/cn';
import { fetchQuestions, useCustomCategories } from './data';
import { Avatar, SHOW_FONT, ShowButton } from './ui';

// Setting up a quiz: how you're playing, who's playing, what about, and for
// whom. One step per screen, big targets, Back and Next at the bottom.

export const AVATARS = ['🦊', '🐸', '🦉', '🐙', '🦁', '🐯', '🐻', '🦄', '🐲', '🐬', '🦋', '🐢', '🦈', '🐺', '🦜', '🐼'];
export const COLORS = ['#e11d48', '#2563eb', '#d97706', '#16a34a', '#9333ea', '#ea580c', '#0d9488', '#db2777', '#4f46e5', '#65a30d', '#0891b2', '#c026d3'];
const MAX_TOPICS = 6;
const MAX_PLAYERS = 12;

export const makePlayer = (i, name) => ({
  id: `p${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 5)}`,
  name: name || `Player ${i + 1}`,
  avatar: AVATARS[i % AVATARS.length],
  color: COLORS[i % COLORS.length],
});

const MODES = [
  { id: 'solo', emoji: '🎯', name: 'Just me', text: 'Answer on this phone against the clock.' },
  { id: 'shout', emoji: '📣', name: 'Shout it out', text: 'One screen shows the question, everyone shouts, the quizmaster scores.' },
  { id: 'multi', emoji: '📱', name: 'Everyone on their phones', text: 'Players join with a code and answer on their own phone.' },
];

export default function Setup({ initial, onStart, onCancel }) {
  const { data: session } = useSession();
  const custom = useCustomCategories();
  const [step, setStep] = useState(initial?.mode ? 1 : 0);
  const [mode, setMode] = useState(initial?.mode || null);
  const [players, setPlayers] = useState(initial?.players || [makePlayer(0, session?.user?.name?.split(' ')[0])]);
  const [picks, setPicks] = useState(initial?.picks || ['general']);
  const [level, setLevel] = useState(initial?.level || 'family');
  const [count, setCount] = useState(initial?.count || 10);
  const [timer, setTimer] = useState(initial?.timer || 20);
  const [editing, setEditing] = useState(null); // a custom category being made or changed

  const steps = mode === 'multi' ? ['mode', 'topics', 'level'] : ['mode', 'players', 'topics', 'level'];
  const at = steps[step];

  const go = (d) => {
    play('tap');
    if (step + d < 0) return onCancel();
    setStep(step + d);
  };

  const pickKey = (p) => (typeof p === 'string' ? p : p.id);
  const isPicked = (key) => picks.some((p) => pickKey(p) === key);
  const toggle = (p) => {
    play('tap');
    const key = pickKey(p);
    setPicks((list) => (list.some((x) => pickKey(x) === key) ? list.filter((x) => pickKey(x) !== key) : list.length >= MAX_TOPICS ? list : [...list, p]));
  };

  const finish = () => {
    play('go');
    onStart({
      mode,
      players: mode === 'multi' ? [] : players.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` })),
      picks: picks.length ? picks : ['general'],
      level,
      count,
      timer,
    });
  };

  const canNext =
    at === 'mode' ? !!mode : at === 'players' ? players.length >= 1 && (mode !== 'shout' || players.length >= 1) : at === 'topics' ? picks.length > 0 : true;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => go(-1)} aria-label="Back" className="toy flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span key={s} className={cn('h-2 flex-1 rounded-full', i <= step ? 'bg-amber-300' : 'bg-white/25')} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={at} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.22 }} className="flex-1 py-5">
          {at === 'mode' && (
            <Section title="How are you playing?">
              <div className="grid grid-cols-1 gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      play('tap');
                      setMode(m.id);
                      if (m.id === 'solo') setPlayers((ps) => ps.slice(0, 1));
                    }}
                    className={cn(
                      'toy flex items-center gap-4 rounded-3xl p-4 text-left',
                      mode === m.id ? 'bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]' : 'bg-white/95 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]',
                    )}
                    aria-pressed={mode === m.id}
                  >
                    <span className="text-4xl" aria-hidden="true">{m.emoji}</span>
                    <span>
                      <span className="block text-2xl leading-tight" style={SHOW_FONT}>{m.name}</span>
                      <span className="block text-sm font-semibold opacity-80">{m.text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {at === 'players' && (
            <Section title={mode === 'solo' ? 'Who’s playing?' : 'Who’s round the table?'} sub={mode === 'shout' ? 'The quizmaster taps who got each one right.' : null}>
              <ul className="space-y-2.5">
                {players.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2 rounded-2xl bg-white/95 p-2 text-[#241a45]">
                    <button
                      type="button"
                      onClick={() => setPlayers((ps) => ps.map((x, j) => (j === i ? { ...x, avatar: AVATARS[(AVATARS.indexOf(x.avatar) + 1) % AVATARS.length] } : x)))}
                      aria-label="Change avatar"
                      className="press"
                    >
                      <Avatar player={p} size={44} />
                    </button>
                    <input
                      value={p.name}
                      onChange={(e) => setPlayers((ps) => ps.map((x, j) => (j === i ? { ...x, name: e.target.value.slice(0, 20) } : x)))}
                      className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-2 text-xl outline-none focus:bg-violet-50"
                      style={SHOW_FONT}
                      aria-label={`Player ${i + 1} name`}
                    />
                    {players.length > 1 && (
                      <button type="button" onClick={() => setPlayers((ps) => ps.filter((_, j) => j !== i))} aria-label={`Remove ${p.name}`} className="press rounded-full p-2 text-[#6b6390]">
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {mode === 'shout' && players.length < MAX_PLAYERS && (
                <button
                  type="button"
                  onClick={() => {
                    play('pop');
                    setPlayers((ps) => [...ps, makePlayer(ps.length)]);
                  }}
                  className="toy mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 text-lg text-white ring-2 ring-white/40 [--toy-edge:rgba(0,0,0,0.2)]"
                  style={SHOW_FONT}
                >
                  <Plus className="h-5 w-5" aria-hidden="true" /> Add a player
                </button>
              )}
            </Section>
          )}

          {at === 'topics' && (
            <Section title="What’s it about?" sub={`Pick up to ${MAX_TOPICS}. Questions are shared out between them.`}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <TopicTile key={c.id} emoji={c.emoji} name={c.name} on={isPicked(c.id)} onClick={() => toggle(c.id)} />
                ))}
                {custom.list.map((c) => (
                  <TopicTile key={c.id} emoji={c.emoji} name={c.name} on={isPicked(c.id)} custom onClick={() => toggle(c)} onEdit={() => setEditing(c)} />
                ))}
                {!custom.full && (
                  <button
                    type="button"
                    onClick={() => setEditing({ name: '', description: '', emoji: '✨' })}
                    className="toy flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-white/60 bg-white/10 p-2 text-white [--toy-edge:rgba(0,0,0,0.2)]"
                  >
                    <Plus className="h-6 w-6" aria-hidden="true" />
                    <span className="text-sm font-bold">Your own</span>
                  </button>
                )}
              </div>
            </Section>
          )}

          {at === 'level' && (
            <Section title="Who’s it for?" sub="Everyone gets the same questions.">
              <div className="grid grid-cols-1 gap-2">
                {LEVELS.map((l) => (
                  <Chip key={l.id} on={level === l.id} onClick={() => setLevel(l.id)}>
                    <span className="text-2xl" aria-hidden="true">{l.emoji}</span>
                    <span className="flex-1 text-xl" style={SHOW_FONT}>{l.name}</span>
                    <span className="text-sm font-semibold opacity-75">{l.ages}</span>
                  </Chip>
                ))}
              </div>
              <h3 className="mt-6 text-xl" style={SHOW_FONT}>How many questions?</h3>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {QUESTION_COUNTS.map((n) => (
                  <Chip key={n} on={count === n} onClick={() => setCount(n)} center>
                    <span className="text-2xl" style={SHOW_FONT}>{n}</span>
                  </Chip>
                ))}
              </div>
              <h3 className="mt-6 text-xl" style={SHOW_FONT}>Time to answer</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TIMERS.map((t) => (
                  <Chip key={t.seconds} on={timer === t.seconds} onClick={() => setTimer(t.seconds)} center>
                    <span className="flex flex-col items-center">
                      <span className="text-2xl" style={SHOW_FONT}>{t.seconds}s</span>
                      <span className="text-xs font-semibold opacity-75">{t.name}</span>
                    </span>
                  </Chip>
                ))}
              </div>
            </Section>
          )}
        </motion.div>
      </AnimatePresence>

      {at === 'level' ? (
        <ShowButton onClick={finish}>{mode === 'multi' ? 'Open the doors!' : 'Let’s play!'}</ShowButton>
      ) : (
        <ShowButton onClick={() => go(1)} disabled={!canNext}>
          Next
        </ShowButton>
      )}

      <CategorySheet
        value={editing}
        level={level}
        onClose={() => setEditing(null)}
        onSave={async (c) => {
          const saved = await custom.upsert(c);
          const made = saved.find((x) => x.name.toLowerCase() === c.name.trim().toLowerCase());
          if (made && !isPicked(made.id) && !c.id) setPicks((list) => (list.length >= MAX_TOPICS ? list : [...list, made]));
          setPicks((list) => list.map((p) => (typeof p !== 'string' && made && p.id === made.id ? made : p)));
          setEditing(null);
        }}
        onDelete={async (c) => {
          await custom.remove(c.id);
          setPicks((list) => list.filter((p) => typeof p === 'string' || p.id !== c.id));
          setEditing(null);
        }}
      />
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <section>
      <h2 className="text-4xl leading-tight drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]" style={SHOW_FONT}>
        {title}
      </h2>
      {sub && <p className="mt-1 text-base font-semibold text-white/85">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Chip({ on, onClick, center, children }) {
  return (
    <button
      type="button"
      onClick={() => {
        play('tap');
        onClick();
      }}
      aria-pressed={on}
      className={cn(
        'toy flex min-h-[56px] items-center gap-3 rounded-2xl px-4 py-2',
        center && 'justify-center',
        on ? 'bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]' : 'bg-white/95 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]',
      )}
    >
      {children}
    </button>
  );
}

function TopicTile({ emoji, name, on, onClick, custom, onEdit }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={on}
        className={cn(
          'toy flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-2xl p-2 text-center',
          on ? 'bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]' : 'bg-white/95 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]',
        )}
      >
        <span className="text-2xl" aria-hidden="true">{emoji}</span>
        <span className="line-clamp-2 text-sm font-bold leading-tight">{name}</span>
      </button>
      {custom && (
        <button type="button" onClick={onEdit} aria-label={`Edit ${name}`} className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

const EMOJIS = ['✨', '🧙', '🦖', '🚂', '🚀', '🎮', '⚽', '🎵', '🐶', '🍰', '🏰', '🌋', '🧪', '🎨', '📺', '👑', '🏴‍☠️', '🧜'];

// Make or change a category of your own, with a sample question to check the
// writer has understood it before a whole quiz is spent on it.
function CategorySheet({ value, level, onClose, onSave, onDelete }) {
  const [draft, setDraft] = useState(value);
  const [sample, setSample] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const open = !!value;
  if (open && draft?.__for !== value) {
    setDraft({ ...value, __for: value });
    setSample(null);
    setError('');
  }

  const run = async (what, fn) => {
    setBusy(what);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={value?.id ? 'Edit your category' : 'Make your own category'}>
        {draft && (
          <div className="space-y-4 pb-2">
            <label className="block">
              <span className="mb-1 block text-sm font-bold">Name</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value.slice(0, 40) })}
                placeholder="e.g. Harry Potter"
                className="w-full rounded-2xl border-2 border-border px-3 py-2.5 text-lg focus:border-violet-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold">What should it cover? (optional)</span>
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value.slice(0, 200) })}
                placeholder="e.g. the books, not the films: spells, creatures and who said what"
                rows={3}
                className="w-full rounded-2xl border-2 border-border px-3 py-2.5 focus:border-violet-500 focus:outline-none"
              />
            </label>
            <div>
              <span className="mb-1 block text-sm font-bold">Picture</span>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setDraft({ ...draft, emoji: e })}
                    aria-pressed={draft.emoji === e}
                    className={cn('flex h-10 w-10 items-center justify-center rounded-xl text-xl', draft.emoji === e ? 'bg-violet-600 ring-2 ring-violet-300' : 'bg-muted')}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {sample && (
              <div className="rounded-2xl bg-violet-50 p-3 text-[#241a45]">
                <p className="text-xs font-bold uppercase tracking-wide text-violet-700">A sample question</p>
                <p className="mt-1 font-semibold">{sample.question}</p>
                <p className="mt-1 text-sm">
                  Answer: <b>{sample.options[sample.correctAnswer]}</b>
                </p>
              </div>
            )}
            {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!draft.name.trim() || !!busy}
                onClick={() =>
                  run('sample', async () => {
                    const [q] = await fetchQuestions({ picks: [{ name: draft.name, description: draft.description }], level, count: 1 });
                    setSample(q || null);
                  })
                }
                className="toy flex-1 rounded-2xl bg-white py-3 font-bold text-[#241a45] ring-2 ring-inset ring-violet-200 [--toy-edge:#d9d2f2] disabled:opacity-50"
              >
                {busy === 'sample' ? 'Thinking…' : 'Try a question'}
              </button>
              <button
                type="button"
                disabled={!draft.name.trim() || !!busy}
                onClick={() => run('save', () => onSave({ id: value.id, name: draft.name, description: draft.description, emoji: draft.emoji }))}
                className="toy flex-1 rounded-2xl bg-violet-600 py-3 font-bold text-white [--toy-edge:theme(colors.violet.800)] disabled:opacity-50"
              >
                {busy === 'save' ? 'Saving…' : 'Save'}
              </button>
            </div>
            {value?.id && (
              <button type="button" onClick={() => run('delete', () => onDelete(value))} className="w-full text-center text-sm font-semibold text-destructive">
                Delete this category
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
