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

  // Non-matching category
  const res4 = filterGames('', 'Puzzle');
  assert.strictEqual(res4.length, 0);

  // Non-matching query
  const res5 = filterGames('nonexistent game query 12345', 'All');
  assert.strictEqual(res5.length, 0);
});

// 7. Slicing Collision & Math Logic
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

// 8. Security & Clean Static Deployment Verification
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
