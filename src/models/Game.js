import mongoose from 'mongoose';

const GameSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['scrabble-scorer', 'quiz']
  },
  players: [{
    name: {
      type: String,
      required: true
    },
    scores: {
      type: [Number],
      default: []
    },
    roundScores: {
      type: [Number],
      default: []
    }
  }],
  // Additional fields for quiz game
  quizConfig: {
    categories: [String],
    totalQuestions: Number,
    difficulty: String,
    currentQuestionIndex: { type: Number, default: 0 },
    currentRound: { type: Number, default: 1 },
    mode: { type: String, enum: ['same-device', 'multi-device'], default: 'same-device' },
    timePerQuestion: { type: Number, default: 20 },
    scoringType: { type: String, enum: ['speed', 'classic'], default: 'speed' },
    rounds: [{
      roundNumber: Number,
      categories: [String],
      questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
        category: String
      }]
    }],
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String,
      category: String
    }],
    playerStats: [{
      name: String,
      totalScore: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      bestStreak: { type: Number, default: 0 },
      pointsPerQuestion: [Number]
    }]
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
GameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Game || mongoose.model('Game', GameSchema);
