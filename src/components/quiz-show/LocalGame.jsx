import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { play } from '@/components/arcade/sfx';
import { addQuestions, answer, createGame, judge, next, reveal, start, standings, tick } from '@/lib/quiz/machine';
import { levelById } from '@/lib/quiz/catalogue';
import { categoryTally } from '@/lib/quiz/stats';
import { fetchQuestions, rememberSeen } from './data';
import { FinalScreen, GetReady, QuestionScreen, RevealScreen, ScoresScreen, categoryLabel } from './screens';
import { SHOW_FONT, ShowButton } from './ui';

// Solo and shout games: the whole game runs on this device and is saved to it
// after every move (Ash, 2026-10-21: a reload or a dropped signal must not lose
// a game in action). Questions come from the server in two goes: a few first,
// so the game starts within seconds, then the rest while it plays.

export const LOCAL_KEY = 'quiz:local';
const FIRST_BATCH = 3;
const READY_MS = 2800;

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    return saved?.game?.v === 2 ? saved : null;
  } catch {
    return null;
  }
}
export function clearLocal() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {}
}

export default function LocalGame({ setup, resume, onExit, onNewQuiz }) {
  const { status } = useSession();
  const [game, setGame] = useState(() => resume?.game || createGame({ mode: setup.mode, settings: settingsOf(setup), players: setup.players }));
  const [error, setError] = useState('');
  const fetching = useRef(false);
  const saved = useRef(!!resume?.recorded);
  const me = game.mode === 'solo' ? game.players[0]?.id : null;
  const gameRef = useRef(game);
  gameRef.current = game;

  // Saved after every move.
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ game, recorded: saved.current, at: Date.now() }));
    } catch {}
  }, [game]);

  // The clock: reveal at the bell, move on after each screen.
  useEffect(() => {
    if (game.phase === 'finished' || game.phase === 'ready') return undefined;
    const t = setInterval(() => setGame((g) => tick(g, Date.now())), 250);
    return () => clearInterval(t);
  }, [game.phase]);

  // Questions: whatever is still owed, in two batches.
  const loadMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setError('');
    try {
      let g = gameRef.current;
      while (g.questions.length < g.settings.count) {
        const want = g.questions.length === 0 ? Math.min(FIRST_BATCH, g.settings.count) : g.settings.count - g.questions.length;
        const qs = await fetchQuestions({ picks: g.settings.picks, level: g.settings.level, count: want, exclude: g.questions, players: g.players.map((p) => p.name) });
        if (!qs.length) throw new Error('No questions came back. Try again?');
        setGame((cur) => addQuestions(cur, qs, Date.now()));
        g = { ...g, questions: [...g.questions, ...qs] };
      }
    } catch (err) {
      setError(err.message || 'Could not get the questions. Try again?');
    } finally {
      fetching.current = false;
    }
  }, []);
  useEffect(() => {
    if (game.phase !== 'finished' && game.questions.length < game.settings.count) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once the first questions are in, the 3-2-1, then the first question. Keyed
  // on whether there are any questions, not how many: the second batch landing
  // mid-countdown must not restart it. (It used to keep a "started" state in
  // its own dependencies, so the re-render cleared the timer it had just set
  // and the game sat on GO! for ever.)
  const haveQuestions = game.questions.length > 0;
  useEffect(() => {
    if (game.phase !== 'ready' || !haveQuestions) return undefined;
    const t = setTimeout(() => setGame((g) => start(g, Date.now())), READY_MS);
    return () => clearTimeout(t);
  }, [game.phase, haveQuestions]);

  // At the end, for a signed-in account: remember who saw which questions, so
  // they do not come back for those players, and keep the result in history.
  useEffect(() => {
    if (game.phase !== 'finished' || saved.current) return;
    saved.current = true;
    if (status === 'authenticated') {
      rememberSeen(game.players.map((p) => p.name), game.questions);
      saveResult(game).catch(() => {});
    }
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ game, recorded: true, at: Date.now() }));
    } catch {}
  }, [game, status]);

  const quit = () => {
    if (game.phase !== 'finished' && !window.confirm('End this quiz? Scores so far will be lost.')) return;
    // The questions already played still count as seen.
    if (game.phase !== 'finished' && game.index >= 0 && status === 'authenticated') {
      rememberSeen(game.players.map((p) => p.name), game.questions.slice(0, game.index + 1));
    }
    clearLocal();
    onExit();
  };

  const playAgain = () => {
    play('tap');
    clearLocal();
    onNewQuiz({ ...setup, ...settingsOf(setup), mode: game.mode, players: game.players.map(({ id, name, avatar, color }) => ({ id, name, avatar, color })) }, true);
  };

  return (
    <>
      {game.phase !== 'finished' && (
        <button
          type="button"
          onClick={quit}
          aria-label="End the quiz"
          className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/30"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {(game.phase === 'ready' || (game.phase === 'loading' && !error)) && <GetReady game={game} waitingFor={!game.questions[game.index + 1]} />}

      {error && game.phase !== 'finished' && !game.questions[game.index + 1] && (game.phase === 'ready' || game.phase === 'loading') && (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-2xl" style={SHOW_FONT}>{error}</p>
          <ShowButton className="max-w-xs" onClick={loadMore}>
            Try again
          </ShowButton>
        </div>
      )}

      {game.phase === 'question' && (
        <QuestionScreen
          game={game}
          me={me}
          onAnswer={me ? (i) => setGame((g) => answer(g, me, i, Date.now())) : null}
          // Shout: nobody answers on the phone, so the quizmaster says when everyone has.
          onRevealNow={game.mode === 'shout' ? () => setGame((g) => reveal(g, Date.now())) : null}
        />
      )}

      {game.phase === 'reveal' && (
        <RevealScreen
          game={game}
          me={me}
          onJudge={game.mode === 'shout' ? (ids) => setGame((g) => judge(g, ids, Date.now())) : null}
          onNext={game.mode === 'solo' ? () => setGame((g) => next(g, Date.now())) : null}
          rate={game.mode === 'solo'}
        />
      )}

      {game.phase === 'scores' && <ScoresScreen game={game} me={me} onNext={() => setGame((g) => next(g, Date.now()))} rate />}

      {game.phase === 'finished' && (
        <FinalScreen game={game} me={me}>
          <ShowButton onClick={playAgain}>Play again</ShowButton>
          <ShowButton
            className="bg-white text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]"
            onClick={() => {
              clearLocal();
              onExit();
            }}
          >
            Back to the quiz
          </ShowButton>
        </FinalScreen>
      )}
    </>
  );
}

export function settingsOf(setup) {
  return { picks: setup.picks, level: setup.level, count: setup.count, timer: setup.timer };
}

/**
 * A finished quiz into the signed-in player's history, with each player's
 * right and asked by category for Your quizzes. `questions` are the ones
 * played, in order: a live game's own copy only holds the one on screen.
 */
export async function saveResult(game, questions = game.questions) {
  const rows = standings(game);
  const tally = categoryTally(game, questions);
  const res = await fetch('/api/quiz/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: game.mode,
      level: levelById(game.settings.level).name,
      categories: game.settings.picks.map(categoryLabel),
      count: game.settings.count,
      players: rows.map((r) => ({ name: r.name, avatar: r.avatar, color: r.color, score: r.score, correct: r.correct, best: r.best, place: r.place, cats: tally[r.id] })),
    }),
  });
  if (!res.ok) throw new Error('not saved');
}
