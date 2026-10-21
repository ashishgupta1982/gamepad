// What a quiz can be about, and who it is for. Pure data and checks, shared by
// the browser and the server (REDESIGN-PLAN.md, Phase 3).

// The built-in categories, in groups (Ash, 2026-10-21: 35 of them plus Mixed
// bag, too many for one flat grid). `brief` is what the question writer is
// told; the name alone is too vague for a good quiz. A whole group can be
// picked as one pick, `group:<id>`.
export const MIXED = { id: 'mixed', name: 'Mixed bag', emoji: '🎲', brief: 'a broad mix of general knowledge: everyday facts, people, places and things everyone has a chance at' };

export const GROUPS = [
  {
    id: 'screen',
    name: 'Screen & Music',
    emoji: '🎬',
    categories: [
      { id: 'films', name: 'Films', emoji: '🍿', brief: 'famous films, family films, characters, actors, quotes and film music' },
      { id: 'tv', name: 'TV', emoji: '📺', brief: 'TV shows, presenters, game shows and characters, British TV first' },
      { id: 'cartoons', name: 'Cartoons & Kids’ TV', emoji: '🧽', brief: 'cartoons and children’s TV, old and new: characters, catchphrases and theme tunes' },
      { id: 'music', name: 'Music', emoji: '🎵', brief: 'songs, singers, bands, instruments and musicals' },
      { id: 'video-games', name: 'Video Games', emoji: '🎮', brief: 'video games and their characters: Mario, Minecraft, Sonic, FIFA, Fortnite and the classics' },
    ],
  },
  {
    id: 'big-worlds',
    name: 'Big Worlds',
    emoji: '🦸',
    categories: [
      { id: 'disney-pixar', name: 'Disney & Pixar', emoji: '🏰', brief: 'Disney and Pixar films: characters, songs, places and stories' },
      { id: 'harry-potter', name: 'Harry Potter', emoji: '🧙', brief: 'the Harry Potter books and films: characters, spells, creatures, places and Hogwarts' },
      { id: 'marvel', name: 'Marvel & Superheroes', emoji: '🦸', brief: 'Marvel and DC superheroes and villains: powers, secret identities, films and comics' },
      { id: 'pokemon', name: 'Pokémon', emoji: '⚡', brief: 'Pokémon: the creatures, their types and evolutions, the games and the show' },
      { id: 'star-wars', name: 'Star Wars', emoji: '🌌', brief: 'Star Wars films and shows: characters, planets, ships and the Force' },
    ],
  },
  {
    id: 'world',
    name: 'The World',
    emoji: '🌍',
    categories: [
      { id: 'geography', name: 'Geography', emoji: '🗺️', brief: 'countries, continents, rivers, mountains, oceans and cities' },
      { id: 'flags-capitals', name: 'Flags & Capitals', emoji: '🚩', brief: 'capital cities and national flags around the world' },
      { id: 'landmarks', name: 'Famous Landmarks', emoji: '🗼', brief: 'famous buildings, monuments and wonders of the world, and where they are' },
      { id: 'around-uk', name: 'Around the UK', emoji: '🇬🇧', brief: 'places, landmarks, counties, cities, traditions and record-breakers across the UK' },
    ],
  },
  {
    id: 'science',
    name: 'Science & Nature',
    emoji: '🔬',
    categories: [
      { id: 'animals', name: 'Animals', emoji: '🦁', brief: 'animals of every kind: what they eat, where they live, babies, records and odd facts' },
      { id: 'dinosaurs', name: 'Dinosaurs', emoji: '🦖', brief: 'dinosaurs and prehistoric life: names, sizes, diets, fossils and when they lived' },
      { id: 'space', name: 'Space', emoji: '🚀', brief: 'the planets, the Moon, the Sun, stars, astronauts and space missions' },
      { id: 'human-body', name: 'Human Body', emoji: '🫀', brief: 'bones, organs, senses, blood, teeth and how the body works' },
      { id: 'science-inventions', name: 'Science & Inventions', emoji: '💡', brief: 'everyday science, chemistry, physics and who invented what' },
      { id: 'planet-earth', name: 'Planet Earth', emoji: '🌋', brief: 'weather, volcanoes, earthquakes, oceans, rocks, plants and the natural world' },
    ],
  },
  {
    id: 'history',
    name: 'History & Myths',
    emoji: '🏛️',
    categories: [
      { id: 'ancient-world', name: 'Ancient World', emoji: '🏺', brief: 'ancient Egypt, Greece and Rome, the Vikings and the Stone Age' },
      { id: 'kings-queens', name: 'Kings & Queens', emoji: '👑', brief: 'British kings and queens, royal families and famous rulers around the world' },
      { id: 'modern-history', name: 'Modern History', emoji: '📜', brief: 'the last two hundred years: famous events, people, wars, firsts and discoveries' },
      { id: 'myths-legends', name: 'Myths & Legends', emoji: '🐉', brief: 'Greek, Roman, Norse and Egyptian myths, gods and monsters, and legends like King Arthur and Robin Hood' },
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    categories: [
      { id: 'football', name: 'Football', emoji: '⚽', brief: 'football: clubs, players, the Premier League, the World Cup and the rules' },
      { id: 'olympics', name: 'Olympics', emoji: '🥇', brief: 'the Olympic and Paralympic Games: events, records, host cities and great champions' },
      { id: 'sport-mix', name: 'Sport Mix', emoji: '🎾', brief: 'tennis, cricket, rugby, Formula 1, golf, athletics and other sports' },
    ],
  },
  {
    id: 'books',
    name: 'Books, Words & Puzzles',
    emoji: '📚',
    categories: [
      { id: 'books-stories', name: 'Books & Stories', emoji: '📖', brief: 'books, authors, fairy tales and famous characters: Roald Dahl, Narnia, classics and children’s favourites' },
      { id: 'words-spelling', name: 'Words & Spelling', emoji: '🔤', brief: 'spelling, meanings, opposites, idioms, odd words and where words come from' },
      { id: 'maths-puzzles', name: 'Maths & Puzzles', emoji: '🧩', brief: 'mental maths, number sequences, shapes and riddles, each with one clear answer and nothing that relies on a trick of wording' },
      { id: 'art-artists', name: 'Art & Artists', emoji: '🎨', brief: 'famous paintings, artists, sculptures, colours and art styles' },
    ],
  },
  {
    id: 'everyday',
    name: 'Everyday',
    emoji: '🍕',
    categories: [
      { id: 'food-drink', name: 'Food & Drink', emoji: '🍕', brief: 'dishes, ingredients, sweets, where foods come from, famous brands and drinks' },
      { id: 'toys-games', name: 'Toys & Games', emoji: '🧸', brief: 'toys, board games, card games, playground games and their history' },
      { id: 'celebrities', name: 'Celebrities', emoji: '🌟', brief: 'famous people today: pop stars, YouTubers, presenters, sports stars and actors' },
      { id: 'holidays', name: 'Christmas & Holidays', emoji: '🎄', brief: 'Christmas, Easter, Halloween, Bonfire Night, Diwali, Eid and holidays around the world' },
    ],
  },
];

// Every built-in category, with its group.
export const CATEGORIES = [MIXED, ...GROUPS.flatMap((g) => g.categories.map((c) => ({ ...c, group: g.id })))];

// Who the quiz is for (Ash, 2026-10-21: two bands, with Family mix drawn from
// both). One level per game; everyone in a game gets the same questions.
export const LEVELS = [
  { id: 'kids', name: 'Kids', ages: '8 to 13', emoji: '🎒', brief: 'children aged 8 to 13: school level, fun facts, nothing obscure' },
  { id: 'family', name: 'Family mix', ages: 'everyone', emoji: '👨‍👩‍👧', brief: 'a mixed family of children aged 8 to 13 and adults: questions a 10-year-old has a fair chance at but that still interest adults' },
  { id: 'adults', name: 'Grown-ups', ages: 'teens and adults', emoji: '🍷', brief: 'teenagers and adults: pub-quiz standard, a mix of easier and harder questions' },
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

// A whole group picked as one.
export const GROUP_PREFIX = 'group:';
export const groupById = (id) => GROUPS.find((g) => g.id === id) || null;
export const groupOfPick = (pick) => (typeof pick === 'string' && pick.startsWith(GROUP_PREFIX) ? groupById(pick.slice(GROUP_PREFIX.length)) : null);

/** What a pick is called on screen: a category, a whole group, or one of your own. */
export function pickName(pick) {
  if (typeof pick !== 'string') return pick?.name || '';
  return groupOfPick(pick)?.name || categoryById(pick)?.name || pick;
}

// How many picks a game can have; a whole group counts as one.
export const MAX_TOPICS = 8;

// The picks: Mixed bag on its own, category ids, whole groups (`group:<id>`)
// and custom categories (objects).
export const keyOf = (p) => (typeof p === 'string' ? p : p.id);
export const hasPick = (list, key) => list.some((p) => keyOf(p) === key);
const ownerOf = (id) => GROUPS.find((g) => g.categories.some((c) => c.id === id)) || null;
const inGroup = (group) => (p) => group.categories.some((c) => c.id === keyOf(p));

/**
 * The picks after tapping one. Mixed bag stands alone; a whole group replaces
 * its categories; tapping one category of a picked group keeps the rest; and
 * picking every category of a group one by one becomes the whole group.
 * Returns the same list when the tap would go over the limit.
 */
export function togglePick(list, p) {
  const key = keyOf(p);
  if (key === MIXED.id) return [MIXED.id];
  const rest = list.filter((x) => keyOf(x) !== MIXED.id);
  const orMixed = (l) => (l.length ? l : [MIXED.id]);

  const group = groupOfPick(key);
  if (group) {
    if (hasPick(rest, key)) return orMixed(rest.filter((x) => keyOf(x) !== key));
    const without = rest.filter((x) => !inGroup(group)(x));
    return without.length >= MAX_TOPICS ? list : [...without, key];
  }

  const owner = typeof p === 'string' ? ownerOf(key) : null;
  const groupKey = owner && GROUP_PREFIX + owner.id;
  if (owner && hasPick(rest, groupKey)) {
    const others = owner.categories.filter((c) => c.id !== key).map((c) => c.id);
    return [...rest.filter((x) => keyOf(x) !== groupKey), ...others].slice(0, MAX_TOPICS);
  }
  if (hasPick(rest, key)) return orMixed(rest.filter((x) => keyOf(x) !== key));
  if (rest.length >= MAX_TOPICS) return list;
  const next = [...rest, p];
  if (owner && owner.categories.every((c) => hasPick(next, c.id))) return [...next.filter((x) => !inGroup(owner)(x)), groupKey];
  return next;
}

/** Three categories from three different groups. `random` is injectable for tests. */
export function surprisePicks(random = Math.random) {
  const groups = [...GROUPS].sort(() => random() - 0.5).slice(0, 3);
  return groups.map((g) => g.categories[Math.floor(random() * g.categories.length)].id);
}

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
 * What the question writer is given for a game's picks: built-in ids, whole
 * groups and custom categories resolved to {name, brief}. Unknown ids are
 * dropped; an empty pick is the Mixed bag.
 */
export function topicsFor(picks, customList = []) {
  const topics = [];
  for (const pick of Array.isArray(picks) ? picks : []) {
    const group = groupOfPick(pick);
    if (group) {
      topics.push({ name: group.name, brief: `a mix of ${group.categories.map((c) => c.name).join(', ')}` });
      continue;
    }
    const builtIn = typeof pick === 'string' ? categoryById(pick) : null;
    if (builtIn) {
      topics.push({ name: builtIn.name, brief: builtIn.brief });
      continue;
    }
    const custom = typeof pick === 'string' ? customList.find((c) => c.id === pick) : cleanCustomCategory(pick, () => 'c_inline00');
    if (custom) topics.push({ name: custom.name, brief: custom.description || '' });
  }
  if (!topics.length) topics.push({ name: MIXED.name, brief: MIXED.brief });
  return topics.slice(0, 8);
}
