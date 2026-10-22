import { scoreAnswer } from '@/lib/quizScoring';

// The quiz, as one set of rules for every mode (REDESIGN-PLAN.md, Phase 3).
//
// A game is a plain object; every move is a pure function from one game to the
// next, given the time. The browser runs it for solo and shout games and saves
// it to the device after every move, so a reload or a dropped signal resumes
// where it was. The server runs the same functions for a multi-phone game, so
// the rules cannot drift between modes the way the old two copies did.
//
//   ready ──► question ──► reveal ──► scores ──► question … ──► finished
//                 │                                  ▲
//                 └─ (no question loaded yet) ─► loading
//
// Modes:
//   solo   one player answers on their own phone, against the clock
//   shout  one screen shows the question, everyone shouts, and at the reveal
//          the quizmaster taps who got it right
//   multi  everyone answers on their own phone; the server keeps the clock

export const MODES = ['solo', 'shout', 'multi'];
export const PHASES = ['ready', 'loading', 'question', 'reveal', 'scores', 'finished'];

// How long the between-question screens stay up before the game moves on.
// The reveal was 4 seconds, too quick to read the explanation (Ash, 2026-10-22).
export const REVEAL_MS = 8000;
export const SCORES_MS = 4500;
// Network grace: an answer that left the phone in time but arrived just after
// the bell still counts.
export const GRACE_MS = 1500;

/**
 * A new game. `players` is [{id, name, avatar, color}]; in shout mode they are
 * the people round the table, in solo the one player, in multi whoever joins.
 */
export function createGame({ mode, settings, players = [], questions = [] }) {
  if (!MODES.includes(mode)) throw new Error(`Unknown quiz mode: ${mode}`);
  return {
    v: 2, // 2: the grouped categories and two bands (2026-10-21); older saves are dropped
    mode,
    settings: { count: 10, timer: 20, level: 'family', picks: [], ...settings },
    questions: questions.slice(0, settings?.count ?? 10),
    index: -1,
    phase: 'ready',
    players: players.map(newPlayer),
    startedAt: null,
    endsAt: null,
    phaseAt: null,
    judged: false,
  };
}

export function newPlayer(p) {
  return { id: p.id, name: p.name, avatar: p.avatar || '🙂', color: p.color || '#6366f1', score: 0, streak: 0, best: 0, answers: {} };
}

/** A player joining a multi game before it starts. Same id twice is a rejoin, not a second player. */
export function addPlayer(game, p) {
  if (game.players.some((x) => x.id === p.id)) return game;
  if (game.phase !== 'ready') return game;
  return { ...game, players: [...game.players, newPlayer(p)] };
}

/** More questions from the writer, as they arrive. Never beyond the game's count, never a repeat. */
export function addQuestions(game, qs, now) {
  const have = new Set(game.questions.map((q) => q.id));
  const fresh = (qs || []).filter((q) => q && !have.has(q.id));
  const questions = [...game.questions, ...fresh].slice(0, game.settings.count);
  const next = { ...game, questions };
  // A game waiting on the writer starts the next question the moment it lands.
  return next.phase === 'loading' && questions[next.index + 1] ? openQuestion(next, next.index + 1, now) : next;
}

function openQuestion(game, index, now) {
  return { ...game, index, phase: 'question', startedAt: now, endsAt: now + game.settings.timer * 1000, phaseAt: now, judged: false };
}

export function start(game, now) {
  if (game.phase !== 'ready') return game;
  if (!game.players.length) return game;
  return game.questions[0] ? openQuestion(game, 0, now) : { ...game, phase: 'loading', phaseAt: now };
}

export const currentQuestion = (game) => game.questions[game.index] || null;

export function hasAnswered(game, playerId) {
  const p = game.players.find((x) => x.id === playerId);
  return !!p && p.answers[game.index] !== undefined;
}

/** Everyone who can answer on a device has. Shout games are answered aloud, so never. */
export function allAnswered(game) {
  if (game.mode === 'shout') return false;
  return game.players.length > 0 && game.players.every((p) => p.answers[game.index] !== undefined);
}

/**
 * A player picks an option. Only while the question is open (with a little
 * grace for the network), only once, and only for a real player. The time is
 * measured from when the question opened, by whoever runs the game: the
 * server for multi, so a phone cannot claim it was quicker than it was.
 */
export function answer(game, playerId, option, now) {
  if (game.mode === 'shout') return game;
  if (game.phase !== 'question') return game;
  if (now > game.endsAt + GRACE_MS) return game;
  if (!Number.isInteger(option) || option < 0 || option > 3) return game;
  const i = game.players.findIndex((p) => p.id === playerId);
  if (i === -1 || game.players[i].answers[game.index] !== undefined) return game;
  const ms = Math.max(0, Math.min(now - game.startedAt, game.settings.timer * 1000));
  const players = [...game.players];
  players[i] = { ...players[i], answers: { ...players[i].answers, [game.index]: { option, ms } } };
  return { ...game, players };
}

