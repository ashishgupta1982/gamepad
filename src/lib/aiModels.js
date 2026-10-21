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
    general: 'claude-haiku-4-5-20251001',   // /api/claude: Scrabble's word check, until Phase 5 replaces it
    // Quiz questions (api/quiz/questions). The balanced tier, not the fast one:
    // a wrong answer spoils a quiz, and the fast model gets more facts wrong.
    quiz: 'balanced',
    travelBingo: 'claude-haiku-4-5-20251001', // board generation
    // Egypt Explorer's guide and photo quests. A tier name rather than an id, so
    // it follows the suite's balanced model on each @aspiro/ai release. Not the
    // fast tier: these calls read photos of museum objects, and naming the right
    // statue is the whole job.
    egyptGuide: 'balanced',
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
