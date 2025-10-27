import React, { useState, useEffect, useRef } from 'react';

export default function Leaderboard({ game, compact = false }) {
  const [playersWithScores, setPlayersWithScores] = useState([]);
  const prevPositions = useRef({});

  useEffect(() => {
    const newPlayers = game.players.map((player, index) => ({
      ...player,
      index,
      totalScore: player.scores.reduce((sum, score) => sum + score, 0),
      correctCount: player.scores.filter(s => s === 1).length,
      roundsPlayed: game.quizConfig?.currentRound || 1
    })).sort((a, b) => b.totalScore - a.totalScore);

    // Track position changes for animation
    newPlayers.forEach((player, newRank) => {
      const prevRank = prevPositions.current[player.index];
      if (prevRank !== undefined && prevRank !== newRank) {
        player.positionChange = prevRank - newRank; // positive = moved up, negative = moved down
      }
      prevPositions.current[player.index] = newRank;
    });

    setPlayersWithScores(newPlayers);
  }, [game.players, game.quizConfig]);

  const currentQIndex = game.quizConfig?.currentQuestionIndex || 0;
  const currentRound = game.quizConfig?.currentRound || 1;
  const rounds = game.quizConfig?.rounds || [];

  // Compact horizontal layout for mobile/tablet
  if (compact) {
    return (
      <div className="bg-white rounded-lg px-3 py-2 shadow-md">
        <div className="flex gap-1.5 overflow-x-auto">
          {playersWithScores.map((player, rank) => {
            const emoji = rank === 0 ? '👑' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
            const bgColor = rank === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                            rank === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                            rank === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700' :
                            'bg-slate-100 border border-slate-200';
            const textColor = rank < 3 ? 'text-white' : 'text-slate-700';
            
            return (
              <div
                key={player.index}
                className={`${bgColor} ${textColor} px-2.5 py-1.5 rounded-lg transition-all duration-500 flex-shrink-0 min-w-[80px]`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-xs">{emoji}</span>
                  <span className="font-bold text-[10px] whitespace-nowrap truncate max-w-[60px]">{player.name}</span>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold">{player.totalScore}</div>
                  <div className={`text-[8px] ${rank < 3 ? 'text-white/80' : 'text-slate-500'}`}>
                    {player.correctCount}/{player.roundsPlayed}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Original vertical layout for desktop
  return (
    <div className="bg-white rounded-xl p-3 shadow-lg sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
        <span className="text-xl">🏆</span>
        <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Leaderboard</h3>
      </div>
      
      <div className="space-y-1.5">
        {playersWithScores.map((player, rank) => {
          const positionColor = rank === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                rank === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                                rank === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700' :
                                'bg-slate-50 border border-slate-200';
          const emoji = rank === 0 ? '👑' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
          const isAnimated = player.positionChange && Math.abs(player.positionChange) > 0;
          
          return (
            <div
              key={player.index}
              className={`${positionColor} ${rank < 3 ? 'text-white' : 'text-slate-700'} p-2 rounded-md transition-all duration-500 text-xs ${
                isAnimated ? (player.positionChange > 0 ? 'animate-slideUp' : 'animate-slideDown') : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{emoji}</span>
                  <span className="font-bold truncate max-w-[90px]">{player.name}</span>
                </div>
                <div className="text-base font-bold">{player.totalScore}</div>
              </div>
              
              {/* Show round-by-round scores */}
              {rounds.length > 0 && (
                <div className={`text-[10px] mt-0.5 ${rank < 3 ? 'text-white/80' : 'text-slate-500'}`}>
                  {player.correctCount}/{player.roundsPlayed}
                  {isAnimated && (
                    <span className="ml-1">
                      {player.positionChange > 0 ? '⬆️' : '⬇️'}
                    </span>
                  )}
                </div>
              )}
              
              {/* Show per-round score breakdown */}
              {rounds.length > 1 && (
                <div className="mt-1 pt-1 border-t border-slate-300/30">
                  {rounds.map((round, idx) => {
                    const roundScore = player.scores.slice(
                      (round.roundNumber - 1) * game.quizConfig.totalQuestions,
                      round.roundNumber * game.quizConfig.totalQuestions
                    ).filter(s => s === 1).length;
                    
                    const categoryEmojis = {
                      'General Knowledge': '💡',
                      'Food & Drink': '🍕',
                      'Sport': '⚽',
                      'Nature': '🌿',
                      'Music and Film': '🎬',
                      'History': '📜',
                      'Geography': '🗺️',
                      'Science': '🔬',
                      'Riddles': '🧩'
                    };
                    
                    const firstCategory = round.categories[0];
                    const emoji = categoryEmojis[firstCategory] || '📝';
                    
                    return (
                      <div key={idx} className="flex items-center justify-between text-[9px] mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <span>{emoji}</span>
                          <span>R{round.roundNumber}</span>
                        </span>
                        <span className="font-bold">{roundScore}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {currentQIndex > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200">
          <div className="text-[10px] text-slate-400 text-center">
            Round {currentRound}
          </div>
        </div>
      )}
    </div>
  );
}

