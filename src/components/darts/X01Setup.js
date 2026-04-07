import React from 'react';
import { X01_STARTING_SCORES, X01_LEGS_OPTIONS } from '@/data/dartsConstants';

export default function X01Setup({
  startingScore,
  onStartingScoreChange,
  legs,
  onLegsChange,
  doubleOut,
  onDoubleOutChange,
  doubleIn,
  onDoubleInChange
}) {
  return (
    <div className="space-y-4">
      {/* Starting score */}
      <div className="bg-white rounded-xl p-3 border border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
          Starting Score
        </label>
        <div className="flex gap-2">
          {X01_STARTING_SCORES.map(score => (
            <button
              key={score}
              onClick={() => onStartingScoreChange(score)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all
                ${startingScore === score
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {score}
            </button>
          ))}
        </div>
      </div>

      {/* Legs */}
      <div className="bg-white rounded-xl p-3 border border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
          Best Of (Legs)
        </label>
        <div className="flex gap-2">
          {X01_LEGS_OPTIONS.map(l => (
            <button
              key={l}
              onClick={() => onLegsChange(l)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all
                ${legs === l
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {l === 1 ? 'Single' : `Best of ${l}`}
            </button>
          ))}
        </div>
      </div>

      {/* Double out / Double in toggles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
            Double Out
          </label>
          <button
            onClick={() => onDoubleOutChange(!doubleOut)}
            className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
              doubleOut
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {doubleOut ? 'On' : 'Off'}
          </button>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
            Double In
          </label>
          <button
            onClick={() => onDoubleInChange(!doubleIn)}
            className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
              doubleIn
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {doubleIn ? 'On' : 'Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
