import { cn } from '@/lib/cn';

// "Next in 3" — the visible half of the auto-advance.
//
// A screen that moves on by itself with no warning reads as a glitch. The
// countdown makes it deliberate, and tells whoever is still reading the
// explanation exactly how long they have.
//
// The skip is host-only and deliberately quiet: it exists so a group that has
// clearly finished reading can move on, not as the normal way through. If
// tapping it becomes the normal way through, the durations are wrong.
export default function AutoAdvance({
  secondsLeft,
  total,
  label = 'Next question',
  onSkip,
  showSkip = false,
  className,
}) {
  // Only the device driving the room counts down. Everyone else is moved by
  // SSE, so showing them a number would either freeze at 3 or disagree with the
  // host's clock by a second — both read as broken. They get the same message
  // without the count.
  const counting = typeof secondsLeft === 'number';
  const progress = counting && total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 0;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div
        // aria-live so the countdown is announced rather than being a purely
        // visual cue, but "polite" so it does not interrupt the result being
        // read out.
        aria-live="polite"
        className="text-sm font-medium text-muted-foreground"
      >
        {counting && secondsLeft > 0 ? (
          <>
            {label} in <span className="tnum font-semibold text-foreground">{secondsLeft}</span>
          </>
        ) : (
          <>{label} coming up…</>
        )}
      </div>

      <div className="h-1 w-32 overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            'h-full rounded-full bg-game-quiz',
            counting ? 'transition-[width] duration-1000 ease-linear' : 'animate-pulse',
          )}
          style={{ width: counting ? `${progress * 100}%` : '100%' }}
        />
      </div>

      {showSkip && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="press min-h-touch px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip ahead
        </button>
      )}
    </div>
  );
}
