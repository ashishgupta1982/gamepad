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
    }
  }],
  // Additional fields for quiz game
  quizConfig: {
    categories: [String],
    totalQuestions: Number,
    difficulty: String,
    currentQuestionIndex: { type: Number, default: 0 },
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String,
      category: String
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
