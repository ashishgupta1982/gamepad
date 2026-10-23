import { useState } from 'react';
import { useHandle } from '@/components/quiz-show/data';
import { cn } from '@/lib/cn';

// A signed-in player's quiz name, unique across GamePad (lib/quiz/memory.js),
// and changing it. In the account menu's drawer, so it is changed from
// anywhere without leaving the screen (Ash, 2026-10-23), and on /settings.
// Nothing for a guest.
export default function QuizName({ className }) {
  const { handle, change } = useHandle();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!handle) return null;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await change(draft);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('rounded-xl bg-muted px-3 py-2.5', className)}>
      {!editing ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Quiz name</p>
            <p className="truncate text-base font-semibold text-foreground">{handle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraft(handle);
              setError('');
              setEditing(true);
            }}
            className="press min-h-touch shrink-0 rounded-lg px-3 text-sm font-semibold text-brand hover:bg-brand-soft"
          >
            Change
          </button>
        </div>
      ) : (
        <form onSubmit={save}>
          <label htmlFor="quiz-name" className="text-xs font-medium text-muted-foreground">
            Quiz name: yours alone, the name you play under
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="quiz-name"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 20))}
              autoFocus
              className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-base text-foreground outline-none focus:ring-2 focus:ring-brand"
            />
            <button type="submit" disabled={busy} className="press shrink-0 rounded-lg bg-brand px-3 text-sm font-semibold text-brand-foreground disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="press shrink-0 rounded-lg px-2 text-sm font-medium text-muted-foreground">
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
