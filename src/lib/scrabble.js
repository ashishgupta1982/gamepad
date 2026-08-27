// Scoring helpers for Scrabble Scorer.
//
// Pulled out of the page because three different screens computed totals and
// standings inline, each with its own copy of the reduce.

export function totalFor(player) {
  return (player?.scores || []).reduce((sum, s) => sum + s, 0);
}

/**
 * Players ordered best-first, each tagged with its total and its position.
 *
 * Ties share a position — two players on 40 are both 1st, and the next is 3rd.
 * The previous version used the array index after sorting, so tied players were
 * silently ranked 1st and 2nd with nothing to distinguish them.
 */
export function standings(players = []) {
  const rows = players.map((player, index) => ({
    index,
    player,
    total: totalFor(player),
  }));

  rows.sort((a, b) => b.total - a.total);

  let lastTotal = null;
  let lastPosition = 0;
  rows.forEach((row, i) => {
    if (row.total !== lastTotal) {
      lastPosition = i + 1;
      lastTotal = row.total;
    }
    row.position = lastPosition;
  });

  return rows;
}

export function positionOf(players, playerIndex) {
  return standings(players).find((r) => r.index === playerIndex)?.position ?? 1;
}

// Best and worst single turn across the whole game, used to badge the history.
// Zero-scoring turns are excluded: passing is not "the worst word you played".
export function turnExtremes(players = []) {
  const all = players.flatMap((p) => p.scores || []).filter((s) => s > 0);
  if (!all.length) return { best: 0, worst: 0 };
  return { best: Math.max(...all), worst: Math.min(...all) };
}

// How many turns the leader has had. Used to suggest whose go it is next —
// whoever has played fewest turns, breaking ties by seating order.
export function nextPlayerIndex(players = []) {
  if (!players.length) return 0;
  let best = 0;
  let fewest = Infinity;
  players.forEach((p, i) => {
    const turns = (p.scores || []).length;
    if (turns < fewest) {
      fewest = turns;
      best = i;
    }
  });
  return best;
}

// A score worth remarking on. Returns null for an ordinary turn so the caller
// can skip the notification entirely.
export function celebrate(name, score) {
  if (score >= 50) return `Amazing! ${name} scored ${score}.`;
  if (score >= 30) return `Great score — ${name} got ${score}.`;
  return null;
}
