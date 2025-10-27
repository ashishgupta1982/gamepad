import React, { useState } from 'react';
import { CATEGORIES, DIFFICULTY_LEVELS } from '../constants';

export default function ResultsScreen({ game, onStartNewRound, onEndGame, onBack, onCategorySelect }) {
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [difficulty, setDifficulty] = useState(game.quizConfig.difficulty || 'medium');

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
          ? prev.filter(c => c !== 'custom')
          : [...prev, 'custom']
      );
    } else {
      setSelectedCategories(prev => 
        prev.includes(categoryId)
          ? prev.filter(c => c !== categoryId && c !== 'custom')
          : [...prev, categoryId]
      );
    }
  };

  const handleStartRound = () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    
    const categoriesToSave = selectedCategories.map(cat => {
      if (cat === 'custom') return 'Custom';
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

