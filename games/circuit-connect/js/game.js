/**
 * Circuit Connect — Interactive Canvas & Board Controller
 * Smooth tile rotations, neon energy flow pulses, bridge overpass rendering,
 * move efficiency tracking, level progression with localStorage, and accessible controls.
 */
(function() {
  'use strict';

  const Engine = window.CircuitEngine;
  const Audio = window.CircuitAudio;

  if (!Engine || !Audio) {
    console.error('Circuit Connect: Required Engine or Audio module missing.');
    return;
  }

  // DOM Elements
  const canvas = document.getElementById('circuit-canvas');
  const ctx = canvas.getContext('2d');

  const levelTitleDisplay = document.getElementById('level-title-display');
  const chapterDisplay = document.getElementById('chapter-display');
  const movesDisplay = document.getElementById('moves-display');
  const parDisplay = document.getElementById('par-display');
  const targetsDisplay = document.getElementById('targets-display');
  const timerDisplay = document.getElementById('timer-display');

  const levelSelectBtn = document.getElementById('level-select-btn');
  const undoBtn = document.getElementById('undo-btn');
  const restartBtn = document.getElementById('restart-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');

  // Modals & Overlays
  const overlayWin = document.getElementById('overlay-win');
  const winTitle = document.getElementById('win-title');
  const winStarsVal = document.getElementById('win-stars-val');
  const winMovesVal = document.getElementById('win-moves-val');
  const winParVal = document.getElementById('win-par-val');
  const winTimeVal = document.getElementById('win-time-val');
  const nextLevelBtn = document.getElementById('next-level-btn');
  const replayBtn = document.getElementById('replay-btn');

  const overlayOverload = document.getElementById('overlay-overload');
  const overloadRestartBtn = document.getElementById('overload-restart-btn');
  const overloadUndoBtn = document.getElementById('overload-undo-btn');

  const overlayLevelSelect = document.getElementById('overlay-level-select');
  const closeLevelSelectBtn = document.getElementById('close-level-select-btn');
  const levelGridContainer = document.getElementById('level-grid-container');

  // Local Storage Keys
  const STORAGE_KEY = 'circuit_connect_progress';

  // Game State
  const state = {
    currentLevelIndex: 0,
    currentLevelData: null,
    grid: [],
    rows: 3,
    cols: 3,

    movesUsed: 0,
    parMoves: 4,
    moveLimit: 12,
    elapsedSeconds: 0,
    isSolved: false,
    isOverloaded: false,
    isPaused: false,

    // Keyboard selection cursor
    cursor: { r: 0, c: 0 },

    // Circuit evaluation results
    circuitResult: {
      isSolved: false,
      energizedTiles: new Set(),
      energizedWires: [],
      connectedTargets: 0,
      totalTargets: 0
    },

    // Move history for Undo
    history: [],

    // Visual animation states: tileId -> current visual angle
    visualRotations: {},

    // Pulse animation phase for energized wires
    pulsePhase: 0,

    // Progress record
    progress: {}
  };

  let timerIntervalId = null;
  let animFrameId = null;
  let lastTime = performance.now();

  // Load Saved Progress
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state.progress = JSON.parse(saved);
    }
  } catch (e) {}

  // Save Progress
  function saveProgress(levelId, stars, moves, time) {
    if (!state.progress[levelId] || stars > state.progress[levelId].stars) {
      state.progress[levelId] = {
        stars,
        bestMoves: moves,
        bestTime: time,
        unlocked: true
      };
    }
    // Unlock next level
    const nextId = levelId + 1;
    if (nextId <= Engine.LEVELS.length && (!state.progress[nextId] || !state.progress[nextId].unlocked)) {
      state.progress[nextId] = state.progress[nextId] || { stars: 0, unlocked: true };
      state.progress[nextId].unlocked = true;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch (e) {}
  }

  // Ensure Level 1 is always unlocked
  if (!state.progress[1]) {
    state.progress[1] = { stars: 0, unlocked: true };
  }

  // Canvas Resize Handler
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  }
  window.addEventListener('resize', resizeCanvas);

  /**
   * Initializes and loads a level by index (0-based).
   */
  function loadLevel(levelIndex) {
    if (levelIndex < 0 || levelIndex >= Engine.LEVELS.length) {
      levelIndex = 0;
    }

    state.currentLevelIndex = levelIndex;
    const levelData = Engine.LEVELS[levelIndex];
    state.currentLevelData = levelData;

    state.rows = levelData.rows;
    state.cols = levelData.cols;
    state.parMoves = levelData.parMoves;
    state.moveLimit = levelData.moveLimit;
    state.movesUsed = 0;
    state.elapsedSeconds = 0;
    state.isSolved = false;
    state.isOverloaded = false;
    state.history = [];
    state.cursor = { r: 0, c: 0 };

    // Instantiate board grid
    state.grid = Engine.createLevelGrid(levelData);

    // Initialize visual rotation tracking for smooth ease
    state.visualRotations = {};
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const t = state.grid[r][c];
        state.visualRotations[t.id] = t.rotation * (Math.PI / 2);
      }
    }

    // Run initial circuit evaluation
    updateCircuit();

    hideModals();
    startTimer();
    updateHUD();
    resizeCanvas();
  }

  /**
   * Re-evaluates circuit connectivity and updates state.
   */
  function updateCircuit() {
    state.circuitResult = Engine.evaluateCircuit(state.grid, state.rows, state.cols);
    state.isSolved = state.circuitResult.isSolved;

    if (state.isSolved) {
      handleLevelComplete();
    } else if (state.moveLimit > 0 && state.movesUsed >= state.moveLimit) {
      handleCircuitOverload();
    }
  }

  /**
   * Rotates tile at (r, c) by delta turns (+1 = 90 deg clockwise).
   */
  function onTileRotate(r, c, delta = 1) {
    if (state.isSolved || state.isOverloaded || state.isPaused) return;
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;

    const tile = state.grid[r][c];
    if (!tile || tile.fixed || tile.type === Engine.TRACK_TYPES.EMPTY) return;

    // Record for Undo
    state.history.push({
      r,
      c,
      prevRotation: tile.rotation
    });

    const success = Engine.rotateTile(state.grid, r, c, delta);
    if (success) {
      state.movesUsed++;
      Audio.playRotate();

      // Trigger circuit evaluation
      updateCircuit();
      updateHUD();
    }
  }

  /**
   * Undoes the last tile rotation.
   */
  function undoLastMove() {
    if (state.isSolved || state.history.length === 0) return;

    const last = state.history.pop();
    const tile = state.grid[last.r][last.c];
    if (tile) {
      tile.rotation = last.prevRotation;
      state.movesUsed = Math.max(0, state.movesUsed - 1);
      Audio.playRotate();
      hideModals();
      state.isOverloaded = false;
      updateCircuit();
      updateHUD();
    }
  }

  /**
   * Victory handler: plays sounds, computes stars, updates progress, and shows win modal.
   */
  function handleLevelComplete() {
    stopTimer();
    Audio.playVictory();

    const stars = Engine.calculateStars(state.movesUsed, state.parMoves);
    saveProgress(state.currentLevelData.id, stars, state.movesUsed, state.elapsedSeconds);

    setTimeout(() => {
      showWinModal(stars);
    }, 450);
  }

  /**
   * Overload handler: triggers when move limit is reached.
   */
  function handleCircuitOverload() {
    state.isOverloaded = true;
    Audio.playError();
    if (overlayOverload) overlayOverload.classList.add('show');
  }

  // Floating Modals
  function hideModals() {
    [overlayWin, overlayOverload, overlayLevelSelect].forEach(el => {
      if (el) el.classList.remove('show');
    });
  }

  function showWinModal(stars) {
    if (!overlayWin) return;
    if (winTitle) winTitle.textContent = 'Circuit Completed!';
    if (winMovesVal) winMovesVal.textContent = state.movesUsed.toString();
    if (winParVal) winParVal.textContent = state.parMoves.toString();

    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    if (winTimeVal) winTimeVal.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (winStarsVal) {
      winStarsVal.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    }

    // Play star sounds sequentially
    for (let i = 0; i < stars; i++) {
      setTimeout(() => Audio.playStarChime(i), 200 + i * 220);
    }

    overlayWin.classList.add('show');
  }

  function showLevelSelectModal() {
    if (!overlayLevelSelect || !levelGridContainer) return;
    levelGridContainer.innerHTML = '';

    Engine.LEVELS.forEach((lvl, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'level-select-tile';

      const isUnlocked = Boolean(state.progress[lvl.id] && state.progress[lvl.id].unlocked);
      const starsEarned = state.progress[lvl.id] ? state.progress[lvl.id].stars || 0 : 0;

      if (!isUnlocked) {
        card.classList.add('locked');
        card.disabled = true;
        card.innerHTML = `
          <span class="lvl-num">${lvl.id}</span>
          <span class="lvl-lock">🔒</span>
        `;
      } else {
        if (idx === state.currentLevelIndex) card.classList.add('current');
        const starsStr = '★'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned);
        card.innerHTML = `
          <span class="lvl-num">${lvl.id}</span>
          <span class="lvl-name">${lvl.title}</span>
          <span class="lvl-stars">${starsEarned > 0 ? starsStr : ''}</span>
        `;
        card.addEventListener('click', () => {
          hideModals();
          loadLevel(idx);
        });
      }

      levelGridContainer.appendChild(card);
    });

    overlayLevelSelect.classList.add('show');
  }

  // Timer Management
  function startTimer() {
    stopTimer();
    timerIntervalId = setInterval(() => {
      if (!state.isSolved && !state.isPaused && !state.isOverloaded) {
        state.elapsedSeconds++;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  function updateTimerDisplay() {
    if (!timerDisplay) return;
    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateHUD() {
    if (levelTitleDisplay && state.currentLevelData) {
      levelTitleDisplay.textContent = `Lvl ${state.currentLevelData.id}: ${state.currentLevelData.title}`;
    }
    if (chapterDisplay && state.currentLevelData) {
      chapterDisplay.textContent = state.currentLevelData.chapter || 'Circuit Grid';
    }
    if (movesDisplay) {
      movesDisplay.textContent = `Moves: ${state.movesUsed} / ${state.moveLimit}`;
    }
    if (parDisplay) {
      parDisplay.textContent = `Par: ${state.parMoves}`;
    }
    if (targetsDisplay) {
      targetsDisplay.textContent = `Terminals: ${state.circuitResult.connectedTargets} / ${state.circuitResult.totalTargets}`;
    }
    updateTimerDisplay();
  }

  // =========================================================================
  // Canvas Rendering Loop & Procedural Circuit Graphics
  // =========================================================================

  function gameLoop(now) {
    const dt = Math.min(32, now - lastTime);
    lastTime = now;

    update(dt);
    render();

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function update(dt) {
    // Advance pulse animation for glowing wires
    state.pulsePhase = (state.pulsePhase + dt * 0.003) % (Math.PI * 2);

    // Smooth visual rotation transitions
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const t = state.grid[r][c];
        const targetAngle = t.rotation * (Math.PI / 2);
        let curr = state.visualRotations[t.id];
        if (curr === undefined) curr = targetAngle;

        // Smooth shortest path interpolation
        const diff = targetAngle - curr;
        if (Math.abs(diff) > 0.005) {
          curr += diff * 0.22;
        } else {
          curr = targetAngle;
        }
        state.visualRotations[t.id] = curr;
      }
    }
  }

  function render() {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Deep Cyber Circuit Board Background
    drawPCBBackground(width, height);

    // Calculate Grid Layout
    const padding = 28;
    const boardAreaWidth = width - padding * 2;
    const boardAreaHeight = height - padding * 2;
    const cellSize = Math.floor(Math.min(boardAreaWidth / state.cols, boardAreaHeight / state.rows));

    const totalGridWidth = cellSize * state.cols;
    const totalGridHeight = cellSize * state.rows;
    const startX = Math.floor((width - totalGridWidth) / 2);
    const startY = Math.floor((height - totalGridHeight) / 2);

    // 2. Draw Board Grid & Tiles
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const tile = state.grid[r][c];
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        const isSelected = (state.cursor.r === r && state.cursor.c === c);

        drawTile(tile, x, y, cellSize, isSelected);
      }
    }

    // 3. Victory Circuit Glow Overlay
    if (state.isSolved) {
      ctx.save();
      ctx.strokeStyle = 'rgba(213, 255, 85, 0.4)';
      ctx.lineWidth = 4;
      ctx.strokeRect(startX - 6, startY - 6, totalGridWidth + 12, totalGridHeight + 12);
      ctx.restore();
    }
  }

  /**
   * Draws PCB blueprint surface with subtle microchip traces.
   */
  function drawPCBBackground(width, height) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0d1117');
    grad.addColorStop(1, '#080a0e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid dots
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    const dotSpacing = 24;
    for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
      for (let y = dotSpacing / 2; y < height; y += dotSpacing) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }
  }

  /**
   * Renders an individual circuit tile, its wires, solder points, and glow.
   */
  function drawTile(tile, x, y, size, isSelected) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const angle = state.visualRotations[tile.id] || 0;
    const isEnergized = state.circuitResult.energizedTiles.has(`${tile.r},${tile.c}`);

    ctx.save();

    // Tile Box Base
    ctx.fillStyle = '#141820';
    ctx.strokeStyle = '#222938';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, size - 4, size - 4, 8);
    ctx.fill();
    ctx.stroke();

    // Selection highlight for keyboard navigation
    if (isSelected && !tile.fixed) {
      ctx.strokeStyle = '#d5ff55';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#d5ff55';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    if (tile.type === Engine.TRACK_TYPES.EMPTY) {
      ctx.restore();
      return;
    }

    // Apply rotation for wire and component rendering
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const half = size / 2;
    const wireWidth = Math.max(6, Math.floor(size * 0.16));
    const activeColor = tile.color || Engine.CIRCUIT_COLORS.CYAN;
    const wireColor = isEnergized ? activeColor : '#334155';

    // Bridge Overpass Rendering
    if (tile.type === Engine.TRACK_TYPES.BRIDGE) {
      // 1. Bottom Wire: East-West ([-half, 0] to [half, 0])
      ctx.save();
      ctx.strokeStyle = isEnergized ? Engine.CIRCUIT_COLORS.AMBER : '#334155';
      ctx.lineWidth = wireWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
      ctx.stroke();
      ctx.restore();

      // 2. Insulating Bridge Riser Block with Shadow
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(-wireWidth * 0.9, -wireWidth * 0.9, wireWidth * 1.8, wireWidth * 1.8, 4);
      ctx.fill();
      ctx.restore();

      // 3. Top Wire: North-South ([0, -half] to [0, half]) crossing over
      ctx.save();
      ctx.strokeStyle = isEnergized ? activeColor : '#475569';
      ctx.lineWidth = wireWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(0, half);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
      return;
    }

    // Standard Wire Paths
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = wireWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEnergized) {
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 12;
    }

    ctx.beginPath();

    switch (tile.type) {
      case Engine.TRACK_TYPES.LINE:
        // North to South
        ctx.moveTo(0, -half);
        ctx.lineTo(0, half);
        break;

      case Engine.TRACK_TYPES.CORNER:
        // North to East smooth curve
        ctx.moveTo(0, -half);
        ctx.quadraticCurveTo(0, 0, half, 0);
        break;

      case Engine.TRACK_TYPES.T_JUNCTION:
        // West to East line + North branch
        ctx.moveTo(-half, 0);
        ctx.lineTo(half, 0);
        ctx.moveTo(0, -half);
        ctx.lineTo(0, 0);
        break;

      case Engine.TRACK_TYPES.CROSS:
        // North-South and East-West
        ctx.moveTo(0, -half);
        ctx.lineTo(0, half);
        ctx.moveTo(-half, 0);
        ctx.lineTo(half, 0);
        break;

      case Engine.TRACK_TYPES.TERMINAL:
        // Port North to center terminal
        ctx.moveTo(0, -half);
        ctx.lineTo(0, 0);
        break;
    }
    ctx.stroke();

    // Draw Terminal Node (Circle port at center)
    if (tile.type === Engine.TRACK_TYPES.TERMINAL) {
      const nodeRadius = Math.max(8, Math.floor(size * 0.22));
      ctx.beginPath();
      ctx.arc(0, 0, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = tile.color;
      ctx.fill();

      // Glow pulse ring
      if (isEnergized || tile.isSource) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        const pulseR = nodeRadius + 3 + Math.sin(state.pulsePhase * 3) * 3;
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = tile.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Terminal Icon / Center Marker
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, nodeRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Energized Electric Core highlight line
    if (isEnergized && tile.type !== Engine.TRACK_TYPES.TERMINAL) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.8, wireWidth * 0.3);
      ctx.shadowBlur = 0;
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // User Input Bindings & Touch Accessibility
  // =========================================================================

  // Click & Tap on Board
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = clientX * scaleX;
    const y = clientY * scaleY;

    const padding = 28;
    const boardAreaWidth = canvas.width - padding * 2;
    const boardAreaHeight = canvas.height - padding * 2;
    const cellSize = Math.floor(Math.min(boardAreaWidth / state.cols, boardAreaHeight / state.rows));

    const totalGridWidth = cellSize * state.cols;
    const totalGridHeight = cellSize * state.rows;
    const startX = Math.floor((canvas.width - totalGridWidth) / 2);
    const startY = Math.floor((canvas.height - totalGridHeight) / 2);

    const c = Math.floor((x - startX) / cellSize);
    const r = Math.floor((y - startY) / cellSize);

    if (r >= 0 && r < state.rows && c >= 0 && c < state.cols) {
      state.cursor = { r, c };
      // Right click or Shift-click rotates counter-clockwise
      const delta = (e.button === 2 || e.shiftKey) ? -1 : 1;
      onTileRotate(r, c, delta);
    }
  });

  // Prevent context menu on right click inside canvas
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Global Keyboard Controls
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        state.cursor.r = (state.cursor.r - 1 + state.rows) % state.rows;
        break;

      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        state.cursor.r = (state.cursor.r + 1) % state.rows;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        state.cursor.c = (state.cursor.c - 1 + state.cols) % state.cols;
        break;

      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        state.cursor.c = (state.cursor.c + 1) % state.cols;
        break;

      case 'Space':
      case 'Enter':
        e.preventDefault();
        onTileRotate(state.cursor.r, state.cursor.c, e.shiftKey ? -1 : 1);
        break;

      case 'KeyQ':
      case 'KeyZ':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey || e.code === 'KeyU') {
          undoLastMove();
        } else {
          onTileRotate(state.cursor.r, state.cursor.c, -1);
        }
        break;

      case 'KeyU':
        e.preventDefault();
        undoLastMove();
        break;

      case 'KeyR':
        e.preventDefault();
        loadLevel(state.currentLevelIndex);
        break;

      case 'KeyP':
        e.preventDefault();
        togglePause();
        break;

      case 'KeyM':
        e.preventDefault();
        handleAudioToggle();
        break;
    }
  });

  // Controls UI Action Buttons
  if (undoBtn) undoBtn.addEventListener('click', undoLastMove);
  if (restartBtn) restartBtn.addEventListener('click', () => loadLevel(state.currentLevelIndex));

  function togglePause() {
    state.isPaused = !state.isPaused;
    if (pauseBtn) pauseBtn.textContent = state.isPaused ? '▶' : '⏸';
  }
  if (pauseBtn) pauseBtn.addEventListener('click', togglePause);

  function handleAudioToggle() {
    const isMuted = Audio.toggleMute();
    if (audioIcon) audioIcon.textContent = isMuted ? '🔇' : '🔊';
  }
  if (audioToggleBtn) audioToggleBtn.addEventListener('click', handleAudioToggle);
  if (audioIcon) audioIcon.textContent = Audio.getMuteState() ? '🔇' : '🔊';

  // Modal Buttons
  if (levelSelectBtn) levelSelectBtn.addEventListener('click', showLevelSelectModal);
  if (closeLevelSelectBtn) closeLevelSelectBtn.addEventListener('click', hideModals);

  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', () => {
      hideModals();
      loadLevel(state.currentLevelIndex + 1);
    });
  }
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      hideModals();
      loadLevel(state.currentLevelIndex);
    });
  }

  if (overloadRestartBtn) {
    overloadRestartBtn.addEventListener('click', () => {
      hideModals();
      loadLevel(state.currentLevelIndex);
    });
  }
  if (overloadUndoBtn) {
    overloadUndoBtn.addEventListener('click', () => {
      hideModals();
      undoLastMove();
    });
  }

  // Initial Level Load
  loadLevel(0);
  animFrameId = requestAnimationFrame(gameLoop);

})();
