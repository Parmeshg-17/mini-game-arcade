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
