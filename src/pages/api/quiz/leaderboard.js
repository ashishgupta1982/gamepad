import dbConnect from '@/lib/mongodb';
import PlayerStats from '@/models/PlayerStats';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();
  const session = await getServerSession(req, res, authOptions);

  const { category, limit = 20 } = req.query;
  const maxLimit = Math.min(parseInt(limit) || 20, 50);

  let query = {};

  // If user is logged in, show their household leaderboard
  if (session?.user?.id) {
    query = { userId: session.user.id };
  }

  const players = await PlayerStats.find(query)
    .sort({ totalScore: -1 })
    .limit(maxLimit)
    .select('playerName totalScore gamesPlayed gamesWon totalCorrect totalQuestions bestStreak avgResponseTime categoryStats')
    .lean();

  // Calculate win rate and accuracy
  const leaderboard = players.map(p => ({
    ...p,
    winRate: p.gamesPlayed > 0 ? Math.round((p.gamesWon / p.gamesPlayed) * 100) : 0,
    accuracy: p.totalQuestions > 0 ? Math.round((p.totalCorrect / p.totalQuestions) * 100) : 0
  }));

  return res.status(200).json({ leaderboard });
}
