import { Crown, Plus, ChevronDown } from 'lucide-react';
import { standings, turnExtremes } from '@/lib/scrabble';
import { cn } from '@/lib/cn';

const MEDALS = {
  1: 'bg-warning/15 text-warning',
  2: 'bg-muted text-muted-foreground',
  3: 'bg-brand/10 text-brand',
};

// The scoreboard, as a ranked list of rows.
//
// It was a grid of one column per player. With four players on a 375px phone
// that produced four ~85px columns, each holding a name, a total, a text input,
// a submit button and a scrollable history — at `text-[10px]` and `text-[11px]`,
// well under the readable minimum, with score inputs far too small to hit.
//
// A list gives each player the full width instead. It also puts them in score
// order, which is the thing everyone actually wants to know and which the column
// layout never showed — it kept players in seating order and left you to compare
// four numbers yourself.
export default function Scoreboard({ players, onAddScore, onOpenPlayer, expandedIndex }) {
  const rows = standings(players);
  const { best, worst } = turnExtremes(players);
  const anyScores = players.some((p) => (p.scores || []).length > 0);

  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ index, player, total, position }) => {
        const scores = player.scores || [];
        const isExpanded = expandedIndex === index;

        return (
          <li key={index}>
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <div className="flex items-center gap-3 p-3">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tnum',
                    anyScores ? MEDALS[position] || 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground',
                  )}
                  aria-label={`Position ${position}`}
                >
                  {position === 1 && anyScores ? (
                    <Crown className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    position
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => onOpenPlayer(index)}
                  className="press flex min-w-0 flex-1 items-baseline gap-3 rounded-lg text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-semibold text-foreground">
                      {player.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {scores.length} {scores.length === 1 ? 'turn' : 'turns'}
                      <ChevronDown
                        className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')}
                        aria-hidden="true"
                      />
                    </span>
                  </span>

                  <span className="tnum font-display text-3xl font-semibold leading-none text-foreground">
                    {total}
                  </span>
                </button>

                {/* Adding a score is the single most repeated action in the
                    game, so it gets a full 44px target of its own rather than
                    living behind a tap on the row. */}
                <button
                  type="button"
                  onClick={() => onAddScore(index)}
                  aria-label={`Add score for ${player.name}`}
                  className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-game-scrabble text-white shadow-sm transition-colors hover:bg-game-scrabble-deep"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-muted/40 px-3 py-2">
                  {scores.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {scores.map((score, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-sm tnum"
                        >
                          <span className="text-xs text-muted-foreground">R{i + 1}</span>
                          <span className="font-semibold text-foreground">{score}</span>
                          {score === best && score > 0 && (
                            <span title="Best turn" aria-label="Best turn">🏆</span>
                          )}
                          {score === worst && score > 0 && best !== worst && (
                            <span title="Lowest turn" aria-label="Lowest turn">🥄</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No turns yet.</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Tap the name to edit turns or rename.
                  </p>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
