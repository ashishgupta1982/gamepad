import React, { useState } from 'react';
import CricketBoard from './CricketBoard';
import CricketInput from './CricketInput';
import { CRICKET_TARGETS } from '@/data/dartsConstants';

export default function CricketGame({
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
    cricketMarks,
    cricketPoints,
    turns
  } = dartsConfig;

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const checkWin = (marks, points) => {
    // A player wins if they've closed all targets AND have >= points of all opponents
    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      const allClosed = CRICKET_TARGETS.every((_, tIdx) => marks[pIdx][tIdx] >= 3);
      if (!allClosed) continue;

      const hasHighestPoints = players.every((_, otherIdx) =>
        otherIdx === pIdx || points[pIdx] >= points[otherIdx]
      );

      if (hasHighestPoints) return pIdx;
    }
    return -1;
  };

  const handleSubmitMarks = (dartMarks) => {
    const newMarks = cricketMarks.map(p => [...p]);
    const newPoints = [...cricketPoints];

    for (const dart of dartMarks) {
      if (dart.targetIndex === -1) continue; // miss

      const tIdx = dart.targetIndex;
      const currentMarks = newMarks[currentPlayerIndex][tIdx];

      if (currentMarks >= 3) {
        // Already closed by this player - check if opponents have closed it
        const allOpponentsClosed = players.every((_, pIdx) =>
          pIdx === currentPlayerIndex || newMarks[pIdx][tIdx] >= 3
        );

        if (!allOpponentsClosed) {
          // Score points
          const target = CRICKET_TARGETS[tIdx];
          const pointValue = target === 'BULL' ? 25 : target;
          newPoints[currentPlayerIndex] += pointValue * dart.multiplier;
        }
      } else {
        // Add marks
        const marksToAdd = dart.multiplier;
        const marksNeeded = 3 - currentMarks;
        const marksApplied = Math.min(marksToAdd, marksNeeded);
        const overflow = marksToAdd - marksApplied;

        newMarks[currentPlayerIndex][tIdx] = currentMarks + marksApplied;

        // Overflow marks can score points if opponents haven't closed
        if (overflow > 0 && newMarks[currentPlayerIndex][tIdx] >= 3) {
          const allOpponentsClosed = players.every((_, pIdx) =>
            pIdx === currentPlayerIndex || newMarks[pIdx][tIdx] >= 3
          );

          if (!allOpponentsClosed) {
            const target = CRICKET_TARGETS[tIdx];
            const pointValue = target === 'BULL' ? 25 : target;
            newPoints[currentPlayerIndex] += pointValue * overflow;
          }
        }
      }
    }

    const turn = {
      playerIndex: currentPlayerIndex,
      round: currentRound,
      darts: dartMarks,
      total: newPoints[currentPlayerIndex] - cricketPoints[currentPlayerIndex]
    };

    const newTurns = [...turns, turn];

    // Check for win
    const winnerIdx = checkWin(newMarks, newPoints);

    let nextPlayer = (currentPlayerIndex + 1) % players.length;
    let nextRound = currentRound;
    if (nextPlayer === 0) nextRound = currentRound + 1;

    if (winnerIdx >= 0) {
      onUpdateConfig({
        ...dartsConfig,
        cricketMarks: newMarks,
        cricketPoints: newPoints,
        turns: newTurns
      });
      onGameOver();
      return;
    }

    onUpdateConfig({
      ...dartsConfig,
      cricketMarks: newMarks,
      cricketPoints: newPoints,
      turns: newTurns,
      currentPlayerIndex: nextPlayer,
      currentRound: nextRound
    });
  };

  const handleUndo = () => {
    if (turns.length === 0) return;

    const lastTurn = turns[turns.length - 1];
    const newTurns = turns.slice(0, -1);

    // Reverse the marks and points from the last turn
    const newMarks = cricketMarks.map(p => [...p]);
    const newPoints = [...cricketPoints];

    // We need to recalculate from scratch by replaying all turns except the last
    // Reset to initial state
    const resetMarks = players.map(() => CRICKET_TARGETS.map(() => 0));
    const resetPoints = players.map(() => 0);

    // Replay all turns except last
    for (const turn of newTurns) {
      if (!turn.darts) continue;
      for (const dart of turn.darts) {
        if (dart.targetIndex === -1) continue;

        const tIdx = dart.targetIndex;
        const currentMarks = resetMarks[turn.playerIndex][tIdx];

        if (currentMarks >= 3) {
          const allOpponentsClosed = players.every((_, pIdx) =>
            pIdx === turn.playerIndex || resetMarks[pIdx][tIdx] >= 3
          );
          if (!allOpponentsClosed) {
            const target = CRICKET_TARGETS[tIdx];
            const pointValue = target === 'BULL' ? 25 : target;
            resetPoints[turn.playerIndex] += pointValue * dart.multiplier;
          }
        } else {
          const marksToAdd = dart.multiplier;
          const marksNeeded = 3 - currentMarks;
          const marksApplied = Math.min(marksToAdd, marksNeeded);
          const overflow = marksToAdd - marksApplied;

          resetMarks[turn.playerIndex][tIdx] = currentMarks + marksApplied;

          if (overflow > 0 && resetMarks[turn.playerIndex][tIdx] >= 3) {
            const allOpponentsClosed = players.every((_, pIdx) =>
              pIdx === turn.playerIndex || resetMarks[pIdx][tIdx] >= 3
            );
            if (!allOpponentsClosed) {
              const target = CRICKET_TARGETS[tIdx];
              const pointValue = target === 'BULL' ? 25 : target;
              resetPoints[turn.playerIndex] += pointValue * overflow;
            }
          }
        }
      }
    }

    onUpdateConfig({
      ...dartsConfig,
      cricketMarks: resetMarks,
      cricketPoints: resetPoints,
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
        <button onClick={onBack} className="text-blue-500 hover:text-blue-600 font-semibold text-sm">
          ← Back
        </button>
        <div className="text-sm text-slate-500">Round {currentRound}</div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="mb-3 text-center">
          <div className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
            {notification}
          </div>
        </div>
      )}

      {/* Cricket Board */}
      <div className="mb-4">
        <CricketBoard
          players={players}
          cricketMarks={cricketMarks}
          cricketPoints={cricketPoints}
          currentPlayerIndex={currentPlayerIndex}
        />
      </div>

      {/* Input */}
      <CricketInput
        currentPlayer={players[currentPlayerIndex]?.name}
        onSubmitMarks={handleSubmitMarks}
        onUndo={handleUndo}
        canUndo={turns.length > 0}
      />
    </div>
  );
}
