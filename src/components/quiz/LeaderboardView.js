import React, { useState, useEffect } from 'react';

export default function LeaderboardView({ onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quiz/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data.leaderboard || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const medals = ['👑', '🥈', '🥉'];

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-brand hover:text-brand font-semibold text-sm"
      >
        ← Back
      </button>

      <div className="bg-card rounded-3xl p-5 shadow-xl border border-brand/30">
        <h2 className="text-2xl font-bold text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-brand to-brand-deep">
          All-Time Leaderboard
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-6">Top quiz players</p>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-muted-foreground">No stats yet. Play a quiz to get on the board!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((player, idx) => (
              <div
                key={player._id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all
                  ${idx === 0 ? 'bg-warning/10 border border-warning/30' :
                    idx === 1 ? 'bg-muted border border-border' :
                    idx === 2 ? 'bg-warning/10 border border-warning/30' :
                    'bg-card border border-border'}`}
              >
                <span className="text-lg w-8 text-center">
                  {idx < 3 ? medals[idx] : `#${idx + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-foreground truncate">{player.playerName}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{player.gamesPlayed} games</span>
                    <span>{player.accuracy}% accuracy</span>
                    <span>{player.winRate}% win rate</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-brand">{player.totalScore?.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
