import React, { useState, useEffect } from 'react';

export default function PlayerSetup({ players, onPlayersChange, previousNames = [], maxPlayers = 8 }) {
  const addPlayer = () => {
    if (players.length >= maxPlayers) return;
    onPlayersChange([...players, `Player ${players.length + 1}`]);
  };

  const removePlayer = (index) => {
    if (players.length <= 1) return;
    onPlayersChange(players.filter((_, i) => i !== index));
  };

  const updateName = (index, name) => {
    const updated = [...players];
    updated[index] = name;
    onPlayersChange(updated);
  };

  const addPreviousName = (name) => {
    // Fill the first empty/default slot, or add a new player
    const emptyIdx = players.findIndex((p, i) => p === `Player ${i + 1}` || p === '');
    if (emptyIdx >= 0) {
      updateName(emptyIdx, name);
    } else if (players.length < maxPlayers) {
      onPlayersChange([...players, name]);
    }
  };

  // Filter out names already in use
  const availableNames = previousNames.filter(n => !players.includes(n));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Players ({players.length})
        </label>
        {players.length < maxPlayers && (
          <button
            onClick={addPlayer}
            className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            + Add Player
          </button>
        )}
      </div>

      {/* Previous names quick-pick */}
      {availableNames.length > 0 && (
        <div className="mb-3">
          <div className="text-[11px] text-slate-400 mb-1.5">Quick add:</div>
          <div className="flex flex-wrap gap-1.5">
            {availableNames.slice(0, 8).map(name => (
              <button
                key={name}
                onClick={() => addPreviousName(name)}
                className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold
                           hover:bg-orange-100 transition-colors border border-orange-200"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {players.map((name, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white rounded-xl p-2.5 border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center
                            text-white font-bold text-sm shrink-0">
              {idx + 1}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => updateName(idx, e.target.value)}
              className="flex-1 bg-transparent font-semibold text-slate-700 outline-none min-w-0"
              style={{ fontSize: '16px' }}
              placeholder={`Player ${idx + 1}`}
              maxLength={20}
            />
            {players.length > 1 && (
              <button
                onClick={() => removePlayer(idx)}
                className="text-slate-300 hover:text-red-400 transition-colors text-lg shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick player count */}
      <div className="flex gap-2 mt-3">
        {[2, 3, 4].map(count => (
          <button
            key={count}
            onClick={() => {
              const newPlayers = Array.from({ length: count }, (_, i) =>
                players[i] || `Player ${i + 1}`
              );
              onPlayersChange(newPlayers);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              players.length === count
                ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {count} players
          </button>
        ))}
      </div>
    </div>
  );
}
