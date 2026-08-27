import React from 'react';

export default function DartsGameOver({ players, dartsConfig, onPlayAgain, onEndGame }) {
  const mode = dartsConfig?.gameMode;

  // Determine winner based on game mode
  let winner = null;
  let stats = [];

  if (mode === 'x01') {
    // Winner has most legs won, or first to reach required legs
    const legsWon = dartsConfig.legsWon || [];
    const maxLegs = Math.max(...legsWon);
    const winnerIdx = legsWon.indexOf(maxLegs);
    winner = players[winnerIdx];

    stats = players.map((p, i) => {
      const playerTurns = (dartsConfig.turns || []).filter(t => t.playerIndex === i && !t.bust);
      const totalScore = playerTurns.reduce((sum, t) => sum + t.total, 0);
      const dartCount = playerTurns.length * 3;
      const avg = dartCount > 0 ? ((totalScore / dartCount) * 3).toFixed(1) : '0.0';
      const highest = playerTurns.length > 0 ? Math.max(...playerTurns.map(t => t.total)) : 0;
      const checkouts = playerTurns.filter(t => t.checkout).length;

      return {
        name: p.name,
        legsWon: legsWon[i] || 0,
        average: avg,
        highest,
        checkouts,
        totalDarts: (dartsConfig.turns || []).filter(t => t.playerIndex === i).length * 3
      };
    });
  } else if (mode === 'cricket') {
    const points = dartsConfig.cricketPoints || [];
    const maxPoints = Math.max(...points);
    const winnerIdx = points.indexOf(maxPoints);
    winner = players[winnerIdx];
    stats = players.map((p, i) => ({
      name: p.name,
      points: points[i] || 0
    }));
  } else if (mode === 'around-the-clock') {
    const targets = dartsConfig.clockTargets || [];
    const maxTarget = Math.max(...targets);
    const winnerIdx = targets.indexOf(maxTarget);
    winner = players[winnerIdx];
    stats = players.map((p, i) => ({
      name: p.name,
      reached: targets[i] > 21 ? 'Finished!' : `Number ${targets[i]}`
    }));
  } else if (mode === 'killer') {
    const lives = dartsConfig.killerLives || [];
    const aliveIdx = lives.findIndex(l => l > 0);
    winner = aliveIdx >= 0 ? players[aliveIdx] : null;
    stats = players.map((p, i) => ({
      name: p.name,
      lives: lives[i] || 0,
      wasKiller: dartsConfig.killerActive?.[i] || false
    }));
  }

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Winner announcement */}
      <div className="mb-6">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Game Over!</h1>
        {winner && (
          <p className="text-xl text-game-darts font-semibold">{winner.name} wins!</p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-card rounded-2xl p-4 shadow-md border border-border mb-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Results</h3>
        <div className="space-y-3">
          {stats.map((s, idx) => (
            <div key={idx} className={`p-3 rounded-xl ${idx === 0 && mode === 'x01' ? 'bg-warning/10 border border-warning/30' : 'bg-muted'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground">{s.name}</span>
                {mode === 'x01' && (
                  <span className="text-sm font-semibold text-game-darts">{s.legsWon} leg{s.legsWon !== 1 ? 's' : ''}</span>
                )}
                {mode === 'cricket' && (
                  <span className="text-sm font-semibold text-accent">{s.points} pts</span>
                )}
              </div>
              {mode === 'x01' && (
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Avg: {s.average}</span>
                  <span>High: {s.highest}</span>
                  <span>Checkouts: {s.checkouts}</span>
                  <span>Darts: {s.totalDarts}</span>
                </div>
              )}
              {mode === 'around-the-clock' && (
                <div className="text-xs text-muted-foreground">{s.reached}</div>
              )}
              {mode === 'killer' && (
                <div className="text-xs text-muted-foreground">
                  Lives: {s.lives} {s.wasKiller ? '(Killer)' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-4 bg-gradient-to-r from-game-darts to-game-darts-deep text-white font-bold
                     text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          Play Again
        </button>
        <button
          onClick={onEndGame}
          className="px-6 py-4 bg-border text-foreground font-bold text-lg rounded-xl
                     hover:bg-border transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
}
