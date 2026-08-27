import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

// One overlay component with two presentations.
//
// `side="bottom"` (the default) is a bottom sheet — the right shape on a phone,
// because it opens under the thumb rather than in the middle of the screen where
// a one-handed grip cannot reach the buttons. `side="center"` is a conventional
// centre dialog, for the short confirm-or-cancel cases where a full sheet is
// more ceremony than the question deserves.
//
// Radix gives the focus trap, Esc-to-close, scroll locking and the labelling for
// free. Building this by hand is how modals end up leaving focus behind them on
// the page underneath — which is invisible with a mouse and a dead end with a
// keyboard or a screen reader.

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetOverlay = React.forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-40 bg-foreground/40 backdrop-blur-xs', className)}
      {...props}
    />
  );
});

const SIDES = {
  // Rounded top corners only, pinned to the bottom edge, and pb-safe so the
  // last button clears the iOS home indicator instead of sitting under it.
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t px-4 pt-4 pb-safe animate-slide-up',
  center:
    'left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-4 animate-pop-in',
};

const SheetContent = React.forwardRef(function SheetContent(
  { className, children, side = 'bottom', title, description, hideClose = false, ...props },
  ref,
) {
  return (
    <DialogPrimitive.Portal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 border-border bg-card text-card-foreground shadow-lg',
          'scroll-contain overflow-y-auto',
          SIDES[side] || SIDES.bottom,
          className,
        )}
        {...props}
      >
        {/* Radix warns loudly without a Title, and a dialog with no accessible
            name is announced as just "dialog". Callers that show their own
            heading pass `title` anyway and hide it visually. */}
        <DialogPrimitive.Title
          className={cn('font-display text-xl font-semibold', !title && 'sr-only')}
        >
          {title || 'Dialog'}
        </DialogPrimitive.Title>

        {description ? (
          <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">
            {title || 'Dialog'}
          </DialogPrimitive.Description>
        )}

        {side === 'bottom' && (
          // Grabber. Purely a visual affordance saying "this came from the
          // bottom and goes back there" — the sheet is not drag-dismissable.
          <div
            aria-hidden="true"
            className="mx-auto -mt-2 mb-3 h-1 w-10 rounded-full bg-border"
          />
        )}

        <div className={cn(title || description ? 'mt-4' : '')}>{children}</div>

        {!hideClose && (
          <DialogPrimitive.Close
            className="press absolute right-3 top-3 flex min-h-touch min-w-touch items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export { Sheet, SheetTrigger, SheetClose, SheetContent };
