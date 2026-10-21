import { checkRate, getClientIP } from '@/utils/rateLimiter';
import { addPlayer } from '@/lib/quiz/machine';
import { change, newToken, project } from '@/lib/quiz/live';

// Join, or come back. POST { name, avatar, color } for a new player, or
// { playerId, token } to rejoin as yourself after a dropped connection.
// → { playerId, token, v, game }
const clip = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRate(getClientIP(req), 'STANDARD_API').allowed) return res.status(429).json({ error: 'Slow down a moment.' });
  const { playerId, token, name, avatar, color } = req.body || {};

  try {
    let result = null;
    const doc = await change(req.query.code, (d) => {
      // Coming back: the pass must match.
      if (playerId && token && d.tokens?.[playerId] === token && d.game.players.some((p) => p.id === playerId)) {
        result = { playerId, token };
        return null;
      }
      const n = clip(name, 20);
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
