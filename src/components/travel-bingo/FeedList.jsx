import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { carTone } from './cars';

// Every find in the convoy, newest first. Also the trip's highlights reel at
// the end (ResultsScreen passes `oldestFirst`).
export function findsOf(cars) {
  const out = [];
  for (const car of cars || []) {
    for (const tile of car.card || []) {
      if (tile.found && tile.foundAt) out.push({ car, tile });
    }
  }
  return out.sort((a, b) => new Date(b.tile.foundAt) - new Date(a.tile.foundAt));
}

export default function FeedList({ cars, myCarId, onOpen, oldestFirst = false, limit = 40 }) {
  let finds = findsOf(cars);
  if (oldestFirst) finds = finds.reverse();

  if (!finds.length) {
    return <p className="rounded-3xl bg-white p-6 text-center text-muted-foreground shadow-sm">Nothing spotted yet. Eyes peeled!</p>;
  }

  return (
    <ul className="space-y-2">
      {finds.slice(0, limit).map(({ car, tile }) => {
        const tone = carTone(cars, car.carId);
        return (
          <motion.li key={`${car.carId}-${tile.tileId}`} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <button
              type="button"
              onClick={() => onOpen?.(car, tile)}
              className="press flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-sm"
            >
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl', tone.soft)} aria-hidden="true">
                {tone.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">
                  <span className={cn('font-bold', tone.text)}>{car.carId === myCarId ? 'You' : car.name}</span>
                  <span className="text-muted-foreground"> spotted </span>
                  <span className="font-bold text-foreground">{tile.label}</span>
                </span>
                {tile.caption && <span className="block truncate text-xs italic text-muted-foreground">&ldquo;{tile.caption}&rdquo;</span>}
              </span>
              <span className="flex shrink-0 flex-col items-end text-xs text-muted-foreground">
                {new Date(tile.foundAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {tile.comments?.length > 0 && (
                  <span className="mt-0.5 flex items-center gap-0.5">
                    <MessageCircle className="h-3 w-3" aria-hidden="true" />
                    {tile.comments.length}
                  </span>
                )}
              </span>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
