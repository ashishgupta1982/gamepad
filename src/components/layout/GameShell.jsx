import AppHeader from './AppHeader';
import useWakeLock from '@/hooks/useWakeLock';
import { cn } from '@/lib/cn';

// The layout every game screen sits in.
//
// Three regions, and the split is the whole point:
//
//   header   — compact, sticky, scrolls nothing away
//   body     — the only scrolling region
//   actions  — pinned to the bottom, inside the safe area
//
// Primary actions live in `actions` because this app is used one-handed on a
// phone. The current screens put Next Player / Submit / Start at the top, which
// on a modern handset is the part of the glass a thumb cannot reach without
// re-gripping — awkward on your own, worse when you are handing the device to
// someone else every turn.
//
// The bar is a sibling of the scroll area rather than `fixed`, so it cannot
// overlap the last row of content — the failure mode of every hand-rolled
// sticky footer, and one that only shows up on short screens.
export default function GameShell({
  title,
  showBack = true,
  onBack,
  actions,
  children,
  className,
  bodyClassName,
  // Games where the screen is read for long stretches without being touched —
  // a darts leg, a bingo card on a car journey — ask for the wake lock. Off by
  // default: holding it on a menu would be rude to the battery for no reason.
  keepAwake = false,
}) {
  useWakeLock(keepAwake);

  return (
    <div className={cn('flex min-h-dvh flex-col bg-background', className)}>
      <AppHeader showBack={showBack} onBack={onBack} title={title} />

      <main className={cn('scroll-contain flex-1 overflow-y-auto px-4 py-4', bodyClassName)}>
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>

      {actions && (
        <div className="border-t border-border bg-card/95 px-4 pt-3 pb-safe backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">{actions}</div>
        </div>
      )}
    </div>
  );
}
