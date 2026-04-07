import React, { useState, useEffect } from 'react';
import useQuizRoom from '@/hooks/useQuizRoom';

export default function HostLobby({ roomCode, players, hostPlayerId, onStart, onUpdatePlayers, onBack }) {
  const { roomState, connected } = useQuizRoom(roomCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (roomState?.players) {
      onUpdatePlayers(roomState.players);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.players?.length]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = roomCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPlayers = roomState?.players || players || [];

  return (
    <div className="max-w-lg mx-auto text-center">
      <button
        onClick={onBack}
        className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm self-start block"
      >
        ← Back
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Game Room</h2>
        <p className="text-slate-500 text-sm mb-6">Share this code with players to join</p>

        {/* Room code display */}
        <button
          onClick={copyCode}
          className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white
                     px-8 py-4 rounded-2xl mb-4 transition-transform active:scale-95"
        >
          <div className="text-4xl font-mono font-bold tracking-[0.3em]">{roomCode}</div>
          <div className="text-xs opacity-80 mt-1">
            {copied ? 'Copied!' : 'Tap to copy'}
          </div>
        </button>

        {/* Join URL */}
        <div className="text-xs text-slate-400 mb-6">
          or visit: <span className="font-mono">/games/quiz/join?code={roomCode}</span>
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-center gap-2 text-sm mb-4">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-slate-500">{connected ? 'Connected' : 'Connecting...'}</span>
        </div>

        {/* Players list */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
            Players ({currentPlayers.length})
          </h3>

          {currentPlayers.length === 0 ? (
            <div className="py-8 text-slate-400 text-sm">
              Waiting for players to join...
            </div>
          ) : (
            <div className="space-y-2">
              {currentPlayers.map((player, idx) => (
                <div
                  key={player.id || idx}
                  className="flex items-center gap-3 bg-purple-50 rounded-xl p-3"
                  style={{
                    animation: 'slide-up 0.3s ease-out',
                    animationDelay: `${idx * 0.1}s`
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: player.avatarColor || '#6c5ce7', color: 'white' }}
                  >
                    {player.avatar || player.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-700">{player.name}</span>
                  {player.id === hostPlayerId && (
                    <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
                      HOST
                    </span>
                  )}
                  <div className={`ml-auto w-2 h-2 rounded-full ${player.connected ? 'bg-green-500' : 'bg-slate-300'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          disabled={currentPlayers.length < 1}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold
                     text-lg rounded-xl shadow-lg hover:shadow-xl transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Game ({currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''})
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
