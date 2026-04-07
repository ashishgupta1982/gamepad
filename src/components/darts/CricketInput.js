import React, { useState } from 'react';
import { CRICKET_TARGETS, CRICKET_TARGET_LABELS } from '@/data/dartsConstants';

export default function CricketInput({ currentPlayer, onSubmitMarks, onUndo, canUndo }) {
  const [dartMarks, setDartMarks] = useState([]);
  // Each dart mark: { targetIndex, multiplier }

  const handleTargetHit = (targetIndex, multiplier) => {
    if (dartMarks.length >= 3) return;
    setDartMarks([...dartMarks, { targetIndex, multiplier }]);
  };

  const handleRemoveDart = (idx) => {
    setDartMarks(dartMarks.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    onSubmitMarks(dartMarks);
    setDartMarks([]);
  };

  const handleMiss = () => {
    if (dartMarks.length >= 3) return;
    setDartMarks([...dartMarks, { targetIndex: -1, multiplier: 0 }]);
  };

  const handleClear = () => {
    setDartMarks([]);
  };

  return (
    <div className="max-w-sm mx-auto">
      {/* Current player */}
      <div className="text-center mb-3">
        <div className="text-sm font-bold text-slate-600">{currentPlayer}&apos;s Turn</div>
        <div className="text-xs text-slate-400">Dart {Math.min(dartMarks.length + 1, 3)} of 3</div>
      </div>

      {/* Darts thrown display */}
      <div className="flex justify-center gap-2 mb-3">
        {[0, 1, 2].map(i => {
          const mark = dartMarks[i];
          return (
            <div
              key={i}
              onClick={() => mark && handleRemoveDart(i)}
              className={`w-24 h-12 rounded-xl flex items-center justify-center text-sm font-bold border-2 transition-all ${
                mark
                  ? mark.targetIndex === -1
                    ? 'bg-slate-100 border-slate-300 text-slate-500 cursor-pointer hover:border-red-300'
                    : 'bg-blue-50 border-blue-300 text-blue-700 cursor-pointer hover:border-red-300'
                  : 'bg-white border-dashed border-slate-200 text-slate-300'
              }`}
            >
              {mark
                ? mark.targetIndex === -1
                  ? 'Miss'
                  : `${['S', 'D', 'T'][mark.multiplier - 1]}${CRICKET_TARGET_LABELS[CRICKET_TARGETS[mark.targetIndex]]}`
                : `Dart ${i + 1}`}
            </div>
          );
        })}
      </div>

      {/* Target buttons */}
      <div className="space-y-2 mb-3">
        {CRICKET_TARGETS.map((target, tIdx) => (
          <div key={target} className="flex items-center gap-2">
            <div className="w-12 text-center font-bold text-slate-600 text-sm">
              {CRICKET_TARGET_LABELS[target]}
            </div>
            <div className="flex gap-1.5 flex-1">
              {(target === 'BULL' ? [1, 2] : [1, 2, 3]).map(mult => (
                <button
                  key={mult}
                  onClick={() => handleTargetHit(tIdx, mult)}
                  disabled={dartMarks.length >= 3}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                    dartMarks.length >= 3
                      ? 'bg-slate-50 text-slate-300'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100'
                  }`}
                >
                  {target === 'BULL'
                    ? mult === 1 ? 'Single' : 'Double'
                    : mult === 1 ? 'S' : mult === 2 ? 'D' : 'T'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          onClick={handleMiss}
          disabled={dartMarks.length >= 3}
          className={`py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
            dartMarks.length >= 3
              ? 'bg-slate-50 text-slate-300'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Miss
        </button>
        <button
          onClick={handleClear}
          disabled={dartMarks.length === 0}
          className={`py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
            dartMarks.length === 0
              ? 'bg-slate-50 text-slate-300'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={dartMarks.length === 0}
          className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
            dartMarks.length === 0
              ? 'bg-slate-100 text-slate-300'
              : 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
          }`}
        >
          Submit
        </button>
      </div>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`w-full py-3 font-semibold rounded-xl transition-all active:scale-95 text-sm ${
          canUndo
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-slate-50 text-slate-300'
        }`}
      >
        ↩ Undo Last Turn
      </button>
    </div>
  );
}
