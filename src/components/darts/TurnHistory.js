import React from 'react';

export default function TurnHistory({ turns, players, maxVisible = 10 }) {
  const recentTurns = [...turns].reverse().slice(0, maxVisible);

  if (recentTurns.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        No turns yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Recent Turns</h4>
      {recentTurns.map((turn, idx) => {
        const playerName = players[turn.playerIndex]?.name || `P${turn.playerIndex + 1}`;
        return (
          <div
            key={turns.length - 1 - idx}
            className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-sm
              ${turn.bust ? 'bg-game-darts/10 text-game-darts' : turn.checkout ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-muted-foreground">R{turn.round}</span>
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
