import React from 'react';
import { AVATAR_EMOJIS, AVATAR_COLORS } from '@/data/quizConstants';

export default function AvatarPicker({ selectedEmoji, selectedColor, onEmojiChange, onColorChange }) {
  return (
    <div className="space-y-3">
      {/* Color picker */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map(color => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-muted-foreground scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Emoji picker */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5 block">Avatar</label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onEmojiChange(emoji)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                selectedEmoji === emoji
                  ? 'bg-brand/10 ring-2 ring-brand scale-110'
                  : 'bg-muted hover:bg-muted'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
