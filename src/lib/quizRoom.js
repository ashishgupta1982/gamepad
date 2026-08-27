// The multi-device quiz room state machine, made explicit.
//
// The statuses were already enumerated on the model, but the transitions were
// not written down anywhere — each route set `room.status` to whatever it needed
// and the legal sequence lived only in the order the UI happened to call things.
// That is the piece with the most moving parts in the app and the one thing the
// SSE stream depends on, so it is worth stating.
//
// The flow:
//
//   lobby ──► question ──► reveal ──► scores ──► question   (next question)
//                                        └────► finished    (last question)
//
// `playing` is on the model's enum and is a legacy value the current flow never
// sets — the host goes straight from lobby to question. It is kept as a legal
// source so an old room still in that state can move on rather than being stuck.

export const ROOM_STATUSES = [
  'lobby',
  'playing',
  'question',
  'reveal',
  'scores',
  'finished',
];

const TRANSITIONS = {
  lobby: ['question', 'playing', 'finished'],
  playing: ['question', 'finished'],
  question: ['reveal', 'finished'],
  reveal: ['scores', 'finished'],
  scores: ['question', 'finished'],
  finished: [],
};

export function isRoomStatus(status) {
  return ROOM_STATUSES.includes(status);
}

/** Whether `to` is reachable from `from`. */
export function canTransition(from, to) {
  if (!isRoomStatus(from) || !isRoomStatus(to)) return false;
  return TRANSITIONS[from].includes(to);
}

/**
 * Where a room goes next in normal play.
 *
 * Returns null from `finished`, which is terminal — a quiz that has ended has
 * nowhere to go, and the host starts a new room rather than reopening this one.
 */
export function nextStatus(room) {
  const { status, currentQuestionIndex = -1, questions = [] } = room || {};
  const lastIndex = questions.length - 1;

  switch (status) {
    case 'lobby':
    case 'playing':
      return questions.length ? 'question' : null;
    case 'question':
      return 'reveal';
    case 'reveal':
      return 'scores';
    case 'scores':
      return currentQuestionIndex >= lastIndex ? 'finished' : 'question';
    default:
      return null;
  }
}

/** Has every player answered the question currently on screen? */
export function allAnswered(room) {
  const { players = [], currentQuestionIndex = -1 } = room || {};
  if (!players.length || currentQuestionIndex < 0) return false;
  return players.every((p) =>
    (p.answers || []).some((a) => a.questionIndex === currentQuestionIndex),
  );
}

/**
 * Whether a player may answer right now.
 *
 * Mirrors the guards in the answer route, in the order the route applies them,
 * so the two cannot disagree about what is allowed.
 */
export function canAnswer(room, playerId) {
  if (!room || room.status !== 'question') return false;
  const player = (room.players || []).find((p) => p.id === playerId);
  if (!player) return false;
  return !(player.answers || []).some((a) => a.questionIndex === room.currentQuestionIndex);
}
