// Scrabble's scoring as one pure set of rules (REDESIGN-PLAN.md, Phase 5).
//
// A match is who is playing plus a log of turns, in the order they were taken:
//   { p, score, word?, bingo?, pass? }
// Turns go round the table in seat order, starting from `first`, so whose go
// it is, the totals, the rounds, the standings and the awards are all worked
// out by replaying the log. Undo is taking the last turn off the log, and a
// saved game is just the match: nothing derived is stored, so nothing derived
// can be saved wrong. (The old scorer let you edit any turn, and its inputs,
// keyed by position, could write the value onto the wrong one. Undo is the
// only way to change a turn now, on purpose.)

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const MAX_SCORE = 999;
/** Using all seven tiles in one turn. */
export const BINGO = 50;
/** A turn worth a fanfare. */
export const BIG_TURN = 50;

const WORD = /^[A-Z]{1,15}$/;

export function newMatch({ players, first = 0 }) {
  return {
    v: 1,
    id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    players,
    first: Number.isInteger(first) && first >= 0 && first < players.length ? first : 0,
    log: [],
    finished: false,
    createdAt: Date.now(),
  };
}

export const isMatch = (m) =>
  !!m && m.v === 1 && Array.isArray(m.players) && m.players.length >= MIN_PLAYERS && m.players.length <= MAX_PLAYERS && Array.isArray(m.log);

/** A turn's score is a whole number from 0 to 999. */
export const validScore = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_SCORE;

/** A word as it is kept: letters only, upper case, or nothing. */
export function cleanWord(word) {
  const w = String(word || '').toUpperCase().replace(/[^A-Z]/g, '');
  return WORD.test(w) ? w : '';
}

const whoseGo = (match) => (match.first + match.log.length) % match.players.length;

// ── Moves ──
// Each returns a new match, or the same one when the move is not allowed.

/** Score the current player's turn. A bingo's score includes the 50. */
export function addTurn(match, { score, word, bingo = false }) {
  if (match.finished || !validScore(score) || (bingo && score < BINGO)) return match;
  const entry = { p: whoseGo(match), score };
  const w = cleanWord(word);
  if (w) entry.word = w;
  if (bingo) entry.bingo = true;
  return { ...match, log: [...match.log, entry] };
}

/** Pass (or swap tiles): a turn worth nothing. */
export function pass(match) {
  if (match.finished) return match;
  return { ...match, log: [...match.log, { p: whoseGo(match), score: 0, pass: true }] };
}

export function undo(match) {
  if (match.finished || !match.log.length) return match;
  return { ...match, log: match.log.slice(0, -1) };
}

export const finish = (match) => (match.finished ? match : { ...match, finished: true });

/** "End game" pressed by mistake: back to the game. */
export const reopen = (match) => (match.finished ? { ...match, finished: false } : match);

// ── Replay ──

export function replay(match) {
  const n = match.players.length;
  const totals = Array(n).fill(0);
  const turns = match.players.map(() => []);
  const bingos = Array(n).fill(0);
  let bestTurn = null;
  let bestWord = null;

  match.log.forEach((t, i) => {
    // The seat is worked out, not trusted from the entry, so a hand-edited
    // or damaged log still goes round the table in order.
    const p = (match.first + i) % n;
    const round = Math.floor(i / n) + 1;
    const turn = { ...t, p, round, at: i };
    totals[p] += t.score;
    turns[p].push(turn);
    if (t.bingo) bingos[p] += 1;
    // The first to reach a score keeps the record.
    if (t.score > 0 && (!bestTurn || t.score > bestTurn.score)) bestTurn = turn;
    if (t.word && (!bestWord || t.score > bestWord.score)) bestWord = turn;
  });

  const standings = placed(totals);
  const top = Math.max(...totals);
  const atTop = totals.filter((x) => x === top).length;
  const stats = turns.map((list, p) => {
    const played = list.filter((t) => !t.pass);
    return {
      turns: list.length,
      passes: list.length - played.length,
      average: list.length ? Math.round(totals[p] / list.length) : 0,
      best: Math.max(0, ...list.map((t) => t.score)),
    };
  });

  const s = {
    n,
    totals,
    turns,
    bingos,
    stats,
    current: whoseGo(match),
    round: Math.floor(match.log.length / n) + 1,
    standings,
    // The one player ahead of everyone, or null while it is level.
    leader: top > 0 && atTop === 1 ? totals.indexOf(top) : null,
    top,
    bestTurn,
    bestWord,
    last: match.log.length ? { ...match.log[match.log.length - 1], p: (match.first + match.log.length - 1) % n } : null,
    finished: !!match.finished,
  };
  s.awards = awards(s);
  return s;
}

/** Best-first, ties sharing a place: two on 40 are both 1st, the next is 3rd. */
function placed(totals) {
  const order = totals.map((_, i) => i).sort((a, b) => totals[b] - totals[a] || a - b);
  let place = 0;
  return order.map((index, k) => {
    if (k === 0 || totals[index] !== totals[order[k - 1]]) place = k + 1;
    return { index, place, total: totals[index] };
  });
}

/**
 * What the end screen hands out. Each award names its players (more than one
 * on a tie) and says why. Nothing is awarded for a game nobody scored in.
 */
function awards(s) {
  const out = [];
  if (s.bestWord) {
    out.push({ id: 'word', emoji: '📖', title: 'Best word', players: [s.bestWord.p], text: `${s.bestWord.word} for ${s.bestWord.score}` });
  }
  if (s.bestTurn) {
    out.push({ id: 'turn', emoji: '🚀', title: 'Biggest turn', players: [s.bestTurn.p], text: `${s.bestTurn.score} in round ${s.bestTurn.round}${s.bestTurn.word ? ` (${s.bestTurn.word})` : ''}` });
  }
  const most = Math.max(...s.bingos);
  if (most > 0) {
    const who = s.bingos.map((b, i) => (b === most ? i : -1)).filter((i) => i >= 0);
    out.push({ id: 'bingo', emoji: '🎰', title: 'Most bingos', players: who, text: most === 1 ? 'All seven tiles in one go' : `All seven tiles, ${most} times` });
  }
  // The wooden spoon needs three or more, and someone actually behind.
  if (s.n >= 3 && s.top > 0) {
    const last = s.standings[s.standings.length - 1].place;
    if (last > 1) {
      const who = s.standings.filter((r) => r.place === last).map((r) => r.index);
      out.push({ id: 'spoon', emoji: '🥄', title: 'Wooden spoon', players: who, text: 'There is always next time' });
    }
  }
  return out;
}

/** One line for the "Carry on" button. */
export function summary(match) {
  const s = replay(match);
  const lead = s.leader != null ? `${match.players[s.leader].name} leads ${s.top}` : s.top > 0 ? `level on ${s.top}` : 'not started';
  return `Round ${s.round} · ${lead}`;
}
