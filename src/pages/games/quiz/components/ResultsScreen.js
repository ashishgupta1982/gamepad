import React from 'react';

export default function ResultsScreen({ game, onStartNewRound, onEndGame, onBack }) {
  const playersWithScores = game.players.map((player, index) => ({
    ...player,
    index,
    totalScore: player.scores.reduce((sum, score) => sum + score, 0),
    percentage: ((player.scores.filter(s => s === 1).length / (game.quizConfig?.totalQuestions || 1)) * 100).toFixed(0)
  })).sort((a, b) => b.totalScore - a.totalScore);

  const winner = playersWithScores[0];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="text-purple-600 hover:text-purple-700 font-semibold"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl mb-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-4xl font-bold text-purple-600 mb-2">Game Complete!</h2>
        <div className="text-3xl font-bold text-slate-700 mb-6">
          {winner.name} Wins! 👑
        </div>
        <div className="text-xl text-slate-600">
          Final Score: {winner.totalScore}/{game.quizConfig.totalQuestions} ({winner.percentage}%)
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <h3 className="text-2xl font-bold text-slate-700 mb-4">Final Standings</h3>
        <div className="space-y-3">
          {playersWithScores.map((player, rank) => {
            const percentage = ((player.scores.filter(s => s === 1).length / (game.quizConfig?.totalQuestions || 1)) * 100).toFixed(0);
            const positionColor = rank === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                  rank === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                  rank === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                                  'bg-slate-100';
            const emoji = rank === 0 ? '👑' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
            
            return (
              <div
                key={player.index}
                className={`${positionColor} text-white p-4 rounded-xl`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-bold text-lg">{player.name}</span>
                  </div>
                  <div className="text-xl font-bold">
                    {player.totalScore}/{game.quizConfig?.totalQuestions || 0} ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={onStartNewRound}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg"
        >
          New Round ➕
        </button>
        <button
          onClick={onEndGame}
          className="bg-red-500 text-white py-4 rounded-xl text-xl font-bold hover:bg-red-600 transform transition-all shadow-lg"
        >
          End Game
        </button>
      </div>
    </div>
  );
}

