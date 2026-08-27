import React from 'react';
import { CRICKET_TARGETS, CRICKET_TARGET_LABELS } from '@/data/dartsConstants';

export default function CricketBoard({ players, cricketMarks, cricketPoints, currentPlayerIndex }) {
  const getMarkSymbol = (count) => {
    if (count === 0) return '';
    if (count === 1) return '/';
    if (count === 2) return 'X';
    return '\u2A02'; // circled X (closed)
  };

  return (
    <div className="bg-card rounded-2xl shadow-md border border-border overflow-hidden">
      {/* Header row */}
      <div className="grid gap-0" style={{ gridTemplateColumns: `1fr repeat(${players.length}, 1fr)` }}>
        <div className="p-2 bg-muted border-b border-r border-border" />
        {players.map((player, idx) => (
          <div
            key={idx}
            className={`p-2 text-center border-b border-border text-xs font-bold truncate ${
              idx === currentPlayerIndex ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
            }`}
          >
            {player.name}
          </div>
        ))}
      </div>

      {/* Target rows */}
      {CRICKET_TARGETS.map((target, tIdx) => (
        <div
          key={target}
          className="grid gap-0"
          style={{ gridTemplateColumns: `1fr repeat(${players.length}, 1fr)` }}
        >
          <div className="p-2.5 text-center font-bold text-foreground text-sm border-r border-border bg-muted">
            {CRICKET_TARGET_LABELS[target]}
          </div>
          {players.map((_, pIdx) => {
            const marks = cricketMarks?.[pIdx]?.[tIdx] || 0;
            const isClosed = marks >= 3;
            return (
              <div
                key={pIdx}
                className={`p-2.5 text-center text-lg font-bold border-r border-border ${
                  isClosed ? 'text-success bg-success/10' : marks > 0 ? 'text-accent' : 'text-border'
                }`}
              >
                {getMarkSymbol(marks)}
              </div>
            );
          })}
        </div>
      ))}

      {/* Points row */}
      <div className="grid gap-0 border-t-2 border-border" style={{ gridTemplateColumns: `1fr repeat(${players.length}, 1fr)` }}>
        <div className="p-2.5 text-center font-bold text-muted-foreground text-xs uppercase border-r border-border bg-muted">
          Points
        </div>
        {players.map((_, pIdx) => (
          <div
            key={pIdx}
            className={`p-2.5 text-center font-bold text-lg ${
              pIdx === currentPlayerIndex ? 'text-accent bg-accent/10' : 'text-foreground'
            }`}
          >
            {cricketPoints?.[pIdx] || 0}
          </div>
        ))}
      </div>
    </div>
  );
}
