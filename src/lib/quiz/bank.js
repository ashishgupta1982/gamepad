// The question bank's rules, as pure functions: which categories a pick draws
// from, how a level searches the bank, and how a question is checked and
// tagged on its way in. Shared by the question route, the writer and the seed
// import script (scripts/import-quiz-bank.mjs), so relative imports only.
import { CATEGORIES, GROUPS, MIXED, categoryById, groupOfPick } from './catalogue.js';
import { checkQuestion, questionKey, shuffleOptions } from './questions.js';

export const BANDS = ['kids', 'adults'];

// Mixed bag is general knowledge: every group but Big Worlds, whose franchise
// questions are for people who picked them.
const MIXED_FROM = GROUPS.filter((g) => g.id !== 'big-worlds').flatMap((g) => g.categories.map((c) => c.id));

/** The bank categories a built-in pick draws from; empty for anything else. */
export function categoriesOf(pick) {
  if (pick === MIXED.id) return MIXED_FROM;
  const group = groupOfPick(pick);
  if (group) return group.categories.map((c) => c.id);
  return typeof pick === 'string' && categoryById(pick) ? [pick] : [];
}

/** How a level searches the bank: its band, or for Family mix the family questions of both. */
export function levelFilter(level) {
  if (level === 'kids' || level === 'adults') return { band: level };
  return { family: true };
}

/**
 * What the writer fills when a level runs short: Family mix tops up with Kids
 * questions that must all suit a family.
 */
export function writeTarget(level) {
  if (level === 'adults') return { band: 'adults', familyOnly: false };
  if (level === 'kids') return { band: 'kids', familyOnly: false };
  return { band: 'kids', familyOnly: true };
}

/** `count` shared across `n` slots as evenly as it goes, the spare to the first. */
export function share(count, n) {
  const base = Math.floor(count / n);
  return Array.from({ length: n }, (_, i) => base + (i < count % n ? 1 : 0));
}

/** Lists dealt in turn, so a game's categories take turns rather than coming in runs. */
export function interleave(lists) {
  const out = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) out.push(l[i]);
  return out;
}

/**
 * A question for the bank, from a seed file or the writer, checked and tagged;
 * null if it will not do. `raw` is {question, options, answer, explanation,
 * family, difficulty, dated, media}.
 */
export function toBank(raw, { category, band, source = 'writer', model } = {}) {
  if (category === MIXED.id || !categoryById(category) || !BANDS.includes(band)) return null;
  const q = checkQuestion(raw);
  if (!q) return null;
  return {
    fingerprint: questionKey(q),
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    category,
    band,
    family: raw.family === true,
    difficulty: [1, 2, 3].includes(raw.difficulty) ? raw.difficulty : 2,
    dated: raw.dated === true,
    ...(q.media ? { media: q.media } : {}),
    source,
    ...(model ? { model } : {}),
  };
}

/** A bank question as a game gets it: options shuffled, its category by name. */
export function fromBank(doc, random = Math.random) {
  const q = shuffleOptions({ options: doc.options, correctAnswer: doc.correctAnswer }, random);
  return {
    id: doc.fingerprint,
    question: doc.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    category: categoryById(doc.category)?.name || '',
    explanation: doc.explanation || '',
    ...(doc.media?.kind ? { media: doc.media } : {}),
  };
}

/**
 * One seed file, `data/quiz-bank/<category>.json`: {category, questions: [{band,
 * …}]}. Returns the bank documents and a line for each question that failed.
 */
export function readSeedFile(json, name = 'file') {
  const docs = [];
  const errors = [];
  if (!json || !categoryById(json.category) || json.category === MIXED.id) {
    return { docs, errors: [`${name}: unknown category ${json?.category}`] };
  }
  const seen = new Set();
  (Array.isArray(json.questions) ? json.questions : []).forEach((raw, i) => {
    const doc = toBank(raw, { category: json.category, band: raw?.band, source: 'seed', model: raw?.model });
    if (!doc) return errors.push(`${name} #${i + 1}: not a usable question (${String(raw?.question).slice(0, 60)})`);
    if (raw.media && !doc.media) return errors.push(`${name} #${i + 1}: its picture or emoji did not check out`);
    if (seen.has(doc.fingerprint)) return errors.push(`${name} #${i + 1}: a repeat`);
    seen.add(doc.fingerprint);
    docs.push(doc);
  });
  return { docs, errors };
}

export const bankCategoryIds = () => CATEGORIES.filter((c) => c.id !== MIXED.id).map((c) => c.id);

/**
 * Whether the thumbs say a question should stop being served: two "the
 * answer's wrong" flags, or at least five votes with seven in ten of them
 * down. It goes to 'review' rather than away, so it can be looked at and
 * fixed (a seed question fixed in its file comes back on the next import).
 */
export function needsReview({ up = 0, down = 0, wrong = 0 } = {}) {
  const votes = up + down;
  return wrong >= 2 || (votes >= 5 && down >= 0.7 * votes);
}
