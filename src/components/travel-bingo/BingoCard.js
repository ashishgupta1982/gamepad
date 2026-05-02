export default function BingoCard({ car, onTileClick, interactive = false, highlightTileId }) {
  const tiles = car?.card || [];
  const found = tiles.filter(t => t.found).length;

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border border-emerald-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚗</span>
          <h3 className="font-bold text-slate-800">{car.name}</h3>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
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
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-emerald-500 shadow-md'
                : 'bg-slate-50 text-slate-700 border-slate-200'
              }
              ${interactive && !tile.found ? 'hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 cursor-pointer' : ''}
              ${interactive && tile.found ? 'hover:opacity-90 active:scale-95 cursor-pointer' : ''}
              ${highlightTileId === tile.tileId ? 'ring-2 ring-amber-400' : ''}
            `}
          >
            {tile.photoUrl && tile.found && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={tile.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            )}
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
