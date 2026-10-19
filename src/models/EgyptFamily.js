import mongoose from 'mongoose';

// Egypt Explorer's family: everyone who plays, one list per account, shared by
// every trip and every phone signed in to it. The shape is lib/egypt/progress.js
// `newFamily`; `updatedAt` is that object's ISO string, so the newest list wins.
const EgyptFamilySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  players: [{ _id: false, id: String, name: String }],
  updatedAt: String,
});

export default mongoose.models.EgyptFamily || mongoose.model('EgyptFamily', EgyptFamilySchema);
