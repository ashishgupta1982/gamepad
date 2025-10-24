import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Game from '../../../models/Game';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const game = await Game.findOne({
        _id: id,
        userId: session.user.email
      });

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.status(200).json({ game });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch game' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { players, status } = req.body;

      const game = await Game.findOne({
        _id: id,
        userId: session.user.email
      });

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      if (players) {
        game.players = players;
      }

      if (status) {
        game.status = status;
      }

      game.updatedAt = Date.now();
      await game.save();

      return res.status(200).json({ game });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update game' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const game = await Game.findOneAndDelete({
        _id: id,
        userId: session.user.email
      });

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.status(200).json({ message: 'Game deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete game' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
