import dbConnect from '@/lib/mongodb';
import QuizQuestion from '@/models/QuizQuestion';
import { needsReview } from '@/lib/quiz/bank';
import { checkRate, getClientIP, RATE_LIMITS } from '@/utils/rateLimiter';

// The thumbs after a question (2026-10-21), like Outsmarted's: they tell the
// bank which questions are good. Open to guests. A phone votes once per
// question (it remembers, components/quiz-show/data.js); changing its mind
// sends the vote it is taking back as `from`.
//
// POST { id, vote: 'up' | 'down', from?: 'up' | 'down' }  → { ok }
// POST { id, wrong: true }                                 "the answer's wrong"
//
// A question the thumbs turn against goes to status 'review' and is no longer
// served (lib/quiz/bank.js#needsReview). A question that is not in the bank (a
// player's own category, written live) is simply not found.

const VOTES = ['up', 'down'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const limit = checkRate(getClientIP(req), 'STANDARD_API');
  if (!limit.allowed) return res.status(429).json({ error: RATE_LIMITS.STANDARD_API.message });

  const { id, vote, from, wrong } = req.body || {};
  if (typeof id !== 'string' || !id || id.length > 16) return res.status(400).json({ error: 'Which question?' });
  const inc = {};
  if (wrong === true) inc['stats.wrong'] = 1;
  else if (VOTES.includes(vote)) {
    inc[`stats.${vote}`] = 1;
    if (VOTES.includes(from) && from !== vote) inc[`stats.${from}`] = -1;
    if (from === vote) return res.status(200).json({ ok: true });
  } else return res.status(400).json({ error: 'A vote is up or down.' });

  try {
    await dbConnect();
    const doc = await QuizQuestion.findOneAndUpdate({ fingerprint: id }, { $inc: inc }, { new: true, projection: { stats: 1, status: 1 } }).lean();
    if (doc && doc.status === 'active' && needsReview(doc.stats)) {
      await QuizQuestion.updateOne({ fingerprint: id, status: 'active' }, { $set: { status: 'review' } });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[quiz-rate] failed:', err.message);
    return res.status(500).json({ error: 'Could not save that.' });
  }
}
