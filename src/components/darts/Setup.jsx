import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info, Plus, Shuffle, X } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { AVATARS, makePlayer } from '@/components/arcade/players';
import { Avatar } from '@/components/quiz-show/ui';
import { GAME_MODES, X01_LEGS_OPTIONS, X01_STARTING_SCORES } from '@/data/dartsConstants';
import { KILLER_DEFAULTS, X01_DEFAULTS, killerNumbers, newMatch } from '@/lib/darts/rules';
import { cn } from '@/lib/cn';
import { BigButton, Chip, SHOW_FONT, TopBar } from './ui';

// Setting up a game: which game, who's playing, then the game's own options
// (X01 and Killer have some; Cricket and Around the Clock go straight in).
// `initial` is the last game's setup, for "New game" after one.

const MAX_PLAYERS = 8;
const BLURB = {
  x01: 'Race down to zero. 501, 301 and friends.',
  cricket: 'Close 15 to 20 and the bull, and score on what they have not.',
  'around-the-clock': '1 to 20 in order, then the bull. Great for beginners.',
  killer: 'Hit your double to become a killer, then hunt.',
};

export default function Setup({ initial, recent = [], onStart, onCancel }) {
  const [mode, setMode] = useState(initial?.mode || null);
  const [step, setStep] = useState(initial?.mode ? 1 : 0);
  const [players, setPlayers] = useState(() => initial?.players?.length ? initial.players : [makePlayer(0, ''), makePlayer(1, '')]);
  const [x01, setX01] = useState({ ...X01_DEFAULTS, ...(initial?.mode === 'x01' ? initial.settings : {}) });
  const [lives, setLives] = useState(initial?.mode === 'killer' ? initial.settings.lives : KILLER_DEFAULTS.lives);
  const [numbers, setNumbers] = useState(() => killerNumbers(MAX_PLAYERS));
  const [rules, setRules] = useState(null);

  const minPlayers = mode === 'killer' ? 2 : 1;
  const hasOptions = mode === 'x01' || mode === 'killer';
  const named = players.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` }));

  const pick = (id) => {
    play('tap');
    setMode(id);
    setStep(1);
  };

  const back = () => {
    play('back');
    if (step === 0) return onCancel();
    return setStep(step - 1);
  };

  const start = () => {
    play('go');
    const settings = mode === 'x01' ? x01 : mode === 'killer' ? { lives, numbers: numbers.slice(0, named.length) } : {};
    onStart(newMatch({ mode, players: named, settings }));
  };

  const next = () => {
    if (named.length < minPlayers) return;
    play('tap');
    if (hasOptions) setStep(2);
    else start();
  };

  const setName = (i, name) => setPlayers((list) => list.map((p, k) => (k === i ? { ...p, name } : p)));
  const cycleAvatar = (i) =>
    setPlayers((list) =>
      list.map((p, k) => {
        if (k !== i) return p;
        const taken = new Set(list.map((q) => q.avatar));
        let a = (AVATARS.indexOf(p.avatar) + 1) % AVATARS.length;
        for (let t = 0; t < AVATARS.length && taken.has(AVATARS[a]); t++) a = (a + 1) % AVATARS.length;
        return { ...p, avatar: AVATARS[a] };
      }),
    );
  const addPlayer = (name = '') => {
    if (players.length >= MAX_PLAYERS) return;
    play('pop');
    setPlayers((list) => {
      // A new player takes the first face and colour nobody has.
      let i = list.length;
      const used = new Set(list.map((p) => p.color));
      for (let k = 0; k < 12; k++) if (!used.has(makePlayer(k).color)) { i = k; break; }
      return [...list, makePlayer(i, name)];
    });
  };
  const fillName = (name) => {
    const empty = players.findIndex((p) => !p.name.trim() || /^Player \d+$/.test(p.name));
    if (empty >= 0) setName(empty, name);
    else addPlayer(name);
  };
  const unused = recent.filter((n) => !players.some((p) => p.name.trim() === n));

  const title = step === 0 ? 'New game' : GAME_MODES.find((m) => m.id === mode)?.name;

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <TopBar onBack={back}>{title}</TopBar>

      <AnimatePresence mode="wait">
        <motion.div key={step} className="flex flex-1 flex-col" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.2 }}>
          {step === 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3">
              <h1 className="text-center text-4xl drop-shadow" style={SHOW_FONT}>Pick a game</h1>
              {GAME_MODES.map((m) => (
                <div key={m.id} className="relative">
                  <button type="button" onClick={() => pick(m.id)} className="toy flex w-full min-w-0 items-center gap-4 rounded-3xl bg-white/95 px-5 py-4 pr-14 text-left text-[#16302f] [--toy-edge:rgba(0,0,0,0.3)]">
                    <span className="text-4xl" aria-hidden="true">{m.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-3xl leading-tight" style={SHOW_FONT}>{m.name}</span>
                      <span className="block text-sm font-semibold text-[#3d5d5b]">{BLURB[m.id]}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setRules(m)} aria-label={`How to play ${m.name}`} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[#3d5d5b] hover:bg-black/5">
                    <Info className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 flex flex-1 flex-col">
              <h1 className="text-center text-4xl drop-shadow" style={SHOW_FONT}>Who&apos;s throwing?</h1>
              <ul className="mt-5 space-y-2.5">
                <AnimatePresence initial={false}>
                  {players.map((p, i) => (
                    <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 rounded-2xl bg-white/95 p-2 text-[#16302f]">
                      <button type="button" onClick={() => cycleAvatar(i)} aria-label="Change face" className="press rounded-full">
                        <Avatar player={p} size={44} />
                      </button>
                      <input
                        value={p.name}
                        onChange={(e) => setName(i, e.target.value.slice(0, 20))}
                        placeholder={`Player ${i + 1}`}
                        aria-label={`Player ${i + 1} name`}
                        className="min-w-0 flex-1 bg-transparent px-1 text-xl outline-none placeholder:text-[#9bb1ae]"
                        style={SHOW_FONT}
                      />
                      {players.length > minPlayers && (
                        <button type="button" onClick={() => setPlayers((list) => list.filter((_, k) => k !== i))} aria-label={`Remove ${p.name || `player ${i + 1}`}`} className="press flex h-10 w-10 items-center justify-center rounded-full text-[#5b7a77] hover:bg-black/5">
                          <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {players.length < MAX_PLAYERS && (
                <button type="button" onClick={() => addPlayer()} className="press mt-3 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/50 text-xl text-white/90" style={SHOW_FONT}>
                  <Plus className="h-5 w-5" aria-hidden="true" /> Add a player
                </button>
              )}
              {unused.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-white/75">Played before</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {unused.slice(0, 10).map((n) => (
                      <button key={n} type="button" onClick={() => fillName(n)} className="press rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/30">
                        + {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mode === 'killer' && players.length < 2 && <p className="mt-3 text-center font-semibold text-amber-200">Killer needs at least two players.</p>}
              <div className="mt-auto pt-6">
                <BigButton onClick={next} disabled={named.length < minPlayers}>
                  {hasOptions ? 'Next' : 'Game on!'}
                </BigButton>
              </div>
            </div>
          )}

          {step === 2 && mode === 'x01' && (
            <div className="mt-6 flex flex-1 flex-col gap-5">
              <Option title="Starting score">
                {X01_STARTING_SCORES.map((n) => (
                  <Chip key={n} on={x01.start === n} onClick={() => setX01({ ...x01, start: n })}>{n}</Chip>
                ))}
              </Option>
              <Option title="Legs" note={x01.legs > 1 ? `First to ${Math.ceil(x01.legs / 2)} wins` : 'A single leg'}>
                {X01_LEGS_OPTIONS.map((n) => (
                  <Chip key={n} on={x01.legs === n} onClick={() => setX01({ ...x01, legs: n })}>{n === 1 ? 'One' : `Best of ${n}`}</Chip>
                ))}
              </Option>
              <Toggle title="Finish on a double" text="The last dart must be a double or the bull." on={x01.doubleOut} onChange={(v) => setX01({ ...x01, doubleOut: v })} />
              <Toggle title="Start on a double" text="Nothing counts until you hit a double." on={x01.doubleIn} onChange={(v) => setX01({ ...x01, doubleIn: v })} />
              <div className="mt-auto pt-2">
                <BigButton onClick={start}>Game on!</BigButton>
              </div>
            </div>
          )}

          {step === 2 && mode === 'killer' && (
            <div className="mt-6 flex flex-1 flex-col gap-5">
              <Option title="Lives">
                {[3, 5].map((n) => (
                  <Chip key={n} on={lives === n} onClick={() => setLives(n)}>{n} ❤️</Chip>
                ))}
              </Option>
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl" style={SHOW_FONT}>Your numbers</h2>
                  <button type="button" onClick={() => { play('deal'); setNumbers(killerNumbers(MAX_PLAYERS)); }} className="press flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/30">
                    <Shuffle className="h-4 w-4" aria-hidden="true" /> Shuffle
                  </button>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {named.map((p, i) => (
                    <li key={p.id} className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/95 p-2 text-[#16302f]">
                      <Avatar player={p} size={36} />
                      <span className="min-w-0 flex-1 truncate text-lg" style={SHOW_FONT}>{p.name}</span>
                      <span className="rounded-xl px-2 py-0.5 text-xl text-white" style={{ ...SHOW_FONT, background: p.color }}>D{numbers[i]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto pt-2">
                <BigButton onClick={start}>Game on!</BigButton>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <RulesSheet mode={rules} onClose={() => setRules(null)} />
    </div>
  );
}

function Option({ title, note, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-2xl" style={SHOW_FONT}>{title}</h2>
        {note && <span className="text-sm font-semibold text-white/75">{note}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Toggle({ title, text, on, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => { play('tap'); onChange(!on); }} className="flex w-full items-center gap-3 rounded-2xl bg-white/95 p-3 text-left text-[#16302f]">
      <span className="min-w-0 flex-1">
        <span className="block text-xl" style={SHOW_FONT}>{title}</span>
        <span className="block text-sm font-semibold text-[#3d5d5b]">{text}</span>
      </span>
      <span className={cn('relative h-8 w-14 shrink-0 rounded-full transition-colors', on ? 'bg-emerald-500' : 'bg-[#c4d2d0]')}>
        <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]', on ? 'left-7' : 'left-1')} />
      </span>
    </button>
  );
}

/** How to play one of the games. */
export function RulesSheet({ mode, onClose }) {
  return (
    <AnimatePresence>
      {mode && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-3 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-label={`How to play ${mode.name}`}
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 text-[#16302f]"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden="true">{mode.icon}</span>
              <h2 className="flex-1 text-3xl" style={SHOW_FONT}>{mode.name}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="press flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-4 space-y-3">
              {mode.rules.map((rule, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-300 text-sm font-bold text-amber-950">{i + 1}</span>
                  <span className="text-base leading-relaxed">{rule}</span>
                </li>
              ))}
            </ol>
            <BigButton className="mt-5" onClick={onClose}>Got it</BigButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
