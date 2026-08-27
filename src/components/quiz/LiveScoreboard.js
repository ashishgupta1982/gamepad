import React, { useState, useEffect } from 'react';

export default function LiveScoreboard({ players, questionIndex, totalQuestions, compact = false }) {
  const [animatedScores, setAnimatedScores] = useState({});

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  useEffect(() => {
    const targets = {};
    sortedPlayers.forEach(p => { targets[p.id || p.name] = p.score || 0; });

    const startScores = { ...animatedScores };
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = {};
      Object.keys(targets).forEach(key => {
        const start = startScores[key] || 0;
        current[key] = Math.round(start + (targets[key] - start) * eased);
      });
      setAnimatedScores(current);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1">
        {sortedPlayers.map((player, idx) => (
          <div
            key={player.id || player.name}
            className="flex items-center gap-2 bg-card rounded-full px-3 py-1.5 shadow-sm whitespace-nowrap text-sm"
          >
            <span className="font-bold text-xs text-muted-foreground">#{idx + 1}</span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ backgroundColor: player.avatarColor || '#6c5ce7' }}
            >
              {player.avatar || player.name?.[0]?.toUpperCase()}
            </div>
            <span className="font-semibold text-foreground">{player.name}</span>
            <span className="font-bold text-brand">
              {animatedScores[player.id || player.name] ?? player.score ?? 0}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Scoreboard</h2>
        <p className="text-muted-foreground text-sm">
          {questionIndex + 1} of {totalQuestions} questions
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {sortedPlayers.map((player, idx) => {
          const maxScore = sortedPlayers[0]?.score || 1;
          const barWidth = Math.max(((player.score || 0) / maxScore) * 100, 8);
          const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

          return (
            <div key={player.id || player.name} className="flex items-center gap-3">
              <span className="text-lg w-8 text-center">{medal}</span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: player.avatarColor || '#6c5ce7', color: 'white' }}
              >
                {player.avatar || player.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-foreground">{player.name}</span>
                  <span className="font-bold text-lg text-brand">
                    {animatedScores[player.id || player.name] ?? player.score ?? 0}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${player.avatarColor || '#6c5ce7'}, ${player.avatarColor || '#6c5ce7'}cc)`
                    }}
                  />
                </div>
              </div>
              {player.streak >= 2 && (
                <span className="text-sm">🔥{player.streak}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
