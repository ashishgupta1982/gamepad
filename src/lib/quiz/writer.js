// Server-only: the quiz's question writer. Never import from a component; it
// pulls in the Anthropic SDK through @aspiro/ai/server.
//
// Questions used to be written in the browser and sent through the open
// /api/claude proxy, on the fastest model, and picked out of free text with a
// regex. Now the server asks Claude through a tool with a fixed shape, so the
// answer is structured data, and every question is checked and shuffled before
// a player sees it (lib/quiz/questions.js).
import { callClaude, createClaudeRateLimit, createMongoCounter, createWindowedCounter } from '@aspiro/ai/server';
import { getAIModel } from '@/lib/aiModels';
import dbConnect from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';
import { levelById } from './catalogue';
import { acceptQuestions, balancePositions } from './questions';

// The question route is open to guests, so these counters stand between a
// public URL and the Claude bill. A family quiz night is perhaps 5 to 10 games,
// each 2 or 3 calls; a sample question for a new category is one more.
const counter = createWindowedCounter({
  count: createMongoCounter({ model: RateLimit, connect: dbConnect }),
  buckets: {
    'quiz-questions': { hour: 60, day: 200 },
    'quiz-site': { hour: 600, day: 2500 },
  },
});
const checkRequester = createClaudeRateLimit({ counter });

/** The requester's own budget, then the site-wide one. A failing counter lets the call through. */
export async function checkQuizBudget(requester) {
  try {
    const own = await checkRequester(requester, 'quiz-questions');
    if (!own.allowed) return own;
    return await counter.check('everyone', 'quiz-site');
  } catch (err) {
    console.error('[quiz-budget] counter failed, allowing the call:', err.message);
    return { allowed: true };
  }
}

const SYSTEM = [
  'You write questions for a family quiz game played in Britain, read aloud and on phones. Write in British English.',
  'Every question has exactly one right answer and three wrong ones. The right answer must be a well-established fact you are certain of. If you are not sure of a fact, write a different question.',
  'Wrong answers are plausible and of the same kind as the right one (four countries, four years, four animals), so the question cannot be solved by spotting the odd one out.',
  'Avoid: questions whose answer changes over time (current champions, holders, prices) unless the question names the year; "which of these is NOT"; trick wording; anything gory, frightening or unkind; answers that need specialist spelling to match.',
  'Keep questions short and clear: one sentence, and for young children under fifteen simple words.',
  'Make them interesting: a surprising fact beats a dull one, and a spread of easier and harder questions keeps everyone in the game.',
  'Avoid the quiz chestnuts everyone has heard (the Red Planet, how many legs a spider has, the capital of France): find fresher facts at the same level.',
  'The explanation is one short, fun sentence a quizmaster could read out after the answer.',
].join('\n');

const TOOL = {
  name: 'submit_questions',
  description: 'Submit the quiz questions.',
  input_schema: {
    type: 'object',
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4, description: 'The four options, the right one among them' },
            answer: { type: 'string', description: 'The right option, exactly as written in options' },
            category: { type: 'string', description: 'Which of the given categories this belongs to' },
            explanation: { type: 'string' },
          },
          required: ['question', 'options', 'answer', 'category', 'explanation'],
        },
      },
    },
    required: ['questions'],
  },
};

function prompt({ topics, level, count, recent }) {
  const lvl = levelById(level);
  const lines = [
    `Write ${count} quiz questions for ${lvl.brief}.`,
    '',
    topics.length > 1 ? `Spread them evenly across these categories:` : 'The category:',
    ...topics.map((t) => `- ${t.name}${t.brief ? `: ${t.brief}` : ''}`),
  ];
  if (recent?.length) {
    lines.push('', 'These have been asked recently. Do not ask them again, or anything close to them:', ...recent.map((r) => `- ${r}`));
  }
  return lines.join('\n');
}

/**
 * `count` checked, shuffled, unrepeated questions, or as many as the writer
 * managed in two calls. The first call asks for a few extra, since some may
 * fail the checks; if it still falls short, a second asks for the rest.
 *
 * @param {{name: string, brief: string}[]} topics
 * @param {string} level            a LEVELS id
 * @param {number} count
 * @param {string[]} avoid          fingerprints already played
 * @param {string[]} recent         recent question texts, to steer away from
 */
export async function writeQuestions({ topics, level, count, avoid = [], recent = [] }) {
  const model = await getAIModel('quiz').catch(() => 'balanced');
  const got = [];
  const seen = [...avoid];
  for (let attempt = 0; attempt < 2 && got.length < count; attempt++) {
    const want = count - got.length;
    const response = await callClaude(
      {
        model,
        max_tokens: Math.min(8000, 400 + want * 260),
        temperature: 1,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: TOOL.name },
        messages: [{ role: 'user', content: prompt({ topics, level, count: want + 2, recent: [...recent, ...got.map((q) => q.question)].slice(-40) }) }],
      },
      { logUsage: true, label: 'quiz-writer' },
    );
    const input = response.content?.find((b) => b.type === 'tool_use')?.input;
    const accepted = acceptQuestions(input?.questions, { count: want, avoid: seen });
    for (const q of accepted) {
      seen.push(q.id);
      got.push(q);
    }
  }
  return balancePositions(got);
}
