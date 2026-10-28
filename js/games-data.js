/**
 * Mini Game Arcade - Central Games Registry
 * Editorial metadata for playable browser mini-games.
 */

const ARCADE_GAMES = [
  {
    id: 'citrus-blitz',
    title: 'Citrus Blitz',
    category: 'Arcade',
    tags: ['arcade', 'fruit', 'slicer', 'action', 'blade', 'reflex', 'canvas'],
    badge: 'Featured',
    tagline: 'Slice fast. Chain combos. Beat your best.',
    description: 'Slice fruit, avoid bombs, and build your highest score in a fast-paced browser arcade challenge. Engineered with 100% procedural Canvas 2D physics, dynamic blade swipe trails, and synthesized Web Audio effects.',
    route: 'games/citrus-blitz/index.html',
    thumbnail: 'assets/games/citrus-blitz.svg',
    controlsSummary: 'Mouse Drag or Touch Swipe to slice • Space / P to Pause • R to Restart • M to Mute',
    features: ['Canvas 2D Physics', 'Procedural Audio', 'Touch & Mouse', '60s Blitz & Survival']
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic Tac Toe',
    category: 'Puzzle',
    tags: ['puzzle', 'strategy', 'casual', 'tic-tac-toe', 'bot', 'ai', '2-player', 'multiplayer'],
    badge: 'New',
    tagline: 'Claim three in a row. Me vs Bot & 2 Players.',
    description: 'Challenge the unbeatable Mastermind Bot or play head-to-head 2-player pass & play on the same device. Features synthesized arcade audio, laser strike animations, match timer, move counter, and persistent scoreboard.',
    route: 'games/tic-tac-toe/index.html',
    thumbnail: 'assets/games/tic-tac-toe.svg',
    controlsSummary: 'Touch / Click cells • Number keys 1-9 • Arrow keys + Enter • R to Restart • M to Mute',
    features: ['Me vs Bot & 2 Players', 'Unbeatable Minimax AI', 'Keyboard & Touch', 'Match Timer & Scoreboard']
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    category: 'Casual',
    tags: ['casual', 'puzzle', 'memory', 'cards', 'brain', 'matching', 'reflex'],
    badge: 'New',
    tagline: 'Flip cards. Find pairs. Beat the clock.',
    description: 'Challenge your visual recall across Easy (8 cards), Medium (16 cards), and Hard (24 cards) modes. Features 3D card-flip animations, synthesized Web Audio effects, moves counter, match timer, and star ratings.',
    route: 'games/memory-match/index.html',
    thumbnail: 'assets/games/memory-match.svg',
    controlsSummary: 'Click or Tap to flip cards • Arrow keys + Enter/Space • R to Restart • M to Mute',
    features: ['3 Modes: Easy, Med & Hard', '3D Card Flip Animation', 'Timer & Move Counter', 'Star Rating & High Scores']
  }
];

const ARCADE_CATEGORIES = ['All', 'Arcade', 'Action', 'Puzzle', 'Casual'];

// Export for browser
if (typeof window !== 'undefined') {
  window.ARCADE_GAMES = ARCADE_GAMES;
  window.ARCADE_CATEGORIES = ARCADE_CATEGORIES;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARCADE_GAMES, ARCADE_CATEGORIES };
}
