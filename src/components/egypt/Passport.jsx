import { useState } from 'react';
import { Crown, Star } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Stamp from './Stamp';
import { stopStatus, stampCount, rankFor, scores, RANKS } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// The expedition passport: every stamp, the family's rank, and who is winning.
//
// The rank is the family's (by stamps), the points are each person's. That
// split is on purpose: the whole family climbs to Pharaoh together, and the
// leaderboard is the bit to argue about over dinner.
export default function Passport({ open, onOpenChange, trip, progress, onOpenStop, onReset }) {
  const [confirming, setConfirming] = useState(false);
  const stamps = stampCount(progress, trip);
  const rank = rankFor(stamps);
  const nextRank = RANKS.find((r) => r.stamps > stamps);
  const { team, board } = scores(progress, trip);

  return (
    <Sheet open={open} onOpenChange={(o) => { setConfirming(false); onOpenChange(o); }}>
      <SheetContent title="Expedition passport" description={`${trip.name} · ${team} points`}>
        <div className="rounded-2xl bg-gradient-to-br from-game-egypt to-game-egypt-deep p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">Your family’s rank</p>
          <p className="mt-0.5 flex items-center gap-2 font-display text-2xl font-semibold">
            <Crown className="h-6 w-6 text-gold" aria-hidden="true" /> {rank.title}
          </p>
          <p className="mt-1 text-sm text-white/85">
            {nextRank
              ? `${nextRank.stamps - stamps} more stamp${nextRank.stamps - stamps === 1 ? '' : 's'} to ${nextRank.title}`
              : 'Every stamp collected. Long live the pharaohs!'}
          </p>
        </div>

        <ul className="mt-4 grid grid-cols-3 gap-3">
          {trip.stops.map((stop, i) => {
            const status = stopStatus(progress, stop);
            return (
              <li key={stop.id}>
                <button
                  type="button"
                  onClick={() => { onOpenChange(false); onOpenStop(stop.id); }}
                  className="press flex w-full flex-col items-center gap-1.5 rounded-xl p-2 text-center hover:bg-muted"
                >
                  <span className="relative">
                    <Stamp glyph={stop.stamp} earned={status.stamped} size="lg" label={`${i + 1}`} />
                    {status.quest && (
                      <Star className="absolute -right-1 -top-1 h-5 w-5 fill-gold text-gold drop-shadow" aria-label="Quest found" />
                    )}
                  </span>
                  <span className={cn('text-xs leading-tight', status.stamped ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                    {stop.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <h3 className="mt-5 font-display text-lg font-semibold text-foreground">Leaderboard</h3>
        <ol className="mt-2 space-y-1.5">
          {board.map((p, i) => (
            <li key={p.id} className={cn('flex items-center gap-3 rounded-lg px-3 py-2', i === 0 && p.points > 0 ? 'bg-gold/20' : 'bg-muted/60')}>
              <span className="w-5 text-center font-display font-semibold tnum text-muted-foreground">{i + 1}</span>
              <span className="flex-1 font-semibold text-foreground">{p.name}</span>
              <span className="font-display font-semibold tnum text-foreground">{p.points}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          10 points for a right answer, 20 for a photo quest. Ticking off “look closely” adds to the family total ({team}).
        </p>

        <div className="mt-6 border-t border-border pt-4">
          {confirming ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground">Start the whole trip again? Every stamp and point goes.</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="press min-h-touch rounded-lg border-2 border-border text-sm font-semibold">
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => { setConfirming(false); onOpenChange(false); onReset(); }}
                  className="press min-h-touch rounded-lg bg-destructive text-sm font-semibold text-white"
                >
                  Start again
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="press min-h-touch text-sm font-semibold text-muted-foreground hover:text-destructive">
              Start the trip again
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
