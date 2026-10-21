// World Explorer's places. The home screen's "World Explorer" opens the front
// page (/games/world-explorer), which lists these.
//
// A new place is a new entry here, plus its own trip pages (Egypt's are
// /games/egypt-explorer, with components/egypt, lib/egypt and data/egypt).
// While there is only one entry the front page skips itself and opens that
// place directly; the second entry turns the picker on.

export const WORLD_EXPLORER = '/games/world-explorer';

export const PLACES = [
  {
    id: 'egypt',
    name: 'Egypt',
    emoji: '🏺',
    line: 'The Grand Egyptian Museum and the pyramids of Giza',
    href: '/games/egypt-explorer',
  },
];
