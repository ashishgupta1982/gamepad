import { nameKey } from './seen.js';

// The numbers on Your quizzes (Ash, 2026-10-22): for each player across the
// account's finished quizzes, questions answered and how many right, games
// played and won, and their best and worst category; and a leaderboard by
// wins or by share right. Players are matched by name, as for No repeats.

// Below these, a share right says too little to rank on or to call a category best.
export const MIN_FOR_RANKING = 20;
export const MIN_FOR_CATEGORY = 5;

/**
 * Each player's right and asked by category, from a finished game and the
 * questions it was played with, in order: { [playerId]: { [category]: [right, asked] } }.
 * A live game's own copy only holds the question on screen, so the host
 * passes the questions it sent.
 */
export function categoryTally(game, questions = game.questions) {
  const out = {};
  for (const p of game.players) {
    const t = {};
    questions.forEach((q, i) => {
      if (!q || i > game.index) return;
      const cat = q.category || 'Quiz';
      t[cat] ||= [0, 0];
      t[cat][1] += 1;
      if (p.answers?.[i]?.correct) t[cat][0] += 1;
    });
    out[p.id] = t;
  }
  return out;
}

const pct = (right, asked) => (asked ? Math.round((right / asked) * 100) : 0);

/**
 * Everyone's numbers from the saved games (GET /api/quiz/history), most
 * games first. A game saved before categories were tallied still counts by
 * category when it was all one category.
 */
export function playerStats(games) {
  const by = new Map();
  for (const g of games) {
    const together = g.players.length > 1;
    for (const p of g.players) {
      const key = nameKey(p.name);
      if (!key) continue;
      if (!by.has(key)) by.set(key, { key, name: p.name, avatar: p.avatar, color: p.color, games: 0, together: 0, wins: 0, asked: 0, right: 0, cats: {} });
      const s = by.get(key);
      s.games += 1;
      s.asked += Number(g.count) || 0;
      s.right += Number(p.correct) || 0;
      if (together) {
        s.together += 1;
        if (p.place === 1) s.wins += 1;
      }
      const cats = p.cats && Object.keys(p.cats).length ? p.cats : g.categories?.length === 1 && g.count ? { [g.categories[0]]: [Number(p.correct) || 0, Number(g.count)] } : {};
      for (const [cat, [r, a]] of Object.entries(cats)) {
        s.cats[cat] ||= [0, 0];
        s.cats[cat][0] += Number(r) || 0;
        s.cats[cat][1] += Number(a) || 0;
      }
    }
  }
  return [...by.values()]
    .map((s) => {
      const ranked = Object.entries(s.cats)
        .filter(([, [, a]]) => a >= MIN_FOR_CATEGORY)
        .map(([name, [r, a]]) => ({ name, right: r, asked: a, pct: pct(r, a) }))
        .sort((a, b) => b.pct - a.pct || b.asked - a.asked);
      return {
        ...s,
        pct: pct(s.right, s.asked),
        best: ranked[0] || null,
        worst: ranked.length > 1 ? ranked[ranked.length - 1] : null,
      };
    })
    .sort((a, b) => b.games - a.games || a.name.localeCompare(b.name));
}

/**
 * The leaderboard, by `wins` (games won when playing with others) or `pct`
 * (share right, for players with at least MIN_FOR_RANKING questions). Ties
 * share a place.
 */
export function leaderboard(stats, by = 'wins') {
  const rows =
    by === 'pct'
      ? stats.filter((s) => s.asked >= MIN_FOR_RANKING).sort((a, b) => b.pct - a.pct || b.asked - a.asked)
      : stats.filter((s) => s.together > 0).sort((a, b) => b.wins - a.wins || a.together - b.together);
  const value = (s) => (by === 'pct' ? s.pct : s.wins);
  let place = 0;
  return rows.map((s, i) => {
    if (i === 0 || value(s) !== value(rows[i - 1])) place = i + 1;
    return { ...s, place };
  });
}
