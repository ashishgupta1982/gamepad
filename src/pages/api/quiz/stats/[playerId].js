import dbConnect from '@/lib/mongodb';
import PlayerStats from '@/models/PlayerStats';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();
  const { playerId } = req.query;

  const stats = await PlayerStats.findById(playerId).lean();
  if (!stats) {
    return res.status(404).json({ error: 'Player stats not found' });
  }

  return res.status(200).json(stats);
}
