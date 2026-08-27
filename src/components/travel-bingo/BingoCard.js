export default function BingoCard({ car, onTileClick, interactive = false, highlightTileId }) {
  const tiles = car?.card || [];
  const found = tiles.filter(t => t.found).length;

  return (
    <div className="bg-card rounded-2xl shadow-md p-4 border border-game-bingo/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚗</span>
          <h3 className="font-bold text-foreground">{car.name}</h3>
        </div>
        <span className="text-xs font-semibold text-game-bingo bg-game-bingo/10 px-2 py-1 rounded-full">
          {found} / {tiles.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.tileId}
            type="button"
            onClick={() => interactive && onTileClick && onTileClick(tile)}
            disabled={!interactive}
            className={`
              aspect-square rounded-xl p-2 flex flex-col items-center justify-center text-center
              border-2 transition relative overflow-hidden
              ${tile.found
                ? 'bg-gradient-to-br from-game-bingo to-game-bingo-deep text-white border-game-bingo shadow-md'
                : 'bg-muted text-foreground border-border'
              }
              ${interactive && !tile.found ? 'hover:border-game-bingo/30 hover:bg-game-bingo/10 active:scale-95 cursor-pointer' : ''}
              ${interactive && tile.found ? 'hover:opacity-90 active:scale-95 cursor-pointer' : ''}
              ${highlightTileId === tile.tileId ? 'ring-2 ring-warning' : ''}
            `}
          >
            <span className={`relative z-10 text-[11px] sm:text-xs font-semibold leading-tight ${tile.found ? 'drop-shadow' : ''}`}>
              {tile.label}
            </span>
            {tile.found && (
              <span className="absolute top-1 right-1 z-10 text-white text-base">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
