import mongoose from 'mongoose';

// Durable AI budget counters for @aspiro/ai's createMongoCounter: one document
// per (user, bucket, window), keyed by a composite string _id so one atomic
// upsert both creates and counts. The in-memory limiter in utils/rateLimiter
// resets on every cold start and multiplies by instance count, so it is a burst
// shield; this is the cap that actually bounds the Claude bill.
const RateLimitSchema = new mongoose.Schema({
  _id: { type: String },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
