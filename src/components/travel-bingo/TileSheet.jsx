import { useEffect, useState } from 'react';
import { Send, Undo2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';

// A tile's details, on the shared bottom sheet (focus trap, Esc, scroll lock).
// Opened by tapping a found tile on your own card, or any tile on someone
// else's. Finding a tile is not in here: on your own card that is the tap.
export default function TileSheet({ open, tile, ownerCar, myCarId, onClose, onSaveCaption, onUnmark, onComment }) {
  const [caption, setCaption] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCaption(tile?.caption || '');
    setComment('');
  }, [tile?.tileId, tile?.caption]);

  if (!tile || !ownerCar) return null;
  const mine = ownerCar.carId === myCarId;
  const comments = tile.comments || [];

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={tile.label} description={`${mine ? 'Your card' : ownerCar.name}${tile.category ? ` · ${tile.category}` : ''}`}>
        <div className="space-y-5 pb-2">
          {tile.found ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-game-bingo/10 px-3 py-1 text-sm font-bold text-game-bingo-deep">
              Spotted
              {tile.foundAt && ` at ${new Date(tile.foundAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not spotted yet.</p>
          )}

          {mine && tile.found && (
            <div>
              <label className="mb-1 block text-sm font-bold text-foreground" htmlFor="caption">
                Where was it?
              </label>
              <div className="flex gap-2">
                <input
                  id="caption"
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 280))}
                  placeholder="e.g. by the services at Leigh Delamere"
                  className="min-w-0 flex-1 rounded-2xl border-2 border-border px-3 py-2.5 focus:border-game-bingo focus:outline-none"
                />
                <button
                  type="button"
                  disabled={busy || caption === (tile.caption || '')}
                  onClick={() => run(() => onSaveCaption(tile, caption))}
                  className="toy rounded-2xl bg-game-bingo px-4 font-bold text-white [--toy-edge:hsl(var(--game-bingo-deep))] disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          )}
          {!mine && tile.caption && <p className="text-base italic text-foreground">&ldquo;{tile.caption}&rdquo;</p>}

          <div>
            <p className="mb-2 text-sm font-bold text-foreground">Comments {comments.length > 0 && `· ${comments.length}`}</p>
            {comments.length > 0 && (
              <ul className="mb-3 space-y-2">
                {comments.map((c) => (
                  <li key={c.commentId} className="rounded-2xl bg-muted px-3 py-2">
                    <p className="text-xs font-bold text-game-bingo-deep">{c.carName}</p>
                    <p className="text-sm text-foreground">{c.text}</p>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!comment.trim()) return;
                run(async () => {
                  await onComment(ownerCar, tile, comment);
                  setComment('');
                });
              }}
            >
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 280))}
                placeholder={mine ? 'Say something…' : 'Cheer them on, or cry foul…'}
                className="min-w-0 flex-1 rounded-2xl border-2 border-border px-3 py-2.5 focus:border-game-bingo focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Post comment"
                disabled={busy || !comment.trim()}
                className="toy flex min-w-[48px] items-center justify-center rounded-2xl bg-amber-400 text-amber-950 [--toy-edge:theme(colors.amber.600)] disabled:opacity-50"
              >
                <Send className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
          </div>

          {mine && tile.found && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => onUnmark(tile))}
              className={cn('press flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-destructive')}
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" /> Oops, not spotted after all
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
