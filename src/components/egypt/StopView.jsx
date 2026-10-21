import { BookOpen, Check, Eye, MapPin, Sparkles } from 'lucide-react';
import Photo from './Photo';
import PhotoGallery from './PhotoGallery';
import Stamp from './Stamp';
import QuestCard from './QuestCard';
import QuizCard from './QuizCard';
import CartoucheMaker from './CartoucheMaker';
import HowBig from './HowBig';
import PyramidMaths from './PyramidMaths';
import { playerStop, stopStatus, POINTS } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// One stop: a big photo, the story, things to spot, the photo quest and the
// quiz. One scrolling page rather than steps, because in a museum you read a
// bit, look up, wander, and come back; a wizard would fight that.
//
// Everything on it is for whoever is playing on this phone (`me`). The quest
// and the quiz are keyed by player, so switching the name in the header starts
// the next person on their own go.
export default function StopView({ trip, stop, index, progress, me, players, onAnswer, onStamp, onQuest, onLook }) {
  const status = stopStatus(progress, stop, me);
  const looked = playerStop(progress, me, stop.id).looked || [];
  const [hero, ...more] = stop.photos;

  return (
    <article className="space-y-6">
      <header className="relative -mx-4 -mt-4 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-2xl">
        <Photo id={hero} fill eager showCredit className="aspect-[4/5] max-h-[62dvh] w-full sm:aspect-[16/10]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-lapis via-lapis/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 text-white">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Stop {index + 1} of {trip.stops.length}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold leading-tight">{stop.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {stop.where}
            </p>
          </div>
          <Stamp glyph={stop.stamp} earned={status.stamped} size="md" className={status.stamped ? '' : 'bg-white/90'} />
        </div>
      </header>

      <p className="font-display text-xl font-medium leading-snug text-foreground">{stop.intro}</p>

      <PhotoGallery ids={more} label={`Photos of ${stop.title}`} />

      <section className="rounded-2xl bg-papyrus p-4 text-papyrus-foreground shadow-sm" aria-labelledby={`story-${stop.id}`}>
        <h2 id={`story-${stop.id}`} className="flex items-center gap-2 font-display text-lg font-semibold">
          <BookOpen className="h-5 w-5 text-game-egypt" aria-hidden="true" /> The story
        </h2>
        <div className="mt-2 space-y-3 text-[16px] leading-relaxed">
          {stop.story.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      {stop.kind === 'cartouche' && <CartoucheMaker key={me} players={players} me={me} />}
      {stop.kind === 'scale' && <HowBig />}
      {stop.kind === 'builder' && <PyramidMaths />}

      <section aria-labelledby={`look-${stop.id}`}>
        <h2 id={`look-${stop.id}`} className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Eye className="h-5 w-5 text-lapis" aria-hidden="true" /> Look closely
          <span className="text-sm font-normal text-muted-foreground">+{POINTS.look} each</span>
        </h2>
        <ul className="mt-2 space-y-2">
          {stop.lookFor.map((item, i) => {
            const done = looked.includes(i);
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => onLook(i)}
                  aria-pressed={done}
                  className={cn(
                    'press flex min-h-touch w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[15px] transition-colors',
                    done ? 'border-success/40 bg-success/10 text-foreground' : 'border-border bg-card text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2',
                      done ? 'border-success bg-success text-white' : 'border-border',
                    )}
                    aria-hidden="true"
                  >
                    {done && <Check className="h-4 w-4" />}
                  </span>
                  <span className={cn(done && 'line-through decoration-success/60')}>{item}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-lapis p-4 text-white shadow-sm" aria-labelledby={`facts-${stop.id}`}>
        <h2 id={`facts-${stop.id}`} className="flex items-center gap-2 font-display text-lg font-semibold text-gold">
          <Sparkles className="h-5 w-5" aria-hidden="true" /> Did you know?
        </h2>
        <ul className="mt-2 space-y-2.5">
          {stop.facts.map((f) => (
            <li key={f} className="text-[15px] leading-relaxed text-white/95">{f}</li>
          ))}
        </ul>
      </section>

      <QuestCard
        key={`quest-${stop.id}-${me}`}
        trip={trip}
        stop={stop}
        progress={progress}
        me={me}
        players={players}
        onRecord={onQuest}
      />

      <QuizCard key={`quiz-${stop.id}-${me}`} stop={stop} progress={progress} me={me} players={players} onAnswer={onAnswer} onStamp={onStamp} />
    </article>
  );
}
