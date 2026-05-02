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
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
          Travel Bingo
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Multi-car road-trip bingo. Spot it, snap it, win!
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'create' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'
            }`}
          >
            New game
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'join' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'
            }`}
          >
            Join with code
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Game code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABCD23"
                className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 uppercase"
                maxLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Your car name</label>
            <input
              type="text"
              value={carName}
              onChange={(e) => setCarName(e.target.value.slice(0, 30))}
              placeholder="e.g. The Smiths"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400"
              maxLength={30}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Working...' : mode === 'create' ? 'Create game' : 'Join game'}
          </button>
        </form>
      </div>
    </div>
  );
}
