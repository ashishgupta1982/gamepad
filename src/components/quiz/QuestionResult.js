import React from 'react';
import { ANSWER_COLORS } from '@/data/quizConstants';

export default function QuestionResult({ players, questionIndex, question, onContinue }) {
  const correctAnswer = question.options[question.correctAnswer];

  const sortedPlayers = [...players].sort((a, b) => {
    const aAnswer = a.answers?.find(ans => ans.questionIndex === questionIndex);
    const bAnswer = b.answers?.find(ans => ans.questionIndex === questionIndex);
    const aPoints = aAnswer?.points || 0;
    const bPoints = bAnswer?.points || 0;
    return bPoints - aPoints;
  });

  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      {/* Correct answer banner */}
      <div className="bg-success text-white rounded-2xl p-5 mb-6 shadow-lg">
        <div className="text-sm font-medium opacity-80 mb-1">Correct Answer</div>
        <div className="text-2xl font-bold flex items-center justify-center gap-2">
          <span>{ANSWER_COLORS[question.correctAnswer]?.icon}</span>
          <span>{correctAnswer}</span>
        </div>
      </div>

      {question.explanation && (
        <div className="bg-game-quiz/10 border border-game-quiz/30 rounded-xl p-4 mb-6 text-sm text-game-quiz">
          <span className="font-semibold">Did you know?</span> {question.explanation}
        </div>
      )}

      {/* Player results */}
      <div className="space-y-2 mb-6">
        {sortedPlayers.map((player, idx) => {
          const answer = player.answers?.find(ans => ans.questionIndex === questionIndex);
          const isCorrect = answer?.correct;
          const points = answer?.points || 0;
          const timeMs = answer?.timeMs;
          const noAnswer = answer?.selectedOption === undefined || answer?.selectedOption === null;

          return (
            <div
              key={player.id || player.name}
              className={`flex items-center justify-between p-3 rounded-xl transition-all
                ${isCorrect ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: player.avatarColor || '#6c5ce7' }}
                >
                  <span>{player.avatar || player.name?.[0]?.toUpperCase()}</span>
                </div>
                <span className="font-semibold text-foreground">{player.name}</span>
                {player.streak >= 2 && (
                  <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-medium">
                    🔥 {player.streak}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {timeMs != null && !noAnswer && (
                  <span className="text-xs text-muted-foreground">{(timeMs / 1000).toFixed(1)}s</span>
                )}
                {noAnswer ? (
                  <span className="text-sm text-muted-foreground">No answer</span>
                ) : (
                  <>
                    <span className={`text-lg ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="font-bold text-foreground min-w-[60px] text-right">
                      +{points}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 bg-gradient-to-r from-brand to-brand-deep text-white font-bold
                   text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98"
      >
        Continue
      </button>
    </div>
  );
}
