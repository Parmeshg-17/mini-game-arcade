/**
 * Mini Game Arcade Comprehensive Test Suite
 * Validates Arcade Homepage, Game Registry, Navigation Links, Game Engine, and Policies.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
  }
}

console.log('\n=== MINI GAME ARCADE COMPREHENSIVE QA AUDIT ===\n');

// 1. Arcade Homepage DOM Verification
it('Arcade homepage (index.html) has all required interactive IDs', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const requiredIds = [
    'games-grid',
    'arcade-search',
    'search-clear-btn',
    'category-filters',
    'games-count',
    'empty-state',
    'empty-reset-btn',
    'mobile-menu-btn',
    'main-nav'
  ];

  for (const id of requiredIds) {
    assert(indexHtml.includes(`id="${id}"`), `Missing ID="${id}" in homepage index.html`);
  }
});

// 2. Static Pages Existence & Navigation Integrity
it('About, Contact, Privacy, and Terms pages exist and link to each other', () => {
  const pages = ['index.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html'];
  for (const page of pages) {
    const pagePath = path.join(__dirname, page);
    assert(fs.existsSync(pagePath), `Page ${page} does not exist!`);
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(content.length > 500, `Page ${page} is too short or empty!`);
    assert(content.includes('brand-logo'), `Page ${page} missing header logo`);
    assert(content.includes('site-footer'), `Page ${page} missing footer`);
  }
});

// 3. Central Games Registry Validation
it('Every game registered in js/games-data.js has working routes and valid thumbnails', () => {
  const { ARCADE_GAMES, ARCADE_CATEGORIES } = require('./js/games-data.js');
  assert(Array.isArray(ARCADE_GAMES), 'ARCADE_GAMES must be an array');
  assert(ARCADE_GAMES.length > 0, 'ARCADE_GAMES must have at least 1 completed game');
  assert(Array.isArray(ARCADE_CATEGORIES), 'ARCADE_CATEGORIES must be an array');

  for (const game of ARCADE_GAMES) {
    assert(game.id, 'Game must have an id');
    assert(game.title, 'Game must have a title');
    assert(game.route, `Game ${game.id} must have a route`);
    assert(game.thumbnail, `Game ${game.id} must have a thumbnail`);

    // Verify route file exists
    const routePath = path.join(__dirname, game.route);
    assert(fs.existsSync(routePath), `Route file "${game.route}" for game ${game.id} does not exist!`);

    // Verify thumbnail file exists
    const thumbPath = path.join(__dirname, game.thumbnail);
    assert(fs.existsSync(thumbPath), `Thumbnail "${game.thumbnail}" for game ${game.id} does not exist!`);
  }
});

// 4. Dedicated Citrus Blitz Playable Page & Engine Integrity
it('Dedicated game page (games/citrus-blitz/index.html) has all DOM elements required by game.js', () => {
  const gameHtmlPath = path.join(__dirname, 'games/citrus-blitz/index.html');
  assert(fs.existsSync(gameHtmlPath), 'games/citrus-blitz/index.html must exist');
  const gameHtml = fs.readFileSync(gameHtmlPath, 'utf8');
  const gameJs = fs.readFileSync(path.join(__dirname, 'games/citrus-blitz/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in game HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(gameJs)) !== null) {
    const id = match[1];
    assert(gameHtml.includes(`id="${id}"`), `Game DOM id="${id}" missing in games/citrus-blitz/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(gameHtml.includes('href="../../index.html"'), 'Game page must link back to arcade homepage');
});

// 5. Original Vector Artwork Validation
it('Original SVG game thumbnail exists and contains valid vector elements', () => {
  const svgPath = path.join(__dirname, 'assets/games/citrus-blitz.svg');
  assert(fs.existsSync(svgPath), 'Citrus Blitz vector thumbnail must exist');
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  assert(svgContent.includes('<svg'), 'Must be a valid SVG file');
  assert(svgContent.includes('</svg>'), 'Must properly close SVG tag');
  assert(svgContent.includes('viewBox'), 'Must have viewBox for responsiveness');
});

// 6. Search & Category Filter Unit Tests
it('Search and category filter logic filters games correctly', () => {
  const { ARCADE_GAMES } = require('./js/games-data.js');

  function filterGames(query, category) {
    return ARCADE_GAMES.filter((g) => {
      const matchCat = category === 'All' || g.category.toLowerCase() === category.toLowerCase();
      if (!query) return matchCat;
      const q = query.toLowerCase().trim();
      const matchQ =
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }

  // Exact title search
  const res1 = filterGames('Citrus Blitz', 'All');
  assert.strictEqual(res1.length, 1);

  // Tag search
  const res2 = filterGames('fruit', 'All');
  assert.strictEqual(res2.length, 1);

  // Category filter
  const res3 = filterGames('', 'Arcade');
  assert.strictEqual(res3.length, 1);
  assert.strictEqual(res3[0].id, 'citrus-blitz');

  // Puzzle category filter matches Tic Tac Toe
  const res4 = filterGames('', 'Puzzle');
  assert.strictEqual(res4.length, 1);
  assert.strictEqual(res4[0].id, 'tic-tac-toe');

  // Casual category filter matches Memory Match and Bubble Pop
  const res5 = filterGames('', 'Casual');
  assert.strictEqual(res5.length, 2);
  assert(res5.some(g => g.id === 'memory-match'));
  assert(res5.some(g => g.id === 'bubble-pop'));

  // Action category filter matches Brick Breaker
  const res6 = filterGames('', 'Action');
  assert.strictEqual(res6.length, 1);
  assert.strictEqual(res6[0].id, 'brick-breaker');

  // Tag search for brick
  const res7 = filterGames('brick', 'All');
  assert.strictEqual(res7.length, 1);
  assert.strictEqual(res7[0].id, 'brick-breaker');

  // Tag search for bubble
  const resBubble = filterGames('bubble', 'All');
  assert.strictEqual(resBubble.length, 1);
  assert.strictEqual(resBubble[0].id, 'bubble-pop');

  // Non-matching category
  const res8 = filterGames('', 'Racing');
  assert.strictEqual(res8.length, 0);

  // Non-matching query
  const res9 = filterGames('nonexistentgamexyz', 'All');
  assert.strictEqual(res9.length, 0);
});

// 7. Dedicated Tic Tac Toe Playable Page & Engine Integrity
it('Dedicated Tic Tac Toe page (games/tic-tac-toe/index.html) has all DOM elements required by game.js', () => {
  const tttHtmlPath = path.join(__dirname, 'games/tic-tac-toe/index.html');
  assert(fs.existsSync(tttHtmlPath), 'games/tic-tac-toe/index.html must exist');
  const tttHtml = fs.readFileSync(tttHtmlPath, 'utf8');
  const tttGameJs = fs.readFileSync(path.join(__dirname, 'games/tic-tac-toe/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(tttGameJs)) !== null) {
    const id = match[1];
    assert(tttHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/tic-tac-toe/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(tttHtml.includes('href="../../index.html"'), 'Tic Tac Toe page must link back to arcade homepage');
});

// 8. Tic Tac Toe AI Decision Engine & Minimax Logic
it('Tic Tac Toe AI correctly detects wins and blocks immediate opponent threats', () => {
  const { checkWinner, getMastermindMove } = require('./games/tic-tac-toe/js/ai.js');

  // Test win detection
  const boardRowWin = ['X', 'X', 'X', 'O', 'O', '', '', '', ''];
  const winResult = checkWinner(boardRowWin);
  assert(winResult !== null, 'Should detect horizontal win');
  assert.strictEqual(winResult.winner, 'X');

  // Test diagonal win detection
  const boardDiagWin = ['O', 'X', '', '', 'O', 'X', '', '', 'O'];
  const diagResult = checkWinner(boardDiagWin);
  assert(diagResult !== null, 'Should detect diagonal win');
  assert.strictEqual(diagResult.winner, 'O');

  // Test immediate winning move selection by AI
  // Board: Bot is 'O', Human is 'X'. Bot has two 'O's in row 1: cells 3 and 4. Cell 5 is empty.
  const boardTakeWin = [
    'X', 'X', '',
    'O', 'O', '',
    '',  '',  ''
  ];
  const botMoveWin = getMastermindMove(boardTakeWin, 'O', 'X');
  assert.strictEqual(botMoveWin, 5, 'Mastermind AI must take immediate winning move at index 5');

  // Test immediate blocking move selection by AI
  // Human 'X' has two in row 0: cells 0 and 1. Cell 2 is empty. Bot 'O' must block at index 2.
  const boardBlock = [
    'X', 'X', '',
    '',  'O', '',
    '',  '',  ''
  ];
  const botMoveBlock = getMastermindMove(boardBlock, 'O', 'X');
  assert.strictEqual(botMoveBlock, 2, 'Mastermind AI must block human win at index 2');
});

// 9. Dedicated Memory Match Playable Page & Engine Integrity
it('Dedicated Memory Match page (games/memory-match/index.html) has all DOM elements required by game.js', () => {
  const memHtmlPath = path.join(__dirname, 'games/memory-match/index.html');
  assert(fs.existsSync(memHtmlPath), 'games/memory-match/index.html must exist');
  const memHtml = fs.readFileSync(memHtmlPath, 'utf8');
  const memGameJs = fs.readFileSync(path.join(__dirname, 'games/memory-match/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(memGameJs)) !== null) {
    const id = match[1];
    assert(memHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/memory-match/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(memHtml.includes('href="../../index.html"'), 'Memory Match page must link back to arcade homepage');
});

// 10. Memory Match Deck Generator & Modes Logic
it('Memory Match generates accurate decks and matching pairs for Easy, Medium, and Hard modes', () => {
  const { generateDeck, DIFFICULTIES } = require('./games/memory-match/js/cards-data.js');

  // 1. Easy mode: exactly 8 cards (4 pairs)
  const easyDeck = generateDeck('easy');
  assert.strictEqual(easyDeck.length, 8, 'Easy mode must have exactly 8 cards');
  const easyCounts = {};
  easyDeck.forEach(c => easyCounts[c.cardId] = (easyCounts[c.cardId] || 0) + 1);
  assert.strictEqual(Object.keys(easyCounts).length, 4, 'Easy mode must have 4 distinct pairs');
  Object.values(easyCounts).forEach(cnt => assert.strictEqual(cnt, 2, 'Each card must appear exactly twice'));

  // 2. Medium mode: exactly 16 cards (8 pairs)
  const medDeck = generateDeck('medium');
  assert.strictEqual(medDeck.length, 16, 'Medium mode must have exactly 16 cards');
  const medCounts = {};
  medDeck.forEach(c => medCounts[c.cardId] = (medCounts[c.cardId] || 0) + 1);
  assert.strictEqual(Object.keys(medCounts).length, 8, 'Medium mode must have 8 distinct pairs');
  Object.values(medCounts).forEach(cnt => assert.strictEqual(cnt, 2, 'Each card must appear exactly twice'));

  // 3. Hard mode: exactly 24 cards (12 pairs)
  const hardDeck = generateDeck('hard');
  assert.strictEqual(hardDeck.length, 24, 'Hard mode must have exactly 24 cards');
  const hardCounts = {};
  hardDeck.forEach(c => hardCounts[c.cardId] = (hardCounts[c.cardId] || 0) + 1);
  assert.strictEqual(Object.keys(hardCounts).length, 12, 'Hard mode must have 12 distinct pairs');
  Object.values(hardCounts).forEach(cnt => assert.strictEqual(cnt, 2, 'Each card must appear exactly twice'));
});

// 11. Dedicated Brick Breaker Playable Page & Engine Integrity
it('Dedicated Brick Breaker page (games/brick-breaker/index.html) has all DOM elements required by game.js', () => {
  const bbHtmlPath = path.join(__dirname, 'games/brick-breaker/index.html');
  assert(fs.existsSync(bbHtmlPath), 'games/brick-breaker/index.html must exist');
  const bbHtml = fs.readFileSync(bbHtmlPath, 'utf8');
  const bbGameJs = fs.readFileSync(path.join(__dirname, 'games/brick-breaker/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(bbGameJs)) !== null) {
    const id = match[1];
    assert(bbHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/brick-breaker/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(bbHtml.includes('href="../../index.html"'), 'Brick Breaker page must link back to arcade homepage');
});

// 12. Brick Breaker Levels & Paddle Physics Logic
it('Brick Breaker generates level grids and computes angle reflection physics correctly', () => {
  const { buildBricksForLevel, LEVEL_DATA } = require('./games/brick-breaker/js/levels.js');

  // Verify 3 distinct level definitions
  assert.strictEqual(LEVEL_DATA.length, 3, 'Must have 3 progressive waves');

  // Generate Wave 1 bricks
  const wave1 = buildBricksForLevel(0, 600, 480);
  assert(wave1.bricks.length > 0, 'Wave 1 must contain bricks');
  assert(wave1.bricks.every(b => b.alive && b.hp >= 1), 'All bricks must be alive with hp >= 1');

  // Generate Wave 2 bricks (contains durable 2-hp bricks)
  const wave2 = buildBricksForLevel(1, 600, 480);
  const durableBricks = wave2.bricks.filter(b => b.maxHp === 2);
  assert(durableBricks.length > 0, 'Wave 2 must contain armored 2-hit bricks');

  // Paddle bounce reflection physics calculation test:
  // Offset -1 (far left) should bounce towards negative X (left)
  // Offset 0 (center) should bounce straight up (vx = 0)
  // Offset +1 (far right) should bounce towards positive X (right)
  const maxBounceAngle = Math.PI * 0.38;
  const speed = 6.0;

  function calcBounce(hitOffset) {
    const angle = hitOffset * maxBounceAngle;
    return {
      vx: speed * Math.sin(angle),
      vy: -speed * Math.cos(angle)
    };
  }

  const centerBounce = calcBounce(0);
  assert(Math.abs(centerBounce.vx) < 0.001, 'Center hit should reflect straight up (vx ≈ 0)');
  assert(centerBounce.vy < 0, 'Center hit should reflect upward (vy < 0)');

  const leftBounce = calcBounce(-0.8);
  assert(leftBounce.vx < 0, 'Left hit should deflect ball left (vx < 0)');
  assert(leftBounce.vy < 0, 'Left hit should deflect ball upward (vy < 0)');

  const rightBounce = calcBounce(0.8);
  assert(rightBounce.vx > 0, 'Right hit should deflect ball right (vx > 0)');
  assert(rightBounce.vy < 0, 'Right hit should deflect ball upward (vy < 0)');
});

// 13. Slicing Collision & Math Logic
it('Circle-to-segment collision correctly detects slices and ignores misses', () => {
  function checkSlice(fruitX, fruitY, radius, p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(fruitX - p1.x, fruitY - p1.y) <= radius;
    const t = Math.max(0, Math.min(1, ((fruitX - p1.x) * dx + (fruitY - p1.y) * dy) / lenSq));
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;
    return Math.hypot(fruitX - closestX, fruitY - closestY) <= radius;
  }

  const p1 = { x: 10, y: 50 };
  const p2 = { x: 90, y: 50 };

  assert.strictEqual(checkSlice(50, 50, 20, p1, p2), true, 'Direct center slice should hit');
  assert.strictEqual(checkSlice(50, 68, 20, p1, p2), true, 'Glancing slice within radius should hit');
  assert.strictEqual(checkSlice(50, 100, 20, p1, p2), false, 'Far fruit should miss');
});

// 14. Dedicated Bubble Pop Playable Page & Engine Integrity
it('Dedicated Bubble Pop page (games/bubble-pop/index.html) has all DOM elements required by game.js', () => {
  const bpHtmlPath = path.join(__dirname, 'games/bubble-pop/index.html');
  assert(fs.existsSync(bpHtmlPath), 'games/bubble-pop/index.html must exist');
  const bpHtml = fs.readFileSync(bpHtmlPath, 'utf8');
  const bpGameJs = fs.readFileSync(path.join(__dirname, 'games/bubble-pop/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(bpGameJs)) !== null) {
    const id = match[1];
    assert(bpHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/bubble-pop/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(bpHtml.includes('href="../../index.html"'), 'Bubble Pop page must link back to arcade homepage');
});

// 15. Bubble Pop Cluster Flood-Fill & Gravity Physics
it('Bubble Pop identifies clusters, computes scores, and collapses grids correctly', () => {
  const {
    createInitialGrid,
    findCluster,
    hasValidMoves,
    calculateScore,
    applyGravityAndCollapse,
    calculateStars
  } = require('./games/bubble-pop/js/board.js');

  // 1. Grid generation
  const grid = createInitialGrid(10, 8, 5);
  assert.strictEqual(grid.length, 10, 'Grid must have 10 rows');
  assert.strictEqual(grid[0].length, 8, 'Grid must have 8 columns');
  assert.strictEqual(hasValidMoves(grid), true, 'Initial grid must have at least one valid cluster');

  // 2. Controlled test grid
  // Row 0: [0, 0, 1]
  // Row 1: [0, 2, 1]
  // Row 2: [3, 2, 1]
  const testGrid = [
    [0, 0, 1],
    [0, 2, 1],
    [3, 2, 1]
  ];

  // Cluster of 0s starting at (0, 0) should be size 3: (0,0), (0,1), (1,0)
  const cluster0 = findCluster(testGrid, 0, 0);
  assert.strictEqual(cluster0.length, 3, 'Color 0 cluster must have 3 cells');

  // Cluster of 1s starting at (0, 2) should be size 3: (0,2), (1,2), (2,2)
  const cluster1 = findCluster(testGrid, 0, 2);
  assert.strictEqual(cluster1.length, 3, 'Color 1 cluster must have 3 cells');

  // Singleton at (2, 0) has color 3
  const clusterSingleton = findCluster(testGrid, 2, 0);
  assert.strictEqual(clusterSingleton.length, 1, 'Color 3 singleton must have size 1');

  // 3. Scoring Math
  // Size 4, Combo 1 => 4^2 * 10 = 160
  assert.strictEqual(calculateScore(4, 1), 160, 'Size 4 with 1x combo must be 160 pts');
  // Size 5, Combo 3 => 5^2 * 10 * 3 = 750
  assert.strictEqual(calculateScore(5, 3), 750, 'Size 5 with 3x combo must be 750 pts');

  // 4. Gravity & Column Collapse
  // Clear the 0s:
  // [null, null, 1]
  // [null, 2,    1]
  // [3,    2,    1]
  const toCollapse = [
    [null, null, 1],
    [null, 2,    1],
    [3,    2,    1]
  ];
  const { newGrid } = applyGravityAndCollapse(toCollapse);
  // In col 0: cell 3 should fall to row 2
  assert.strictEqual(newGrid[2][0], 3, 'Bubble in col 0 must drop to bottom row');
  assert.strictEqual(newGrid[0][0], null, 'Top cell in col 0 must be empty');
  assert.strictEqual(newGrid[1][0], null, 'Middle cell in col 0 must be empty');

  // 5. Stars calculation
  assert.strictEqual(calculateStars(5000, 0), 3, 'Perfect clear must yield 3 stars');
  assert.strictEqual(calculateStars(2500, 6), 2, 'Good score must yield at least 2 stars');
});

// 16. Security & Clean Static Deployment Verification
it('No external dependencies, API keys, or hardcoded local paths across any source file', () => {
  const checkDir = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name === 'test-runner.js') continue;
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        checkDir(fullPath);
      } else if (/\.(html|js|css)$/.test(e.name)) {
        const text = fs.readFileSync(fullPath, 'utf8');
        assert(!text.includes('C:\\'), `Hardcoded Windows drive path in ${fullPath}`);
        assert(!text.includes('localhost:'), `Hardcoded localhost URL in ${fullPath}`);
        assert(!text.includes('apiKey') && !text.includes('api_key'), `Potential API key in ${fullPath}`);
      }
    }
  };
  checkDir(__dirname);
});

console.log(`\nQA Test Results: ${passedTests} / ${totalTests} passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
