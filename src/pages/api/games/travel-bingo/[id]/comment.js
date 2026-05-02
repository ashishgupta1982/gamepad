import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { findCar, generateId } from '@/lib/travelBingo';
import { serializeGame } from './index';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { carId, ownerCarId, tileId, text } = req.body || {};

  if (!carId || !ownerCarId || !tileId || typeof text !== 'string') {
    return res.status(400).json({ error: 'carId, ownerCarId, tileId, text required' });
  }
  const trimmed = text.trim().slice(0, 280);
  if (!trimmed) return res.status(400).json({ error: 'Comment is empty' });

  await dbConnect();

  const game = await Game.findById(id);
  if (!game || game.gameType !== 'travel-bingo') {
    return res.status(404).json({ error: 'Game not found' });
  }

  const author = findCar(game, carId);
  if (!author) return res.status(404).json({ error: 'Author car not found' });

  const owner = findCar(game, ownerCarId);
  if (!owner) return res.status(404).json({ error: 'Owner car not found' });

  const tile = owner.card.find(t => t.tileId === tileId);
  if (!tile) return res.status(404).json({ error: 'Tile not found' });

  tile.comments = tile.comments || [];
  tile.comments.push({
    commentId: generateId('cmt'),
    carId: author.carId,
    carName: author.name,
    text: trimmed,
    createdAt: new Date(),
  });

  await game.save();

  return res.status(200).json({ game: serializeGame(game) });
}
