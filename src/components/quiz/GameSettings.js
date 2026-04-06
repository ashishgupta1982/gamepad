import React from 'react';
import { DIFFICULTY_LEVELS, TIMER_OPTIONS, QUESTION_COUNTS } from '@/data/quizConstants';

export default function GameSettings({
  questionCount,
  onQuestionCountChange,
  difficulty,
  onDifficultyChange,
  timePerQuestion,
  onTimeChange
}) {
  return (
    <div className="space-y-4">
      {/* Question count */}
      <div className="bg-white rounded-xl p-3 border border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
          Questions
        </label>
        <div className="flex gap-2">
          {QUESTION_COUNTS.map(num => (
            <button
              key={num}
              onClick={() => onQuestionCountChange(num)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all
                ${questionCount === num
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="bg-white rounded-xl p-3 border border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
          Difficulty
        </label>
        <div className="flex gap-2">
          {DIFFICULTY_LEVELS.map(level => (
            <button
              key={level.id}
              onClick={() => onDifficultyChange(level.id)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all
                ${difficulty === level.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span className="block text-lg mb-0.5">{level.icon}</span>
              <span className="text-xs">{level.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="bg-white rounded-xl p-3 border border-slate-100">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
          Time Per Question
        </label>
        <div className="flex gap-2">
          {TIMER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onTimeChange(opt.id)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all
                ${timePerQuestion === opt.id
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span className="block text-base">{opt.label}</span>
              <span className="text-[10px] opacity-70">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
