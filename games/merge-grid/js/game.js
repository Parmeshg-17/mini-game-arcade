/**
 * Merge Grid — 4×4 sliding tile puzzle (2048-style)
 * Uses MergeGridEngine for pure board logic.
 * Keyboard: Arrow keys / WASD  |  Touch: Swipe gestures
 * Undo (1 move), Best-score via localStorage, Win at 2048.
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_SIZE = 4;
const BEST_KEY = 'merge_grid_best';
const WIN_VALUE = 2048;

// ─── State ────────────────────────────────────────────────────────────────────
let board = [];           // 4×4 flat array of numbers (0 = empty)
let prevBoard = null;     // For undo
let score = 0;
let prevScore = 0;
let bestScore = 0;
let wonOnce = false;      // Allows continue after 2048
let gameOver = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const boardEl       = document.getElementById('merge-grid-board');
const scoreEl       = document.getElementById('merge-score');
const bestEl        = document.getElementById('merge-best');
const restartBtn    = document.getElementById('merge-restart-btn');
const undoBtn       = document.getElementById('merge-undo-btn');
const newGameBtn    = document.getElementById('merge-new-game-btn');
const overlayWin    = document.getElementById('overlay-win');
const overlayGO     = document.getElementById('overlay-gameover');
const continueBtn   = document.getElementById('merge-continue-btn');
const goRestartBtn  = document.getElementById('merge-go-restart-btn');
const winRestartBtn = document.getElementById('merge-win-restart-btn');

// ─── Audio ────────────────────────────────────────────────────────────────────
let audioCtx = null;
let muted = false;

function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(_) {}
  }
  return audioCtx;
}

function beep(freq, type = 'sine', duration = 0.08, gain = 0.18) {
  if (muted) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playSlide()    { beep(220, 'triangle', 0.06, 0.10); }
function playMerge(v)   { beep(200 + Math.log2(v) * 40, 'sine', 0.12, 0.22); }
function playWin()      {
  [523,659,784,1047].forEach((f,i) => setTimeout(() => beep(f,'sine',0.18,0.25), i*120));
}
function playGameOver() {
  [300,250,200,150].forEach((f,i) => setTimeout(() => beep(f,'sawtooth',0.15,0.18), i*120));
}

// ─── Engine access helper ─────────────────────────────────────────────────────
const Engine = window.MergeGridEngine || {
  createInitialBoard: () => [0,0,0,0, 0,0,0,0, 0,2,0,0, 0,0,4,0],
  moveBoard: () => ({ board: [], score: 0, changed: false, merged: false }),
  spawnTile: (b) => ({ board: b, spawned: false }),
  hasMovesLeft: () => true,
  isWin: () => false
};

// ─── Initialization ───────────────────────────────────────────────────────────
function init() {
  bestScore = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
  newGame();
}

function newGame() {
  board      = Engine.createInitialBoard();
  prevBoard  = null;
  score      = 0;
  prevScore  = 0;
  wonOnce    = false;
  gameOver   = false;
  hideOverlays();
  render();
  updateHUD();
}

// ─── Move logic ───────────────────────────────────────────────────────────────
function applyMove(direction) {
  if (gameOver) return false;

  const result = Engine.moveBoard(board, direction);
  if (!result.changed) return false;

  // Save undo snapshot
  prevBoard = board.slice();
  prevScore = score;

  const spawnRes = Engine.spawnTile(result.board);
  board = spawnRes.board;
  score += result.score;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(BEST_KEY, bestScore);
  }

  if (result.merged) playMerge(result.score);
  else playSlide();

  // Check win
  if (!wonOnce && Engine.isWin(board)) {
    wonOnce = true;
    showWin();
    playWin();
  }

  // Check game over
  if (!Engine.hasMovesLeft(board)) {
    gameOver = true;
    showGameOver();
    playGameOver();
  }

  render();
  updateHUD();
  return true;
}

function undo() {
  if (!prevBoard) return;
  board = prevBoard.slice();
  score = prevScore;
  prevBoard = null;
  gameOver = false;
  hideOverlays();
  render();
  updateHUD();
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function tileClass(v) {
  if (v === 0) return 'tile tile-empty';
  if (v > 2048) return 'tile tile-super';
  return `tile tile-${v}`;
}

function render() {
  if (!boardEl) return;
  boardEl.innerHTML = '';
  for (let i = 0; i < board.length; i++) {
    const v = board[i];
    const cell = document.createElement('div');
    cell.className = tileClass(v);
    if (v !== 0) {
      cell.textContent = v;
      cell.setAttribute('aria-label', `Tile value ${v}`);
    }
    boardEl.appendChild(cell);
  }
}

function updateHUD() {
  if (scoreEl) scoreEl.textContent = score.toLocaleString();
  if (bestEl)  bestEl.textContent  = bestScore.toLocaleString();
}

// ─── Overlays ─────────────────────────────────────────────────────────────────
function hideOverlays() {
  if (overlayWin) overlayWin.classList.add('hidden');
  if (overlayGO)  overlayGO.classList.add('hidden');
}

function showWin() {
  if (overlayWin) overlayWin.classList.remove('hidden');
}

function showGameOver() {
  if (overlayGO) overlayGO.classList.remove('hidden');
}

// ─── Input: Keyboard ──────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  let dir = null;
  switch (e.key) {
    case 'ArrowLeft':  case 'a': case 'A': dir = 'left';  break;
    case 'ArrowRight': case 'd': case 'D': dir = 'right'; break;
    case 'ArrowUp':    case 'w': case 'W': dir = 'up';    break;
    case 'ArrowDown':  case 's': case 'S': dir = 'down';  break;
    default: return;
  }
  e.preventDefault();
  applyMove(dir);
});

// ─── Input: Touch / Swipe ────────────────────────────────────────────────────
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30;

if (boardEl) {
  boardEl.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  boardEl.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      applyMove(dx > 0 ? 'right' : 'left');
    } else {
      applyMove(dy > 0 ? 'down' : 'up');
    }
  }, { passive: true });
}

// Global touch gestures for smaller mobile screens
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
  if (overlayWin && !overlayWin.classList.contains('hidden')) return;
  if (overlayGO && !overlayGO.classList.contains('hidden')) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    applyMove(dx > 0 ? 'right' : 'left');
  } else {
    applyMove(dy > 0 ? 'down' : 'up');
  }
}, { passive: true });

// ─── Button listeners ─────────────────────────────────────────────────────────
if (restartBtn)    restartBtn.addEventListener('click', newGame);
if (newGameBtn)    newGameBtn.addEventListener('click', newGame);
if (undoBtn)       undoBtn.addEventListener('click', undo);
if (continueBtn)   continueBtn.addEventListener('click', hideOverlays);
if (goRestartBtn)  goRestartBtn.addEventListener('click', newGame);
if (winRestartBtn) winRestartBtn.addEventListener('click', newGame);

const muteBtn = document.getElementById('merge-mute-btn');
if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
