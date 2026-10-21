// A player's face across the games: an emoji in a colour. The Quiz and Darts
// both deal them out in this order, so the first player is always the fox.

export const AVATARS = ['🦊', '🐸', '🦉', '🐙', '🦁', '🐯', '🐻', '🦄', '🐲', '🐬', '🦋', '🐢', '🦈', '🐺', '🦜', '🐼'];
export const COLORS = ['#e11d48', '#2563eb', '#d97706', '#16a34a', '#9333ea', '#ea580c', '#0d9488', '#db2777', '#4f46e5', '#65a30d', '#0891b2', '#c026d3'];

export const makePlayer = (i, name) => ({
  id: `p${Date.now().toString(36)}${i}${Math.random().toString(36).slice(2, 5)}`,
  name: name || `Player ${i + 1}`,
  avatar: AVATARS[i % AVATARS.length],
  color: COLORS[i % COLORS.length],
});
