import { useState } from 'react';
import { Check, X, ArrowRight, Award } from 'lucide-react';
import Photo from './Photo';
import Stamp from './Stamp';
import { playerStop, stopStatus, POINTS } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// The stop's quiz, one question at a time, for whoever is playing on this
// phone (the name in the header). Everyone does every stop's quiz for
// themselves, so it is keyed by player as well as stop (StopView): handing the
// phone over starts the next person on their own questions. An answer is final
// (no second go), and the explanation always shows, right or wrong, because the
// "why" is the learning.
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function QuizCard({ stop, progress, me, players, onAnswer, onStamp }) {
  const status = stopStatus(progress, stop, me);
  const answers = playerStop(progress, me, stop.id).answers;
  const firstOpen = stop.quiz.findIndex((_, i) => !answers[i]);
  const [index, setIndex] = useState(firstOpen === -1 ? stop.quiz.length : firstOpen);
  const [revealed, setRevealed] = useState(null);

  const myName = players.find((p) => p.id === me)?.name || 'You';
  const others = players
    .filter((p) => p.id !== me)
    .map((p) => ({ name: p.name, status: stopStatus(progress, stop, p.id) }))
    .filter((x) => x.status.stamped);

  if (index >= stop.quiz.length) {
    return (
      <section className="rounded-2xl border border-gold/50 bg-papyrus p-4 text-papyrus-foreground shadow-sm" aria-label="Quiz">
        <div className="flex items-center gap-3">
          <Stamp glyph={stop.stamp} earned size="lg" className="animate-pop-in" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-game-egypt">{myName}’s stamp</p>
            <p className="font-display text-xl font-semibold">
              {status.correct} of {status.total} right{status.perfect ? '. Perfect!' : ''}
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {stop.quiz.map((q, i) => {
            const a = answers[i];
            return (
              <li key={i} className="flex gap-2 text-sm">
                {a?.correct ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Right" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-label="Wrong" />
                )}
                <span>
                  <span className="font-medium">{q.q}</span>{' '}
                  <span className="text-papyrus-foreground/75">{q.options[q.answer]}</span>
                </span>
              </li>
            );
          })}
        </ul>
        {others.length > 0 && (
          <p className="mt-4 border-t border-gold/40 pt-3 text-sm">
            <span className="font-semibold">Also done here:</span>{' '}
            {others.map((x) => `${x.name} ${x.status.correct}/${x.status.total}`).join(' · ')}
          </p>
        )}
      </section>
    );
  }

  const q = stop.quiz[index];
  const choose = (choice) => {
    if (revealed != null) return;
    setRevealed(choice);
    onAnswer(index, choice);
  };
  const next = () => {
    setRevealed(null);
    setIndex((i) => i + 1);
    // The stamp is earned with the last answer, but celebrated here, once the
    // player has read the last "why" and turned the page to it.
    if (index + 1 >= stop.quiz.length) onStamp?.();
  };
  const correct = revealed === q.answer;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label="Quiz">
      <div className="flex items-center justify-between bg-lapis px-4 py-2.5 text-white">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-gold" aria-hidden="true" /> {myName}’s quiz
        </span>
        <span className="tnum text-sm text-white/80">
          {index + 1} of {stop.quiz.length}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-display text-xl font-semibold leading-snug text-foreground">{q.q}</h3>

        {q.photo && <Photo id={q.photo} fill className="mt-3 aspect-[16/9] rounded-xl" />}

        <div className="mt-4 grid gap-2">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answer;
            const picked = revealed === i;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => choose(i)}
                disabled={revealed != null}
                className={cn(
                  'press flex min-h-[52px] items-center gap-3 rounded-xl border-2 px-3 text-left text-base font-medium transition-colors',
                  revealed == null && 'border-border bg-card hover:border-lapis/50',
                  revealed != null && isAnswer && 'border-success bg-success/10 text-foreground',
                  revealed != null && picked && !isAnswer && 'border-destructive bg-destructive/10',
                  revealed != null && !isAnswer && !picked && 'border-border opacity-60',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    revealed != null && isAnswer ? 'bg-success text-white' : 'bg-muted text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {revealed != null && isAnswer ? <Check className="h-4 w-4" /> : LETTERS[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {revealed != null && (
          <div className="mt-4 animate-slide-up rounded-xl bg-papyrus p-3 text-papyrus-foreground">
            <p className="font-display text-lg font-semibold">
              {correct ? `Yes! +${POINTS.correct} to ${myName}` : 'Not quite.'}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{q.why}</p>
            <button
              type="button"
              onClick={next}
              className="press mt-3 flex min-h-touch w-full items-center justify-center gap-2 rounded-lg bg-lapis px-4 text-sm font-semibold text-white"
            >
              {index + 1 < stop.quiz.length ? 'Next question' : 'Get the stamp'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
