import { motion } from 'motion/react';
import { foundCount, TILES_PER_CARD } from '@/lib/bingoRules';
import { cn } from '@/lib/cn';
import { carTone } from './cars';

// The scoreboard as a race: every car on its own lane, driving towards the
// flag one find at a time.
export default function RaceTrack({ cars, myCarId }) {
  return (
    <div className="toy-flat rounded-3xl bg-slate-700 p-3 [--toy-edge:theme(colors.slate.900)]">
      <ul className="space-y-2">
        {cars.map((car) => {
          const tone = carTone(cars, car.carId);
          const found = foundCount(car.card);
          const progress = found / TILES_PER_CARD;
          const mine = car.carId === myCarId;
          return (
            <li key={car.carId} className="flex items-center gap-2">
              <span
                className={cn(
                  'w-20 shrink-0 truncate rounded-full px-2 py-0.5 text-center text-xs font-bold',
                  mine ? tone.solid : 'bg-white/15 text-white',
                )}
              >
                {mine ? 'You' : car.name}
              </span>
              {/* The lane: tarmac with a dashed white line, the flag at the end. */}
              <div className="relative h-9 flex-1 rounded-xl bg-slate-800">
                <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-white/25" />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-lg" aria-hidden="true">🏁</span>
                {/* The car drives along an inner strip that stops short of the
                    flag, so a full card parks it just before the line. */}
                <div className="absolute inset-y-0 left-4 right-9">
                  <motion.span
                    className="absolute top-1/2 text-2xl leading-none"
                    style={{ y: '-50%', x: '-50%', scaleX: -1 }}
                    initial={false}
                    animate={{ left: `${progress * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    aria-hidden="true"
                  >
                    {tone.emoji}
                  </motion.span>
                </div>
              </div>
              <span className="w-9 shrink-0 text-right font-display text-lg font-extrabold text-white tnum">
                {found}
                <span className="text-xs font-bold text-white/60">/{TILES_PER_CARD}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
