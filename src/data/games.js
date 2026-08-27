import { SpellCheck, Brain, Target, Car } from 'lucide-react';

// The four games, in one place.
//
// The launcher used to hold this inline as emoji plus a Tailwind gradient
// string, with a handleGameClick that was a four-branch if/else mapping each id
// to the route named after it. Both are here now, so adding a fifth game is one
// entry rather than an edit in three places.
//
// `tone` is a per-game token from globals.css, not a gradient. Gradients were
// doing the work of identity while carrying none of it: five of them, all
// unrelated to the brand, chosen to look lively rather than to tell one game
// apart from another at a glance.
//
// The meta lines are checked against the code, not invented: Scrabble's setup
// offers 1-4 players, Darts ships four modes in dartsConstants, Quiz has 16
// categories in quizConstants and runs same-device or multi-device by room code.
export const GAMES = [
  {
    id: 'scrabble-scorer',
    name: 'Scrabble Scorer',
    href: '/games/scrabble-scorer',
    icon: SpellCheck,
    tone: 'scrabble',
    description:
      'Running totals, per-round scores and end-of-game awards. You bring the board.',
    meta: ['1-4 players', 'No sign-in needed'],
  },
  {
    id: 'quiz',
    name: 'Quiz',
    href: '/games/quiz',
    icon: Brain,
    tone: 'quiz',
    description:
      'Play on one phone, or everyone joins on their own with a room code.',
    meta: ['16 categories', 'Same device or multi'],
  },
  {
    id: 'darts',
    name: 'Darts Scorer',
    href: '/games/darts',
    icon: Target,
    tone: 'darts',
    description:
      'X01, Cricket, Around the Clock and Killer — with checkout suggestions from 170.',
    meta: ['4 modes', 'Checkout helper'],
  },
  {
    id: 'travel-bingo',
    name: 'Travel Bingo',
    href: '/games/travel-bingo',
    icon: Car,
    tone: 'bingo',
    description:
      'Every car gets its own card. Share a join code and race to fill it on the road.',
    meta: ['2+ cars', 'Join by code'],
  },
];

// Written out rather than interpolated — Tailwind only generates classes it can
// literally see, so `bg-game-${tone}` would emit nothing and render unstyled.
export const GAME_TONES = {
  scrabble: { bg: 'bg-game-scrabble', text: 'text-game-scrabble', soft: 'bg-game-scrabble/10' },
  quiz: { bg: 'bg-game-quiz', text: 'text-game-quiz', soft: 'bg-game-quiz/10' },
  darts: { bg: 'bg-game-darts', text: 'text-game-darts', soft: 'bg-game-darts/10' },
  bingo: { bg: 'bg-game-bingo', text: 'text-game-bingo', soft: 'bg-game-bingo/10' },
};

// gameType on a Game document -> the entry above. Used to label saved games.
export const GAME_BY_TYPE = Object.fromEntries(GAMES.map((g) => [g.id, g]));
