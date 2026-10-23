// Questions too close to share a bank (npm run quiz:check). The bank already
// refuses an exact repeat (the same fingerprint); these are the near ones it
// cannot see: the same fact asked in other words, often in another category
// (2026-10-22: Adele's album names were in Music and Celebrities), and the
// same picture used twice.

const STOP = new Set(
  'a an and are as at be by can did do does for from had has have how in into is it its of on or that the their them these this those to was were what when where which who whose why will with you your name called known first most one many much each'.split(' '),
);

/** The words that carry a question's meaning: lower case, no stop words, plurals folded. */
export function meaningWords(text) {
  const out = new Set();
  for (const w of String(text ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/)) {
    if (w.length < 3 || STOP.has(w)) continue;
    out.add(w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w);
  }
  return out;
}

/** How many meaning words two questions share. */
export function sharedWords(a, b) {
  const y = meaningWords(b);
  let shared = 0;
  for (const w of meaningWords(a)) if (y.has(w)) shared++;
  return shared;
}

/** Shared words over the shorter question's: 1 when one says all the other does. */
export function similarity(a, b) {
  const shorter = Math.min(meaningWords(a).size, meaningWords(b).size);
  return shorter ? sharedWords(a, b) / shorter : 0;
}

/**
 * Which picture or emoji clue a question shows, or null: the seed file's hint
 * (flag, wiki, file, outline) when it has one, else the picture's name on
 * Cloudinary without its version or close-up suffix.
 */
export function pictureKey(media) {
  if (!media?.kind) return null;
  if (media.kind === 'emoji') return media.text ? `emoji:${media.text}` : null;
  for (const hint of ['flag', 'outline', 'wiki', 'file']) if (media[hint]) return `${hint}:${String(media[hint]).toLowerCase().replace(/[ _]+/g, '_')}`;
  const name = String(media.src || '').split('/').pop()?.replace(/\.[a-z]+$/i, '').replace(/-zoom$/, '');
  return name ? `src:${name}` : null;
}

const answerOf = (q) => String(q.options?.[q.correctAnswer] ?? q.answer ?? '').trim().toLowerCase();

/**
 * Why two questions are too close to keep both, or null. `a` and `b` are
 * {question, options, correctAnswer (or answer), media}.
 *   same picture                  the same flag, photo, logo, outline or emoji twice
 *   same answer, similar question the same fact in other words
 *   near-identical wording        nearly the same question, whatever the answer
 * A picture or emoji question's wording is the same for every picture on
 * purpose ("Which country's flag is this?"), so only its picture is compared.
 * Tuned on the 1,310 questions of 2026-10-23: looser than this, it mostly
 * listed different facts with an answer in common (two Rugby World Cup
 * questions both answered New Zealand), which teaches people to ignore it.
 */
export function tooClose(a, b) {
  const pa = pictureKey(a.media);
  const pb = pictureKey(b.media);
  if (pa && pa === pb) return 'same picture';
  const sim = similarity(a.question, b.question);
  const sameAnswer = answerOf(a) && answerOf(a) === answerOf(b);
  if (pa || pb) return null;
  if (sameAnswer && sim >= 0.75) return 'same answer, similar question';
  if (sim >= 0.9 && meaningWords(a.question).size >= 4 && meaningWords(b.question).size >= 4) return 'near-identical wording';
  return null;
}

/**
 * Two questions with the same answer and some words in common, not close
 * enough for tooClose: a judgement, not a fault. Half the near-duplicates
 * found by hand on 2026-10-22 were this (Harry Styles's band asked twice, John
 * Williams twice), but so are plenty of fair pairs (York as Jorvik and as
 * Eboracum), so it is listed to look at and never fails the check.
 */
export function worthALook(a, b) {
  if (pictureKey(a.media) || pictureKey(b.media) || tooClose(a, b)) return false;
  return !!answerOf(a) && answerOf(a) === answerOf(b) && similarity(a.question, b.question) >= 0.5;
}
