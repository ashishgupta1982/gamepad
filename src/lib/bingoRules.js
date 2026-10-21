// Travel Bingo's rules, as pure functions the browser and the server can share.
//
// `lib/travelBingo.js` imports Node's `crypto`, so nothing in it can reach the
// client. These have no imports at all, which is also what makes them cheap to
// test (bingoRules.test.js).

export const TILES_PER_CARD = 9;
export const MIN_POOL = TILES_PER_CARD;

// A card is a 3×3 grid read row by row, so tile i sits at row i/3, column i%3.
export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

/** Indexes into LINES of every line whose three tiles are found. */
export function completedLines(card) {
  if (!Array.isArray(card) || card.length < TILES_PER_CARD) return [];
  return LINES.map((line, i) => (line.every((t) => card[t]?.found) ? i : -1)).filter((i) => i >= 0);
}

/** Lines complete on `next` that were not on `prev`: what a mark just made. */
export function newLines(prevCard, nextCard) {
  const before = new Set(completedLines(prevCard));
  return completedLines(nextCard).filter((i) => !before.has(i));
}

/** Tile ids that are in at least one complete line, for drawing them lit. */
export function tilesInLines(card) {
  const ids = new Set();
  for (const i of completedLines(card)) {
    for (const t of LINES[i]) ids.add(card[t].tileId);
  }
  return ids;
}

export function foundCount(card) {
  return Array.isArray(card) ? card.filter((t) => t.found).length : 0;
}

/**
 * Finds another car made between two snapshots of the game, oldest first.
 * The poll brings the whole game every few seconds; this is how the page knows
 * to shout "The Smiths spotted a red tractor".
 */
export function rivalFinds(prevGame, nextGame, myCarId) {
  const prevCars = prevGame?.travelBingoConfig?.cars || [];
  const nextCars = nextGame?.travelBingoConfig?.cars || [];
  const finds = [];
  for (const car of nextCars) {
    if (car.carId === myCarId) continue;
    const before = prevCars.find((c) => c.carId === car.carId);
    if (!before) continue;
    const wasFound = new Set((before.card || []).filter((t) => t.found).map((t) => t.tileId));
    for (const tile of car.card || []) {
      if (tile.found && !wasFound.has(tile.tileId)) {
        finds.push({ carId: car.carId, carName: car.name, label: tile.label, at: tile.foundAt });
      }
    }
  }
  return finds.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
}

/** Every car's card as {carId, name, found}, most found first, ties by who finished first. */
export function standings(cars) {
  return (cars || [])
    .map((c) => ({ carId: c.carId, name: c.name, found: foundCount(c.card), completedAt: c.completedAt }))
    .sort((a, b) => b.found - a.found || new Date(a.completedAt || 8.64e15) - new Date(b.completedAt || 8.64e15));
}

/** A uniform shuffle (Fisher–Yates). `random` is injectable so tests are deterministic. */
export function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Cards dealt without the AI: each car gets TILES_PER_CARD different items from
 * the pool, shuffled separately so no two cards match. The fallback when the AI
 * call fails or times out, so a car full of people is never left without cards.
 *
 * @param {string[]} pool   de-duplicated items, at least TILES_PER_CARD of them
 * @param {string[]} carIds
 * @returns {{carId: string, tiles: {label: string, category: string}[]}[]}
 */
export function dealCards(pool, carIds, random = Math.random) {
  const items = [...new Set(pool.map((s) => String(s).trim()).filter(Boolean))];
  if (items.length < TILES_PER_CARD) return [];
  return carIds.map((carId) => ({
    carId,
    tiles: shuffle(items, random)
      .slice(0, TILES_PER_CARD)
      .map((label) => ({ label, category: 'Spot it' })),
  }));
}
