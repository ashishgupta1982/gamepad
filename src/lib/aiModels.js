import dbConnect from './mongodb';
import AppConfig from '../models/AppConfig';
import { createModelResolver } from '@aspiro/ai/server';

// Site-wide model per workload on @aspiro/ai's shared resolver — the suite
// pattern, minus an admin surface: GamePad has no admin role or page, so
// there is deliberately no editing UI. Changing a model means editing the
// AppConfig document ({key:'aiModels'}) or these defaults. If GamePad ever
// grows an admin page, wire @aspiro/ai's createAdminModelsHandler to this
// resolver and the card comes almost for free.
const CONFIG_KEY = 'aiModels';

const resolver = createModelResolver({
  defaults: {
    general: 'claude-haiku-4-5-20251001',   // quiz question generation via /api/claude
    travelBingo: 'claude-haiku-4-5-20251001', // board generation
  },
  ttlMs: 60 * 1000,
  loadConfig: async () => {
    await dbConnect();
    const doc = await AppConfig.findOne({ key: CONFIG_KEY }).lean();
    return doc?.value || null;
  },
});

export const getAIModel = resolver.getModel;
export default resolver;
