import { Check, ChevronRight, CloudDownload, Loader2, Star, Users } from 'lucide-react';
import Photo from './Photo';
import Stamp from './Stamp';
import { stopStatus, stampCount, rankFor, scores } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// The trip screen: where you are, how the family is doing, and the route.
//
// The stops are a suggested route, not a locked path. A museum on a busy day
// does not let you go in order, so every stop is open from the start and the
// route just says where the next unstamped one is.
export default function TripHome({ trip, progress, offline, onOpenStop, onOpenPassport, onEditPlayers }) {
  const stamps = stampCount(progress, trip);
  const rank = rankFor(stamps);
  const { team } = scores(progress, trip);
  const next = trip.stops.find((s) => !stopStatus(progress, s).stamped);

  return (
    <div className="space-y-6">
      <section className="relative -mx-4 -mt-4 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-2xl">
        <Photo id={trip.cover} fill eager className="aspect-[4/3] sm:aspect-[16/9]" />
        <div className="absolute inset-0 bg-gradient-to-t from-lapis via-lapis/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{trip.place}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight">{trip.name}</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/90">{trip.intro}</p>
        </div>
      </section>

      <button
        type="button"
        onClick={onOpenPassport}
        className="press flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-game-egypt to-game-egypt-deep p-4 text-left text-white shadow-lg"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-gold/70">
          <span className="font-display text-2xl font-bold tnum">{stamps}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-gold">Expedition passport</span>
          <span className="block font-display text-xl font-semibold">{rank.title}</span>
          <span className="block text-sm text-white/85">
            {stamps} of {trip.stops.length} stamps · <span className="tnum">{team}</span> points
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-white/80" aria-hidden="true" />
      </button>

      <div className="flex flex-wrap items-center gap-2">
        {progress.players.map((p) => (
          <span key={p.id} className="rounded-full bg-papyrus px-3 py-1 text-sm font-medium text-papyrus-foreground">
            {p.name}
          </span>
        ))}
        <button
          type="button"
          onClick={onEditPlayers}
          className="press inline-flex min-h-touch items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-lapis hover:bg-muted"
        >
          <Users className="h-4 w-4" aria-hidden="true" /> Edit
        </button>
      </div>

      {offline.available && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CloudDownload className="mt-0.5 h-5 w-5 shrink-0 text-lapis" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Get ready for the museum</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {offline.done
                  ? 'All the photos are saved on this phone, so the stops work without signal.'
                  : 'Save all the photos on this phone now, on Wi-Fi, so the stops still work if there’s no signal inside.'}
              </p>
              {offline.error && <p className="mt-1 text-sm text-destructive">{offline.error}</p>}
            </div>
          </div>
          {!offline.done && (
            <button
              type="button"
              onClick={offline.getReady}
              disabled={offline.busy}
              className="press mt-3 flex min-h-touch w-full items-center justify-center gap-2 rounded-lg bg-lapis px-4 text-sm font-semibold text-white disabled:opacity-70"
            >
              {offline.busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {offline.busy ? `Saving photos… ${offline.saved} of ${offline.total}` : `Save ${offline.total - offline.saved} photos`}
            </button>
          )}
        </div>
      )}

      <section aria-labelledby="route-heading">
        <h2 id="route-heading" className="mb-3 font-display text-xl font-semibold text-foreground">
          The route
        </h2>
        <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-0.5 before:bg-gold/40">
          {trip.stops.map((stop, i) => {
            const status = stopStatus(progress, stop);
            const isNext = next?.id === stop.id;
            return (
              <li key={stop.id} className="relative">
                <button
                  type="button"
                  onClick={() => onOpenStop(stop.id)}
                  className={cn(
                    'press flex w-full items-center gap-3 rounded-2xl border bg-card p-2 pr-3 text-left shadow-sm transition-shadow hover:shadow-md',
                    isNext ? 'border-gold ring-2 ring-gold/40' : 'border-border',
                  )}
                >
                  <span className="relative z-10 shrink-0">
                    <Stamp glyph={stop.stamp} earned={status.stamped} size="md" label={`${i + 1}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Stop {i + 1}{isNext ? ' · up next' : ''}
                    </span>
                    <span className="block truncate font-display text-base font-semibold text-foreground">{stop.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{stop.where}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs">
                      {status.stamped ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-success">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Stamped · {status.correct}/{status.total}
                        </span>
                      ) : status.started ? (
                        <span className="font-semibold text-game-egypt">In progress</span>
                      ) : null}
                      {status.quest && (
                        <span className="inline-flex items-center gap-1 font-semibold text-gold">
                          <Star className="h-3.5 w-3.5 fill-gold" aria-hidden="true" /> Quest
                        </span>
                      )}
                    </span>
                  </span>
                  <Photo id={stop.photos[0]} fill className="h-16 w-16 shrink-0 rounded-xl" />
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
