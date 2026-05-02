import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { findCar } from '@/lib/travelBingo';
import { serializeGame } from './index';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { carId, tileId, photoUrl, caption, found = true } = req.body || {};

  if (!carId || !tileId) {
    return res.status(400).json({ error: 'carId and tileId required' });
  }

  await dbConnect();

  const game = await Game.findById(id);
  if (!game || game.gameType !== 'travel-bingo') {
    return res.status(404).json({ error: 'Game not found' });
  }
  if (game.travelBingoConfig.phase !== 'playing') {
    return res.status(409).json({ error: 'Game is not in play' });
  }

  const car = findCar(game, carId);
  if (!car) return res.status(404).json({ error: 'Car not found' });

  const tile = car.card.find(t => t.tileId === tileId);
  if (!tile) return res.status(404).json({ error: 'Tile not found' });

  tile.found = Boolean(found);
  if (found) {
    tile.foundAt = new Date();
    if (photoUrl && typeof photoUrl === 'string') tile.photoUrl = photoUrl.slice(0, 500);
    if (caption && typeof caption === 'string') tile.caption = caption.slice(0, 280);
  } else {
    tile.foundAt = undefined;
  }

  // Check for win — all 9 tiles found
  const allFound = car.card.length > 0 && car.card.every(t => t.found);
  if (allFound && !car.completedAt) {
    car.completedAt = new Date();
  }
  if (allFound && !game.travelBingoConfig.winnerCarId) {
    game.travelBingoConfig.winnerCarId = car.carId;
    game.travelBingoConfig.phase = 'completed';
    game.status = 'completed';
  }

  await game.save();

  return res.status(200).json({ game: serializeGame(game) });
}
