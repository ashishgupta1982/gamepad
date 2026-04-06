import React from 'react';

export default function GameHistory({ games, onBack, onContinueGame, onDeleteGame }) {
  const activeGames = games.filter(g => g.status === 'active');
  const completedGames = games.filter(g => g.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
      >
        ← Back
      </button>

      <div className="bg-white rounded-3xl p-5 shadow-xl border border-purple-100">
        <h2 className="text-2xl font-bold text-center mb-5 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Game History
        </h2>

        {games.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-500">No games yet. Start a quiz to see your history!</p>
          </div>
        ) : (
          <>
            {/* Active games */}
            {activeGames.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-green-600 uppercase tracking-wide mb-3">
                  In Progress ({activeGames.length})
                </h3>
                <div className="space-y-2">
                  {activeGames.map(game => (
                    <GameCard
                      key={game._id}
                      game={game}
                      onContinue={() => onContinueGame(game)}
                      onDelete={() => onDeleteGame(game._id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed games */}
            {completedGames.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">
                  Completed ({completedGames.length})
                </h3>
                <div className="space-y-2">
                  {completedGames.map(game => (
                    <GameCard
                      key={game._id}
                      game={game}
                      onDelete={() => onDeleteGame(game._id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GameCard({ game, onContinue, onDelete }) {
  const config = game.quizConfig || {};
  const playerNames = game.players?.map(p => p.name).join(', ') || 'Unknown';
  const date = new Date(game.createdAt).toLocaleDateString();
  const categories = config.categories?.join(', ') || 'General';

  // Find winner
  const sorted = [...(game.players || [])].sort((a, b) => {
    const aScore = (a.scores || []).reduce((s, v) => s + v, 0);
    const bScore = (b.scores || []).reduce((s, v) => s + v, 0);
    return bScore - aScore;
  });
  const winner = sorted[0];
  const winnerScore = winner ? (winner.scores || []).reduce((s, v) => s + v, 0) : 0;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-700 text-sm truncate">{playerNames}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
            game.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-200 text-slate-500'
          }`}>
            {game.status === 'active' ? 'In Progress' : 'Complete'}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          {categories} · {config.totalQuestions || '?'} questions · {date}
        </div>
        {game.status === 'completed' && winner && (
          <div className="text-xs text-purple-600 font-medium mt-0.5">
            Winner: {winner.name} ({winnerScore} pts)
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onContinue && game.status === 'active' && (
          <button
            onClick={onContinue}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold
                       hover:bg-purple-200 transition-colors"
          >
            Continue
          </button>
        )}
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
