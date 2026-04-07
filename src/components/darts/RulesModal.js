import React from 'react';

export default function RulesModal({ mode, onClose }) {
  if (!mode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 rounded-t-2xl bg-gradient-to-r ${mode.color} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{mode.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{mode.name}</h2>
                <p className="text-sm text-white/80">How to Play</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center
                         hover:bg-white/30 transition-colors text-lg font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Rules */}
        <div className="p-4">
          <ol className="space-y-3">
            {mode.rules?.map((rule, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center
                                 text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-700 leading-relaxed">{rule}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl
                       hover:bg-slate-200 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
