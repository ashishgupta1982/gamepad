import React from 'react';
import { CHECKOUT_CHART, BOGEY_NUMBERS, MAX_CHECKOUT } from '@/data/dartsConstants';

export function getCheckout(remaining) {
  if (remaining > MAX_CHECKOUT || remaining < 2) return null;
  if (BOGEY_NUMBERS.includes(remaining)) return null;
  return CHECKOUT_CHART[remaining] || null;
}

export default function CheckoutSuggestion({ remaining }) {
  if (remaining > MAX_CHECKOUT || remaining < 2) return null;

  const checkout = getCheckout(remaining);

  if (!checkout) {
    if (BOGEY_NUMBERS.includes(remaining)) {
      return (
        <div className="bg-muted border border-border rounded-xl px-3 py-2 text-center">
          <div className="text-xs text-muted-foreground">No checkout on {remaining}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-xl px-3 py-2 text-center">
      <div className="text-[11px] font-bold text-warning uppercase tracking-wide mb-0.5">
        Checkout ({remaining})
      </div>
      <div className="text-warning font-bold text-base tracking-wide">
        {checkout.join(' → ')}
      </div>
    </div>
  );
}
