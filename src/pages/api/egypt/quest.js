import { callClaude, textOf, extractJson, rateLimitResponse } from '@aspiro/ai/server';
import { getAIModel } from '@/lib/aiModels';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP, RATE_LIMITS } from '@/utils/rateLimiter';
import { checkEgyptBudget, requesterId, questSystem, imageBlock } from '@/lib/egypt/ai';
import { getTrip, getStop } from '@/data/egypt';

// A photo quest: did they find it? Claude looks at the photo against the
// stop's `quest.target` and returns a verdict plus a few words to the family.
//
// The verdict is advice, not a lock. The client lets a parent count a find the
// AI did not accept (lib/egypt/progress.js recordQuest, `override`), because a
// reflection on a glass case should not cost a ten-year-old their points.
//
// Open to everyone, on the same budget as the guide (lib/egypt/ai.js).
//
// POST { trip, stopId, image } -> { found, confidence, says }

export const config = {
  api: { bodyParser: { sizeLimit: '6mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const burst = checkRate(getClientIP(req), 'CLAUDE_API');
  if (!burst.allowed) return res.status(429).json({ error: RATE_LIMITS.CLAUDE_API.message });

  const user = await getAuthenticatedUser(req, res);

  const { trip: tripId, stopId, image } = req.body || {};
  const trip = getTrip(tripId);
  const stop = getStop(trip, stopId);
  if (!trip || !stop) return res.status(400).json({ error: 'Unknown stop.' });

  let photo;
  try {
    photo = imageBlock(image);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (!photo) return res.status(400).json({ error: 'Take a photo first.' });

  const verdict = await checkEgyptBudget(requesterId(user, getClientIP(req)), 'egypt-quest');
  if (!verdict.allowed) return rateLimitResponse(res, verdict, 'photo quests');

  try {
    const response = await callClaude(
      {
        model: await getAIModel('egyptGuide'),
        max_tokens: 500,
        system: questSystem(trip, stop),
        messages: [{ role: 'user', content: [photo, { type: 'text', text: 'Here is our photo for the quest. Did we find it?' }] }],
      },
      { logUsage: true, label: 'egypt-quest' },
    );
    const text = textOf(response);
    const parsed = extractJson(text);
    const result = parsed && !Array.isArray(parsed) ? parsed : null;
    if (!result || typeof result.found !== 'boolean') {
      // A reply that is not the JSON asked for still says something useful, so
      // show it and let the family decide.
      return res.status(200).json({ found: false, confidence: 'low', says: text.trim().slice(0, 600) || 'The guide was not sure. Have a look and decide for yourselves.' });
    }
    return res.status(200).json({
      found: result.found,
      confidence: ['high', 'medium', 'low'].includes(result.confidence) ? result.confidence : 'medium',
      says: String(result.says || '').slice(0, 600),
    });
  } catch (err) {
    console.error('[egypt-quest]', err.code, err.debug || err.message);
    return res.status(502).json({ error: 'The guide could not check that photo just now. Try again in a moment.' });
  }
}
