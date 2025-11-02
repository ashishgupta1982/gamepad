import React, { useState } from 'react';
import { CATEGORIES, DIFFICULTY_LEVELS } from '@/data/quizConstants';

export default function ResultsScreen({ game, onStartNewRound, onEndGame, onBack, onCategorySelect, previousCustomCategories = [], session }) {
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [difficulty, setDifficulty] = useState(game.quizConfig.difficulty || 'medium');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryDescription, setCustomCategoryDescription] = useState('');
  const [creatingNewCustom, setCreatingNewCustom] = useState(false);

  const playersWithScores = game.players.map((player, index) => ({
    ...player,
    index,
    totalScore: player.scores.reduce((sum, score) => sum + score, 0),
    percentage: ((player.scores.filter(s => s === 1).length / (game.quizConfig?.totalQuestions || 1)) * 100).toFixed(0)
  })).sort((a, b) => b.totalScore - a.totalScore);

  const winner = playersWithScores[0];

  const handleCategoryToggle = (categoryId) => {
    if (categoryId === 'custom') {
      setSelectedCategories(prev => 
        prev.includes('custom') 
          ? prev.filter(c => c !== 'custom' && !c.startsWith('custom:'))
          : [...prev, 'custom']
      );
    } else if (categoryId.startsWith('custom:')) {
      setSelectedCategories(prev => 
        prev.includes(categoryId)
          ? prev.filter(c => c !== categoryId)
          : [...prev, categoryId]
      );
    } else {
      setSelectedCategories(prev => 
        prev.includes(categoryId)
          ? prev.filter(c => c !== categoryId && !c.startsWith('custom:'))
          : [...prev, categoryId]
      );
    }
  };

  const handleStartRound = () => {
    if (selectedCategories.length === 0 || (selectedCategories.includes('custom') && selectedCategories.filter(c => c !== 'custom').length === 0)) {
      alert('Please select at least one category');
      return;
    }
    
    const categoriesToSave = selectedCategories
      .filter(cat => cat !== 'custom') // Remove plain 'custom' from selected categories
      .map(cat => {
        if (cat.startsWith('custom:')) {
          // Extract the actual category name (remove 'custom:' prefix)
          return cat.replace('custom:', '');
        }
        return CATEGORIES.find(c => c.id === cat)?.name || cat;
      });
    
    onStartNewRound(categoriesToSave, difficulty);
  };

  if (showCategorySelection) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-2xl font-bold text-slate-700 mb-6">Select New Categories</h3>
          
          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Categories</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`
                    py-3 px-2 rounded-lg transition-all border-2 flex flex-col items-center gap-1
                    ${selectedCategories.includes(category.id)
                      ? 'bg-purple-50 border-purple-500 shadow-md'
                      : 'bg-white border-slate-200 hover:border-purple-300'
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
            <div className="mb-6 bg-purple-50 rounded-xl p-4 border-2 border-purple-300">
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
                              onClick={() => handleCategoryToggle(cat)}
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
                <div className="mb-3">
                  <p className="text-xs text-purple-600 mb-2">Select from your previous categories:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {previousCustomCategories.map((cat, idx) => {
                      const [name, desc] = cat.includes(':') ? cat.split(':') : [cat, ''];
                      return (
                        <button
                          key={idx}
                          onClick={() => handleCategoryToggle(`custom:${cat}`)}
                          className={`
                            text-left px-3 py-2 rounded-lg border-2 transition-all text-sm
                            ${selectedCategories.includes(`custom:${cat}`)
                              ? 'bg-white border-purple-500 shadow-md'
                              : 'bg-white border-purple-200 hover:border-purple-300'
                            }
                          `}
                        >
                          <div className="font-semibold text-slate-700">{name}</div>
                          {desc && <div className="text-xs text-slate-500">{desc}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="Category name (e.g., Harry Potter)"
                      className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-sm bg-white"
                    />
                    <input
                      type="text"
                      value={customCategoryDescription}
                      onChange={(e) => setCustomCategoryDescription(e.target.value)}
                      placeholder="Topic to ask about (e.g., Books and films)"
                      className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none text-sm bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (customCategoryName) {
                        handleCategoryToggle(`custom:${customCategoryName}: ${customCategoryDescription}`);
                        setCustomCategoryName('');
                        setCustomCategoryDescription('');
                      }
                    }}
                    className="mt-2 px-4 py-1 bg-white border-2 border-purple-400 rounded-lg text-sm font-semibold text-purple-600 hover:bg-purple-100 transition-all"
                  >
                    ✓ Add Custom Category
                  </button>
                  {previousCustomCategories.length > 0 && (
                    <button
                      onClick={() => setCreatingNewCustom(false)}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-semibold block ml-2"
                    >
                      ← Back to categories
                    </button>
                  )}
                </div>
              )}
              
              {previousCustomCategories.length > 0 && !creatingNewCustom && (
                <button
                  onClick={() => setCreatingNewCustom(true)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                >
                  + Create new custom category
                </button>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 mb-3 block">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTY_LEVELS.map(level => (
                <button
                  key={level.id}
                  onClick={() => setDifficulty(level.id)}
                  className={`
                    flex-1 py-3 rounded-lg transition-all border text-center
                    ${difficulty === level.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-slate-200 hover:border-purple-300'
                    }
                  `}
                >
                  <div className="text-lg">{level.icon}</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">{level.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCategorySelection(false)}
              className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleStartRound}
              disabled={selectedCategories.length === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:scale-105 transform transition-all shadow-lg disabled:opacity-50"
            >
              Start New Round
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="text-purple-600 hover:text-purple-700 font-semibold"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-lg mb-4 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <h2 className="text-2xl font-bold text-purple-600 mb-1">Game Complete!</h2>
        <div className="text-xl font-bold text-slate-700 mb-2">
          {winner.name} Wins! 👑
        </div>
        <div className="text-sm text-slate-600">
          Final Score: {winner.totalScore}/{game.quizConfig.totalQuestions} ({winner.percentage}%)
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <h3 className="text-2xl font-bold text-slate-700 mb-4">Final Standings</h3>
        <div className="space-y-3">
          {playersWithScores.map((player, rank) => {
            const percentage = ((player.scores.filter(s => s === 1).length / (game.quizConfig?.totalQuestions || 1)) * 100).toFixed(0);
            const positionColor = rank === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                  rank === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400' :
                                  rank === 2 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                                  'bg-slate-100';
            const emoji = rank === 0 ? '👑' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
            
            return (
              <div
                key={player.index}
                className={`${positionColor} text-white p-4 rounded-xl`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-bold text-lg">{player.name}</span>
                  </div>
                  <div className="text-xl font-bold">
                    {player.totalScore}/{game.quizConfig?.totalQuestions || 0} ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowCategorySelection(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl text-xl font-bold hover:scale-105 transform transition-all shadow-lg"
        >
          New Round ➕
        </button>
        <button
          onClick={onEndGame}
          className="bg-red-500 text-white py-4 rounded-xl text-xl font-bold hover:bg-red-600 transform transition-all shadow-lg"
        >
          End Game
        </button>
      </div>
    </div>
  );
}

