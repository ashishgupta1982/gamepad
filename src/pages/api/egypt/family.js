import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import EgyptFamily from '@/models/EgyptFamily';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP } from '@/utils/rateLimiter';
import { isFamily, newFamily, newerFamily, upgrade, EPOCH } from '@/lib/egypt/progress';

// A signed-in family's Egypt Explorer explorers: one list for every trip and
// every phone on the account. Guests keep theirs on the phone.
//
// GET              -> { family, derived } (derived: worked out from a saved trip,
//                     for an account that played before the list existed)
// PUT { family }   -> { family }, whichever of the two is newer

export default async function handler(req, res) {
  const burst = checkRate(getClientIP(req), 'STANDARD_API');
  if (!burst.allowed) return res.status(429).json({ error: 'Too many requests. Please slow down.' });

  const user = await getAuthenticatedUser(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();
  const stored = await EgyptFamily.findOne({ userId: user.id }).lean();
  const current = stored ? { players: stored.players.map(({ id, name }) => ({ id, name })), updatedAt: stored.updatedAt } : null;

  if (req.method === 'GET') {
    if (current) return res.status(200).json({ family: current, derived: false });
    // Played before the family list: take the names from the latest trip.
    const game = await Game.findOne({ userId: user.id, gameType: 'egypt-explorer' }).sort({ updatedAt: -1 }).lean();
    const progress = upgrade(game?.egyptConfig?.progress);
    const family = progress?.players.length ? newFamily(progress.players.map((p) => p.name), EPOCH) : null;
    return res.status(200).json({ family, derived: !!family });
  }

  if (req.method === 'PUT') {
    const incoming = req.body?.family;
    if (!isFamily(incoming) || !incoming.players.length) return res.status(400).json({ error: 'That is not a family list.' });
    // Rebuilt from the names, so every id is the one playerId would make.
    const family = newFamily(incoming.players.map((p) => p.name), incoming.updatedAt);
    const winner = newerFamily(current, family);
    if (winner === family) {
      try {
        await EgyptFamily.updateOne(
          { userId: user.id },
          { $set: { players: family.players, updatedAt: family.updatedAt } },
          { upsert: true },
        );
      } catch (err) {
        // Two phones creating the list at the same moment: one of them won.
        if (err?.code !== 11000) throw err;
      }
    }
    return res.status(200).json({ family: winner });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
