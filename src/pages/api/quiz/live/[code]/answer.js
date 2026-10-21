import { answer } from '@/lib/quiz/machine';
import { change, project } from '@/lib/quiz/live';

// An answer from a phone. POST { playerId, token, option }. The time it took
// is measured here, from when the server opened the question, not reported by
// the phone, so nobody can claim to have been quicker than they were.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { playerId, token, option } = req.body || {};
  try {
    let refused = false;
    const doc = await change(req.query.code, (d, now) => {
      if (!playerId || d.tokens?.[playerId] !== token) {
        refused = true;
        return null;
      }
      return { game: answer(d.game, playerId, Number(option), now) };
    });
    if (!doc) return res.status(404).json({ error: 'No quiz with that code.' });
    if (refused) return res.status(401).json({ error: 'Join the quiz again to answer.' });
    return res.status(200).json({ v: doc.version, now: Date.now(), game: project(doc, { playerId }) });
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }
}
