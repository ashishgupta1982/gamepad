import { motion } from 'motion/react';
import { standings, TILES_PER_CARD } from '@/lib/bingoRules';
import { cn } from '@/lib/cn';
import { carTone } from './cars';
import FeedList from './FeedList';

// The finish line: the winner, a podium, and the trip's finds in the order
// they happened.
const PODIUM = [
  { place: 2, height: 'h-24', medal: '🥈' },
  { place: 1, height: 'h-32', medal: '🥇' },
  { place: 3, height: 'h-16', medal: '🥉' },
];

export default function ResultsScreen({ game, myCarId, onNewGame, onOpen }) {
  const cars = game.travelBingoConfig.cars || [];
  const winnerId = game.travelBingoConfig.winnerCarId;
  const winner = cars.find((c) => c.carId === winnerId);
  const board = standings(cars);
  const iWon = winnerId === myCarId;

  return (
    <div className="space-y-6 pb-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 14 }}
        className="toy-flat rounded-3xl bg-amber-400 p-6 text-center text-amber-950 [--toy-edge:theme(colors.amber.600)]"
      >
        <p className="text-6xl" aria-hidden="true">🏆</p>
        <p className="mt-2 font-display text-4xl font-extrabold">BINGO!</p>
        <p className="mt-1 text-lg font-bold">{iWon ? 'You got the full card first!' : `${winner?.name || 'Someone'} got the full card first`}</p>
      </motion.div>

      {board.length > 1 && (
        <div className="flex items-end justify-center gap-2" aria-label="Podium">
          {PODIUM.map(({ place, height, medal }, i) => {
            const entry = board[place - 1];
            if (!entry) return <div key={place} className="w-24" />;
            const tone = carTone(cars, entry.carId);
            return (
              <motion.div
                key={place}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + (2 - i) * 0.15, type: 'spring', stiffness: 220, damping: 16 }}
                className="flex w-24 flex-col items-center"
              >
                <span className="text-3xl" aria-hidden="true">{tone.emoji}</span>
                <span className="mt-1 w-full truncate text-center text-sm font-bold text-foreground">{entry.carId === myCarId ? 'You' : entry.name}</span>
                <span className="text-xs text-muted-foreground tnum">
                  {entry.found}/{TILES_PER_CARD}
                </span>
                <div className={cn('toy-flat mt-1 flex w-full items-start justify-center rounded-t-2xl pt-2 text-2xl', height, tone.solid, tone.edge)}>
                  {medal}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <section>
        <h2 className="mb-2 font-display text-xl font-extrabold text-foreground">The trip, find by find</h2>
        <FeedList cars={cars} myCarId={myCarId} onOpen={onOpen} oldestFirst limit={100} />
      </section>

      <button
        type="button"
        onClick={onNewGame}
        className="toy w-full rounded-2xl bg-game-bingo py-4 font-display text-xl font-extrabold text-white [--toy-edge:hsl(var(--game-bingo-deep))]"
      >
        New game
      </button>
    </div>
  );
}
