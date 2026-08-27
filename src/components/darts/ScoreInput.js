import React, { useState } from 'react';
import { Undo2 } from 'lucide-react';
import { MAX_TURN_SCORE } from '@/data/dartsConstants';
import NumericKeypad from '@/components/game/NumericKeypad';
import TurnIndicator from '@/components/game/TurnIndicator';
import { cn } from '@/lib/cn';

// Turn entry for X01.
//
// Built on the shared NumericKeypad rather than its own grid. Three games take a
// number from a thumb and each drew its own pad: Darts ran 7-8-9 along the top
// like a calculator, the others 1-2-3 like a phone. On a phone the phone layout
// wins — it is the one every dial pad and passcode screen has already taught
// your thumb.
//
// The display stays here rather than moving into the keypad, because the bust
// and checkout states are what make this darts rather than arithmetic, and no
// other game has them.
export default function ScoreInput({
  currentPlayer,
  remainingScore,
  onSubmit,
  onUndo,
  canUndo,
  checkoutSuggestion,
}) {
  const [value, setValue] = useState('');

  const numValue = parseInt(value, 10) || 0;
  const wouldBust =
    numValue > remainingScore || remainingScore - numValue === 1 || numValue > MAX_TURN_SCORE;
  const isCheckout = numValue === remainingScore && numValue >= 2;

  const submit = () => {
    if (value === '' || wouldBust) return;
    onSubmit(numValue);
    setValue('');
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <TurnIndicator
        name={currentPlayer}
        label="To throw"
        detail={remainingScore}
        tone="darts"
        className="mb-3"
      />

      <div
        className={cn(
          'mb-3 rounded-lg border-2 py-4 text-center transition-colors',
          wouldBust && value
            ? 'border-destructive/40 bg-destructive/5'
            : isCheckout
              ? 'border-success/40 bg-success/5'
              : 'border-border bg-card',
        )}
      >
        <div
          className={cn(
            'tnum flex min-h-[56px] items-center justify-center font-display text-5xl font-semibold leading-none',
            wouldBust && value
              ? 'text-destructive'
              : isCheckout
                ? 'text-success'
                : 'text-foreground',
          )}
        >
          {value || <span className="text-muted-foreground/40">0</span>}
        </div>
        {wouldBust && value && (
          <div className="mt-1 text-sm font-semibold text-destructive">Bust</div>
        )}
        {isCheckout && <div className="mt-1 text-sm font-semibold text-success">Checkout!</div>}
      </div>

      {checkoutSuggestion && !value && (
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-warning">Checkout</div>
          <div className="font-display text-base font-semibold tracking-wide text-warning">
            {checkoutSuggestion.join(' → ')}
          </div>
        </div>
      )}

      <NumericKeypad
        value={value}
        onChange={setValue}
        max={MAX_TURN_SCORE}
        maxLength={3}
        onSubmit={submit}
        submitLabel={isCheckout ? 'Check out' : 'Enter score'}
        submitDisabled={wouldBust}
        // Three darts that scored nothing is the most common turn in a bad leg,
        // so it gets a key rather than being buried under the pad.
        extraKey={
          <button
            type="button"
            onClick={() => {
              onSubmit(0);
              setValue('');
            }}
            className="press flex min-h-[56px] items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-muted"
          >
            No score
          </button>
        }
      />

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="press mt-2 flex min-h-touch w-full items-center justify-center gap-2 rounded-lg bg-muted text-sm font-semibold text-muted-foreground transition-colors hover:bg-border disabled:pointer-events-none disabled:opacity-40"
      >
        <Undo2 className="h-4 w-4" aria-hidden="true" />
        Undo last turn
      </button>
    </div>
  );
}
