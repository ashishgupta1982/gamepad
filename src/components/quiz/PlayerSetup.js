import React from 'react';
import { AVATAR_EMOJIS, AVATAR_COLORS } from '@/data/quizConstants';

export default function PlayerSetup({ players, onPlayersChange, maxPlayers = 6 }) {
  const addPlayer = () => {
    if (players.length >= maxPlayers) return;
    const idx = players.length;
    onPlayersChange([
      ...players,
      {
        name: `Player ${idx + 1}`,
        avatar: AVATAR_EMOJIS[idx % AVATAR_EMOJIS.length],
        avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length]
      }
    ]);
  };

  const removePlayer = (index) => {
    if (players.length <= 1) return;
    onPlayersChange(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    onPlayersChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Players ({players.length})
        </label>
        {players.length < maxPlayers && (
          <button
            onClick={addPlayer}
            className="text-sm font-semibold text-brand hover:text-brand transition-colors"
          >
            + Add Player
          </button>
        )}
      </div>

      <div className="space-y-2">
        {players.map((player, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-card rounded-xl p-2.5 border border-border">
            {/* Avatar color cycle button */}
            <button
              onClick={() => {
                const currentColorIdx = AVATAR_COLORS.indexOf(player.avatarColor);
                const nextColor = AVATAR_COLORS[(currentColorIdx + 1) % AVATAR_COLORS.length];
                updatePlayer(idx, 'avatarColor', nextColor);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0
                         transition-transform active:scale-90"
              style={{ backgroundColor: player.avatarColor || AVATAR_COLORS[idx] }}
            >
              {player.avatar || AVATAR_EMOJIS[idx]}
            </button>

            {/* Emoji cycle button */}
            <button
              onClick={() => {
                const currentIdx = AVATAR_EMOJIS.indexOf(player.avatar);
                const nextEmoji = AVATAR_EMOJIS[(currentIdx + 1) % AVATAR_EMOJIS.length];
                updatePlayer(idx, 'avatar', nextEmoji);
              }}
              className="text-xs text-muted-foreground hover:text-brand transition-colors shrink-0"
              title="Change avatar"
            >
              🔄
            </button>

            {/* Name input */}
            <input
              type="text"
              value={player.name}
              onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
              className="flex-1 bg-transparent font-semibold text-foreground outline-none text-sm
                         placeholder-border min-w-0"
              placeholder={`Player ${idx + 1}`}
              maxLength={20}
            />

            {/* Remove */}
            {players.length > 1 && (
              <button
                onClick={() => removePlayer(idx)}
                className="text-border hover:text-destructive transition-colors text-lg shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2 mt-3">
        {[2, 3, 4].map(count => (
          <button
            key={count}
            onClick={() => {
              const newPlayers = Array.from({ length: count }, (_, i) => ({
                name: players[i]?.name || `Player ${i + 1}`,
                avatar: players[i]?.avatar || AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
                avatarColor: players[i]?.avatarColor || AVATAR_COLORS[i % AVATAR_COLORS.length]
              }));
              onPlayersChange(newPlayers);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              players.length === count
                ? 'bg-brand/10 text-brand ring-1 ring-brand'
                : 'bg-muted text-muted-foreground hover:bg-border'
            }`}
          >
            {count} players
          </button>
        ))}
      </div>
    </div>
  );
}
