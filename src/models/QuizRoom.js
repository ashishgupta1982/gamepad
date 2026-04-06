import mongoose from 'mongoose';

const QuizRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    uppercase: true,
    minlength: 6,
    maxlength: 6
  },
  hostUserId: String,
  hostSessionId: String,
  status: {
    type: String,
    enum: ['lobby', 'playing', 'question', 'reveal', 'scores', 'finished'],
    default: 'lobby'
  },
  settings: {
    categories: [String],
    difficulty: { type: String, default: 'medium' },
    questionCount: { type: Number, default: 10 },
    timePerQuestion: { type: Number, default: 20 }
  },
  players: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: String,
    avatarColor: String,
    score: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    answers: [{
      questionIndex: Number,
      selectedOption: Number,
      timeMs: Number,
      correct: Boolean,
      points: Number
    }],
    connected: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now }
  }],
  questions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    category: String,
    explanation: String
  }],
  currentQuestionIndex: { type: Number, default: -1 },
  questionStartedAt: Date,
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  stateVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expires: 0 }
  }
});

QuizRoomSchema.pre('save', function(next) {
  this.stateVersion = (this.stateVersion || 0) + 1;
  next();
});

export default mongoose.models.QuizRoom || mongoose.model('QuizRoom', QuizRoomSchema);
