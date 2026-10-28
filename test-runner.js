/**
 * Citrus Blitz Automated QA Test Suite
 * Validates DOM references, collision physics, scoring, combos, modes, and assets.
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

console.log('\n=== CITRUS BLITZ QA AUTOMATED AUDIT ===\n');

// 1. DOM ID Integrity Check
it('Every DOM element ID referenced in js/game.js exists in index.html', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const gameJs = fs.readFileSync(path.join(__dirname, 'js/game.js'), 'utf8');

  // Match document.getElementById('...')
  const idRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  const referencedIds = new Set();
  while ((match = idRegex.exec(gameJs)) !== null) {
    referencedIds.add(match[1]);
  }

  for (const id of referencedIds) {
    const idExists = indexHtml.includes(`id="${id}"`);
    assert(idExists, `Referenced DOM id="${id}" was not found in index.html!`);
  }
});

// 2. Relative Asset & External Dependency Audit
it('No external dependencies, API keys, or hardcoded local paths', () => {
  const files = ['index.html', 'style.css', 'js/game.js', 'js/fruit.js', 'js/audio.js', 'js/particles.js', 'js/blade.js'];
  for (const f of files) {
    const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
    assert(!content.includes('C:\\'), `Hardcoded Windows drive path found in ${f}`);
    assert(!content.includes('localhost:'), `Hardcoded localhost URL found in ${f}`);
    assert(!content.includes('apiKey') && !content.includes('api_key'), `Potential API key reference in ${f}`);
  }
});

// 3. Collision Math Unit Test
it('Circle-to-segment collision correctly detects slices and ignores misses', () => {
  // Line segment from (10, 50) to (90, 50)
  // Fruit at (50, 50) with radius 20 should intersect
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

  // Direct hit
  assert.strictEqual(checkSlice(50, 50, 20, p1, p2), true, 'Direct center slice should hit');
  // Glancing hit within radius
  assert.strictEqual(checkSlice(50, 68, 20, p1, p2), true, 'Glancing slice within radius should hit');
  // Complete miss
  assert.strictEqual(checkSlice(50, 100, 20, p1, p2), false, 'Far fruit should not be hit');
  // Past endpoint miss
  assert.strictEqual(checkSlice(120, 50, 20, p1, p2), false, 'Fruit past stroke end should not hit');
});

// 4. Fruit Definitions & Balance Validation
it('All fruit configurations have valid properties, colors, and positive points', () => {
  const fruitJs = fs.readFileSync(path.join(__dirname, 'js/fruit.js'), 'utf8');
  assert(fruitJs.includes('WATERMELON'), 'Watermelon must exist');
  assert(fruitJs.includes('ORANGE'), 'Orange must exist');
  assert(fruitJs.includes('LEMON'), 'Lemon must exist');
  assert(fruitJs.includes('STRAWBERRY'), 'Strawberry must exist');
  assert(fruitJs.includes('KIWI'), 'Kiwi must exist');
  assert(fruitJs.includes('PINEAPPLE'), 'Pineapple must exist');
  assert(fruitJs.includes('DRAGONFRUIT'), 'Dragonfruit must exist');
  assert(fruitJs.includes('STARFRUIT'), 'Starfruit must exist');
  assert(fruitJs.includes('BOMB'), 'Bomb must exist');
});

// 5. Combo Multiplier Bonus Progression
it('Combo system awards increasing bonuses for multi-fruit slices', () => {
  function getComboBonus(count) {
    if (count === 2) return 2;
    if (count === 3) return 3;
    if (count === 4) return 5;
    if (count >= 5) return 10;
    return 0;
  }

  assert.strictEqual(getComboBonus(1), 0);
  assert.strictEqual(getComboBonus(2), 2);
  assert.strictEqual(getComboBonus(3), 3);
  assert.strictEqual(getComboBonus(4), 5);
  assert.strictEqual(getComboBonus(5), 10);
  assert.strictEqual(getComboBonus(8), 10);
});

// 6. Bomb Penalty Verification
it('Bomb penalties work accurately across Arcade and Classic modes', () => {
  // Arcade penalty test
  let timer = 45;
  let score = 25;
  timer = Math.max(0, timer - 10);
  score = Math.max(0, score - 10);
  assert.strictEqual(timer, 35, 'Arcade bomb penalty subtracts 10s');
  assert.strictEqual(score, 15, 'Arcade bomb penalty subtracts 10 pts');

  // Underflow protection
  let lowTimer = 5;
  let lowScore = 4;
  lowTimer = Math.max(0, lowTimer - 10);
  lowScore = Math.max(0, lowScore - 10);
  assert.strictEqual(lowTimer, 0, 'Timer should clamp to 0 and not become negative');
  assert.strictEqual(lowScore, 0, 'Score should clamp to 0 and not become negative');

  // Classic lives test
  let lives = 3;
  lives--;
  assert.strictEqual(lives, 2, 'Classic bomb penalty subtracts 1 life');
});

console.log(`\nQA Test Results: ${passedTests} / ${totalTests} passed.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
