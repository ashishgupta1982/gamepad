import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP } from '@/utils/rateLimiter';
import { isProgress } from '@/lib/egypt/progress';
import { getTrip } from '@/data/egypt';

// A signed-in family's Egypt Explorer progress, one Game document per trip.
// Guests never reach here: their progress lives in localStorage only, which is
// GamePad's save contract (guest = local, signed in = saved).
//
// GET ?trip=gem        -> { progress } (null if none yet)
// PUT { trip, progress } -> { ok, updatedAt }

const MAX_BYTES = 64 * 1024;

export default async function handler(req, res) {
  const burst = checkRate(getClientIP(req), 'STANDARD_API');
  if (!burst.allowed) return res.status(429).json({ error: 'Too many requests. Please slow down.' });

  const user = await getAuthenticatedUser(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  await dbConnect();

  if (req.method === 'GET') {
    const trip = getTrip(String(req.query.trip || ''));
    if (!trip) return res.status(400).json({ error: 'Unknown trip.' });
    const game = await Game.findOne({ userId: user.id, gameType: 'egypt-explorer', 'egyptConfig.trip': trip.id }).lean();
    return res.status(200).json({ progress: game?.egyptConfig?.progress || null });
  }

  if (req.method === 'PUT') {
    const { trip: tripId, progress } = req.body || {};
    const trip = getTrip(tripId);
    if (!trip) return res.status(400).json({ error: 'Unknown trip.' });
    if (!isProgress(progress) || progress.trip !== trip.id) return res.status(400).json({ error: 'That is not Egypt Explorer progress.' });
    if (JSON.stringify(progress).length > MAX_BYTES) return res.status(413).json({ error: 'Progress too large.' });

    // players[] is what the launcher's "pick up where you left off" strip shows.
    const players = progress.players.length
      ? progress.players.map((p) => ({ name: p.name.slice(0, 24) }))
      : [{ name: 'Explorer' }];
    const done = trip.stops.every((s) => Object.keys(progress.stops?.[s.id]?.answers || {}).length >= s.quiz.length);

    await Game.findOneAndUpdate(
      { userId: user.id, gameType: 'egypt-explorer', 'egyptConfig.trip': trip.id },
      {
        $set: {
          players,
          'egyptConfig.trip': trip.id,
          'egyptConfig.progress': progress,
          status: done ? 'completed' : 'active',
          updatedAt: new Date(),
        },
        // userId and gameType come from the filter on insert.
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return res.status(200).json({ ok: true, updatedAt: progress.updatedAt });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
