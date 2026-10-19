import { useState } from 'react';
import { Check, X, ArrowRight, Award } from 'lucide-react';
import Photo from './Photo';
import Stamp from './Stamp';
import { nextPlayer, stopStatus, POINTS } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// The stop's quiz, one question at a time.
//
// Who starts comes from progress.js `nextPlayer`, and they keep the quiz from
// question to question until someone taps another name: the right person to
// answer is usually just whoever is holding the phone. An answer is final (no
// second go), and the explanation always shows, right or wrong, because the
// "why" is the learning.
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function QuizCard({ stop, progress, onAnswer }) {
  const status = stopStatus(progress, stop);
  const answers = progress.stops[stop.id]?.answers || {};
  const firstOpen = stop.quiz.findIndex((_, i) => !answers[i]);
  const [index, setIndex] = useState(firstOpen === -1 ? stop.quiz.length : firstOpen);
  const [revealed, setRevealed] = useState(null);
  const [who, setWho] = useState(() => nextPlayer(progress)?.id);

  const playerName = (id) => progress.players.find((p) => p.id === id)?.name || 'Someone';

  if (index >= stop.quiz.length) {
    return (
      <section className="rounded-2xl border border-gold/50 bg-papyrus p-4 text-papyrus-foreground shadow-sm" aria-label="Quiz">
        <div className="flex items-center gap-3">
          <Stamp glyph={stop.stamp} earned size="lg" className="animate-pop-in" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-game-egypt">Stamp earned</p>
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
                  <span className="text-papyrus-foreground/75">
                    {q.options[q.answer]}
                    {a ? ` · ${playerName(a.by)}` : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  const q = stop.quiz[index];
  const choose = (choice) => {
    if (revealed != null) return;
    setRevealed(choice);
    onAnswer(index, choice, who);
  };
  // The same player carries on; `who` only changes when a name is tapped.
  const next = () => {
    setRevealed(null);
    setIndex((i) => i + 1);
  };
  const correct = revealed === q.answer;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-label="Quiz">
      <div className="flex items-center justify-between bg-lapis px-4 py-2.5 text-white">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Award className="h-4 w-4 text-gold" aria-hidden="true" /> Quiz
        </span>
        <span className="tnum text-sm text-white/80">
          {index + 1} of {stop.quiz.length}
        </span>
      </div>

      <div className="p-4">
        {progress.players.length > 1 && (
          <div className="-mx-1 mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Who is answering">
            {progress.players.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={who === p.id}
                disabled={revealed != null}
                onClick={() => setWho(p.id)}
                className={cn(
                  'press min-h-[36px] rounded-full px-3 text-sm font-semibold transition-colors',
                  who === p.id ? 'bg-gold text-lapis' : 'bg-muted text-muted-foreground',
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-game-egypt">{playerName(who)}’s question</p>
        <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-foreground">{q.q}</h3>

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
              {correct ? `Yes! +${POINTS.correct} to ${playerName(who)}` : 'Not quite.'}
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
