import React from 'react';

export default function X01Scoreboard({ players, remainingScores, currentPlayerIndex, turns, legsWon, legs }) {
  return (
    <div className="space-y-2">
      {players.map((player, idx) => {
        const remaining = remainingScores[idx] ?? 0;
        const isActive = idx === currentPlayerIndex;
        const playerTurns = turns.filter(t => t.playerIndex === idx && !t.bust);
        const totalScored = playerTurns.reduce((sum, t) => sum + t.total, 0);
        const dartCount = playerTurns.length * 3;
        const avg = dartCount > 0 ? ((totalScored / dartCount) * 3).toFixed(1) : '-';
        const highest = playerTurns.length > 0 ? Math.max(...playerTurns.map(t => t.total)) : '-';
        const playerLegs = legsWon?.[idx] || 0;

        return (
          <div
            key={idx}
            className={`p-3 rounded-xl transition-all ${
              isActive
                ? 'bg-red-50 border-2 border-red-400 shadow-md'
                : 'bg-white border border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  isActive ? 'bg-red-500' : 'bg-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-700 text-sm">{player.name}</div>
                  <div className="flex gap-3 text-[11px] text-slate-400">
                    <span>Avg: {avg}</span>
                    <span>High: {highest}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold font-mono ${
                  isActive ? 'text-red-600' : 'text-slate-700'
                }`}>
                  {remaining}
                </div>
                {legs > 1 && (
                  <div className="text-[11px] text-slate-400">
                    Legs: {playerLegs}/{Math.ceil(legs / 2)}
                  </div>
                )}
              </div>
            </div>
            {isActive && (
              <div className="mt-1.5 h-1 bg-red-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${((remainingScores[idx] !== undefined ? (1 - remaining / (remainingScores._startingScore || 501)) : 0)) * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
