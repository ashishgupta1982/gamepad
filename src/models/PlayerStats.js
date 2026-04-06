import mongoose from 'mongoose';

const PlayerStatsSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  playerName: { type: String, required: true },
  householdId: { type: String, index: true },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 },
  categoryStats: [{
    category: String,
    played: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 }
  }],
  recentGames: [{
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
    date: { type: Date, default: Date.now },
    score: Number,
    rank: Number,
    playerCount: Number,
    categories: [String]
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PlayerStatsSchema.index({ householdId: 1, playerName: 1 });
PlayerStatsSchema.index({ totalScore: -1 });

PlayerStatsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.PlayerStats || mongoose.model('PlayerStats', PlayerStatsSchema);
