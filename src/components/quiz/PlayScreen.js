import React, { useState, useEffect } from 'react';
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
      <div className="max-w-7xl mx-auto">
      <div className="lg:flex lg:gap-6">
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Mobile/Tablet Leaderboard - Compact horizontal view */}
          <div className="lg:hidden mb-3">
            <Leaderboard game={game} compact={true} />
          </div>
          
          {/* Question Card */}
          <div className="bg-white rounded-2xl p-4 shadow-lg mb-3">
            {/* Header inside card - All on one line */}
            <div className="flex justify-between items-center gap-3 mb-4">
              <button
                onClick={onBack}
                className="text-purple-600 hover:text-purple-700 font-semibold text-xs whitespace-nowrap"
              >
                ← Back
              </button>
              <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                {currentQuestion.category}
              </div>
              <div className="bg-purple-100 px-3 py-1.5 rounded-full text-purple-700 font-semibold text-xs whitespace-nowrap">
                Question {currentQIndex + 1} of {totalQuestions}
              </div>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4">
              {currentQuestion.question}
            </h2>

            {/* Answer options - Wider 3 column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              {currentQuestion.options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isCorrect = index === currentQuestion.correctAnswer;
                
                // Same color scheme as player cards  
                const colorClasses = [
                  'border-blue-500 bg-blue-50', // A - Blue
                  'border-green-500 bg-green-50', // B - Green  
                  'border-orange-500 bg-orange-50', // C - Orange
                  'border-purple-500 bg-purple-50', // D - Purple
                  'border-pink-500 bg-pink-50', // E - Pink
                ];
                
                const badgeColors = [
                  'bg-blue-500', // A
                  'bg-green-500', // B
                  'bg-orange-500', // C
                  'bg-purple-500', // D
                  'bg-pink-500', // E
                ];
                
                return (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border-2 transition-all hover:shadow-md
                      ${showAnswer && isCorrect 
                        ? 'border-green-500 bg-green-50 shadow-lg' 
                        : showAnswer 
                        ? 'border-red-200 bg-red-50 opacity-50'
                        : colorClasses[index]
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-md
                        ${badgeColors[index]}
                        ${showAnswer && !isCorrect ? 'opacity-50' : ''}
                      `}>
                        {letter}
                      </div>
                      <div className="font-semibold text-sm text-slate-700 flex-1">{option}</div>
                      {showAnswer && isCorrect && <span className="text-xl animate-bounce">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {showAnswer && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h3 className="font-bold text-purple-700 mb-1 text-sm">💡 Interesting Fact:</h3>
                <p className="text-slate-700 text-sm">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Action Button */}
            <div>
              {!showAnswer ? (
                <button
                  onClick={onRevealAnswer}
                  disabled={!allPlayersAnswered}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:scale-105 transform transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {allPlayersAnswered ? '✨ Reveal Answer' : `⏳ Waiting for ${game.players.length - Object.keys(playerAnswers).length} more...`}
                </button>
              ) : (
                <button
                  onClick={onNextQuestion}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:scale-105 transform transition-all text-sm"
                >
                  ➡️ Next Question
                </button>
              )}
            </div>
          </div>

          {/* Player Answer Cards - Compact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {game.players.map((player, playerIndex) => {
              const playerAnswer = playerAnswers[playerIndex];
              const hasAnswered = playerAnswer !== undefined;
              const isCorrect = showAnswer && hasAnswered && playerAnswer === currentQuestion.correctAnswer;
              
              return (
                <div 
                  key={playerIndex}
                  className={`bg-white rounded-lg p-2 shadow-md border-2 transition-all ${
                    showAnswer && isCorrect 
                      ? 'border-green-500 bg-green-50' 
                      : showAnswer && !isCorrect && hasAnswered
                      ? 'border-red-400 bg-red-50'
                      : hasAnswered
                      ? 'border-green-400 bg-green-50'
                      : 'border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1 min-w-[80px]">
                      {player.name}
                      {hasAnswered && !showAnswer && <span className="text-green-600 text-sm">✓</span>}
                      {showAnswer && isCorrect && <span className="text-base">🏆</span>}
                    </h3>
                    
                    {!showAnswer && (
                      <div className="flex gap-1.5 items-center">
                        {hasAnswered ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded border border-green-400">
                            <span className="text-green-600 text-sm">✓</span>
                            <span className="text-[10px] text-green-700 font-bold">Locked</span>
                          </div>
                        ) : (
                          currentQuestion.options.map((option, optionIndex) => {
                          const letter = String.fromCharCode(65 + optionIndex);
                          const isSelected = playerAnswer === optionIndex;
                          
                          // Color coding for each letter
                          const colors = {
                            0: 'from-blue-500 to-blue-600',  // A - Blue
                            1: 'from-green-500 to-green-600', // B - Green
                            2: 'from-orange-500 to-orange-600', // C - Orange
                            3: 'from-purple-500 to-purple-600', // D - Purple
                            4: 'from-pink-500 to-pink-600',   // E - Pink
                          };
                          
                          return (
                            <button
                              key={optionIndex}
                              onClick={() => onAnswerSelect(playerIndex, optionIndex)}
                              className={`
                                w-14 h-14 rounded-xl font-extrabold text-lg transition-all flex items-center justify-center
                                ${isSelected
                                  ? `bg-gradient-to-r ${colors[optionIndex]} text-white scale-110 shadow-xl ring-2 ring-white`
                                  : `bg-gradient-to-r ${colors[optionIndex]} opacity-60 text-white hover:opacity-100 hover:shadow-md hover:scale-105`
                                }
                              `}
                            >
                              {letter}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                  
                  {showAnswer && hasAnswered && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {currentQuestion.options.map((option, optionIndex) => {
                        const letter = String.fromCharCode(65 + optionIndex);
                        const wasSelected = playerAnswer === optionIndex;
                        const isCorrect = optionIndex === currentQuestion.correctAnswer;
                        
                        // Determine styling based on selection and correctness
                        let className = 'w-10 h-10 rounded-lg font-extrabold text-sm flex items-center justify-center transition-all';
                        
                        if (wasSelected) {
                          if (isCorrect) {
                            className += ' bg-green-500 text-white scale-110 shadow-xl border-2 border-green-600';
                          } else {
                            className += ' bg-red-500 text-white scale-110 shadow-xl border-2 border-red-600';
                          }
                        } else if (isCorrect) {
                          className += ' bg-green-100 text-green-700 opacity-60';
                        } else {
                          className += ' bg-slate-200 text-slate-400 opacity-30';
                        }
                        
                        return (
                          <div
                            key={optionIndex}
                            className={className}
                            title={wasSelected ? 'Your selection' : isCorrect ? 'Correct answer' : ''}
                          >
                            <span className="text-sm font-extrabold">{letter}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Leaderboard Sidebar */}
        <div className="w-64 hidden lg:block flex-shrink-0">
          <Leaderboard game={game} compact={false} />
        </div>
      </div>
    </div>
  );
}

