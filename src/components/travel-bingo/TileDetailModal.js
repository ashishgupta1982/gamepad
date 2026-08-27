import { useEffect, useState } from 'react';

export default function TileDetailModal({
  open,
  tile,
  ownerCar,
  myCarId,
  onClose,
  onMarkFound,
  onUnmark,
  onAddComment,
}) {
  const [caption, setCaption] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (tile) {
      setCaption(tile.caption || '');
      setCommentDraft('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile?.tileId]);

  if (!open || !tile || !ownerCar) return null;

  const isOwner = ownerCar.carId === myCarId;
  const comments = tile.comments || [];

  const handleMark = async () => {
    setBusy(true);
    try {
      await onMarkFound({ tileId: tile.tileId, caption });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleUnmark = async () => {
    setBusy(true);
    try {
      await onUnmark({ tileId: tile.tileId });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async () => {
    if (!commentDraft.trim()) return;
    setBusy(true);
    try {
      await onAddComment({ ownerCarId: ownerCar.carId, tileId: tile.tileId, text: commentDraft });
      setCommentDraft('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-muted-foreground">{ownerCar.name}{!isOwner && " · viewing"}</p>
            <h3 className="text-lg font-bold text-foreground">{tile.label}</h3>
            <p className="text-xs text-game-bingo font-medium">{tile.category}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {isOwner && !tile.found && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Mark as found
              </p>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 280))}
                placeholder="Add a caption (optional)"
                className="w-full px-3 py-2 text-sm border-2 border-border rounded-xl focus:outline-none focus:border-game-bingo"
                rows={2}
              />
              <button
                onClick={handleMark}
                disabled={busy}
                className="w-full mt-3 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-game-bingo to-game-bingo-deep hover:opacity-90 disabled:opacity-50"
              >
                {busy ? 'Saving…' : '✓ Spotted it!'}
              </button>
            </div>
          )}

          {tile.found && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-game-bingo mb-2">
                Spotted ✓
              </p>
              {tile.caption && <p className="text-sm text-foreground italic">&ldquo;{tile.caption}&rdquo;</p>}
              {isOwner && (
                <button
                  onClick={handleUnmark}
                  disabled={busy}
                  className="mt-3 text-xs text-muted-foreground hover:text-destructive underline"
                >
                  Undo (mark as not found)
                </button>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Comments ({comments.length})
            </p>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No comments yet.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {comments.map(c => (
                  <li key={c.commentId} className="bg-muted rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-game-bingo">{c.carName}</p>
                    <p className="text-sm text-foreground">{c.text}</p>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value.slice(0, 280))}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                placeholder="Say something nice…"
                className="flex-1 px-3 py-2 text-sm border-2 border-border rounded-xl focus:outline-none focus:border-game-bingo"
              />
              <button
                onClick={handleComment}
                disabled={busy || !commentDraft.trim()}
                className="px-3 py-2 text-sm rounded-xl font-semibold bg-game-bingo text-white hover:bg-game-bingo disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
