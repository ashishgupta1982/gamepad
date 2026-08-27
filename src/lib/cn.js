import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes so a caller's className genuinely overrides the
// component's own, rather than both landing in the class list and letting CSS
// source order decide. `<Button className="bg-accent">` should be accent, not a
// coin toss against the variant's `bg-brand`.
//
// clsx and tailwind-merge were already dependencies but nothing imported them —
// every component concatenated class strings by hand.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
