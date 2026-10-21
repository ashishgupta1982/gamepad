import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { findCar } from '@/lib/travelBingo';
import { serializeGame } from './index';
import { resolvePlayer } from '@/utils/playerIdentity';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { carId, tileId, caption, found = true } = req.body || {};

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

  // A carId alone was enough to mark a tile, so any participant could fill in
  // a rival car's card — and marking a tile is what decides the winner.
  const player = await resolvePlayer(req, res);
  if (!player || car.userId !== player.id) {
    return res.status(403).json({ error: 'You can only mark tiles on your own card' });
  }

  const tile = car.card.find(t => t.tileId === tileId);
  if (!tile) return res.status(404).json({ error: 'Tile not found' });

  // Saving a caption on a tile already found re-sends found:true. Keep the
  // time it was first spotted, which the feed and the results order by.
  const wasFound = tile.found;
  tile.found = Boolean(found);
  if (found) {
    if (!wasFound || !tile.foundAt) tile.foundAt = new Date();
    if (typeof caption === 'string') tile.caption = caption.slice(0, 280);
  } else {
    tile.foundAt = undefined;
    tile.caption = undefined;
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
