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
  },
  {
    id: 'space-dodge',
    title: 'Space Dodge',
    category: 'Action',
    tags: ['action', 'arcade', 'space', 'dodge', 'reflex', 'survival', 'starship', 'asteroids', 'sci-fi'],
    badge: 'New',
    tagline: 'Pilot cyber starship. Dodge asteroids. Survive deep space.',
    description: 'Pilot an agile cyber starship through hazardous asteroid belts, dodging plasma comets and space mines. Squeeze past cosmic debris for near-miss bonuses, gather golden crystals, deploy kinetic energy shields, and trigger devastating EMP shockwaves across 3 progressive sectors or Endless Hyperspace.',
    route: 'games/space-dodge/index.html',
    thumbnail: 'assets/games/space-dodge.svg',
    controlsSummary: 'Mouse Drag or Touch • Arrow keys / WASD to fly • Space for EMP Blast • P to Pause • R to Restart • M to Mute',
    features: ['3 Sector Waves & Endless', 'Energy Shields & EMP Blasts', 'Near-Miss Dodge Streaks', 'Parallax Starfield & Crystals']
  },
  {
    id: 'number-puzzle',
    title: 'Number Puzzle',
    category: 'Puzzle',
    tags: ['puzzle', 'number', '15-puzzle', 'sliding', 'brain', 'logic', 'math', 'retro'],
    badge: 'New',
    tagline: 'Slide tiles. Order numbers 1 to 15. Beat the clock.',
    description: 'The definitive classic 15-puzzle sliding challenge. Slide adjacent numbered tiles into the empty space to arrange them in numerical order from 1 to 15 with the empty slot in the bottom-right corner. Features 3x3, 4x4, and 5x5 grid modes with move counters and star ratings.',
    route: 'games/number-puzzle/index.html',
    thumbnail: 'assets/games/number-puzzle.svg',
    controlsSummary: 'Click/Tap adjacent tiles • Arrow keys / WASD to slide • Touch swipe • R to Reshuffle • M to Mute',
    features: ['3 Grid Modes: 3x3, 4x4 & 5x5', '100% Solvability Guarantee', 'Move Counter & Stopwatch', 'Star Ratings & High Scores']
  },
  {
    id: 'tap-challenge',
    title: 'Tap Challenge',
    category: 'Arcade',
    tags: ['arcade', 'tap', 'reflex', 'speed', 'challenge', 'rush', 'reaction', 'cps', 'casual'],
    badge: 'New',
    tagline: 'Tap fast. Chain combos. Master your reaction speed.',
    description: 'Test your reaction speed, precision, and finger agility in this high-octane tap arena. Features 3 exciting game modes: Reflex Rush (30s target reaction), Number Sprint (speed 1–16 sequence rush), and CPS Frenzy (10s click speed test) with combo multipliers and star ratings.',
    route: 'games/tap-challenge/index.html',
    thumbnail: 'assets/games/tap-challenge.svg',
    controlsSummary: 'Touch Tap / Mouse Click • QWE/ASD/ZXC or Numpad 1–9 • Space in Frenzy • P to Pause • R to Restart • M to Mute',
    features: ['3 Modes: Reflex, Sprint & Frenzy', 'Combo Multipliers up to 5x', 'Real-time CPS & Stopwatch', 'Tactile Sound & Visual Ripples']
  },
  {
    id: 'block-puzzle',
    title: 'Block Puzzle',
    category: 'Puzzle',
    tags: ['puzzle', 'block', 'grid', 'polyomino', 'tetris', 'logic', 'brain', 'lines', 'casual'],
    badge: 'New',
    tagline: 'Fit shapes. Blast lines. Chain explosive combos.',
    description: 'The definitive 8×8 block puzzle experience. Strategically place polyomino pieces from your dock to clear full horizontal rows and vertical columns. Features Classic Endless, 10-Line Target Challenge, and 90-Second Timed Blitz with combo multipliers and high score saving.',
    route: 'games/block-puzzle/index.html',
    thumbnail: 'assets/games/block-puzzle.svg',
    controlsSummary: 'Drag & Drop / Tap to Place • 1, 2, 3 to select dock • Arrow keys / WASD to move • Space to Place • P to Pause • R to Restart • M to Mute',
    features: ['8x8 Grid & Polyomino Dock', 'Classic, Challenge & Blitz', 'Row & Column Blast Combos', 'Full Keyboard & Touch Support']
  },
  {
    id: 'stack-rush',
    title: 'Stack Rush',
    category: 'Arcade',
    tags: ['arcade', '3d', 'stack', 'tower', 'timing', 'reflex', 'blocks', 'trim', 'one-button', 'casual'],
    badge: 'New',
    tagline: 'One-button 3D tower stacker. Time the drop. Trim the excess.',
    description: 'Blocks glide horizontally across alternating 3D axes. Tap, click, or press Space to drop each block and build the tallest tower possible. Poorly aligned blocks get trimmed with realistic falling debris physics, making each subsequent move harder. Features ascending chime combos, particle sparkle bursts, increasing speed, and instant restart.',
    route: 'games/stack-rush/index.html',
    thumbnail: 'assets/games/stack-rush.svg',
    controlsSummary: 'Tap Screen / Click / Spacebar to Drop • Instant One-Touch Restart • P to Pause • R to Restart • M to Mute',
    features: ['One-Button Gameplay', 'Satisfying 3D Trimming', 'Ascending Chime Combos', 'Personal Best & Instant Restart']
  },
  {
    id: 'circuit-connect',
    title: 'Circuit Connect',
    category: 'Puzzle',
    tags: ['puzzle', 'circuit', 'color-chain', 'flow', 'logic', 'connect', 'wire', 'grid', 'brain'],
    badge: 'New',
    tagline: 'Connect matching colors. Cover 100% of the board.',
    description: 'Draw continuous glowing paths between matching colored neon dots across the grid. Every single cell on the board must be filled without crossing wires to complete the puzzle! Features 30 progressive handcrafted levels (5x5 to 8x8), smart hint solver, 3-star efficiency ratings, and local progression.',
    route: 'games/circuit-connect/index.html',
    thumbnail: 'assets/games/circuit-connect.svg',
    controlsSummary: 'Click & Drag / Touch Swipe to Draw Path • Dragging Backward Backtracks • Arrow Keys / WASD + Spacebar to Navigate • H for Hint • U to Undo • R to Restart',
    features: ['30 Progressive Levels', '100% Board Fill Constraint', 'Smart Hint Solver', 'Progress Saved Locally']
  },
  {
    id: 'dashverse',
    title: 'Dashverse',
    category: 'Action',
    tags: ['action', 'runner', 'endless', 'parkour', 'cyberpunk', 'neon', 'rooftop', 'jump', 'slide', 'reflex'],
    badge: 'New',
    tagline: 'Vault rooftops. Slide lasers. Deliver packages.',
    description: 'Embark on a high-octane parkour adventure through a neon-lit cyber metropolis. As Dash, vault chasms, double jump over roof vents, slide under overhead laser barriers, collect data shards, unlock cyber couriers, and complete mission-based deliveries.',
    route: 'games/dashverse/index.html',
    thumbnail: 'assets/games/dashverse.svg',
    controlsSummary: 'Up / W / Space to Jump & Double Jump • Down / S to Slide • Tap / Swipe on Mobile • Dedicated On-Screen Thumb Buttons • P to Pause • R to Restart • M to Mute',
    features: ['Endless Rooftop Runner', 'Unlockable Runners & Perks', 'Missions & Daily Challenges', 'Personal Best & Double Jump']
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
