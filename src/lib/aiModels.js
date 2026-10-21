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
    // Quiz questions (api/quiz/questions): topping up the question bank and a
    // player's own categories. Sonnet 5.5, pinned rather than the balanced tier
    // (still Sonnet 5 in @aspiro/ai 0.7.0), at the same price. Not the fast
    // tier: a wrong answer spoils a quiz. It thinks by default, which
    // lib/quiz/writer.js allows for.
    quiz: 'claude-sonnet-5-5',
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
