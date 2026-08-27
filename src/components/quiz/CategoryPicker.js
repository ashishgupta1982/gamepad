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
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
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
                  ? 'bg-brand/10 text-brand ring-2 ring-brand shadow-sm'
                  : 'bg-card text-muted-foreground border border-border hover:border-brand/30 hover:bg-brand/10'
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
        <div className="border-t border-border pt-3 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Custom Categories</span>
            <button
              onClick={() => setShowNewCustom(!showNewCustom)}
              className="text-xs font-semibold text-brand hover:text-brand"
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
                          ? 'bg-brand/10 text-brand ring-1 ring-brand'
                          : 'bg-muted text-muted-foreground hover:bg-brand/10'
                        }`}
                    >
                      <span>✨</span>
                      <span>{displayName}</span>
                    </button>
                    {onDeleteCustomCategory && (
                      <button
                        onClick={() => onDeleteCustomCategory(cat)}
                        className="text-border hover:text-destructive text-xs transition-colors"
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
            <div className="bg-brand/10 rounded-xl p-3 space-y-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Category name (e.g., Harry Potter)"
                className="w-full px-3 py-2 rounded-lg border border-brand/30 text-sm outline-none
                           focus:ring-2 focus:ring-brand bg-card"
                maxLength={50}
              />
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 rounded-lg border border-brand/30 text-sm outline-none
                           focus:ring-2 focus:ring-brand bg-card"
                maxLength={100}
              />
              <button
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="w-full py-2 bg-brand text-white font-semibold text-sm rounded-lg
                           disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand transition-all"
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
