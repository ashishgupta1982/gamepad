import { Input, Label } from '@/components/ui/input';
import GuestNotice from '@/components/game/GuestNotice';
import { cn } from '@/lib/cn';

// Set up a game. Player count, names, go.
export default function PlayerSetupScreen({
  previousNames = [],
  playerCount,
  playerNames,
  onPlayerCountChange,
  onPlayerNameChange,
}) {
  const fillNextSlot = (name) => {
    const slot = playerNames.findIndex((n) => /^Player \d+$/.test(n));
    if (slot !== -1) onPlayerNameChange(slot, name);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <GuestNotice className="mb-5" />

      <h1 className="font-display text-2xl font-semibold text-foreground">New game</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You keep the board. GamePad keeps the score.
      </p>

      <div className="mt-6">
        <Label id="player-count-label">How many playing?</Label>
        <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="player-count-label">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onPlayerCountChange(num)}
              aria-pressed={playerCount === num}
              className={cn(
                'press min-h-touch rounded-lg border-2 font-display text-lg font-semibold transition-colors',
                playerCount === num
                  ? 'border-game-scrabble bg-game-scrabble text-white'
                  : 'border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {previousNames.length > 0 && (
        <div className="mt-6">
          <Label>Played before</Label>
          <div className="flex flex-wrap gap-2">
            {previousNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => fillNextSlot(name)}
                className="press rounded-full bg-game-scrabble/10 px-3 py-2 text-sm font-medium text-game-scrabble transition-colors hover:bg-game-scrabble/20"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <Label>Names</Label>
        <div className="flex flex-col gap-2">
          {playerNames.map((name, index) => (
            <Input
              key={index}
              value={name}
              onChange={(e) => onPlayerNameChange(index, e.target.value)}
              placeholder={`Player ${index + 1}`}
              aria-label={`Player ${index + 1} name`}
              // Select-all on focus. Every slot arrives pre-filled with
              // "Player 1", so the first thing anyone does is clear it — and
              // clearing a filled field by hand on a phone means a long-press
              // and a fiddly selection handle.
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
