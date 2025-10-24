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

  if (req.method === 'GET') {
    try {
      const games = await Game.find({ userId: session.user.email })
        .sort({ updatedAt: -1 });
      return res.status(200).json({ games });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch games' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { gameType, players } = req.body;

      if (!gameType || !players || players.length === 0) {
        return res.status(400).json({ error: 'Invalid game data' });
      }

      const game = await Game.create({
        userId: session.user.email,
        gameType,
        players: players.map(name => ({ name, scores: [] })),
        status: 'active'
      });

      return res.status(201).json({ game });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create game' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
