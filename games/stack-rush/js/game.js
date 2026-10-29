/**
 * Stack Rush — Ketchapp-Style 3D Slicing Tower Game Controller
 * One-button stacking: blocks oscillate horizontally across alternating axes (X / Z).
 * Tap, click, or press Space to drop and trim overhanging edges with satisfying 3D debris physics,
 * ascending musical chime combos on PERFECT alignments, particle sparkle bursts,
 * dynamic camera height tracking, and instant restart.
 */
(function() {
  'use strict';

  const Engine = window.StackEngine;
  const Audio = window.StackAudio;

  if (!Engine || !Audio) {
    console.error('Stack Rush: Required engine or audio modules missing.');
    return;
  }

  // DOM Elements
  const canvas = document.getElementById('stack-canvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('next-canvas');
  const nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;

  const scoreDisplay = document.getElementById('score-display');
  const layersDisplay = document.getElementById('layers-display');
  const movesDisplay = document.getElementById('moves-display');
  const gemsDisplay = document.getElementById('gems-display');
  const timerDisplay = document.getElementById('timer-display');
  const comboDisplay = document.getElementById('combo-display');
  const bestDisplay = document.getElementById('best-display');
  const themeSelect = document.getElementById('theme-select');

  const pauseBtn = document.getElementById('pause-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');

  const overlayStart = document.getElementById('overlay-start');
  const startBtn = document.getElementById('start-btn');
  const overlayPause = document.getElementById('overlay-pause');
  const resumeBtn = document.getElementById('resume-btn');
  const restartBtn = document.getElementById('restart-btn');

  const overlayWin = document.getElementById('overlay-win');
  const winTitle = document.getElementById('win-title');
  const winSummary = document.getElementById('win-summary');
  const winScoreVal = document.getElementById('win-score-val');
  const winStarsVal = document.getElementById('win-stars-val');
  const winMovesVal = document.getElementById('win-moves-val');
  const winLayersVal = document.getElementById('win-layers-val');
  const winGemsVal = document.getElementById('win-gems-val');
  const playAgainBtn = document.getElementById('play-again-btn');

  const overlayGameOver = document.getElementById('overlay-gameover');
  const goScoreVal = document.getElementById('go-score-val');
  const goMovesVal = document.getElementById('go-moves-val');
  const goLayersVal = document.getElementById('go-layers-val');
  const goGemsVal = document.getElementById('go-gems-val');
  const tryAgainBtn = document.getElementById('try-again-btn');

  const btnRotLeft = document.getElementById('btn-rot-left');
  const btnDrop = document.getElementById('btn-drop');
  const btnRotRight = document.getElementById('btn-rot-right');

  const modeClassicBtn = document.getElementById('mode-classic-btn');
  const modeChallengeBtn = document.getElementById('mode-challenge-btn');
  const modeBlitzBtn = document.getElementById('mode-blitz-btn');

  // Game Constants
  const BASE_WIDTH = Engine.INITIAL_SIZE || 140;
  const BASE_DEPTH = Engine.INITIAL_SIZE || 140;
  const BLOCK_HEIGHT = Engine.BLOCK_HEIGHT || 16;
  const MOVE_RANGE = Engine.MOVE_RANGE || 200;

  // State Management
  const state = {
    mode: 'classic', // 'classic' | 'challenge' | 'blitz'
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'gameover' | 'win'

    score: 0,
    perfectCount: 0,
    streak: 0,
    moves: 0,
    elapsedSeconds: 0,
    blitzRemaining: 60,
    bestScore: 0,

    // 3D Tower Stack
    stack: [],       // Array of placed block objects: { x, y, z, w, h, d, hue, faceColors }
    debris: [],      // Falling trimmed pieces: { x, y, z, w, h, d, vx, vy, vz, rotX, rotZ, hue, alpha }
    sparkles: [],    // Particle bursts on perfect drops

    // Active Moving Block
    moving: {
      x: 0,
      y: 0,
      z: 0,
      w: BASE_WIDTH,
      h: BLOCK_HEIGHT,
      d: BASE_DEPTH,
      axis: 'x',     // Alternates 'x' and 'z'
      dir: 1,        // Current travel direction
      speed: 2.5,
      hue: 270,
      faceColors: null
    },

    // Camera
    cameraY: 0,
    targetCameraY: 0,

    // Feedback
    bannerText: '',
    bannerTimer: 0,
    bannerColor: '#d5ff55'
  };

  let animationFrameId = null;
  let timerIntervalId = null;
  let lastFrameTime = performance.now();
  let movePhase = -Math.PI / 2;

  // Initialize Personal Best
  try {
    const savedBest = localStorage.getItem('stack_rush_best');
    if (savedBest) state.bestScore = parseInt(savedBest, 10) || 0;
  } catch (e) {}
  updateHUD();

  // Setup Theme Selector
  function setupThemeSelector() {
    if (!themeSelect) return;
    themeSelect.innerHTML = '';
    const themes = [
      { id: 'cyber', name: 'Cyber Neon' },
      { id: 'gold', name: 'Obsidian Gold' },
      { id: 'synthwave', name: 'Retro Synth' },
      { id: 'matrix', name: 'Matrix Jade' }
    ];
    themes.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      themeSelect.appendChild(opt);
    });
    themeSelect.addEventListener('change', () => {
      // Refresh current colors if needed
    });
  }
  setupThemeSelector();

  // Resize Handlers
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  /**
   * Resets and starts a fresh match.
   */
  function startGame(selectedMode) {
    if (selectedMode) state.mode = selectedMode;

    state.score = 0;
    state.perfectCount = 0;
    state.streak = 0;
    state.moves = 0;
    state.elapsedSeconds = 0;
    state.blitzRemaining = 60;
    state.stack = [];
    state.debris = [];
    state.sparkles = [];
    state.cameraY = 0;
    state.targetCameraY = 0;
    movePhase = -Math.PI / 2;

    // Create Base Pedestal (Layer 0)
    const baseHue = Engine.getLayerHue(0);
    const baseBlock = {
      x: 0,
      y: 0,
      z: 0,
      w: BASE_WIDTH,
      h: BLOCK_HEIGHT,
      d: BASE_DEPTH,
      hue: baseHue,
      faceColors: Engine.getFaceColors(baseHue)
    };
    state.stack.push(baseBlock);

    // Spawn first moving block (Layer 1)
    spawnNextMovingBlock();

    state.status = 'playing';
    hideAllOverlays();
    startTimer();
    updateHUD();

    lastFrameTime = performance.now();
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  /**
   * Spawns the next moving block on top of the stack.
   */
  function spawnNextMovingBlock() {
    const top = state.stack[state.stack.length - 1];
    const layerIdx = state.stack.length;
    // Alternate axes: odd layer indices move on X, even on Z
    const axis = (layerIdx % 2 === 1) ? 'x' : 'z';
    const hue = Engine.getLayerHue(layerIdx);

    // Calibrated speed in Hz (cycles/sec) based on game mode:
    // 0.36 Hz = ~2.78s full cycle, ~1.39s across platform (calm, accessible, skill-based)
    let baseSpeed = 0.36;
    let speedGrowth = 0.005;
    let maxSpeed = 0.58;

    if (state.mode === 'challenge') {
      baseSpeed = 0.33;
      speedGrowth = 0.004;
      maxSpeed = 0.52;
    } else if (state.mode === 'blitz') {
      baseSpeed = 0.44;
      speedGrowth = 0.006;
      maxSpeed = 0.62;
    }

    const speed = Math.min(maxSpeed, baseSpeed + layerIdx * speedGrowth);

    // Incoming side: alternate coming from negative side (-1) and positive side (+1)
    // When phase = -PI/2, sin(-PI/2) = -1 (starts smoothly at -MOVE_RANGE)
    // When phase = +PI/2, sin(PI/2) = +1 (starts smoothly at +MOVE_RANGE)
    const startFromNeg = (layerIdx % 2 === 1);
    movePhase = startFromNeg ? -Math.PI / 2 : Math.PI / 2;
    const initialOffset = Math.sin(movePhase) * MOVE_RANGE;

    state.moving = {
      x: axis === 'x' ? (top.x + initialOffset) : top.x,
      y: layerIdx * BLOCK_HEIGHT,
      z: axis === 'z' ? (top.z + initialOffset) : top.z,
      w: top.w,
      h: BLOCK_HEIGHT,
      d: top.d,
      axis: axis,
      dir: startFromNeg ? 1 : -1,
      speed: speed,
      hue: hue,
      faceColors: Engine.getFaceColors(hue)
    };

    // Draw mini preview in next-canvas
    drawNextPreview();
  }

  /**
   * Main Action: Drop & Slice block on one-button tap/click.
   */
  function dropBlock() {
    if (state.status !== 'playing') {
      if (state.status === 'ready' || state.status === 'gameover' || state.status === 'win') {
        startGame();
      }
      return;
    }

    state.moves++;
    const prev = state.stack[state.stack.length - 1];
    const curr = state.moving;
    const sliceRes = Engine.sliceBlock(prev, curr, curr.axis);

    if (sliceRes.status === 'perfect') {
      // PERFECT SNAP!
      state.streak++;
      state.perfectCount++;
      state.score++;

      const newBlock = {
        x: sliceRes.overlap.x,
        y: curr.y,
        z: sliceRes.overlap.z,
        w: sliceRes.overlap.w,
        h: curr.h,
        d: sliceRes.overlap.d,
        hue: curr.hue,
        faceColors: curr.faceColors
      };
      state.stack.push(newBlock);

      // Audio & Sparkles
      Audio.playPerfect(state.streak);
      triggerSparkles(newBlock);

      triggerBanner(state.streak > 1 ? `PERFECT x${state.streak}!` : 'PERFECT!', '#38bdf8');

      // Combo expansion bonus
      if (state.streak >= Engine.COMBO_STREAK_BONUS) {
        if (newBlock.w < BASE_WIDTH || newBlock.d < BASE_DEPTH) {
          newBlock.w = Math.min(BASE_WIDTH, newBlock.w + Engine.BONUS_EXPANSION);
          newBlock.d = Math.min(BASE_DEPTH, newBlock.d + Engine.BONUS_EXPANSION);
          Audio.playComboBonus();
          triggerBanner('COMBO EXPANSION! +8px', '#d5ff55');
        }
      }

      checkWinConditions();
      if (state.status === 'playing') {
        spawnNextMovingBlock();
        updateCamera();
      }

    } else if (sliceRes.status === 'trim') {
      // TRIM OVERHANG
      state.streak = 0;
      state.score++;

      // Overlap stays on the tower
      const newBlock = {
        x: sliceRes.overlap.x,
        y: curr.y,
        z: sliceRes.overlap.z,
        w: sliceRes.overlap.w,
        h: curr.h,
        d: sliceRes.overlap.d,
        hue: curr.hue,
        faceColors: curr.faceColors
      };
      state.stack.push(newBlock);

      // Cut piece becomes falling debris
      spawnCutDebris(sliceRes.cut, curr.y, curr.hue, curr.faceColors);

      Audio.playTrim();

      checkWinConditions();
      if (state.status === 'playing') {
        spawnNextMovingBlock();
        updateCamera();
      }

    } else {
      // TOTAL MISS -> GAME OVER
      Audio.playMiss();
      // Drop entire moving block as falling debris
      spawnCutDebris({
        x: curr.x,
        z: curr.z,
        w: curr.w,
        d: curr.d,
        axis: curr.axis,
        dir: curr.dir
      }, curr.y, curr.hue, curr.faceColors, true);

      endGame(false);
    }

    updateHUD();
  }

  /**
   * Spawns physics falling debris for sliced-off pieces.
   */
  function spawnCutDebris(cutInfo, y, hue, faceColors, isFullMiss = false) {
    if (!cutInfo) return;

    const lateralForce = isFullMiss ? 2.5 : 1.2;
    state.debris.push({
      x: cutInfo.x,
      y: y,
      z: cutInfo.z,
      w: cutInfo.w,
      h: BLOCK_HEIGHT,
      d: cutInfo.d,
      vx: cutInfo.axis === 'x' ? (cutInfo.dir * lateralForce) : 0,
      vy: 1.0,
      vz: cutInfo.axis === 'z' ? (cutInfo.dir * lateralForce) : 0,
      rotX: 0,
      rotZ: 0,
      vRotX: (Math.random() - 0.5) * 0.08,
      vRotZ: (Math.random() - 0.5) * 0.08,
      hue: hue,
      faceColors: faceColors,
      alpha: 1.0
    });
  }

  /**
   * Spawns a fountain of luminous sparkle particles rising from a PERFECT block.
   */
  function triggerSparkles(block) {
    const particleCount = 35;
    for (let i = 0; i < particleCount; i++) {
      state.sparkles.push({
        x: block.x + (Math.random() - 0.5) * block.w,
        y: block.y + block.h,
        z: block.z + (Math.random() - 0.5) * block.d,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 2.5 + Math.random() * 3.5, // Erupt upwards!
        vz: (Math.random() - 0.5) * 1.5,
        size: 2.5 + Math.random() * 3.5,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        hue: block.hue + (Math.random() * 20 - 10)
      });
    }
  }

  /**
   * Updates smooth camera target tracking.
   */
  function updateCamera() {
    // Keep top of stack at comfortable height
    const topY = state.stack.length * BLOCK_HEIGHT;
    state.targetCameraY = Math.max(0, topY - 140);
  }

  /**
   * Checks win conditions for challenge and blitz modes.
   */
  function checkWinConditions() {
    if (state.mode === 'challenge' && state.score >= 50) {
      endGame(true);
    }
  }

  /**
   * Concludes the match.
   */
  function endGame(isVictory) {
    state.status = isVictory ? 'win' : 'gameover';
    stopTimer();

    // Check Personal Best
    let isNewBest = false;
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      isNewBest = true;
      try {
        localStorage.setItem('stack_rush_best', state.bestScore.toString());
      } catch (e) {}
    }

    if (isVictory) {
      Audio.playWin();
      showWinModal();
    } else {
      Audio.playGameOver();
      showGameOverModal(isNewBest);
    }

    updateHUD();
  }

  // Floating Banner Text
  function triggerBanner(text, color = '#d5ff55') {
    state.bannerText = text;
    state.bannerColor = color;
    state.bannerTimer = 45; // ~0.75 seconds
  }

  // Overlays
  function hideAllOverlays() {
    [overlayStart, overlayPause, overlayWin, overlayGameOver].forEach(el => {
      if (el) el.classList.remove('show');
    });
  }

  function showWinModal() {
    if (!overlayWin) return;
    if (winTitle) winTitle.textContent = 'Tower Mastered!';
    if (winSummary) winSummary.textContent = 'Spectacular stacking! Reached 50 blocks with towering precision.';
    if (winScoreVal) winScoreVal.textContent = state.score;
    if (winStarsVal) winStarsVal.textContent = '★★★';
    if (winMovesVal) winMovesVal.textContent = state.moves;
    if (winLayersVal) winLayersVal.textContent = state.score;
    if (winGemsVal) winGemsVal.textContent = `💎 ${state.perfectCount * 5}`;
    overlayWin.classList.add('show');
  }

  function showGameOverModal(isNewBest) {
    if (!overlayGameOver) return;
    const title = overlayGameOver.querySelector('.overlay-title');
    const subtitle = overlayGameOver.querySelector('.overlay-subtitle');
    if (title) title.textContent = isNewBest ? 'New Personal Best!' : 'Tower Complete!';
    if (subtitle) subtitle.textContent = `Stacked to a height of ${state.score} blocks. Tap anywhere to try again!`;
    if (goScoreVal) goScoreVal.textContent = state.score;
    if (goMovesVal) goMovesVal.textContent = state.moves;
    if (goLayersVal) goLayersVal.textContent = state.score;
    if (goGemsVal) goGemsVal.textContent = `💎 ${state.perfectCount * 2}`;
    overlayGameOver.classList.add('show');
  }

  // Timer Management
  function startTimer() {
    stopTimer();
    timerIntervalId = setInterval(() => {
      if (state.status === 'playing') {
        state.elapsedSeconds++;
        if (state.mode === 'blitz') {
          state.blitzRemaining--;
          if (state.blitzRemaining <= 0) {
            endGame(false);
          }
        }
        updateHUD();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  function updateHUD() {
    if (scoreDisplay) scoreDisplay.textContent = `Height: ${state.score}`;
    if (layersDisplay) layersDisplay.textContent = `Streak: ${state.streak}`;
    if (movesDisplay) movesDisplay.textContent = `Blocks: ${state.moves}`;
    if (gemsDisplay) gemsDisplay.textContent = `💎 ${state.perfectCount * 2}`;
    if (comboDisplay) comboDisplay.textContent = state.streak > 1 ? `x${state.streak} COMBO` : 'Align & Drop';
    if (bestDisplay) bestDisplay.textContent = state.bestScore.toString();

    if (timerDisplay) {
      if (state.mode === 'blitz') {
        timerDisplay.textContent = `${state.blitzRemaining}s`;
      } else {
        const mins = Math.floor(state.elapsedSeconds / 60);
        const secs = state.elapsedSeconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }
  }

  // =========================================================================
  // 60 FPS Canvas Isometric Renderer
  // =========================================================================

  function gameLoop(now) {
    const dt = Math.min(32, now - lastFrameTime);
    lastFrameTime = now;

    update(dt);
    render();

    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    if (state.status === 'playing') {
      // Advance phase: speed is frequency in Hz (cycles/sec), dt in ms
      movePhase += (dt * 0.001) * state.moving.speed * (Math.PI * 2);

      // Smooth sinusoidal oscillation between -MOVE_RANGE and +MOVE_RANGE
      const offset = Math.sin(movePhase) * MOVE_RANGE;
      const top = state.stack[state.stack.length - 1];

      if (state.moving.axis === 'x') {
        state.moving.x = top.x + offset;
        state.moving.z = top.z;
      } else {
        state.moving.x = top.x;
        state.moving.z = top.z + offset;
      }

      // Smooth camera interpolation
      state.cameraY += (state.targetCameraY - state.cameraY) * 0.08;
    }

    // Update debris physics
    for (let i = state.debris.length - 1; i >= 0; i--) {
      const d = state.debris[i];
      d.vy -= 0.35; // Gravity acceleration downward
      d.x += d.vx;
      d.y += d.vy;
      d.z += d.vz;
      d.rotX += d.vRotX;
      d.rotZ += d.vRotZ;
      d.alpha -= 0.012;

      // Remove when fallen far below view
      if (d.alpha <= 0 || d.y < state.cameraY - 200) {
        state.debris.splice(i, 1);
      }
    }

    // Update sparkles
    for (let i = state.sparkles.length - 1; i >= 0; i--) {
      const sp = state.sparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.z += sp.vz;
      sp.vy -= 0.08; // Slight gravity
      sp.life -= sp.decay;
      if (sp.life <= 0) {
        state.sparkles.splice(i, 1);
      }
    }

    // Update banner
    if (state.bannerTimer > 0) {
      state.bannerTimer--;
    }
  }

  function render() {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dynamic scale and viewport origin
    const originX = width / 2;
    const originY = height * 0.68;
    const scale = Math.min(width, height) / 480;

    // 1. Draw Atmospheric Background & Futuristic Ground Grid
    drawAtmosphere(width, height, originX, originY, scale);

    // 2. Render Placed Blocks from bottom to top
    for (let i = 0; i < state.stack.length; i++) {
      const b = state.stack[i];
      drawIsometricBlock(b, state.cameraY, originX, originY, scale, 1.0);
    }

    // 3. Render Falling Debris
    for (const d of state.debris) {
      drawIsometricBlock(d, state.cameraY, originX, originY, scale, d.alpha);
    }

    // 4. Render Active Moving Block
    if (state.status === 'playing') {
      drawIsometricBlock(state.moving, state.cameraY, originX, originY, scale, 1.0, true);
    }

    // 5. Render Sparkle Particles
    drawSparkles(originX, originY, scale);

    // 6. Render Floating Banner Feedback
    if (state.bannerTimer > 0 && state.bannerText) {
      drawBanner(originX, originY, scale);
    }
  }

  /**
   * Draws dark ambient background with blueprint grid lines on floor plane.
   */
  function drawAtmosphere(width, height, originX, originY, scale) {
    // Subtle radial gradient centered on stage
    const bgGrad = ctx.createRadialGradient(originX, originY * 0.65, 40, originX, originY, width * 0.85);
    bgGrad.addColorStop(0, '#151922');
    bgGrad.addColorStop(0.6, '#0f1117');
    bgGrad.addColorStop(1, '#090a0d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Isometric Floor Grid Plane
    const cos30 = 0.8660254;
    const sin30 = 0.5;
    const gridSize = 40;
    const gridCount = 6;

    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;

    for (let i = -gridCount; i <= gridCount; i++) {
      // Lines along X
      const p1x = originX + (-gridCount * gridSize - i * gridSize) * cos30 * scale;
      const p1y = originY + (-gridCount * gridSize + i * gridSize) * sin30 * scale + state.cameraY * scale;
      const p2x = originX + (gridCount * gridSize - i * gridSize) * cos30 * scale;
      const p2y = originY + (gridCount * gridSize + i * gridSize) * sin30 * scale + state.cameraY * scale;

      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

      // Lines along Z
      const q1x = originX + (i * gridSize - (-gridCount * gridSize)) * cos30 * scale;
      const q1y = originY + (i * gridSize + (-gridCount * gridSize)) * sin30 * scale + state.cameraY * scale;
      const q2x = originX + (i * gridSize - (gridCount * gridSize)) * cos30 * scale;
      const q2y = originY + (i * gridSize + (gridCount * gridSize)) * sin30 * scale + state.cameraY * scale;

      ctx.beginPath();
      ctx.moveTo(q1x, q1y);
      ctx.lineTo(q2x, q2y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Renders a 3D block with top, right, and left faces.
   */
  function drawIsometricBlock(box, cameraY, originX, originY, scale, alpha = 1.0, isMoving = false) {
    const proj = Engine.projectIsometricBox(box, cameraY, originX, originY, scale);
    const colors = box.faceColors || Engine.getFaceColors(box.hue);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Helper to draw polygon
    function fillPoly(pts, color) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // 1. Left Face (Shadowed)
    fillPoly(proj.left, colors.left);

    // 2. Right Face (Mid-tone)
    fillPoly(proj.right, colors.right);

    // 3. Top Face (Lit base)
    fillPoly(proj.top, colors.top);

    // 4. Subtle glowing highlight stroke on top face rim
    ctx.beginPath();
    ctx.moveTo(proj.top[0].x, proj.top[0].y);
    for (let i = 1; i < proj.top.length; i++) {
      ctx.lineTo(proj.top[i].x, proj.top[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = isMoving ? '#ffffff' : colors.edge;
    ctx.lineWidth = isMoving ? 2 : 1;
    ctx.stroke();

    // 5. Subtle glow indicator for moving block
    if (isMoving) {
      ctx.shadowColor = colors.top;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Renders active sparkle particles on canvas.
   */
  function drawSparkles(originX, originY, scale) {
    if (state.sparkles.length === 0) return;
    const cos30 = 0.8660254;
    const sin30 = 0.5;

    ctx.save();
    for (const sp of state.sparkles) {
      const scrX = originX + (sp.x - sp.z) * cos30 * scale;
      const scrY = originY + (sp.x + sp.z) * sin30 * scale - (sp.y - state.cameraY) * scale;

      ctx.beginPath();
      ctx.arc(scrX, scrY, sp.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${sp.hue}, 95%, 70%, ${sp.life})`;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Floating banner text on PERFECT or combo.
   */
  function drawBanner(originX, originY, scale) {
    ctx.save();
    const top = state.stack[state.stack.length - 1];
    const cos30 = 0.8660254;
    const sin30 = 0.5;

    const topScreenY = originY + (top.x + top.z) * sin30 * scale - (top.y - state.cameraY) * scale;

    ctx.font = `800 ${Math.round(20 * scale)}px 'Space Grotesk', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = state.bannerColor;
    ctx.shadowColor = state.bannerColor;
    ctx.shadowBlur = 14;

    const alpha = Math.min(1.0, state.bannerTimer / 20);
    ctx.globalAlpha = alpha;
    ctx.fillText(state.bannerText, originX, topScreenY - 30 * scale);
    ctx.restore();
  }

  /**
   * Draws upcoming block preview into next-canvas.
   */
  function drawNextPreview() {
    if (!nextCtx || !nextCanvas) return;
    const w = nextCanvas.width;
    const h = nextCanvas.height;
    nextCtx.clearRect(0, 0, w, h);

    const hue = Engine.getLayerHue(state.stack.length);
    const colors = Engine.getFaceColors(hue);
    const box = { x: 0, y: 0, z: 0, w: 26, h: 10, d: 26, faceColors: colors, hue: hue };

    const proj = Engine.projectIsometricBox(box, 0, w / 2, h * 0.65, 0.9);

    function fillNext(pts, color) {
      nextCtx.beginPath();
      nextCtx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) nextCtx.lineTo(pts[i].x, pts[i].y);
      nextCtx.closePath();
      nextCtx.fillStyle = color;
      nextCtx.fill();
    }

    fillNext(proj.left, colors.left);
    fillNext(proj.right, colors.right);
    fillNext(proj.top, colors.top);
  }

  // =========================================================================
  // User Input Bindings — One-Button Accessibility
  // =========================================================================

  // 1. Canvas / Stage Tap & Click
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    dropBlock();
  });

  // 2. Primary Drop Action Button
  if (btnDrop) {
    btnDrop.addEventListener('click', (e) => {
      e.preventDefault();
      dropBlock();
    });
  }

  // Auxiliary rotation buttons (for manual nudge or directional preference)
  if (btnRotLeft) {
    btnRotLeft.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.status === 'playing') {
        movePhase -= 0.15;
      }
    });
  }
  if (btnRotRight) {
    btnRotRight.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.status === 'playing') {
        movePhase += 0.15;
      }
    });
  }

  // 3. Global Keyboard Controls
  window.addEventListener('keydown', (e) => {
    // Avoid interfering with inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
      e.preventDefault();
      dropBlock();
    } else if (e.code === 'KeyP') {
      e.preventDefault();
      togglePause();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      startGame();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      handleAudioToggle();
    }
  });

  // Pause Handlers
  function togglePause() {
    if (state.status === 'playing') {
      state.status = 'paused';
      stopTimer();
      if (overlayPause) overlayPause.classList.add('show');
    } else if (state.status === 'paused') {
      state.status = 'playing';
      startTimer();
      if (overlayPause) overlayPause.classList.remove('show');
      lastFrameTime = performance.now();
    }
  }

  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
  if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
  if (restartBtn) restartBtn.addEventListener('click', () => startGame());

  // Audio Toggle
  function handleAudioToggle() {
    const isMuted = Audio.toggleMute();
    if (audioIcon) audioIcon.textContent = isMuted ? '🔇' : '🔊';
  }
  if (audioToggleBtn) audioToggleBtn.addEventListener('click', handleAudioToggle);
  if (audioIcon) audioIcon.textContent = Audio.getMuteState() ? '🔇' : '🔊';

  // Modal Buttons
  if (startBtn) startBtn.addEventListener('click', () => startGame());
  if (playAgainBtn) playAgainBtn.addEventListener('click', () => startGame());
  if (tryAgainBtn) tryAgainBtn.addEventListener('click', () => startGame());

  // Mode Selection Tabs
  function selectMode(newMode) {
    [modeClassicBtn, modeChallengeBtn, modeBlitzBtn].forEach(b => {
      if (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      }
    });

    if (newMode === 'classic' && modeClassicBtn) {
      modeClassicBtn.classList.add('active');
      modeClassicBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'challenge' && modeChallengeBtn) {
      modeChallengeBtn.classList.add('active');
      modeChallengeBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'blitz' && modeBlitzBtn) {
      modeBlitzBtn.classList.add('active');
      modeBlitzBtn.setAttribute('aria-selected', 'true');
    }

    startGame(newMode);
  }

  if (modeClassicBtn) modeClassicBtn.addEventListener('click', () => selectMode('classic'));
  if (modeChallengeBtn) modeChallengeBtn.addEventListener('click', () => selectMode('challenge'));
  if (modeBlitzBtn) modeBlitzBtn.addEventListener('click', () => selectMode('blitz'));

  // Initialize preview on load
  drawNextPreview();

})();
