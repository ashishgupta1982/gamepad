import Anthropic from '@anthropic-ai/sdk';
import dbConnect from '@/lib/mongodb';
import Game from '@/models/Game';
import { generateId, isHost } from '@/lib/travelBingo';
import { checkRate } from '@/utils/rateLimiter';
import { serializeGame } from './index';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TILES_PER_CARD = 9;

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';
}

function buildPrompt(items, cars) {
  const carList = cars.map(c => `- ${c.carId} (${c.name})`).join('\n');
  const itemList = items.map(i => `- ${i}`).join('\n');
  return `You are designing bingo cards for a family road-trip game called Travel Bingo.

Each "car" is a player. Below is the pooled list of things every car wants to spot on the trip, plus the list of cars.

POOLED ITEMS (de-duplicate, lightly tidy spelling/wording, do NOT invent new items unless absolutely needed to fill a card):
${itemList}

CARS:
${carList}

Your job:
1. Group the items into 4-6 sensible categories (e.g. "Animals", "Vehicles", "Landmarks", "Food", "Nature", "Signs"). Pick category names that fit the actual items.
2. For each car, build a bingo card of exactly ${TILES_PER_CARD} tiles. Each card must:
   - Draw at least one item from each category you defined.
   - Feel balanced: a fair mix of easy, medium, and trickier-to-spot items.
   - Be DIFFERENT from the other cars' cards (not identical), but items MAY repeat across cars when the item pool is small.

Respond with ONLY a JSON object, no prose, no markdown fences. Shape:
{
  "categories": ["Category A", "Category B", ...],
  "cards": [
    { "carId": "<carId from CARS list>", "tiles": [ { "label": "Item text", "category": "Category A" }, ... 9 tiles ... ] }
  ]
}

Make sure every car in CARS has exactly one card with exactly ${TILES_PER_CARD} tiles.`;
}

function parseClaudeJson(text) {
  if (!text || typeof text !== 'string') return null;
  // Strip code fences if present
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  // Find first { and last }
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch (e) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIP(req);
  const rate = checkRate(ip, 'CLAUDE_API');
  if (!rate.allowed) {
    return res.status(429).json({ error: 'Too many AI requests. Please wait a minute.' });
  }

  const { id } = req.query;
  const { hostUserId } = req.body || {};

  await dbConnect();

  const game = await Game.findById(id);
  if (!game || game.gameType !== 'travel-bingo') {
    return res.status(404).json({ error: 'Game not found' });
  }
  if (!isHost(game, hostUserId)) {
    return res.status(403).json({ error: 'Only the host can generate cards' });
  }
  if (game.travelBingoConfig.phase !== 'submission') {
    return res.status(409).json({ error: 'Cards already generated' });
  }

  const cars = game.travelBingoConfig.cars || [];
  if (cars.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 cars before generating' });
  }

  const pooledItems = Array.from(new Set(
    cars.flatMap(c => c.submittedItems || [])
      .map(s => s.trim())
      .filter(Boolean)
  ));
  if (pooledItems.length < 9) {
    return res.status(400).json({ error: 'Need at least 9 items submitted in total' });
  }

  // Mark generating
  game.travelBingoConfig.phase = 'generating';
  await game.save();

  let parsed = null;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      temperature: 0.7,
      messages: [{ role: 'user', content: buildPrompt(pooledItems, cars) }],
    });
    parsed = parseClaudeJson(message?.content?.[0]?.text);
  } catch (err) {
    console.error('Claude error in travel-bingo generate:', err);
  }

  if (!parsed || !Array.isArray(parsed.cards) || !Array.isArray(parsed.categories)) {
    // Roll back the phase and surface error
    game.travelBingoConfig.phase = 'submission';
    await game.save();
    return res.status(502).json({ error: 'AI failed to generate valid cards. Please try again.' });
  }

  // Apply the result
  game.travelBingoConfig.categories = parsed.categories.map(String).slice(0, 8);

  for (const car of cars) {
    const match = parsed.cards.find(c => c.carId === car.carId);
    if (!match || !Array.isArray(match.tiles)) continue;
    const tiles = match.tiles.slice(0, TILES_PER_CARD).map(t => ({
      tileId: generateId('tile'),
      label: String(t.label || '').trim().slice(0, 120),
      category: String(t.category || '').trim().slice(0, 60),
      found: false,
      comments: [],
    }));
    // Pad to exactly 9 tiles if AI was short, by duplicating from pool
    while (tiles.length < TILES_PER_CARD && pooledItems.length > 0) {
      const filler = pooledItems[tiles.length % pooledItems.length];
      tiles.push({
        tileId: generateId('tile'),
        label: filler,
        category: parsed.categories[0] || 'Other',
        found: false,
        comments: [],
      });
    }
    car.card = tiles;
  }

  game.travelBingoConfig.phase = 'playing';
  await game.save();

  return res.status(200).json({ game: serializeGame(game) });
}
