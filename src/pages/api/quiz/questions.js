import { rateLimitResponse } from '@aspiro/ai/server';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP, RATE_LIMITS } from '@/utils/rateLimiter';
import { requesterId } from '@/lib/egypt/ai';
import { LEVELS, MIXED, topicsFor } from '@/lib/quiz/catalogue';
import { categoriesOf, fromBank, interleave, share } from '@/lib/quiz/bank';
import { draw, markServed, store } from '@/lib/quiz/bankStore';
import { seenBy } from '@/lib/quiz/seenStore';
import { balancePositions } from '@/lib/quiz/questions';
import { checkQuizBudget, writeForBank, writeQuestions } from '@/lib/quiz/writer';

// Questions for a quiz, from the question bank (models/QuizQuestion.js).
//
// POST {
//   picks:  built-in category ids, whole groups (`group:<id>`), `mixed`, and
//           custom categories as {name, description} (a guest's live on their
//           device, so they are sent whole);
//   level:  a LEVELS id;
//   count:  how many, 1 to 20 (a game asks for a few first, so it can start,
//           then the rest while it plays);
//   avoid:  question ids already in this game, which are left out;
//   recent: their texts, which the writer is told to steer away from;
//   players: the names playing. On a signed-in account, whatever any of them
//           has seen before is left out too (models/QuizSeen.js), so Dad gets
//           no repeats while Mum on her own still can. Guests have no memory.
// }
// → { questions: [{id, question, options, correctAnswer, category, explanation, media?}] }
//
// The count is shared between the picks. A built-in pick is drawn from the
// bank; where the bank is short for that level, the writer tops it up and the
// new questions are kept for next time. A custom category is written live and
// not kept. Only writing counts against the durable AI budget per account or
// connection and site-wide (lib/quiz/writer.js), so a game served from the
// bank costs nothing.

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const burst = checkRate(getClientIP(req), 'CLAUDE_API');
  if (!burst.allowed) return res.status(429).json({ error: RATE_LIMITS.CLAUDE_API.message });

  const { picks, level, count, avoid, recent, players } = req.body || {};
  const n = Math.round(Number(count));
  if (!(n >= 1 && n <= 20)) return res.status(400).json({ error: 'Ask for between 1 and 20 questions.' });
  if (!LEVELS.some((l) => l.id === level)) return res.status(400).json({ error: 'Unknown level.' });

  const list = Array.isArray(picks) ? picks.slice(0, 8) : [];
  const slots = list.filter((p) => (typeof p === 'string' ? categoriesOf(p).length > 0 : p && typeof p === 'object'));
  if (!slots.length) slots.push(MIXED.id);
  // Shuffled, so when a batch is smaller than the picks (the first is 3) it is
  // not always the first picks that get questions.
  slots.sort(() => Math.random() - 0.5);
  const user = await getAuthenticatedUser(req, res).catch(() => null);
  const seenBefore = user?.email ? await seenBy(user.email, players).catch(() => []) : [];
  const avoidList = [...seenBefore, ...(Array.isArray(avoid) ? avoid : []).filter((x) => typeof x === 'string' && x.length < 16).slice(-100)];
  const recentList = (Array.isArray(recent) ? recent : []).filter((x) => typeof x === 'string').map((x) => x.slice(0, 140)).slice(-30);

  // The AI budget is checked once, and only if something has to be written.
  let budget = null;
  const mayWrite = () => {
    if (!budget) {
      budget = checkQuizBudget(requesterId(user, getClientIP(req)));
    }
    return budget.then((verdict) => {
      if (!verdict.allowed) throw Object.assign(new Error('Over the question budget'), { verdict });
    });
  };

  const wants = share(n, slots.length);
  const results = await Promise.allSettled(
    slots.map(async (slot, i) => {
      const want = wants[i];
      if (!want) return [];
      if (typeof slot !== 'string') {
        await mayWrite();
        return writeQuestions({ topics: topicsFor([slot]), level, count: want, avoid: avoidList, recent: recentList });
      }
      const categories = categoriesOf(slot);
      const drawn = await draw({ categories, level, count: want, avoid: avoidList });
      const got = drawn.map((d) => fromBank(d));
      if (got.length >= want) return got;
      // The bank is short here: write more, spread over up to three of the
      // pick's categories so a Mixed bag is still mixed.
      await mayWrite();
      const short = want - got.length;
      const chosen = [...categories].sort(() => Math.random() - 0.5).slice(0, Math.min(3, short));
      const counts = share(short, chosen.length);
      const avoidNow = [...avoidList, ...got.map((q) => q.id)];
      const written = await Promise.all(chosen.map((category, k) => writeForBank({ category, level, count: counts[k], avoid: avoidNow, recent: recentList })));
      const fresh = written.flat();
      await store(fresh).catch((err) => console.error('[quiz-questions] could not keep new questions:', err.message));
      return [...got, ...interleave(written).slice(0, short).map((d) => fromBank(d))];
    }),
  );

  const lists = results.map((r) => (r.status === 'fulfilled' ? r.value : []));
  const seen = new Set();
  const questions = balancePositions(interleave(lists).filter((q) => !seen.has(q.id) && seen.add(q.id))).slice(0, n);

  const failures = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
  for (const err of failures) if (!err?.verdict) console.error('[quiz-questions] failed:', err?.message, err?.debug || '');

  if (!questions.length) {
    const over = failures.find((err) => err?.verdict);
    if (over) return rateLimitResponse(res, over.verdict, 'quiz questions');
    return res.status(502).json({ error: 'Could not get the questions just now. Try again?' });
  }

  await markServed(questions.map((q) => q.id)).catch(() => {});
  // Fewer than asked is fine: the game asks again for the rest.
  return res.status(200).json({ questions });
}
