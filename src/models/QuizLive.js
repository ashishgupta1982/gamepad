import mongoose from 'mongoose';

// A multi-phone quiz in progress (REDESIGN-PLAN.md, Phase 3). The game itself
// is the plain object lib/quiz/machine.js works on, stored whole; the server is
// the only thing that changes it, through lib/quiz/live.js.
//
// Replaces QuizRoom, whose routes wrote status, players and questions straight
// from the request, took answer times from the phone, and lost answers that
// arrived together. Old rooms expire on their own.
const QuizLiveSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  // Secrets, not identities: the host's and each player's pass, so a phone
  // that drops out can come back as itself, and only the host can run the show.
  hostToken: { type: String, required: true },
  tokens: { type: mongoose.Schema.Types.Mixed, default: {} },
  hostUserId: String,
  // The signed-in host's account, whose players' memory of seen questions the
  // game is added to when it finishes (lib/quiz/live.js#change).
  hostEmail: String,
  game: { type: mongoose.Schema.Types.Mixed, required: true },
  // Bumped on every change: the poll's cursor, and the guard that stops two
  // changes landing at once from overwriting each other.
  version: { type: Number, default: 1 },
  recorded: { type: Boolean, default: false },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 12 * 60 * 60 * 1000), index: { expires: 0 } },
}, { minimize: false });

export default mongoose.models.QuizLive || mongoose.model('QuizLive', QuizLiveSchema);
