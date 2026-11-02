/**
 * Stack Ball — Main Canvas 2D Pseudo-3D Helix Renderer & Controller
 * Pseudo-3D cylindrical projection, segmented rotating discs, destruction physics,
 * ball bounce squish, fireball blaze effects, touch/keyboard input, and audio synthesis.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'minigame_stackball_save_v1';
  const Engine = window.StackBallEngine;
  const Audio = window.StackBallAudio;

  if (!Engine) {
    console.error('StackBallEngine not loaded');
    return;
  }

  // --- DOM Elements ---
  const canvas = document.getElementById('stack-canvas');
  const ctx = canvas.getContext('2d');

  const levelDisplayEl = document.getElementById('level-display');
  const scoreDisplayEl = document.getElementById('score-display');
  const streakDisplayEl = document.getElementById('streak-display');
  const fireballFillEl = document.getElementById('fireball-meter-fill');
  const progressBarFillEl = document.getElementById('progress-bar-fill');
  const progressTextEl = document.getElementById('progress-text');
  const bestScoreEl = document.getElementById('best-score');

  const btnSound = document.getElementById('btn-sound');
  const btnSoundText = document.getElementById('btn-sound-text');
  const btnRestart = document.getElementById('btn-restart');
  const btnPause = document.getElementById('btn-pause');

  const gameOverlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlaySubtitle = document.getElementById('overlay-subtitle');

  const modalGameOver = document.getElementById('modal-gameover');
  const modalGameOverLevel = document.getElementById('modal-gameover-level');
  const modalGameOverScore = document.getElementById('modal-gameover-score');
  const modalGameOverBest = document.getElementById('modal-gameover-best');
  const modalGameOverRestartBtn = document.getElementById('modal-gameover-restart-btn');

  const modalWin = document.getElementById('modal-win');
  const modalWinLevel = document.getElementById('modal-win-level');
  const modalWinScore = document.getElementById('modal-win-score');
  const modalWinStars = document.getElementById('modal-win-stars');
  const modalWinNextBtn = document.getElementById('modal-win-next-btn');

  // --- Persistent Records ---
  let records = {
    currentLevel: 1,
    highScore: 0,
    maxStreak: 0
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

  // --- Canvas Dimensions & Scaling ---
  const VIRTUAL_WIDTH = 500;
  const VIRTUAL_HEIGHT = 800;
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

    scale = Math.min(renderWidth / VIRTUAL_WIDTH, renderHeight / VIRTUAL_HEIGHT);
  }

  window.addEventListener('resize', resizeCanvas);

  // --- Ambient Background Particles ---
  const ambientParticles = [];
  for (let i = 0; i < 36; i++) {
    ambientParticles.push({
      x: Math.random() * VIRTUAL_WIDTH,
      y: Math.random() * VIRTUAL_HEIGHT,
      size: 1.5 + Math.random() * 2.5,
      alpha: 0.15 + Math.random() * 0.45,
      speed: 10 + Math.random() * 25
    });
  }

  // --- Game State & Animation ---
  let state = null;
  let isPlaying = false;
  let isPaused = false;
  let lastTimestamp = 0;
  let screenShake = 0;
  let lastBounceTime = 0;

  function initLevel(levelNumber) {
    state = Engine.createInitialState(levelNumber);
    isPlaying = false;
    isPaused = false;
    screenShake = 0;

    updateHUD();

    if (gameOverlay) {
      gameOverlay.classList.remove('hidden');
      if (overlayTitle) overlayTitle.textContent = `LEVEL ${levelNumber}`;
      if (overlaySubtitle) overlaySubtitle.textContent = 'HOLD TO SMASH • RELEASE TO BOUNCE';
    }

    if (modalGameOver) modalGameOver.classList.add('hidden');
    if (modalWin) modalWin.classList.add('hidden');

    if (btnPause) {
      btnPause.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    }
  }

  function startGame() {
    if (isPlaying) return;
    isPlaying = true;
    isPaused = false;
    if (gameOverlay) gameOverlay.classList.add('hidden');
  }

  function handleSmashStart() {
    if (!isPlaying) startGame();
    if (isPaused || state.isGameOver || state.isWon) return;
    Engine.startSmash(state);
  }

  function handleSmashEnd() {
    if (isPaused || state.isGameOver || state.isWon) return;
    Engine.stopSmash(state);
  }

  function togglePause() {
    if (!isPlaying || state.isGameOver || state.isWon) return;
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

  function onGameOver() {
    screenShake = 22;
    if (Audio) Audio.playHazardDeath();

    if (state.score > records.highScore) records.highScore = state.score;
    if (state.maxStreak > records.maxStreak) records.maxStreak = state.maxStreak;
    saveRecords();

    setTimeout(() => {
      if (modalGameOver) {
        if (modalGameOverLevel) modalGameOverLevel.textContent = state.level;
        if (modalGameOverScore) modalGameOverScore.textContent = state.score.toLocaleString();
        if (modalGameOverBest) modalGameOverBest.textContent = records.highScore.toLocaleString();
        modalGameOver.classList.remove('hidden');
      }
    }, 550);
  }

  function onLevelWin() {
    if (Audio) Audio.playWinFanfare();

    records.currentLevel = state.level + 1;
    if (state.score > records.highScore) records.highScore = state.score;
    if (state.maxStreak > records.maxStreak) records.maxStreak = state.maxStreak;
    saveRecords();

    const stars = Engine.evaluateStars(state);

    setTimeout(() => {
      if (modalWin) {
        if (modalWinLevel) modalWinLevel.textContent = state.level;
        if (modalWinScore) modalWinScore.textContent = state.score.toLocaleString();
        if (modalWinStars) modalWinStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        modalWin.classList.remove('hidden');
      }
    }, 450);
  }

  function updateHUD() {
    if (levelDisplayEl) levelDisplayEl.textContent = state.level;
    if (scoreDisplayEl) scoreDisplayEl.textContent = state.score.toLocaleString();
    if (bestScoreEl) bestScoreEl.textContent = records.highScore.toLocaleString();

    if (streakDisplayEl) {
      if (state.streak > 1) {
        streakDisplayEl.textContent = `x${state.streak}`;
        streakDisplayEl.parentElement.classList.add('active');
      } else {
        streakDisplayEl.textContent = '—';
        streakDisplayEl.parentElement.classList.remove('active');
      }
    }

    if (fireballFillEl) {
      fireballFillEl.style.width = `${Math.round(state.fireballMeter * 100)}%`;
      if (state.isFireball) {
        fireballFillEl.classList.add('fire-active');
      } else {
        fireballFillEl.classList.remove('fire-active');
      }
    }

    const progress = Engine.calculateProgress(state);
    if (progressBarFillEl) progressBarFillEl.style.width = `${progress}%`;
    if (progressTextEl) progressTextEl.textContent = `${progress}%`;

    if (btnSoundText && Audio) {
      btnSoundText.textContent = Audio.isMuted() ? 'Muted' : 'Sound';
      if (btnSound) {
        btnSound.setAttribute('aria-pressed', Audio.isMuted() ? 'true' : 'false');
      }
    }
  }

  // --- Rendering Functions ---
  const TILT = 0.38; // Perspective angle tilt for circular discs
  const CENTER_X = VIRTUAL_WIDTH / 2;
  const BALL_ANCHOR_Y = 280; // Fixed screen Y where ball interacts

  function drawScene() {
    ctx.save();
    ctx.scale(dpr, dpr);

    const offsetX = (renderWidth - VIRTUAL_WIDTH * scale) / 2;
    const offsetY = (renderHeight - VIRTUAL_HEIGHT * scale) / 2;
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Screen shake
    if (screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    }

    // 1. Ambient Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    bgGrad.addColorStop(0, '#0a0d14');
    bgGrad.addColorStop(0.5, '#101622');
    bgGrad.addColorStop(1, '#171f2f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // 2. Ambient drifting particles
    for (const p of ambientParticles) {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // 3. Central Core Cylinder Column
    drawCentralCore(ctx);

    // 4. Layers (Platforms)
    // Draw back segments (pi to 2*pi), then core, then front segments (0 to pi)
    // We sort visible layers from top to bottom
    const visibleLayers = state.layers.filter(layer => {
      if (layer.status !== 'intact') return false;
      const screenY = layer.y - state.cameraY + BALL_ANCHOR_Y;
      return screenY >= -100 && screenY <= VIRTUAL_HEIGHT + 120;
    });

    for (const layer of visibleLayers) {
      drawLayer(ctx, layer);
    }

    // 5. Victory Base Platform at the bottom
    drawFinishBase(ctx);

    // 6. Flying Shattered Debris
    for (const d of state.shatteredDebris) {
      drawDebris(ctx, d);
    }

    // 7. Bouncing / Smashing Ball
    if (!state.isGameOver) {
      drawBall(ctx);
    }

    // 8. Particles (Sparks & Flames)
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x + CENTER_X, p.y - state.cameraY + BALL_ANCHOR_Y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Floating texts ("FIREBALL!", "+50")
    for (const ft of state.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 20px "Space Grotesk", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 12;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawCentralCore(context) {
    context.save();
    const coreWidth = Engine.CORE_RADIUS * 2;
    const coreX = CENTER_X - Engine.CORE_RADIUS;

    const coreGrad = context.createLinearGradient(coreX, 0, coreX + coreWidth, 0);
    coreGrad.addColorStop(0, '#1c2331');
    coreGrad.addColorStop(0.35, '#3a475d');
    coreGrad.addColorStop(0.7, '#242d3e');
    coreGrad.addColorStop(1, '#111620');

    context.fillStyle = coreGrad;
    context.fillRect(coreX, 0, coreWidth, VIRTUAL_HEIGHT);

    // Side edge lines
    context.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    context.lineWidth = 1;
    context.strokeRect(coreX, 0, coreWidth, VIRTUAL_HEIGHT);
    context.restore();
  }

  function drawLayer(context, layer) {
    const screenY = layer.y - state.cameraY + BALL_ANCHOR_Y;
    const R = Engine.TOWER_RADIUS;
    const r = Engine.CORE_RADIUS;
    const H = Engine.LAYER_HEIGHT;
    const theme = state.theme;

    // Draw each segment of this ring
    for (const seg of layer.segments) {
      const isHaz = seg.type === 'hazard';
      const startAngle = seg.start + layer.rotation;
      const endAngle = seg.end + layer.rotation;

      // Color selection
      const mainColor = isHaz ? Engine.HAZARD_COLOR.main : theme.safe;
      const lightColor = isHaz ? Engine.HAZARD_COLOR.light : theme.safeLight;
      const darkColor = isHaz ? Engine.HAZARD_COLOR.dark : theme.safeDark;

      context.save();

      // Top Face Ellipse Arc
      context.beginPath();
      // Outer arc
      context.ellipse(CENTER_X, screenY, R, R * TILT, 0, startAngle, endAngle);
      // Inner arc in reverse
      context.ellipse(CENTER_X, screenY, r, r * TILT, 0, endAngle, startAngle, true);
      context.closePath();

      const topGrad = context.createLinearGradient(CENTER_X - R, screenY - R * TILT, CENTER_X + R, screenY + R * TILT);
      topGrad.addColorStop(0, lightColor);
      topGrad.addColorStop(0.5, mainColor);
      topGrad.addColorStop(1, darkColor);

      context.fillStyle = topGrad;
      context.fill();

      // Outer Edge Bevel (Thickness wall)
      // Only visible when the arc is facing towards camera (sin(angle) > 0)
      const midAngle = (startAngle + endAngle) / 2;
      if (Math.sin(midAngle) > -0.2) {
        context.beginPath();
        context.ellipse(CENTER_X, screenY, R, R * TILT, 0, startAngle, endAngle);
        context.ellipse(CENTER_X, screenY + H, R, R * TILT, 0, endAngle, startAngle, true);
        context.closePath();

        const wallGrad = context.createLinearGradient(0, screenY, 0, screenY + H);
        wallGrad.addColorStop(0, mainColor);
        wallGrad.addColorStop(1, darkColor);

        context.fillStyle = wallGrad;
        context.fill();
      }

      // Border lines
      context.strokeStyle = isHaz ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)';
      context.lineWidth = 1;
      context.stroke();

      context.restore();
    }
  }

  function drawFinishBase(context) {
    const screenY = state.baseY - state.cameraY + BALL_ANCHOR_Y;
    if (screenY < -100 || screenY > VIRTUAL_HEIGHT + 200) return;

    context.save();
    const R = Engine.TOWER_RADIUS * 1.35;
    const r = Engine.CORE_RADIUS;
    const H = 28;

    // Checkered victory green base
    context.beginPath();
    context.ellipse(CENTER_X, screenY, R, R * TILT, 0, 0, Math.PI * 2);
    context.fillStyle = '#00e676';
    context.shadowColor = '#00e676';
    context.shadowBlur = 18;
    context.fill();

    // Base cylinder wall
    context.beginPath();
    context.ellipse(CENTER_X, screenY, R, R * TILT, 0, 0, Math.PI);
    context.ellipse(CENTER_X, screenY + H, R, R * TILT, 0, Math.PI, 0, true);
    context.closePath();
    context.fillStyle = '#00a854';
    context.fill();

    context.restore();
  }

  function drawBall(context) {
    const ball = state.ball;
    // Ball sits at front: angle Math.PI / 2
    const ballX = CENTER_X;
    const ballY = ball.y - state.cameraY + BALL_ANCHOR_Y;
    const radius = ball.radius;

    context.save();
    context.translate(ballX, ballY);
    context.scale(ball.squishX, ball.squishY);

    // Fireball mode aura
    if (state.isFireball) {
      const auraGrad = context.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius * 2.5);
      auraGrad.addColorStop(0, 'rgba(255, 235, 59, 0.95)');
      auraGrad.addColorStop(0.4, 'rgba(255, 87, 34, 0.8)');
      auraGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');

      context.fillStyle = auraGrad;
      context.beginPath();
      context.arc(0, 0, radius * 2.5, 0, Math.PI * 2);
      context.fill();
    }

    // Ball Sphere 3D gradient
    const theme = state.theme;
    const ballGrad = context.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.1, 0, 0, radius);
    if (state.isFireball) {
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.4, '#ffee55');
      ballGrad.addColorStop(1, '#ff3d00');
    } else {
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.4, theme.safeLight);
      ballGrad.addColorStop(1, theme.safeDark);
    }

    context.fillStyle = ballGrad;
    context.shadowColor = state.isFireball ? '#ff5722' : theme.glow;
    context.shadowBlur = state.isFireball ? 20 : 12;

    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  function drawDebris(context, d) {
    context.save();
    context.globalAlpha = Math.max(0, d.alpha);
    const screenX = CENTER_X + d.x;
    const screenY = d.y - state.cameraY + BALL_ANCHOR_Y;

    context.translate(screenX, screenY);
    context.rotate(d.rotation);

    const grad = context.createLinearGradient(-d.width / 2, -d.height / 2, d.width / 2, d.height / 2);
    grad.addColorStop(0, d.color.light || d.color.safeLight || '#fff');
    grad.addColorStop(1, d.color.dark || d.color.safeDark || '#000');

    context.fillStyle = grad;
    context.beginPath();
    context.roundRect(-d.width / 2, -d.height / 2, d.width, d.height, 3);
    context.fill();

    context.restore();
  }

  // --- Main Animation Loop ---
  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;

    // Ambient stars drift
    for (const p of ambientParticles) {
      p.y += p.speed * deltaSeconds;
      if (p.y > VIRTUAL_HEIGHT) {
        p.y = 0;
        p.x = Math.random() * VIRTUAL_WIDTH;
      }
    }

    // Screen Shake decay
    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - 40 * deltaSeconds);
    }

    if (isPlaying && !isPaused) {
      Engine.updateTower(state, deltaSeconds);
      const res = Engine.updateBallPhysics(state, deltaSeconds);

      if (res) {
        if (res.event === 'smash') {
          if (Audio) Audio.playSmash(res.streak);
          if (res.isFireball && state.streak === Engine.FIREBALL_THRESHOLD) {
            if (Audio) Audio.playFireballIgnite();
            state.floatingTexts.push({
              text: 'FIREBALL MODE!',
              x: CENTER_X,
              y: 220,
              color: '#ffd600',
              life: 1.2,
              maxLife: 1.2
            });
          }
        } else if (res.event === 'fireball_smash') {
          if (Audio) Audio.playFireballSmash();
          state.floatingTexts.push({
            text: '+50 SMASH!',
            x: CENTER_X,
            y: 230,
            color: '#ff9100',
            life: 0.8,
            maxLife: 0.8
          });
        } else if (res.event === 'hazard_shatter') {
          onGameOver();
        } else if (res.event === 'win') {
          onLevelWin();
        } else if (res.event === 'bounce') {
          // Play pop audio at peak contact
          if (res.bouncePhase < 0.12 && timestamp - lastBounceTime > 200) {
            if (Audio) Audio.playBounce();
            lastBounceTime = timestamp;
          }
        }
      }

      updateHUD();
    }

    drawScene();
    requestAnimationFrame(loop);
  }

  // --- Event Listeners & Interaction ---
  function setupEvents() {
    // Canvas Click & Touch
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleSmashStart();
    });

    window.addEventListener('pointerup', (e) => {
      handleSmashEnd();
    });

    window.addEventListener('pointercancel', (e) => {
      handleSmashEnd();
    });

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleSmashStart();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        initLevel(state.level);
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (Audio) Audio.toggleMute();
        updateHUD();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
        e.preventDefault();
        handleSmashEnd();
      }
    });

    // HUD Buttons
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        if (Audio) Audio.toggleMute();
        updateHUD();
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        initLevel(state.level);
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

    if (modalGameOverRestartBtn) {
      modalGameOverRestartBtn.addEventListener('click', () => {
        initLevel(state.level);
        startGame();
      });
    }

    if (modalWinNextBtn) {
      modalWinNextBtn.addEventListener('click', () => {
        initLevel(state.level + 1);
        startGame();
      });
    }
  }

  // Startup
  resizeCanvas();
  initLevel(records.currentLevel || 1);
  setupEvents();
  requestAnimationFrame(loop);

})();
