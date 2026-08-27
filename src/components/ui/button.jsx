import React from 'react';
import { cn } from '@/lib/cn';

// Variants map onto the design tokens rather than raw palette classes, so a
// brand change is one line in globals.css. The previous version hardcoded
// blue-600, gray-100, red-600 and so on — skeleton defaults that had nothing to
// do with GamePad's actual identity and that nobody ever revisited.
const VARIANTS = {
  primary: 'bg-brand text-brand-foreground shadow-sm hover:bg-brand/90',
  accent: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent/90',
  secondary: 'bg-muted text-foreground hover:bg-border',
  outline: 'border-2 border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
  success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
  link: 'text-brand underline-offset-4 hover:underline',
};

// Every size except `xs` clears the 44px minimum touch target. `xs` exists for
// dense spots and deliberately does not — use it only where a larger parent
// already provides the tap area.
const SIZES = {
  xs: 'h-8 px-3 text-xs gap-1.5',
  sm: 'min-h-touch px-4 text-sm gap-2',
  md: 'min-h-touch px-5 text-base gap-2',
  lg: 'min-h-[52px] px-6 text-lg gap-2.5',
  icon: 'min-h-touch min-w-touch p-0',
};

const Button = React.forwardRef(function Button(
  { className, children, variant = 'primary', size = 'md', fullWidth = false, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      // `press` is the tactile squash-and-spring from globals.css, applied here
      // rather than at each call site so every button in the app feels the same
      // under a thumb. That consistency is the whole point of the direction.
      //
      // Unknown variant/size names fall back rather than rendering unstyled, so
      // an un-migrated call site degrades to a sensible button instead of a
      // transparent rectangle.
      className={cn(
        'press inline-flex items-center justify-center rounded-lg font-semibold',
        'transition-colors duration-200',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
export { Button };
