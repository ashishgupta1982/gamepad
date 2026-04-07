// ─── Game Modes ───

export const GAME_MODES = [
  {
    id: 'x01',
    name: 'X01',
    icon: '🎯',
    desc: 'Classic darts! Race to zero from 101, 301, 501 and more.',
    color: 'from-red-500 to-orange-500',
    rules: [
      'Each player starts at the chosen score (e.g. 501)',
      'Take turns throwing 3 darts, then enter your total score',
      'Your score is subtracted from your remaining total',
      'Must finish on exactly 0 — with a double if double-out is on',
      'Going below 0 or to exactly 1 is a "bust" — your turn is voided',
      'When your remaining score is 170 or less, checkout suggestions are shown',
      'First player to check out wins the leg'
    ]
  },
  {
    id: 'cricket',
    name: 'Cricket',
    icon: '🏏',
    desc: 'Close numbers 15-20 and bullseye. Strategy meets accuracy.',
    color: 'from-blue-500 to-indigo-500',
    rules: [
      'Targets are: 20, 19, 18, 17, 16, 15, and Bullseye',
      'Hit each number 3 times to "close" it (single = 1 mark, double = 2, triple = 3)',
      'Once you close a number, extra hits score points — unless your opponent has also closed it',
      'Win by closing all 7 numbers AND having equal or more points than your opponent',
      'For each turn, enter which targets you hit with your 3 darts'
    ]
  },
  {
    id: 'around-the-clock',
    name: 'Around the Clock',
    icon: '🕐',
    desc: 'Hit 1 through 20 in order, then bullseye. Simple and fun!',
    color: 'from-green-500 to-emerald-500',
    rules: [
      'Hit numbers 1 through 20 in order, then finish with Bullseye',
      'Each turn you throw 3 darts at your current target number',
      'Hit your target = advance to the next number',
      'Miss = stay on your current number until next turn',
      'First player to hit all 21 targets (1-20 + Bull) wins'
    ]
  },
  {
    id: 'killer',
    name: 'Killer',
    icon: '💀',
    desc: 'Elimination game! Become a killer and take out opponents.',
    color: 'from-purple-500 to-pink-500',
    rules: [
      'Each player is assigned a random number with a matching double',
      'Phase 1: Hit your own double to become a "Killer"',
      'Phase 2: Once you are a Killer, hit opponents\' doubles to remove their lives',
      'Each player starts with 3 lives',
      'Lose all your lives and you are eliminated',
      'Last player standing wins!'
    ]
  }
];

// ─── X01 Options ───

export const X01_STARTING_SCORES = [101, 301, 501, 701, 1001];

export const X01_LEGS_OPTIONS = [1, 3, 5, 7];

// ─── Cricket Targets ───

export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 'BULL'];
export const CRICKET_TARGET_LABELS = {
  20: '20', 19: '19', 18: '18', 17: '17', 16: '16', 15: '15', BULL: 'Bull'
};

// ─── Checkout Chart (2-170) ───
// Format: remaining → array of dart descriptions
// Bogey numbers (no checkout): 169, 168, 166, 165, 163, 162, 159

