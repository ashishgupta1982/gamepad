import { useEffect, useState } from 'react';
import PhotoUpload from './PhotoUpload';

export default function TileDetailModal({
  open,
  tile,
  ownerCar,
  myCarId,
  gameId,
  onClose,
  onMarkFound,
  onUnmark,
  onAddComment,
}) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (tile) {
      setPhotoUrl(tile.photoUrl || '');
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
      await onMarkFound({ tileId: tile.tileId, photoUrl, caption });
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
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-slate-500">{ownerCar.name}{!isOwner && " · viewing"}</p>
            <h3 className="text-lg font-bold text-slate-800">{tile.label}</h3>
            <p className="text-xs text-emerald-600 font-medium">{tile.category}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {isOwner && !tile.found && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Mark as found
              </p>
              <PhotoUpload
                gameId={gameId}
                carId={myCarId}
                photoUrl={photoUrl}
                onChange={setPhotoUrl}
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 280))}
                placeholder="Add a caption (optional)"
                className="w-full mt-3 px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400"
                rows={2}
              />
              <button
                onClick={handleMark}
                disabled={busy}
                className="w-full mt-3 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-50"
              >
                {busy ? 'Saving…' : '✓ Spotted it!'}
              </button>
            </div>
          )}

          {tile.found && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">
                Spotted ✓
              </p>
              {tile.photoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={tile.photoUrl} alt={tile.label} className="w-full max-h-64 object-cover rounded-xl mb-2" />
              )}
              {tile.caption && <p className="text-sm text-slate-700 italic">&ldquo;{tile.caption}&rdquo;</p>}
              {isOwner && (
                <button
                  onClick={handleUnmark}
                  disabled={busy}
                  className="mt-3 text-xs text-slate-500 hover:text-red-600 underline"
                >
                  Undo (mark as not found)
                </button>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Comments ({comments.length})
            </p>
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No comments yet.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {comments.map(c => (
                  <li key={c.commentId} className="bg-slate-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-emerald-700">{c.carName}</p>
                    <p className="text-sm text-slate-700">{c.text}</p>
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
                className="flex-1 px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400"
              />
              <button
                onClick={handleComment}
                disabled={busy || !commentDraft.trim()}
                className="px-3 py-2 text-sm rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
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
