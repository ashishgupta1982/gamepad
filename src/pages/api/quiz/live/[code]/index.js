import { change, project } from '@/lib/quiz/live';

// The poll. GET ?v=<version>&player=<id> → the game as this viewer may see it,
// or { same: true } when nothing has changed since `v`. Every poll also applies
// the clock (lib/quiz/live.js#change), so the game moves on by itself even if
// the host's phone has gone quiet.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const doc = await change(req.query.code, null);
    if (!doc) return res.status(404).json({ error: 'No quiz with that code.' });
    const now = Date.now();
    if (String(doc.version) === String(req.query.v)) return res.status(200).json({ same: true, v: doc.version, now });
    const player = typeof req.query.player === 'string' ? req.query.player : null;
    return res.status(200).json({ v: doc.version, now, game: project(doc, { playerId: player }) });
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }
}
