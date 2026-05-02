import { useState } from 'react';

const MIN_ITEMS_PER_CAR = 5;

export default function SubmissionScreen({ game, myCarId, isHost, onSubmitItems, onGenerate, generating }) {
  const cars = game?.travelBingoConfig?.cars || [];
  const myCar = cars.find(c => c.carId === myCarId);
  const [items, setItems] = useState(myCar?.submittedItems || []);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (items.length >= 50) return;
    setItems([...items, trimmed]);
    setDraft('');
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSubmitItems(items);
    } catch (err) {
      setError(err?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const totalSubmitted = cars.reduce((acc, c) => acc + (c.submittedItems?.length || 0), 0);
  const carsReady = cars.filter(c => (c.submittedItems?.length || 0) >= MIN_ITEMS_PER_CAR).length;
  const allCarsReady = carsReady === cars.length && cars.length >= 2;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
      <div className="bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
        <h2 className="text-xl font-bold text-slate-800 mb-1">What do you want to spot?</h2>
        <p className="text-sm text-slate-500 mb-4">
          Add things you&apos;d love to find on this road trip — animals, signs, vehicles, landmarks, snacks, anything.
          Aim for at least {MIN_ITEMS_PER_CAR}. Items get pooled across all cars and AI builds your bingo cards.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 100))}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
            placeholder="e.g. red tractor"
            className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={addItem}
            className="px-4 py-2.5 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600"
          >
            Add
          </button>
        </div>

        {items.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {items.map((it, idx) => (
              <li key={idx} className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                <span>{it}</span>
                <button
                  onClick={() => removeItem(idx)}
                  className="text-emerald-600 hover:text-emerald-900 font-bold"
                  aria-label="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-slate-500">{items.length} item{items.length === 1 ? '' : 's'} on your list</p>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg font-semibold bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save my list'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="mt-5 bg-white rounded-2xl shadow-md p-5 border border-emerald-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Convoy submissions</p>
        <ul className="space-y-2">
          {cars.map(c => {
            const count = c.submittedItems?.length || 0;
            const ready = count >= MIN_ITEMS_PER_CAR;
            return (
              <li key={c.carId} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50">
                <span className="text-lg">🚗</span>
                <span className="font-medium text-slate-800 flex-1">{c.name}</span>
                <span className={`text-sm font-semibold ${ready ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {count} item{count === 1 ? '' : 's'} {ready && '✓'}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-slate-500 mt-3">{totalSubmitted} items submitted across the convoy</p>

        {isHost && (
          <button
            onClick={onGenerate}
            disabled={!allCarsReady || generating || totalSubmitted < 9}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-40"
          >
            {generating
              ? 'AI is building your bingo cards…'
              : allCarsReady && totalSubmitted >= 9
                ? 'Generate bingo cards ✨'
                : `Waiting — every car needs ${MIN_ITEMS_PER_CAR}+ items`}
          </button>
        )}
        {!isHost && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Waiting for the host to generate cards…
          </p>
        )}
      </div>
    </div>
  );
}
