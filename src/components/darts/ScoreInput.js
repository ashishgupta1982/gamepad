import React, { useState } from 'react';
import { MAX_TURN_SCORE } from '@/data/dartsConstants';

export default function ScoreInput({
  currentPlayer,
  remainingScore,
  onSubmit,
  onUndo,
  canUndo,
  checkoutSuggestion
}) {
  const [value, setValue] = useState('');

  const numValue = parseInt(value) || 0;
  const wouldBust = numValue > remainingScore || (remainingScore - numValue === 1) || numValue > MAX_TURN_SCORE;
  const isCheckout = numValue === remainingScore && numValue >= 2;

  const handleDigit = (digit) => {
    const newVal = value + digit;
    if (parseInt(newVal) <= MAX_TURN_SCORE) {
      setValue(newVal);
    }
  };

  const handleBackspace = () => {
    setValue(value.slice(0, -1));
  };

  const handleSubmit = () => {
    if (value === '') return;
    const score = parseInt(value) || 0;
    if (score > MAX_TURN_SCORE) return;
    onSubmit(score);
    setValue('');
  };

  const handleNoScore = () => {
    onSubmit(0);
    setValue('');
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* Current player + remaining */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-sm font-bold text-slate-600">{currentPlayer}</div>
        <div className="text-sm">
          <span className="text-slate-400">Remaining: </span>
          <span className="font-bold text-red-500 text-lg">{remainingScore}</span>
        </div>
      </div>

      {/* Score display */}
      <div className={`text-center py-4 mb-3 rounded-2xl border-2 transition-colors ${
        wouldBust && value ? 'bg-red-50 border-red-300' :
        isCheckout ? 'bg-green-50 border-green-300' :
        'bg-white border-slate-200'
      }`}>
        <div className={`text-5xl font-bold font-mono tracking-wider min-h-[60px] flex items-center justify-center ${
          wouldBust && value ? 'text-red-500' :
          isCheckout ? 'text-green-600' :
          'text-slate-800'
        }`}>
          {value || <span className="text-slate-300">0</span>}
        </div>
        {wouldBust && value && (
          <div className="text-red-500 text-sm font-bold mt-1">BUST!</div>
        )}
        {isCheckout && (
          <div className="text-green-600 text-sm font-bold mt-1">CHECKOUT!</div>
        )}
      </div>

      {/* Checkout suggestion */}
      {checkoutSuggestion && !value && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-center">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Checkout</div>
          <div className="text-amber-800 font-bold text-base tracking-wide">
            {checkoutSuggestion.join(' → ')}
          </div>
        </div>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(digit => (
          <button
            key={digit}
            onClick={() => handleDigit(String(digit))}
            className="h-14 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xl
                       active:bg-slate-100 active:scale-95 transition-all shadow-sm
                       hover:bg-slate-50 select-none"
            style={{ fontSize: '20px' }}
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="h-14 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xl
                     active:bg-slate-200 active:scale-95 transition-all select-none"
        >
          ⌫
        </button>
        <button
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xl
                     active:bg-slate-100 active:scale-95 transition-all shadow-sm select-none"
          style={{ fontSize: '20px' }}
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={!value || (wouldBust && value)}
          className={`h-14 rounded-xl font-bold text-xl transition-all active:scale-95 select-none ${
            !value || (wouldBust && value)
              ? 'bg-slate-100 text-slate-300 border border-slate-200'
              : isCheckout
                ? 'bg-green-500 text-white shadow-md hover:bg-green-600'
                : 'bg-red-500 text-white shadow-md hover:bg-red-600'
          }`}
        >
          ✓
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleNoScore}
          className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl
                     hover:bg-slate-200 transition-all active:scale-95 text-sm"
        >
          No Score
        </button>
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 py-3 font-semibold rounded-xl transition-all active:scale-95 text-sm ${
            canUndo
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-slate-50 text-slate-300'
          }`}
        >
          ↩ Undo Last
        </button>
      </div>
    </div>
  );
}
