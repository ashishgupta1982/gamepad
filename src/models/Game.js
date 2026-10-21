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
    enum: ['scrabble-scorer', 'quiz', 'darts', 'travel-bingo', 'egypt-explorer']
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
    // 'solo' | 'shout' | 'multi' since the 2026-10-21 rebuild; the two older
    // values are kept so old history still loads.
    mode: { type: String, enum: ['same-device', 'multi-device', 'solo', 'shout', 'multi'], default: 'same-device' },
    // A finished quiz's final standings (api/quiz/history):
    // [{name, avatar, color, score, correct, best, place}].
    result: mongoose.Schema.Types.Mixed,
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
  // Additional fields for darts game
  dartsConfig: {
    gameMode: String,
    // The rebuilt scorer (Phase 4) saves the whole match here: its setup and
    // the log of every dart, which replays to every score (lib/darts/rules.js).
    // The fields below are the old scorer's, kept so its saved games still load.
    match: mongoose.Schema.Types.Mixed,
    startingScore: Number,
    doubleOut: { type: Boolean, default: true },
    doubleIn: { type: Boolean, default: false },
    currentPlayerIndex: { type: Number, default: 0 },
    currentRound: { type: Number, default: 1 },
    legs: { type: Number, default: 1 },
    currentLeg: { type: Number, default: 1 },
    legsWon: [Number],
    turns: [{
      playerIndex: Number,
      round: Number,
      leg: Number,
      darts: [Number],
      total: Number,
      bust: Boolean,
      checkout: Boolean
    }],
    remainingScores: [Number],
    cricketMarks: [[Number]],
    cricketPoints: [Number],
    clockTargets: [Number],
    killerNumbers: [Number],
    killerLives: [Number],
    killerActive: [Boolean]
  },
  // Additional fields for travel-bingo game
  travelBingoConfig: {
    joinCode: { type: String, index: true },
    hostUserId: String,
    phase: {
      type: String,
      enum: ['submission', 'generating', 'playing', 'completed'],
      default: 'submission'
    },
    // When the phase went to 'generating'. A generation the platform killed
    // leaves the phase there; this is how the route knows it is stale.
    generatingSince: Date,
    cars: [{
      carId: String,
      name: String,
      userId: String,
      joinedAt: { type: Date, default: Date.now },
      submittedItems: { type: [String], default: [] },
      card: [{
        tileId: String,
        label: String,
        category: String,
        found: { type: Boolean, default: false },
        foundAt: Date,
        caption: String,
        comments: [{
          commentId: String,
          carId: String,
          carName: String,
          text: String,
          createdAt: { type: Date, default: Date.now }
        }]
      }],
      completedAt: Date
    }],
    categories: { type: [String], default: [] },
    winnerCarId: String
  },
  // Egypt Explorer: one document per family per trip. `progress` is the whole
  // client state (lib/egypt/progress.js), stored as it is: its shape is owned and
  // checked there, and points are derived from it rather than stored.
  egyptConfig: {
    trip: String,
    progress: mongoose.Schema.Types.Mixed,
    // Bumped on every save, so two phones saving at once cannot overwrite
    // each other (api/egypt/progress.js).
    rev: Number,
    // The record as it was before everyone played for themselves (version 1).
    v1Backup: mongoose.Schema.Types.Mixed
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
