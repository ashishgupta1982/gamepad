import { rateLimitResponse } from '@aspiro/ai/server';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP, RATE_LIMITS } from '@/utils/rateLimiter';
import { requesterId } from '@/lib/egypt/ai';
import { LEVELS, topicsFor } from '@/lib/quiz/catalogue';
import { checkQuizBudget, writeQuestions } from '@/lib/quiz/writer';

// Questions for a quiz (REDESIGN-PLAN.md, Phase 3).
//
// POST {
//   picks:  built-in category ids, and custom categories as {name, description}
//           (a guest's live on their device, so they are sent whole);
//   level:  a LEVELS id;
//   count:  how many, 1 to 20 (a game asks for a few first, so it can start,
//           then the rest while it plays);
//   avoid:  fingerprints of questions already played, which are filtered out;
//   recent: recent question texts, which the writer is told to steer away from
// }
// → { questions: [{id, question, options, correctAnswer, category, explanation}] }
//
// Open to guests, so every call counts against a durable budget per account or
// connection, and site-wide (lib/quiz/writer.js).

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const burst = checkRate(getClientIP(req), 'CLAUDE_API');
  if (!burst.allowed) return res.status(429).json({ error: RATE_LIMITS.CLAUDE_API.message });

  const { picks, level, count, avoid, recent } = req.body || {};
  const n = Math.round(Number(count));
  if (!(n >= 1 && n <= 20)) return res.status(400).json({ error: 'Ask for between 1 and 20 questions.' });
  if (!LEVELS.some((l) => l.id === level)) return res.status(400).json({ error: 'Unknown level.' });

  const topics = topicsFor(Array.isArray(picks) ? picks.slice(0, 8) : []);
  const avoidList = (Array.isArray(avoid) ? avoid : []).filter((x) => typeof x === 'string' && x.length < 16).slice(-500);
  const recentList = (Array.isArray(recent) ? recent : []).filter((x) => typeof x === 'string').map((x) => x.slice(0, 140)).slice(-30);

  const user = await getAuthenticatedUser(req, res).catch(() => null);
  const verdict = await checkQuizBudget(requesterId(user, getClientIP(req)));
  if (!verdict.allowed) return rateLimitResponse(res, verdict, 'quiz questions');

  try {
    const questions = await writeQuestions({ topics, level, count: n, avoid: avoidList, recent: recentList });
    if (!questions.length) return res.status(502).json({ error: 'The question writer came back empty. Try again?' });
    return res.status(200).json({ questions });
  } catch (err) {
    console.error('[quiz-questions] failed:', err.message, err.debug || '');
    return res.status(502).json({ error: 'Could not write the questions just now. Try again?' });
  }
}
