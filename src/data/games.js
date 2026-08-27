// The four games, in one place.
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
export const GAMES = [
  {
    id: 'scrabble-scorer',
    name: 'Scrabble Scorer',
    href: '/games/scrabble-scorer',
    emoji: '🎲',
    tone: 'scrabble',
    description: 'Running totals, round scores and end-of-game awards.',
  },
  {
    id: 'quiz',
    name: 'Quiz',
    href: '/games/quiz',
    emoji: '🧠',
    tone: 'quiz',
    description: 'One phone, or everyone joins with a room code.',
  },
  {
    id: 'darts',
    name: 'Darts Scorer',
    href: '/games/darts',
    emoji: '🎯',
    tone: 'darts',
    description: 'X01, Cricket, Around the Clock and Killer.',
  },
  {
    id: 'travel-bingo',
    name: 'Travel Bingo',
    href: '/games/travel-bingo',
    emoji: '🚗',
    tone: 'bingo',
    description: 'Every car gets a card. Spot it before they do.',
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
  },
  quiz: {
    gradient: 'bg-gradient-to-br from-game-quiz to-game-quiz-deep',
    soft: 'bg-game-quiz/10',
    text: 'text-game-quiz',
  },
  darts: {
    gradient: 'bg-gradient-to-br from-game-darts to-game-darts-deep',
    soft: 'bg-game-darts/10',
    text: 'text-game-darts',
  },
  bingo: {
    gradient: 'bg-gradient-to-br from-game-bingo to-game-bingo-deep',
    soft: 'bg-game-bingo/10',
    text: 'text-game-bingo',
  },
};

// gameType on a Game document -> the entry above. Used to label saved games.
export const GAME_BY_TYPE = Object.fromEntries(GAMES.map((g) => [g.id, g]));
