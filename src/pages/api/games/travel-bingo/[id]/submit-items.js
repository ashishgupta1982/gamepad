import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { findCar } from '@/lib/travelBingo';
import { serializeGame } from './index';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { carId, items } = req.body || {};

  if (!carId || !Array.isArray(items)) {
    return res.status(400).json({ error: 'carId and items[] required' });
  }

  const cleaned = items
    .map(s => (typeof s === 'string' ? s.trim() : ''))
    .filter(s => s.length > 0 && s.length <= 100)
    .slice(0, 50);

  await dbConnect();

  const game = await Game.findById(id);
  if (!game || game.gameType !== 'travel-bingo') {
    return res.status(404).json({ error: 'Game not found' });
  }
  if (game.travelBingoConfig.phase !== 'submission') {
    return res.status(409).json({ error: 'Submission phase has ended' });
  }

  const car = findCar(game, carId);
  if (!car) return res.status(404).json({ error: 'Car not found' });

  car.submittedItems = cleaned;
  await game.save();

  return res.status(200).json({ game: serializeGame(game) });
}
