// Checking and tidying questions from the writer (the AI), shared by the
// question route and its tests.
//
// What came back used to be trusted: options sliced to four whatever they were,
// a missing answer index read as 0, nothing shuffled, so the right answer sat
// wherever the model habitually puts it. Now every question is checked, and
// the server decides the answer's position.

const MAX_Q = 300;
const MAX_OPTION = 120;
const MAX_EXPLANATION = 300;

const tidy = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * One question as the writer sent it ({question, options, answer, category,
 * explanation}, `answer` being the correct option's text or index), checked.
 * Returns null if it is unusable: not four distinct non-empty options, or an
 * answer that is not one of them.
 */
export function checkQuestion(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const question = tidy(raw.question, MAX_Q);
  const options = Array.isArray(raw.options) ? raw.options.map((o) => tidy(o, MAX_OPTION)) : [];
  if (!question || options.length !== 4 || options.some((o) => !o)) return null;
  if (new Set(options.map((o) => o.toLowerCase())).size !== 4) return null;

  let correct = -1;
  if (typeof raw.answer === 'number' && Number.isInteger(raw.answer)) correct = raw.answer;
  else if (typeof raw.answer === 'string') correct = options.findIndex((o) => o.toLowerCase() === tidy(raw.answer, MAX_OPTION).toLowerCase());
  else if (typeof raw.correctAnswer === 'number') correct = raw.correctAnswer;
  if (!(correct >= 0 && correct < 4)) return null;

  const media = checkMedia(raw.media);
  return {
    question,
    options,
    correctAnswer: correct,
    category: tidy(raw.category, 60),
    explanation: tidy(raw.explanation, MAX_EXPLANATION),
    ...(media ? { media } : {}),
  };
}

/**
 * A question's picture ({kind:'image', src, alt, credit}) or emoji clue
 * ({kind:'emoji', text}), checked; null when there is none or it will not do.
 * A picture is on https (in practice Cloudinary, through @aspiro/media).
 */
export function checkMedia(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.kind === 'emoji') {
    const text = tidy(raw.text, 40);
    return text ? { kind: 'emoji', text } : null;
  }
  if (raw.kind === 'image') {
    const src = String(raw.src ?? '').trim();
    if (src.length > 500 || !/^https:\/\//.test(src)) return null;
    return { kind: 'image', src, alt: tidy(raw.alt, 160), credit: tidy(raw.credit, 160) };
  }
  return null;
}

/** The same question with its options in a fresh order. `random` is injectable for tests. */
export function shuffleOptions(q, random = Math.random) {
  const order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...q, options: order.map((i) => q.options[i]), correctAnswer: order.indexOf(q.correctAnswer) };
}

/**
 * A short, stable key for a question, so the same question is recognised next
 * time however its wording varies in case, spacing or punctuation. Used to keep
 * questions from coming back game after game.
 */
export function fingerprint(questionText) {
  const norm = String(questionText ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  let h = 2166136261;
  for (let i = 0; i < norm.length; i++) {
    h ^= norm.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * A question's key: its fingerprint, counting its picture or emoji clue as
 * part of it, since "Which country's flag is this?" is a different question
 * for every flag. A question with neither keys as its text alone.
 */
export function questionKey(q) {
  // fingerprint keeps letters and digits only, so emoji go in as code points.
  // A picture counts by its name, not its version: Cloudinary puts the upload
  // version in the URL (/v1792615199/), and re-uploading the same picture
  // must not turn the question into a new one.
  const clue =
    q.media?.kind === 'emoji'
      ? [...q.media.text].map((c) => c.codePointAt(0).toString(36)).join(' ')
      : String(q.media?.src || '').split(/[?#]/)[0].replace(/\/v\d+\//, '/');
  return fingerprint(`${q.question} ${clue}`);
}

/**
 * Checked, shuffled questions with no repeats, either within the batch or
 * against `avoid` (fingerprints already played). At most `count`.
 */
export function acceptQuestions(rawList, { count, avoid = [], random = Math.random } = {}) {
  const seen = new Set(avoid);
  const out = [];
  for (const raw of Array.isArray(rawList) ? rawList : []) {
    const q = checkQuestion(raw);
    if (!q) continue;
    const fp = questionKey(q);
    if (seen.has(fp)) continue;
    seen.add(fp);
    out.push({ ...shuffleOptions(q, random), id: fp });
    if (out.length >= count) break;
  }
  return out;
}

/**
 * Balance the answer positions across a game. Shuffling each question on its
 * own still allows runs (three Bs in a row); this deals positions from a
 * repeating 0-1-2-3 deck so every slot gets its share.
 */
export function balancePositions(questions, random = Math.random) {
  const deck = [];
  while (deck.length < questions.length) {
    const four = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [four[i], four[j]] = [four[j], four[i]];
    }
    deck.push(...four);
  }
  return questions.map((q, i) => {
    const target = deck[i];
    if (q.correctAnswer === target) return q;
    const options = [...q.options];
    [options[q.correctAnswer], options[target]] = [options[target], options[q.correctAnswer]];
    return { ...q, options, correctAnswer: target };
  });
}
