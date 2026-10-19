import { useState } from 'react';
import { Check, ChevronDown, Users } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';

// Who is playing on this phone, in the header of every Egypt Explorer screen.
// Everything done (an answer, a quest, a tick) counts for this person, so it
// is always in sight. Tap it to hand the phone to someone else.
export default function PlayerSwitch({ players, me, onPick, onEditFamily }) {
  const [open, setOpen] = useState(false);
  const current = players.find((p) => p.id === me);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Playing as ${current?.name || 'nobody'}. Change who is playing`}
        className="press flex min-h-[36px] max-w-[10rem] items-center gap-1 rounded-full bg-gold px-3 text-sm font-semibold text-lapis"
      >
        <span className="truncate">{current?.name || 'Who?'}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent title="Who’s playing?" description="Everything you do counts for whoever is picked here.">
          <PlayerList
            players={players}
            me={me}
            onPick={(id) => {
              onPick(id);
              setOpen(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEditFamily();
            }}
            className="press mt-3 flex min-h-touch w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-lapis hover:bg-muted"
          >
            <Users className="h-4 w-4" aria-hidden="true" /> Edit the family
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** The family as big buttons, one per person. */
export function PlayerList({ players, me, onPick }) {
  return (
    <ul className="grid gap-2">
      {players.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => onPick(p.id)}
            aria-pressed={p.id === me}
            className={cn(
              'press flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border-2 px-4 text-left font-display text-lg font-semibold',
              p.id === me ? 'border-gold bg-gold/20 text-foreground' : 'border-border bg-card text-foreground',
            )}
          >
            <span className="truncate">{p.name}</span>
            {p.id === me && <Check className="h-5 w-5 shrink-0 text-game-egypt" aria-label="Playing now" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
