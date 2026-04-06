import React from 'react';
import { ANSWER_COLORS } from '@/data/quizConstants';

export default function AnswerGrid({
  options,
  onSelect,
  selectedAnswer,
  correctAnswer,
  revealed,
  disabled
}) {
  const getButtonStyle = (index) => {
    const color = ANSWER_COLORS[index];
    if (revealed) {
      if (index === correctAnswer) {
        return {
          backgroundColor: '#26890c',
          opacity: 1,
          transform: 'scale(1.02)',
          boxShadow: '0 0 20px rgba(38, 137, 12, 0.4)'
        };
      }
      if (selectedAnswer === index && index !== correctAnswer) {
        return {
          backgroundColor: '#e21b3c',
          opacity: 0.7
        };
      }
      return { backgroundColor: color.bg, opacity: 0.3 };
    }

    if (selectedAnswer === index) {
      return {
        backgroundColor: color.bg,
        transform: 'scale(0.97)',
        boxShadow: `0 0 0 4px white, 0 0 0 6px ${color.bg}`
      };
    }

    return { backgroundColor: color.bg };
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option, index) => {
        const color = ANSWER_COLORS[index];
        return (
          <button
            key={index}
            onClick={() => !disabled && !revealed && onSelect(index)}
            disabled={disabled || revealed}
            className="relative p-4 md:p-5 rounded-xl text-white font-bold text-base md:text-lg
                       transition-all duration-200 min-h-[70px] md:min-h-[80px]
                       active:scale-95 select-none"
            style={getButtonStyle(index)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl md:text-2xl opacity-80">{color.icon}</span>
              <span className="flex-1 text-left leading-tight">{option}</span>
            </div>
            {revealed && index === correctAnswer && (
              <div className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
            )}
            {revealed && selectedAnswer === index && index !== correctAnswer && (
              <div className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center">
                <span className="text-red-600 text-lg">✗</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
