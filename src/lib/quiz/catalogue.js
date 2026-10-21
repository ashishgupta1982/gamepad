// What a quiz can be about, and who it is for. Pure data and checks, shared by
// the browser and the server (REDESIGN-PLAN.md, Phase 3).

// The built-in categories. `brief` is what the question writer is told; the
// name alone is too vague for a good quiz ("Science" for six-year-olds is not
// "Science" for a pub).
export const CATEGORIES = [
  { id: 'general', name: 'General Knowledge', emoji: '💡', brief: 'a broad mix: everyday facts, people, places, things everyone has a chance at' },
  { id: 'food-drink', name: 'Food & Drink', emoji: '🍕', brief: 'dishes, ingredients, where foods come from, famous brands and drinks' },
  { id: 'sport', name: 'Sport', emoji: '⚽', brief: 'football, the Olympics, tennis, cricket, rugby and famous sporting moments' },
  { id: 'animals', name: 'Animals & Nature', emoji: '🦁', brief: 'animals, plants, the natural world and record-breaking creatures' },
  { id: 'music-film', name: 'Music, Film & TV', emoji: '🎬', brief: 'films, TV shows, songs, bands and the people in them' },
  { id: 'history', name: 'History', emoji: '🏛️', brief: 'famous events, people and inventions from the past' },
  { id: 'geography', name: 'Geography', emoji: '🌍', brief: 'countries, capitals, flags, rivers, mountains and landmarks' },
  { id: 'science', name: 'Science', emoji: '🔬', brief: 'the body, space, chemistry, physics and how things work' },
  { id: 'words', name: 'Words & Language', emoji: '🔤', brief: 'spelling, meanings, idioms, odd words and where words come from' },
  { id: 'brain-teasers', name: 'Brain Teasers', emoji: '🧩', brief: 'riddles, lateral thinking, number and word puzzles with one clear answer' },
  { id: 'pop-culture', name: 'Pop Culture', emoji: '🌟', brief: 'celebrities, games, internet culture, toys and trends' },
  { id: 'art-books', name: 'Art & Books', emoji: '📚', brief: 'paintings, artists, books, authors and famous characters' },
];

// Who the quiz is for. One level per game; everyone in a game gets the same
// questions (Ash, 2026-10-21).
export const LEVELS = [
  { id: 'little', name: 'Little ones', ages: '5 to 8', emoji: '🧸', brief: 'children aged 5 to 8: short questions with simple words, about things a young child knows from home, school, cartoons and picture books' },
  { id: 'kids', name: 'Kids', ages: '9 to 12', emoji: '🎒', brief: 'children aged 9 to 12: primary-school level, fun facts, nothing obscure' },
  { id: 'family', name: 'Family mix', ages: 'everyone', emoji: '👨‍👩‍👧', brief: 'a mixed family of children and adults: questions a 10-year-old has a fair chance at but that still interest adults' },
  { id: 'adults', name: 'Grown-ups', ages: 'teens and adults', emoji: '🍷', brief: 'teenagers and adults: pub-quiz standard, a mix of easier and harder questions' },
  { id: 'buffs', name: 'Quiz buffs', ages: 'hard', emoji: '🧠', brief: 'keen quizzers: hard, specific questions that reward real knowledge, still fair and unambiguous' },
];

export const QUESTION_COUNTS = [5, 10, 15, 20];
export const TIMERS = [
  { seconds: 10, name: 'Lightning' },
  { seconds: 20, name: 'Normal' },
  { seconds: 30, name: 'Relaxed' },
];

export const MAX_CUSTOM = 30;
const NAME_MAX = 40;
const DESCRIPTION_MAX = 200;

export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS.find((l) => l.id === 'family');
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || null;

const clean = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * A custom category as stored: {id, name, description, emoji}. Returns null for
 * one without a name. `id` is kept when given so an edit replaces in place.
 */
export function cleanCustomCategory(input, makeId) {
  const name = clean(input?.name, NAME_MAX);
  if (!name) return null;
  const emoji = clean(input?.emoji, 8) || '✨';
  return {
    id: typeof input?.id === 'string' && /^c_[a-z0-9]{6,24}$/.test(input.id) ? input.id : makeId(),
    name,
    description: clean(input?.description, DESCRIPTION_MAX),
    emoji,
  };
}

/**
 * Custom categories used to be stored as strings, `"Name: description"` (the
 * picker added a `custom:` prefix in memory). A colon in either half broke the
 * split. Read them as objects: the first ": " separates name and description.
 */
export function fromLegacy(value, makeId) {
  if (value && typeof value === 'object') return cleanCustomCategory(value, makeId);
  const s = String(value ?? '').replace(/^custom:/, '');
  const at = s.indexOf(': ');
  return cleanCustomCategory(at === -1 ? { name: s } : { name: s.slice(0, at), description: s.slice(at + 2) }, makeId);
}

/** A list from storage, legacy strings and all, de-duplicated by name. */
export function normaliseCustomList(list, makeId) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(list) ? list : []) {
    const c = fromLegacy(item, makeId);
    if (!c || seen.has(c.name.toLowerCase())) continue;
    seen.add(c.name.toLowerCase());
    out.push(c);
    if (out.length >= MAX_CUSTOM) break;
  }
  return out;
}

/**
 * What the question writer is given for a game's picks: built-in ids and
 * custom categories resolved to {name, brief}. Unknown ids are dropped; an
 * empty pick is General Knowledge.
 */
export function topicsFor(picks, customList = []) {
  const topics = [];
  for (const pick of Array.isArray(picks) ? picks : []) {
    const builtIn = typeof pick === 'string' ? categoryById(pick) : null;
    if (builtIn) {
      topics.push({ name: builtIn.name, brief: builtIn.brief });
      continue;
    }
    const custom = typeof pick === 'string' ? customList.find((c) => c.id === pick) : cleanCustomCategory(pick, () => 'c_inline00');
    if (custom) topics.push({ name: custom.name, brief: custom.description || '' });
  }
  if (!topics.length) topics.push({ name: CATEGORIES[0].name, brief: CATEGORIES[0].brief });
  return topics.slice(0, 8);
}
