import { Crown, Star } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import Stamp from './Stamp';
import { stopStatus, familyStampCount, rankFor, scores, RANKS, POINTS } from '@/lib/egypt/progress';
import { cn } from '@/lib/cn';

// The expedition passport: the family's rank, this player's stamps, and who is
// winning.
//
// The rank is the family's: a stop counts once its questions have all been
// answered by somebody (progress.js familyStamped), so the whole family climbs
// to Pharaoh together. The stamps and points are each person's, and the
// leaderboard is the bit to argue about over dinner.
//
// There is no "start again". Several phones merge into one record, which only
// ever adds; a reset on one phone would come straight back from the others.
export default function Passport({ open, onOpenChange, trip, progress, me, players, onOpenStop }) {
  const familyStamps = familyStampCount(progress, trip);
  const rank = rankFor(familyStamps);
  const nextRank = RANKS.find((r) => r.stamps > familyStamps);
  const { team, board } = scores(progress, trip, players);
  const myName = players.find((p) => p.id === me)?.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Expedition passport" description={`${trip.name} · the family has ${team} points`}>
        <div className="rounded-2xl bg-gradient-to-br from-game-egypt to-game-egypt-deep p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">Your family’s rank</p>
          <p className="mt-0.5 flex items-center gap-2 font-display text-2xl font-semibold">
            <Crown className="h-6 w-6 text-gold" aria-hidden="true" /> {rank.title}
          </p>
          <p className="mt-1 text-sm text-white/85">
            {nextRank
              ? `${nextRank.stamps - familyStamps} more stop${nextRank.stamps - familyStamps === 1 ? '' : 's'} to ${nextRank.title}`
              : 'Every stop done. Long live the pharaohs!'}
          </p>
        </div>

        <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{myName ? `${myName}’s stamps` : 'Your stamps'}</h3>
        <ul className="mt-2 grid grid-cols-3 gap-3">
          {trip.stops.map((stop, i) => {
            const status = stopStatus(progress, stop, me);
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
            <li
              key={p.id}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2',
                i === 0 && p.points > 0 ? 'bg-gold/20' : 'bg-muted/60',
                p.id === me && 'ring-2 ring-gold/60',
              )}
            >
              <span className="w-5 text-center font-display font-semibold tnum text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{p.name}</span>
              <span className="text-xs text-muted-foreground tnum">
                {p.stamps} stamp{p.stamps === 1 ? '' : 's'}
              </span>
              <span className="w-12 text-right font-display font-semibold tnum text-foreground">{p.points}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          Everyone plays every stop for themselves: {POINTS.correct} points for a right answer, {POINTS.quest} for a photo
          quest and {POINTS.look} for each thing you spot. Family total: {team}.
        </p>
      </SheetContent>
    </Sheet>
  );
}
