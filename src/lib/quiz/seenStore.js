// Server-only: the per-player memory of questions seen (models/QuizSeen.js).
import dbConnect from '@/lib/mongodb';
import QuizSeen from '@/models/QuizSeen';
import { addSeen, nameKey, playerKeys } from './seen';

/** Every question any of these players on this account has seen. */
export async function seenBy(email, names) {
  const keys = playerKeys(names);
  if (!email || !keys.length) return [];
  await dbConnect();
  const docs = await QuizSeen.find({ email, nameKey: { $in: keys } }, { seen: 1 }).lean();
  return [...new Set(docs.flatMap((d) => d.seen || []))];
}

/** Add a game's questions to each player's memory. */
export async function remember(email, names, ids) {
  if (!email) return;
  await dbConnect();
  for (const raw of Array.isArray(names) ? names : []) {
    const key = nameKey(raw);
    if (!key) continue;
    const doc = (await QuizSeen.findOne({ email, nameKey: key })) || new QuizSeen({ email, nameKey: key, name: String(raw).trim().slice(0, 40) });
    doc.seen = addSeen(doc.seen, ids);
    await doc.save();
  }
}

/** The players this account has a memory for, most recently played first. */
export async function listSeen(email) {
  await dbConnect();
  const docs = await QuizSeen.find({ email }, { name: 1, seen: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).lean();
  return docs.map((d) => ({ name: d.name, count: d.seen?.length || 0 }));
}

/** Forget one player's questions. */
export async function forget(email, name) {
  await dbConnect();
  await QuizSeen.deleteOne({ email, nameKey: nameKey(name) });
}
