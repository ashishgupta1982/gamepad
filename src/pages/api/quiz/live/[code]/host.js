import { addQuestions, finish, next, reveal, start, toScores } from '@/lib/quiz/machine';
import { checkQuestion } from '@/lib/quiz/questions';
import { change, project } from '@/lib/quiz/live';

// The host's controls. POST { hostToken, action, ... }:
//   questions { questions }  add questions from the writer (checked again here)
//   start                    from the lobby to the first question
//   reveal | scores | next   move on now rather than waiting for the clock
//   remove { playerId }      take a player out (only in the lobby)
//   end                      finish the quiz
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { hostToken, action } = req.body || {};
  try {
    let refused = false;
    const doc = await change(req.query.code, (d, now) => {
      if (!hostToken || d.hostToken !== hostToken) {
        refused = true;
        return null;
      }
      const g = d.game;
      switch (action) {
        case 'questions': {
          const qs = (Array.isArray(req.body.questions) ? req.body.questions : [])
            .map((q) => {
              const ok = checkQuestion(q);
              return ok && q.id ? { ...ok, id: String(q.id).slice(0, 16) } : null;
            })
            .filter(Boolean);
          return { game: addQuestions(g, qs, now) };
        }
        case 'start':
          return { game: start(g, now) };
        case 'reveal':
          return { game: reveal(g, now) };
        case 'scores':
          return { game: toScores(g, now) };
        case 'next':
          return { game: next(g, now) };
        case 'end':
          return { game: finish(g, now) };
        case 'remove':
          if (g.phase !== 'ready') return null;
          return { game: { ...g, players: g.players.filter((p) => p.id !== req.body.playerId) } };
        default:
          return null;
      }
    });
    if (!doc) return res.status(404).json({ error: 'No quiz with that code.' });
    if (refused) return res.status(403).json({ error: 'Only the host can do that.' });
    // The host sees what everyone sees: the answer stays hidden while a
    // question is open, since the host's screen is often the one on show.
    return res.status(200).json({ v: doc.version, now: Date.now(), game: project(doc) });
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }
}
