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
import { categoryById, levelById } from './catalogue';
import { toBank, writeTarget } from './bank';
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
  'Avoid: "which of these is NOT"; trick wording; anything gory, frightening or unkind; answers that need specialist spelling to match. Prefer facts that do not change; if an answer could change over time (a current champion, holder or record), name the year in the question or mark it dated.',
  'Keep questions short and clear: one sentence, and for children simple words.',
  'Make them interesting: a surprising fact beats a dull one, and a spread of easier and harder questions keeps everyone in the game.',
  'Avoid the quiz chestnuts everyone has heard (the Red Planet, how many legs a spider has, the capital of France): find fresher facts at the same level.',
  'The explanation is one short, fun sentence a quizmaster could read out after the answer.',
  'Tag each question: difficulty 1 (easy), 2 or 3 (hard) for the audience it is written for; family true when it suits a mixed family game, meaning a children’s question an adult would still enjoy, or a grown-up question a 10-year-old has a fair chance at; dated true when the answer could change over time.',
  'Write proper questions about the subject: the characters, stories, people, places and facts. An emoji-clue question ("Which film do these emoji describe?") is a rare extra, at most one in a batch, only for films, TV, cartoons, music, games and stories, and only when the clue is a really good one: two to six emoji that a fan would recognise. The clue is shown above the question, so keep emoji out of the question text itself. Leave emoji out of every other question.',
  'Always submit the questions by calling submit_questions, and reply with nothing else.',
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
            difficulty: { type: 'integer', enum: [1, 2, 3] },
            family: { type: 'boolean' },
            dated: { type: 'boolean' },
            emoji: { type: 'string', description: 'Only for an emoji-clue question: the clue, in emoji' },
          },
          required: ['question', 'options', 'answer', 'category', 'explanation', 'difficulty', 'family', 'dated'],
        },
      },
    },
    required: ['questions'],
  },
};

function prompt({ topics, brief, count, recent, familyOnly }) {
  const lines = [
    `Write ${count} quiz questions for ${brief}.`,
    '',
    topics.length > 1 ? `Spread them evenly across these categories:` : 'The category:',
    ...topics.map((t) => `- ${t.name}${t.brief ? `: ${t.brief}` : ''}`),
  ];
  if (familyOnly) lines.push('', 'Every question must suit a mixed family game: a 10-year-old has a fair chance, and adults still enjoy it. Tag them all family.');
  if (recent?.length) {
    lines.push('', 'These have been asked already. Do not ask them again, or anything close to them:', ...recent.map((r) => `- ${r}`));
  }
  return lines.join('\n');
}

/** The writer's raw questions, an emoji clue moved onto `media`. One call. */
async function writeRaw({ topics, brief, count, recent, familyOnly }) {
  const model = await getAIModel('quiz').catch(() => 'claude-sonnet-5-5');
  const response = await callClaude(
    {
      model,
      // Sonnet 5.5 thinks before it answers, and the thinking counts toward
      // max_tokens, so it gets room for that and is asked to keep it short.
      max_tokens: Math.min(16000, 2000 + count * 300),
      output_config: { effort: 'low' },
      system: SYSTEM,
      tools: [TOOL],
      // Sonnet 5.5 refuses a forced tool choice ("tool" or "any"), so the
      // system prompt asks for the tool; a reply without it counts as empty.
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: prompt({ topics, brief, count, recent, familyOnly }) }],
    },
    { logUsage: true, label: 'quiz-writer' },
  );
  const input = response.content?.find((b) => b.type === 'tool_use')?.input;
  const list = Array.isArray(input?.questions) ? input.questions : [];
  return {
    model,
    questions: list.map((q) => (q && typeof q.emoji === 'string' && q.emoji.trim() ? { ...q, media: { kind: 'emoji', text: q.emoji } } : q)),
  };
}

/**
 * `count` checked, shuffled, unrepeated questions for a game, written live:
 * used for a player's own categories, which are not kept in the bank. The
 * first call asks for a few extra, since some may fail the checks; if it still
 * falls short, a second asks for the rest.
 *
 * @param {{name: string, brief: string}[]} topics
 * @param {string} level            a LEVELS id
 * @param {number} count
 * @param {string[]} avoid          fingerprints already played
 * @param {string[]} recent         recent question texts, to steer away from
 */
export async function writeQuestions({ topics, level, count, avoid = [], recent = [] }) {
  const got = [];
  const seen = [...avoid];
  for (let attempt = 0; attempt < 2 && got.length < count; attempt++) {
    const want = count - got.length;
    const { questions } = await writeRaw({
      topics,
      brief: levelById(level).brief,
      count: want + 2,
      recent: [...recent, ...got.map((q) => q.question)].slice(-40),
    });
    for (const q of acceptQuestions(questions, { count: want, avoid: seen })) {
      seen.push(q.id);
      got.push(q);
    }
  }
  return balancePositions(got);
}

/**
 * New questions for the bank in one category, for when a level runs short:
 * tagged bank documents (lib/quiz/bank.js), a couple more than asked for, so
 * the bank grows a little ahead of play. Family mix writes Kids questions that
 * all suit a family.
 */
export async function writeForBank({ category, level, count, avoid = [], recent = [] }) {
  const cat = categoryById(category);
  if (!cat) return [];
  const { band, familyOnly } = writeTarget(level);
  const { model, questions } = await writeRaw({
    topics: [{ name: cat.name, brief: cat.brief }],
    brief: levelById(band).brief,
    count: count + 2,
    recent,
    familyOnly,
  });
  const seen = new Set(avoid);
  const docs = [];
  for (const raw of questions) {
    const doc = toBank(raw, { category, band, source: 'writer', model });
    if (!doc || seen.has(doc.fingerprint) || (familyOnly && !doc.family)) continue;
    seen.add(doc.fingerprint);
    docs.push(doc);
  }
  return docs;
}
