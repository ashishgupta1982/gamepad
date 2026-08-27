import { Delete } from 'lucide-react';
import { cn } from '@/lib/cn';

// The shared score-entry pad. Scrabble, Darts and Quiz all take a number from a
// thumb; each currently builds its own grid, and they disagree on key size, on
// where backspace sits and on what happens at the maximum.
//
// Deliberately does NOT own the display. What sits above the keys is where the
// games genuinely differ — darts needs BUST and CHECKOUT states, scrabble shows
// a running word score — so the reusable part is the keys and the digit-string
// rules, not the readout. Games render their own display and pass `value`.
//
// Controlled: the caller holds `value` as a string. A string, not a number, so
// that an empty pad and a typed 0 are distinguishable, which they are not once
// parseInt has run.

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function NumericKeypad({
  value = '',
  onChange,
  max,
  maxLength = 3,
  onSubmit,
  submitLabel = 'Enter',
  submitDisabled = false,
  extraKey,
  className,
}) {
  const pressDigit = (digit) => {
    // Leading zeros are meaningless in a score and make the display look broken
    // ("007"), so a 0 pressed first is ignored rather than stored.
    const next = value === '0' ? digit : `${value}${digit}`;
    if (next.length > maxLength) return;
    if (max != null && parseInt(next, 10) > max) return;
    onChange(next);
  };

  const backspace = () => onChange(value.slice(0, -1));

  const keyClass =
    'press flex min-h-[56px] items-center justify-center rounded-lg bg-card text-2xl font-semibold text-foreground shadow-sm border border-border transition-colors hover:bg-muted tnum';

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {KEYS.map((digit) => (
        <button key={digit} type="button" onClick={() => pressDigit(digit)} className={keyClass}>
          {digit}
        </button>
      ))}

      {/* Bottom row. `extraKey` is the per-game slot — darts puts "No score"
          here, which is its most-pressed key and does not belong in a menu. */}
      {extraKey ?? <span aria-hidden="true" />}

      <button type="button" onClick={() => pressDigit('0')} className={keyClass}>
        0
      </button>

      <button
        type="button"
        onClick={backspace}
        disabled={value === ''}
        aria-label="Delete last digit"
        className={cn(keyClass, 'disabled:opacity-40')}
      >
        <Delete className="h-6 w-6" aria-hidden="true" />
      </button>

      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled || value === ''}
          className="press col-span-3 mt-1 flex min-h-touch items-center justify-center rounded-lg bg-brand text-lg font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
