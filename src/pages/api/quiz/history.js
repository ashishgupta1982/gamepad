import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';

// A signed-in player's finished quizzes (REDESIGN-PLAN.md, Phase 3).
//
// GET  → { games: [{id, at, mode, level, categories, count, players}] }, newest first
// POST { mode, level, categories, count, players } → saves one finished quiz
//
// Each player carries `cats`, { [category name]: [right, asked] }, since
// 2026-10-22: what Your quizzes works out best and worst categories from.
//
// Deleting one is DELETE /api/games/:id, which already checks the owner.

const clip = (s, n) => String(s ?? '').slice(0, n);

function cleanCats(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [name, v] of Object.entries(raw).slice(0, 20)) {
    const right = Number(v?.[0]) || 0;
    const asked = Number(v?.[1]) || 0;
    if (asked > 0 && asked <= 100 && right >= 0 && right <= asked) out[clip(name, 60)] = [right, asked];
  }
  return out;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Sign in to keep a history.' });
  await dbConnect();

  if (req.method === 'GET') {
    const docs = await Game.find({ userId: session.user.id, gameType: 'quiz', status: 'completed', 'quizConfig.result': { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    return res.status(200).json({
      games: docs.map((d) => ({
        id: String(d._id),
        at: d.createdAt,
        mode: d.quizConfig?.mode,
        level: d.quizConfig?.difficulty,
        categories: d.quizConfig?.categories || [],
        count: d.quizConfig?.totalQuestions,
        players: d.quizConfig?.result || [],
      })),
    });
  }

  if (req.method === 'POST') {
    const { mode, level, categories, count, players } = req.body || {};
    if (!['solo', 'shout', 'multi'].includes(mode) || !Array.isArray(players) || !players.length) {
      return res.status(400).json({ error: 'Not a finished quiz' });
    }
    const result = players.slice(0, 40).map((p) => ({
      name: clip(p.name, 30) || 'Player',
      avatar: clip(p.avatar, 8),
      color: clip(p.color, 12),
      score: Number(p.score) || 0,
      correct: Number(p.correct) || 0,
      best: Number(p.best) || 0,
      place: Number(p.place) || 0,
      cats: cleanCats(p.cats),
    }));
    const game = await Game.create({
      userId: session.user.id,
      gameType: 'quiz',
      status: 'completed',
      players: result.map((p) => ({ name: p.name, scores: [p.score] })),
      quizConfig: {
        mode,
        difficulty: clip(level, 40),
        categories: (Array.isArray(categories) ? categories : []).slice(0, 8).map((c) => clip(c, 60)),
        totalQuestions: Number(count) || 0,
        result,
      },
    });
    return res.status(201).json({ id: String(game._id) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
