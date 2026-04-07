import React from 'react';
import { GAME_MODES } from '@/data/dartsConstants';

export default function DartsHome({ games, onNewGame, onContinueGame, onDeleteGame }) {
  const activeGames = games.filter(g => g.status === 'active');
  const completedGames = games.filter(g => g.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-2">
          Darts
        </h1>
        <p className="text-slate-500">Choose a game mode and start throwing!</p>
      </div>

      <button
        onClick={onNewGame}
        className="w-full py-5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold
                   text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] mb-6"
      >
        <span className="block text-3xl mb-1">🎯</span>
        New Game
      </button>

      {activeGames.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-md border border-green-100 mb-4">
          <h3 className="text-sm font-bold text-green-600 uppercase tracking-wide mb-3">
            Games In Progress
          </h3>
          <div className="space-y-2">
            {activeGames.map(game => {
              const config = game.dartsConfig || {};
              const mode = GAME_MODES.find(m => m.id === config.gameMode);
              const playerNames = game.players?.map(p => p.name).join(', ') || 'Unknown';

              return (
                <div key={game._id} className="flex items-center gap-3 p-2.5 bg-green-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{playerNames}</div>
                    <div className="text-xs text-slate-400">
                      {mode?.name || config.gameMode} {config.startingScore ? `(${config.startingScore})` : ''}
                      {config.legs > 1 ? ` · Best of ${config.legs}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => onContinueGame(game)}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold
                               hover:bg-green-600 transition-colors shrink-0"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => onDeleteGame(game._id)}
                    className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedGames.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">
            Completed ({completedGames.length})
          </h3>
          <div className="space-y-2">
            {completedGames.slice(0, 5).map(game => {
              const config = game.dartsConfig || {};
              const mode = GAME_MODES.find(m => m.id === config.gameMode);
              const playerNames = game.players?.map(p => p.name).join(', ') || 'Unknown';
              const date = new Date(game.createdAt).toLocaleDateString();

              return (
                <div key={game._id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-600 truncate">{playerNames}</div>
                    <div className="text-xs text-slate-400">{mode?.name} · {date}</div>
                  </div>
                  <button
                    onClick={() => onDeleteGame(game._id)}
                    className="p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
