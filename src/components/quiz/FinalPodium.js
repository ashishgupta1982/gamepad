import React, { useState, useEffect } from 'react';

function ConfettiPiece({ delay }) {
  const colors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#9b59b6', '#e84393'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const left = Math.random() * 100;
  const duration = 2 + Math.random() * 2;
  const size = 6 + Math.random() * 8;

  return (
    <div
      className="absolute top-0 opacity-0"
      style={{
        left: `${left}%`,
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        borderRadius: '2px',
        animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
        transform: `rotate(${Math.random() * 360}deg)`
      }}
    />
  );
}

export default function FinalPodium({ players, onPlayAgain, onNewRound, onEndGame, onViewLeaderboard }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [revealed, setRevealed] = useState(0);

  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  useEffect(() => {
    const timers = [
      setTimeout(() => setRevealed(1), 300),
      setTimeout(() => setRevealed(2), 800),
      setTimeout(() => setRevealed(3), 1300),
      setTimeout(() => setShowConfetti(true), 1500)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const podiumHeight = { 0: 'h-32', 1: 'h-24', 2: 'h-20' };
  const podiumColors = { 0: 'from-yellow-400 to-yellow-500', 1: 'from-slate-300 to-slate-400', 2: 'from-amber-600 to-amber-700' };
  const medals = { 0: '👑', 1: '🥈', 2: '🥉' };

  return (
    <div className="w-full max-w-2xl mx-auto text-center relative overflow-hidden">
      <style>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(-10px) rotate(0deg); }
          100% { opacity: 0; transform: translateY(600px) rotate(720deg); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiPiece key={i} delay={i * 0.05} />
          ))}
        </div>
      )}

      <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 mt-4">
        Game Over!
      </h1>
      {winner && (
        <p className="text-lg text-purple-600 font-semibold mb-8">
          {winner.name} wins with {winner.score?.toLocaleString()} points!
        </p>
      )}

      {/* Podium */}
      <div className="flex items-end justify-center gap-3 mb-8 h-64">
        {/* 2nd place */}
        {second && (
          <div
            className="flex-1 max-w-[140px] flex flex-col items-center"
            style={{
              animation: revealed >= 1 ? 'slide-up 0.5s ease-out forwards' : 'none',
              opacity: revealed >= 1 ? 1 : 0
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-2 shadow-lg"
              style={{ backgroundColor: second.avatarColor || '#6c5ce7', color: 'white' }}
            >
              {second.avatar || second.name?.[0]?.toUpperCase()}
            </div>
            <div className="text-sm font-bold text-slate-700 mb-1 truncate w-full">{second.name}</div>
            <div className="text-xs text-slate-500 mb-2">{second.score?.toLocaleString()} pts</div>
            <div className={`w-full ${podiumHeight[1]} bg-gradient-to-b ${podiumColors[1]} rounded-t-xl flex items-start justify-center pt-3`}>
              <span className="text-2xl">{medals[1]}</span>
            </div>
          </div>
        )}

        {/* 1st place */}
        {winner && (
          <div
            className="flex-1 max-w-[160px] flex flex-col items-center"
            style={{
              animation: revealed >= 3 ? 'slide-up 0.5s ease-out forwards' : 'none',
              opacity: revealed >= 3 ? 1 : 0
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2 shadow-lg ring-4 ring-yellow-400"
              style={{ backgroundColor: winner.avatarColor || '#6c5ce7', color: 'white' }}
            >
              {winner.avatar || winner.name?.[0]?.toUpperCase()}
            </div>
            <div className="text-base font-bold text-slate-800 mb-1 truncate w-full">{winner.name}</div>
            <div className="text-sm text-purple-600 font-semibold mb-2">{winner.score?.toLocaleString()} pts</div>
            <div className={`w-full ${podiumHeight[0]} bg-gradient-to-b ${podiumColors[0]} rounded-t-xl flex items-start justify-center pt-3`}>
              <span className="text-3xl">{medals[0]}</span>
            </div>
          </div>
        )}

        {/* 3rd place */}
        {third && (
          <div
            className="flex-1 max-w-[140px] flex flex-col items-center"
            style={{
              animation: revealed >= 2 ? 'slide-up 0.5s ease-out forwards' : 'none',
              opacity: revealed >= 2 ? 1 : 0
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 shadow-lg"
              style={{ backgroundColor: third.avatarColor || '#6c5ce7', color: 'white' }}
            >
              {third.avatar || third.name?.[0]?.toUpperCase()}
            </div>
            <div className="text-sm font-bold text-slate-700 mb-1 truncate w-full">{third.name}</div>
            <div className="text-xs text-slate-500 mb-2">{third.score?.toLocaleString()} pts</div>
            <div className={`w-full ${podiumHeight[2]} bg-gradient-to-b ${podiumColors[2]} rounded-t-xl flex items-start justify-center pt-3`}>
              <span className="text-2xl">{medals[2]}</span>
            </div>
          </div>
        )}
      </div>

      {/* Remaining players */}
      {sorted.length > 3 && (
        <div className="space-y-2 mb-6">
          {sorted.slice(3).map((player, idx) => (
            <div key={player.id || player.name} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 w-6">#{idx + 4}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: player.avatarColor || '#6c5ce7', color: 'white' }}
                >
                  {player.avatar || player.name?.[0]?.toUpperCase()}
                </div>
                <span className="font-semibold text-slate-700">{player.name}</span>
              </div>
              <span className="font-bold text-slate-600">{player.score?.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      )}

      {/* Full results for all players */}
      <div className="bg-white rounded-2xl p-4 shadow-md mb-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Full Results</h3>
        <div className="space-y-2">
          {sorted.map((player, idx) => {
            const correct = player.answers?.filter(a => a.correct).length || 0;
            const total = player.answers?.length || 0;
            const avgTime = total > 0
              ? (player.answers.reduce((sum, a) => sum + (a.timeMs || 0), 0) / total / 1000).toFixed(1)
              : '-';

            return (
              <div key={player.id || player.name} className="flex items-center justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                <span className="text-slate-600">{player.name}</span>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>{correct}/{total} correct</span>
                  <span>avg {avgTime}s</span>
                  <span className="font-bold text-purple-600">{player.score?.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {onNewRound && (
        <button
          onClick={onNewRound}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold
                     text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98"
        >
          New Round
        </button>
      )}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl
                     hover:bg-slate-200 transition-all"
        >
          Reset Scores
        </button>
        <button
          onClick={onEndGame}
          className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl
                     hover:bg-slate-200 transition-all"
        >
          Done
        </button>
      </div>
      {onViewLeaderboard && (
        <button
          onClick={onViewLeaderboard}
          className="w-full mt-3 py-3 text-purple-600 font-semibold text-sm hover:bg-purple-50 rounded-xl transition-all"
        >
          View All-Time Leaderboard
        </button>
      )}
    </div>
  );
}
