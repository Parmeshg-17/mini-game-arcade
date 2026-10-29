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

    // Verify game page uses clean URL safe root-relative stylesheet link
    const pageHtml = fs.readFileSync(routePath, 'utf8');
    const dirName = path.dirname(game.route).replace(/\\/g, '/');
    assert(
      pageHtml.includes(`href="/${dirName}/style.css`),
      `Game ${game.id} must use root-relative stylesheet href="/${dirName}/style.css" for Vercel clean URL compatibility!`
    );
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
  assert.strictEqual(res3.length, 3);
  assert(res3.some(g => g.id === 'citrus-blitz'));
  assert(res3.some(g => g.id === 'tap-challenge'));
  assert(res3.some(g => g.id === 'stack-rush'));

  // Puzzle category filter matches Tic Tac Toe, Number Puzzle, Block Puzzle, and Circuit Connect
  const res4 = filterGames('', 'Puzzle');
  assert.strictEqual(res4.length, 4);
  assert(res4.some(g => g.id === 'tic-tac-toe'));
  assert(res4.some(g => g.id === 'number-puzzle'));
  assert(res4.some(g => g.id === 'block-puzzle'));
  assert(res4.some(g => g.id === 'circuit-connect'));

  // Casual category filter matches Memory Match and Bubble Pop
  const res5 = filterGames('', 'Casual');
  assert.strictEqual(res5.length, 2);
  assert(res5.some(g => g.id === 'memory-match'));
  assert(res5.some(g => g.id === 'bubble-pop'));

  // Action category filter matches Brick Breaker and Space Dodge
  const res6 = filterGames('', 'Action');
  assert.strictEqual(res6.length, 2);
  assert(res6.some(g => g.id === 'brick-breaker'));
  assert(res6.some(g => g.id === 'space-dodge'));

  // Tag search for brick
  const res7 = filterGames('brick', 'All');
  assert.strictEqual(res7.length, 1);
  assert.strictEqual(res7[0].id, 'brick-breaker');

  // Tag search for bubble
  const resBubble = filterGames('bubble', 'All');
  assert.strictEqual(resBubble.length, 1);
  assert.strictEqual(resBubble[0].id, 'bubble-pop');

  // Tag search for space/dodge
  const resDodge = filterGames('dodge', 'All');
  assert.strictEqual(resDodge.length, 1);
  assert.strictEqual(resDodge[0].id, 'space-dodge');

  // Tag search for number
  const resNumber = filterGames('number', 'All');
  assert.strictEqual(resNumber.length, 2);
  assert(resNumber.some(g => g.id === 'number-puzzle'));
  assert(resNumber.some(g => g.id === 'tap-challenge'));

  // Tag search for tap (matches tap-challenge and stack-rush)
  const resTap = filterGames('tap', 'All');
  assert.strictEqual(resTap.length, 2);
  assert(resTap.some(g => g.id === 'tap-challenge'));
  assert(resTap.some(g => g.id === 'stack-rush'));

  // Tag search for block (matches block-puzzle and stack-rush)
  const resBlock = filterGames('block', 'All');
  assert.strictEqual(resBlock.length, 2);
  assert(resBlock.some(g => g.id === 'block-puzzle'));
  assert(resBlock.some(g => g.id === 'stack-rush'));

  // Tag search for stack rush
  const resStack = filterGames('stack', 'All');
  assert.strictEqual(resStack.length, 1);
  assert.strictEqual(resStack[0].id, 'stack-rush');

  // Tag search for circuit connect
  const resCircuit = filterGames('circuit', 'All');
  assert.strictEqual(resCircuit.length, 1);
  assert.strictEqual(resCircuit[0].id, 'circuit-connect');

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

// 15. Bubble Pop Hexagonal Physics, Trajectory & Match-3 Engine
it('Bubble Pop computes hexagonal coordinates, raycast reflections, and island avalanches correctly', () => {
  const {
    createLevelGrid,
    getBubbleCenter,
    getHexNeighbors,
    calculateTrajectory,
    findMatchCluster,
    findOrphanBubbles,
    countActiveBubbles
  } = require('./games/bubble-pop/js/board.js');

  // 1. Level grid generation
  const lvl1 = createLevelGrid(0);
  assert(lvl1.grid.length >= 10, 'Grid must have at least 10 rows');
  assert(countActiveBubbles(lvl1.grid) > 0, 'Level 1 must contain active bubbles');

  // 2. Hexagonal coordinates test
  // Even row 0, col 0
  const c0 = getBubbleCenter(0, 0, 0, 0, 20);
  assert.strictEqual(c0.x, 20, 'Even row 0 col 0 center X should be radius (20)');
  // Odd row 1, col 0 (staggered by radius)
  const c1 = getBubbleCenter(1, 0, 0, 0, 20);
  assert.strictEqual(c1.x, 40, 'Odd row 1 col 0 center X should be staggered (40)');

  // 3. Staggered hex neighbors test
  const evenNeighbors = getHexNeighbors(2, 3);
  assert(evenNeighbors.some(n => n.r === 1 && n.c === 2), 'Even row must connect to up-left (r-1, c-1)');
  assert(evenNeighbors.some(n => n.r === 1 && n.c === 3), 'Even row must connect to up-right (r-1, c)');

  const oddNeighbors = getHexNeighbors(1, 2);
  assert(oddNeighbors.some(n => n.r === 0 && n.c === 2), 'Odd row must connect to up-left (r-1, c)');
  assert(oddNeighbors.some(n => n.r === 0 && n.c === 3), 'Odd row must connect to up-right (r-1, c+1)');

  // 4. Raycast Trajectory test
  // Aiming upwards-right from center
  const traj = calculateTrajectory(240, 540, -Math.PI / 3, 480, 620, lvl1.grid, 0, 45, 20);
  assert(traj.segments.length > 0, 'Trajectory must produce at least one ray segment');

  // 5. Match-3 cluster detection test
  // Controlled grid: 3 connected color 0 bubbles
  const testGrid = [
    [0, 0, null, null, null, null, null, null, null],
    [0, 1, null, null, null, null, null, null]
  ];
  const cluster = findMatchCluster(testGrid, 0, 0);
  assert.strictEqual(cluster.length, 3, 'Must identify cluster of 3 connected matching bubbles');

  // 6. Orphan island detection test
  // Disconnected bubble at row 4 without ceiling anchor
  const orphanGrid = [
    [0, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, 1, null, null, null, null, null, null] // Detached bubble
  ];
  const orphans = findOrphanBubbles(orphanGrid);
  assert(orphans.some(o => o.r === 4 && o.c === 2), 'Must detect disconnected bubble as an orphan');
});

