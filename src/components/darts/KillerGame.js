import React, { useState } from 'react';

export default function KillerGame({
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
    killerNumbers,
    killerLives,
    killerActive,
    turns
  } = dartsConfig;

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const alivePlayers = players.filter((_, idx) => killerLives[idx] > 0);
  const currentPlayerAlive = killerLives[currentPlayerIndex] > 0;
  const currentIsKiller = killerActive[currentPlayerIndex];

  // Find next alive player
  const getNextAlivePlayer = (fromIdx) => {
    let next = (fromIdx + 1) % players.length;
    let attempts = 0;
    while (killerLives[next] <= 0 && attempts < players.length) {
      next = (next + 1) % players.length;
      attempts++;
    }
    return next;
  };

  const handleBecomeKiller = () => {
    // Player hits their own double to become a killer
    const newActive = [...killerActive];
    newActive[currentPlayerIndex] = true;

    const turn = {
      playerIndex: currentPlayerIndex,
      round: currentRound,
      action: 'activate',
      target: currentPlayerIndex
    };

    const newTurns = [...turns, turn];
    showNotification(`${players[currentPlayerIndex].name} is now a Killer!`);

    let nextPlayer = getNextAlivePlayer(currentPlayerIndex);
    let nextRound = currentRound;
    if (nextPlayer <= currentPlayerIndex) nextRound = currentRound + 1;

    onUpdateConfig({
      ...dartsConfig,
      killerActive: newActive,
      turns: newTurns,
      currentPlayerIndex: nextPlayer,
      currentRound: nextRound
    });
  };

  const handleHitPlayer = (targetIdx) => {
    if (targetIdx === currentPlayerIndex) return; // Can't hit yourself
    if (killerLives[targetIdx] <= 0) return; // Already eliminated

    const newLives = [...killerLives];
    newLives[targetIdx] = Math.max(0, newLives[targetIdx] - 1);

    const turn = {
      playerIndex: currentPlayerIndex,
      round: currentRound,
      action: 'hit',
      target: targetIdx
    };

    const newTurns = [...turns, turn];

    if (newLives[targetIdx] === 0) {
      showNotification(`${players[targetIdx].name} eliminated!`);
    } else {
      showNotification(`${players[targetIdx].name} loses a life! (${newLives[targetIdx]} left)`);
    }

    // Check win condition
    const aliveCount = newLives.filter(l => l > 0).length;
    if (aliveCount <= 1) {
      onUpdateConfig({
        ...dartsConfig,
        killerLives: newLives,
        turns: newTurns
      });
      onGameOver();
      return;
    }

    let nextPlayer = getNextAlivePlayer(currentPlayerIndex);
    let nextRound = currentRound;
    if (nextPlayer <= currentPlayerIndex) nextRound = currentRound + 1;

    onUpdateConfig({
      ...dartsConfig,
      killerLives: newLives,
      turns: newTurns,
      currentPlayerIndex: nextPlayer,
      currentRound: nextRound
    });
  };

  const handleMiss = () => {
    const turn = {
      playerIndex: currentPlayerIndex,
      round: currentRound,
      action: 'miss',
      target: -1
    };

    const newTurns = [...turns, turn];

    let nextPlayer = getNextAlivePlayer(currentPlayerIndex);
    let nextRound = currentRound;
    if (nextPlayer <= currentPlayerIndex) nextRound = currentRound + 1;

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

    const newLives = [...killerLives];
    const newActive = [...killerActive];

    if (lastTurn.action === 'activate') {
      newActive[lastTurn.playerIndex] = false;
    } else if (lastTurn.action === 'hit') {
      newLives[lastTurn.target] = (newLives[lastTurn.target] || 0) + 1;
    }

    onUpdateConfig({
      ...dartsConfig,
      killerLives: newLives,
      killerActive: newActive,
      turns: newTurns,
      currentPlayerIndex: lastTurn.playerIndex,
      currentRound: lastTurn.round
    });

    showNotification('Turn undone');
  };

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

      {/* Player status cards */}
      <div className="space-y-2 mb-4">
        {players.map((player, idx) => {
          const isActive = idx === currentPlayerIndex;
          const alive = killerLives[idx] > 0;
          const isKiller = killerActive[idx];

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl transition-all ${
                !alive
                  ? 'bg-muted border border-border opacity-50'
                  : isActive
                    ? 'bg-brand/10 border-2 border-brand shadow-md'
                    : 'bg-card border border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    !alive ? 'bg-border' : isKiller ? 'bg-brand' : 'bg-muted-foreground'
                  }`}>
                    {killerNumbers[idx]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm ${alive ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {player.name}
                      </span>
                      {isKiller && alive && (
                        <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full font-bold">
                          KILLER
                        </span>
                      )}
                      {!alive && (
                        <span className="text-[10px] bg-border text-muted-foreground px-1.5 py-0.5 rounded-full font-bold">
                          OUT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Double {killerNumbers[idx]}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map(life => (
                    <div
                      key={life}
                      className={`w-4 h-4 rounded-full ${
                        life <= killerLives[idx] ? 'bg-game-darts' : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current player action */}
      <div className="text-center mb-3">
        <div className="text-sm text-muted-foreground mb-1">{players[currentPlayerIndex]?.name}&apos;s turn</div>
        {!currentIsKiller ? (
          <div className="text-sm text-brand font-semibold">
            Hit Double {killerNumbers[currentPlayerIndex]} to become a Killer!
          </div>
        ) : (
          <div className="text-sm text-brand font-semibold">
            Hit an opponent&apos;s double to remove a life!
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!currentIsKiller ? (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={handleMiss}
            className="py-5 bg-muted text-muted-foreground font-bold text-lg rounded-2xl
                       hover:bg-border transition-all active:scale-95"
          >
            Miss
          </button>
          <button
            onClick={handleBecomeKiller}
            className="py-5 bg-brand text-white font-bold text-lg rounded-2xl shadow-md
                       hover:bg-brand transition-all active:scale-95"
          >
            Hit D{killerNumbers[currentPlayerIndex]}!
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-2">
            {players.map((player, idx) => {
              if (idx === currentPlayerIndex || killerLives[idx] <= 0) return null;
              return (
                <button
                  key={idx}
                  onClick={() => handleHitPlayer(idx)}
                  className="py-4 bg-game-darts/10 border-2 border-game-darts/30 text-game-darts font-bold text-sm rounded-xl
                             hover:bg-game-darts/10 hover:border-game-darts/30 transition-all active:scale-95"
                >
                  Hit {player.name}
                  <div className="text-[11px] font-normal text-game-darts">D{killerNumbers[idx]}</div>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleMiss}
            className="w-full py-4 bg-muted text-muted-foreground font-bold text-lg rounded-2xl
                       hover:bg-border transition-all active:scale-95"
          >
            Miss
          </button>
        </div>
      )}

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
    </div>
  );
}