export const CHECKOUT_CHART = {
  2: ['D1'],
  3: ['S1', 'D1'],
  4: ['D2'],
  5: ['S1', 'D2'],
  6: ['D3'],
  7: ['S3', 'D2'],
  8: ['D4'],
  9: ['S1', 'D4'],
  10: ['D5'],
  11: ['S3', 'D4'],
  12: ['D6'],
  13: ['S5', 'D4'],
  14: ['D7'],
  15: ['S7', 'D4'],
  16: ['D8'],
  17: ['S1', 'D8'],
  18: ['D9'],
  19: ['S3', 'D8'],
  20: ['D10'],
  21: ['S5', 'D8'],
  22: ['D11'],
  23: ['S7', 'D8'],
  24: ['D12'],
  25: ['S9', 'D8'],
  26: ['D13'],
  27: ['S11', 'D8'],
  28: ['D14'],
  29: ['S13', 'D8'],
  30: ['D15'],
  31: ['S15', 'D8'],
  32: ['D16'],
  33: ['S1', 'D16'],
  34: ['D17'],
  35: ['S3', 'D16'],
  36: ['D18'],
  37: ['S5', 'D16'],
  38: ['D19'],
  39: ['S7', 'D16'],
  40: ['D20'],
  41: ['S9', 'D16'],
  42: ['S10', 'D16'],
  43: ['S3', 'D20'],
  44: ['S4', 'D20'],
  45: ['S13', 'D16'],
  46: ['S6', 'D20'],
  47: ['S15', 'D16'],
  48: ['S8', 'D20'],
  49: ['S9', 'D20'],
  50: ['S10', 'D20'],
  51: ['S11', 'D20'],
  52: ['S12', 'D20'],
  53: ['S13', 'D20'],
  54: ['S14', 'D20'],
  55: ['S15', 'D20'],
  56: ['S16', 'D20'],
  57: ['S17', 'D20'],
  58: ['S18', 'D20'],
  59: ['S19', 'D20'],
  60: ['S20', 'D20'],
  61: ['T15', 'D8'],
  62: ['T10', 'D16'],
  63: ['T13', 'D12'],
  64: ['T16', 'D8'],
  65: ['T19', 'D4'],
  66: ['T10', 'D18'],
  67: ['T17', 'D8'],
  68: ['T20', 'D4'],
  69: ['T19', 'D6'],
  70: ['T18', 'D8'],
  71: ['T13', 'D16'],
  72: ['T16', 'D12'],
  73: ['T19', 'D8'],
  74: ['T14', 'D16'],
  75: ['T17', 'D12'],
  76: ['T20', 'D8'],
  77: ['T19', 'D10'],
  78: ['T18', 'D12'],
  79: ['T19', 'D11'],
  80: ['T20', 'D10'],
  81: ['T19', 'D12'],
  82: ['T14', 'D20'],
  83: ['T17', 'D16'],
  84: ['T20', 'D12'],
  85: ['T15', 'D20'],
  86: ['T18', 'D16'],
  87: ['T17', 'D18'],
  88: ['T16', 'D20'],
  89: ['T19', 'D16'],
  90: ['T18', 'D18'],
  91: ['T17', 'D20'],
  92: ['T20', 'D16'],
  93: ['T19', 'D18'],
  94: ['T18', 'D20'],
  95: ['T19', 'D19'],
  96: ['T20', 'D18'],
  97: ['T19', 'D20'],
  98: ['T20', 'D19'],
  99: ['T19', 'S10', 'D16'],
  100: ['T20', 'D20'],
  101: ['T17', 'S10', 'D20'],
  102: ['T20', 'S10', 'D16'],
  103: ['T19', 'S6', 'D20'],
  104: ['T18', 'S10', 'D20'],
  105: ['T20', 'S13', 'D16'],
  106: ['T20', 'S6', 'D20'],
  107: ['T19', 'S10', 'D20'],
  108: ['T20', 'S16', 'D16'],
  109: ['T20', 'S9', 'D20'],
  110: ['T20', 'S10', 'D20'],
  111: ['T20', 'S19', 'D16'],
  112: ['T20', 'S12', 'D20'],
  113: ['T20', 'S13', 'D20'],
  114: ['T20', 'S14', 'D20'],
  115: ['T20', 'S15', 'D20'],
  116: ['T20', 'S16', 'D20'],
  117: ['T20', 'S17', 'D20'],
  118: ['T20', 'S18', 'D20'],
  119: ['T19', 'T10', 'D16'],
  120: ['T20', 'S20', 'D20'],
  121: ['T20', 'T11', 'D4'],
  122: ['T18', 'T18', 'D7'],
  123: ['T19', 'T16', 'D3'],
  124: ['T20', 'T14', 'D6'],
  125: ['T20', 'T15', 'D5'],
  126: ['T19', 'T19', 'D6'],
  127: ['T20', 'T17', 'D3'],
  128: ['T18', 'T14', 'D16'],
  129: ['T19', 'T16', 'D9'],
  130: ['T20', 'T18', 'D4'],
  131: ['T20', 'T13', 'D16'],
  132: ['T20', 'T16', 'D12'],
  133: ['T20', 'T19', 'D3'],
  134: ['T20', 'T14', 'D16'],
  135: ['T20', 'T17', 'D12'],
  136: ['T20', 'T20', 'D8'],
  137: ['T20', 'T19', 'D10'],
  138: ['T20', 'T18', 'D12'],
  139: ['T20', 'T13', 'D20'],
  140: ['T20', 'T20', 'D10'],
  141: ['T20', 'T19', 'D12'],
  142: ['T20', 'T14', 'D20'],
  143: ['T20', 'T17', 'D16'],
  144: ['T20', 'T20', 'D12'],
  145: ['T20', 'T19', 'D14'],
  146: ['T20', 'T18', 'D16'],
  147: ['T20', 'T17', 'D18'],
  148: ['T20', 'T16', 'D20'],
  149: ['T20', 'T19', 'D16'],
  150: ['T20', 'T18', 'D18'],
  151: ['T20', 'T17', 'D20'],
  152: ['T20', 'T20', 'D16'],
  153: ['T20', 'T19', 'D18'],
  154: ['T20', 'T18', 'D20'],
  155: ['T20', 'T19', 'D19'],
  156: ['T20', 'T20', 'D18'],
  157: ['T20', 'T19', 'D20'],
  158: ['T20', 'T20', 'D19'],
  160: ['T20', 'T20', 'D20'],
  161: ['T20', 'T17', 'BULL'],
  164: ['T20', 'T18', 'BULL'],
  167: ['T20', 'T19', 'BULL'],
  170: ['T20', 'T20', 'BULL']
};

// Bogey numbers - cannot be checked out
export const BOGEY_NUMBERS = [159, 162, 163, 165, 166, 168, 169];

// ─── Maximum possible scores ───

export const MAX_TURN_SCORE = 180; // T20 + T20 + T20
export const MAX_CHECKOUT = 170;   // T20 + T20 + Bull

// ─── Dart Notation ───

export const DART_NOTATION = {
  S: 'Single',
  D: 'Double',
  T: 'Triple',
  BULL: 'Bullseye'
};
