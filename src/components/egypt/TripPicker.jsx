import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronRight } from 'lucide-react';
import Photo from './Photo';
import GuestNotice from '@/components/game/GuestNotice';
import { HIERO_STYLE } from './fonts';
import { SIGN_IN } from './PlayerSetup';
import { readLocal } from '@/hooks/useEgyptProgress';
import { stampCount, scores, mergeProgress, normalise } from '@/lib/egypt/progress';

// "Pick today's trip": every trip, with how far whoever is playing on this
// phone has got in each. This phone's saves first, then, signed in, the
// account's copy merged in, so a phone that has not opened a trip yet still
// shows what the family has done there.
export default function TripPicker({ trips, me, players, onPick }) {
  const { status } = useSession();
  const [saved, setSaved] = useState({});

  useEffect(() => {
    setSaved(Object.fromEntries(trips.map((t) => [t.id, readLocal(t.id)])));
    if (status !== 'authenticated') return undefined;
    let cancelled = false;
    for (const t of trips) {
      fetch(`/api/egypt/progress?trip=${encodeURIComponent(t.id)}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const remote = normalise(data?.progress);
          if (!cancelled && remote) setSaved((s) => ({ ...s, [t.id]: mergeProgress(remote, s[t.id]) }));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [trips, status]);

  const myName = players.find((p) => p.id === me)?.name || 'You';

  return (
    <div className="space-y-5">
      <div>
        <span className="text-3xl leading-none text-gold" style={HIERO_STYLE} aria-hidden="true">𓋹𓂀𓆣</span>
        <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-foreground">Pick today’s trip</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
          Each trip has its own route, stamps and passport, and everyone in the family plays every stop for themselves.
        </p>
      </div>

      <GuestNotice signInHref={SIGN_IN} action="Sign in">
        Not signed in, so your scores stay on this phone. To play with the family on other phones, sign in to the family account.
      </GuestNotice>

      <ul className="space-y-4">
        {trips.map((trip) => {
          const progress = saved[trip.id];
          const stamps = progress ? stampCount(progress, trip, me) : 0;
          const { team, board } = progress ? scores(progress, trip, players) : { team: 0, board: [] };
          const points = board.find((p) => p.id === me)?.points || 0;
          const status = !progress || team === 0
            ? `${trip.stops.length} stops to explore`
            : stamps >= trip.stops.length
              ? `${myName}: every stamp! ${points} points`
              : `${myName}: ${stamps} of ${trip.stops.length} stamps · ${points} points`;
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
                    {team > 0 && players.length > 1 && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">Family total {team} points</span>
                    )}
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
