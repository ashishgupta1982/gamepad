// Server-only: the multi-phone quiz's store. Every change goes through
// `change`, which reads the game, applies a move from lib/quiz/machine.js and
// writes it back only if nobody else changed it meanwhile, retrying if they
// did. Two answers arriving together therefore both count, which the old
// read-then-save could not promise.
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import QuizLive from '@/models/QuizLive';
import { tick } from './machine';
import { playedIds } from './seen';
import { remember } from './seenStore';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const newToken = () => crypto.randomBytes(18).toString('base64url');

export function newCode() {
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  return out;
}

export async function findLive(code) {
  await dbConnect();
  return QuizLive.findOne({ code: String(code || '').toUpperCase() }).lean();
}

/**
 * Apply `fn(doc, now)` to a live game. `fn` returns `{game, tokens?}` to write,
 * or null to leave it. Always applies the clock first, so a game moves on even
 * when the host's phone has gone quiet. Returns the latest doc.
 */
export async function change(code, fn) {
  await dbConnect();
  for (let attempt = 0; attempt < 6; attempt++) {
    const doc = await QuizLive.findOne({ code: String(code || '').toUpperCase() }).lean();
    if (!doc) return null;
    const now = Date.now();
    const ticked = tick(doc.game, now);
    const out = fn ? fn({ ...doc, game: ticked }, now) : null;
    const game = out?.game || ticked;
    if (game === doc.game && !out?.tokens) return doc;
    const set = { game, version: doc.version + 1 };
    if (out?.tokens) set.tokens = out.tokens;
    const res = await QuizLive.updateOne({ _id: doc._id, version: doc.version }, { $set: set });
    if (res.modifiedCount === 1) {
      if (game.phase === 'finished' && doc.game.phase !== 'finished') await rememberGame(doc.hostEmail, game);
      return { ...doc, ...set };
    }
  }
  throw new Error('The quiz is busy. Try again.');
}

/**
 * A game that has just finished, or been ended, goes into each player's memory
 * on the host's account, so nobody gets those questions again. Done here, once,
 * on the write that finished it (the version guard makes that one write), and
 * not on the host's phone: a reload there loses its list of the questions sent,
 * and with it the record (Ash, 2026-10-23). A guest host keeps no guests'
 * memory, but signed-in players still keep their own.
 */
async function rememberGame(email, game) {
  const ids = playedIds(game);
  if (!ids.length) return;
  await remember(email, game.players.map((p) => p.name), ids).catch((err) => console.error('[quiz-live] could not remember the questions:', err.message));
}

/**
 * What a phone, the host or the TV may see. While a question is open the
 * answer stays on the server, and so does what anyone else picked; only the
 * question on screen is sent, never the ones to come.
 */
export function project(doc, { playerId = null } = {}) {
  const g = doc.game;
  const open = g.phase === 'question' || g.phase === 'ready' || g.phase === 'loading';
  const q = g.questions[g.index];
  // A close-up's whole picture would give it away, so it waits for the reveal too.
  const hide = (m) => (m?.reveal ? { ...m, reveal: undefined } : m);
  const shown = q ? (open ? { ...q, correctAnswer: null, explanation: '', media: hide(q.media) } : q) : null;
  const questions = Array.from({ length: Math.max(0, g.index + 1) }, (_, i) => (i === g.index ? shown : null));
  const players = g.players.map((p) => {
    if (!open || p.id === playerId) return p;
    const a = p.answers[g.index];
    return { ...p, answers: { ...p.answers, [g.index]: a ? { answered: true } : undefined } };
  });
  return { ...g, questions, players, questionsReady: g.questions.length };
}
