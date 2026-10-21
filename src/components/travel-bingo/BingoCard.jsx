import { AnimatePresence, motion } from 'motion/react';
import { Check, MessageCircle } from 'lucide-react';
import { tilesInLines } from '@/lib/bingoRules';
import { cn } from '@/lib/cn';

// A 3×3 card of chunky tiles. On your own card one tap stamps a tile found; a
// found tile opens its details (caption, comments, undo) instead, so a second
// tap can never un-find something by accident. Tiles in a finished line glow.
export default function BingoCard({ card, onTileTap, compact = false }) {
  const lit = tilesInLines(card);

  return (
    <div className={cn('grid grid-cols-3', compact ? 'gap-1.5' : 'gap-2.5')}>
      {card.map((tile) => (
        <Tile key={tile.tileId} tile={tile} lit={lit.has(tile.tileId)} compact={compact} onTap={() => onTileTap?.(tile)} />
      ))}
    </div>
  );
}

function Tile({ tile, lit, compact, onTap }) {
  const comments = tile.comments?.length || 0;
  return (
    <motion.button
      type="button"
      onClick={onTap}
      layout={false}
      animate={tile.found ? { rotate: [0, -3, 2, 0] } : { rotate: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'toy relative flex aspect-square flex-col items-center justify-center overflow-hidden text-center',
        compact ? 'rounded-xl p-1' : 'rounded-2xl p-2',
        lit
          ? 'bg-amber-400 text-amber-950 [--toy-edge:theme(colors.amber.600)]'
          : tile.found
            ? 'bg-game-bingo text-white [--toy-edge:hsl(var(--game-bingo-deep))]'
            : 'bg-white text-foreground [--toy-edge:hsl(var(--border))]',
      )}
      aria-label={`${tile.label}${tile.found ? ', found' : ''}`}
    >
      {!compact && !tile.found && tile.category && (
        <span className="absolute inset-x-1 top-1.5 truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {tile.category}
        </span>
      )}
      <span
        className={cn(
          'relative z-10 font-display font-bold leading-tight',
          compact ? 'line-clamp-3 text-[10px]' : 'line-clamp-4 text-[15px]',
          tile.found && !compact && 'opacity-90',
        )}
      >
        {tile.label}
      </span>

      {/* The stamp: slams down from above, slightly askew, like a real one. */}
      <AnimatePresence>
        {tile.found && (
          <motion.span
            key="stamp"
            initial={{ scale: 2.4, opacity: 0, rotate: -30 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 18 }}
            className={cn(
              'pointer-events-none absolute flex items-center justify-center rounded-full border-4',
              compact ? 'h-8 w-8 border-2' : 'h-16 w-16',
              lit ? 'border-amber-950/25 text-amber-950/30' : 'border-white/35 text-white/40',
            )}
            aria-hidden="true"
          >
            <Check className={compact ? 'h-5 w-5' : 'h-10 w-10'} strokeWidth={4} />
          </motion.span>
        )}
      </AnimatePresence>

      {!compact && comments > 0 && (
        <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded-full bg-black/15 px-1.5 text-[10px] font-bold">
          <MessageCircle className="h-3 w-3" aria-hidden="true" />
          {comments}
        </span>
      )}
    </motion.button>
  );
}
