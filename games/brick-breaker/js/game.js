/**
 * Brick Breaker — Canvas 2D Game Engine
 * High-performance paddle physics, multi-ball mechanics, particle shattering,
 * power-up capsules, screen shake, and responsive touch/mouse/keyboard controls.
 */

(function () {
  'use strict';

  // Game Engine Constants
  const BASE_BALL_SPEED = 4.0;
  const MAX_BOUNCE_ANGLE = Math.PI * 0.38; // ~68 degrees

  // Game State
  const state = {
    mode: 'ready', // 'ready', 'playing', 'paused', 'gameover', 'levelcleared', 'victory'
    score: 0,
    bestScore: 0,
    lives: 3,
    levelIndex: 0,
    combo: 0,
    screenShake: 0,

    // Timing
    matchSeconds: 0,
    timerInterval: null,

    // Entities
    paddle: {
      x: 0,
      y: 0,
      width: 96,
      height: 12,
      baseWidth: 96,
      targetX: 0,
      vx: 0,
      wideTimer: 0
    },

    balls: [],
    bricks: [],
    particles: [],
    powerups: [],
    floatingTexts: [],

    // Key states
    keys: {
      left: false,
      right: false
    }
  };

  // DOM Elements Cache
  let dom = {};
  let ctx = null;
  let animFrameId = null;
  let lastTime = 0;
  let dpr = 1;
  let canvasW = 600;
  let canvasH = 480;

  // 1. Initialization
  function init() {
    cacheDom();
    setupCanvas();
    loadBestScore();
    updateHUD();
    bindEvents();
    loadLevel(state.levelIndex);

    // Initial render
    render();
  }

  function cacheDom() {
    dom = {
      canvas: document.getElementById('bb-canvas'),
      container: document.getElementById('bb-stage-card'),

      // HUD
      scoreDisplay: document.getElementById('score-display'),
      bestDisplay: document.getElementById('best-display'),
      livesDisplay: document.getElementById('lives-display'),
      levelBadge: document.getElementById('level-badge'),
      comboDisplay: document.getElementById('combo-badge'),
      audioToggleBtn: document.getElementById('audio-toggle-btn'),
      audioIcon: document.getElementById('audio-icon'),

      // Overlay Screens
      overlayStart: document.getElementById('overlay-start'),
      overlayPause: document.getElementById('overlay-pause'),
      overlayGameOver: document.getElementById('overlay-gameover'),
      overlayWin: document.getElementById('overlay-win'),

      // Overlay Buttons
      startBtn: document.getElementById('start-btn'),
      resumeBtn: document.getElementById('resume-btn'),
      restartBtn: document.getElementById('restart-btn'),
      nextLevelBtn: document.getElementById('next-level-btn'),
      playAgainBtn: document.getElementById('play-again-btn'),
      finalScoreVal: document.getElementById('final-score-val'),
      winScoreVal: document.getElementById('win-score-val'),

      // Confetti Canvas
      confettiCanvas: document.getElementById('confetti-canvas')
    };

    if (dom.canvas) {
      ctx = dom.canvas.getContext('2d');
    }
  }

  function setupCanvas() {
    if (!dom.canvas) return;

    // Responsive sizing matching container width
    const containerWidth = dom.canvas.parentElement.clientWidth || 600;
    canvasW = Math.min(640, containerWidth);
    canvasH = Math.round(canvasW * 0.75); // 4:3 arcade ratio

    dpr = window.devicePixelRatio || 1;
    dom.canvas.width = canvasW * dpr;
    dom.canvas.height = canvasH * dpr;
    dom.canvas.style.width = `${canvasW}px`;
    dom.canvas.style.height = `${canvasH}px`;

    ctx.scale(dpr, dpr);
  }

  // 2. Score Persistence
  function loadBestScore() {
    try {
      const saved = localStorage.getItem('arcade_brick_best');
      state.bestScore = saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {}
  }

  function saveBestScore() {
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      try {
        localStorage.setItem('arcade_brick_best', state.bestScore.toString());
      } catch (e) {}
    }
  }

  // 3. Level Loading & Entity Reset
  function loadLevel(lvlIdx) {
    state.levelIndex = lvlIdx;
    const levelData = window.BrickLevels?.buildBricksForLevel(lvlIdx, canvasW, canvasH);

    state.bricks = levelData?.bricks || [];
    state.speedMultiplier = levelData?.speedMultiplier || 1.0;

    // Reset paddle
    state.paddle.width = canvasW < 450 ? 76 : 96;
    state.paddle.baseWidth = state.paddle.width;
    state.paddle.x = (canvasW - state.paddle.width) / 2;
    state.paddle.y = canvasH - 30;
    state.paddle.targetX = state.paddle.x;
    state.paddle.wideTimer = 0;

    // Reset ball (glued to paddle)
    resetBallOnPaddle();

    // Clear particles & powerups
    state.particles = [];
    state.powerups = [];
    state.floatingTexts = [];
    state.combo = 0;

    // Mode
    state.mode = 'ready';
    showOverlay(dom.overlayStart);

    updateHUD();
  }

  function resetBallOnPaddle() {
    const ballX = state.paddle.x + state.paddle.width / 2;
    const ballY = state.paddle.y - 10;
    state.balls = [
      {
        x: ballX,
        y: ballY,
        radius: 6,
        vx: 0,
        vy: 0,
        speed: BASE_BALL_SPEED * (state.speedMultiplier || 1.0),
        trail: [],
        glued: true
      }
    ];
  }

  function launchBall() {
    if (state.mode !== 'ready') return;

    state.mode = 'playing';
    hideAllOverlays();

    state.balls.forEach(ball => {
      if (ball.glued) {
        ball.glued = false;
        // Launch upwards with a slight natural randomized angle
        const angle = (Math.random() * 0.4 - 0.2) * Math.PI;
        ball.vx = ball.speed * Math.sin(angle);
        ball.vy = -ball.speed * Math.cos(angle);
      }
    });

    window.BrickAudio?.playPaddleHit(0);
    startLoop();
  }

  // 4. Game Loop
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

    // Safety clamp dt to avoid sudden physics jumps on lag spike or background tab
    if (dt > 0.05) dt = 0.05;

    // timeScale: normalized to standard 60 FPS (dt = 1/60s => timeScale = 1.0)
    // On a 120Hz monitor, dt = 1/120s => timeScale = 0.5 (moves at exact same speed)
    // On a 144Hz monitor, dt = 1/144s => timeScale = 0.416
    const timeScale = dt * 60;

    if (state.mode === 'playing') {
      update(timeScale, dt);
    }
    render();

    if (state.mode === 'playing' || state.particles.length > 0) {
      animFrameId = requestAnimationFrame(gameLoop);
    } else {
      animFrameId = null;
    }
  }

  // 5. Physics & Logic Update
  function update(timeScale = 1.0, dt = 1 / 60) {
    updatePaddle(timeScale, dt);
    updateBalls(timeScale);
    updatePowerups(timeScale);
    updateParticles(timeScale);
    updateFloatingTexts(timeScale);

    // Screen Shake decay
    if (state.screenShake > 0) {
      state.screenShake *= Math.pow(0.85, timeScale);
      if (state.screenShake < 0.2) state.screenShake = 0;
    }
  }

  function updatePaddle(timeScale, dt) {
    // Keyboard movement
    const moveSpeed = 7.5 * timeScale;
    if (state.keys.left) {
      state.paddle.x -= moveSpeed;
    }
    if (state.keys.right) {
      state.paddle.x += moveSpeed;
    }

    // Boundary clamping
    if (state.paddle.x < 0) state.paddle.x = 0;
    if (state.paddle.x + state.paddle.width > canvasW) {
      state.paddle.x = canvasW - state.paddle.width;
    }

    // Wide paddle countdown in real seconds
    if (state.paddle.wideTimer > 0) {
      state.paddle.wideTimer -= dt;
      if (state.paddle.wideTimer <= 0) {
        state.paddle.width = state.paddle.baseWidth;
      }
    }
  }

  function updateBalls(timeScale) {
    const ballsToRemove = [];

    state.balls.forEach((ball, bIdx) => {
      if (ball.glued) {
        ball.x = state.paddle.x + state.paddle.width / 2;
        ball.y = state.paddle.y - ball.radius - 2;
        return;
      }

      // Record trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 7) ball.trail.shift();

      // Move scaled by timeScale
      ball.x += ball.vx * timeScale;
      ball.y += ball.vy * timeScale;

      // Wall Collisions
      // Left Wall
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        window.BrickAudio?.playWallHit();
      }
      // Right Wall
      if (ball.x + ball.radius >= canvasW) {
        ball.x = canvasW - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        window.BrickAudio?.playWallHit();
      }
      // Top Ceiling
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        window.BrickAudio?.playWallHit();
      }

      // Paddle Collision
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= state.paddle.y &&
        ball.y - ball.radius <= state.paddle.y + state.paddle.height &&
        ball.x + ball.radius >= state.paddle.x &&
        ball.x - ball.radius <= state.paddle.x + state.paddle.width
      ) {
        // Calculate hit position from paddle center: -1 (left edge) to +1 (right edge)
        const hitOffset = (ball.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
        const clampedOffset = Math.max(-0.95, Math.min(0.95, hitOffset));

        const bounceAngle = clampedOffset * MAX_BOUNCE_ANGLE;
        const speed = ball.speed || BASE_BALL_SPEED;

        ball.vx = speed * Math.sin(bounceAngle);
        ball.vy = -speed * Math.cos(bounceAngle);
        ball.y = state.paddle.y - ball.radius - 1;

        // Reset combo on paddle return
        state.combo = 0;
        updateHUD();

        window.BrickAudio?.playPaddleHit(clampedOffset);
      }

      // Brick Collisions
      checkBrickCollisions(ball);

      // Bottom pit (Life Lost)
      if (ball.y - ball.radius > canvasH) {
        ballsToRemove.push(bIdx);
      }
    });

    // Remove lost balls
    for (let i = ballsToRemove.length - 1; i >= 0; i--) {
      state.balls.splice(ballsToRemove[i], 1);
    }

    // If no balls remaining, handle life loss
    if (state.balls.length === 0) {
      handleBallLost();
    }
  }

  function checkBrickCollisions(ball) {
    for (let i = 0; i < state.bricks.length; i++) {
      const b = state.bricks[i];
      if (!b.alive) continue;

      // Circle to Rectangle Collision
      const nearestX = Math.max(b.x, Math.min(ball.x, b.x + b.width));
      const nearestY = Math.max(b.y, Math.min(ball.y, b.y + b.height));

      const dx = ball.x - nearestX;
      const dy = ball.y - nearestY;

      if (dx * dx + dy * dy <= ball.radius * ball.radius) {
        // Hit detected! Determine bounce direction
        const prevX = ball.x - ball.vx;
        const prevY = ball.y - ball.vy;

        // If came from left/right vs top/bottom
        if (prevX + ball.radius <= b.x || prevX - ball.radius >= b.x + b.width) {
          ball.vx = -ball.vx;
        } else {
          ball.vy = -ball.vy;
        }

        // Damage brick
        b.hp--;
        state.combo++;

        // Add Points with Combo multiplier
        const comboMultiplier = Math.min(5, Math.floor((state.combo - 1) / 2) + 1);
        const earned = b.points * comboMultiplier;
        state.score += earned;
        saveBestScore();

        // Spawn floating score text
        state.floatingTexts.push({
          x: b.x + b.width / 2,
          y: b.y,
          text: `+${earned}`,
          color: b.theme.fill,
          alpha: 1,
          vy: -1.2
        });

        if (b.hp <= 0) {
          b.alive = false;
          // Brick shattered!
          window.BrickAudio?.playBrickBreak(state.combo);
          spawnShatterParticles(b);
          state.screenShake = 3;

          // Spawn powerup if applicable
          if (b.powerup) {
            state.powerups.push({
              x: b.x + b.width / 2 - 14,
              y: b.y,
              width: 28,
              height: 14,
              vy: 2.2,
              data: b.powerup
            });
          }
        } else {
          // Brick damaged/cracked
          window.BrickAudio?.playBrickHit(state.combo);
          spawnSparks(nearestX, nearestY, 6, b.theme.fill);
        }

        updateHUD();

        // Check if all alive bricks destroyed
        if (state.bricks.every(brick => !brick.alive)) {
          handleLevelCleared();
        }

        break; // Process one brick collision per step to prevent sticking
      }
    }
  }

  function updatePowerups(timeScale = 1.0) {
    const toRemove = [];

    state.powerups.forEach((p, idx) => {
      p.y += p.vy * timeScale;

      // Check collision with paddle
      if (
        p.y + p.height >= state.paddle.y &&
        p.y <= state.paddle.y + state.paddle.height &&
        p.x + p.width >= state.paddle.x &&
        p.x <= state.paddle.x + state.paddle.width
      ) {
        // Collect Powerup!
        applyPowerup(p.data);
        toRemove.push(idx);
      } else if (p.y > canvasH) {
        toRemove.push(idx);
      }
    });

    for (let i = toRemove.length - 1; i >= 0; i--) {
      state.powerups.splice(toRemove[i], 1);
    }
  }

  function applyPowerup(data) {
    window.BrickAudio?.playPowerup();

    // Floating text
    state.floatingTexts.push({
      x: state.paddle.x + state.paddle.width / 2,
      y: state.paddle.y - 12,
      text: data.label,
      color: data.color,
      alpha: 1,
      vy: -1.5
    });

    if (data.type === 'wide') {
      state.paddle.width = Math.min(canvasW * 0.45, state.paddle.baseWidth * 1.45);
      state.paddle.wideTimer = 12; // 12 seconds
    } else if (data.type === 'multiball') {
      // Spawn 2 extra balls
      const primaryBall = state.balls[0] || { x: state.paddle.x + state.paddle.width / 2, y: state.paddle.y - 10, speed: BASE_BALL_SPEED };
      const currentSpeed = primaryBall.speed || BASE_BALL_SPEED;
      for (let i = 0; i < 2; i++) {
        const angle = (Math.random() * 0.8 - 0.4) * Math.PI;
        state.balls.push({
          x: primaryBall.x,
          y: primaryBall.y,
          radius: 6,
          vx: currentSpeed * Math.sin(angle),
          vy: -Math.abs(currentSpeed * Math.cos(angle)),
          speed: currentSpeed,
          trail: [],
          glued: false
        });
      }
    } else if (data.type === 'life') {
      state.lives = Math.min(5, state.lives + 1);
      updateHUD();
    } else if (data.type === 'slow') {
      state.balls.forEach(b => {
        b.speed = Math.max(2.8, (b.speed || BASE_BALL_SPEED) * 0.8);
        const currentAngle = Math.atan2(b.vx, -b.vy);
        b.vx = b.speed * Math.sin(currentAngle);
        b.vy = -b.speed * Math.cos(currentAngle);
      });
    }
  }

  function handleBallLost() {
    state.lives--;
    state.combo = 0;
    state.screenShake = 6;
    updateHUD();

    window.BrickAudio?.playLifeLost();

    if (state.lives <= 0) {
      // Game Over
      state.mode = 'gameover';
      stopLoop();
      window.BrickAudio?.playGameOver();

      if (dom.finalScoreVal) dom.finalScoreVal.textContent = state.score;
      showOverlay(dom.overlayGameOver);
    } else {
      // Reset ball on paddle
      state.mode = 'ready';
      resetBallOnPaddle();
      showOverlay(dom.overlayStart);
    }
  }

  function handleLevelCleared() {
    state.mode = 'levelcleared';
    stopLoop();

    window.BrickAudio?.playWin();
    launchConfetti();

    if (state.levelIndex + 1 < (window.BrickLevels?.LEVEL_DATA.length || 3)) {
      // Advance to next wave
      showOverlay(dom.overlayWin);
      if (dom.winScoreVal) dom.winScoreVal.textContent = state.score;
    } else {
      // Cleared entire campaign!
      state.mode = 'victory';
      showOverlay(dom.overlayWin);
      if (dom.winScoreVal) dom.winScoreVal.textContent = state.score;
      const title = dom.overlayWin?.querySelector('.overlay-title');
      if (title) title.textContent = 'Arcade Champion!';
    }
  }

  // 6. Particle Systems
  function spawnShatterParticles(brick) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      state.particles.push({
        x: brick.x + Math.random() * brick.width,
        y: brick.y + Math.random() * brick.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 4 + 2,
        color: brick.theme.fill,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.02
      });
    }
  }

  function spawnSparks(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color,
        alpha: 1,
        decay: 0.04
      });
    }
  }

  function updateParticles(timeScale = 1.0) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.vy += 0.15 * timeScale; // Gravity
      p.alpha -= p.decay * timeScale;

      if (p.alpha <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  function updateFloatingTexts(timeScale = 1.0) {
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y += ft.vy * timeScale;
      ft.alpha -= 0.025 * timeScale;
      if (ft.alpha <= 0) {
        state.floatingTexts.splice(i, 1);
      }
    }
  }

  // 7. Rendering
  function render() {
    if (!ctx) return;

    ctx.save();

    // Screen Shake Offset
    if (state.screenShake > 0) {
      const sx = (Math.random() - 0.5) * state.screenShake * 2;
      const sy = (Math.random() - 0.5) * state.screenShake * 2;
      ctx.translate(sx, sy);
    }

    // Clear Canvas
    ctx.fillStyle = '#10120f';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Subtle Grid Backdrop
    ctx.strokeStyle = 'rgba(244, 242, 233, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 30; x < canvasW; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasH);
      ctx.stroke();
    }
    for (let y = 30; y < canvasH; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();
    }

    // Render Bricks
    renderBricks();

    // Render Powerups
    renderPowerups();

    // Render Paddle
    renderPaddle();

    // Render Balls
    renderBalls();

    // Render Particles
    renderParticles();

    // Render Floating Text
    renderFloatingTexts();

    ctx.restore();
  }

  function renderBricks() {
    state.bricks.forEach(b => {
      if (!b.alive) return;

      // Glow & Fill
      ctx.fillStyle = b.theme.fill;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.width, b.height, 4);
      ctx.fill();

      // Top Highlight Stroke
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(b.x + 2, b.y + 1, b.width - 4, 2);

      // Durable Brick Armor Crack
      if (b.maxHp === 2 && b.hp === 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x + b.width * 0.3, b.y);
        ctx.lineTo(b.x + b.width * 0.5, b.y + b.height * 0.6);
        ctx.lineTo(b.x + b.width * 0.7, b.y + b.height);
        ctx.stroke();
      }

      // Powerup Indicator Gem
      if (b.powerup) {
        ctx.fillStyle = b.powerup.color;
        ctx.beginPath();
        ctx.arc(b.x + b.width / 2, b.y + b.height / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function renderPaddle() {
    const p = state.paddle;

    // Glowing Neon Aura
    ctx.shadowColor = '#d5ff55';
    ctx.shadowBlur = 10;

    // Paddle Body
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.width, p.y);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.3, '#d5ff55');
    grad.addColorStop(0.7, '#ffffff');
    grad.addColorStop(1, '#38bdf8');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.width, p.height, 6);
    ctx.fill();

    // Center Core Stripe
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(p.x + p.width * 0.2, p.y + 3, p.width * 0.6, 3, 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  function renderBalls() {
    state.balls.forEach(ball => {
      // Draw Trail
      ball.trail.forEach((pt, idx) => {
        const alpha = (idx / ball.trail.length) * 0.35;
        const rad = ball.radius * (0.4 + (idx / ball.trail.length) * 0.6);
        ctx.fillStyle = `rgba(213, 255, 85, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
        ctx.fill();
      });

      // Energy Ball Glow
      ctx.shadowColor = '#d5ff55';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Core Highlight
      ctx.fillStyle = '#d5ff55';
      ctx.beginPath();
      ctx.arc(ball.x - 1.5, ball.y - 1.5, ball.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    });
  }

  function renderPowerups() {
    state.powerups.forEach(p => {
      ctx.fillStyle = p.data.color;
      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, 6);
      ctx.fill();

      ctx.fillStyle = '#10120f';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.data.symbol, p.x + p.width / 2, p.y + p.height / 2 + 1);
    });
  }

  function renderParticles() {
    state.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }

  function renderFloatingTexts() {
    state.floatingTexts.forEach(ft => {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1;
  }

  // 8. HUD & UI Updates
  function updateHUD() {
    if (dom.scoreDisplay) dom.scoreDisplay.textContent = state.score;
    if (dom.bestDisplay) dom.bestDisplay.textContent = state.bestScore;

    if (dom.livesDisplay) {
      // Render hearts: ❤️
      const hearts = '♥'.repeat(Math.max(0, state.lives));
      dom.livesDisplay.textContent = hearts || '0';
    }

    if (dom.levelBadge) {
      dom.levelBadge.textContent = `WAVE ${state.levelIndex + 1}`;
    }

    if (dom.comboDisplay) {
      if (state.combo >= 2) {
        dom.comboDisplay.textContent = `COMBO ×${Math.min(5, Math.floor((state.combo - 1) / 2) + 1)}`;
        dom.comboDisplay.style.display = 'inline-block';
      } else {
        dom.comboDisplay.style.display = 'none';
      }
    }
  }

  function showOverlay(targetEl) {
    [dom.overlayStart, dom.overlayPause, dom.overlayGameOver, dom.overlayWin].forEach(ov => {
      if (ov) ov.classList.remove('show');
    });
    if (targetEl) targetEl.classList.add('show');
  }

  function hideAllOverlays() {
    [dom.overlayStart, dom.overlayPause, dom.overlayGameOver, dom.overlayWin].forEach(ov => {
      if (ov) ov.classList.remove('show');
    });
  }

  function updateAudioIcon(muted) {
    if (!dom.audioIcon) return;
    const isMuted = muted !== undefined ? muted : window.BrickAudio?.isMuted();
    dom.audioIcon.textContent = isMuted ? '🔇' : '🔊';
    dom.audioToggleBtn?.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
  }

  // 9. Input & Event Listeners
  function bindEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      setupCanvas();
      if (state.mode === 'ready') {
        state.paddle.y = canvasH - 30;
        resetBallOnPaddle();
      }
      render();
    });

    // Mouse Movement
    dom.canvas?.addEventListener('mousemove', e => {
      const rect = dom.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      state.paddle.x = Math.max(0, Math.min(canvasW - state.paddle.width, mouseX - state.paddle.width / 2));
      if (state.mode === 'ready') render();
    });

    // Click on canvas launches
    dom.canvas?.addEventListener('click', () => {
      if (state.mode === 'ready') {
        launchBall();
      }
    });

    // Touch Support (mobile)
    dom.canvas?.addEventListener('touchstart', e => {
      if (state.mode === 'ready') {
        launchBall();
      }
      handleTouch(e);
    }, { passive: false });

    dom.canvas?.addEventListener('touchmove', handleTouch, { passive: false });

    function handleTouch(e) {
      e.preventDefault();
      if (!e.touches || e.touches.length === 0) return;
      const rect = dom.canvas.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      state.paddle.x = Math.max(0, Math.min(canvasW - state.paddle.width, touchX - state.paddle.width / 2));
      if (state.mode === 'ready') render();
    }

    // Keyboard controls
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);

    // Overlay Buttons
    dom.startBtn?.addEventListener('click', launchBall);

    dom.resumeBtn?.addEventListener('click', () => {
      if (state.mode === 'paused') {
        state.mode = 'playing';
        hideAllOverlays();
        startLoop();
      }
    });

    dom.restartBtn?.addEventListener('click', () => {
      window.BrickAudio?.playClick();
      state.score = 0;
      state.lives = 3;
      loadLevel(0);
    });

    dom.nextLevelBtn?.addEventListener('click', () => {
      window.BrickAudio?.playClick();
      loadLevel(state.levelIndex + 1);
    });

    dom.playAgainBtn?.addEventListener('click', () => {
      window.BrickAudio?.playClick();
      state.score = 0;
      state.lives = 3;
      loadLevel(0);
    });

    // Audio Toggle
    if (dom.audioToggleBtn) {
      updateAudioIcon();
      dom.audioToggleBtn.addEventListener('click', () => {
        const isMuted = window.BrickAudio?.toggleMute();
        updateAudioIcon(isMuted);
      });
    }
  }

  function handleKeydown(e) {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      state.keys.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      state.keys.right = true;
    }

    // Space: Launch or Toggle Pause
    if (e.key === ' ') {
      e.preventDefault();
      if (state.mode === 'ready') {
        launchBall();
      } else if (state.mode === 'playing') {
        state.mode = 'paused';
        stopLoop();
        showOverlay(dom.overlayPause);
      } else if (state.mode === 'paused') {
        state.mode = 'playing';
        hideAllOverlays();
        startLoop();
      }
    }

    // P: Toggle Pause
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (state.mode === 'playing') {
        state.mode = 'paused';
        stopLoop();
        showOverlay(dom.overlayPause);
      } else if (state.mode === 'paused') {
        state.mode = 'playing';
        hideAllOverlays();
        startLoop();
      }
    }

    // R: Restart Game
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      window.BrickAudio?.playClick();
      state.score = 0;
      state.lives = 3;
      loadLevel(0);
    }

    // M: Toggle Sound
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const isMuted = window.BrickAudio?.toggleMute();
      updateAudioIcon(isMuted);
    }
  }

  function handleKeyup(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      state.keys.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      state.keys.right = false;
    }
  }

  // 10. Confetti Burst on Victory
  function launchConfetti() {
    if (!dom.confettiCanvas) return;
    const canvas = dom.confettiCanvas;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    const ctxC = canvas.getContext('2d');
    if (!ctxC) return;

    const colors = ['#d5ff55', '#38bdf8', '#ff784f', '#fde047', '#ffffff'];
    const particles = [];

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() - 0.5) * 80,
        y: canvas.height * 0.4 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 10 - 2,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 16,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.012
      });
    }

    function animate() {
      ctxC.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;

      particles.forEach(p => {
        if (p.alpha <= 0) return;
        alive++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        ctxC.save();
        ctxC.globalAlpha = Math.max(0, p.alpha);
        ctxC.translate(p.x, p.y);
        ctxC.rotate((p.rotation * Math.PI) / 180);
        ctxC.fillStyle = p.color;
        ctxC.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctxC.restore();
      });

      if (alive > 0) {
        requestAnimationFrame(animate);
      } else {
        ctxC.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animate();
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