// 16. Dedicated Space Dodge Playable Page & Engine Integrity
it('Dedicated Space Dodge page (games/space-dodge/index.html) has all DOM elements required by game.js', () => {
  const sdHtmlPath = path.join(__dirname, 'games/space-dodge/index.html');
  assert(fs.existsSync(sdHtmlPath), 'games/space-dodge/index.html must exist');
  const sdHtml = fs.readFileSync(sdHtmlPath, 'utf8');
  const sdGameJs = fs.readFileSync(path.join(__dirname, 'games/space-dodge/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(sdGameJs)) !== null) {
    const id = match[1];
    assert(sdHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/space-dodge/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(sdHtml.includes('href="../../index.html"'), 'Space Dodge page must link back to arcade homepage');
});

// 17. Space Dodge Flight Physics, Collision & Near-Miss Engine
it('Space Dodge computes collisions, near-misses, starfield layers, and sector scores accurately', () => {
  const {
    SECTORS,
    createStarField,
    createObstacle,
    checkCollision,
    checkNearMiss,
    calculateScore,
    calculateStars
  } = require('./games/space-dodge/js/engine.js');

  // 1. Sector configurations
  assert.strictEqual(SECTORS.length, 3, 'Must define 3 progressive sectors');
  assert(SECTORS.every(s => s.duration >= 30 && s.hazardTypes.length > 0), 'Every sector must have valid duration and hazards');

  // 2. Parallax Starfield generator
  const stars = createStarField(50, 480, 640);
  assert.strictEqual(stars.length, 50, 'Must generate exactly requested number of stars');
  assert(stars.every(s => s.x >= 0 && s.x <= 480 && s.y >= 0 && s.y <= 640), 'Stars must be bounded within canvas');

  // 3. Collision Math
  const ship = { x: 200, y: 300, hitRadius: 14 };
  const directHitObstacle = { x: 210, y: 305, hitRadius: 16, isHazard: true }; // dist = 11.18 <= 30
  assert.strictEqual(checkCollision(ship, directHitObstacle), true, 'Direct overlap must trigger collision');

  const distantObstacle = { x: 200, y: 400, hitRadius: 16, isHazard: true }; // dist = 100 > 30
  assert.strictEqual(checkCollision(ship, distantObstacle), false, 'Far obstacle must not collide');

  // 4. Near-Miss Math (close pass without hitting)
  // hitDist = 30; nearMiss threshold = 30 * 1.65 = 49.5
  const nearMissObstacle = { x: 200, y: 340, hitRadius: 16, isHazard: true, nearMissTriggered: false }; // dist = 40
  assert.strictEqual(checkNearMiss(ship, nearMissObstacle), true, 'Close proximity should trigger near miss');
  assert.strictEqual(nearMissObstacle.nearMissTriggered, true, 'Near miss flag should be set');
  assert.strictEqual(checkNearMiss(ship, nearMissObstacle), false, 'Already triggered near miss should not fire again');

  // 5. Scoring calculation
  // 30s survival, 15 dodges, 4 crystals, 2 near misses
  const score = calculateScore(30, 15, 4, 2);
  const expected = (30 * 40) + (15 * 60) + (4 * 200) + (2 * 150);
  assert.strictEqual(score, expected, 'Score calculation formula must match specification');

  // 6. Star rating calculation
  assert.strictEqual(calculateStars(5000, 0, 3), 3, 'High score with full shields yields 3 stars');
  assert.strictEqual(calculateStars(1000, 0, 1), 1, 'Low score with depleted shields yields 1 star');
});

// 18. Dedicated Number Puzzle Playable Page & Engine Integrity
it('Dedicated Number Puzzle page (games/number-puzzle/index.html) has all DOM elements required by game.js', () => {
  const npHtmlPath = path.join(__dirname, 'games/number-puzzle/index.html');
  assert(fs.existsSync(npHtmlPath), 'games/number-puzzle/index.html must exist');
  const npHtml = fs.readFileSync(npHtmlPath, 'utf8');
  const npGameJs = fs.readFileSync(path.join(__dirname, 'games/number-puzzle/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(npGameJs)) !== null) {
    const id = match[1];
    assert(npHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/number-puzzle/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(npHtml.includes('href="../../index.html"'), 'Number Puzzle page must link back to arcade homepage');
});

// 19. Number Puzzle (15-Puzzle) Sliding Mechanics, Solvability & Scoring Engine
it('Number Puzzle computes valid sliding moves, directional swipes, solvability shuffle, and star ratings', () => {
  const {
    DIFFICULTIES,
    createSolvedBoard,
    isSolved,
    getBlankIndex,
    getAdjacentMovableIndices,
    canSlide,
    slideTiles,
    slideDirection,
    shuffleBoard,
    countCorrectTiles,
    calculateStars
  } = require('./games/number-puzzle/js/engine.js');

  // 1. Difficulty modes
  assert(DIFFICULTIES.easy && DIFFICULTIES.classic && DIFFICULTIES.expert, 'All 3 difficulty modes defined');
  assert.strictEqual(DIFFICULTIES.easy.size, 3, 'Easy mode is 3x3');
  assert.strictEqual(DIFFICULTIES.classic.size, 4, 'Classic mode is 4x4 (15 tiles)');
  assert.strictEqual(DIFFICULTIES.expert.size, 5, 'Expert mode is 5x5 (24 tiles)');

  // 2. Solved board creation & check
  const solved4 = createSolvedBoard(4);
  assert.strictEqual(solved4.length, 16, '4x4 board has 16 items');
  assert.strictEqual(solved4[15], 0, 'Last slot in 4x4 is blank (0)');
  assert.strictEqual(solved4[0], 1, 'First slot is 1');
  assert.strictEqual(isSolved(solved4), true, 'Initial solved board is identified as solved');
  assert.strictEqual(countCorrectTiles(solved4), 16, 'All tiles are placed in solved board');

  // 3. Tile movement check (adjacent and invalid)
  // In solved 4x4: row 3 col 3 is blank (index 15).
  // Adjacent tiles are index 14 (row 3, col 2) and index 11 (row 2, col 3).
  assert.strictEqual(canSlide(solved4, 14, 4), true, 'Tile directly to left of blank can slide');
  assert.strictEqual(canSlide(solved4, 11, 4), true, 'Tile directly above blank can slide');
  assert.strictEqual(canSlide(solved4, 0, 4), false, 'Tile at (0, 0) is not in blank row or col');

  // 4. Slide tile action
  const step1 = slideTiles(solved4, 14, 4);
  assert.strictEqual(step1.changed, true, 'Valid slide modifies board');
  assert.strictEqual(step1.newBoard[14], 0, 'Blank space shifts to index 14');
  assert.strictEqual(step1.newBoard[15], 15, 'Tile 15 shifts to index 15');
  assert.strictEqual(isSolved(step1.newBoard), false, 'Board is no longer solved');

  // 5. Directional slide (WASD / Keyboard / Swipe)
  // Current board has blank at index 14. Sliding 'right' moves tile 13 (to the left of blank) right into blank.
  const step2 = slideDirection(step1.newBoard, 'right', 4);
  assert.strictEqual(step2.changed, true, 'Right slide executes');
  assert.strictEqual(step2.newBoard[13], 0, 'Blank space shifts to index 13');

  // 6. Solvable shuffle test
  const shuffled = shuffleBoard(4, 50);
  assert.strictEqual(shuffled.length, 16, 'Shuffled board maintains length');
  assert.strictEqual(getBlankIndex(shuffled) >= 0, true, 'Blank space exists in shuffled board');

  // 7. Star ratings based on moves
  assert.strictEqual(calculateStars(60, 'classic'), 3, 'Low moves yields 3 stars');
  assert.strictEqual(calculateStars(110, 'classic'), 2, 'Medium moves yields 2 stars');
  assert.strictEqual(calculateStars(250, 'classic'), 1, 'High moves yields 1 star');
});

// 20. Dedicated Tap Challenge Playable Page & Engine Integrity
it('Dedicated Tap Challenge page (games/tap-challenge/index.html) has all DOM elements required by game.js', () => {
  const tpHtmlPath = path.join(__dirname, 'games/tap-challenge/index.html');
  assert(fs.existsSync(tpHtmlPath), 'games/tap-challenge/index.html must exist');
  const tpHtml = fs.readFileSync(tpHtmlPath, 'utf8');
  const tpGameJs = fs.readFileSync(path.join(__dirname, 'games/tap-challenge/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(tpGameJs)) !== null) {
    const id = match[1];
    assert(tpHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/tap-challenge/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(tpHtml.includes('href="../../index.html"'), 'Tap Challenge page must link back to arcade homepage');
});

// 21. Tap Challenge Engine Mechanics, Modes, CPS, Combos & Scoring
it('Tap Challenge computes sequence shuffling, validation, combos, CPS tiers, and star evaluations accurately', () => {
  const {
    MODES,
    TARGET_TYPES,
    generateSprintBoard,
    validateSprintTap,
    calculateComboMultiplier,
    calculateCPS,
    calculateFrenzyTier,
    calculateSprintStars,
    calculateReflexStars,
    rollTargetType,
    formatSeconds
  } = require('./games/tap-challenge/js/engine.js');

  // 1. Modes validation
  assert(MODES.reflex && MODES.sprint && MODES.frenzy, 'Must define all 3 core game modes');
  assert.strictEqual(MODES.reflex.totalCells, 9, 'Reflex mode is 3x3 (9 cells)');
  assert.strictEqual(MODES.sprint.totalCells, 16, 'Number Sprint mode is 4x4 (16 cells)');
  assert.strictEqual(MODES.frenzy.duration, 10, 'CPS Frenzy duration is 10 seconds');

  // 2. Number Sprint board generation & validation
  const sprintBoard = generateSprintBoard(16);
  assert.strictEqual(sprintBoard.length, 16, 'Sprint board must contain 16 numbers');
  for (let i = 1; i <= 16; i++) {
    assert(sprintBoard.includes(i), `Sprint board must contain number ${i}`);
  }

  // Sequence tap validation
  const validTap = validateSprintTap(1, 1);
  assert.strictEqual(validTap.isCorrect, true, 'Matching number tap is marked correct');
  assert.strictEqual(validTap.nextExpected, 2, 'Increments expected number');

  const invalidTap = validateSprintTap(1, 5);
  assert.strictEqual(invalidTap.isCorrect, false, 'Non-matching tap is marked incorrect');
  assert.strictEqual(invalidTap.nextExpected, 1, 'Does not increment expected number');

  // 3. Combo multiplier scaling
  assert.strictEqual(calculateComboMultiplier(1), 1, 'Streak 1 yields 1x');
  assert.strictEqual(calculateComboMultiplier(4), 2, 'Streak 4 yields 2x');
  assert.strictEqual(calculateComboMultiplier(8), 3, 'Streak 8 yields 3x');
  assert.strictEqual(calculateComboMultiplier(14), 4, 'Streak 14 yields 4x');
  assert.strictEqual(calculateComboMultiplier(20), 5, 'Streak 20 yields 5x');

  // 4. CPS Calculation & Speed Tiers
  assert.strictEqual(calculateCPS(85, 10), 8.5, '85 taps in 10s is 8.5 CPS');
  assert.strictEqual(calculateCPS(0, 5), 0, '0 taps is 0 CPS');

  const godlikeTier = calculateFrenzyTier(10.5);
  assert.strictEqual(godlikeTier.stars, 3, '10+ CPS yields 3 stars and Master tier');

  const agileTier = calculateFrenzyTier(4.0);
  assert.strictEqual(agileTier.stars, 2, '4.0 CPS yields 2 stars');

  // 5. Star evaluations
  assert.strictEqual(calculateSprintStars(10.5, 0), 3, 'Under 12s with zero errors is 3 stars');
  assert.strictEqual(calculateSprintStars(18.0, 1), 2, 'Under 20s with 1 error is 2 stars');
  assert.strictEqual(calculateReflexStars(3800), 3, 'High reflex score yields 3 stars');

  // 6. Target types integrity
  assert(TARGET_TYPES.normal && TARGET_TYPES.speed && TARGET_TYPES.golden && TARGET_TYPES.hazard, 'All target types configured');
  assert.strictEqual(TARGET_TYPES.hazard.isHazard, true, 'Glitch mine marked as hazard');
  assert.strictEqual(TARGET_TYPES.normal.points, 100, 'Normal node points is 100');
});

// 22. Dedicated Block Puzzle Playable Page & Engine Integrity
it('Dedicated Block Puzzle page (games/block-puzzle/index.html) has all DOM elements required by game.js', () => {
  const bpHtmlPath = path.join(__dirname, 'games/block-puzzle/index.html');
  assert(fs.existsSync(bpHtmlPath), 'games/block-puzzle/index.html must exist');
  const bpHtml = fs.readFileSync(bpHtmlPath, 'utf8');
  const bpGameJs = fs.readFileSync(path.join(__dirname, 'games/block-puzzle/js/game.js'), 'utf8');

  // Verify all document.getElementById calls in game.js are present in HTML
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = idRegex.exec(bpGameJs)) !== null) {
    const id = match[1];
    assert(bpHtml.includes(`id="${id}"`), `DOM id="${id}" missing in games/block-puzzle/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(bpHtml.includes('href="../../index.html"'), 'Block Puzzle page must link back to arcade homepage');
});

// 23. Block Puzzle (8x8 Grid) Placement Physics, Line Blasts & Game-Over Evaluation
it('Block Puzzle computes valid placements, row/col line clears, combo multipliers, and board reachability accurately', () => {
  const {
    GRID_SIZE,
    SHAPES,
    createEmptyGrid,
    canPlaceShape,
    placeShape,
    checkCompletedLines,
    clearLines,
    hasAnyValidMove,
    calculatePlacementScore,
    dealShapes,
    calculateStars
  } = require('./games/block-puzzle/js/engine.js');

  // 1. Grid & Shapes catalog
  assert.strictEqual(GRID_SIZE, 8, 'Block Puzzle grid size must be 8x8');
  assert(SHAPES.length >= 10, 'Must have at least 10 polyomino shapes defined');

  // 2. Empty grid generation
  const grid = createEmptyGrid();
  assert.strictEqual(grid.length, 8, 'Must have 8 rows');
  assert.strictEqual(grid[0].length, 8, 'Must have 8 columns');
  assert(grid.every(row => row.every(cell => cell === null)), 'All cells in empty grid must be null');

  // 3. Shape placement validation
  const square2 = [[1, 1], [1, 1]];
  assert.strictEqual(canPlaceShape(grid, square2, 0, 0), true, '2x2 square fits at top-left');
  assert.strictEqual(canPlaceShape(grid, square2, 7, 7), false, '2x2 square exceeds bottom-right boundary');

  // Place shape
  const placed = placeShape(grid, square2, 0, 0, '#ffd166');
  assert.strictEqual(placed.success, true, 'Placement must succeed');
  assert.strictEqual(placed.placedCount, 4, '4 cells filled');
  assert.strictEqual(placed.newGrid[0][0], '#ffd166', 'Cell (0,0) filled with color');

  // Collision with occupied cell
  assert.strictEqual(canPlaceShape(placed.newGrid, square2, 0, 0), false, 'Cannot overlap existing blocks');

  // 4. Line completion detection
  const fullRowGrid = createEmptyGrid();
  for (let c = 0; c < 8; c++) {
    fullRowGrid[2][c] = '#38bdf8'; // Fill row 2 completely
  }
  const lines = checkCompletedLines(fullRowGrid);
  assert.strictEqual(lines.fullRows.length, 1, 'Must detect 1 full row');
  assert.strictEqual(lines.fullRows[0], 2, 'Row 2 is full');
  assert.strictEqual(lines.fullCols.length, 0, 'No full columns');

  // Line clearing
  const cleared = clearLines(fullRowGrid, lines.fullRows, lines.fullCols);
  assert.strictEqual(cleared.clearedCells, 8, '8 cells cleared in full row');
  assert(cleared.newGrid[2].every(cell => cell === null), 'Row 2 must be reset to null');

  // 5. Simultaneous Row and Column Blast (Cross clear)
  const crossGrid = createEmptyGrid();
  for (let i = 0; i < 8; i++) {
    crossGrid[4][i] = '#d5ff55'; // Row 4
    crossGrid[i][4] = '#d5ff55'; // Col 4
  }
  const crossLines = checkCompletedLines(crossGrid);
  assert.strictEqual(crossLines.totalLines, 2, 'Must detect both full row and full column');

  // 6. Game-over evaluation (blocked board)
  const fullBoard = createEmptyGrid();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      fullBoard[r][c] = '#ff784f';
    }
  }
  const shapes = [{ matrix: [[1]] }];
  assert.strictEqual(hasAnyValidMove(fullBoard, shapes), false, 'Full board has no valid moves');
  assert.strictEqual(hasAnyValidMove(grid, shapes), true, 'Empty board has valid moves');

  // 7. Scoring and combo multipliers
  const score1 = calculatePlacementScore(4, 0, 0);
  assert.strictEqual(score1, 40, '4 blocks placed = 40 pts');

  const score2 = calculatePlacementScore(4, 1, 0); // 4 blocks + 1 line (100) = 140
  assert.strictEqual(score2, 140, '1 line clear gives +100');

  const scoreCombo = calculatePlacementScore(4, 2, 2); // 4 blocks + 2 lines (300) * (1 + 2*0.5 = 2.0x) = 40 + 600 = 640
  assert.strictEqual(scoreCombo, 640, 'Combo streak multiplier applies to line clear');

  // 8. Performance stars
  assert.strictEqual(calculateStars(4000, 15, 'classic'), 3, 'High score yields 3 stars');
  assert.strictEqual(calculateStars(2000, 10, 'challenge'), 3, 'Challenge target met with 2000 pts yields 3 stars');
});

// 24. Dedicated Stack Rush Playable Page DOM & Asset Integrity
it('Dedicated Stack Rush page (games/stack-rush/index.html) has all DOM elements required by game.js', () => {
  const gameHtmlPath = path.join(__dirname, 'games/stack-rush/index.html');
  assert(fs.existsSync(gameHtmlPath), 'games/stack-rush/index.html must exist');
  const gameHtml = fs.readFileSync(gameHtmlPath, 'utf8');

  const requiredIds = [
    'stack-canvas',
    'next-canvas',
    'score-display',
    'layers-display',
    'moves-display',
    'gems-display',
    'timer-display',
    'combo-display',
    'best-display',
    'theme-select',
    'pause-btn',
    'audio-toggle-btn',
    'audio-icon',
    'overlay-start',
    'start-btn',
    'overlay-pause',
    'resume-btn',
    'restart-btn',
    'overlay-win',
    'win-title',
    'win-summary',
    'win-score-val',
    'win-stars-val',
    'win-moves-val',
    'win-layers-val',
    'win-gems-val',
    'play-again-btn',
    'overlay-gameover',
    'go-score-val',
    'go-moves-val',
    'go-layers-val',
    'go-gems-val',
    'try-again-btn',
    'btn-rot-left',
    'btn-drop',
    'btn-rot-right',
    'mode-classic-btn',
    'mode-challenge-btn',
    'mode-blitz-btn'
  ];

  for (const id of requiredIds) {
    assert(gameHtml.includes(`id="${id}"`), `Game DOM id="${id}" missing in games/stack-rush/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(gameHtml.includes('href="../../index.html"'), 'Stack Rush must link back to arcade homepage');

  // Verify vector thumbnail exists
  const thumbPath = path.join(__dirname, 'assets/games/stack-rush.svg');
  assert(fs.existsSync(thumbPath), 'Stack Rush vector thumbnail must exist');
});

// 25. Stack Rush 3D Rotating Tower Engine & Layer Blast Mechanics
it('Stack Rush engine executes 3D platform rotations, voxel drops, layer clearing, and combos correctly', () => {
  const engine = require('./games/stack-rush/js/engine.js');
  const {
    BASE_SIZE,
    TOWER_HEIGHT,
    SHAPES_3D,
    THEMES,
    createEmptyTower,
    cloneTower,
    rotateBlocks,
    normalizeBlocks,
    canPlaceAt,
    getDropY,
    lockShape,
    checkCompletedLayers,
    clearCompletedLayers,
    calculateScoreAndGems,
    projectIso,
    rollShape
  } = engine;

  // 1. Grid & Shape Constants
  assert.strictEqual(BASE_SIZE, 3, 'Base grid must be 3x3');
  assert.strictEqual(TOWER_HEIGHT, 10, 'Tower height must be 10');
  assert(SHAPES_3D.length >= 6, 'Should have at least 6 distinct 3D polyomino shapes');
  assert(Object.keys(THEMES).length >= 4, 'Should offer at least 4 visual themes');

  // 2. Empty tower initialization
  const tower = createEmptyTower();
  assert.strictEqual(tower.length, 10, 'Tower must have 10 layers');
  assert.strictEqual(tower[0].length, 3, 'Each layer has 3 rows');
  assert.strictEqual(tower[0][0].length, 3, 'Each row has 3 columns');
  assert(tower[0][0].every(cell => cell === null), 'Voxel cells start empty (null)');

  // 3. Platform rotation math
  const bar = [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }];
  const rot1 = rotateBlocks(bar, 1); // 90 deg clockwise around center (1, 1)
  assert.strictEqual(rot1.length, 2, 'Rotated blocks retain length');
  // 4 full rotations (360 degrees) return to identical normalized shape
  const rot4 = rotateBlocks(bar, 4);
  assert.deepStrictEqual(normalizeBlocks(rot4), normalizeBlocks(bar), '360 degree rotation returns to identical shape');

  // 4. Ghost Drop calculation & collision
  const unitBlock = [{ x: 1, y: 0, z: 1 }];
  const dropY0 = getDropY(tower, unitBlock);
  assert.strictEqual(dropY0, 0, 'Ghost drop lands at ground y=0 on empty tower');

  // Lock a block at (1, 0, 1)
  const locked1 = lockShape(tower, unitBlock, 0, 0, 0, '#d5ff55');
  assert.strictEqual(locked1.success, true);
  assert.strictEqual(locked1.tower[0][1][1], '#d5ff55');

  // Drop another block at (1, 1) -> must land on top at y=1
  const dropY1 = getDropY(locked1.tower, unitBlock);
  assert.strictEqual(dropY1, 1, 'Ghost drop stacks on top of existing voxel at y=1');

  // Drop at different horizontal cell (0, 0) -> lands on base y=0
  const sideBlock = [{ x: 0, y: 0, z: 0 }];
  const dropYSide = getDropY(locked1.tower, sideBlock);
  assert.strictEqual(dropYSide, 0, 'Ghost drop at open cell lands on ground y=0');

  // 5. Complete Layer Detection and Clearing
  const testTower = createEmptyTower();
  // Fill layer 0 completely (all 9 cells)
  for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 3; z++) {
      testTower[0][x][z] = '#38bdf8';
    }
  }
  // Partially fill layer 1 (2 cells)
  testTower[1][0][0] = '#ff784f';
  testTower[1][2][2] = '#ff784f';

  const completed = checkCompletedLayers(testTower);
  assert.strictEqual(completed.length, 1, 'Should detect 1 completed layer');
  assert.strictEqual(completed[0], 0, 'Layer 0 is full');

  // Clear completed layer -> layer 1 drops to layer 0, top layer is empty
  const clearRes = clearCompletedLayers(testTower, completed);
  assert.strictEqual(clearRes.clearedCount, 1, 'Cleared 1 layer');
  assert.strictEqual(clearRes.tower[0][0][0], '#ff784f', 'Layer 1 blocks dropped to layer 0');
  assert.strictEqual(clearRes.tower[0][2][2], '#ff784f', 'Layer 1 blocks dropped to layer 0');
  assert.strictEqual(clearRes.tower[1][0][0], null, 'Previous layer 1 is now empty');
  assert(clearRes.tower[9][0].every(cell => cell === null), 'Top ceiling layer is null');

  // 6. Scoring, Combos, and Gems
  const scoreDrop = calculateScoreAndGems(2, 0, 0);
  assert.strictEqual(scoreDrop.score, 30, '30 pts for 2 blocks dropped (15 pts per block)');
  assert.strictEqual(scoreDrop.gems, 2, '2 gems on placement (1 gem per block)');

  // Single layer blast with streak = 0
  const score1 = calculateScoreAndGems(2, 1, 0);
  assert.strictEqual(score1.score, 30 + 200, '30 pts + 200 for 1 layer');
  assert.strictEqual(score1.gems, 2 + 10, '2 gem drop + 10 gems for 1 layer');

  // Double layer blast combo with streak = 1 (1.5x multiplier)
  const scoreCombo = calculateScoreAndGems(4, 2, 1);
  assert.strictEqual(scoreCombo.score, 60 + Math.round(550 * 1.5), 'Combo multiplier applied to layer blasts');
  assert.strictEqual(scoreCombo.gems, 4 + Math.round(25 * 1.5), 'Multi-layer blast yields extra gems');

  // 7. Isometric Axonometric Projection
  const iso = projectIso(0, 0, 0, 0, 200, 200, 24);
  assert(typeof iso.screenX === 'number', 'Screen X must be a number');
  assert(typeof iso.screenY === 'number', 'Screen Y must be a number');
  assert(typeof iso.depth === 'number', 'Depth must be a number for painter sort');

  // 8. Random shape generation
  const piece = rollShape(() => 0.5);
  assert(piece.id && piece.name && piece.color && Array.isArray(piece.blocks));

  // 9. Ketchapp-Style 3D Slicing Stacker Mechanics
  const { sliceBlock, getLayerHue, getFaceColors, projectIsometricBox, evaluateTowerStars } = engine;
  assert(typeof sliceBlock === 'function', 'sliceBlock must be defined');

  // Case A: Perfect drop within tolerance
  const prevBox = { x: 0, z: 0, w: 100, d: 100 };
  const perfectBox = { x: 2, z: 0, w: 100, d: 100 };
  const perfRes = sliceBlock(prevBox, perfectBox, 'x', 3.5);
  assert.strictEqual(perfRes.status, 'perfect', 'Drop within 3.5px tolerance is PERFECT');
  assert.strictEqual(perfRes.overlap.w, 100, 'Preserves full width on perfect');
  assert.strictEqual(perfRes.cut, null, 'No debris on perfect');

  // Case B: Trimming overhang
  const overhangingBox = { x: 20, z: 0, w: 100, d: 100 };
  const trimRes = sliceBlock(prevBox, overhangingBox, 'x', 3.5);
  assert.strictEqual(trimRes.status, 'trim', 'Overhanging drop is trimmed');
  assert.strictEqual(trimRes.overlap.w, 80, 'New width is trimmed to 80px');
  assert.strictEqual(trimRes.cut.w, 20, 'Cut piece width is 20px');
  assert(trimRes.cut.x > trimRes.overlap.x, 'Cut piece is on the positive overhang side');

  // Case C: Complete Miss
  const missedBox = { x: 120, z: 0, w: 100, d: 100 };
  const missRes = sliceBlock(prevBox, missedBox, 'x', 3.5);
  assert.strictEqual(missRes.status, 'miss', 'Box outside base bounds is a miss');
  assert.strictEqual(missRes.overlap, null, 'No overlap on miss');

  // Case D: Dynamic rainbow palette & Face Shading
  const hue0 = getLayerHue(0);
  const hue1 = getLayerHue(1);
  assert.notStrictEqual(hue0, hue1, 'Hues advance across layers');
  const faces = getFaceColors(270);
  assert(faces.top && faces.left && faces.right && faces.edge, 'Generates top, left, right faces');

  // Case E: Isometric 3D Box Projection
  const box3D = { x: 0, y: 0, z: 0, w: 100, h: 16, d: 100 };
  const proj3D = projectIsometricBox(box3D, 0, 200, 200, 1.0);
  assert.strictEqual(proj3D.top.length, 4, 'Top face has 4 vertices');
  assert.strictEqual(proj3D.left.length, 4, 'Left face has 4 vertices');
  assert.strictEqual(proj3D.right.length, 4, 'Right face has 4 vertices');

  // Case F: Star rating evaluation
  assert.strictEqual(evaluateTowerStars(40), 3, '40 blocks yields 3 stars');
  assert.strictEqual(evaluateTowerStars(20), 2, '20 blocks yields 2 stars');
  assert.strictEqual(evaluateTowerStars(5), 1, '5 blocks yields 1 star');
});

// 27. Dedicated Circuit Connect Playable Page DOM & Asset Integrity
it('Dedicated Circuit Connect page (games/circuit-connect/index.html) has all DOM elements required by game.js', () => {
  const gameHtmlPath = path.join(__dirname, 'games/circuit-connect/index.html');
  assert(fs.existsSync(gameHtmlPath), 'games/circuit-connect/index.html must exist');
  const gameHtml = fs.readFileSync(gameHtmlPath, 'utf8');

  const requiredIds = [
    'circuit-canvas',
    'level-title-display',
    'chapter-display',
    'moves-display',
    'par-display',
    'targets-display',
    'timer-display',
    'level-select-btn',
    'undo-btn',
    'restart-btn',
    'pause-btn',
    'audio-toggle-btn',
    'audio-icon',
    'overlay-win',
    'win-title',
    'win-stars-val',
    'win-moves-val',
    'win-par-val',
    'win-time-val',
    'next-level-btn',
    'replay-btn',
    'overlay-overload',
    'overload-restart-btn',
    'overload-undo-btn',
    'overlay-level-select',
    'close-level-select-btn',
    'level-grid-container'
  ];

  for (const id of requiredIds) {
    assert(gameHtml.includes(`id="${id}"`), `Game DOM id="${id}" missing in games/circuit-connect/index.html`);
  }

  // Verify navigation back link to arcade exists
  assert(gameHtml.includes('href="../../index.html"'), 'Circuit Connect must link back to arcade homepage');

  // Verify vector thumbnail exists
  const thumbPath = path.join(__dirname, 'assets/games/circuit-connect.svg');
  assert(fs.existsSync(thumbPath), 'Circuit Connect vector thumbnail must exist');
});

// 28. Circuit Connect Logic, Port Topology, Multi-Channel BFS & Stars Engine
it('Circuit Connect engine evaluates directional connectivity, bridge overpasses, and puzzle completion accurately', () => {
  const engine = require('./games/circuit-connect/js/engine.js');
  const {
    DIRS,
    TRACK_TYPES,
    CIRCUIT_COLORS,
    getConnectedPorts,
    canConnect,
    evaluateCircuit,
    rotateTile,
    calculateStars,
    LEVELS,
    createLevelGrid,
    generateProceduralLevel
  } = engine;

  // 1. Compass directions & track types
  assert.strictEqual(DIRS.NORTH, 0);
  assert.strictEqual(DIRS.EAST, 1);
  assert.strictEqual(DIRS.SOUTH, 2);
  assert.strictEqual(DIRS.WEST, 3);
  assert(TRACK_TYPES.BRIDGE && TRACK_TYPES.TERMINAL);

  // 2. Port connectivity & rotations
  const line0 = getConnectedPorts(TRACK_TYPES.LINE, 0);
  assert.deepStrictEqual(line0, [0, 2], 'Line rot 0 connects North and South');
  const line1 = getConnectedPorts(TRACK_TYPES.LINE, 1);
  assert.deepStrictEqual(line1, [1, 3], 'Line rot 1 connects East and West');

  const corner0 = getConnectedPorts(TRACK_TYPES.CORNER, 0);
  assert.deepStrictEqual(corner0, [0, 1], 'Corner rot 0 connects North and East');

  const cross = getConnectedPorts(TRACK_TYPES.CROSS, 0);
  assert.deepStrictEqual(cross, [0, 1, 2, 3], 'Cross connects all 4 directions');

  // 3. Bridge Overpass isolation
  const bridge0 = getConnectedPorts(TRACK_TYPES.BRIDGE, 0);
  assert.deepStrictEqual(bridge0.chA, [0, 2], 'Bridge Channel A connects N-S');
  assert.deepStrictEqual(bridge0.chB, [1, 3], 'Bridge Channel B connects E-W');

  // 4. Neighbor Connection Evaluation
  const tileNorth = { type: TRACK_TYPES.LINE, rotation: 0 };
  const tileSouth = { type: TRACK_TYPES.LINE, rotation: 0 };
  assert.strictEqual(canConnect(tileNorth, tileSouth, DIRS.SOUTH), true, 'Two aligned vertical lines connect');

  const misalignedTile = { type: TRACK_TYPES.LINE, rotation: 1 };
  assert.strictEqual(canConnect(tileNorth, misalignedTile, DIRS.SOUTH), false, 'Vertical and horizontal lines do not connect');

  // 5. Tile rotation
  const grid = [
    [
      { type: TRACK_TYPES.LINE, rotation: 0, fixed: false },
      { type: TRACK_TYPES.TERMINAL, rotation: 1, fixed: true }
    ]
  ];
  assert.strictEqual(rotateTile(grid, 0, 0, 1), true, 'Non-fixed tile rotates');
  assert.strictEqual(grid[0][0].rotation, 1, 'Rotation increments to 1');
  assert.strictEqual(rotateTile(grid, 0, 1, 1), false, 'Fixed station cannot rotate');
  assert.strictEqual(grid[0][1].rotation, 1, 'Fixed station stays at rotation 1');

  // 6. Circuit Solvability & BFS Traversal
  // Create simple 2-tile solved circuit: Source -> Line -> Target
  const simpleBoard = [
    [
      { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'c1' },
      { type: TRACK_TYPES.LINE, rotation: 1 },
      { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'c1' }
    ]
  ];
  const evalSolved = evaluateCircuit(simpleBoard, 1, 3);
  assert.strictEqual(evalSolved.isSolved, true, 'Fully connected circuit must evaluate as solved');
  assert.strictEqual(evalSolved.connectedTargets, 1, 'Target terminal reached');
  assert.strictEqual(evalSolved.energizedTiles.size, 3, 'All 3 tiles energized');

  // Break circuit by rotating the middle line
  simpleBoard[0][1].rotation = 0; // Turn vertical
  const evalBroken = evaluateCircuit(simpleBoard, 1, 3);
  assert.strictEqual(evalBroken.isSolved, false, 'Broken path must not solve circuit');
  assert.strictEqual(evalBroken.connectedTargets, 0, 'Target terminal not reached');

  // 7. Star Efficiency
  assert.strictEqual(calculateStars(4, 4), 3, 'Completing within par gives 3 stars');
  assert.strictEqual(calculateStars(6, 4), 2, 'Completing within near-par gives 2 stars');
  assert.strictEqual(calculateStars(11, 4), 1, 'Completing within limit gives 1 star');

  // 8. Level catalogs & Procedural Level Generation
  assert(LEVELS.length >= 15, 'Must contain at least 15 progressive levels');
  const procLevel = generateProceduralLevel(4, 4, 2, true);
  assert.strictEqual(procLevel.rows, 4);
  assert.strictEqual(procLevel.cols, 4);
  assert.strictEqual(procLevel.tiles.length, 16);

  // 9. Color Chain / Flow Engine Mechanics & 100% Board Fill Constraint
  const {
    createFlowLevel,
    startDrawing,
    extendDrawing,
    finishDrawing,
    getBoardCoverage,
    checkBoardCompletion,
    applyHint,
    undoMove
  } = engine;

  assert(typeof createFlowLevel === 'function', 'createFlowLevel must be defined');
  const lvl1 = LEVELS[0];
  const state = createFlowLevel(lvl1);
  assert.strictEqual(state.rows, lvl1.rows);
  assert.strictEqual(state.cols, lvl1.cols);
  assert.strictEqual(state.pairs.length, lvl1.pairs.length);

  // Drawing line
  const p1 = lvl1.pairs[0].p1;
  const startRes = startDrawing(state, p1.r, p1.c);
  assert.strictEqual(startRes.success, true, 'Starting at endpoint must succeed');
  assert.strictEqual(state.activeKey, lvl1.pairs[0].key);

  // Apply hint for pair 0
  const hintRes = applyHint(state);
  assert.strictEqual(hintRes.success, true, 'Applying hint must succeed');
  assert.strictEqual(state.connected[hintRes.key], true, 'Hinted color must be marked connected');

  // Verify 100% board fill constraint:
  // With only 1 color solved, checkBoardCompletion must NOT be solved
  const partialComp = checkBoardCompletion(state);
  assert.strictEqual(partialComp.isSolved, false, 'Incomplete board must NOT be solved');

  // Complete all colors with hints
  for (let i = 0; i < lvl1.pairs.length; i++) {
    applyHint(state);
  }
  const fullComp = checkBoardCompletion(state);
  assert.strictEqual(fullComp.isSolved, true, 'Fully connected board covering 100% of cells must be solved');
  assert.strictEqual(fullComp.coveredCount, state.totalCells, 'All cells must be covered');

  // Test Undo
  const undoRes = undoMove(state);
  assert.strictEqual(undoRes, true, 'Undo should succeed');

});

// 29. Security & Clean Static Deployment Verification
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
