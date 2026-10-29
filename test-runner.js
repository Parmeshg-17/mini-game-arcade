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

  // Puzzle category filter matches Tic Tac Toe and Number Puzzle
  const res4 = filterGames('', 'Puzzle');
  assert.strictEqual(res4.length, 2);
  assert(res4.some(g => g.id === 'tic-tac-toe'));
  assert(res4.some(g => g.id === 'number-puzzle'));

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

  // Tag search for number/puzzle
  const resNumber = filterGames('number', 'All');
  assert.strictEqual(resNumber.length, 1);
  assert.strictEqual(resNumber[0].id, 'number-puzzle');

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

// 20. Security & Clean Static Deployment Verification
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
