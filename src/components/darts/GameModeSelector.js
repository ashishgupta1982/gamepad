import React from 'react';
import { GAME_MODES } from '@/data/dartsConstants';

export default function GameModeSelector({ onSelectMode, onBack }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-5 text-foreground">
        Choose Game Mode
      </h2>

      <div className="space-y-3">
        {GAME_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            className="w-full text-left p-4 rounded-2xl bg-card shadow-md border border-border
                       hover:shadow-lg hover:scale-[1.01] transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-2xl shadow-sm`}>
                {mode.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground text-lg">{mode.name}</div>
                <div className="text-sm text-muted-foreground leading-snug">{mode.desc}</div>
              </div>
              <svg className="w-5 h-5 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
