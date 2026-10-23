import { checkRate, getClientIP } from '@/utils/rateLimiter';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { handleOf, handleOwner } from '@/lib/quiz/seenStore';
import { addPlayer } from '@/lib/quiz/machine';
import { change, newToken, project } from '@/lib/quiz/live';

// Join, or come back. POST { name, avatar, color, asGuest } for a new player,
// or { playerId, token } to rejoin as yourself after a dropped connection.
// A signed-in phone joins under its handle, unless it asks to be a guest; a
// guest cannot take anyone's handle (Ash, 2026-10-23: a handle is that player).
// → { playerId, token, v, game }
const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRate(getClientIP(req), 'STANDARD_API').allowed) return res.status(429).json({ error: 'Slow down a moment.' });
  const { playerId, token, name, avatar, color, asGuest } = req.body || {};

  try {
    const rejoining = !!(playerId && token);
    let wanted = name;
    if (!rejoining) {
      const user = await getAuthenticatedUser(req, res).catch(() => null);
      const mine = user?.email && !asGuest ? await handleOf(user.email) : null;
      if (mine) wanted = mine;
      else {
        const owner = await handleOwner(clip(name, 20));
        if (owner && owner !== user?.email) {
          return res.status(409).json({ error: `${clip(name, 20)} is a signed-in player's name. Pick another, or sign in as them.` });
        }
      }
    }
    let result = null;
    const doc = await change(req.query.code, (d) => {
      // Coming back: the pass must match.
      if (playerId && token && d.tokens?.[playerId] === token && d.game.players.some((p) => p.id === playerId)) {
        result = { playerId, token };
        return null;
      }
      const n = clip(wanted, 20);
      if (!n) {
        result = { error: 'Give yourself a name.' };
        return null;
      }
      if (d.game.phase !== 'ready') {
        result = { error: 'This quiz has already started.' };
        return null;
      }
      if (d.game.players.length >= 30) {
        result = { error: 'This quiz is full.' };
        return null;
      }
      if (d.game.players.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
        result = { error: `Someone is already called ${n}. Try another name.` };
        return null;
      }
      const id = `p_${newToken().slice(0, 10)}`;
      const pass = newToken();
      result = { playerId: id, token: pass };
      return {
        game: addPlayer(d.game, { id, name: n, avatar: clip(avatar, 8) || '🙂', color: /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#6366f1' }),
        tokens: { ...(d.tokens || {}), [id]: pass },
      };
    });
    if (!doc) return res.status(404).json({ error: 'No quiz with that code. Check it with the host?' });
    if (result?.error) return res.status(409).json({ error: result.error });
    if (!result) return res.status(401).json({ error: 'Join again with your name.' });
    return res.status(200).json({ ...result, v: doc.version, now: Date.now(), game: project(doc, { playerId: result.playerId }) });
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }
}
