import React, { useState } from 'react';
import Leaderboard from './Leaderboard';

export default function PlayScreen({ game, playerAnswers, showAnswer, onAnswerSelect, onRevealAnswer, onNextQuestion, onBack }) {
  const currentQIndex = game.quizConfig.currentQuestionIndex;
  const currentQuestion = game.quizConfig.questions[currentQIndex];
  const totalQuestions = game.quizConfig.questions.length;

  if (!currentQuestion) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-600 mb-4">Loading question...</h2>
      </div>
    );
  }

  const allPlayersAnswered = Object.keys(playerAnswers).length === game.players.length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="text-purple-600 hover:text-purple-700 font-semibold"
        >
          ← Back
        </button>
        <div className="text-slate-600 font-semibold">
          Question {currentQIndex + 1} of {totalQuestions}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl mb-6">
        <div className="text-purple-600 font-semibold mb-4">{currentQuestion.category}</div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8">
          {currentQuestion.question}
        </h2>

        {/* Answer options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {currentQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const isCorrect = index === currentQuestion.correctAnswer;
            
            return (
              <div
                key={index}
                className={`
                  p-4 rounded-xl border-2
                  ${showAnswer && isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : showAnswer 
                    ? 'border-red-300 bg-red-50 opacity-50'
                    : 'border-slate-200'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                    ${showAnswer && isCorrect
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                    }
                  `}>
                    {letter}
                  </div>
                  <div className="font-semibold text-slate-700">{option}</div>
                  {showAnswer && isCorrect && <span className="ml-auto text-2xl">✓</span>}
                </div>
              </div>
            );
          })}
        </div>

        {showAnswer && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-purple-700 mb-2">💡 Interesting Fact:</h3>
            <p className="text-slate-700">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex gap-4">
          {!showAnswer ? (
            <button
              onClick={onRevealAnswer}
              disabled={!allPlayersAnswered}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold hover:scale-105 transform transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allPlayersAnswered ? 'Reveal Answer' : `Waiting for ${game.players.length - Object.keys(playerAnswers).length} more player(s)...`}
            </button>
          ) : (
            <button
              onClick={onNextQuestion}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold hover:scale-105 transform transition-all"
            >
              Next Question →
            </button>
          )}
        </div>
      </div>

      {/* Player Answer Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {game.players.map((player, playerIndex) => {
          const playerAnswer = playerAnswers[playerIndex];
          const hasAnswered = playerAnswer !== undefined;
          const isCorrect = showAnswer && hasAnswered && playerAnswer === currentQuestion.correctAnswer;
          
          return (
            <div 
              key={playerIndex}
              className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all ${
                showAnswer && isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : showAnswer && !isCorrect
                  ? 'border-red-300 bg-red-50'
                  : hasAnswered
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-200'
              }`}
            >
              <h3 className="font-bold text-slate-700 mb-4 text-lg">
                {player.name}
                {hasAnswered && !showAnswer && <span className="ml-2 text-green-600">✓</span>}
                {showAnswer && isCorrect && <span className="ml-2 text-2xl">🏆</span>}
              </h3>
              
              {!showAnswer && (
                <div className="grid grid-cols-5 gap-2">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const letter = String.fromCharCode(65 + optionIndex);
                    const isSelected = playerAnswer === optionIndex;
                    
                    return (
                      <button
                        key={optionIndex}
                        onClick={() => onAnswerSelect(playerIndex, optionIndex)}
                        disabled={hasAnswered}
                        className={`
                          aspect-square rounded-xl font-bold text-lg transition-all
                          ${isSelected
                            ? 'bg-purple-500 text-white scale-110'
                            : hasAnswered
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-slate-200 text-slate-700 hover:bg-purple-300 hover:text-white'
                          }
                        `}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {showAnswer && hasAnswered && (
                <div className="text-center">
                  <div className={`text-4xl mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </div>
                  <div className="font-semibold text-slate-600">
                    Answered: {String.fromCharCode(65 + playerAnswer)}
                  </div>
                </div>
              )}
              
              {!hasAnswered && !showAnswer && (
                <p className="text-slate-500 text-sm italic text-center mt-4">Tap a letter above to select your answer</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <Leaderboard game={game} />
    </div>
  );
}

