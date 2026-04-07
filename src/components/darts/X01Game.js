import React, { useState } from 'react';
import ScoreInput from './ScoreInput';
import X01Scoreboard from './X01Scoreboard';
import TurnHistory from './TurnHistory';
import { getCheckout } from './CheckoutSuggestion';
import { MAX_CHECKOUT } from '@/data/dartsConstants';

export default function X01Game({
  players,
  dartsConfig,
  onUpdateConfig,
  onLegWon,
  onGameOver,
  onBack
}) {
  const [notification, setNotification] = useState(null);

  const {
    startingScore,
    doubleOut,
    currentPlayerIndex,
    currentRound,
    currentLeg,
    legs,
    legsWon,
    turns,
    remainingScores
  } = dartsConfig;

  const currentRemaining = remainingScores[currentPlayerIndex];
  const checkout = currentRemaining <= MAX_CHECKOUT ? getCheckout(currentRemaining) : null;

  const handleScore = (score) => {
    const remaining = remainingScores[currentPlayerIndex];
    const newRemaining = remaining - score;

    // Check bust
    let bust = false;
    if (newRemaining < 0) bust = true;
    if (doubleOut && newRemaining === 1) bust = true; // Can't finish on 1 with double-out
    if (newRemaining < 0) bust = true;

    const isCheckout = newRemaining === 0;

    const turn = {
      playerIndex: currentPlayerIndex,
      round: currentRound,
      leg: currentLeg,
      darts: [score],
      total: score,
      bust,
      checkout: isCheckout
    };

    const newTurns = [...turns, turn];
    const newRemainings = [...remainingScores];

    if (bust) {
      // Score stays the same
      showNotification('BUST! Score reverted.');
    } else {
      newRemainings[currentPlayerIndex] = newRemaining;
    }

    // Move to next player
    let nextPlayer = (currentPlayerIndex + 1) % players.length;
    let nextRound = currentRound;
    if (nextPlayer === 0) {
      nextRound = currentRound + 1;
    }

    if (isCheckout) {
      // Leg won!
      const newLegsWon = [...(legsWon || players.map(() => 0))];
      newLegsWon[currentPlayerIndex] = (newLegsWon[currentPlayerIndex] || 0) + 1;

      const legsToWin = Math.ceil(legs / 2);

      if (newLegsWon[currentPlayerIndex] >= legsToWin) {
        // Game over!
        onUpdateConfig({
          ...dartsConfig,
          turns: newTurns,
          remainingScores: newRemainings,
          legsWon: newLegsWon
        });
        onGameOver();
        return;
      }

      // Start new leg
      showNotification(`${players[currentPlayerIndex].name} wins the leg!`);
      onLegWon(currentPlayerIndex);

      onUpdateConfig({
        ...dartsConfig,
        turns: newTurns,
        legsWon: newLegsWon,
        remainingScores: players.map(() => startingScore),
        currentPlayerIndex: 0,
        currentRound: 1,
        currentLeg: (currentLeg || 1) + 1
      });
      return;
    }

    onUpdateConfig({
      ...dartsConfig,
      turns: newTurns,
      remainingScores: newRemainings,
      currentPlayerIndex: nextPlayer,
      currentRound: nextRound
    });
  };

  const handleUndo = () => {
    if (turns.length === 0) return;

    const lastTurn = turns[turns.length - 1];
    const newTurns = turns.slice(0, -1);
    const newRemainings = [...remainingScores];

    // Restore score if it wasn't a bust
    if (!lastTurn.bust) {
      newRemainings[lastTurn.playerIndex] = newRemainings[lastTurn.playerIndex] + lastTurn.total;
    }

    onUpdateConfig({
      ...dartsConfig,
      turns: newTurns,
      remainingScores: newRemainings,
      currentPlayerIndex: lastTurn.playerIndex,
      currentRound: lastTurn.round
    });

    showNotification('Turn undone');
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onBack} className="text-red-500 hover:text-red-600 font-semibold text-sm">
          ← Back
        </button>
        <div className="text-sm text-slate-500">
          Round {currentRound}
          {legs > 1 && ` · Leg ${currentLeg}/${legs}`}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="mb-3 text-center">
          <div className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
            {notification}
          </div>
        </div>
      )}

      {/* Scoreboard */}
      <div className="mb-4">
        <X01Scoreboard
          players={players}
          remainingScores={remainingScores}
          currentPlayerIndex={currentPlayerIndex}
          turns={turns}
          legsWon={legsWon}
          legs={legs}
        />
      </div>

      {/* Score Input */}
      <ScoreInput
        currentPlayer={players[currentPlayerIndex]?.name}
        remainingScore={currentRemaining}
        onSubmit={handleScore}
        onUndo={handleUndo}
        canUndo={turns.length > 0}
        checkoutSuggestion={checkout}
      />

      {/* Turn History */}
      <div className="mt-4">
        <TurnHistory turns={turns} players={players} />
      </div>
    </div>
  );
}
