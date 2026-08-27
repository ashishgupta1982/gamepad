import { useEffect, useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { totalFor } from '@/lib/scrabble';

// Rename a player and correct their turns.
//
// Both were previously inline-edit-in-place inside the player column: tap a name
// to turn it into a 12px input, tap a score to turn it into a 10-pixel-wide one.
// On a phone those are targets you hit by luck, and the blur-to-save behaviour
// meant a mistap committed a value with no way back.
//
// Here they get real inputs at a real size, and correcting a turn is explicit.
export default function PlayerSheet({
  open,
  onOpenChange,
  player,
  playerIndex,
  onRename,
  onEditScore,
  onRemoveScore,
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open && player) setName(player.name);
  }, [open, player]);

  if (!player) return null;

  const scores = player.scores || [];

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== player.name) onRename(playerIndex, trimmed);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={player.name} description={`${totalFor(player)} points from ${scores.length} ${scores.length === 1 ? 'turn' : 'turns'}`}>
        <div className="mb-5">
          <Label htmlFor="player-name">Name</Label>
          <div className="flex gap-2">
            <Input
              id="player-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
              }}
              placeholder={`Player ${playerIndex + 1}`}
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={commitName}
              aria-label="Save name"
              disabled={!name.trim() || name.trim() === player.name}
            >
              <Check className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div>
          <Label>Turns</Label>
          {scores.length ? (
            <ul className="flex flex-col gap-2">
              {scores.map((score, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-sm text-muted-foreground">R{i + 1}</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    defaultValue={score}
                    onBlur={(e) => {
                      const next = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                      if (!Number.isNaN(next) && next !== score) onEditScore(playerIndex, i, next);
                    }}
                    className="text-center tnum"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveScore(playerIndex, i)}
                    aria-label={`Delete turn ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No turns recorded yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
