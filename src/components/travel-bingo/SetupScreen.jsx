import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Loader2, Plus, Share2, X } from 'lucide-react';
import { BINGO_PACKS } from '@/data/bingoPacks';
import { play } from '@/components/arcade/sfx';
import { cn } from '@/lib/cn';
import { carTone } from './cars';

const MAX_ITEMS = 50;

// Everyone picks what they want to spot. Packs are a tap each; your own items
// are typed. The list saves itself a moment after each change (the old "Save
// my list" button was easy to forget, and then the host dealt without you).
export default function SetupScreen({ game, myCarId, onSaveItems }) {
  const cfg = game.travelBingoConfig;
  const cars = cfg.cars || [];
  const myCar = cars.find((c) => c.carId === myCarId);
  const [items, setItems] = useState(() => myCar?.submittedItems || []);
  const [draft, setDraft] = useState('');
  const [save, setSave] = useState('saved'); // 'saved' | 'saving' | 'failed'
  // Bumped to try a failed save again: a car loses signal and gets it back.
  const [retry, setRetry] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    setSave('saving');
    const t = setTimeout(() => {
      onSaveItems(items)
        .then(() => setSave('saved'))
        .catch(() => {
          setSave('failed');
          setTimeout(() => setRetry((n) => n + 1), 5000);
        });
    }, 700);
    return () => clearTimeout(t);
    // onSaveItems is a fresh function each render; saving on every parent
    // render would loop. Items and the retry tick are what should trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, retry]);

  const has = new Set(items.map((i) => i.toLowerCase()));

  const togglePack = (pack) => {
    play('tap');
    const all = pack.items.every((i) => has.has(i.toLowerCase()));
    if (all) {
      const drop = new Set(pack.items.map((i) => i.toLowerCase()));
      setItems((list) => list.filter((i) => !drop.has(i.toLowerCase())));
    } else {
      setItems((list) => {
        const seen = new Set(list.map((i) => i.toLowerCase()));
        return [...list, ...pack.items.filter((i) => !seen.has(i.toLowerCase()))].slice(0, MAX_ITEMS);
      });
    }
  };

  const addOwn = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v || has.has(v.toLowerCase()) || items.length >= MAX_ITEMS) return;
    play('tap');
    setItems((list) => [...list, v]);
    setDraft('');
  };

  const remove = (item) => setItems((list) => list.filter((i) => i !== item));

  const shareLink = async () => {
    const url = `${window.location.origin}/games/travel-bingo?code=${cfg.joinCode}`;
    const text = `Join our Travel Bingo! Code ${cfg.joinCode}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Travel Bingo', text, url });
      else {
        await navigator.clipboard.writeText(`${text}: ${url}`);
        play('tap');
      }
    } catch {
      // The share sheet was dismissed; nothing to do.
    }
  };

  return (
    <div className="space-y-5 pb-4">
      {/* The code, big, with one button to send it. */}
      <section className="toy-flat rounded-3xl bg-game-bingo p-4 text-white [--toy-edge:hsl(var(--game-bingo-deep))]">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/80">Game code</p>
        <div className="mt-2 flex justify-center gap-1.5">
          {cfg.joinCode.split('').map((ch, i) => (
            <span key={i} className="flex h-12 w-10 items-center justify-center rounded-xl bg-white font-mono text-2xl font-extrabold text-game-bingo-deep shadow-[0_3px_0_0_rgba(0,0,0,0.2)]">
              {ch}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={shareLink}
          className="toy mx-auto mt-3 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-game-bingo-deep [--toy-edge:rgba(0,0,0,0.2)]"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" /> Send it to the other cars
        </button>
      </section>

      <section>
        <h2 className="font-display text-xl font-extrabold text-foreground">What do you want to spot?</h2>
        <p className="text-sm text-muted-foreground">Tap a pack, add your own, or both. Everyone&apos;s lists get mixed into the cards.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {BINGO_PACKS.map((pack) => {
            const on = pack.items.every((i) => has.has(i.toLowerCase()));
            return (
              <motion.button
                key={pack.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => togglePack(pack)}
                className={cn(
                  'toy relative flex items-center gap-2 rounded-2xl px-3 py-3 text-left font-display font-bold',
                  on
                    ? 'bg-game-bingo text-white [--toy-edge:hsl(var(--game-bingo-deep))]'
                    : 'bg-white text-foreground [--toy-edge:hsl(var(--border))]',
                )}
                aria-pressed={on}
              >
                <span className="text-2xl" aria-hidden="true">{pack.emoji}</span>
                <span className="min-w-0 flex-1 leading-tight">{pack.name}</span>
                {on && <Check className="h-5 w-5 shrink-0" aria-hidden="true" />}
              </motion.button>
            );
          })}
        </div>

        <form onSubmit={addOwn} className="mt-3 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 100))}
            placeholder="Add your own, e.g. a red tractor"
            className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-white px-4 py-3 focus:border-game-bingo focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Add"
            className="toy flex min-h-touch min-w-[52px] items-center justify-center rounded-2xl bg-amber-400 text-amber-950 [--toy-edge:theme(colors.amber.600)]"
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-bold text-foreground">Your list · {items.length}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            {save === 'saving' && <><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Saving</>}
            {save === 'saved' && <><Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved</>}
            {save === 'failed' && <span className="font-semibold text-destructive">Not saved yet. Trying again…</span>}
          </span>
        </div>
        {items.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {items.map((it) => (
              <li key={it} className="flex items-center gap-1 rounded-full bg-game-bingo/10 py-1 pl-3 pr-1 text-sm font-medium text-game-bingo-deep">
                {it}
                <button type="button" onClick={() => remove(it)} aria-label={`Remove ${it}`} className="press rounded-full p-1 hover:bg-game-bingo/15">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">The convoy</h2>
        <ul className="mt-2 space-y-2">
          {cars.map((c) => {
            const tone = carTone(cars, c.carId);
            const count = c.carId === myCarId ? items.length : c.submittedItems?.length || 0;
            return (
              <motion.li
                key={c.carId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm"
              >
                <span className={cn('flex h-10 w-10 items-center justify-center rounded-full text-xl', tone.soft)} aria-hidden="true">
                  {tone.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-foreground">
                    {c.name}
                    {c.carId === myCarId && <span className="font-medium text-muted-foreground"> (you)</span>}
                    {c.carId === cfg.hostCarId && <span className="ml-1 text-xs font-bold text-amber-600">HOST</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{count ? `${count} things to spot` : 'Still choosing'}</span>
                </span>
              </motion.li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
