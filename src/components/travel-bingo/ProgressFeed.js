export default function ProgressFeed({ cars, onTileClick }) {
  // Flatten all found tiles across all cars, newest first
  const events = [];
  for (const car of cars) {
    for (const tile of car.card || []) {
      if (tile.found && tile.foundAt) {
        events.push({ car, tile });
      }
    }
  }
  events.sort((a, b) => new Date(b.tile.foundAt) - new Date(a.tile.foundAt));

  if (events.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-md p-4 border border-game-bingo/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Live feed</p>
        <p className="text-sm text-muted-foreground italic">No finds yet — go spot something!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-md p-4 border border-game-bingo/30">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live feed</p>
      <ul className="space-y-3">
        {events.slice(0, 30).map(({ car, tile }) => (
          <li
            key={`${car.carId}-${tile.tileId}`}
            className="flex gap-3 cursor-pointer hover:bg-muted p-2 -mx-2 rounded-lg"
            onClick={() => onTileClick && onTileClick(car, tile)}
          >
            <div className="w-14 h-14 rounded-lg bg-game-bingo/10 flex items-center justify-center text-2xl flex-shrink-0">
              ✓
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-bold text-game-bingo">{car.name}</span>
                <span className="text-muted-foreground"> spotted </span>
                <span className="font-semibold text-foreground">{tile.label}</span>
              </p>
              {tile.caption && <p className="text-xs text-muted-foreground truncate italic">&ldquo;{tile.caption}&rdquo;</p>}
              <p className="text-xs text-muted-foreground">
                {new Date(tile.foundAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {tile.comments?.length > 0 && ` · ${tile.comments.length} comment${tile.comments.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
