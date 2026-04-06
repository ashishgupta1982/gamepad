import React from 'react';
import { ANSWER_COLORS } from '@/data/quizConstants';

export default function SameDeviceAnswerZones({
  players,
  options,
  playerAnswers,
  onPlayerAnswer,
  revealed,
  correctAnswer,
  disabled
}) {
  const playerCount = players.length;

  const getCols = () => {
    if (playerCount <= 2) return 'grid-cols-2';
    if (playerCount <= 4) return 'grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div className={`grid ${getCols()} gap-3`}>
      {players.map((player, playerIdx) => {
        const playerAnswer = playerAnswers[playerIdx];
        const hasAnswered = playerAnswer !== undefined && playerAnswer !== null;

        return (
          <div
            key={player.id || player.name || playerIdx}
            className={`rounded-2xl p-3 transition-all ${
              hasAnswered
                ? 'bg-white/60 ring-2 ring-green-400'
                : 'bg-white/90 shadow-md'
            }`}
          >
            {/* Player header */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: player.avatarColor || '#6c5ce7' }}
              >
                {player.avatar || player.name?.[0]?.toUpperCase()}
              </div>
              <span className="font-bold text-slate-700 text-sm truncate">{player.name}</span>
              {hasAnswered && !revealed && (
                <span className="ml-auto text-green-500 text-sm">✓</span>
              )}
            </div>

            {/* Answer buttons */}
            {hasAnswered && !revealed ? (
              <div className="text-center py-4 text-slate-400 text-sm font-medium">
                Answer locked in!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {options.map((option, optIdx) => {
                  const color = ANSWER_COLORS[optIdx];
                  let opacity = 1;
                  let ring = '';

                  if (revealed) {
                    if (optIdx === correctAnswer) {
                      ring = 'ring-2 ring-white';
                    } else {
                      opacity = 0.3;
                    }
                    if (playerAnswer === optIdx && optIdx !== correctAnswer) {
                      opacity = 0.6;
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => !disabled && !revealed && !hasAnswered && onPlayerAnswer(playerIdx, optIdx)}
                      disabled={disabled || revealed || hasAnswered}
                      className={`p-2 rounded-lg text-white font-bold text-xs transition-all
                                  active:scale-95 select-none ${ring}`}
                      style={{ backgroundColor: color.bg, opacity }}
                    >
                      <div className="flex items-center gap-1">
                        <span className="opacity-70">{color.icon}</span>
                        <span className="truncate leading-tight">{option}</span>
                      </div>
                      {revealed && optIdx === correctAnswer && (
                        <span className="text-xs">✓</span>
                      )}
                      {revealed && playerAnswer === optIdx && optIdx !== correctAnswer && (
                        <span className="text-xs">✗</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
