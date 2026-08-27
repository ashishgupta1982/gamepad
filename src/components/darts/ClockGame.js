import React, { useState } from 'react';

const CLOCK_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1).concat(['Bull']);

export default function ClockGame({
  players,
  dartsConfig,
  onUpdateConfig,
  onGameOver,
  onBack
}) {
  const [notification, setNotification] = useState(null);

  const {
    currentPlayerIndex,
    currentRound,
    clockTargets,
    turns
  } = dartsConfig;

  const currentTarget = clockTargets[currentPlayerIndex];

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleHit = () => {
    const newTargets = [...clockTargets];
    const nextTarget = currentTarget + 1;
    newTargets[currentPlayerIndex] = nextTarget;

    const turn = {
      playerIndex: currentPlayerIndex,
      round: currentRound,
      hit: true,
      target: currentTarget
    };

    const newTurns = [...turns, turn];

    // Check win (hit all 20 + bull = target becomes 22)
    if (nextTarget > 21) {
      showNotification(`${players[currentPlayerIndex].name} wins!`);
      onUpdateConfig({
        ...dartsConfig,
        clockTargets: newTargets,
        turns: newTurns
      });
      onGameOver();
      return;
    }

    showNotification(`Hit! Next: ${nextTarget <= 20 ? nextTarget : 'Bull'}`);

    let nextPlayer = (currentPlayerIndex + 1) % players.length;
    let nextRound = currentRound;
    if (nextPlayer === 0) nextRound = currentRound + 1;

    onUpdateConfig({
      ...dartsConfig,
      clockTargets: newTargets,
      turns: newTurns,
      currentPlayerIndex: nextPlayer,
      currentRound: nextRound
    });
  };

  const handleMiss = () => {
    const turn = {
      playerIndex: currentPlayerIndex,
      round: currentRound,
      hit: false,
      target: currentTarget
    };

    const newTurns = [...turns, turn];

    let nextPlayer = (currentPlayerIndex + 1) % players.length;
    let nextRound = currentRound;
    if (nextPlayer === 0) nextRound = currentRound + 1;

    onUpdateConfig({
      ...dartsConfig,
      turns: newTurns,
      currentPlayerIndex: nextPlayer,
      currentRound: nextRound
    });
  };

  const handleUndo = () => {
    if (turns.length === 0) return;

    const lastTurn = turns[turns.length - 1];
    const newTurns = turns.slice(0, -1);
    const newTargets = [...clockTargets];

    if (lastTurn.hit) {
      newTargets[lastTurn.playerIndex] = lastTurn.target;
    }

    onUpdateConfig({
      ...dartsConfig,
      clockTargets: newTargets,
      turns: newTurns,
      currentPlayerIndex: lastTurn.playerIndex,
      currentRound: lastTurn.round
    });

    showNotification('Turn undone');
  };

  const targetLabel = currentTarget <= 20 ? currentTarget : 'Bull';
  const progress = ((currentTarget - 1) / 21) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">Round {currentRound}</div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="mb-3 text-center">
          <div className="inline-block bg-warning/10 text-warning px-4 py-2 rounded-full text-sm font-semibold">
            {notification}
          </div>
        </div>
      )}

      {/* Player cards */}
      <div className="space-y-2 mb-4">
        {players.map((player, idx) => {
          const target = clockTargets[idx];
          const pProgress = ((target - 1) / 21) * 100;
          const isActive = idx === currentPlayerIndex;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-success/10 border-2 border-success shadow-md'
                  : 'bg-card border border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    isActive ? 'bg-success' : 'bg-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-foreground text-sm">{player.name}</span>
                </div>
                <div className={`text-xl font-bold font-mono ${isActive ? 'text-success' : 'text-muted-foreground'}`}>
                  {target <= 20 ? target : target > 21 ? 'Done!' : 'Bull'}
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isActive ? 'bg-success' : 'bg-border'
                  }`}
                  style={{ width: `${pProgress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Current target display */}
      <div className="text-center mb-4">
        <div className="text-sm text-muted-foreground mb-1">{players[currentPlayerIndex]?.name} needs to hit</div>
        <div className="text-6xl font-bold text-success mb-1">{targetLabel}</div>
        <div className="text-xs text-muted-foreground">{Math.round(progress)}% complete</div>
      </div>

      {/* Hit / Miss buttons */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={handleMiss}
          className="py-5 bg-muted text-muted-foreground font-bold text-xl rounded-2xl
                     hover:bg-border transition-all active:scale-95"
        >
          Miss
        </button>
        <button
          onClick={handleHit}
          className="py-5 bg-success text-white font-bold text-xl rounded-2xl shadow-md
                     hover:bg-success transition-all active:scale-95"
        >
          Hit!
        </button>
      </div>

      {/* Undo */}
      <button
        onClick={handleUndo}
        disabled={turns.length === 0}
        className={`w-full py-3 font-semibold rounded-xl transition-all active:scale-95 text-sm ${
          turns.length > 0
            ? 'bg-warning/10 text-warning hover:bg-warning/20'
            : 'bg-muted text-border'
        }`}
      >
        ↩ Undo Last
      </button>

      {/* Number progress grid */}
      <div className="mt-4">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Progress</h4>
        <div className="grid grid-cols-7 gap-1.5">
          {CLOCK_NUMBERS.map((num, idx) => {
            const numIdx = idx + 1;
            return (
              <div
                key={idx}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                  players.some((_, pIdx) => clockTargets[pIdx] > numIdx)
                    ? 'bg-success/10 text-success'
                    : numIdx === currentTarget && true
                      ? 'bg-success text-white ring-2 ring-success'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {num === 'Bull' ? 'B' : num}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
