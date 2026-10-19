import { HIERO_STYLE } from './fonts';
import { cn } from '@/lib/cn';

// A stop's stamp: its hieroglyph in a gold seal once earned, a faint outline
// before. `label` (the stop number) shows on an unearned stamp so the route
// still reads in order.
const SIZES = {
  sm: 'h-10 w-10 text-xl',
  md: 'h-14 w-14 text-2xl',
  lg: 'h-20 w-20 text-4xl',
};

export default function Stamp({ glyph, earned, size = 'md', label, className }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full',
        SIZES[size] || SIZES.md,
        earned
          ? 'bg-gradient-to-br from-gold to-game-egypt text-lapis shadow-md ring-2 ring-gold/60'
          : 'border-2 border-dashed border-gold/60 bg-papyrus text-papyrus-foreground/40',
        className,
      )}
      aria-label={earned ? 'Stamp earned' : 'Stamp not yet earned'}
      role="img"
    >
      {earned || !label ? (
        <span style={HIERO_STYLE} aria-hidden="true">{glyph}</span>
      ) : (
        <span className="font-display text-lg font-semibold tnum" aria-hidden="true">{label}</span>
      )}
    </span>
  );
}
