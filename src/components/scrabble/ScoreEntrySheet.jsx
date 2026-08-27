import { useEffect, useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import NumericKeypad from '@/components/game/NumericKeypad';
import { totalFor } from '@/lib/scrabble';

// Score entry, as a bottom sheet with the shared keypad.
//
// Replaces a ~70px text input and a "+" button squeezed into each player's
// column. Two problems with that: the targets were far below 44px, and the input
// was `text-sm`, which on iOS zooms the whole page on focus and does not zoom
// back — so adding a score left the board half off-screen.
//
// A sheet also means the keys sit at the bottom of the screen, under the thumb,
// which is where they need to be when the phone is being passed round a table.
export default function ScoreEntrySheet({ open, onOpenChange, player, onSubmit }) {
  const [value, setValue] = useState('');

  // Clear between openings. Without this the next player is handed whatever the
  // last one typed, which is very easy to submit by accident.
  useEffect(() => {
    if (!open) setValue('');
  }, [open]);

  if (!player) return null;

  const submit = () => {
    const score = parseInt(value, 10);
    if (Number.isNaN(score)) return;
    onSubmit(score);
    setValue('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={player.name} description={`${totalFor(player)} points so far`}>
        <div className="mb-4 flex min-h-[72px] items-center justify-center rounded-lg border-2 border-border bg-muted/50">
          <span className="tnum font-display text-5xl font-semibold leading-none text-foreground">
            {value || <span className="text-muted-foreground/40">0</span>}
          </span>
        </div>

        <NumericKeypad
          value={value}
          onChange={setValue}
          maxLength={3}
          onSubmit={submit}
          submitLabel="Add score"
          // A turn genuinely can be worth nothing — a pass, or a swap. Without
          // this the only way to record one is to type a 0, and the keypad
          // suppresses a leading zero, so it was impossible.
          extraKey={
            <button
              type="button"
              onClick={() => {
                onSubmit(0);
                setValue('');
                onOpenChange(false);
              }}
              className="press flex min-h-[56px] items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-muted"
            >
              Pass
            </button>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
