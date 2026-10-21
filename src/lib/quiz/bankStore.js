// Server-only: reading and filling the question bank (models/QuizQuestion.js).
import dbConnect from '@/lib/mongodb';
import QuizQuestion from '@/models/QuizQuestion';
import { levelFilter } from './bank';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Up to `count` random questions from `categories` for `level`, none of them
 * in `avoid` (fingerprints this phone has played), and nothing marked dated
 * that was written over a year ago.
 */
export async function draw({ categories, level, count, avoid = [] }) {
  if (count <= 0 || !categories.length) return [];
  await dbConnect();
  return QuizQuestion.aggregate([
    {
      $match: {
        status: 'active',
        category: { $in: categories },
        fingerprint: { $nin: avoid },
        ...levelFilter(level),
        $or: [{ dated: { $ne: true } }, { createdAt: { $gte: new Date(Date.now() - YEAR_MS) } }],
      },
    },
    { $sample: { size: count } },
  ]);
}

/** New questions into the bank. One already there (same fingerprint) is left as it was. */
export async function store(docs) {
  if (!docs.length) return 0;
  await dbConnect();
  try {
    const made = await QuizQuestion.insertMany(docs, { ordered: false });
    return made.length;
  } catch (err) {
    // Duplicates fail one by one and the rest still go in.
    if (err?.code === 11000 || err?.writeErrors) return err.insertedDocs?.length ?? 0;
    throw err;
  }
}

/** Count a game's questions as served. */
export async function markServed(fingerprints) {
  if (!fingerprints.length) return;
  await dbConnect();
  await QuizQuestion.updateMany({ fingerprint: { $in: fingerprints } }, { $inc: { 'stats.served': 1 } });
}
