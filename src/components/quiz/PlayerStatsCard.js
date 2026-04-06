import React from 'react';

export default function PlayerStatsCard({ stats }) {
  if (!stats) return null;

  const accuracy = stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : 0;

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100">
      <h3 className="font-bold text-slate-700 mb-3">{stats.playerName}</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBox label="Total Score" value={stats.totalScore?.toLocaleString()} />
        <StatBox label="Games Played" value={stats.gamesPlayed} />
        <StatBox label="Accuracy" value={`${accuracy}%`} />
        <StatBox label="Win Rate" value={`${winRate}%`} />
        <StatBox label="Best Streak" value={`🔥 ${stats.bestStreak}`} />
        <StatBox label="Avg Response" value={`${(stats.avgResponseTime / 1000).toFixed(1)}s`} />
      </div>

      {/* Category breakdown */}
      {stats.categoryStats?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Categories</h4>
          <div className="space-y-1.5">
            {stats.categoryStats.map(cat => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{cat.correct}/{cat.played}</span>
                  <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${cat.avgScore || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-purple-600 w-8 text-right">{cat.avgScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent games */}
      {stats.recentGames?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Recent Games</h4>
          <div className="space-y-1">
            {stats.recentGames.slice(0, 5).map((game, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${game.rank === 1 ? 'text-yellow-600' : 'text-slate-600'}`}>
                    #{game.rank}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {new Date(game.date).toLocaleDateString()}
                  </span>
                </div>
                <span className="font-bold text-purple-600">{game.score?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
      <div className="text-lg font-bold text-slate-700">{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}
