import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP } from '@/utils/rateLimiter';
import { claimHandle, handleOf, takenNames } from '@/lib/quiz/seenStore';

// A signed-in player's quiz name, unique across GamePad (lib/quiz/memory.js).
//
// GET              → { handle }, giving the account one first if it has none
// PUT { name }     → { handle }; 409 if someone else has it
// POST { names }   → { taken }: the names that are someone else's handle, so a
//                  game cannot be set up under them (Ash, 2026-10-23). Open to
//                  guests, who cannot take a handle either.
export default async function handler(req, res) {
  const user = await getAuthenticatedUser(req, res).catch(() => null);
  if (req.method === 'POST') {
    if (!checkRate(getClientIP(req), 'STANDARD_API').allowed) return res.status(429).json({ error: 'Slow down a moment.' });
    const names = Array.isArray(req.body?.names) ? req.body.names.slice(0, 12) : [];
    return res.status(200).json({ taken: await takenNames(names, user?.email).catch(() => []) });
  }
  if (!user?.email) return res.status(401).json({ error: 'Sign in to have a quiz name.' });
  try {
    if (req.method === 'GET') return res.status(200).json({ handle: await handleOf(user.email) });
    if (req.method === 'PUT') {
      const { handle } = await claimHandle(user.email, req.body?.name);
      return res.status(200).json({ handle });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('[quiz-handle] failed:', err.message);
    return res.status(500).json({ error: 'Could not do that just now. Try again?' });
  }
}
