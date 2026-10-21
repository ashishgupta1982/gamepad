import mongoose from 'mongoose';

// Which quiz questions each player on an account has seen (Ash, 2026-10-21):
// one document per account and player name. A game leaves out what anyone
// playing in it has seen, so Dad gets no repeats, while Mum playing on her own
// can still get the questions Dad had. Guests have no memory at all.
//
//   nameKey  the name as matched: trimmed, spaces squashed, lower case
//            (lib/quiz/seen.js#nameKey), so "Dad" and " dad " are one person
//   seen     question keys (QuizQuestion.fingerprint), newest last, capped
const QuizSeenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    nameKey: { type: String, required: true },
    name: { type: String, required: true },
    seen: { type: [String], default: [] },
  },
  { timestamps: true },
);

QuizSeenSchema.index({ email: 1, nameKey: 1 }, { unique: true });

export default mongoose.models.QuizSeen || mongoose.model('QuizSeen', QuizSeenSchema);
