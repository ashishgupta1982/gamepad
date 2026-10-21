import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { cn } from '@/lib/cn';

// Two big buttons, then one short form. A join link (?code=) skips straight to
// the join form with the code filled in.
export default function StartScreen({ onCreate, onJoin, busy, initialCode = '' }) {
  const [mode, setMode] = useState(initialCode ? 'join' : null); // null | 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState(initialCode.toUpperCase().slice(0, 6));
  const [error, setError] = useState('');

  const choose = (m) => {
    play('tap');
    setError('');
    setMode(m);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Give your team a name first.');
    if (mode === 'join' && code.trim().length !== 6) return setError('The code is six letters and numbers.');
    try {
      if (mode === 'create') await onCreate(name.trim());
      else await onJoin(code.trim().toUpperCase(), name.trim());
    } catch (err) {
      play('error');
      setError(err?.message || 'That did not work. Try again?');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-4">
      <div className="text-center">
        <motion.div
          className="text-7xl"
          animate={{ y: [0, -6, 0], rotate: [0, -2, 2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          🚗
        </motion.div>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-game-bingo-deep">Travel Bingo</h1>
        <p className="mt-1 text-base text-muted-foreground">Spot it, stamp it, race the other cars to a full card.</p>
      </div>

      {!mode && (
        <div className="mt-8 grid gap-4">
          <BigButton onClick={() => choose('create')} className="bg-game-bingo text-white [--toy-edge:hsl(var(--game-bingo-deep))]">
            <span className="text-3xl" aria-hidden="true">🏁</span>
            <span>
              <span className="block text-2xl">Start a game</span>
              <span className="block text-sm font-semibold opacity-85">You get a code to send the others</span>
            </span>
          </BigButton>
          <BigButton onClick={() => choose('join')} className="bg-amber-400 text-amber-950 [--toy-edge:theme(colors.amber.600)]">
            <span className="text-3xl" aria-hidden="true">🎟️</span>
            <span>
              <span className="block text-2xl">Join a game</span>
              <span className="block text-sm font-semibold opacity-85">Got a code? Type it in</span>
            </span>
          </BigButton>
        </div>
      )}

      {mode && (
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="toy-flat mt-8 space-y-4 rounded-3xl bg-white p-5 [--toy-edge:hsl(var(--border))]"
        >
          <button
            type="button"
            onClick={() => choose(null)}
            className="press -ml-1 flex items-center gap-1 text-sm font-semibold text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
          </button>

          {mode === 'join' && (
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-foreground">Game code</span>
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="ABC123"
                className="w-full rounded-2xl border-2 border-border bg-muted/40 px-4 py-3 text-center font-mono text-3xl font-bold tracking-[0.35em] focus:border-game-bingo focus:outline-none"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-bold text-foreground">Your team name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 30))}
              placeholder="e.g. Back seat, or The Smiths"
              className="w-full rounded-2xl border-2 border-border bg-muted/40 px-4 py-3 text-lg focus:border-game-bingo focus:outline-none"
              autoFocus={mode === 'create' || !!initialCode}
            />
          </label>

          {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="toy flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-game-bingo font-display text-xl font-extrabold text-white [--toy-edge:hsl(var(--game-bingo-deep))] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {mode === 'create' ? 'Start the game' : 'Jump in'}
          </button>
        </motion.form>
      )}
    </div>
  );
}

function BigButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn('toy flex items-center gap-4 rounded-3xl px-5 py-5 text-left font-display font-extrabold', className)}
      {...props}
    >
      {children}
    </button>
  );
}
