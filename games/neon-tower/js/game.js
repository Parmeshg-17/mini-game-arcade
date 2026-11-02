/**
 * Neon Tower — Main Canvas 2D Game Loop & UI Controller
 * High-DPI canvas rendering, smooth camera lerp, particle emitters, cyber starfield,
 * responsive touch/keyboard handling, sound synthesis integration, and record persistence.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'minigame_neontower_save_v1';
  const Engine = window.NeonTowerEngine;
  const Audio = window.NeonTowerAudio;

  if (!Engine) {
    console.error('NeonTowerEngine not loaded');
    return;
  }

  // --- DOM Elements ---
  const canvas = document.getElementById('neon-canvas');
  const ctx = canvas.getContext('2d');

  const floorCountEl = document.getElementById('floor-count');
  const scoreDisplayEl = document.getElementById('score-display');
  const comboDisplayEl = document.getElementById('combo-display');
  const comboBoxEl = document.getElementById('combo-box');
  const bestFloorEl = document.getElementById('best-floor');

  const btnSound = document.getElementById('btn-sound');
  const btnSoundText = document.getElementById('btn-sound-text');
  const btnRestart = document.getElementById('btn-restart');
  const btnPause = document.getElementById('btn-pause');

  const gameOverlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySubtitle = document.getElementById('overlay-subtitle');

  const modalGameOver = document.getElementById('modal-gameover');
  const modalFloorVal = document.getElementById('modal-floor-val');
  const modalScoreVal = document.getElementById('modal-score-val');
  const modalBestVal = document.getElementById('modal-best-val');
  const modalComboVal = document.getElementById('modal-combo-val');
  const modalRankVal = document.getElementById('modal-rank-val');
  const modalStarsVal = document.getElementById('modal-stars-val');
  const modalRestartBtn = document.getElementById('modal-restart-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // --- Saved Records ---
  let records = {
    bestFloor: 0,
    bestScore: 0,
    maxCombo: 0
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      records = Object.assign(records, JSON.parse(raw));
    }
  } catch (e) {}

  function saveRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {}
  }

  // --- Canvas Dimensions & High-DPI Scaling ---
  let dpr = 1;
  let scale = 1;
  let renderWidth = 500;
  let renderHeight = 800;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    renderWidth = rect.width || 500;
    renderHeight = rect.height || 800;

    canvas.width = Math.round(renderWidth * dpr);
    canvas.height = Math.round(renderHeight * dpr);

    // Compute uniform coordinate scale to map virtual 500x800 to canvas size
    scale = Math.min(renderWidth / Engine.CANVAS_WIDTH, renderHeight / Engine.CANVAS_HEIGHT);
  }

  window.addEventListener('resize', resizeCanvas);

  // --- Starfield & Background Ambient FX ---
  const stars = [];
  for (let i = 0; i < 48; i++) {
    stars.push({
      x: Math.random() * Engine.CANVAS_WIDTH,
      y: Math.random() * Engine.CANVAS_HEIGHT,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.6,
      speed: 15 + Math.random() * 35
    });
  }

  // --- Game State & Timing ---
  let state = null;
  let isPlaying = false;
  let isPaused = false;
  let lastTimestamp = 0;
  let screenShake = 0;

  function initGame() {
    state = Engine.createInitialState();
    isPlaying = false;
    isPaused = false;
    screenShake = 0;

    updateHUD();

    if (gameOverlay) {
      gameOverlay.classList.remove('hidden');
      if (overlayTitle) overlayTitle.textContent = 'NEON TOWER';
      if (overlaySubtitle) overlaySubtitle.textContent = 'TAP OR PRESS SPACE TO START';
    }

    if (modalGameOver) {
      modalGameOver.classList.add('hidden');
    }

    if (btnPause) {
      btnPause.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    }
  }

  function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    isPaused = false;
    if (gameOverlay) {
      gameOverlay.classList.add('hidden');
    }
  }

  function handleAction() {
    if (!isPlaying) {
      startGame();
      return;
    }
    if (isPaused || state.isGameOver) {
      return;
    }

    const res = Engine.dropBlock(state);

    if (res.outcome === 'miss') {
      screenShake = 18;
      if (Audio) Audio.playGameOver();
      onGameOver();
    } else if (res.outcome === 'perfect') {
      if (Audio) Audio.playDrop(true, res.combo);
      if (res.bonusExpansion && Audio) {
        setTimeout(() => Audio.playExpansion(), 120);
      }

      // Spawn spark bursts on both edges
      const b = res.placedBlock;
      Engine.spawnSliceSparks(state.particles, b.x, b.y, b.color, 16);
      Engine.spawnSliceSparks(state.particles, b.x + b.width, b.y, b.color, 16);

      // Add floating text
      const comboText = res.combo > 1 ? `PERFECT x${res.combo}!` : 'PERFECT!';
      state.floatingTexts.push({
        text: comboText,
        x: b.x + b.width / 2,
        y: b.y - 15,
        color: '#00f0ff',
        life: 0.9,
        maxLife: 0.9
      });

      if (res.bonusExpansion) {
        state.floatingTexts.push({
          text: '+WIDTH RESTORED!',
          x: b.x + b.width / 2,
          y: b.y - 40,
          color: '#39ff14',
          life: 1.1,
          maxLife: 1.1
        });
      }
    } else if (res.outcome === 'trim') {
      if (Audio) Audio.playDrop(false, 0);

      const d = res.cutDebris;
      if (d) {
        Engine.spawnSliceSparks(state.particles, d.x, d.y, d.color, 20);
      }

      const b = res.placedBlock;
      state.floatingTexts.push({
        text: '+50',
        x: b.x + b.width / 2,
        y: b.y - 12,
        color: '#ff99cc',
        life: 0.7,
        maxLife: 0.7
      });
    }

    updateHUD();
  }

  function onGameOver() {
    const isNewBest = state.floor > records.bestFloor;
    if (isNewBest) records.bestFloor = state.floor;
    if (state.score > records.bestScore) records.bestScore = state.score;
    if (state.maxCombo > records.maxCombo) records.maxCombo = state.maxCombo;
    saveRecords();

    const rating = Engine.evaluateRating(state.floor);

    setTimeout(() => {
      if (modalGameOver) {
        if (modalFloorVal) modalFloorVal.textContent = state.floor;
        if (modalScoreVal) modalScoreVal.textContent = state.score.toLocaleString();
        if (modalBestVal) modalBestVal.textContent = records.bestFloor;
        if (modalComboVal) modalComboVal.textContent = state.maxCombo;
        if (modalRankVal) modalRankVal.textContent = rating.rank;
        if (modalStarsVal) modalStarsVal.textContent = '★'.repeat(rating.stars) + '☆'.repeat(3 - rating.stars);

        modalGameOver.classList.remove('hidden');
      }
    }, 450);
  }

  function togglePause() {
    if (!isPlaying || state.isGameOver) return;
    isPaused = !isPaused;
    state.isPaused = isPaused;

    if (btnPause) {
      btnPause.innerHTML = isPaused
        ? `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    }

    if (gameOverlay) {
      if (isPaused) {
        gameOverlay.classList.remove('hidden');
        if (overlayTitle) overlayTitle.textContent = 'PAUSED';
        if (overlaySubtitle) overlaySubtitle.textContent = 'PRESS P OR CLICK TO RESUME';
      } else {
        gameOverlay.classList.add('hidden');
      }
    }
  }

  function updateHUD() {
    if (floorCountEl) floorCountEl.textContent = state.floor;
    if (scoreDisplayEl) scoreDisplayEl.textContent = state.score.toLocaleString();
    if (bestFloorEl) bestFloorEl.textContent = records.bestFloor;

    if (comboDisplayEl && comboBoxEl) {
      if (state.combo > 1) {
        comboDisplayEl.textContent = `x${state.combo}`;
        comboBoxEl.classList.add('active');
      } else {
        comboDisplayEl.textContent = '—';
        comboBoxEl.classList.remove('active');
      }
    }

    if (btnSoundText && Audio) {
      btnSoundText.textContent = Audio.isMuted() ? 'Muted' : 'Sound';
      if (btnSound) {
        btnSound.setAttribute('aria-pressed', Audio.isMuted() ? 'true' : 'false');
      }
    }
  }

  // --- Rendering Loop ---
  function drawScene() {
    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply viewport scale and center virtual canvas
    const offsetX = (renderWidth - Engine.CANVAS_WIDTH * scale) / 2;
    const offsetY = (renderHeight - Engine.CANVAS_HEIGHT * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Screen Shake effect
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Background Sky Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, Engine.CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#06080e');
    bgGrad.addColorStop(0.6, '#0b101c');
    bgGrad.addColorStop(1, '#111728');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, Engine.CANVAS_WIDTH, Engine.CANVAS_HEIGHT);

    // 2. Cyber Stars Ambient Drift
    for (const s of stars) {
      ctx.fillStyle = `rgba(180, 220, 255, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // 3. Cyber Wireframe Perspective Grid (bottom horizon)
    drawCyberGrid(ctx);

    // 4. Tower & Slabs under Camera Offset
    ctx.save();
    ctx.translate(0, state.cameraY);

    // Foundation Base
    drawFoundationBase(ctx);

    // Stacked Blocks
    for (let i = 0; i < state.tower.length; i++) {
      const block = state.tower[i];
      // Skip offscreen blocks
      if (block.y + state.cameraY > Engine.CANVAS_HEIGHT + 100) continue;
      drawBlock(ctx, block, false);
    }

    // Falling Debris Pieces
    for (const d of state.fallingDebris) {
      drawFallingDebris(ctx, d);
    }

    // Moving Block
    if (state.movingBlock && !state.isGameOver) {
      drawBlock(ctx, state.movingBlock, true);
    }

    // Particles (Sparks)
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glow;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Floating Texts
    for (const ft of state.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 18px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore(); // Restore camera offset

    ctx.restore(); // Restore root transform
  }

  function drawCyberGrid(context) {
    const horizonY = Engine.BASE_Y + 50 + state.cameraY;
    if (horizonY > Engine.CANVAS_HEIGHT) return;

    context.save();
    context.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    context.lineWidth = 1;

    // Perspective lines
    const vanishingX = Engine.CANVAS_WIDTH / 2;
    for (let x = -200; x <= Engine.CANVAS_WIDTH + 200; x += 50) {
      context.beginPath();
      context.moveTo(vanishingX, horizonY);
      context.lineTo(x, Engine.CANVAS_HEIGHT + 100);
      context.stroke();
    }

    // Horizontal lines
    for (let y = horizonY; y <= Engine.CANVAS_HEIGHT + 100; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(Engine.CANVAS_WIDTH, y);
      context.stroke();
    }
    context.restore();
  }

  function drawFoundationBase(context) {
    const fY = Engine.BASE_Y + Engine.BLOCK_HEIGHT;
    context.save();
    context.fillStyle = '#0a0d14';
    context.fillRect(0, fY, Engine.CANVAS_WIDTH, 400);

    // Glowing border line
    context.strokeStyle = '#00f0ff';
    context.lineWidth = 2;
    context.shadowColor = '#00f0ff';
    context.shadowBlur = 12;
    context.beginPath();
    context.moveTo(0, fY);
    context.lineTo(Engine.CANVAS_WIDTH, fY);
    context.stroke();
    context.restore();
  }

  function drawBlock(context, block, isMoving) {
    context.save();

    const { x, y, width, height, color } = block;

    // Outer glow
    context.shadowColor = isMoving ? '#ffffff' : color.glow;
    context.shadowBlur = isMoving ? 16 : 8;

    // Body Fill
    const grad = context.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, color.light);
    grad.addColorStop(0.3, color.main);
    grad.addColorStop(1, color.dark);

    context.fillStyle = grad;
    context.beginPath();
    context.roundRect(x, y, width, height, 4);
    context.fill();

    // Bright Top Edge Bevel
    context.shadowBlur = 0;
    context.fillStyle = 'rgba(255, 255, 255, 0.85)';
    context.fillRect(x + 2, y + 1, width - 4, 2);

    // Subtle Inner Cyber Line
    context.fillStyle = 'rgba(255, 255, 255, 0.25)';
    context.fillRect(x + 6, y + height / 2 - 1, width - 12, 1.5);

    // Border
    context.strokeStyle = isMoving ? '#ffffff' : color.main;
    context.lineWidth = 1.5;
    context.stroke();

    context.restore();
  }

  function drawFallingDebris(context, debris) {
    context.save();
    context.globalAlpha = Math.max(0, debris.alpha);
    context.translate(debris.x + debris.width / 2, debris.y + debris.height / 2);
    context.rotate(debris.rotation);

    context.shadowColor = debris.color.glow;
    context.shadowBlur = 8;

    const halfW = debris.width / 2;
    const halfH = debris.height / 2;

    const grad = context.createLinearGradient(-halfW, -halfH, -halfW, halfH);
    grad.addColorStop(0, debris.color.light);
    grad.addColorStop(1, debris.color.dark);

    context.fillStyle = grad;
    context.beginPath();
    context.roundRect(-halfW, -halfH, debris.width, debris.height, 3);
    context.fill();

    context.strokeStyle = debris.color.main;
    context.lineWidth = 1;
    context.stroke();

    context.restore();
  }

  // --- Main Animation Frame ---
  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    // Ambient stars drift
    for (const s of stars) {
      s.y += s.speed * deltaSeconds;
      if (s.y > Engine.CANVAS_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * Engine.CANVAS_WIDTH;
      }
    }

    // Screen Shake decay
    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - 35 * deltaSeconds);
    }

    if (isPlaying && !isPaused) {
      Engine.updateMovingBlock(state, deltaSeconds);
      Engine.updatePhysics(state, deltaSeconds);
    }

    drawScene();
    requestAnimationFrame(loop);
  }

  // --- Event Listeners & Interaction ---
  function setupEvents() {
    // Canvas & Stage Click / Touch
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleAction();
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleAction();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        initGame();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (Audio) Audio.toggleMute();
        updateHUD();
      }
    });

    // Navigation and HUD buttons
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        if (Audio) Audio.toggleMute();
        updateHUD();
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        initGame();
      });
    }

    if (btnPause) {
      btnPause.addEventListener('click', () => {
        togglePause();
      });
    }

    if (gameOverlay) {
      gameOverlay.addEventListener('click', () => {
        if (!isPlaying) startGame();
        else if (isPaused) togglePause();
      });
    }

    if (modalRestartBtn) {
      modalRestartBtn.addEventListener('click', () => {
        initGame();
        startGame();
      });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        modalGameOver.classList.add('hidden');
      });
    }
  }

  // Initial startup
  resizeCanvas();
  initGame();
  setupEvents();
  requestAnimationFrame(loop);

})();
