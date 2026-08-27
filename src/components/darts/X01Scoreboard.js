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
                ? 'bg-game-darts/10 border-2 border-game-darts shadow-md'
                : 'bg-card border border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  isActive ? 'bg-game-darts' : 'bg-muted-foreground'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-foreground text-sm">{player.name}</div>
                  <div className="flex gap-3 text-[11px] text-muted-foreground">
                    <span>Avg: {avg}</span>
                    <span>High: {highest}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold font-mono ${
                  isActive ? 'text-game-darts' : 'text-foreground'
                }`}>
                  {remaining}
                </div>
                {legs > 1 && (
                  <div className="text-[11px] text-muted-foreground">
                    Legs: {playerLegs}/{Math.ceil(legs / 2)}
                  </div>
                )}
              </div>
            </div>
            {isActive && (
              <div className="mt-1.5 h-1 bg-game-darts/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-game-darts rounded-full transition-all duration-500"
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
