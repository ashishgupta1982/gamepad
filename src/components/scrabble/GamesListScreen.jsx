import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { standings } from '@/lib/scrabble';
import { cn } from '@/lib/cn';

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function GameRow({ game, onContinue, onDelete, done }) {
  const [leader] = standings(game.players || []);
  const names = (game.players || []).map((p) => p.name).join(', ');

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm">
      <button
        type="button"
        onClick={() => !done && onContinue(game)}
        disabled={done}
        className={cn('press min-w-0 flex-1 text-left', done && 'cursor-default')}
      >
        <span className="block truncate font-display text-base font-semibold text-foreground">
          {names || 'Untitled game'}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {leader ? (
            <>
              <span className="font-medium text-game-scrabble">{leader.player.name}</span>{' '}
              {done ? 'won' : 'leading'} — <span className="tnum">{leader.total}</span> pts
            </>
          ) : (
            'No scores yet'
          )}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground/80">
          {formatDate(game.updatedAt)}
        </span>
      </button>

      {!done && (
        <Button type="button" size="sm" onClick={() => onContinue(game)}>
          Continue
        </Button>
      )}

      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => onDelete(game._id)}
        aria-label={`Delete game with ${names}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </li>
  );
}

export default function GamesListScreen({ games, onNewGame, onContinueGame, onDeleteGame }) {
  const active = games.filter((g) => g.status === 'active');
  const done = games.filter((g) => g.status === 'completed');

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">Your games</h1>
        <Button type="button" onClick={onNewGame} size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New
        </Button>
      </div>

      {active.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            In progress
          </h2>
          <ul className="flex flex-col gap-2">
            {active.map((game) => (
              <GameRow key={game._id} game={game} onContinue={onContinueGame} onDelete={onDeleteGame} />
            ))}
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Finished
          </h2>
          <ul className="flex flex-col gap-2">
            {done.map((game) => (
              <GameRow key={game._id} game={game} onContinue={onContinueGame} onDelete={onDeleteGame} done />
            ))}
          </ul>
        </section>
      )}

      {!active.length && !done.length && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No games yet. Start one and it will show up here.
        </p>
      )}
    </div>
  );
}
