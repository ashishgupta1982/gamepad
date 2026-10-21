import { BULL, isDouble, value } from './board';

// The four darts games as one pure set of rules (REDESIGN-PLAN.md, Phase 4).
//
// A match is its setup plus a log of what was thrown, in order:
//   { n, m }   one dart (see lib/darts/board.js)
//   { t }      an X01 visit typed in as a total, for players who add up in
//              their heads rather than tap each dart
// Everything else (scores, whose turn, legs, the winner, the stats) is worked
// out by replaying the log. So undo is taking the last throw off the log,
// which works the same after a bust, across legs and after the winning dart,
// and a saved game is just the match: nothing derived is ever stored, so
// nothing derived can be saved wrong.
//
// Mode ids are the ones saved games already carry ('around-the-clock' among
// them).

export const MODE_IDS = ['x01', 'cricket', 'around-the-clock', 'killer'];
export const CRICKET = [20, 19, 18, 17, 16, 15, BULL];
export const CLOCK = [...Array.from({ length: 20 }, (_, i) => i + 1), BULL];
export const X01_DEFAULTS = { start: 501, legs: 1, doubleOut: true, doubleIn: false };
export const KILLER_DEFAULTS = { lives: 3 };

/** Distinct numbers 1-20, one per Killer player. */
export function killerNumbers(count) {
  const pool = Array.from({ length: 20 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function newMatch({ mode, players, settings = {} }) {
  let s = {};
  if (mode === 'x01') s = { ...X01_DEFAULTS, ...settings };
  if (mode === 'killer') {
    s = { ...KILLER_DEFAULTS, ...settings };
    if (!Array.isArray(s.numbers) || s.numbers.length < players.length) s.numbers = killerNumbers(players.length);
  }
  return {
    v: 2,
    id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    mode,
    players,
    settings: s,
    log: [],
    createdAt: Date.now(),
  };
}

// ── Moves ──
// Each returns a new match, or the same one when the move is not allowed.

export function throwDart(match, dart) {
  if (replay(match).finished) return match;
  return { ...match, log: [...match.log, { n: dart.n || 0, m: dart.n ? dart.m : 0 }] };
}

/** An X01 visit as one total. Only at the start of a visit. */
export function enterTotal(match, total) {
  const s = replay(match);
  if (match.mode !== 'x01' || s.finished || s.turn.darts.length) return match;
  const t = Math.max(0, Math.min(180, Math.round(total)));
  return { ...match, log: [...match.log, { t }] };
}

/** Finish the visit now: the darts not thrown (or that missed) are misses. */
export function endTurn(match) {
  const s = replay(match);
  if (s.finished) return match;
  const left = 3 - s.turn.darts.length;
  return { ...match, log: [...match.log, ...Array.from({ length: left }, () => ({ n: 0, m: 0 }))] };
}

export function undo(match) {
  return match.log.length ? { ...match, log: match.log.slice(0, -1) } : match;
}

// ── Replay ──

export function replay(match) {
  const rules = RULES[match.mode];
  const n = match.players.length;
  const s = {
    mode: match.mode,
    settings: match.settings,
    n,
    current: 0,
    first: 0,
    round: 1,
    alive: match.players.map(() => true),
    visits: [],
    finished: false,
    winner: null,
    events: [],
    stats: match.players.map(() => ({ darts: 0, points: 0, best: 0, tons: 0, max: 0, checkouts: 0, bestCheckout: 0, hits: 0, kills: 0 })),
  };
  rules.init(s);
  s.turn = startTurn(s, 0, rules);
  for (const entry of match.log) {
    if (s.finished) break;
    s.events = [];
    step(s, entry, rules);
  }
  s.standings = rules.standings(s, match.players);
  return s;
}

function startTurn(s, player, rules) {
  return { player, darts: [], scored: 0, marks: 0, bust: false, checkout: false, over: false, ...(rules.turnStart?.(s, player) || {}) };
}

function step(s, entry, rules) {
  const p = s.current;
  const isTotal = entry.t != null;
  s.turn.darts.push(entry);
  s.stats[p].darts += isTotal ? 3 : 1;
  rules.throw(s, entry, p);
  if (!(s.turn.over || s.finished || isTotal || s.turn.darts.length >= 3)) return;

  // The visit is over.
  const t = s.turn;
  s.visits.push({ player: p, round: s.round, leg: s.leg || 1, darts: t.darts, total: t.scored, marks: t.marks, bust: t.bust, checkout: t.checkout });
  rules.closeVisit?.(s, p);
  s.events.push({ type: 'visit', player: p, total: t.scored, bust: t.bust });
  if (s.finished) return;
  if (s.newLeg) {
    s.newLeg = false;
    rules.newLeg(s);
    s.turn = startTurn(s, s.current, rules);
    return;
  }
  advance(s, rules);
}

function advance(s, rules) {
  const { n } = s;
  let next = s.current;
  for (let i = 0; i < n; i++) {
    next = (next + 1) % n;
    if (s.alive[next]) break;
  }
  const rel = (i) => (i - s.first + n) % n;
  if (rel(next) <= rel(s.current)) s.round += 1;
  s.current = next;
  s.turn = startTurn(s, next, rules);
}

/** Places, with ties sharing one: 1, 2, 2, 4. `same(a, b)` says two tie. */
function placed(order, same) {
  return order.map((i, k) => {
    let place = k + 1;
    for (let j = k - 1; j >= 0 && same(order[j], i); j--) place = j + 1;
    return { index: i, place };
  });
}

const win = (s, p) => {
  s.finished = true;
  s.winner = p;
  s.events.push({ type: 'match', player: p });
};

// ── The games ──

const x01 = {
  init(s) {
    const { start, doubleIn } = s.settings;
    s.remaining = Array(s.n).fill(start);
    s.isIn = Array(s.n).fill(!doubleIn);
    s.legsWon = Array(s.n).fill(0);
    s.leg = 1;
  },
  turnStart: (s, p) => ({ before: s.remaining[p], wasIn: s.isIn[p] }),
  throw(s, e, p) {
    const { doubleOut } = s.settings;
    const bust = () => {
      s.remaining[p] = s.turn.before;
      s.isIn[p] = s.turn.wasIn;
      s.turn.scored = 0;
      s.turn.bust = true;
      s.turn.over = true;
      s.events.push({ type: 'bust', player: p });
    };
    const checkout = (add) => {
      s.turn.scored += add;
      s.remaining[p] = 0;
      s.turn.checkout = true;
      s.turn.over = true;
      s.legsWon[p] += 1;
      s.stats[p].checkouts += 1;
      s.stats[p].bestCheckout = Math.max(s.stats[p].bestCheckout, s.turn.before);
      s.events.push({ type: 'checkout', player: p, score: s.turn.before });
      if (s.legsWon[p] >= Math.ceil((s.settings.legs || 1) / 2)) win(s, p);
      else {
        s.newLeg = true;
        s.events.push({ type: 'leg', player: p });
      }
    };

    if (e.t != null) {
      // A typed total is trusted as what counted, double-in and out included.
      if (e.t > 0) s.isIn[p] = true;
      const left = s.remaining[p] - e.t;
      if (left < 0 || (doubleOut && left === 1)) return bust();
      if (left === 0) return checkout(e.t);
      s.remaining[p] = left;
      s.turn.scored = e.t;
      return undefined;
    }

    let v = value(e);
    if (!s.isIn[p]) {
      if (isDouble(e)) {
        s.isIn[p] = true;
        s.events.push({ type: 'in', player: p });
      } else v = 0;
    }
    const left = s.remaining[p] - v;
    if (left < 0 || (doubleOut && left === 1) || (left === 0 && doubleOut && !isDouble(e))) return bust();
    if (left === 0) return checkout(v);
    s.remaining[p] = left;
    s.turn.scored += v;
    return undefined;
  },
  closeVisit(s, p) {
    const st = s.stats[p];
    const t = s.turn.scored;
    st.points += t;
    st.best = Math.max(st.best, t);
    if (t >= 100) st.tons += 1;
    if (t === 180) st.max += 1;
  },
  newLeg(s) {
    const { start, doubleIn } = s.settings;
    s.leg += 1;
    // The throw goes round: whoever started the last leg throws second.
    s.first = (s.first + 1) % s.n;
    s.current = s.first;
    s.round = 1;
    s.remaining = Array(s.n).fill(start);
    s.isIn = Array(s.n).fill(!doubleIn);
  },
  standings(s, players) {
    const order = players.map((_, i) => i).sort((a, b) => {
      if (a === s.winner) return -1;
      if (b === s.winner) return 1;
      return s.legsWon[b] - s.legsWon[a] || s.remaining[a] - s.remaining[b];
    });
    return placed(order, (a, b) => a !== s.winner && b !== s.winner && s.legsWon[a] === s.legsWon[b] && s.remaining[a] === s.remaining[b]);
  },
};

const cricket = {
  init(s) {
    s.marks = Array.from({ length: s.n }, () => CRICKET.map(() => 0));
    s.points = Array(s.n).fill(0);
  },
  throw(s, e, p) {
    const t = CRICKET.indexOf(e.n);
    if (t < 0 || !e.m) return;
    const hits = e.m;
    const before = s.marks[p][t];
    const applied = Math.min(hits, 3 - before);
    s.marks[p][t] = before + applied;
    s.turn.marks += hits;
    s.stats[p].hits += hits;
    if (before < 3 && s.marks[p][t] === 3) s.events.push({ type: 'closed', player: p, target: e.n });
    const extra = hits - applied;
    const othersClosed = s.marks.every((row, i) => i === p || row[t] >= 3);
    if (extra > 0 && !othersClosed) {
      const pts = e.n * extra;
      s.points[p] += pts;
      s.turn.scored += pts;
      s.stats[p].points += pts;
    }
    const allClosed = s.marks[p].every((m) => m >= 3);
    if (allClosed && s.points.every((pts, i) => i === p || s.points[p] >= pts)) win(s, p);
  },
  standings(s, players) {
    const closed = (i) => s.marks[i].filter((m) => m >= 3).length;
    const order = players.map((_, i) => i).sort((a, b) => {
      if (a === s.winner) return -1;
      if (b === s.winner) return 1;
      return s.points[b] - s.points[a] || closed(b) - closed(a);
    });
    return placed(order, (a, b) => a !== s.winner && b !== s.winner && s.points[a] === s.points[b] && closed(a) === closed(b));
  },
};

const clock = {
  init(s) {
    // How many of the 21 targets each player has hit; CLOCK[target] is next.
    s.target = Array(s.n).fill(0);
  },
  throw(s, e, p) {
    if (!e.m || e.n !== CLOCK[s.target[p]]) return;
    s.target[p] += 1;
    s.turn.scored += 1;
    s.stats[p].hits += 1;
    s.events.push({ type: 'advance', player: p });
    if (s.target[p] >= CLOCK.length) win(s, p);
  },
  standings(s, players) {
    const order = players.map((_, i) => i).sort((a, b) => {
      if (a === s.winner) return -1;
      if (b === s.winner) return 1;
      return s.target[b] - s.target[a];
    });
    return placed(order, (a, b) => a !== s.winner && b !== s.winner && s.target[a] === s.target[b]);
  },
};

const killer = {
  init(s) {
    s.numbers = s.settings.numbers.slice(0, s.n);
    s.lives = Array(s.n).fill(s.settings.lives || 3);
    s.killer = Array(s.n).fill(false);
    s.outOrder = [];
  },
  throw(s, e, p) {
    // Only doubles count, and the bull is nobody's.
    if (!isDouble(e) || e.n === BULL) return;
    if (e.n === s.numbers[p]) {
      if (!s.killer[p]) {
        s.killer[p] = true;
        s.turn.scored += 1;
        s.events.push({ type: 'killer', player: p });
      }
      return;
    }
    if (!s.killer[p]) return;
    const q = s.numbers.indexOf(e.n);
    if (q < 0 || !s.alive[q]) return;
    s.lives[q] -= 1;
    s.stats[p].kills += 1;
    s.turn.scored += 1;
    s.events.push({ type: 'life', player: p, target: q });
    if (s.lives[q] <= 0) {
      s.alive[q] = false;
      s.outOrder.push(q);
      s.events.push({ type: 'out', player: q, by: p });
      if (s.alive.filter(Boolean).length === 1) win(s, p);
    }
  },
  standings(s, players) {
    const outRank = (i) => s.outOrder.indexOf(i);
    const order = players.map((_, i) => i).sort((a, b) => {
      if (a === s.winner) return -1;
      if (b === s.winner) return 1;
      if (s.alive[a] !== s.alive[b]) return s.alive[a] ? -1 : 1;
      if (s.alive[a]) return s.lives[b] - s.lives[a];
      return outRank(b) - outRank(a);
    });
    return placed(order, (a, b) => a !== s.winner && b !== s.winner && s.alive[a] && s.alive[b] && s.lives[a] === s.lives[b]);
  },
};

const RULES = { x01, cricket, 'around-the-clock': clock, killer };

// ── For the screens ──

/** A match a saved game can hold: the new shape, with a mode we know. */
export const isMatch = (m) => !!m && m.v === 2 && MODE_IDS.includes(m.mode) && Array.isArray(m.players) && Array.isArray(m.log);

/** One line for a "Carry on" button. */
export function summary(match) {
  const s = replay(match);
  const names = match.players.map((p) => p.name).join(', ');
  if (s.finished) return `${match.players[s.winner]?.name} won · ${names}`;
  if (match.mode === 'x01') return `${match.settings.start} · ${names} · round ${s.round}`;
  return `${names} · round ${s.round}`;
}
