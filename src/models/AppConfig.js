import mongoose from 'mongoose';

/**
 * Site-wide settings edited at runtime — one document per key. `value` is
 * free-form; each reader validates the shape it expects. Suite-standard
 * shape (matches DoIt, CookBook, MoneyHub et al).
 */
const AppConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.models.AppConfig || mongoose.model('AppConfig', AppConfigSchema);
