import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { play } from '@/components/arcade/sfx';
import { buzz, celebrate } from '@/components/arcade/feedback';
import { pickName } from '@/lib/quiz/catalogue';
import { currentQuestion, standings } from '@/lib/quiz/machine';
import { cn } from '@/lib/cn';
import { AnswerTiles, Avatar, Clock, Leaderboard, Marquee, Podium, SHOW_FONT, ShowButton } from './ui';

// The screens of a quiz in progress, drawn from the game object
// (lib/quiz/machine.js). The same screens serve solo and shout on one device,
// the host's big screen in a multi-phone game, and the TV.

const CONFETTI = ['#fbbf24', '#f43f5e', '#38bdf8', '#a78bfa', '#34d399'];

/** "Get ready": the title, the line-up, and 3-2-1. */
export function GetReady({ game, title = 'Quiz Night', waitingFor = false }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (waitingFor) return undefined;
    play('beep');
    // Stops at GO!: counting on past it re-animated GO! every beat.
    const t = setInterval(() => {
      setN((x) => {
        if (x <= 0) return 0;
        const next = x - 1;
        if (next > 0) play('beep');
        if (next === 0) play('go');
        return next;
      });
    }, 900);
    return () => clearInterval(t);
  }, [waitingFor]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
      <motion.div initial={{ scale: 0.4, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}>
        <Marquee>{title}</Marquee>
      </motion.div>
      {game.players.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {game.players.map((p, i) => (
            <motion.div key={p.id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.08 }} className="flex flex-col items-center">
              <Avatar player={p} size={56} />
              <span className="mt-1 text-lg" style={SHOW_FONT}>{p.name}</span>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence mode="wait">
        {waitingFor ? (
          <motion.p key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl text-white/90" style={SHOW_FONT}>
            Writing your questions…
          </motion.p>
        ) : (
          <motion.span key={n} initial={{ scale: 2.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="text-8xl text-amber-300 drop-shadow-[0_6px_0_rgba(0,0,0,0.4)]" style={SHOW_FONT}>
            {n > 0 ? n : 'GO!'}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionHeader({ game, big }) {
  const q = currentQuestion(game);
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn('rounded-full bg-black/30 px-3 py-1 font-bold ring-1 ring-white/20', big ? 'text-lg' : 'text-sm')}>
        {q?.category || 'Quiz'}
      </span>
      <span className={cn('rounded-full bg-amber-300 px-3 py-1 text-amber-950', big ? 'text-2xl' : 'text-lg')} style={SHOW_FONT}>
        {game.index + 1} / {game.settings.count}
      </span>
    </div>
  );
}

/**
 * A question's picture or emoji clue (lib/quiz/questions.js#checkMedia). A
 * picture carries its credit, which some Wikimedia licences require. `small`
 * is the reveal, where it is a reminder rather than the clue.
 */
function QuestionMedia({ media, big, small }) {
  if (!media) return null;
  if (media.kind === 'emoji') {
    return (
      <p className={cn('leading-none tracking-wide', small ? 'text-4xl' : big ? 'text-8xl' : 'text-6xl')} aria-label={`Clue: ${media.text}`}>
        {media.text}
      </p>
    );
  }
  return (
    <figure className="w-full">
      <img
        src={media.src}
        alt={media.alt || ''}
        draggable={false}
        className={cn('mx-auto w-auto select-none rounded-2xl object-contain shadow-[0_3px_0_rgba(0,0,0,0.15)]', small ? 'max-h-[16dvh]' : big ? 'max-h-[40dvh]' : 'max-h-[30dvh]')}
      />
      {media.credit && !small && <figcaption className="mt-1 text-[10px] font-semibold text-[#6b6390]">{media.credit}</figcaption>}
    </figure>
  );
}

/**
 * The question. `me` is the player answering on this device (solo, or a phone
 * in multi); without it the answers are display only (shout, the big screen).
 */
export function QuestionScreen({ game, me, onAnswer, big = false, offset = 0, answeredCount }) {
  const q = currentQuestion(game);
  const mine = me ? game.players.find((p) => p.id === me)?.answers[game.index] : undefined;
  const picked = mine ? mine.option : null;
  if (!q) return null;
  return (
    <div className={cn('mx-auto flex min-h-dvh flex-col gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]', big ? 'max-w-5xl gap-6 py-8' : 'max-w-xl')}>
      <QuestionHeader game={game} big={big} />
      <Clock endsAt={game.endsAt} total={game.settings.timer * 1000} offset={offset} running={game.phase === 'question'} />
      <motion.div
        key={q.id}
        initial={{ rotateX: -70, opacity: 0, y: -20 }}
        animate={{ rotateX: 0, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className={cn('flex flex-1 flex-col items-center justify-center gap-4 rounded-[2rem] bg-white px-5 text-center text-[#241a45] shadow-[0_8px_0_rgba(0,0,0,0.25)]', q.media ? 'py-5' : 'py-8')}
      >
        <QuestionMedia media={q.media} big={big} />
        <h2 className={cn('leading-tight', big ? 'text-6xl' : q.media ? 'text-2xl' : 'text-3xl')} style={SHOW_FONT}>
          {q.question}
        </h2>
      </motion.div>
      {answeredCount != null && (
        <p className="text-center text-xl" style={SHOW_FONT}>
          {answeredCount} of {game.players.length} answered
        </p>
      )}
      <AnswerTiles
        options={q.options}
        big={big}
        picked={picked}
        onPick={
          onAnswer && picked === null
            ? (i) => {
                play('lock');
                buzz(25);
                onAnswer(i);
              }
            : null
        }
      />
      {picked !== null && picked !== undefined && (
        <p className="text-center text-lg text-white/85" style={SHOW_FONT}>
          Locked in!
        </p>
      )}
    </div>
  );
}

/**
 * The answer, with what each player made of it. In shout mode, `onJudge` turns
 * the players into buttons for the quizmaster to tap.
 */
export function RevealScreen({ game, me, big = false, onJudge, onNext }) {
  const q = currentQuestion(game);
  const mine = me ? game.players.find((p) => p.id === me)?.answers[game.index] : null;
  const [right, setRight] = useState([]);
  const sounded = useRef(null);

  useEffect(() => {
    if (sounded.current === game.index) return;
    sounded.current = game.index;
    play('sting');
    if (mine) {
      setTimeout(() => {
        play(mine.correct ? 'correct' : 'wrong');
        buzz(mine.correct ? [30, 40, 30] : 120);
        if (mine.correct) celebrate('small', CONFETTI);
      }, 350);
    }
  }, [game.index, mine]);

  if (!q) return null;
  const counts = [0, 0, 0, 0];
  for (const p of game.players) {
    const a = p.answers[game.index];
    if (a && Number.isInteger(a.option)) counts[a.option] += 1;
  }
  const judging = game.mode === 'shout' && onJudge && !game.judged;

  return (
    <div className={cn('mx-auto flex min-h-dvh flex-col gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]', big ? 'max-w-5xl gap-6 py-8' : 'max-w-xl')}>
      <QuestionHeader game={game} big={big} />
      <div className="rounded-[2rem] bg-white px-5 py-5 text-center text-[#241a45] shadow-[0_8px_0_rgba(0,0,0,0.25)]">
        <QuestionMedia media={q.media} big={big} small />
        <h2 className={cn('leading-tight', big ? 'text-4xl' : 'text-2xl', q.media && 'mt-3')} style={SHOW_FONT}>
          {q.question}
        </h2>
        {q.explanation && <p className={cn('mt-2 font-semibold text-[#6b6390]', big ? 'text-xl' : 'text-sm')}>{q.explanation}</p>}
      </div>
      <AnswerTiles options={q.options} big={big} reveal correct={q.correctAnswer} picked={mine?.option ?? null} counts={game.mode === 'shout' ? null : counts} />

      {mine && (
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 400, damping: 15 }}
          className={cn('mx-auto rounded-3xl px-6 py-3 text-center text-3xl shadow-lg', mine.correct ? 'bg-emerald-500' : 'bg-rose-500')}
          style={SHOW_FONT}
        >
          {mine.correct ? `+${mine.points}` : mine.option === null ? 'Too slow!' : 'Not this time'}
        </motion.div>
      )}

      {judging && (
        <div className="mt-auto rounded-3xl bg-black/35 p-3 ring-1 ring-white/20">
          <p className="mb-2 text-center text-xl" style={SHOW_FONT}>
            Who got it right?
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {game.players.map((p) => {
              const on = right.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    play(on ? 'unstamp' : 'correct');
                    setRight((r) => (on ? r.filter((x) => x !== p.id) : [...r, p.id]));
                  }}
                  aria-pressed={on}
                  className={cn('toy flex items-center gap-2 rounded-2xl p-2 text-left', on ? 'bg-emerald-400 text-emerald-950 [--toy-edge:theme(colors.emerald.700)]' : 'bg-white/90 text-[#241a45] [--toy-edge:rgba(0,0,0,0.25)]')}
                >
                  <Avatar player={p} size={36} />
                  <span className="min-w-0 flex-1 truncate text-lg" style={SHOW_FONT}>{p.name}</span>
                  {on && <span aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
          <ShowButton className="mt-3" onClick={() => onJudge(right)}>
            {right.length ? `Score it (${right.length})` : 'Nobody got it'}
          </ShowButton>
        </div>
      )}
      {onNext && !judging && (
        <ShowButton className="mt-auto" onClick={onNext}>
          Next
        </ShowButton>
      )}
    </div>
  );
}

/** The race between questions. `before` is the scores at the previous screen, for the "+points". */
export function ScoresScreen({ game, me, big = false, onNext }) {
  const rows = standings(game);
  const gained = {};
  for (const p of game.players) gained[p.id] = p.answers[game.index]?.points || 0;
  const last = game.index + 1 >= game.settings.count;
  return (
    <div className={cn('mx-auto flex min-h-dvh flex-col gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]', big ? 'max-w-3xl py-10' : 'max-w-xl')}>
      <h2 className={cn('text-center drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]', big ? 'text-6xl' : 'text-4xl')} style={SHOW_FONT}>
        {last ? 'Final scores coming…' : 'The scores'}
      </h2>
      <Leaderboard rows={rows} highlight={me} gained={gained} />
      {onNext && (
        <ShowButton className="mt-auto" onClick={onNext}>
          {last ? 'And the winner is…' : 'Next question'}
        </ShowButton>
      )}
    </div>
  );
}

/** The end: podium, confetti, a few awards, and what next. */
export function FinalScreen({ game, me, big = false, children }) {
  const rows = standings(game);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    play('win');
    celebrate('big', CONFETTI);
  }, []);
  const solo = game.players.length === 1;
  const best = [...game.players].sort((a, b) => b.best - a.best)[0];
  const winner = rows[0];
  return (
    <div className={cn('mx-auto flex min-h-dvh flex-col gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]', big ? 'max-w-3xl py-10' : 'max-w-xl')}>
      <div className="text-center">
        <Marquee small>{solo ? 'Final score' : `${winner?.name} wins!`}</Marquee>
      </div>
      {solo ? (
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }} className="text-center">
          <p className="text-8xl text-amber-300" style={SHOW_FONT}>{winner.score}</p>
          <p className="mt-1 text-2xl" style={SHOW_FONT}>
            {winner.correct} of {game.settings.count} right
          </p>
        </motion.div>
      ) : (
        <Podium rows={rows} />
      )}
      {best?.best >= 3 && (
        <p className="text-center text-lg text-orange-200" style={SHOW_FONT}>
          🔥 Best streak: {best.name}, {best.best} in a row
        </p>
      )}
      {!solo && rows.length > 3 && <Leaderboard rows={rows.slice(3)} highlight={me} />}
      <div className="mt-auto grid grid-cols-1 gap-3">{children}</div>
    </div>
  );
}

export const categoryLabel = pickName;
