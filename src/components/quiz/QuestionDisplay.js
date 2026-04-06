import React from 'react';
import CountdownTimer from './CountdownTimer';
import AnswerGrid from './AnswerGrid';

export default function QuestionDisplay({
  question,
  questionIndex,
  totalQuestions,
  timeLeft,
  totalTime,
  selectedAnswer,
  correctAnswer,
  revealed,
  onSelectAnswer,
  disabled,
  category
}) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-sm font-semibold text-purple-700">
          {questionIndex + 1} / {totalQuestions}
        </div>
        {category && (
          <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-sm font-medium text-slate-600">
            {category}
          </div>
        )}
        <CountdownTimer timeLeft={timeLeft} totalTime={totalTime} size={56} />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-lg mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 text-center leading-tight">
          {question.question}
        </h2>
      </div>

      {/* Answers */}
      <AnswerGrid
        options={question.options}
        onSelect={onSelectAnswer}
        selectedAnswer={selectedAnswer}
        correctAnswer={correctAnswer}
        revealed={revealed}
        disabled={disabled}
      />

      {/* Explanation after reveal */}
      {revealed && question.explanation && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <span className="font-semibold">Did you know?</span> {question.explanation}
        </div>
      )}
    </div>
  );
}
