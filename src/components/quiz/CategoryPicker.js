import React, { useState } from 'react';
import { CATEGORIES } from '@/data/quizConstants';

export default function CategoryPicker({
  selectedCategories,
  onToggleCategory,
  customCategories = [],
  onAddCustomCategory,
  onDeleteCustomCategory,
  showCustomInput = true
}) {
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [showNewCustom, setShowNewCustom] = useState(false);

  const standardCategories = CATEGORIES.filter(c => c.id !== 'custom');

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    const catString = customDescription.trim()
      ? `${customName.trim()}: ${customDescription.trim()}`
      : customName.trim();
    onAddCustomCategory(catString);
    setCustomName('');
    setCustomDescription('');
    setShowNewCustom(false);
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
        Categories
      </label>

      {/* Standard categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {standardCategories.map(cat => {
          const isSelected = selectedCategories.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onToggleCategory(cat.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl text-sm font-semibold transition-all
                ${isSelected
                  ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-400 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-purple-200 hover:bg-purple-50'
                }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="truncate">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Custom categories */}
      {showCustomInput && (
        <div className="border-t border-slate-100 pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Custom Categories</span>
            <button
              onClick={() => setShowNewCustom(!showNewCustom)}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700"
            >
              {showNewCustom ? 'Cancel' : '+ Create New'}
            </button>
          </div>

          {/* Existing custom categories */}
          {customCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {customCategories.map(cat => {
                const catId = `custom:${cat}`;
                const isSelected = selectedCategories.includes(catId);
                const displayName = cat.includes(':') ? cat.split(':')[0].trim() : cat;

                return (
                  <div key={cat} className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleCategory(catId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                        ${isSelected
                          ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-400'
                          : 'bg-slate-100 text-slate-600 hover:bg-purple-50'
                        }`}
                    >
                      <span>✨</span>
                      <span>{displayName}</span>
                    </button>
                    {onDeleteCustomCategory && (
                      <button
                        onClick={() => onDeleteCustomCategory(cat)}
                        className="text-slate-300 hover:text-red-400 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* New custom category form */}
          {showNewCustom && (
            <div className="bg-purple-50 rounded-xl p-3 space-y-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Category name (e.g., Harry Potter)"
                className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm outline-none
                           focus:ring-2 focus:ring-purple-400 bg-white"
                maxLength={50}
              />
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm outline-none
                           focus:ring-2 focus:ring-purple-400 bg-white"
                maxLength={100}
              />
              <button
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="w-full py-2 bg-purple-600 text-white font-semibold text-sm rounded-lg
                           disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all"
              >
                Add Category
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
