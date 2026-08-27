import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { generateId } from '@/lib/travelBingo';
import { serializeGame } from './index';
import { resolvePlayer } from '@/utils/playerIdentity';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { carName } = req.body || {};

  if (!carName || typeof carName !== 'string' || !carName.trim()) {
    return res.status(400).json({ error: 'carName required' });
  }

  // Session first, body only as a guest fallback.
  //
  // This matters more here than anywhere else in the app: the re-join below is
  // idempotent by userId and returns the EXISTING car for a match. With the id
  // read straight from the body, supplying someone else's id handed you their
  // car — their tiles, their progress, their score.
  const player = await resolvePlayer(req, res);
  if (!player) {
    return res.status(400).json({ error: 'Could not identify player' });
  }
  const userId = player.id;

  await dbConnect();

  const game = await Game.findById(id);
  if (!game || game.gameType !== 'travel-bingo') {
    return res.status(404).json({ error: 'Game not found' });
  }

  if (game.travelBingoConfig.phase !== 'submission') {
    return res.status(409).json({ error: 'Game has already started — cannot join' });
  }

  // If this userId already has a car, return that car (idempotent re-join)
  const existing = game.travelBingoConfig.cars.find(c => c.userId === userId);
  if (existing) {
    return res.status(200).json({ carId: existing.carId, game: serializeGame(game) });
  }

  const carId = generateId('car');
  game.travelBingoConfig.cars.push({
    carId,
    name: carName.trim(),
    userId,
    joinedAt: new Date(),
    submittedItems: [],
    card: [],
  });
  await game.save();

  return res.status(200).json({ carId, game: serializeGame(game) });
}
