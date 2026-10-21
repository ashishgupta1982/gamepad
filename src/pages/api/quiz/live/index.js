import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import dbConnect from '@/lib/mongodb';
import QuizLive from '@/models/QuizLive';
import { checkRate, getClientIP } from '@/utils/rateLimiter';
import { LEVELS, QUESTION_COUNTS, TIMERS } from '@/lib/quiz/catalogue';
import { createGame } from '@/lib/quiz/machine';
import { newCode, newToken, project } from '@/lib/quiz/live';

// Open a multi-phone quiz. POST { settings: {picks, level, count, timer} }
// → { code, hostToken, v, game }. Guests can host: the host token, kept on the
// host's device, is what lets them run it.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkRate(getClientIP(req), 'STANDARD_API').allowed) return res.status(429).json({ error: 'Slow down a moment.' });

  const s = req.body?.settings || {};
  const settings = {
    picks: Array.isArray(s.picks) ? s.picks.slice(0, 8) : [],
    level: LEVELS.some((l) => l.id === s.level) ? s.level : 'family',
    count: QUESTION_COUNTS.includes(s.count) ? s.count : 10,
    timer: TIMERS.some((t) => t.seconds === s.timer) ? s.timer : 20,
  };

  const session = await getServerSession(req, res, authOptions).catch(() => null);
  await dbConnect();
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const doc = await QuizLive.create({
        code: newCode(),
        hostToken: newToken(),
        hostUserId: session?.user?.id,
        game: createGame({ mode: 'multi', settings }),
      });
      return res.status(201).json({ code: doc.code, hostToken: doc.hostToken, v: doc.version, now: Date.now(), game: project(doc.toObject()) });
    } catch (err) {
      if (err?.code !== 11000) {
        console.error('[quiz-live] create failed:', err.message);
        return res.status(500).json({ error: 'Could not open the quiz. Try again?' });
      }
    }
  }
  return res.status(500).json({ error: 'Could not open the quiz. Try again?' });
}
