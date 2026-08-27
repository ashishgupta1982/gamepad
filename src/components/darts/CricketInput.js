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
        <div className="text-sm font-bold text-muted-foreground">{currentPlayer}&apos;s Turn</div>
        <div className="text-xs text-muted-foreground">Dart {Math.min(dartMarks.length + 1, 3)} of 3</div>
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
                    ? 'bg-muted border-border text-muted-foreground cursor-pointer hover:border-game-darts/30'
                    : 'bg-accent/10 border-accent/30 text-accent cursor-pointer hover:border-game-darts/30'
                  : 'bg-card border-dashed border-border text-border'
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
            <div className="w-12 text-center font-bold text-muted-foreground text-sm">
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
                      ? 'bg-muted text-border'
                      : 'bg-card border border-border text-foreground hover:bg-accent/10 hover:border-accent/30 active:bg-accent/10'
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
              ? 'bg-muted text-border'
              : 'bg-muted text-muted-foreground hover:bg-border'
          }`}
        >
          Miss
        </button>
        <button
          onClick={handleClear}
          disabled={dartMarks.length === 0}
          className={`py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
            dartMarks.length === 0
              ? 'bg-muted text-border'
              : 'bg-warning/10 text-warning hover:bg-warning/20'
          }`}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={dartMarks.length === 0}
          className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
            dartMarks.length === 0
              ? 'bg-muted text-border'
              : 'bg-accent text-white shadow-md hover:bg-accent'
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
            ? 'bg-warning/10 text-warning hover:bg-warning/20'
            : 'bg-muted text-border'
        }`}
      >
        ↩ Undo Last Turn
      </button>
    </div>
  );
}
