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
  },
  {
    id: 'brick-breaker',
    title: 'Brick Breaker',
    category: 'Action',
    tags: ['action', 'arcade', 'retro', 'bricks', 'breakout', 'ball', 'paddle', 'physics'],
    badge: 'New',
    tagline: 'Shatter neon bricks. Catch power-ups. Survive 3 waves.',
    description: 'A responsive retro-arcade breakout experience engineered with 100% Canvas 2D physics. Features angle-deflecting paddle rebounds, multi-ball chaos, expanding paddles, particle shatter bursts, and combo score multipliers.',
    route: 'games/brick-breaker/index.html',
    thumbnail: 'assets/games/brick-breaker.svg',
    controlsSummary: 'Mouse Drag or Touch • Arrow keys / A & D • Space to Launch/Pause • R to Restart • M to Mute',
    features: ['3 Progressive Waves', 'Multi-Ball & Power-Ups', 'Angle Reflection Physics', 'Combo Streaks & High Scores']
  },
  {
    id: 'bubble-pop',
    title: 'Bubble Pop',
    category: 'Casual',
    tags: ['casual', 'puzzle', 'bubble', 'pop', 'shooter', 'aim', 'ricochet', 'match-3', 'arcade'],
    badge: 'New',
    tagline: 'Aim laser ricochets. Match 3+ bubbles. Trigger avalanches.',
    description: 'A classic arcade bubble shooter featuring reflective laser aiming, hexagonal grid snapping, Match-3 bursting, and falling island avalanches. Aim ricochet trick shots off side walls, swap colors, and deploy power boosters.',
    route: 'games/bubble-pop/index.html',
    thumbnail: 'assets/games/bubble-pop.svg',
    controlsSummary: 'Mouse Drag or Touch to aim • Click/Release to fire • Tap Next Bubble or S to Swap • P to Pause • R to Restart',
    features: ['Laser Ricochet Aiming', 'Hexagonal Grid & Avalanches', 'Ammo Counter & Bubble Swap', 'Bomb & Power Boosters']
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
