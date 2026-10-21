// The five games, in one place.
//
// ─── On emoji ──────────────────────────────────────────────────────────────
//
// These are DELIBERATELY emoji, not icons from the lucide set the rest of the
// app uses. A brief detour replaced them with flat monochrome glyphs and the
// launcher immediately stopped looking like a games app — a family game
// launcher wants the colour and the depth, and the platform emoji are the
// cheapest way to get artwork that already looks three-dimensional.
//
// The general rule still stands everywhere else: emoji are not UI affordances.
// Back arrows, the settings gear and the close button stay lucide, because those
// have to read as controls and must scale, recolour and carry an aria-label.
// These four are illustration, which is a different job.
//
// The meta pills ("1-4 players", "16 categories") that used to sit under each
// description are gone. They were clutter on a four-item launcher: nobody
// chooses between Darts and Travel Bingo on player count, and the detail is one
// tap away inside each game anyway.
//
// The descriptions are the ones that shipped in production, which read better
// than the terse rewrite that replaced them — with one correction: Travel
// Bingo's said "Spot it, SNAP it, win!", and the photo feature it referred to
// was deleted in 60ad439. Prod has been advertising a feature it does not have.
export const GAMES = [
  {
    id: 'scrabble-scorer',
    name: 'Scrabble Scorer',
    href: '/games/scrabble-scorer',
    emoji: '🎲',
    tone: 'scrabble',
    description: 'Track scores for up to 4 players, with fun awards and achievements!',
  },
  {
    id: 'quiz',
    name: 'Quiz',
    href: '/games/quiz',
    emoji: '🧠',
    tone: 'quiz',
    description: 'A family quiz show with fresh questions every game: just you, shout it out, or everyone on their phones.',
  },
  {
    id: 'darts',
    name: 'Darts Scorer',
    href: '/games/darts',
    emoji: '🎯',
    tone: 'darts',
    description: 'Tap the board and it does the maths: X01, Cricket, Around the Clock and Killer.',
  },
  {
    id: 'travel-bingo',
    name: 'Travel Bingo',
    href: '/games/travel-bingo',
    emoji: '🚗',
    tone: 'bingo',
    description: 'Road-trip bingo for the whole convoy. Spot it, tick it, win!',
  },
  {
    id: 'egypt-explorer',
    name: 'Egypt Explorer',
    href: '/games/egypt-explorer',
    emoji: '🏺',
    tone: 'egypt',
    description: 'Explore the Grand Egyptian Museum and the pyramids of Giza: stories, photo quests, quizzes and a guide you can ask anything!',
  },
];

// Written out rather than interpolated — Tailwind only generates classes it can
// literally see, so `from-game-${tone}` would emit nothing and the tile would
// render with no background at all.
export const GAME_TONES = {
  scrabble: {
    gradient: 'bg-gradient-to-br from-game-scrabble to-game-scrabble-deep',
    soft: 'bg-game-scrabble/10',
    text: 'text-game-scrabble',
    playHover: 'group-hover:bg-white group-hover:text-game-scrabble',
  },
  quiz: {
    gradient: 'bg-gradient-to-br from-game-quiz to-game-quiz-deep',
    soft: 'bg-game-quiz/10',
    text: 'text-game-quiz',
    playHover: 'group-hover:bg-white group-hover:text-game-quiz',
  },
  darts: {
    gradient: 'bg-gradient-to-br from-game-darts to-game-darts-deep',
    soft: 'bg-game-darts/10',
    text: 'text-game-darts',
    playHover: 'group-hover:bg-white group-hover:text-game-darts',
  },
  bingo: {
    gradient: 'bg-gradient-to-br from-game-bingo to-game-bingo-deep',
    soft: 'bg-game-bingo/10',
    text: 'text-game-bingo',
    playHover: 'group-hover:bg-white group-hover:text-game-bingo',
  },
  egypt: {
    gradient: 'bg-gradient-to-br from-game-egypt to-game-egypt-deep',
    soft: 'bg-game-egypt/10',
    text: 'text-game-egypt',
    playHover: 'group-hover:bg-white group-hover:text-game-egypt',
  },
};

// gameType on a Game document -> the entry above. Used to label saved games.
export const GAME_BY_TYPE = Object.fromEntries(GAMES.map((g) => [g.id, g]));
