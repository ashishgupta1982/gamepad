import React from 'react';
import { cn } from '@/lib/cn';

// Token-backed, and each variant keeps a border as well as a tint — colour is
// never the only thing distinguishing a warning from an error, which matters
// for anyone who cannot separate the two hues.
const VARIANTS = {
  default: 'border-border bg-card text-card-foreground',
  info: 'border-accent/30 bg-accent-soft text-foreground',
  success: 'border-success/30 bg-success/5 text-foreground',
  warning: 'border-warning/40 bg-warning/10 text-foreground',
  destructive: 'border-destructive/30 bg-destructive/5 text-foreground',
};

const Alert = ({ className, variant = 'default', ...props }) => (
  <div
    role="alert"
    className={cn(
      'relative w-full rounded-lg border p-4',
      VARIANTS[variant] || VARIANTS.default,
      className,
    )}
    {...props}
  />
);
Alert.displayName = 'Alert';

const AlertTitle = ({ className, ...props }) => (
  <h5 className={cn('mb-1 font-semibold leading-none tracking-tight', className)} {...props} />
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = ({ className, ...props }) => (
  <div className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
