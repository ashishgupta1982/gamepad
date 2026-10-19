import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Button from '@/components/ui/button';
import GuestNotice from '@/components/game/GuestNotice';
import Photo from './Photo';
import { HIERO_STYLE } from './fonts';
import { cleanNames, MAX_PLAYERS } from '@/lib/egypt/progress';

// "Who's exploring?" Names only: the passport keeps their points. Editing later
// keeps everyone's points (progress.js setPlayers matches by name). Starting a
// second trip fills in the names from the first, ready to change.
export default function PlayerSetup({ trip, initial = [], editing = false, onDone, onCancel }) {
  const [names, setNames] = useState(initial.length ? initial : ['', '']);
  const clean = cleanNames(names);
  const carried = !editing && initial.length > 0;

  const set = (i, v) => setNames((n) => n.map((x, k) => (k === i ? v : x)));
  const remove = (i) => setNames((n) => (n.length > 1 ? n.filter((_, k) => k !== i) : n));

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl">
        <Photo id={trip.cover} fill eager className="aspect-[16/10]" />
        <div className="absolute inset-0 bg-gradient-to-t from-lapis via-lapis/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <span className="text-3xl leading-none text-gold" style={HIERO_STYLE} aria-hidden="true">𓋹𓂀𓆣</span>
          <h2 className="mt-1 font-display text-2xl font-semibold">Who’s exploring?</h2>
          <p className="text-sm text-white/85">
            {carried ? `${trip.name}: the same explorers as last time? Change anyone you like.` : 'Add everyone in the family. Each of you scores your own points.'}
          </p>
        </div>
      </div>

      <GuestNotice>Playing as a guest: your progress stays on this phone.</GuestNotice>

      <ul className="space-y-2">
        {names.map((name, i) => (
          <li key={i} className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`explorer-${i}`}>Explorer {i + 1}</label>
            <input
              id={`explorer-${i}`}
              value={name}
              onChange={(e) => set(i, e.target.value)}
              placeholder={i === 0 ? 'Your name' : `Explorer ${i + 1}`}
              maxLength={24}
              autoComplete="off"
              className="min-h-touch flex-1 rounded-lg border border-input bg-card px-3 text-base focus:border-lapis focus:outline-none"
            />
            {names.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove explorer ${i + 1}`}
                className="press flex min-h-touch min-w-touch items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {names.length < MAX_PLAYERS && (
        <Button variant="outline" fullWidth onClick={() => setNames((n) => [...n, ''])}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add an explorer
        </Button>
      )}

      <div className="flex flex-col gap-2">
        <Button
          fullWidth
          size="lg"
          disabled={!clean.length}
          onClick={() => onDone(clean)}
          className="bg-lapis hover:bg-lapis/90"
        >
          {editing ? 'Save explorers' : 'Start exploring'}
        </Button>
        {onCancel && (
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
