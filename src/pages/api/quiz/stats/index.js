import dbConnect from '@/lib/mongodb';
import PlayerStats from '@/models/PlayerStats';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  await dbConnect();
  const session = await getServerSession(req, res, authOptions);

  if (req.method === 'POST') {
    const { gameId, players, categories } = req.body;
    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ error: 'Players array required' });
    }

    const userId = session?.user?.id || null;
    const householdId = userId || 'guest';

    // Sort players by score to determine winner
    const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

    const results = [];

    for (let i = 0; i < sorted.length; i++) {
      const player = sorted[i];
      const correct = player.answers?.filter(a => a.correct).length || 0;
      const total = player.answers?.length || 0;
      const avgTime = total > 0
        ? player.answers.reduce((sum, a) => sum + (a.timeMs || 0), 0) / total
        : 0;
      const bestStreak = calculateBestStreak(player.answers || []);
      const isWinner = i === 0 && players.length > 1;

      // Find or create player stats
      let stats = await PlayerStats.findOne({
        householdId,
        playerName: player.name
      });

      if (!stats) {
        stats = new PlayerStats({
          userId,
          playerName: player.name,
          householdId
        });
      }

      stats.gamesPlayed += 1;
      if (isWinner) stats.gamesWon += 1;
      stats.totalScore += player.score || 0;
      stats.totalCorrect += correct;
      stats.totalQuestions += total;
      stats.bestStreak = Math.max(stats.bestStreak, bestStreak);

      // Running average for response time
      const prevTotal = stats.avgResponseTime * (stats.gamesPlayed - 1);
      stats.avgResponseTime = stats.gamesPlayed > 0
        ? (prevTotal + avgTime) / stats.gamesPlayed
        : avgTime;

      // Update category stats
      if (categories) {
        for (const cat of categories) {
          const catCorrect = player.answers?.filter(a => a.correct).length || 0;
          const catTotal = player.answers?.length || 0;

          const existing = stats.categoryStats.find(cs => cs.category === cat);
          if (existing) {
            existing.played += catTotal;
            existing.correct += catCorrect;
            existing.avgScore = existing.played > 0
              ? Math.round((existing.correct / existing.played) * 100)
              : 0;
          } else {
            stats.categoryStats.push({
              category: cat,
              played: catTotal,
              correct: catCorrect,
              avgScore: catTotal > 0 ? Math.round((catCorrect / catTotal) * 100) : 0
            });
          }
        }
      }

      // Add to recent games (keep last 20)
      stats.recentGames.unshift({
        gameId: gameId || null,
        date: new Date(),
        score: player.score || 0,
        rank: i + 1,
        playerCount: players.length,
        categories: categories || []
      });
      if (stats.recentGames.length > 20) {
        stats.recentGames = stats.recentGames.slice(0, 20);
      }

      await stats.save();
      results.push(stats);
    }

    return res.status(200).json({ saved: results.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function calculateBestStreak(answers) {
  let best = 0;
  let current = 0;
  for (const a of answers) {
    if (a.correct) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}
