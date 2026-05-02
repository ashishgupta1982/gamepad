import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  await dbConnect();

  let game;
  try {
    game = await Game.findById(id);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid game id' });
  }

  if (!game || game.gameType !== 'travel-bingo') {
    return res.status(404).json({ error: 'Game not found' });
  }

  return res.status(200).json({ game: serializeGame(game) });
}

export function serializeGame(game) {
  return {
    _id: game._id.toString(),
    gameType: game.gameType,
    status: game.status,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    travelBingoConfig: game.travelBingoConfig,
  };
}
