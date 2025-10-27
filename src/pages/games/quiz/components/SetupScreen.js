import React, { useState, useEffect } from 'react';
import { CATEGORIES, DIFFICULTY_LEVELS } from '../../../data/quizConstants';

export default function SetupScreen({ 
  playerCount, playerNames, selectedCategories, customCategoryName, customCategoryDescription,
  numberOfQuestions, difficulty, onPlayerCountChange, onPlayerNameChange, onCategoryToggle,
  onCustomCategoryNameChange, onCustomCategoryDescriptionChange, onNumberOfQuestionsChange,
  onDifficultyChange, onStart, onBack, isGenerating 
}) {
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    setShowCustomInput(selectedCategories.includes('custom'));
  }, [selectedCategories]);

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-purple-600 hover:text-purple-700 font-semibold text-sm"
      >
        ← Back
      </button>

      <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-3xl p-6 shadow-xl border-2 border-purple-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          ✨ Set Up Your Quiz Game
        </h2>

        {/* Questions & Difficulty at Top */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-purple-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
              🎯 Questions
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map(num => (
                <button
                  key={num}
                  onClick={() => onNumberOfQuestionsChange(num)}
                  className={`
                    flex-1 py-2.5 rounded-lg font-bold transition-all
                    ${numberOfQuestions === num
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-purple-100">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
              ⚡ Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTY_LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => onDifficultyChange(level.id)}
                  className={`
                    flex-1 py-2.5 rounded-lg transition-all border text-center
                    ${difficulty === level.id
                      ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                    }
                  `}
                >
                  <div className="text-lg">{level.icon}</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{level.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              👥 Players ({playerCount})
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  onClick={() => onPlayerCountChange(num)}
                  className={`
                    w-8 h-8 rounded-lg font-bold transition-all text-sm
                    ${playerCount === num
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-110'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {playerNames.map((name, index) => (
              <div key={index} className="relative">
                <label className="absolute left-3 top-2 text-xs text-slate-400">
                  Player {index + 1}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onPlayerNameChange(index, e.target.value)}
                  className="w-full pt-6 pb-2 px-3 rounded-lg border-2 border-slate-200 focus:border-purple-500 focus:outline-none text-sm"
                  placeholder="Enter name"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-purple-100">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">
            📚 Select Categories
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => onCategoryToggle(category.id)}
                className={`
                  py-3 px-2 rounded-lg transition-all border-2 flex flex-col items-center gap-1
                  ${selectedCategories.includes(category.id)
                    ? 'bg-purple-50 border-purple-500 shadow-md scale-105'
                    : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }
                `}
              >
                <div className="text-2xl">{category.icon}</div>
                <div className="text-xs font-semibold text-center leading-tight">{category.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Category Input */}
        {showCustomInput && (
          <div className="bg-purple-50 rounded-xl p-4 mb-6 border-2 border-purple-300">
            <h3 className="text-sm font-bold text-purple-700 mb-3">✨ Custom Category</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => onCustomCategoryNameChange(e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-sm bg-white"
              />
              <input
                type="text"
                value={customCategoryDescription}
                onChange={(e) => onCustomCategoryDescriptionChange(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-sm bg-white"
              />
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          disabled={playerNames.some(name => !name.trim()) || selectedCategories.length === 0 || isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white py-4 rounded-xl text-lg font-bold hover:scale-105 transform transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⚙️</span> Generating Questions...
            </>
          ) : (
            <>🚀 Start Quiz!</>
          )}
        </button>
      </div>
    </div>
  );
}

