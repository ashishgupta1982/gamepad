// The games room on the home page: where each game sits in the picture, and
// what its card offers once the camera has moved in.
//
// Positions are percentages of the room picture (public/home/room.webp, 9:16),
// measured off it. If the picture is ever redrawn, these move with it.
//
// The art (Higgsfield, 2026-10-21): the room was Seedream 4.5 (job 03f26a98),
// then Nano Banana Pro edited it (job a4d111fa) to take out the plane, its
// strings and the darts, and to replace the map's made-up lettering. The plane
// and the dart were cut from the first picture and their backgrounds removed
// (jobs f46e61c5, 7ad4a502), so they sit exactly where they were drawn.
//
// Every game is an object in the room: the plane is travel, the dartboard is
// darts, the TV is the quiz (it is the TV mode's screen), the map with the gold
// pyramid is Egypt Explorer, and board games live in the cupboard, which opens
// onto shelves of boxes. A new board game is a new box; a new kind of game is a
// new object. Game names, links and copy come from data/games.js.

export const ROOM = {
  src: '/home/room.webp',
  width: 1080,
  height: 1920,
};

// Hotspots: left, top, width, height, in % of the picture.
export const ROOM_OBJECTS = [
  { id: 'travel-bingo', label: 'Travel Games', box: [23.6, 28.7, 46.9, 17] },
  { id: 'egypt-explorer', label: 'World Explorer', box: [69, 23, 31, 29] },
  { id: 'darts', label: 'Darts', box: [4.6, 54.7, 20.8, 14.3] },
  { id: 'quiz', label: 'Quiz', box: [35, 70.5, 28.5, 17.5] },
  { id: 'cupboard', label: 'Board games', box: [72, 65.8, 26.5, 23.9] },
];

// What lives in the cupboard. A null id is an empty space on the shelf.
export const CUPBOARD_SHELVES = [
  ['scrabble-scorer', null],
  [null, null],
];

// The hanging plane, layered over the room so it can sway on its strings.
export const PLANE = {
  src: '/home/plane.webp',
  box: [23.6, 28.7, 46.9, 17], // where it sits at rest, matching the room picture
  hooks: [
    [40.4, 8.4],
    [52.2, 8.4],
  ], // the two ceiling hooks the strings hang from
  strings: [40.6, 52.2], // where each string meets the plane (% x of the picture)
};

// The dartboard's bull, where the idle darts land.
export const DARTBOARD_BULL = [14.8, 61.9];
export const DART = { src: '/home/dart.webp', width: 4.4 };

// The TV's screen, for its flicker.
export const TV_SCREEN = [39.6, 72.8, 16, 7];
