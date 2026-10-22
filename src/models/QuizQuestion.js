import mongoose from 'mongoose';

// The quiz's question bank (2026-10-21). Games are served from here, and the
// question writer only tops it up when a category runs short for a band, so a
// game starts at once and a good question is asked again rather than lost.
//
// One document per question, keyed by `fingerprint` (lib/quiz/questions.js),
// so the same question written twice is stored once. `correctAnswer` indexes
// `options` as stored; a game gets them shuffled.
//
//   band       'kids' (8 to 13) or 'adults'
//   family     fair for a mixed family game: a Kids question an adult still
//              enjoys, or a Grown-ups question a 10-year-old has a chance at.
//              Family mix games are drawn from these, in either band.
//   difficulty 1 easy, 2 medium, 3 hard, within the band
//   dated      the answer can change over time; kept out of games a year
//              after it was written
//   media      a picture ({kind:'image', src, alt, credit}) or an emoji clue
//              ({kind:'emoji', text}) shown with the question
//   stats      what play tells us; `up`, `down` and `wrong` come from the
//              thumbs after each question
//   status     'active' is served; 'review' and 'retired' are not
const QuizQuestionSchema = new mongoose.Schema(
  {
    fingerprint: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '' },
    category: { type: String, required: true },
    band: { type: String, enum: ['kids', 'adults'], required: true },
    family: { type: Boolean, default: false },
    difficulty: { type: Number, min: 1, max: 3, default: 2 },
    dated: { type: Boolean, default: false },
    media: {
      kind: { type: String, enum: ['image', 'emoji'] },
      src: String,
      alt: String,
      credit: String,
      reveal: String, // the whole picture, when `src` is a close-up of it
      text: String,
    },
    source: { type: String, enum: ['seed', 'writer'], default: 'writer' },
    model: String,
    stats: {
      served: { type: Number, default: 0 },
      answered: { type: Number, default: 0 },
      correct: { type: Number, default: 0 },
      up: { type: Number, default: 0 },
      down: { type: Number, default: 0 },
      wrong: { type: Number, default: 0 },
    },
    status: { type: String, enum: ['active', 'review', 'retired'], default: 'active' },
  },
  { timestamps: true },
);

// How a game is drawn: active questions of a category, by band or family.
QuizQuestionSchema.index({ status: 1, category: 1, band: 1 });
QuizQuestionSchema.index({ status: 1, category: 1, family: 1 });

export default mongoose.models.QuizQuestion || mongoose.model('QuizQuestion', QuizQuestionSchema);
