import mongoose from 'mongoose';
import { authFields } from '@aspiro/auth/model';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  // Not required. GamePad registers with `requireName: false`, so the package
  // falls back to the address local-part when no name is given — a required
  // field here would reject that write and break sign-up from the inside.
  // Players type their own display names per game regardless.
  name: {
    type: String,
  },

  // Password hash, email-verification and password-reset state. Owned by
  // @aspiro/auth — spread rather than hand-copied, so every app in the suite
  // stays on one shape.
  ...authFields,

  role: {
    type: String,
    default: 'user'
  },
  // The quiz name, unique across GamePad (lib/quiz/memory.js#claimHandle), and
  // its matching key (lower case, spaces squashed).
  quizName: String,
  quizNameKey: { type: String, index: true },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  // The quiz's custom categories, {id, name, description, emoji} each
  // (lib/quiz/catalogue.js). Older accounts hold "Name: description" strings;
  // they are read through normaliseCustomList and rewritten as objects on the
  // next save, so both shapes are allowed here.
  customQuizCategories: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
