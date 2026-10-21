import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Dices, Plus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { play } from '@/components/arcade/sfx';
import { AVATARS, makePlayer } from '@/components/arcade/players';
import { Avatar } from '@/components/quiz-show/ui';
import { MAX_PLAYERS, MIN_PLAYERS, newMatch } from '@/lib/scrabble/rules';
import { cn } from '@/lib/cn';
import { handoffOn, setHandoff } from './store';
import { BigButton, SHOW_FONT, TopBar } from './ui';

// Who's playing (two to four, Scrabble's limit) and who goes first. The order
// on this screen is the order round the table. `initial` is the last game's
// players, for "New game" after one.

export default function Setup({ initial, recent = [], onStart, onCancel }) {
  const { status } = useSession();
  const [players, setPlayers] = useState(() => (initial?.length ? initial : [makePlayer(0, ''), makePlayer(1, '')]));
  const [first, setFirst] = useState(0);
  const [handoff, setHandoffState] = useState(true);
  // Read after mount: the server has no localStorage.
  useEffect(() => setHandoffState(handoffOn()), []);

  const named = players.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` }));
  const firstIndex = Math.min(first, players.length - 1);

  const start = () => {
    play('go');
    onStart(newMatch({ players: named, first: firstIndex }));
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
  const removePlayer = (i) => {
    setPlayers((list) => list.filter((_, k) => k !== i));
    if (first > i) setFirst(first - 1);
  };
  const fillName = (name) => {
    const empty = players.findIndex((p) => !p.name.trim() || /^Player \d+$/.test(p.name));
    if (empty >= 0) setName(empty, name);
    else addPlayer(name);
  };
  const unused = recent.filter((n) => !players.some((p) => p.name.trim() === n));

  const shuffleFirst = () => {
    play('deal');
    setFirst(Math.floor(Math.random() * players.length));
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <TopBar
        onBack={() => {
          play('back');
          onCancel();
        }}
      >
        New game
      </TopBar>

      <h1 className="mt-6 text-center text-4xl drop-shadow" style={SHOW_FONT}>Who&apos;s playing?</h1>
      <ul className="mt-5 space-y-2.5">
        <AnimatePresence initial={false}>
          {players.map((p, i) => (
            <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-2 rounded-2xl bg-[#fbf0d6] p-2 text-[#3b2414]">
              <button type="button" onClick={() => cycleAvatar(i)} aria-label="Change face" className="press rounded-full">
                <Avatar player={p} size={44} />
              </button>
              <input
                value={p.name}
                onChange={(e) => setName(i, e.target.value.slice(0, 20))}
                placeholder={`Player ${i + 1}`}
                aria-label={`Player ${i + 1} name`}
                className="min-w-0 flex-1 bg-transparent px-1 text-xl outline-none placeholder:text-[#b39b78]"
                style={SHOW_FONT}
              />
              {players.length > MIN_PLAYERS && (
                <button type="button" onClick={() => removePlayer(i)} aria-label={`Remove ${p.name || `player ${i + 1}`}`} className="press flex h-10 w-10 items-center justify-center rounded-full text-[#7a5c3e] hover:bg-black/5">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {players.length < MAX_PLAYERS && (
        <button type="button" onClick={() => addPlayer()} className="press mt-3 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/55 text-xl text-white/90" style={SHOW_FONT}>
          <Plus className="h-5 w-5" aria-hidden="true" /> Add a player
        </button>
      )}
      {unused.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-white/80">Played before</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unused.slice(0, 10).map((n) => (
              <button key={n} type="button" onClick={() => fillName(n)} disabled={players.length >= MAX_PLAYERS && !players.some((p) => !p.name.trim())} className="press rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/30 disabled:opacity-40">
                + {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl drop-shadow" style={SHOW_FONT}>Who goes first?</h2>
          <button type="button" onClick={shuffleFirst} className="press flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/30">
            <Dices className="h-4 w-4" aria-hidden="true" /> Pick for us
          </button>
        </div>
        <p className="mt-1 text-xs font-semibold text-white/75">The usual way: everyone draws a tile, nearest to A goes first. Then round in the order above.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {named.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={i === firstIndex}
              onClick={() => {
                play('tap');
                setFirst(i);
              }}
              className={cn(
                'toy flex min-h-[48px] min-w-0 items-center gap-2 rounded-2xl px-2.5 text-left text-lg',
                i === firstIndex ? 'bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]' : 'bg-[#fbf0d6] text-[#3b2414] [--toy-edge:#b08a4f]',
              )}
              style={SHOW_FONT}
            >
              <Avatar player={p} size={30} />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={handoff}
        onClick={() => {
          play('tap');
          setHandoff(!handoff);
          setHandoffState(!handoff);
        }}
        className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-black/35 p-3 text-left ring-1 ring-white/15"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xl" style={SHOW_FONT}>Pass the phone</span>
          <span className="block text-sm font-semibold text-white/75">After each turn, a card says whose go it is next.</span>
        </span>
        <span className={cn('relative h-8 w-14 shrink-0 rounded-full transition-colors', handoff ? 'bg-emerald-500' : 'bg-white/30')}>
          <span className={cn('absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left]', handoff ? 'left-7' : 'left-1')} />
        </span>
      </button>

      {status === 'unauthenticated' && (
        <p className="mt-5 text-center text-sm font-semibold text-white/80">Playing as a guest: the game is kept on this phone. Sign in to keep your games on your account.</p>
      )}

      <div className="mt-auto pt-6">
        <BigButton onClick={start}>Let&apos;s play!</BigButton>
      </div>
    </div>
  );
}
