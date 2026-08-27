export default function LobbyScreen({ game, isHost, myCarId, onAdvance }) {
  const cars = game?.travelBingoConfig?.cars || [];
  const code = game?.travelBingoConfig?.joinCode;
  const enoughCars = cars.length >= 2;

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="bg-card rounded-2xl shadow-md p-5 border border-game-bingo/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Game code</p>
        <div className="flex items-center justify-between mt-1 mb-4">
          <p className="text-3xl font-mono font-bold tracking-[0.3em] text-game-bingo">{code}</p>
          <button
            onClick={() => navigator.clipboard?.writeText(code)}
            className="text-xs px-3 py-1.5 rounded-lg bg-game-bingo/10 text-game-bingo hover:bg-game-bingo/10"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Share this code so other cars can join from their phone.
        </p>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Cars in the convoy ({cars.length})
          </p>
          <ul className="space-y-2">
            {cars.map((c) => (
              <li
                key={c.carId}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  c.carId === myCarId ? 'bg-game-bingo/10' : 'bg-muted'
                }`}
              >
                <span className="text-lg">🚗</span>
                <span className="font-medium text-foreground flex-1">{c.name}</span>
                {c.carId === myCarId && (
                  <span className="text-xs font-semibold text-game-bingo">You</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <button
            onClick={onAdvance}
            disabled={!enoughCars}
            className="w-full mt-5 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-game-bingo to-game-bingo-deep hover:opacity-90 disabled:opacity-40"
          >
            {enoughCars ? 'Start submissions' : 'Waiting for at least 2 cars…'}
          </button>
        ) : (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Waiting for the host to start submissions…
          </p>
        )}
      </div>
    </div>
  );
}
