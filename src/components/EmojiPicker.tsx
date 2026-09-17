import React from 'react';

const EMOJI_CATEGORIES = [
  {
    name: 'Love & Affection',
    emojis: ['❤️', '💖', '💛', '💕', '🥰', '😘', '🥺', '🫂', '😍', '💐', '💍', '✨'],
  },
  {
    name: 'Reactions & Laughs',
    emojis: ['😂', '🤣', '😭', '🤭', '😳', '🥳', '😎', '😜', '💀', '👀', '🔥', '👏'],
  },
  {
    name: 'Dates & Everyday',
    emojis: ['☕', '🍜', '🍕', '🍰', '🛺', '✈️', '🎬', '🍿', '🌙', '⭐', '🌧️', '🏖️'],
  },
];

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  return (
    <div className="absolute bottom-16 left-4 z-50 w-72 rounded-2xl glass-card border border-white/15 p-3 shadow-2xl space-y-3 bg-[#14151a]">
      <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
        <span className="text-xs font-semibold text-white/60">Emojis</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/40 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name} className="space-y-1">
            <span className="text-[10px] text-white/40 font-medium block">{cat.name}</span>
            <div className="grid grid-cols-6 gap-1">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelectEmoji(emoji)}
                  className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg active:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
