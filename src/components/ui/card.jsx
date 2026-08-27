import React from 'react';
import { cn } from '@/lib/cn';

// Padding is p-4 rather than the p-6 this had before. On a 375px phone p-6 on
// both sides spends a quarter of the width on nothing, which is how the old
// screens ended up feeling cramped despite having space.
const Card = ({ className, interactive = false, ...props }) => (
  <div
    className={cn(
      'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
      // `interactive` is for a whole card that is itself a button or link. It
      // uses the same press-and-spring as Button rather than the old
      // hover:-translate-y, which did nothing on touch — where this app lives.
      interactive && 'press cursor-pointer hover:border-border/70 hover:shadow-md',
      className,
    )}
    {...props}
  />
);
Card.displayName = 'Card';

const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-4', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

const CardTitle = ({ className, ...props }) => (
  <h3
    className={cn('font-display text-lg font-semibold leading-tight tracking-tight', className)}
    {...props}
  />
);
CardTitle.displayName = 'CardTitle';

const CardDescription = ({ className, ...props }) => (
  <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

const CardContent = ({ className, ...props }) => (
  <div className={cn('p-4 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center gap-2 p-4 pt-0', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
