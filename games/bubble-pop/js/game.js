/**
 * Bubble Pop — Canvas 2D Interactive Game Engine
 * Features:
 * - Cluster detection & highlighting with BFS
 * - Exponential combo scoring: N^2 * 10 * Combo
 * - Smooth gravity fall physics & column compression
 * - Particle droplets & shockwaves on pops
 * - Classic Clear & 60s Blitz modes
 * - Full mouse, touch, and accessible keyboard navigation
 * - Frame-rate independent physics (delta time normalization)
 */
(function() {
  'use strict';

  // Constants
  const ROWS = 10;
  const COLS = 8;
  const COMBO_TIMEOUT_SEC = 2.8;

  // DOM Elements
  const dom = {};

  // Engine State
  const state = {
    mode: 'classic', // 'classic' | 'blitz'
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'cleared' | 'gameover'
    grid: [],
    fallingBubbles: [], // Active animations { fromX, fromY, toX, toY, progress, speed, colorIndex }
    score: 0,
    bestScore: 0,
    moves: 0,
    timer: 0,
    combo: 1,
    lastPopTime: 0,
    screenShake: 0,
    selectedCluster: [],
    hoverCell: null,
    keyboardCursor: { r: 5, c: 4 },
    particles: [],
    shockwaves: [],
    floatingTexts: [],
    blitzRowTimer: 0
  };

  let canvas = null;
  let ctx = null;
  let animFrameId = null;
  let lastTime = 0;
  let dpr = 1;
  let canvasW = 480;
  let canvasH = 580;
  let cellSize = 48;
  let gridOffsetX = 0;
  let gridOffsetY = 0;

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    setupCanvas();
    loadBestScore();
    bindEvents();
    startNewGame();
    render();
  }

  function cacheDom() {
    dom.canvas = document.getElementById('bubble-canvas');
    dom.scoreDisplay = document.getElementById('score-display');
    dom.bestScore = document.getElementById('best-score');
    dom.movesCount = document.getElementById('moves-count');
    dom.matchTimer = document.getElementById('match-timer');
    dom.comboBadge = document.getElementById('combo-badge');
    dom.remainingCount = document.getElementById('remaining-count');

    dom.modeClassicBtn = document.getElementById('mode-classic-btn');
    dom.modeBlitzBtn = document.getElementById('mode-blitz-btn');
    dom.audioToggleBtn = document.getElementById('audio-toggle-btn');
    dom.audioIcon = document.getElementById('audio-icon');
    dom.pauseBtn = document.getElementById('pause-btn');

    dom.overlayStart = document.getElementById('overlay-start');
    dom.overlayPause = document.getElementById('overlay-pause');
    dom.overlayWin = document.getElementById('overlay-win');
    dom.overlayGameOver = document.getElementById('overlay-gameover');

    dom.startBtn = document.getElementById('start-btn');
    dom.resumeBtn = document.getElementById('resume-btn');
    dom.restartBtn = document.getElementById('restart-btn');
    dom.playAgainBtn = document.getElementById('play-again-btn');
    dom.gameOverRestartBtn = document.getElementById('gameover-restart-btn');

    dom.winScoreVal = document.getElementById('win-score-val');
    dom.winMovesVal = document.getElementById('win-moves-val');
    dom.winTimeVal = document.getElementById('win-time-val');
    dom.winStarsVal = document.getElementById('win-stars-val');
    dom.goScoreVal = document.getElementById('go-score-val');
    dom.srAnnouncer = document.getElementById('sr-announcer');
  }

  function setupCanvas() {
    if (!dom.canvas) return;
    canvas = dom.canvas;
    ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;

    canvasW = rect.width || 480;
    canvasH = rect.height || 580;

    canvas.width = Math.floor(canvasW * dpr);
    canvas.height = Math.floor(canvasH * dpr);
    ctx.scale(dpr, dpr);

    // Compute cell dimensions
    const maxCellW = (canvasW - 24) / COLS;
    const maxCellH = (canvasH - 24) / ROWS;
    cellSize = Math.floor(Math.min(maxCellW, maxCellH));

    gridOffsetX = Math.floor((canvasW - cellSize * COLS) / 2);
    gridOffsetY = Math.floor((canvasH - cellSize * ROWS) / 2);
  }

  function loadBestScore() {
    const key = `arcade_bubblepop_best_${state.mode}`;
    state.bestScore = parseInt(localStorage.getItem(key) || '0', 10);
    if (dom.bestScore) dom.bestScore.textContent = state.bestScore;
  }

  function saveBestScore() {
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      const key = `arcade_bubblepop_best_${state.mode}`;
      try {
        localStorage.setItem(key, state.bestScore.toString());
      } catch (e) {}
      if (dom.bestScore) dom.bestScore.textContent = state.bestScore;
    }
  }

  function startNewGame() {
    const Board = window.BubbleBoard;
    state.grid = Board ? Board.createInitialGrid(ROWS, COLS, 5) : createFallbackGrid();
    state.fallingBubbles = [];
    state.score = 0;
    state.moves = 0;
    state.combo = 1;
    state.lastPopTime = 0;
    state.timer = state.mode === 'blitz' ? 60 : 0;
    state.blitzRowTimer = 0;
    state.screenShake = 0;
    state.particles = [];
    state.shockwaves = [];
    state.floatingTexts = [];
    state.selectedCluster = [];
    state.keyboardCursor = { r: Math.floor(ROWS / 2), c: Math.floor(COLS / 2) };
    state.status = 'ready';

    updateHUD();
    showOverlay(dom.overlayStart);
  }

  function createFallbackGrid() {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        row.push(Math.floor(Math.random() * 5));
      }
      g.push(row);
    }
    return g;
  }

  function startGameplay() {
    state.status = 'playing';
    hideAllOverlays();
    startLoop();
  }

  // Loop & Delta-Time Normalization
  function startLoop() {
    lastTime = performance.now();
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function stopLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    lastTime = 0;
  }

  function gameLoop(timestamp) {
    const currentTime = timestamp || performance.now();
    if (!lastTime) lastTime = currentTime;
    let dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Safety clamp dt against background tab spikes
    if (dt > 0.05) dt = 0.05;
    const timeScale = dt * 60;

    if (state.status === 'playing') {
      update(timeScale, dt);
    }
    render();

    if (state.status === 'playing' || state.particles.length > 0 || state.fallingBubbles.length > 0) {
      animFrameId = requestAnimationFrame(gameLoop);
    } else {
      animFrameId = null;
    }
  }

  // Update
  function update(timeScale, dt) {
    // 1. Timer
    if (state.mode === 'classic') {
      state.timer += dt;
    } else if (state.mode === 'blitz') {
      state.timer -= dt;
      if (state.timer <= 0) {
        state.timer = 0;
        handleGameOver('Time Expired!');
        return;
      }

      // Blitz top row descent timer
      state.blitzRowTimer += dt;
      if (state.blitzRowTimer >= 14) {
        state.blitzRowTimer = 0;
        insertBlitzRow();
      }
    }

    // 2. Combo decay
    if (state.combo > 1 && (performance.now() - state.lastPopTime) / 1000 > COMBO_TIMEOUT_SEC) {
      state.combo = 1;
      updateHUD();
    }

    // 3. Falling bubble animations
    for (let i = state.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = state.fallingBubbles[i];
      fb.progress += fb.speed * timeScale;
      if (fb.progress >= 1.0) {
        fb.progress = 1.0;
        state.fallingBubbles.splice(i, 1);
      }
    }

    // 4. Droplet particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.vy += 0.22 * timeScale; // Gravity
      p.alpha -= p.decay * timeScale;
      if (p.alpha <= 0) {
        state.particles.splice(i, 1);
      }
    }

    // 5. Shockwaves
    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
      const sw = state.shockwaves[i];
      sw.radius += 2.8 * timeScale;
      sw.alpha -= 0.045 * timeScale;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        state.shockwaves.splice(i, 1);
      }
    }

    // 6. Floating Score Texts
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y += ft.vy * timeScale;
      ft.alpha -= 0.022 * timeScale;
      if (ft.alpha <= 0) {
        state.floatingTexts.splice(i, 1);
      }
    }

    // 7. Screen Shake decay
    if (state.screenShake > 0) {
      state.screenShake *= Math.pow(0.85, timeScale);
      if (state.screenShake < 0.2) state.screenShake = 0;
    }

    updateHUD();
  }

  function insertBlitzRow() {
    const Board = window.BubbleBoard;
    if (!Board) return;
    state.grid = Board.insertTopRow(state.grid, 5);
    window.BubbleAudio?.playCascade();
    state.screenShake = 4;
    // Re-evaluate hover cluster
    refreshHoverCluster();
  }

  // Pop Cluster
  function popCluster(cluster) {
    if (!cluster || cluster.length < 2) return;

    const Board = window.BubbleBoard;
    const count = cluster.length;

    // Check combo
    const timeSinceLast = (performance.now() - state.lastPopTime) / 1000;
    if (timeSinceLast <= COMBO_TIMEOUT_SEC) {
      state.combo = Math.min(5, state.combo + 1);
    } else {
      state.combo = 1;
    }
    state.lastPopTime = performance.now();

    // Compute score
    const points = Board ? Board.calculateScore(count, state.combo) : count * count * 10 * state.combo;
    state.score += points;
    state.moves++;
    saveBestScore();

    // Audio
    window.BubbleAudio?.playPop(count);
    if (state.combo >= 2) {
      window.BubbleAudio?.playCombo(state.combo);
    }

    // Blitz bonus time for large clusters
    if (state.mode === 'blitz' && count >= 4) {
      state.timer = Math.min(75, state.timer + 2.5);
      spawnFloatingText(canvasW / 2, canvasH / 2 - 30, '+2.5s BONUS!', '#38bdf8');
    }

    // Center of cluster for floating text & shockwave
    let avgX = 0;
    let avgY = 0;
    const bubbleTheme = (Board?.BUBBLE_THEMES || [])[cluster[0].colorIndex] || { fill: '#d5ff55' };

    cluster.forEach(cell => {
      const cx = gridOffsetX + cell.col * cellSize + cellSize / 2;
      const cy = gridOffsetY + cell.row * cellSize + cellSize / 2;
      avgX += cx;
      avgY += cy;

      // Burst droplets
      spawnParticles(cx, cy, bubbleTheme.fill, 8);

      // Clear cell
      state.grid[cell.row][cell.col] = null;
    });

    avgX /= count;
    avgY /= count;

    // Shockwave
    state.shockwaves.push({
      x: avgX,
      y: avgY,
      radius: 12,
      maxRadius: Math.min(100, count * 9),
      color: bubbleTheme.fill,
      alpha: 0.8
    });

    // Floating Score
    const label = state.combo > 1 ? `+${points} (${state.combo}x COMBO!)` : `+${points}`;
    spawnFloatingText(avgX, avgY - 10, label, bubbleTheme.fill);

    // Screen Shake
    state.screenShake = Math.min(9, 2 + count * 0.45);

    // Gravity & Column Collapse
    if (Board) {
      const result = Board.applyGravityAndCollapse(state.grid);
      state.grid = result.newGrid;

      // Trigger cascade audio if bubbles moved
      if (result.drops.length > 0 || result.slides.length > 0) {
        window.BubbleAudio?.playCascade();
      }
    }

    // Screen reader announcement
    if (dom.srAnnouncer) {
      dom.srAnnouncer.textContent = `Popped ${count} bubbles! Score: ${state.score}. Moves: ${state.moves}`;
    }

    // Check board state
    checkBoardState();

    // Recompute cluster selection
    refreshHoverCluster();
  }

  function checkBoardState() {
    const Board = window.BubbleBoard;
    if (!Board) return;

    const remaining = Board.countRemainingBubbles(state.grid);
    const hasMoves = Board.hasValidMoves(state.grid);

    if (remaining === 0) {
      // Perfect Clear Victory!
      const clearBonus = 2500;
      state.score += clearBonus;
      saveBestScore();
      spawnFloatingText(canvasW / 2, canvasH / 2, 'PERFECT CLEAR! +2500', '#d5ff55');
      handleVictory(true);
    } else if (!hasMoves) {
      // No more valid moves
      if (state.mode === 'classic') {
        handleVictory(false);
      } else {
        handleGameOver('No More Moves!');
      }
    }
  }

  function handleVictory(isPerfect) {
    state.status = 'cleared';
    stopLoop();
    window.BubbleAudio?.playWin();
    launchConfetti();

    const Board = window.BubbleBoard;
    const remaining = Board ? Board.countRemainingBubbles(state.grid) : 0;
    const stars = Board ? Board.calculateStars(state.score, remaining) : 3;

    if (dom.winScoreVal) dom.winScoreVal.textContent = state.score;
    if (dom.winMovesVal) dom.winMovesVal.textContent = state.moves;
    if (dom.winTimeVal) dom.winTimeVal.textContent = formatTime(state.timer);
    if (dom.winStarsVal) dom.winStarsVal.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    showOverlay(dom.overlayWin);
  }

  function handleGameOver(reason) {
    state.status = 'gameover';
    stopLoop();
    window.BubbleAudio?.playGameOver();

    if (dom.goScoreVal) dom.goScoreVal.textContent = state.score;
    const subtitle = dom.overlayGameOver?.querySelector('.overlay-subtitle');
    if (subtitle) subtitle.textContent = reason || 'No more valid bubble clusters remain!';

    showOverlay(dom.overlayGameOver);
  }

  // Particle Spawner
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1.2;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 4.5 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.025
      });
    }
  }

  function spawnFloatingText(x, y, text, color) {
    state.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.3
    });
  }

  // Rendering
  function render() {
    if (!ctx) return;

    ctx.save();

    // Screen Shake
    if (state.screenShake > 0) {
      const sx = (Math.random() - 0.5) * state.screenShake * 2;
      const sy = (Math.random() - 0.5) * state.screenShake * 2;
      ctx.translate(sx, sy);
    }

    // Clear Background
    ctx.fillStyle = '#10120f';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Board Grid Backdrop
    drawBoardBackdrop();

    // Bubbles
    drawBubbles();

    // Keyboard Focus Indicator
    drawKeyboardCursor();

    // Shockwaves & Particles
    drawShockwaves();
    drawParticles();

    // Floating Texts
    drawFloatingTexts();

    ctx.restore();
  }

  function drawBoardBackdrop() {
    const bw = COLS * cellSize;
    const bh = ROWS * cellSize;

    // Dark inset container
    ctx.fillStyle = '#151814';
    ctx.strokeStyle = 'rgba(244, 242, 233, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(gridOffsetX - 6, gridOffsetY - 6, bw + 12, bh + 12, 12);
    ctx.fill();
    ctx.stroke();

    // Subtle cell guide dots
    ctx.fillStyle = 'rgba(244, 242, 233, 0.04)';
    for (let r = 0; r <= ROWS; r++) {
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.arc(gridOffsetX + c * cellSize, gridOffsetY + r * cellSize, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawBubbles() {
    const Board = window.BubbleBoard;
    const themes = Board?.BUBBLE_THEMES || [];
    const isSelectedSet = new Set(state.selectedCluster.map(c => `${c.row},${c.col}`));
    const now = performance.now() / 1000;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const colorIdx = state.grid[r]?.[c];
        if (colorIdx === null || colorIdx === undefined) continue;

        const theme = themes[colorIdx] || { fill: '#d5ff55', glow: '#e2ff7a', symbol: '◆' };
        const cx = gridOffsetX + c * cellSize + cellSize / 2;
        const cy = gridOffsetY + r * cellSize + cellSize / 2;
        const baseRadius = (cellSize - 6) / 2;

        const inCluster = isSelectedSet.has(`${r},${c}`);
        let radius = baseRadius;
        if (inCluster && state.selectedCluster.length >= 2) {
          // Pulsing scale
          radius += Math.sin(now * 9) * 1.8 + 1.2;
        }

        // 1. Cluster Highlight Ring
        if (inCluster && state.selectedCluster.length >= 2) {
          ctx.save();
          ctx.strokeStyle = theme.glow;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = theme.glow;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 2.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 2. Glossy Bubble Sphere Body
        ctx.save();
        const grad = ctx.createRadialGradient(
          cx - radius * 0.35,
          cy - radius * 0.35,
          radius * 0.1,
          cx,
          cy,
          radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, theme.glow);
        grad.addColorStop(0.85, theme.fill);
        grad.addColorStop(1, 'rgba(16, 18, 15, 0.7)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Rim border
        ctx.strokeStyle = theme.glow;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3. Specular Highlight (Crescent shine on top-left)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(cx - radius * 0.32, cy - radius * 0.32, radius * 0.26, 0, Math.PI * 2);
        ctx.fill();

        // 4. Accessible Symbol Glyph
        ctx.fillStyle = '#10120f';
        ctx.font = `bold ${Math.floor(cellSize * 0.34)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(theme.symbol, cx + 0.5, cy + 1);

        ctx.restore();
      }
    }

    // Hover Cluster Score Badge
    if (state.selectedCluster.length >= 2) {
      drawClusterPreviewBadge();
    }
  }

  function drawClusterPreviewBadge() {
    const Board = window.BubbleBoard;
    const count = state.selectedCluster.length;
    const points = Board ? Board.calculateScore(count, state.combo) : count * count * 10 * state.combo;

    // Find center cell of cluster
    let sumX = 0;
    let sumY = 0;
    state.selectedCluster.forEach(c => {
      sumX += gridOffsetX + c.col * cellSize + cellSize / 2;
      sumY += gridOffsetY + c.row * cellSize + cellSize / 2;
    });
    const avgX = sumX / count;
    const avgY = sumY / count;

    ctx.save();
    const text = `+${points} (${count})`;
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    const textW = ctx.measureText(text).width;
    const badgeW = textW + 16;
    const badgeH = 22;
    const badgeY = Math.max(16, avgY - cellSize * 0.85);

    ctx.fillStyle = '#20241e';
    ctx.strokeStyle = '#d5ff55';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#d5ff55';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.roundRect(avgX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d5ff55';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, avgX, badgeY + 1);

    ctx.restore();
  }

  function drawKeyboardCursor() {
    if (!state.keyboardCursor) return;
    const r = state.keyboardCursor.r;
    const c = state.keyboardCursor.c;
    const x = gridOffsetX + c * cellSize;
    const y = gridOffsetY + r * cellSize;

    ctx.save();
    ctx.strokeStyle = '#d5ff55';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#d5ff55';
    ctx.shadowBlur = 10;

    // Corner brackets
    const arm = 9;
    ctx.beginPath();
    // Top-Left
    ctx.moveTo(x + arm, y + 2);
    ctx.lineTo(x + 2, y + 2);
    ctx.lineTo(x + 2, y + arm);
    // Top-Right
    ctx.moveTo(x + cellSize - arm, y + 2);
    ctx.lineTo(x + cellSize - 2, y + 2);
    ctx.lineTo(x + cellSize - 2, y + arm);
    // Bottom-Left
    ctx.moveTo(x + 2, y + cellSize - arm);
    ctx.lineTo(x + 2, y + cellSize - 2);
    ctx.lineTo(x + arm, y + cellSize - 2);
    // Bottom-Right
    ctx.moveTo(x + cellSize - arm, y + cellSize - 2);
    ctx.lineTo(x + cellSize - 2, y + cellSize - 2);
    ctx.lineTo(x + cellSize - 2, y + cellSize - arm);
    ctx.stroke();

    ctx.restore();
  }

  function drawShockwaves() {
    state.shockwaves.forEach(sw => {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawParticles() {
    state.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawFloatingTexts() {
    state.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.shadowColor = '#10120f';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  // HUD & UI
  function updateHUD() {
    if (dom.scoreDisplay) dom.scoreDisplay.textContent = state.score;
    if (dom.bestScore) dom.bestScore.textContent = state.bestScore;
    if (dom.movesCount) dom.movesCount.textContent = `Moves: ${state.moves}`;

    if (dom.matchTimer) {
      dom.matchTimer.textContent = formatTime(state.timer);
    }

    if (dom.comboBadge) {
      if (state.combo >= 2) {
        dom.comboBadge.textContent = `${state.combo}× COMBO`;
        dom.comboBadge.style.display = 'inline-block';
      } else {
        dom.comboBadge.style.display = 'none';
      }
    }

    if (dom.remainingCount) {
      const Board = window.BubbleBoard;
      const count = Board ? Board.countRemainingBubbles(state.grid) : 0;
      dom.remainingCount.textContent = `Bubbles: ${count}`;
    }
  }

  function formatTime(sec) {
    const total = Math.max(0, Math.floor(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function showOverlay(targetEl) {
    [dom.overlayStart, dom.overlayPause, dom.overlayWin, dom.overlayGameOver].forEach(el => {
      if (el) el.classList.remove('show');
    });
    if (targetEl) targetEl.classList.add('show');
  }

  function hideAllOverlays() {
    [dom.overlayStart, dom.overlayPause, dom.overlayWin, dom.overlayGameOver].forEach(el => {
      if (el) el.classList.remove('show');
    });
  }

  function updateAudioIcon(isMuted) {
    if (!dom.audioIcon) return;
    const muted = isMuted !== undefined ? isMuted : window.BubbleAudio?.isMuted();
    dom.audioIcon.textContent = muted ? '🔇' : '🔊';
    dom.audioToggleBtn?.setAttribute('aria-label', muted ? 'Unmute Audio' : 'Mute Audio');
  }

  // Input Events
  function bindEvents() {
    window.addEventListener('resize', () => {
      setupCanvas();
      render();
    });

    // Canvas Mouse Movement & Clicks
    dom.canvas?.addEventListener('mousemove', e => {
      if (state.status !== 'playing') return;
      const cell = getCellFromCoords(e.clientX, e.clientY);
      if (cell) {
        state.hoverCell = cell;
        state.keyboardCursor = cell;
        refreshHoverCluster();
      }
    });

    dom.canvas?.addEventListener('mouseleave', () => {
      state.hoverCell = null;
      state.selectedCluster = [];
    });

    dom.canvas?.addEventListener('click', e => {
      if (state.status === 'ready') {
        startGameplay();
        return;
      }
      if (state.status !== 'playing') return;

      const cell = getCellFromCoords(e.clientX, e.clientY);
      if (cell) {
        const Board = window.BubbleBoard;
        const cluster = Board ? Board.findCluster(state.grid, cell.row, cell.col) : [];
        if (cluster.length >= 2) {
          popCluster(cluster);
        } else {
          // Singleton bubble click blip
          window.BubbleAudio?.playClick();
        }
      }
    });

    // Touch Support
    dom.canvas?.addEventListener('touchstart', e => {
      if (e.touches && e.touches.length > 0) {
        if (state.status === 'ready') {
          startGameplay();
          return;
        }
        const touch = e.touches[0];
        const cell = getCellFromCoords(touch.clientX, touch.clientY);
        if (cell) {
          state.hoverCell = cell;
          state.keyboardCursor = cell;
          refreshHoverCluster();
        }
      }
    }, { passive: true });

    dom.canvas?.addEventListener('touchend', e => {
      if (state.status !== 'playing') return;
      if (state.selectedCluster.length >= 2) {
        popCluster(state.selectedCluster);
      }
    });

    // Keyboard Events
    window.addEventListener('keydown', handleKeydown);

    // Overlay Buttons
    dom.startBtn?.addEventListener('click', () => {
      window.BubbleAudio?.playClick();
      startGameplay();
    });

    dom.resumeBtn?.addEventListener('click', () => {
      if (state.status === 'paused') {
        state.status = 'playing';
        hideAllOverlays();
        startLoop();
      }
    });

    dom.restartBtn?.addEventListener('click', () => {
      window.BubbleAudio?.playClick();
      startNewGame();
    });

    dom.playAgainBtn?.addEventListener('click', () => {
      window.BubbleAudio?.playClick();
      startNewGame();
    });

    dom.gameOverRestartBtn?.addEventListener('click', () => {
      window.BubbleAudio?.playClick();
      startNewGame();
    });

    dom.pauseBtn?.addEventListener('click', togglePause);

    // Audio Toggle
    if (dom.audioToggleBtn) {
      updateAudioIcon();
      dom.audioToggleBtn.addEventListener('click', () => {
        const isMuted = window.BubbleAudio?.toggleMute();
        updateAudioIcon(isMuted);
      });
    }

    // Mode Toggle
    dom.modeClassicBtn?.addEventListener('click', () => {
      if (state.mode === 'classic') return;
      setMode('classic');
    });

    dom.modeBlitzBtn?.addEventListener('click', () => {
      if (state.mode === 'blitz') return;
      setMode('blitz');
    });
  }

  function setMode(newMode) {
    state.mode = newMode;
    dom.modeClassicBtn?.classList.toggle('active', newMode === 'classic');
    dom.modeClassicBtn?.setAttribute('aria-selected', newMode === 'classic');
    dom.modeBlitzBtn?.classList.toggle('active', newMode === 'blitz');
    dom.modeBlitzBtn?.setAttribute('aria-selected', newMode === 'blitz');
    loadBestScore();
    startNewGame();
  }

  function getCellFromCoords(clientX, clientY) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const col = Math.floor((x - gridOffsetX) / cellSize);
    const row = Math.floor((y - gridOffsetY) / cellSize);

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      return { row, col };
    }
    return null;
  }

  function refreshHoverCluster() {
    const target = state.hoverCell || state.keyboardCursor;
    if (!target) {
      state.selectedCluster = [];
      return;
    }
    const Board = window.BubbleBoard;
    state.selectedCluster = Board ? Board.findCluster(state.grid, target.row, target.col) : [];
  }

  function handleKeydown(e) {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // Movement: Arrows
    let moved = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      state.keyboardCursor.r = Math.max(0, state.keyboardCursor.r - 1);
      moved = true;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      state.keyboardCursor.r = Math.min(ROWS - 1, state.keyboardCursor.r + 1);
      moved = true;
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      state.keyboardCursor.c = Math.max(0, state.keyboardCursor.c - 1);
      moved = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      state.keyboardCursor.c = Math.min(COLS - 1, state.keyboardCursor.c + 1);
      moved = true;
    }

    if (moved) {
      e.preventDefault();
      state.hoverCell = { ...state.keyboardCursor };
      refreshHoverCluster();
      render();
      return;
    }

    // Space / Enter: Pop Cluster
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (state.status === 'ready') {
        startGameplay();
        return;
      }
      if (state.status === 'playing') {
        refreshHoverCluster();
        if (state.selectedCluster.length >= 2) {
          popCluster(state.selectedCluster);
        } else {
          window.BubbleAudio?.playClick();
        }
      }
      return;
    }

    // P: Toggle Pause
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
      return;
    }

    // R: Restart Game
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      window.BubbleAudio?.playClick();
      startNewGame();
      return;
    }

    // M: Toggle Sound
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const isMuted = window.BubbleAudio?.toggleMute();
      updateAudioIcon(isMuted);
      return;
    }
  }

  function togglePause() {
    if (state.status === 'playing') {
      state.status = 'paused';
      stopLoop();
      showOverlay(dom.overlayPause);
    } else if (state.status === 'paused') {
      state.status = 'playing';
      hideAllOverlays();
      startLoop();
    }
  }

  function launchConfetti() {
    const colors = ['#d5ff55', '#ff784f', '#38bdf8', '#a855f7', '#fbbf24'];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      state.particles.push({
        x: canvasW / 2,
        y: canvasH / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  }

})();
