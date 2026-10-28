/**
 * Mini Game Arcade - Central Games Registry
 * Makes adding, categorizing, and filtering new games clean and instantaneous.
 */

const ARCADE_GAMES = [
  {
    id: 'citrus-blitz',
    title: 'Citrus Blitz',
    category: 'Arcade',
    tags: ['arcade', 'fruit', 'slicer', 'ninja', 'action', 'blade'],
    badge: 'Popular',
    tagline: 'Slice juicy fruits, dodge bombs, and ignite mega combo streaks.',
    description: 'A fast-paced, original arcade fruit-slicing mini-game with realistic slice physics, glowing neon blade swipe trails, and 100% procedural synthesized Web Audio sound effects. Play 60s Arcade Blitz or 3-strike Classic Survival.',
    route: 'games/citrus-blitz/index.html',
    thumbnail: 'assets/games/citrus-blitz.svg',
    controlsSummary: 'Mouse Drag or Touch Swipe to slice. Space/P to Pause, R to Restart, M to Mute.',
    features: ['High-DPI Canvas', 'Web Audio Effects', 'No Downloads', 'Touch & Mouse']
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
