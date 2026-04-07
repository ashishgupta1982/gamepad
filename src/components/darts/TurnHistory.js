import React from 'react';

export default function TurnHistory({ turns, players, maxVisible = 10 }) {
  const recentTurns = [...turns].reverse().slice(0, maxVisible);

  if (recentTurns.length === 0) {
    return (
      <div className="text-center text-slate-400 text-sm py-4">
        No turns yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Recent Turns</h4>
      {recentTurns.map((turn, idx) => {
        const playerName = players[turn.playerIndex]?.name || `P${turn.playerIndex + 1}`;
        return (
          <div
            key={turns.length - 1 - idx}
            className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm
              ${turn.bust ? 'bg-red-50 text-red-700' : turn.checkout ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'}`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-slate-400">R{turn.round}</span>
              <span className="font-semibold">{playerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">
                {turn.bust ? 'BUST' : turn.total}
              </span>
              {turn.checkout && <span className="text-xs">🎯</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
