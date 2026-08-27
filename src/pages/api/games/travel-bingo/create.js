import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { generateJoinCode, generateId } from '@/lib/travelBingo';
import { resolvePlayer } from '@/utils/playerIdentity';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hostCarName } = req.body || {};

  // The host is whoever the SESSION says, falling back to a guest id only when
  // there is no session at all. This route used to take `hostUserId` from the
  // body and write it straight on as the game's owner, so a caller could mint
  // games owned by any account whose id they knew — without being signed in.
  const player = await resolvePlayer(req, res);
  if (!player) {
    return res.status(400).json({ error: 'Could not identify player' });
  }
  const hostUserId = player.id;

  if (!hostCarName || typeof hostCarName !== 'string' || !hostCarName.trim()) {
    return res.status(400).json({ error: 'hostCarName required' });
  }

  await dbConnect();

  // Generate a unique join code (retry on collision — extremely unlikely)
  let joinCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateJoinCode();
    const existing = await Game.findOne({
      gameType: 'travel-bingo',
      'travelBingoConfig.joinCode': candidate,
      status: 'active',
    });
    if (!existing) {
      joinCode = candidate;
      break;
    }
  }
  if (!joinCode) return res.status(500).json({ error: 'Failed to generate join code' });

  const hostCarId = generateId('car');

  const game = await Game.create({
    userId: hostUserId,
    gameType: 'travel-bingo',
    players: [],
    travelBingoConfig: {
      joinCode,
      hostUserId,
      phase: 'submission',
      cars: [{
        carId: hostCarId,
        name: hostCarName.trim(),
        userId: hostUserId,
        joinedAt: new Date(),
        submittedItems: [],
        card: [],
      }],
      categories: [],
    },
    status: 'active',
  });

  return res.status(201).json({
    gameId: game._id.toString(),
    joinCode,
    carId: hostCarId,
  });
}
