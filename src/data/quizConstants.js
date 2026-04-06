export const CATEGORIES = [
  { id: 'general', name: 'General Knowledge', icon: '💡' },
  { id: 'food-drink', name: 'Food & Drink', icon: '🍕' },
  { id: 'sport', name: 'Sport', icon: '⚽' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'music-film', name: 'Music & Film', icon: '🎬' },
  { id: 'history', name: 'History', icon: '🏛️' },
  { id: 'geography', name: 'Geography', icon: '🌍' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'brain-teasers', name: 'Brain Teasers', icon: '🧩' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'art-literature', name: 'Art & Literature', icon: '📚' },
  { id: 'pop-culture', name: 'Pop Culture', icon: '🌟' },
  { id: 'custom', name: 'Custom', icon: '✨' }
];

export const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', icon: '😊', desc: 'Ages 5-10' },
  { id: 'medium', name: 'Medium', icon: '🤔', desc: 'Teens & Adults' },
  { id: 'hard', name: 'Hard', icon: '🧠', desc: 'Expert' }
];

export const TIMER_OPTIONS = [
  { id: 10, label: '10s', desc: 'Lightning' },
  { id: 15, label: '15s', desc: 'Fast' },
  { id: 20, label: '20s', desc: 'Normal' },
  { id: 30, label: '30s', desc: 'Relaxed' }
];

export const QUESTION_COUNTS = [5, 10, 15, 20];

export const ANSWER_COLORS = {
  0: { bg: '#e21b3c', hover: '#cc1835', name: 'Red', icon: '▲' },
  1: { bg: '#1368ce', hover: '#1060b8', name: 'Blue', icon: '◆' },
  2: { bg: '#d89e00', hover: '#c08d00', name: 'Yellow', icon: '●' },
  3: { bg: '#26890c', hover: '#1f7a0a', name: 'Green', icon: '■' }
};

export const SCORING = {
  BASE_POINTS: 1000,
  SPEED_WEIGHT: 0.5,       // Max 50% reduction for slow answers
  STREAK_BONUS: 0.1,       // 10% per consecutive correct
  MAX_STREAK_MULTIPLIER: 1.5,
  NO_ANSWER_POINTS: 0
};

export const AVATAR_EMOJIS = [
  '🦊', '🐸', '🦉', '🐙', '🦁', '🐯',
  '🐻', '🦄', '🐲', '🦅', '🐬', '🦋',
  '🐢', '🦈', '🐺', '🦜'
];

export const AVATAR_COLORS = [
  '#e21b3c', '#1368ce', '#d89e00', '#26890c',
  '#9b59b6', '#e67e22', '#1abc9c', '#e84393',
  '#00b894', '#6c5ce7', '#fd79a8', '#0984e3'
];

export const GAME_MODES = {
  SAME_DEVICE: 'same-device',
  MULTI_DEVICE: 'multi-device'
};

export const ROOM_STATUSES = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  QUESTION: 'question',
  REVEAL: 'reveal',
  SCORES: 'scores',
  FINISHED: 'finished'
};