/**
 * Show the answer. Device answers are scored here, all at once, so the order
 * answers arrived in cannot matter. A shout game is scored when the quizmaster
 * judges (below).
 */
export function reveal(game, now) {
  if (game.phase !== 'question') return game;
  const q = currentQuestion(game);
  const limit = game.settings.timer * 1000;
  const players = game.players.map((p) => {
    if (game.mode === 'shout') return p;
    const a = p.answers[game.index];
    const correct = !!a && q && a.option === q.correctAnswer;
    const { points, streak } = scoreAnswer(correct, a ? a.ms : limit, limit, p.streak);
    return {
      ...p,
      score: p.score + points,
      streak,
      best: Math.max(p.best, streak),
      answers: { ...p.answers, [game.index]: a ? { ...a, correct, points } : { option: null, ms: limit, correct: false, points: 0 } },
    };
  });
  return { ...game, players, phase: 'reveal', phaseAt: now };
}

/**
 * Shout mode: the quizmaster taps who got it right. Answered aloud, so there is
 * no speed to weigh: a right answer is the full points with its streak.
 */
export function judge(game, correctIds, now) {
  if (game.mode !== 'shout' || game.phase !== 'reveal' || game.judged) return game;
  const right = new Set(correctIds || []);
  const players = game.players.map((p) => {
    const correct = right.has(p.id);
    const { points, streak } = scoreAnswer(correct, 0, 1, p.streak);
    return {
      ...p,
      score: p.score + points,
      streak,
      best: Math.max(p.best, streak),
      answers: { ...p.answers, [game.index]: { option: null, ms: 0, correct, points } },
    };
  });
  return { ...game, players, judged: true, phase: 'scores', phaseAt: now };
}

export function toScores(game, now) {
  if (game.phase !== 'reveal') return game;
  if (game.mode === 'shout' && !game.judged) return game;
  return { ...game, phase: 'scores', phaseAt: now };
}

/** On to the next question, or the end. Waits in 'loading' if the writer is behind. */
export function next(game, now) {
  if (game.phase !== 'scores' && !(game.phase === 'reveal' && game.mode === 'solo')) return game;
  const n = game.index + 1;
  if (n >= game.settings.count) return finish(game, now);
  if (game.questions[n]) return openQuestion(game, n, now);
  return { ...game, phase: 'loading', phaseAt: now };
}

export function finish(game, now) {
  if (game.phase === 'finished') return game;
  return { ...game, phase: 'finished', phaseAt: now, endsAt: null };
}

/**
 * What the clock says should happen now, if anything: the move the runner (the
 * device, or the server on any request) should make. Solo skips the scores
 * screen; shout waits at the reveal for the quizmaster.
 */
export function due(game, now) {
  switch (game.phase) {
    case 'question':
      return allAnswered(game) || now >= game.endsAt ? 'reveal' : null;
    case 'reveal':
      if (game.mode === 'shout') return null;
      if (now < game.phaseAt + REVEAL_MS) return null;
      return game.mode === 'solo' ? 'next' : 'scores';
    case 'scores':
      return now >= game.phaseAt + SCORES_MS ? 'next' : null;
    default:
      return null;
  }
}

/** Apply whatever the clock says is due, repeatedly, so a long gap catches up in one go. */
export function tick(game, now) {
  let g = game;
  for (let i = 0; i < 4 * (game.settings.count + 1); i++) {
    const move = due(g, now);
    if (!move) return g;
    // Each step is dated when it fell due, not now, so the screens that follow
    // keep their proper length after a phone wakes up from a long sleep.
    const at =
      move === 'reveal'
        ? allAnswered(g) ? now : g.endsAt
        : g.phaseAt + (g.phase === 'reveal' ? REVEAL_MS : SCORES_MS);
    const when = Math.min(now, at);
    if (move === 'reveal') g = reveal(g, when);
    else if (move === 'scores') g = toScores(g, when);
    else g = next(g, when);
  }
  return g;
}

/** Players best first, sharing a place on a tie. */
export function standings(game) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score || b.best - a.best || a.name.localeCompare(b.name));
  let place = 0;
  let last = null;
  return sorted.map((p, i) => {
    if (p.score !== last) {
      place = i + 1;
      last = p.score;
    }
    const correct = Object.values(p.answers).filter((a) => a.correct).length;
    return { ...p, place, correct };
  });
}
