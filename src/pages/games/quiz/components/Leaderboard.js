import React from 'react';

export default function Leaderboard({ game }) {
  const playersWithScores = game.players.map((player, index) => ({
    ...player,
    index,
    totalScore: player.scores.reduce((sum, score) => sum + score, 0)
  })).sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-slate-700 mb-4">🏆 Leaderboard</h3>
      <div className="space-y-3">
        {playersWithScores.map((player, rank) => {
          const positionColor = rank === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                rank === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                rank === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                                'bg-slate-100';
          const emoji = rank === 0 ? '👑' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
          
          return (
            <div
              key={player.index}
              className={`${positionColor} text-white p-4 rounded-xl transition-all hover:scale-105 transform`}
              style={{
                animation: `slideIn 0.5s ease-out ${rank * 0.1}s both`
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-bold text-lg">{player.name}</span>
                </div>
                <div className="text-xl font-bold">{player.totalScore}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

