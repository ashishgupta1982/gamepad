import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { generateJoinCode, generateId } from '@/lib/travelBingo';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { hostUserId, hostCarName } = req.body || {};

  if (!hostUserId || typeof hostUserId !== 'string') {
    return res.status(400).json({ error: 'hostUserId required' });
  }
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
