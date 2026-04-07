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
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      {/* Header row */}
      <div className="grid gap-0" style={{ gridTemplateColumns: `1fr repeat(${players.length}, 1fr)` }}>
        <div className="p-2 bg-slate-50 border-b border-r border-slate-200" />
        {players.map((player, idx) => (
          <div
            key={idx}
            className={`p-2 text-center border-b border-slate-200 text-xs font-bold truncate ${
              idx === currentPlayerIndex ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'
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
          <div className="p-2.5 text-center font-bold text-slate-700 text-sm border-r border-slate-100 bg-slate-50">
            {CRICKET_TARGET_LABELS[target]}
          </div>
          {players.map((_, pIdx) => {
            const marks = cricketMarks?.[pIdx]?.[tIdx] || 0;
            const isClosed = marks >= 3;
            return (
              <div
                key={pIdx}
                className={`p-2.5 text-center text-lg font-bold border-r border-slate-50 ${
                  isClosed ? 'text-green-600 bg-green-50' : marks > 0 ? 'text-blue-600' : 'text-slate-300'
                }`}
              >
                {getMarkSymbol(marks)}
              </div>
            );
          })}
        </div>
      ))}

      {/* Points row */}
      <div className="grid gap-0 border-t-2 border-slate-200" style={{ gridTemplateColumns: `1fr repeat(${players.length}, 1fr)` }}>
        <div className="p-2.5 text-center font-bold text-slate-500 text-xs uppercase border-r border-slate-200 bg-slate-50">
          Points
        </div>
        {players.map((_, pIdx) => (
          <div
            key={pIdx}
            className={`p-2.5 text-center font-bold text-lg ${
              pIdx === currentPlayerIndex ? 'text-blue-700 bg-blue-50' : 'text-slate-700'
            }`}
          >
            {cricketPoints?.[pIdx] || 0}
          </div>
        ))}
      </div>
    </div>
  );
}
