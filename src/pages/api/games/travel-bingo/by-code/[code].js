import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code required' });
  }

  await dbConnect();

  const game = await Game.findOne({
    gameType: 'travel-bingo',
    'travelBingoConfig.joinCode': code.toUpperCase(),
    status: 'active',
  });

  if (!game) return res.status(404).json({ error: 'Game not found' });

  return res.status(200).json({
    gameId: game._id.toString(),
    joinCode: game.travelBingoConfig.joinCode,
    phase: game.travelBingoConfig.phase,
    cars: game.travelBingoConfig.cars.map(c => ({ carId: c.carId, name: c.name })),
  });
}
