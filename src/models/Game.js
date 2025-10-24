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
    enum: ['scrabble-scorer']
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
