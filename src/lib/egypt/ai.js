// Server-only: what the Egypt Explorer AI routes share. Never import from a
// component; it pulls in the Anthropic SDK through @aspiro/ai/server.
import {
  createWindowedCounter,
  createClaudeRateLimit,
  createMongoCounter,
} from '@aspiro/ai/server';
import dbConnect from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';

// Per account. A family day in the museum is perhaps 40 to 80 questions and a
// dozen photo quests, so these leave plenty of room for that and stop a leaked
// session from running up a bill. `claude-total` is the ceiling across both, so
// switching between them buys nothing.
const counter = createWindowedCounter({
  count: createMongoCounter({ model: RateLimit, connect: dbConnect }),
  buckets: {
    'egypt-guide': { hour: 60, day: 150 },
    'egypt-quest': { hour: 40, day: 80 },
    'claude-total': { hour: 80, day: 200 },
  },
});

export const checkEgyptBudget = createClaudeRateLimit({ counter });

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// The client shrinks photos to 1280px JPEG (lib/egypt/photo.js), which lands at
// a few hundred KB. This is the ceiling for anything that skipped that step.
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * A data URL from the client as a Claude image block, or null if there is none.
 * Throws a message fit to show the user if it is not an image we can send.
 */
export function imageBlock(dataUrl) {
  if (!dataUrl) return null;
  const m = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!m) throw new Error('That photo could not be read. Try taking it again.');
  const [, mediaType, data] = m;
  if (!IMAGE_TYPES.includes(mediaType)) throw new Error('That kind of image is not supported. Try a normal photo.');
  if ((data.length * 3) / 4 > MAX_IMAGE_BYTES) throw new Error('That photo is too big. Try taking it again.');
  return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
}

const WHO =
  'You are Nefer, the guide in Egypt Explorer, a museum game on a phone. You are talking to a British family on holiday in Egypt: parents and children aged 10 to 14, often reading your answer together.';

const VOICE = [
  'Write in British English, warmly and vividly, like a brilliant museum guide who loves this stuff. Never babyish: these are bright children and their parents.',
  'Keep it short, because it is read on a phone in a crowded gallery: two to four sentences, under 90 words, unless they ask for more. One surprising detail beats a list of facts.',
  'Plain text only. No markdown, no headings, no bullet points, no emoji.',
  'Be accurate. If you are not sure, say so plainly and say what would tell them (a museum label, a member of staff). Never invent a museum object, a gallery location, opening times or prices.',
  'Mummies, tombs and battles are fine to talk about, without gore.',
  'Where it fits, end with one thing to look for or try next, in the room they are in.',
].join(' ');

/** The guide's system prompt, for wherever in the trip the family is. */
export function guideSystem(trip, stop) {
  const where = stop
    ? `They are at the stop "${stop.title}" (${stop.where}). What the game has told them here: ${stop.guide}`
    : `They are using the ${trip.name} trip but are not at a particular stop.`;
  return [
    WHO,
    `Today they are at the ${trip.name} (${trip.place}). ${where}`,
    'If they send a photo, say what it most likely shows and what is interesting about it. If you cannot tell what it is, say so and suggest they check the label.',
    VOICE,
  ].join('\n\n');
}

/** The photo quest judge. Asks for JSON so the verdict can score. */
export function questSystem(trip, stop) {
  return [
    WHO,
    `They are at the ${trip.name}, at the stop "${stop.title}" (${stop.where}). Their photo quest: "${stop.quest.ask}"`,
    `What counts as found: ${stop.quest.target}`,
    'Judge their photo kindly but honestly. A blurry, tilted or partial photo of the right thing still counts. A photo of something else does not, but tell them what it is instead.',
    'Reply with JSON only, no other text: {"found": true or false, "confidence": "high" or "medium" or "low", "says": "two or three sentences to the family: what you can see in their photo, and one fascinating detail about it, or if it is not the target, a friendly nudge about what to look for"}',
    VOICE.replace('Plain text only. No markdown, no headings, no bullet points, no emoji. ', ''),
  ].join('\n\n');
}
