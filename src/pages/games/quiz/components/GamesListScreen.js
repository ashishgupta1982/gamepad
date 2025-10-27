import React from 'react';

export default function GamesListScreen({ games, onNewGame, onContinueGame, onDeleteGame }) {
  const activeGames = games.filter(g => g.status === 'active');
  const completedGames = games.filter(g => g.status === 'completed');

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLeader = (game) => {
    const totals = game.players.map(p => ({
      name: p.name,
      total: p.scores.reduce((sum, s) => sum + s, 0)
    }));
    totals.sort((a, b) => b.total - a.total);
    return totals[0];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => window.location.href = '/'}
        className="mb-6 text-purple-600 hover:text-purple-700 font-semibold text-sm md:text-base"
      >
        ← Back to Games
      </button>

      <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
        🧠 Quiz Game
      </h1>

      <div className="text-center mb-8">
        <button
          onClick={onNewGame}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg"
        >
          ➕ New Game
        </button>
      </div>

      {activeGames.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Active Games</h2>
          <div className="space-y-4">
            {activeGames.map(game => {
              const leader = getLeader(game);
              const questionsAnswered = game.quizConfig?.currentQuestionIndex || 0;
              const totalQuestions = game.quizConfig?.questions?.length || 0;
              return (
                <div key={game._id} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">
                        {formatDate(game.updatedAt)}
                      </div>
                      <div className="font-semibold text-slate-700">
                        {game.players.map(p => p.name).join(', ')}
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        👑 {leader.name} leading with {leader.total} points
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        Question {questionsAnswered + 1} of {totalQuestions}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onContinueGame(game)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold hover:scale-105 transform transition-all"
                      >
                        Continue
                      </button>
                      <button
                        onClick={() => onDeleteGame(game._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedGames.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Completed Games</h2>
          <div className="space-y-4">
            {completedGames.map(game => {
              const leader = getLeader(game);
              return (
                <div key={game._id} className="bg-slate-100 rounded-2xl p-6 shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">
                        {formatDate(game.updatedAt)}
                      </div>
                      <div className="font-semibold text-slate-600">
                        {game.players.map(p => p.name).join(', ')}
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        🏆 {leader.name} won with {leader.total} points
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteGame(game._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

