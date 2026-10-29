/**
 * Stack Rush — Interactive 3D Canvas Controller
 * Manages 3D isometric axonometric rendering, platform rotation mechanics,
 * drag swipe touch input, next block preview, layer blast particles, and gem unlocks.
 */
(function() {
  'use strict';

  // DOM Elements cache
  const dom = {};

  // Game State
  const state = {
    mode: 'classic', // 'classic' | 'challenge' | 'blitz'
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'cleared' | 'gameover'
    tower: [],
    score: 0,
    moves: 0,
    layersCleared: 0,
    comboStreak: 0,
    gems: 0,
    timer: 0,
    timerInterval: null,
    targetLayers: 5, // For challenge mode
    blitzDuration: 60,

    // Platform rotation (in radians)
    platformAngle: 0,
    targetAngle: 0,

    // Active block in chute
    currentShape: null,
    nextShape: null,
    blockX: 1, // centered on 3x3 platform
    blockZ: 1,
    blockStepRotation: 0, // 0, 1, 2, 3 (90 deg steps)
    dropY: 0,

    // Touch / Mouse drag tracking
    isDraggingPlatform: false,
    dragStartX: 0,
    dragStartAngle: 0,

    // Active visual theme
    themeKey: 'cyber',
    unlockedThemes: ['cyber'],

    // Particle explosions for layer clears
    particles: [],

    // Best scores
    bestScores: {
      classic: 0,
      challenge: 0,
      blitz: 0
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    cacheDom();
    loadPersistedData();
    bindEvents();
    setupCanvas();
    switchMode('classic');

    // Start 60fps render loop
    requestAnimationFrame(gameLoop);
  }

  function cacheDom() {
    dom.stageCard = document.getElementById('stack-stage-card');
    dom.canvas = document.getElementById('stack-canvas');
    dom.ctx = dom.canvas?.getContext('2d');

    dom.nextCanvas = document.getElementById('next-canvas');
    dom.nextCtx = dom.nextCanvas?.getContext('2d');

    dom.scoreDisplay = document.getElementById('score-display');
    dom.layersDisplay = document.getElementById('layers-display');
    dom.movesDisplay = document.getElementById('moves-display');
    dom.timerDisplay = document.getElementById('timer-display');
    dom.gemsDisplay = document.getElementById('gems-display');
    dom.comboDisplay = document.getElementById('combo-display');
    dom.bestDisplay = document.getElementById('best-display');

    dom.modeClassicBtn = document.getElementById('mode-classic-btn');
    dom.modeChallengeBtn = document.getElementById('mode-challenge-btn');
    dom.modeBlitzBtn = document.getElementById('mode-blitz-btn');

    dom.themeSelect = document.getElementById('theme-select');
    dom.audioToggleBtn = document.getElementById('audio-toggle-btn');
    dom.audioIcon = document.getElementById('audio-icon');
    dom.pauseBtn = document.getElementById('pause-btn');

    dom.btnRotLeft = document.getElementById('btn-rot-left');
    dom.btnRotRight = document.getElementById('btn-rot-right');
    dom.btnDrop = document.getElementById('btn-drop');

    dom.overlayStart = document.getElementById('overlay-start');
    dom.overlayPause = document.getElementById('overlay-pause');
    dom.overlayWin = document.getElementById('overlay-win');
    dom.overlayGameOver = document.getElementById('overlay-gameover');

    dom.startBtn = document.getElementById('start-btn');
    dom.resumeBtn = document.getElementById('resume-btn');
    dom.restartBtn = document.getElementById('restart-btn');
    dom.playAgainBtn = document.getElementById('play-again-btn');
    dom.tryAgainBtn = document.getElementById('try-again-btn');

    dom.winTitle = document.getElementById('win-title');
    dom.winScoreVal = document.getElementById('win-score-val');
    dom.winMovesVal = document.getElementById('win-moves-val');
    dom.winLayersVal = document.getElementById('win-layers-val');
    dom.winGemsVal = document.getElementById('win-gems-val');
    dom.winStarsVal = document.getElementById('win-stars-val');
    dom.winSummary = document.getElementById('win-summary');

    dom.goScoreVal = document.getElementById('go-score-val');
    dom.goMovesVal = document.getElementById('go-moves-val');
    dom.goLayersVal = document.getElementById('go-layers-val');
    dom.goGemsVal = document.getElementById('go-gems-val');

    dom.srAnnouncer = document.getElementById('sr-announcer');
  }

  function loadPersistedData() {
    try {
      state.bestScores.classic = parseInt(localStorage.getItem('arcade_stackrush_best_classic') || '0', 10);
      state.bestScores.challenge = parseInt(localStorage.getItem('arcade_stackrush_best_challenge') || '0', 10);
      state.bestScores.blitz = parseInt(localStorage.getItem('arcade_stackrush_best_blitz') || '0', 10);
      state.gems = parseInt(localStorage.getItem('arcade_stackrush_gems') || '0', 10);

      const savedUnlocked = localStorage.getItem('arcade_stackrush_unlocked_themes');
      if (savedUnlocked) {
        state.unlockedThemes = JSON.parse(savedUnlocked);
      }

      const savedTheme = localStorage.getItem('arcade_stackrush_active_theme');
      if (savedTheme && window.StackEngine?.THEMES[savedTheme]) {
        state.themeKey = savedTheme;
      }
    } catch (e) {}

    updateBestDisplay();
    updateThemeSelector();
  }

  function savePersistedData() {
    try {
      if (state.score > (state.bestScores[state.mode] || 0)) {
        state.bestScores[state.mode] = state.score;
        localStorage.setItem(`arcade_stackrush_best_${state.mode}`, state.score.toString());
      }
      localStorage.setItem('arcade_stackrush_gems', state.gems.toString());
      localStorage.setItem('arcade_stackrush_unlocked_themes', JSON.stringify(state.unlockedThemes));
      localStorage.setItem('arcade_stackrush_active_theme', state.themeKey);
    } catch (e) {}

    updateBestDisplay();
  }

  function updateBestDisplay() {
    if (!dom.bestDisplay) return;
    const best = state.bestScores[state.mode] || 0;
    dom.bestDisplay.textContent = best > 0 ? `${best} pts` : '—';
    if (dom.gemsDisplay) dom.gemsDisplay.textContent = `💎 ${state.gems}`;
  }

  function updateThemeSelector() {
    if (!dom.themeSelect) return;
    const Engine = window.StackEngine;
    if (!Engine) return;

    dom.themeSelect.innerHTML = '';
    Object.keys(Engine.THEMES).forEach(key => {
      const t = Engine.THEMES[key];
      const opt = document.createElement('option');
      opt.value = key;
      const isUnlocked = state.unlockedThemes.includes(key);
      opt.textContent = isUnlocked ? t.name : `${t.name} (💎 ${t.cost})`;
      if (key === state.themeKey) opt.selected = true;
      dom.themeSelect.appendChild(opt);
    });
  }

  function setupCanvas() {
    if (!dom.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = dom.canvas.getBoundingClientRect();

    dom.canvas.width = Math.floor(rect.width * dpr);
    dom.canvas.height = Math.floor(rect.height * dpr);

    if (dom.nextCanvas) {
      const nextRect = dom.nextCanvas.getBoundingClientRect();
      dom.nextCanvas.width = Math.floor(nextRect.width * dpr);
      dom.nextCanvas.height = Math.floor(nextRect.height * dpr);
    }
  }

  function bindEvents() {
    window.addEventListener('resize', setupCanvas);

    // Mode buttons
    if (dom.modeClassicBtn) dom.modeClassicBtn.addEventListener('click', () => switchMode('classic'));
    if (dom.modeChallengeBtn) dom.modeChallengeBtn.addEventListener('click', () => switchMode('challenge'));
    if (dom.modeBlitzBtn) dom.modeBlitzBtn.addEventListener('click', () => switchMode('blitz'));

    // Audio & Pause
    if (dom.audioToggleBtn) dom.audioToggleBtn.addEventListener('click', handleAudioToggle);
    if (dom.pauseBtn) dom.pauseBtn.addEventListener('click', togglePause);

    // Platform rotation touch / mouse gestures
    if (dom.canvas) {
      dom.canvas.addEventListener('pointerdown', onCanvasPointerDown);
      window.addEventListener('pointermove', onWindowPointerMove);
      window.addEventListener('pointerup', onWindowPointerUp);
    }

    // Direct UI control buttons
    if (dom.btnRotLeft) dom.btnRotLeft.addEventListener('click', () => rotatePlatform(-Math.PI / 2));
    if (dom.btnRotRight) dom.btnRotRight.addEventListener('click', () => rotatePlatform(Math.PI / 2));
    if (dom.btnDrop) dom.btnDrop.addEventListener('click', dropActiveBlock);

    // Theme selector
    if (dom.themeSelect) dom.themeSelect.addEventListener('change', handleThemeChange);

    // Overlay buttons
    if (dom.startBtn) dom.startBtn.addEventListener('click', startGame);
    if (dom.resumeBtn) dom.resumeBtn.addEventListener('click', resumeGame);
    if (dom.restartBtn) dom.restartBtn.addEventListener('click', restartGame);
    if (dom.playAgainBtn) dom.playAgainBtn.addEventListener('click', restartGame);
    if (dom.tryAgainBtn) dom.tryAgainBtn.addEventListener('click', restartGame);

    // Keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    updateAudioIcon();
  }

  function switchMode(newMode) {
    if (state.status === 'playing') {
      stopTimer();
    }
    state.mode = newMode;

    [dom.modeClassicBtn, dom.modeChallengeBtn, dom.modeBlitzBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    if (newMode === 'classic' && dom.modeClassicBtn) {
      dom.modeClassicBtn.classList.add('active');
      dom.modeClassicBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'challenge' && dom.modeChallengeBtn) {
      dom.modeChallengeBtn.classList.add('active');
      dom.modeChallengeBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'blitz' && dom.modeBlitzBtn) {
      dom.modeBlitzBtn.classList.add('active');
      dom.modeBlitzBtn.setAttribute('aria-selected', 'true');
    }

    updateBestDisplay();
    prepareBoard();
  }

  function prepareBoard() {
    stopTimer();
    const Engine = window.StackEngine;

    state.tower = Engine ? Engine.createEmptyTower() : [];
    state.status = 'ready';
    state.score = 0;
    state.moves = 0;
    state.layersCleared = 0;
    state.comboStreak = 0;
    state.platformAngle = 0;
    state.targetAngle = 0;
    state.particles = [];

    if (state.mode === 'blitz') {
      state.timer = state.blitzDuration;
    } else {
      state.timer = 0;
    }

    // Deal initial pieces
    state.currentShape = Engine ? Engine.rollShape() : null;
    state.nextShape = Engine ? Engine.rollShape() : null;
    resetActiveBlockPosition();

    updateHUD();
    renderNextPiecePreview();
    showStartOverlay();
  }

  function resetActiveBlockPosition() {
    state.blockX = 0;
    state.blockZ = 0;
    state.blockStepRotation = 0;
    updateGhostDrop();
  }

  function updateGhostDrop() {
    const Engine = window.StackEngine;
    if (!Engine || !state.currentShape) return;

    const rotatedBlocks = Engine.normalizeBlocks(Engine.rotateBlocks(state.currentShape.blocks, state.blockStepRotation));
    state.dropY = Engine.getDropY(state.tower, rotatedBlocks, state.blockX, state.blockZ);
  }

  function onCanvasPointerDown(e) {
    if (state.status !== 'playing' && state.status !== 'ready') return;
    state.isDraggingPlatform = true;
    state.dragStartX = e.clientX;
    state.dragStartAngle = state.platformAngle;
  }

  function onWindowPointerMove(e) {
    if (!state.isDraggingPlatform) return;
    const deltaX = e.clientX - state.dragStartX;
    // Map horizontal pixel swipe to smooth platform rotation
    state.targetAngle = state.dragStartAngle + (deltaX * 0.012);
  }

  function onWindowPointerUp(e) {
    if (!state.isDraggingPlatform) return;
    state.isDraggingPlatform = false;

    // Optional snap to nearest 45 or 90 degrees
    const nearestQuad = Math.round(state.targetAngle / (Math.PI / 2)) * (Math.PI / 2);
    state.targetAngle = nearestQuad;

    if (window.StackAudio) window.StackAudio.playRotate();
  }

  function rotatePlatform(angleDelta) {
    state.targetAngle += angleDelta;
    if (window.StackAudio) window.StackAudio.playRotate();
  }

  function dropActiveBlock() {
    if (state.status !== 'playing') return;
    const Engine = window.StackEngine;
    if (!Engine || !state.currentShape) return;

    const rotatedBlocks = Engine.normalizeBlocks(Engine.rotateBlocks(state.currentShape.blocks, state.blockStepRotation));
    const landingY = Engine.getDropY(state.tower, rotatedBlocks, state.blockX, state.blockZ);

    if (landingY === -1) {
      // Tower topped out! Game Over
      endGame(false);
      return;
    }

    // Lock block into tower
    const lockRes = Engine.lockShape(state.tower, rotatedBlocks, state.blockX, landingY, state.blockZ, state.currentShape.color);
    state.tower = lockRes.newTower;
    state.moves++;

    if (window.StackAudio) window.StackAudio.playDrop();

    // Check completed horizontal layers
    const fullLayers = Engine.checkCompletedLayers(state.tower);
    const layersCount = fullLayers.length;

    if (layersCount > 0) {
      state.comboStreak++;
      state.layersCleared += layersCount;

      // Spawn 3D particle blast for clearing layers
      spawnLayerClearParticles(fullLayers);

      const clearRes = Engine.clearCompletedLayers(state.tower, fullLayers);
      state.tower = clearRes.newTower;

      const scored = Engine.calculateScoreAndGems(lockRes.lockedCount, layersCount, state.comboStreak);
      state.score += scored.score;
      state.gems += scored.gems;

      if (window.StackAudio) {
        window.StackAudio.playLayerClear(layersCount);
        window.StackAudio.playGem();
      }

      if (state.mode === 'blitz') {
        state.timer = Math.min(state.blitzDuration, state.timer + (layersCount * 4));
      }

      savePersistedData();
    } else {
      state.comboStreak = 0;
      const scored = Engine.calculateScoreAndGems(lockRes.lockedCount, 0, 0);
      state.score += scored.score;
      state.gems += scored.gems;
    }

    // Advance next piece
    state.currentShape = state.nextShape;
    state.nextShape = Engine.rollShape();
    resetActiveBlockPosition();

    updateHUD();
    renderNextPiecePreview();

    // Challenge Mode Win Condition
    if (state.mode === 'challenge' && state.layersCleared >= state.targetLayers) {
      endGame(true);
      return;
    }

    // Check if new piece can fit at top
    updateGhostDrop();
    if (state.dropY === -1) {
      endGame(false);
    }
  }

  function spawnLayerClearParticles(layers) {
    const Engine = window.StackEngine;
    if (!Engine || !dom.canvas) return;

    layers.forEach(layerY => {
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          const pt = Engine.projectIso(x, layerY, z, state.platformAngle, dom.canvas.width / 2, dom.canvas.height * 0.72);
          for (let p = 0; p < 4; p++) {
            state.particles.push({
              x: pt.screenX,
              y: pt.screenY,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 1.2) * 6,
              color: '#ffd166',
              size: Math.random() * 4 + 2,
              life: 1.0
            });
          }
        }
      }
    });

    triggerScreenShake();
  }

  function triggerScreenShake() {
    if (dom.stageCard) {
      dom.stageCard.classList.add('shake-active');
      setTimeout(() => dom.stageCard.classList.remove('shake-active'), 250);
    }
  }

  function handleThemeChange() {
    const key = dom.themeSelect?.value;
    const Engine = window.StackEngine;
    const theme = Engine?.THEMES[key];
    if (!theme) return;

    if (!state.unlockedThemes.includes(key)) {
      if (state.gems >= theme.cost) {
        state.gems -= theme.cost;
        state.unlockedThemes.push(key);
        state.themeKey = key;
        savePersistedData();
        updateThemeSelector();
        if (window.StackAudio) window.StackAudio.playGem();
      } else {
        alert(`Need ${theme.cost} gems to unlock this theme! You have ${state.gems} gems.`);
        dom.themeSelect.value = state.themeKey;
      }
    } else {
      state.themeKey = key;
      savePersistedData();
    }
  }

  function startGame() {
    hideOverlays();
    state.status = 'playing';
    startTimer();
    updateHUD();
    announceSR('Stack Rush match started! Rotate the platform and drop blocks.');
  }

  function startTimer() {
    stopTimer();
    state.timerInterval = setInterval(() => {
      if (state.status !== 'playing') return;

      if (state.mode === 'blitz') {
        state.timer--;
        if (state.timer <= 0) {
          state.timer = 0;
          updateHUD();
          endGame(false);
          return;
        }
      } else {
        state.timer++;
      }
      updateHUD();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  function updateHUD() {
    if (dom.scoreDisplay) dom.scoreDisplay.textContent = `Score: ${state.score}`;
    if (dom.movesDisplay) dom.movesDisplay.textContent = `Blocks: ${state.moves}`;
    if (dom.gemsDisplay) dom.gemsDisplay.textContent = `💎 ${state.gems}`;

    if (dom.layersDisplay) {
      if (state.mode === 'challenge') {
        dom.layersDisplay.textContent = `Layers: ${state.layersCleared} / ${state.targetLayers}`;
      } else {
        dom.layersDisplay.textContent = `Layers: ${state.layersCleared}`;
      }
    }

    if (dom.timerDisplay) {
      const mins = Math.floor(state.timer / 60);
      const secs = state.timer % 60;
      dom.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    if (dom.comboDisplay) {
      if (state.comboStreak > 1) {
        dom.comboDisplay.textContent = `⚡ ${state.comboStreak}x Combo`;
        dom.comboDisplay.className = 'hud-pill highlight-gold';
      } else {
        dom.comboDisplay.textContent = 'Streak: 0';
        dom.comboDisplay.className = 'hud-pill';
      }
    }
  }

  function endGame(isVictory = false) {
    stopTimer();
    savePersistedData();

    if (isVictory) {
      state.status = 'cleared';
      if (window.StackAudio) window.StackAudio.playWin();

      if (dom.winTitle) dom.winTitle.textContent = 'Tower Master Cleared!';
      if (dom.winScoreVal) dom.winScoreVal.textContent = state.score.toString();
      if (dom.winMovesVal) dom.winMovesVal.textContent = state.moves.toString();
      if (dom.winLayersVal) dom.winLayersVal.textContent = state.layersCleared.toString();
      if (dom.winGemsVal) dom.winGemsVal.textContent = state.gems.toString();
      if (dom.winStarsVal) dom.winStarsVal.textContent = '★★★';
      if (dom.winSummary) dom.winSummary.textContent = `Spectacular 3D stacking! Cleared ${state.layersCleared} layers in ${state.moves} blocks!`;

      showOverlay(dom.overlayWin);
      announceSR(`Victory! Tower challenge completed in ${state.moves} moves.`);
    } else {
      state.status = 'gameover';
      if (window.StackAudio) window.StackAudio.playGameOver();

      if (dom.goScoreVal) dom.goScoreVal.textContent = state.score.toString();
      if (dom.goMovesVal) dom.goMovesVal.textContent = state.moves.toString();
      if (dom.goLayersVal) dom.goLayersVal.textContent = state.layersCleared.toString();
      if (dom.goGemsVal) dom.goGemsVal.textContent = state.gems.toString();

      showOverlay(dom.overlayGameOver);
      announceSR(`Game Over! Final score: ${state.score} with ${state.layersCleared} layers cleared.`);
    }
  }

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();

    if (key === 'p') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (key === 'r') {
      e.preventDefault();
      restartGame();
      return;
    }
    if (key === 'm') {
      e.preventDefault();
      handleAudioToggle();
      return;
    }

    if (state.status !== 'playing') {
      if (key === ' ' || key === 'enter') {
        if (state.status === 'ready') {
          e.preventDefault();
          startGame();
        }
      }
      return;
    }

    // Platform rotation keys: Left / Right or A / D
    if (key === 'arrowleft' || key === 'a') {
      e.preventDefault();
      rotatePlatform(-Math.PI / 4);
      return;
    }
    if (key === 'arrowright' || key === 'd') {
      e.preventDefault();
      rotatePlatform(Math.PI / 4);
      return;
    }

    // Rotate active falling block locally: Up or W
    if (key === 'arrowup' || key === 'w') {
      e.preventDefault();
      state.blockStepRotation = (state.blockStepRotation + 1) % 4;
      updateGhostDrop();
      if (window.StackAudio) window.StackAudio.playRotate();
      return;
    }

    // Drop block: Space or Down or Enter
    if (key === ' ' || key === 'arrowdown' || key === 's' || key === 'enter') {
      e.preventDefault();
      dropActiveBlock();
    }
  }

  function togglePause() {
    if (state.status === 'playing') {
      state.status = 'paused';
      stopTimer();
      showOverlay(dom.overlayPause);
      announceSR('Game paused. Press P to resume.');
    } else if (state.status === 'paused') {
      resumeGame();
    }
  }

  function resumeGame() {
    if (state.status !== 'paused') return;
    hideOverlays();
    state.status = 'playing';
    startTimer();
    announceSR('Game resumed.');
  }

  function restartGame() {
    prepareBoard();
    startGame();
  }

  function handleAudioToggle() {
    if (window.StackAudio) {
      window.StackAudio.toggleMute();
      updateAudioIcon();
    }
  }

  function updateAudioIcon() {
    if (!dom.audioIcon) return;
    const isMuted = window.StackAudio ? window.StackAudio.isMuted() : false;
    dom.audioIcon.textContent = isMuted ? '🔇' : '🔊';
  }

  function showStartOverlay() {
    hideOverlays();
    if (dom.overlayStart) {
      dom.overlayStart.classList.add('show');
    }
  }

  function showOverlay(overlay) {
    hideOverlays();
    if (overlay) overlay.classList.add('show');
  }

  function hideOverlays() {
    [dom.overlayStart, dom.overlayPause, dom.overlayWin, dom.overlayGameOver].forEach(o => {
      if (o) o.classList.remove('show');
    });
  }

  function announceSR(msg) {
    if (dom.srAnnouncer) {
      dom.srAnnouncer.textContent = msg;
    }
  }

  /**
   * Main 60 FPS Canvas Render Loop
   */
  function gameLoop() {
    // Smooth platform rotation damping
    state.platformAngle += (state.targetAngle - state.platformAngle) * 0.15;

    renderMainCanvas();
    renderParticles();

    requestAnimationFrame(gameLoop);
  }

  function renderMainCanvas() {
    const ctx = dom.ctx;
    const canvas = dom.canvas;
    const Engine = window.StackEngine;
    if (!ctx || !canvas || !Engine) return;

    const theme = Engine.THEMES[state.themeKey] || Engine.THEMES.cyber;

    // Clear background
    ctx.fillStyle = theme.bgBase;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const originX = canvas.width / 2;
    const originY = canvas.height * 0.74;
    const tileSize = Math.min(canvas.width, canvas.height) * 0.13;
    const layerHeight = tileSize * 0.62;

    // 1. Draw 3D Platform Pedestal Base
    drawPlatformPedestal(ctx, originX, originY, tileSize, theme);

    // 2. Collect all voxels in the scene for painter's depth sorting
    const voxels = [];

    // Tower placed voxels
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          const color = state.tower[y]?.[x]?.[z];
          if (color) {
            const pt = Engine.projectIso(x, y, z, state.platformAngle, originX, originY, tileSize, layerHeight);
            voxels.push({
              x, y, z,
              screenX: pt.screenX,
              screenY: pt.screenY,
              depth: pt.depth,
              color: color,
              isGhost: false
            });
          }
        }
      }
    }

    // Ghost landing voxels
    if (state.status === 'playing' && state.currentShape && state.dropY !== -1) {
      const rotatedBlocks = Engine.normalizeBlocks(Engine.rotateBlocks(state.currentShape.blocks, state.blockStepRotation));
      rotatedBlocks.forEach(b => {
        const x = state.blockX + b.x;
        const y = state.dropY + b.y;
        const z = state.blockZ + b.z;
        const pt = Engine.projectIso(x, y, z, state.platformAngle, originX, originY, tileSize, layerHeight);
        voxels.push({
          x, y, z,
          screenX: pt.screenX,
          screenY: pt.screenY,
          depth: pt.depth,
          color: state.currentShape.color,
          isGhost: true
        });
      });
    }

    // Active falling block in top chute
    if (state.status === 'playing' && state.currentShape) {
      const topChuteY = 9.8;
      const rotatedBlocks = Engine.normalizeBlocks(Engine.rotateBlocks(state.currentShape.blocks, state.blockStepRotation));
      rotatedBlocks.forEach(b => {
        const x = state.blockX + b.x;
        const y = topChuteY + b.y;
        const z = state.blockZ + b.z;
        const pt = Engine.projectIso(x, y, z, state.platformAngle, originX, originY, tileSize, layerHeight);
        voxels.push({
          x, y, z,
          screenX: pt.screenX,
          screenY: pt.screenY,
          depth: pt.depth,
          color: state.currentShape.color,
          isGhost: false,
          isActiveChute: true
        });
      });
    }

    // Sort voxels back-to-front by depth (lowest depth drawn first)
    voxels.sort((a, b) => a.depth - b.depth);

    // Draw each 3D cube
    voxels.forEach(v => {
      drawIsoCube(ctx, v.screenX, v.screenY, tileSize, layerHeight, v.color, v.isGhost, v.isActiveChute);
    });

    // 3. Draw Height Limit Warning Line at Top
    drawCeilingLimit(ctx, originX, originY, tileSize, layerHeight);
  }

  function drawPlatformPedestal(ctx, originX, originY, tileSize, theme) {
    const Engine = window.StackEngine;
    // Base 4 corner points
    const p0 = Engine.projectIso(0, 0, 0, state.platformAngle, originX, originY, tileSize, 0);
    const p1 = Engine.projectIso(3, 0, 0, state.platformAngle, originX, originY, tileSize, 0);
    const p2 = Engine.projectIso(3, 0, 3, state.platformAngle, originX, originY, tileSize, 0);
    const p3 = Engine.projectIso(0, 0, 3, state.platformAngle, originX, originY, tileSize, 0);

    // Pedestal rim
    ctx.beginPath();
    ctx.moveTo(p0.screenX, p0.screenY);
    ctx.lineTo(p1.screenX, p1.screenY);
    ctx.lineTo(p2.screenX, p2.screenY);
    ctx.lineTo(p3.screenX, p3.screenY);
    ctx.closePath();

    ctx.fillStyle = theme.platform;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = theme.accent;
    ctx.stroke();

    // 3x3 Grid lines on pedestal
    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.gridLines;
    for (let i = 1; i < 3; i++) {
      const ga = Engine.projectIso(i, 0, 0, state.platformAngle, originX, originY, tileSize, 0);
      const gb = Engine.projectIso(i, 0, 3, state.platformAngle, originX, originY, tileSize, 0);
      ctx.beginPath();
      ctx.moveTo(ga.screenX, ga.screenY);
      ctx.lineTo(gb.screenX, gb.screenY);
      ctx.stroke();

      const gc = Engine.projectIso(0, 0, i, state.platformAngle, originX, originY, tileSize, 0);
      const gd = Engine.projectIso(3, 0, i, state.platformAngle, originX, originY, tileSize, 0);
      ctx.beginPath();
      ctx.moveTo(gc.screenX, gc.screenY);
      ctx.lineTo(gd.screenX, gd.screenY);
      ctx.stroke();
    }
  }

  function drawIsoCube(ctx, x, y, tileSize, layerHeight, color, isGhost = false, isActiveChute = false) {
    const hw = tileSize * 0.433; // half width
    const hh = tileSize * 0.25;  // half height of top rhombus
    const h = layerHeight * 0.88;

    ctx.save();
    if (isGhost) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
    } else if (isActiveChute) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }

    // Top Face (Rhombus)
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + hw, y - h - hh);
    ctx.lineTo(x, y - h - hh * 2);
    ctx.lineTo(x - hw, y - h - hh);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();

    if (!isGhost) {
      // Left Face
      ctx.beginPath();
      ctx.moveTo(x - hw, y - h - hh);
      ctx.lineTo(x, y - h);
      ctx.lineTo(x, y);
      ctx.lineTo(x - hw, y - hh);
      ctx.closePath();
      ctx.fillStyle = shadeColor(color, -25);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();

      // Right Face
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + hw, y - h - hh);
      ctx.lineTo(x + hw, y - hh);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fillStyle = shadeColor(color, -40);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCeilingLimit(ctx, originX, originY, tileSize, layerHeight) {
    const Engine = window.StackEngine;
    const topY = 9.2;
    const p0 = Engine.projectIso(0, topY, 0, state.platformAngle, originX, originY, tileSize, layerHeight);
    const p1 = Engine.projectIso(3, topY, 0, state.platformAngle, originX, originY, tileSize, layerHeight);
    const p2 = Engine.projectIso(3, topY, 3, state.platformAngle, originX, originY, tileSize, layerHeight);
    const p3 = Engine.projectIso(0, topY, 3, state.platformAngle, originX, originY, tileSize, layerHeight);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p0.screenX, p0.screenY);
    ctx.lineTo(p1.screenX, p1.screenY);
    ctx.lineTo(p2.screenX, p2.screenY);
    ctx.lineTo(p3.screenX, p3.screenY);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 71, 87, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();
  }

  function renderParticles() {
    const ctx = dom.ctx;
    if (!ctx || state.particles.length === 0) return;

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.life -= 0.025;

      if (p.life <= 0) {
        state.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    }
  }

  function renderNextPiecePreview() {
    const ctx = dom.nextCtx;
    const canvas = dom.nextCanvas;
    const Engine = window.StackEngine;
    if (!ctx || !canvas || !Engine || !state.nextShape) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2;
    const oy = canvas.height * 0.65;
    const size = canvas.width * 0.28;

    state.nextShape.blocks.forEach(b => {
      const pt = Engine.projectIso(b.x, 0, b.z, 0, ox, oy, size, size * 0.6);
      drawIsoCube(ctx, pt.screenX, pt.screenY, size, size * 0.6, state.nextShape.color);
    });
  }

  function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16) || 120;
    let G = parseInt(color.substring(3, 5), 16) || 120;
    let B = parseInt(color.substring(5, 7), 16) || 120;

    R = Math.min(255, Math.max(0, Math.floor(R * (100 + percent) / 100)));
    G = Math.min(255, Math.max(0, Math.floor(G * (100 + percent) / 100)));
    B = Math.min(255, Math.max(0, Math.floor(B * (100 + percent) / 100)));

    const RR = (R.toString(16).length === 1 ? '0' : '') + R.toString(16);
    const GG = (G.toString(16).length === 1 ? '0' : '') + G.toString(16);
    const BB = (B.toString(16).length === 1 ? '0' : '') + B.toString(16);

    return `#${RR}${GG}${BB}`;
  }

})();
