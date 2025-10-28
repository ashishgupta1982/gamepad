import React, { useState, useEffect } from 'react';
import { CATEGORIES, DIFFICULTY_LEVELS } from '@/data/quizConstants';

export default function SetupScreen({ 
  playerCount, playerNames, selectedCategories, customCategoryName, customCategoryDescription,
  numberOfQuestions, difficulty, previousCustomCategories, creatingNewCustom,
  onPlayerCountChange, onPlayerNameChange, onCategoryToggle,
  onCustomCategoryNameChange, onCustomCategoryDescriptionChange, onNumberOfQuestionsChange,
  onDifficultyChange, onStart, onBack, isGenerating, onCreateNewCustom, onBackToPrevious, onDeleteCustomCategory
}) {

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

        {/* Custom Categories Section */}
        {selectedCategories.includes('custom') && (
          <div className="bg-purple-50 rounded-xl p-4 mb-6 border-2 border-purple-300">
            <h3 className="text-sm font-bold text-purple-700 mb-3">✨ Custom Categories</h3>
            
            {/* Show currently selected custom categories */}
            {selectedCategories.filter(c => c.startsWith('custom:') && !previousCustomCategories.includes(c.replace('custom:', ''))).length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-purple-600 mb-2">Selected for this game:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedCategories
                    .filter(c => c.startsWith('custom:') && !previousCustomCategories.includes(c.replace('custom:', '')))
                    .map((cat, idx) => {
                      const catString = cat.replace('custom:', '');
                      const [name, desc] = catString.includes(':') ? catString.split(':') : [catString, ''];
                    return (
                      <div
                        key={idx}
                        className="text-left px-3 py-2 rounded-lg border-2 bg-white border-purple-500 shadow-md text-sm flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold text-slate-700">{name}</div>
                          {desc && <div className="text-xs text-slate-500">{desc}</div>}
                        </div>
                        <button
                          onClick={() => onCategoryToggle(cat)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    );
                    })}
                </div>
              </div>
            )}
            
            {/* Show either previous categories OR create new form */}
            {previousCustomCategories.length > 0 && !creatingNewCustom ? (
              /* Previous Custom Categories */
              <div className="mb-3">
                <p className="text-xs text-purple-600 mb-2">Select from your previous categories:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {previousCustomCategories.map((cat, idx) => {
                    const [name, desc] = cat.includes(':') ? cat.split(':') : [cat, ''];
                    return (
                      <div
                        key={idx}
                        className="relative group"
                      >
                        <button
                          onClick={() => onCategoryToggle(`custom:${cat}`)}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg border-2 transition-all text-sm
                            ${selectedCategories.includes(`custom:${cat}`)
                              ? 'bg-white border-purple-500 shadow-md'
                              : 'bg-white border-purple-200 hover:border-purple-300'
                            }
                          `}
                        >
                          <div className="font-semibold text-slate-700">{name}</div>
                          {desc && <div className="text-xs text-slate-500">{desc}</div>}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomCategory(cat);
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 text-lg font-bold leading-none"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Create New Custom Category */
              <div className="mb-3">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => onCustomCategoryNameChange(e.target.value)}
                    placeholder="Category name (e.g., Harry Potter)"
                    className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-sm bg-white"
                  />
                  <input
                    type="text"
                    value={customCategoryDescription}
                    onChange={(e) => onCustomCategoryDescriptionChange(e.target.value)}
                    placeholder="Topic to ask about (e.g., Books and films)"
                    className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-sm bg-white"
                  />
                </div>
                <button
                  onClick={() => {
                    if (customCategoryName) {
                      onCategoryToggle(`custom:${customCategoryName}: ${customCategoryDescription}`);
                      onCustomCategoryNameChange('');
                      onCustomCategoryDescriptionChange('');
                    }
                  }}
                  className="mt-2 px-4 py-1 bg-white border-2 border-purple-400 rounded-lg text-sm font-semibold text-purple-600 hover:bg-purple-100 transition-all"
                >
                  ✓ Add Custom Category
                </button>
                {/* Button to go back to previous categories */}
                {previousCustomCategories.length > 0 && (
                  <button
                    onClick={onBackToPrevious}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-semibold block"
                  >
                    ← Back to categories
                  </button>
                )}
              </div>
            )}
            
            {/* Toggle button when viewing previous categories to create new */}
            {previousCustomCategories.length > 0 && !creatingNewCustom && (
              <button
                onClick={onCreateNewCustom}
                className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
              >
                + Create new custom category
              </button>
            )}
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

