export default function ResultsScreen({ game, myCarId, onPlayAgain }) {
  const cars = game?.travelBingoConfig?.cars || [];
  const winnerId = game?.travelBingoConfig?.winnerCarId;
  const winner = cars.find(c => c.carId === winnerId);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-12">
      <div className="bg-gradient-to-br from-amber-100 via-emerald-50 to-teal-100 rounded-3xl shadow-md p-6 text-center border border-amber-200">
        <div className="text-6xl mb-2">🏆</div>
        <h1 className="text-3xl font-bold text-slate-800">
          {winner ? `${winner.name} wins!` : 'Game complete'}
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          {winner?.carId === myCarId
            ? 'Nice spotting! That bingo card is full.'
            : winner ? `Congratulations to ${winner.name} on the full card.` : 'Game ended.'}
        </p>
      </div>

      <div className="mt-5 bg-white rounded-2xl shadow-md p-4 border border-emerald-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Final scores</p>
        <ul className="space-y-2">
          {[...cars].sort((a, b) => {
            const fa = (a.card || []).filter(t => t.found).length;
            const fb = (b.card || []).filter(t => t.found).length;
            return fb - fa;
          }).map((c, idx) => {
            const total = c.card?.length || 9;
            const found = (c.card || []).filter(t => t.found).length;
            return (
              <li key={c.carId} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                <span className="font-medium text-slate-800">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {c.name}
                </span>
                <span className="font-mono text-sm text-slate-600">{found}/{total}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={onPlayAgain}
        className="w-full mt-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90"
      >
        Play another game
      </button>
    </div>
  );
}
