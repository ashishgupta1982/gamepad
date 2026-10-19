import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Photo from './Photo';
import { HIERO_STYLE } from './fonts';
import { readLocal } from '@/hooks/useEgyptProgress';
import { stampCount, scores } from '@/lib/egypt/progress';

// "Pick today's trip": every trip, with how far this phone has got in each.
//
// The summaries come from this phone's saved progress. A signed-in family's
// account copy is only fetched once a trip is open (useEgyptProgress), so a
// second phone shows "Not started" here until then. Good enough for a list.
export default function TripPicker({ trips, onPick }) {
  const [saved, setSaved] = useState({});

  useEffect(() => {
    setSaved(Object.fromEntries(trips.map((t) => [t.id, readLocal(t.id)])));
  }, [trips]);

  return (
    <div className="space-y-5">
      <div>
        <span className="text-3xl leading-none text-gold" style={HIERO_STYLE} aria-hidden="true">𓋹𓂀𓆣</span>
        <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-foreground">Pick today’s trip</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
          Each trip has its own route, stamps and passport. Your explorers come with you.
        </p>
      </div>

      <ul className="space-y-4">
        {trips.map((trip) => {
          const progress = saved[trip.id];
          const stamps = progress ? stampCount(progress, trip) : 0;
          const points = progress ? scores(progress, trip).team : 0;
          const status = !progress
            ? `${trip.stops.length} stops to explore`
            : stamps >= trip.stops.length
              ? `Every stamp! ${points} points`
              : `${stamps} of ${trip.stops.length} stamps · ${points} points`;
          return (
            <li key={trip.id}>
              <button
                type="button"
                onClick={() => onPick(trip.id)}
                className="press block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="relative block">
                  <Photo id={trip.cover} fill eager className="aspect-[16/9]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-lapis via-lapis/40 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold">{trip.place}</span>
                    <span className="mt-0.5 block font-display text-2xl font-semibold leading-tight">{trip.name}</span>
                  </span>
                </span>
                <span className="flex items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] leading-snug text-foreground">{trip.tagline}</span>
                    <span className="mt-1 block text-sm font-semibold text-game-egypt">{status}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
