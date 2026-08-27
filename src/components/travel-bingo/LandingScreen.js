import { useState } from 'react';

export default function LandingScreen({ onCreate, onJoin, busy }) {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [carName, setCarName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!carName.trim()) {
      setError('Please give your car a name.');
      return;
    }
    if (mode === 'join' && code.trim().length !== 6) {
      setError('Enter the 6-character game code.');
      return;
    }
    try {
      if (mode === 'create') {
        await onCreate(carName.trim());
      } else {
        await onJoin(code.trim().toUpperCase(), carName.trim());
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🚗</div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-game-bingo to-game-bingo-deep">
          Travel Bingo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-car road-trip bingo. Spot it, snap it, win!
        </p>
      </div>

      <div className="bg-card rounded-2xl shadow-md p-5 border border-game-bingo/30">
        <div className="flex bg-muted rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'create' ? 'bg-card shadow text-game-bingo' : 'text-muted-foreground'
            }`}
          >
            New game
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'join' ? 'bg-card shadow text-game-bingo' : 'text-muted-foreground'
            }`}
          >
            Join with code
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Game code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABCD23"
                className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] border-2 border-border rounded-xl focus:outline-none focus:border-game-bingo uppercase"
                maxLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Your car name</label>
            <input
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value.slice(0, 30))}
              placeholder="e.g. The Smiths"
              className="w-full px-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-game-bingo"
              maxLength={30}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-game-bingo to-game-bingo-deep hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Working...' : mode === 'create' ? 'Create game' : 'Join game'}
          </button>
        </form>
      </div>
    </div>
  );
}
