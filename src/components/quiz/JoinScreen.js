import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AVATAR_EMOJIS, AVATAR_COLORS } from '@/data/quizConstants';

export default function JoinScreen({ onJoin, onBack }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_EMOJIS[0]);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  // Pick random avatar on mount
  useEffect(() => {
    setAvatar(AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]);
    setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);

    // Check for code in URL
    if (router.query.code) {
      setCode(router.query.code.toUpperCase());
    }
  }, [router.query.code]);

  const handleJoin = async () => {
    if (!code.trim() || !name.trim()) return;
    setJoining(true);
    setError(null);
    try {
      await onJoin(code.toUpperCase(), name.trim(), avatar, avatarColor);
    } catch (e) {
      setError('Failed to join. Check the code and try again.');
      setJoining(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
      >
        ← Back
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-xl border border-purple-100 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Join a Game</h2>
        <p className="text-slate-500 text-sm mb-6">Enter the room code shown on the host&apos;s screen</p>

        {/* Room code input */}
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="ROOM CODE"
          className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] py-4 px-4
                     border-2 border-purple-200 rounded-xl outline-none focus:border-purple-500
                     text-slate-800 placeholder-slate-300 mb-4"
          maxLength={6}
          autoFocus
        />

        {/* Player name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full text-center text-lg py-3 px-4 border border-slate-200 rounded-xl
                     outline-none focus:border-purple-400 text-slate-700 mb-4"
          maxLength={20}
        />

        {/* Avatar preview */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => {
              const idx = AVATAR_EMOJIS.indexOf(avatar);
              setAvatar(AVATAR_EMOJIS[(idx + 1) % AVATAR_EMOJIS.length]);
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl
                       transition-transform active:scale-90 shadow-md"
            style={{ backgroundColor: avatarColor }}
          >
            {avatar}
          </button>
          <button
            onClick={() => {
              const idx = AVATAR_COLORS.indexOf(avatarColor);
              setAvatarColor(AVATAR_COLORS[(idx + 1) % AVATAR_COLORS.length]);
            }}
            className="text-xs text-slate-400 hover:text-purple-500"
          >
            Change color
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        <button
          onClick={handleJoin}
          disabled={code.length < 6 || !name.trim() || joining}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold
                     text-lg rounded-xl shadow-lg hover:shadow-xl transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {joining ? 'Joining...' : 'Join Game'}
        </button>
      </div>
    </div>
  );
}
