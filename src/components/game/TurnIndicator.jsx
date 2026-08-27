import { cn } from '@/lib/cn';

// Written out in full, never built as `text-${tone}`.
//
// Tailwind generates only the classes it can literally see in the source. An
// interpolated class name is invisible to that scan, so the utility is never
// emitted and the element silently renders in the inherited colour — no error,
// no warning, and it looks like the prop is being ignored.
const TONES = {
  brand: 'text-brand',
  accent: 'text-accent',
  scrabble: 'text-game-scrabble',
  quiz: 'text-game-quiz',
  darts: 'text-game-darts',
  bingo: 'text-game-bingo',
};

// Whose turn it is — the pass-the-phone component.
//
// Sized to be read at arm's length by someone who has just been handed the
// device and is not yet looking closely. That is why the name is display-face
// and large rather than a caption above a scoreboard: on the current screens
// "whose turn" is the same 14px grey as everything else, so the answer to the
// only question the next player has is the least visible thing on screen.
//
// `tone` takes a game token (game-darts, game-quiz, …) so each game keeps its
// own identity while the component stays shared.
export default function TurnIndicator({
  name,
  label = 'Your turn',
  detail,
  tone = 'brand',
  className,
}) {
  return (
    <div
      // aria-live so a screen reader announces the handover, which is otherwise
      // a purely visual event.
      aria-live="polite"
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={cn('truncate font-display text-2xl font-semibold', TONES[tone] || TONES.brand)}>
          {name}
        </p>
      </div>

      {detail != null && (
        <div className="shrink-0 text-right">
          <p className="tnum font-display text-3xl font-semibold text-foreground">{detail}</p>
        </div>
      )}
    </div>
  );
}
