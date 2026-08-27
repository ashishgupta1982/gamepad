import React from 'react';
import useQuizRoom from '@/hooks/useQuizRoom';

export default function PlayerLobby({ roomCode, playerId, onGameStart }) {
  const { roomState, connected, error } = useQuizRoom(roomCode);

  // Watch for game start
  React.useEffect(() => {
    if (roomState?.status === 'question' && roomState.currentQuestion) {
      onGameStart(roomState, roomState.players);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.status]);

  const players = roomState?.players || [];

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="bg-card rounded-3xl p-6 shadow-xl border border-brand/30">
        <div className="text-4xl mb-4">🎮</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">You&apos;re In!</h2>
        <p className="text-muted-foreground text-sm mb-6">Waiting for the host to start the game...</p>

        {/* Connection status */}
        <div className="flex items-center justify-center gap-2 text-sm mb-6">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
          <span className="text-muted-foreground">{connected ? 'Connected' : 'Reconnecting...'}</span>
        </div>

        {error && (
          <div className="text-destructive text-sm mb-4">{error}</div>
        )}

        {/* Players in room */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Players in Room ({players.length})
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {players.map((player, idx) => {
              const isMe = player.id === playerId;
              return (
                <div
                  key={player.id || idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm
                    ${isMe ? 'bg-brand/10 ring-2 ring-brand' : 'bg-muted'}`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: player.avatarColor || '#6c5ce7', color: 'white' }}
                  >
                    {player.avatar || player.name?.[0]}
                  </div>
                  <span className="font-semibold text-foreground">
                    {player.name}{isMe ? ' (you)' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Waiting animation */}
        <div className="flex justify-center gap-1 py-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-brand"
              style={{
                animation: 'bounce-dot 1.4s infinite',
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
