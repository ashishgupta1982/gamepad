import { getAuthenticatedUser } from '@/utils/authHelper';
import { forget, listSeen, remember } from '@/lib/quiz/seenStore';

// The questions each player on a signed-in account has seen (models/QuizSeen.js),
// so a game leaves out what anyone playing has had before. Guests have no
// memory: every route here needs an account.
//
// GET                    → { players: [{ name, count }] }, most recent first
// POST { names, ids }    a finished (or abandoned) game's questions, for each player
// DELETE { name }        forget one player's questions

export default async function handler(req, res) {
  const user = await getAuthenticatedUser(req, res).catch(() => null);
  if (!user?.email) return res.status(401).json({ error: 'Sign in to keep track of the questions you have seen.' });

  try {
    if (req.method === 'GET') return res.status(200).json({ players: await listSeen(user.email) });
    if (req.method === 'POST') {
      const { names, ids } = req.body || {};
      if (!Array.isArray(names) || !Array.isArray(ids)) return res.status(400).json({ error: 'names and ids must be lists' });
      await remember(user.email, names.slice(0, 12), ids.slice(0, 40));
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      const name = req.body?.name;
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Which player?' });
      await forget(user.email, name);
      return res.status(200).json({ players: await listSeen(user.email) });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[quiz-seen] failed:', err.message);
    return res.status(500).json({ error: 'Could not do that just now. Try again?' });
  }
}
