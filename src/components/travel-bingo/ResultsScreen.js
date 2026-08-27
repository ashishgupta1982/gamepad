export default function ResultsScreen({ game, myCarId, onPlayAgain }) {
  const cars = game?.travelBingoConfig?.cars || [];
  const winnerId = game?.travelBingoConfig?.winnerCarId;
  const winner = cars.find(c => c.carId === winnerId);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-12">
      <div className="bg-gradient-to-br from-warning via-game-bingo to-game-bingo rounded-3xl shadow-md p-6 text-center border border-warning/30">
        <div className="text-6xl mb-2">🏆</div>
        <h1 className="text-3xl font-bold text-foreground">
          {winner ? `${winner.name} wins!` : 'Game complete'}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {winner?.carId === myCarId
            ? 'Nice spotting! That bingo card is full.'
            : winner ? `Congratulations to ${winner.name} on the full card.` : 'Game ended.'}
        </p>
      </div>

      <div className="mt-5 bg-card rounded-2xl shadow-md p-4 border border-game-bingo/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Final scores</p>
        <ul className="space-y-2">
          {[...cars].sort((a, b) => {
            const fa = (a.card || []).filter(t => t.found).length;
            const fb = (b.card || []).filter(t => t.found).length;
            return fb - fa;
          }).map((c, idx) => {
            const total = c.card?.length || 9;
            const found = (c.card || []).filter(t => t.found).length;
            return (
              <li key={c.carId} className="flex items-center justify-between bg-muted px-3 py-2 rounded-lg">
                <span className="font-medium text-foreground">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {c.name}
                </span>
                <span className="font-mono text-sm text-muted-foreground">{found}/{total}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={onPlayAgain}
        className="w-full mt-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-game-bingo to-game-bingo-deep hover:opacity-90"
      >
        Play another game
      </button>
    </div>
  );
}
