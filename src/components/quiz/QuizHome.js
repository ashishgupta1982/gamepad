import React from 'react';

export default function QuizHome({
  games,
  onNewGame,
  onContinueGame,
  onDeleteGame,
  onJoinGame,
  onViewLeaderboard,
  onViewHistory
}) {
  const activeGames = games.filter(g => g.status === 'active');

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-deep mb-2">
          Quiz Time!
        </h1>
        <p className="text-muted-foreground">Test your knowledge. Challenge your friends.</p>
      </div>

      {/* Main actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={onNewGame}
          className="col-span-2 py-5 bg-gradient-to-r from-brand to-brand-deep text-white font-bold
                     text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <span className="block text-3xl mb-1">🎮</span>
          New Game
        </button>

        <button
          onClick={onJoinGame}
          className="py-4 bg-card text-foreground font-bold text-base rounded-2xl shadow-md
                     border-2 border-game-quiz/30 hover:border-game-quiz transition-all active:scale-[0.98]"
        >
          <span className="block text-2xl mb-1">🔗</span>
          Join Game
        </button>

        <button
          onClick={onViewLeaderboard}
          className="py-4 bg-card text-foreground font-bold text-base rounded-2xl shadow-md
                     border-2 border-warning/30 hover:border-warning transition-all active:scale-[0.98]"
        >
          <span className="block text-2xl mb-1">🏆</span>
          Leaderboard
        </button>
      </div>

      {/* Active games */}
      {activeGames.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-md border border-success/30 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-success uppercase tracking-wide">
              Games In Progress
            </h3>
          </div>
          <div className="space-y-2">
            {activeGames.slice(0, 3).map(game => {
              const config = game.quizConfig || {};
              const playerNames = game.players?.map(p => p.name).join(', ') || 'Unknown';
              const progress = config.currentQuestionIndex || 0;
              const total = config.totalQuestions || config.questions?.length || '?';

              return (
                <div key={game._id} className="flex items-center gap-3 p-2.5 bg-success/10 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{playerNames}</div>
                    <div className="text-xs text-muted-foreground">
                      Q{progress + 1}/{total} · {config.categories?.join(', ')}
                    </div>
                  </div>
                  <button
                    onClick={() => onContinueGame(game)}
                    className="px-3 py-1.5 bg-success text-white rounded-lg text-xs font-bold
                               hover:bg-success transition-colors shrink-0"
                  >
                    Continue
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History link */}
      {games.length > 0 && (
        <button
          onClick={onViewHistory}
          className="w-full py-3 text-brand font-semibold text-sm hover:bg-brand/10 rounded-xl transition-all"
        >
          View Game History ({games.length} games)
        </button>
      )}
    </div>
  );
}
