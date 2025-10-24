import mongoose from 'mongoose';

// Generic cached response schema for Claude API responses
const CachedResponseSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
  },
  response: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  }
});

// TTL index for automatic cleanup
CachedResponseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CachedResponse = mongoose.models.CachedResponse || mongoose.model('CachedResponse', CachedResponseSchema);

export default CachedResponse;