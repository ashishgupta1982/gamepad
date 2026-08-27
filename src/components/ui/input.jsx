import React from 'react';
import { cn } from '@/lib/cn';

// text-base, not text-sm.
//
// iOS Safari zooms the whole page when a focused input's font-size is under
// 16px, and then does not zoom back out. On a game screen that leaves the board
// half off-screen mid-turn. Any smaller-looking input must shrink some other
// way — padding, width — never font-size.
const Input = React.forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'min-h-touch w-full rounded-lg border-2 border-border bg-card px-4 text-base text-foreground',
        'placeholder:text-muted-foreground/70',
        'transition-colors duration-200',
        'focus:border-brand focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
});

// Player names, room codes and the like. `inputMode="numeric"` asks for the
// number pad without the strictness of type="number", which brings spinners and
// rejects leading zeros — wrong for a 6-character room code.
const CodeInput = React.forwardRef(function CodeInput({ className, ...props }, ref) {
  return (
    <Input
      ref={ref}
      autoCapitalize="characters"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      className={cn('text-center font-display text-2xl tracking-[0.3em] tnum', className)}
      {...props}
    />
  );
});

const Label = ({ className, ...props }) => (
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  <label className={cn('mb-1.5 block text-sm font-semibold text-foreground', className)} {...props} />
);
Label.displayName = 'Label';

export { Input, CodeInput, Label };
export default Input;
