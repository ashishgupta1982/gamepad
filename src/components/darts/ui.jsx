import { ArrowLeft } from 'lucide-react';
import MuteButton from '@/components/arcade/MuteButton';
import { label } from '@/lib/darts/board';
import { cn } from '@/lib/cn';
import { SHOW_FONT } from '@/components/quiz-show/ui';

// The darts corner (REDESIGN-PLAN.md, Phase 4): the games room's dartboard
// wall, lamp-lit, behind every darts screen. The art is Higgsfield Seedream 4.5
// (job ac2ea7c7, 2026-10-21), drawn with the wall left empty so the board sits
// in the pool of light. The show font is the Quiz's, so the arcade reads as one.

export { SHOW_FONT };

export function Oche({ children, dim = 0.5 }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#0d2b2d] text-white">
      <img src="/darts/wall.webp" alt="" aria-hidden="true" className="pointer-events-none fixed inset-0 h-full w-full select-none object-cover" />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ background: `linear-gradient(to bottom, rgba(6,26,28,${dim * 0.5}) 0%, rgba(6,26,28,${dim}) 40%, rgba(6,26,28,${Math.min(0.94, dim + 0.35)}) 100%)` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Back on the left, the title in the middle, the sound switch on the right. */
export function TopBar({ onBack, backLabel = 'Back', children, right }) {
  return (
    <div className="flex items-center gap-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button type="button" onClick={onBack} aria-label={backLabel} className="toy flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#16302f] [--toy-edge:rgba(0,0,0,0.3)]">
        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1 truncate text-center text-lg leading-tight" style={SHOW_FONT}>
        {children}
      </div>
      {right}
      <span className="shrink-0 rounded-full bg-white/85 text-[#16302f]">
        <MuteButton />
      </span>
    </div>
  );
}

/** One of the visit's three darts: empty, a hit, or a miss. */
export function DartSlot({ dart, active }) {
  const text = dart ? (dart.t != null ? dart.t : label(dart)) : '';
  return (
    <span
      className={cn(
        'flex h-11 min-w-[3.25rem] items-center justify-center rounded-xl px-2 text-xl tnum transition-colors',
        dart ? (dart.n || dart.t != null ? 'bg-amber-300 text-amber-950' : 'bg-white/20 text-white/70') : 'border-2 border-dashed border-white/35 text-white/40',
        active && !dart && 'border-amber-300',
      )}
      style={SHOW_FONT}
    >
      {text}
    </span>
  );
}

/** Killer lives. */
export function Hearts({ lives, of }) {
  return (
    <span className="flex gap-0.5" aria-label={`${lives} of ${of} lives`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} aria-hidden="true" className={cn('text-lg leading-none', i < lives ? '' : 'opacity-30 grayscale')}>
          ❤️
        </span>
      ))}
    </span>
  );
}

/** A chunky choice chip for setup. */
export function Chip({ on, onClick, children, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'toy min-h-[48px] rounded-2xl px-4 text-xl',
        on ? 'bg-amber-300 text-amber-950 [--toy-edge:theme(colors.amber.600)]' : 'bg-white/90 text-[#16302f] [--toy-edge:rgba(0,0,0,0.3)]',
        className,
      )}
      style={SHOW_FONT}
    >
      {children}
    </button>
  );
}

/** The big toy button. */
export function BigButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn('toy flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 text-2xl text-amber-950 [--toy-edge:theme(colors.amber.600)] disabled:opacity-50', className)}
      style={SHOW_FONT}
      {...props}
    >
      {children}
    </button>
  );
}
