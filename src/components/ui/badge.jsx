import React from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  neutral: 'bg-muted text-muted-foreground',
  brand: 'bg-brand-soft text-brand',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

const Badge = ({ className, variant = 'neutral', ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
      VARIANTS[variant] || VARIANTS.neutral,
      className,
    )}
    {...props}
  />
);
Badge.displayName = 'Badge';

export { Badge };
export default Badge;
