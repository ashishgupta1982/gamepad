import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP } from '@/utils/rateLimiter';
import { normalise, mergeProgress, isLegacyProgress, familyStampCount } from '@/lib/egypt/progress';
import { getTrip } from '@/data/egypt';

// A signed-in family's Egypt Explorer progress, one Game document per trip.
// Guests never reach here: their progress lives in localStorage only, which is
// GamePad's save contract (guest = local, signed in = saved).
//
// GET ?trip=gem          -> { progress } (null if none yet)
// PUT { trip, progress } -> { ok, progress }: the saved copy, with this one merged in
//
// Several phones play on one account at once, so a save is MERGED into what is
// stored (lib/egypt/progress.js mergeProgress), never written over it, and the
// merged copy goes back so the phone also picks up everyone else's. `rev` makes
// the read-merge-write safe when two phones save in the same moment: a write
// only lands if nobody else's landed since the read, and otherwise it goes
// round again. A version 1 record is kept as `v1Backup` the first time it is
// upgraded.

const MAX_BYTES = 256 * 1024;
const TRIES = 4;

// The oldest, should two phones ever create one at the same moment, so that
// every phone reads and writes the same document.
function findTrip(userId, tripId) {
  return Game.findOne({ userId, gameType: 'egypt-explorer', 'egyptConfig.trip': tripId })
    .sort({ createdAt: 1, _id: 1 })
    .lean();
}

export default async function handler(req, res) {
  const burst = checkRate(getClientIP(req), 'STANDARD_API');
  if (!burst.allowed) return res.status(429).json({ error: 'Too many requests. Please slow down.' });

  const user = await getAuthenticatedUser(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();

  if (req.method === 'GET') {
    const trip = getTrip(String(req.query.trip || ''));
    if (!trip) return res.status(400).json({ error: 'Unknown trip.' });
    const game = await findTrip(user.id, trip.id);
    return res.status(200).json({ progress: normalise(game?.egyptConfig?.progress) });
  }

  if (req.method === 'PUT') {
    const { trip: tripId, progress } = req.body || {};
    const trip = getTrip(tripId);
    if (!trip) return res.status(400).json({ error: 'Unknown trip.' });
    // normalise also takes a version 1 copy, from a phone still on the old page.
    const incoming = normalise(progress);
    if (!incoming || incoming.trip !== trip.id) return res.status(400).json({ error: 'That is not Egypt Explorer progress.' });

    for (let attempt = 0; attempt < TRIES; attempt++) {
      const game = await findTrip(user.id, trip.id);
      const stored = game?.egyptConfig?.progress;
      // The stored copy first: an answer already saved stands.
      const merged = mergeProgress(stored, incoming);
      if (JSON.stringify(merged).length > MAX_BYTES) return res.status(413).json({ error: 'Progress too large.' });

      // players[] is what the launcher's "pick up where you left off" strip shows.
      const players = merged.players.length ? merged.players.map((p) => ({ name: p.name.slice(0, 24) })) : [{ name: 'Explorer' }];
      const status = familyStampCount(merged, trip) >= trip.stops.length ? 'completed' : 'active';

      if (!game) {
        await Game.create({
          userId: user.id,
          gameType: 'egypt-explorer',
          players,
          egyptConfig: { trip: trip.id, progress: merged, rev: 1 },
          status,
        });
        return res.status(200).json({ ok: true, progress: merged });
      }

      const rev = game.egyptConfig?.rev || 0;
      const set = {
        players,
        'egyptConfig.progress': merged,
        'egyptConfig.rev': rev + 1,
        status,
        updatedAt: new Date(),
      };
      if (isLegacyProgress(stored) && !game.egyptConfig?.v1Backup) set['egyptConfig.v1Backup'] = stored;

      const result = await Game.updateOne(
        { _id: game._id, 'egyptConfig.rev': rev || { $in: [null, 0] } },
        { $set: set },
      );
      if (result.matchedCount) return res.status(200).json({ ok: true, progress: merged });
      // Another phone saved in between: read theirs and merge again.
    }
    return res.status(409).json({ error: 'Busy. Trying again shortly.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
