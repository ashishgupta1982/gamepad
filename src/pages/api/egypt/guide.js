import { callClaude, textOf, rateLimitResponse } from '@aspiro/ai/server';
import { getAIModel } from '@/lib/aiModels';
import { getAuthenticatedUser } from '@/utils/authHelper';
import { checkRate, getClientIP, RATE_LIMITS } from '@/utils/rateLimiter';
import { checkEgyptBudget, requesterId, guideSystem, imageBlock } from '@/lib/egypt/ai';
import { getTrip, getStop } from '@/data/egypt';

// Ask the guide: a question, a photo, or both, with the last few turns of the
// conversation so a follow-up ("why?") makes sense.
//
// Open to everyone, signed in or not. It spends money per call on a public URL,
// so every call counts against a durable budget, per account or per connection
// and site-wide (lib/egypt/ai.js). The photo is sent straight to Claude and
// never stored.
//
// POST { trip, stopId?, messages: [{ role: 'user'|'assistant', text }], image? }
//   image is a data URL for the LAST user message only.

export const config = {
  api: { bodyParser: { sizeLimit: '6mb' } },
};

const MAX_TURNS = 10;
const MAX_TEXT = 1200;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const burst = checkRate(getClientIP(req), 'CLAUDE_API');
  if (!burst.allowed) return res.status(429).json({ error: RATE_LIMITS.CLAUDE_API.message });

  const user = await getAuthenticatedUser(req, res);

  const { trip: tripId, stopId, messages, image } = req.body || {};
  const trip = getTrip(tripId);
  if (!trip) return res.status(400).json({ error: 'Unknown trip.' });
  const stop = stopId ? getStop(trip, stopId) : null;

  const turns = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TEXT).trim() }));
  // The API needs the conversation to start with the user and end with them.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Ask a question first.' });
  }

  let photo;
  try {
    photo = imageBlock(image);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const verdict = await checkEgyptBudget(requesterId(user, getClientIP(req)), 'egypt-guide');
  if (!verdict.allowed) return rateLimitResponse(res, verdict, 'questions to the guide');

  const apiMessages = turns.map((m, i) => {
    const last = i === turns.length - 1;
    if (!last || !photo) return { role: m.role, content: m.text || 'What is this?' };
    return { role: 'user', content: [photo, { type: 'text', text: m.text || 'What is this, and what is interesting about it?' }] };
  });

  try {
    const response = await callClaude(
      {
        model: await getAIModel('egyptGuide'),
        max_tokens: 700,
        system: guideSystem(trip, stop),
        messages: apiMessages,
      },
      { logUsage: true, label: 'egypt-guide' },
    );
    const reply = textOf(response).trim();
    if (!reply) return res.status(502).json({ error: 'The guide went quiet. Try asking again.' });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[egypt-guide]', err.code, err.debug || err.message);
    return res.status(502).json({ error: 'The guide could not answer just now. Try again in a moment.' });
  }
}
