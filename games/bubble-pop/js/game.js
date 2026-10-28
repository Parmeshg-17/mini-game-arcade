/**
 * Bubble Pop — Canvas 2D Bubble Shooter Game Engine
 * Inspired by classic Puzzle Bobble / Bust-A-Move and the reference arcade shooter.
 * Features:
 * - Hexagonal staggered grid geometry
 * - Laser trajectory with wall ricochets & bounce sparks
 * - Loaded bubble cannon with live shot counter & bubble swap
 * - Match-3+ burst physics & falling island avalanches
 * - 4 Boosters: Bomb, Rainbow, Laser Sight, and Rocket
 * - Full Touch, Mouse, and Accessible Keyboard controls
 * - Delta-time physics normalization (60Hz / 120Hz / 144Hz)
 */
(function() {
  'use strict';

  // Constants
  const BUBBLE_RADIUS = 20;
  const BALL_SPEED = 12.0;

  // DOM Elements cache
  const dom = {};

  // Engine State
  const state = {
    levelIndex: 0,
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'cleared' | 'gameover'
    grid: [],
    levelInfo: null,
    score: 0,
    bestScore: 0,
    shotsLeft: 20,
    totalShots: 20,
    currentBubbleColor: 0,
    nextBubbleColor: 1,
    activeBooster: null, // 'bomb' | 'rainbow' | 'laser' | 'rocket'
    aimAngle: -Math.PI / 2, // Default aiming straight up
    isAiming: false,
    flyingBall: null, // { x, y, vx, vy, color, isBooster }
    fallingOrphans: [], // [{ x, y, vx, vy, color, rot, vRot }]
    particles: [],
    shockwaves: [],
    floatingTexts: [],
    screenShake: 0,
    lastTime: 0
  };

  let canvas = null;
  let ctx = null;
  let animFrameId = null;
  let dpr = 1;
  let canvasW = 480;
  let canvasH = 620;
  let gridOffsetX = 0;
  let gridOffsetY = 50;

  // Shooter Position
  let shooterX = 240;
  let shooterY = 540;

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    setupCanvas();
    loadBestScore();
    bindEvents();
    loadLevel(0);
    render();
  }

  function cacheDom() {
    dom.canvas = document.getElementById('bubble-canvas');
    dom.scoreDisplay = document.getElementById('score-display');
    dom.bestScore = document.getElementById('best-score');
    dom.movesCount = document.getElementById('moves-count');
    dom.remainingCount = document.getElementById('remaining-count');
    dom.levelBadge = document.getElementById('level-badge');
    dom.starProgress = document.getElementById('star-progress');

    dom.audioToggleBtn = document.getElementById('audio-toggle-btn');
    dom.audioIcon = document.getElementById('audio-icon');
    dom.pauseBtn = document.getElementById('pause-btn');

    // Boosters
    dom.boosterBomb = document.getElementById('booster-bomb');
    dom.boosterRainbow = document.getElementById('booster-rainbow');
    dom.boosterLaser = document.getElementById('booster-laser');
    dom.boosterRocket = document.getElementById('booster-rocket');

    // Overlays
    dom.overlayStart = document.getElementById('overlay-start');
    dom.overlayPause = document.getElementById('overlay-pause');
    dom.overlayWin = document.getElementById('overlay-win');
    dom.overlayGameOver = document.getElementById('overlay-gameover');

    dom.startBtn = document.getElementById('start-btn');
    dom.resumeBtn = document.getElementById('resume-btn');
    dom.restartBtn = document.getElementById('restart-btn');
    dom.nextLevelBtn = document.getElementById('next-level-btn');
    dom.playAgainBtn = document.getElementById('play-again-btn');
    dom.gameOverRestartBtn = document.getElementById('gameover-restart-btn');

    dom.winScoreVal = document.getElementById('win-score-val');
    dom.winShotsVal = document.getElementById('win-shots-val');
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
    canvasH = rect.height || 620;

    canvas.width = Math.floor(canvasW * dpr);
    canvas.height = Math.floor(canvasH * dpr);
    ctx.scale(dpr, dpr);

    // Grid offsets
    gridOffsetX = Math.floor((canvasW - (BubbleBoard.EVEN_COLS * BUBBLE_RADIUS * 2)) / 2);
    gridOffsetY = 45;

    shooterX = Math.floor(canvasW / 2);
    shooterY = Math.floor(canvasH - 72);
  }

  function loadBestScore() {
    state.bestScore = parseInt(localStorage.getItem('arcade_bubbleshooter_best') || '0', 10);
    if (dom.bestScore) dom.bestScore.textContent = state.bestScore;
  }

  function saveBestScore() {
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      try {
        localStorage.setItem('arcade_bubbleshooter_best', state.bestScore.toString());
      } catch (e) {}
      if (dom.bestScore) dom.bestScore.textContent = state.bestScore;
    }
  }

  function loadLevel(idx) {
    state.levelIndex = idx;
    const Board = window.BubbleBoard;
    const lvl = Board ? Board.createLevelGrid(idx) : { levelInfo: { moves: 22, name: 'Level 1' }, grid: [] };

    state.levelInfo = lvl.levelInfo;
    state.grid = lvl.grid;
    state.shotsLeft = lvl.levelInfo.moves || 22;
    state.totalShots = state.shotsLeft;
    state.flyingBall = null;
    state.fallingOrphans = [];
    state.particles = [];
    state.shockwaves = [];
    state.floatingTexts = [];
    state.activeBooster = null;
    state.aimAngle = -Math.PI / 2;
    state.isAiming = true;
    state.status = 'ready';

    // Pick initial colors from grid
    pickNextColors();

    updateHUD();
    showOverlay(dom.overlayStart);
  }

  function pickNextColors() {
    const Board = window.BubbleBoard;
    const remaining = Board ? Board.getRemainingColors(state.grid) : [0, 1];
    const available = remaining.length > 0 ? remaining : (state.levelInfo?.activeColors || [0, 1]);

    state.currentBubbleColor = available[Math.floor(Math.random() * available.length)];
    state.nextBubbleColor = available[Math.floor(Math.random() * available.length)];
  }

  function swapBubbles() {
    if (state.flyingBall || state.status !== 'playing') return;
    const tmp = state.currentBubbleColor;
    state.currentBubbleColor = state.nextBubbleColor;
    state.nextBubbleColor = tmp;
    window.BubbleAudio?.playSwap();
    render();
  }

  function startGameplay() {
    state.status = 'playing';
    hideAllOverlays();
    startLoop();
  }

  // Loop & Delta Time
  function startLoop() {
    state.lastTime = performance.now();
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function stopLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    state.lastTime = 0;
  }

  function gameLoop(timestamp) {
    const currentTime = timestamp || performance.now();
    if (!state.lastTime) state.lastTime = currentTime;
    let dt = (currentTime - state.lastTime) / 1000;
    state.lastTime = currentTime;

    if (dt > 0.05) dt = 0.05;
    const timeScale = dt * 60;

    if (state.status === 'playing') {
      update(timeScale);
    }
    render();

    if (state.status === 'playing' || state.flyingBall || state.fallingOrphans.length > 0 || state.particles.length > 0) {
      animFrameId = requestAnimationFrame(gameLoop);
    } else {
      animFrameId = null;
    }
  }

  // Update
  function update(timeScale) {
    // 1. Update Flying Ball
    if (state.flyingBall) {
      updateFlyingBall(timeScale);
    }

    // 2. Update Falling Orphan Bubbles
    for (let i = state.fallingOrphans.length - 1; i >= 0; i--) {
      const orb = state.fallingOrphans[i];
      orb.x += orb.vx * timeScale;
      orb.y += orb.vy * timeScale;
      orb.vy += 0.45 * timeScale; // Gravity
      orb.rot += orb.vRot * timeScale;

      if (orb.y > canvasH + 40) {
        state.fallingOrphans.splice(i, 1);
      }
    }

    // 3. Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.vy += 0.2 * timeScale;
      p.alpha -= p.decay * timeScale;
      if (p.alpha <= 0) {
        state.particles.splice(i, 1);
      }
    }

    // 4. Update Shockwaves
    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
      const sw = state.shockwaves[i];
      sw.radius += 2.5 * timeScale;
      sw.alpha -= 0.04 * timeScale;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        state.shockwaves.splice(i, 1);
      }
    }

    // 5. Update Floating Texts
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y += ft.vy * timeScale;
      ft.alpha -= 0.02 * timeScale;
      if (ft.alpha <= 0) {
        state.floatingTexts.splice(i, 1);
      }
    }

    // 6. Screen Shake
    if (state.screenShake > 0) {
      state.screenShake *= Math.pow(0.85, timeScale);
      if (state.screenShake < 0.2) state.screenShake = 0;
    }
  }

  function updateFlyingBall(timeScale) {
    const ball = state.flyingBall;
    ball.x += ball.vx * timeScale;
    ball.y += ball.vy * timeScale;

    const leftWall = gridOffsetX + BUBBLE_RADIUS;
    const rightWall = canvasW - gridOffsetX - BUBBLE_RADIUS;
    const ceiling = gridOffsetY + BUBBLE_RADIUS;

    // Wall bounce
    if (ball.x <= leftWall && ball.vx < 0) {
      ball.x = leftWall;
      ball.vx = -ball.vx;
      window.BubbleAudio?.playWallBounce();
      spawnWallSparks(leftWall, ball.y);
    } else if (ball.x >= rightWall && ball.vx > 0) {
      ball.x = rightWall;
      ball.vx = -ball.vx;
      window.BubbleAudio?.playWallBounce();
      spawnWallSparks(rightWall, ball.y);
    }

    // Ceiling Collision
    if (ball.y <= ceiling) {
      snapBallToGrid(ball.x, ceiling);
      return;
    }

    // Check collision with existing bubbles
    for (let r = 0; r < state.grid.length; r++) {
      const cols = (r % 2 === 0) ? BubbleBoard.EVEN_COLS : BubbleBoard.ODD_COLS;
      for (let c = 0; c < cols; c++) {
        if (state.grid[r][c] === null) continue;
        const bPos = BubbleBoard.getBubbleCenter(r, c, gridOffsetX, gridOffsetY, BUBBLE_RADIUS);
        const distSq = (ball.x - bPos.x) ** 2 + (ball.y - bPos.y) ** 2;

        if (distSq <= (BUBBLE_RADIUS * 1.82) ** 2) {
          snapBallToGrid(ball.x, ball.y);
          return;
        }
      }
    }
  }

  function fireBall() {
    if (state.flyingBall || state.status !== 'playing' || state.shotsLeft <= 0) return;

    // Launch flying ball
    const speed = BALL_SPEED;
    state.flyingBall = {
      x: shooterX,
      y: shooterY,
      vx: speed * Math.cos(state.aimAngle),
      vy: speed * Math.sin(state.aimAngle),
      color: state.currentBubbleColor,
      booster: state.activeBooster
    };

    state.activeBooster = null;
    clearBoosterButtons();
    window.BubbleAudio?.playShot();

    state.shotsLeft--;
    updateHUD();
  }

  function snapBallToGrid(hitX, hitY) {
    const ball = state.flyingBall;
    state.flyingBall = null;

    const Board = window.BubbleBoard;
    const slot = Board.findBestVacantCell(hitX, hitY, state.grid, gridOffsetX, gridOffsetY, BUBBLE_RADIUS);

    if (!slot) {
      // Emergency: could not attach, place in top vacant or game over
      return;
    }

    // Check Booster Special Effect
    if (ball.booster === 'bomb') {
      window.BubbleAudio?.playBomb();
      triggerBombExplosion(slot.r, slot.c);
    } else {
      // Normal placement
      state.grid[slot.r][slot.c] = ball.color;
      window.BubbleAudio?.playSnap();

      // Check Match-3+
      const cluster = Board.findMatchCluster(state.grid, slot.r, slot.c);
      if (cluster.length >= 3) {
        popCluster(cluster);
      }
    }

    // Check Floating Orphans (Avalanche)
    checkAndDropOrphans();

    // Check Win / Loss conditions
    checkGameStatus();

    // Pick next colors
    state.currentBubbleColor = state.nextBubbleColor;
    const remaining = Board.getRemainingColors(state.grid);
    if (remaining.length > 0) {
      state.nextBubbleColor = remaining[Math.floor(Math.random() * remaining.length)];
    }

    updateHUD();
  }

  function popCluster(cluster) {
    const Board = window.BubbleBoard;
    const count = cluster.length;
    const points = count * 100 + (count >= 5 ? 250 : 0);
    state.score += points;
    saveBestScore();

    window.BubbleAudio?.playPop(count);

    let avgX = 0;
    let avgY = 0;
    const theme = Board.BUBBLE_COLORS[cluster[0].color] || { fill: '#ff784f' };

    cluster.forEach(cell => {
      const pos = Board.getBubbleCenter(cell.r, cell.c, gridOffsetX, gridOffsetY, BUBBLE_RADIUS);
      avgX += pos.x;
      avgY += pos.y;
      spawnParticles(pos.x, pos.y, theme.fill, 8);
      state.grid[cell.r][cell.c] = null;
    });

    avgX /= count;
    avgY /= count;

    // Shockwave & Text
    state.shockwaves.push({ x: avgX, y: avgY, radius: 10, maxRadius: count * 8, color: theme.fill, alpha: 0.8 });
    spawnFloatingText(avgX, avgY - 10, `+${points}`, theme.fill);
    state.screenShake = Math.min(8, 2 + count * 0.5);

    if (dom.srAnnouncer) {
      dom.srAnnouncer.textContent = `Popped ${count} bubbles! Score: ${state.score}`;
    }
  }

  function triggerBombExplosion(centerR, centerC) {
    const Board = window.BubbleBoard;
    const toPop = [{ r: centerR, c: centerC }];
    const neighbors = Board.getHexNeighbors(centerR, centerC, state.grid.length);

    neighbors.forEach(n => {
      toPop.push(n);
      // 2nd ring neighbors
      const secondRing = Board.getHexNeighbors(n.r, n.c, state.grid.length);
      secondRing.forEach(sn => toPop.push(sn));
    });

    let poppedCount = 0;
    const pos = Board.getBubbleCenter(centerR, centerC, gridOffsetX, gridOffsetY, BUBBLE_RADIUS);

    toPop.forEach(cell => {
      if (state.grid[cell.r] && state.grid[cell.r][cell.c] !== null) {
        state.grid[cell.r][cell.c] = null;
        poppedCount++;
      }
    });

    const pts = Math.max(300, poppedCount * 120);
    state.score += pts;
    saveBestScore();

    spawnParticles(pos.x, pos.y, '#ff784f', 24);
    state.shockwaves.push({ x: pos.x, y: pos.y, radius: 10, maxRadius: 110, color: '#ff784f', alpha: 0.9 });
    spawnFloatingText(pos.x, pos.y, `BOOM! +${pts}`, '#ff784f');
    state.screenShake = 10;
  }

  function checkAndDropOrphans() {
    const Board = window.BubbleBoard;
    const orphans = Board.findOrphanBubbles(state.grid);

    if (orphans.length > 0) {
      window.BubbleAudio?.playOrphanFall();
      const bonus = orphans.length * 150;
      state.score += bonus;
      saveBestScore();

      orphans.forEach(orb => {
        const pos = Board.getBubbleCenter(orb.r, orb.c, gridOffsetX, gridOffsetY, BUBBLE_RADIUS);
        state.fallingOrphans.push({
          x: pos.x,
          y: pos.y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * -2 - 1,
          color: orb.color,
          rot: 0,
          vRot: (Math.random() - 0.5) * 0.15
        });
        state.grid[orb.r][orb.c] = null;
      });

      spawnFloatingText(canvasW / 2, canvasH / 2, `AVALANCHE! +${bonus}`, '#38bdf8');
    }
  }

  function checkGameStatus() {
    const Board = window.BubbleBoard;
    const remaining = Board.countActiveBubbles(state.grid);

    if (remaining === 0) {
      // Wave Cleared!
      handleLevelCleared();
    } else if (state.shotsLeft <= 0 && !state.flyingBall) {
      // Out of shots
      handleGameOver('Out of Ammo!');
    } else {
      // Check if bubbles reached danger ceiling limit
      for (let c = 0; c < state.grid[state.grid.length - 2]?.length; c++) {
        if (state.grid[state.grid.length - 2][c] !== null) {
          handleGameOver('Bubbles reached the danger line!');
          return;
        }
      }
    }
  }

  function handleLevelCleared() {
    state.status = 'cleared';
    stopLoop();
    window.BubbleAudio?.playWin();
    launchConfetti();

    if (dom.winScoreVal) dom.winScoreVal.textContent = state.score;
    if (dom.winShotsVal) dom.winShotsVal.textContent = `${state.totalShots - state.shotsLeft} / ${state.totalShots}`;
    if (dom.winStarsVal) dom.winStarsVal.textContent = state.shotsLeft >= 6 ? '★★★' : (state.shotsLeft >= 3 ? '★★☆' : '★☆☆');

    showOverlay(dom.overlayWin);
  }

  function handleGameOver(reason) {
    state.status = 'gameover';
    stopLoop();
    window.BubbleAudio?.playGameOver();

    if (dom.goScoreVal) dom.goScoreVal.textContent = state.score;
    const sub = dom.overlayGameOver?.querySelector('.overlay-subtitle');
    if (sub) sub.textContent = reason || 'No more moves remaining!';

    showOverlay(dom.overlayGameOver);
  }

  // Spawners
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.025
      });
    }
  }

  function spawnWallSparks(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = Math.random() * 3 + 1;
      state.particles.push({
        x,
        y,
        vx: (x < canvasW / 2 ? 1 : -1) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color: '#ff784f',
        alpha: 1,
        decay: 0.04
      });
    }
  }

  function spawnFloatingText(x, y, text, color) {
    state.floatingTexts.push({ x, y, text, color, alpha: 1, vy: -1.3 });
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

    // Background
    ctx.fillStyle = '#10120f';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Playfield Pillars & Borders
    drawPlayfieldFrame();

    // Grid Bubbles
    drawGridBubbles();

    // Falling Orphan Bubbles
    drawFallingOrphans();

    // Aiming Trajectory & Wall Reflection Points (matching screenshot!)
    if (state.isAiming && !state.flyingBall && state.status === 'playing') {
      drawAimingTrajectory();
    }

    // Flying Ball
    if (state.flyingBall) {
      drawGlossyBubble(state.flyingBall.x, state.flyingBall.y, BUBBLE_RADIUS, state.flyingBall.color, false);
    }

    // Shooter Platform & Loaded Cannon
    drawShooter();

    // Shockwaves & Particles
    drawShockwaves();
    drawParticles();

    // Floating Texts
    drawFloatingTexts();

    ctx.restore();
  }

  function drawPlayfieldFrame() {
    const leftWall = gridOffsetX + BUBBLE_RADIUS;
    const rightWall = canvasW - gridOffsetX - BUBBLE_RADIUS;

    // Side wall borders with cyber glow
    ctx.strokeStyle = 'rgba(244, 242, 233, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftWall - BUBBLE_RADIUS, 0);
    ctx.lineTo(leftWall - BUBBLE_RADIUS, canvasH);
    ctx.moveTo(rightWall + BUBBLE_RADIUS, 0);
    ctx.lineTo(rightWall + BUBBLE_RADIUS, canvasH);
    ctx.stroke();

    // Danger line at bottom
    ctx.strokeStyle = 'rgba(255, 120, 79, 0.2)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(leftWall - BUBBLE_RADIUS, shooterY - 45);
    ctx.lineTo(rightWall + BUBBLE_RADIUS, shooterY - 45);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawGridBubbles() {
    const Board = window.BubbleBoard;
    for (let r = 0; r < state.grid.length; r++) {
      const cols = (r % 2 === 0) ? Board.EVEN_COLS : Board.ODD_COLS;
      for (let c = 0; c < cols; c++) {
        const color = state.grid[r][c];
        if (color === null) continue;
        const pos = Board.getBubbleCenter(r, c, gridOffsetX, gridOffsetY, BUBBLE_RADIUS);
        drawGlossyBubble(pos.x, pos.y, BUBBLE_RADIUS, color, false);
      }
    }
  }

  function drawFallingOrphans() {
    state.fallingOrphans.forEach(orb => {
      drawGlossyBubble(orb.x, orb.y, BUBBLE_RADIUS, orb.color, false);
    });
  }

  function drawGlossyBubble(x, y, radius, colorIdx, isGhost) {
    const Board = window.BubbleBoard;
    const theme = (Board?.BUBBLE_COLORS || [])[colorIdx] || { fill: '#ff784f', glow: '#ffa07a', symbol: '●' };

    ctx.save();
    if (isGhost) {
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = theme.glow;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Outer Glow
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 8;

    // Radial Gradient
    const grad = ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.35,
      radius * 0.1,
      x,
      y,
      radius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, theme.glow);
    grad.addColorStop(0.85, theme.fill);
    grad.addColorStop(1, '#10120f');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Specular Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.32, y - radius * 0.32, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawAimingTrajectory() {
    const Board = window.BubbleBoard;
    const traj = Board.calculateTrajectory(
      shooterX,
      shooterY,
      state.aimAngle,
      canvasW,
      canvasH,
      state.grid,
      gridOffsetX,
      gridOffsetY,
      BUBBLE_RADIUS
    );

    ctx.save();

    // 1. Draw Laser Segments
    ctx.strokeStyle = '#ff784f';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff784f';
    ctx.shadowBlur = 10;

    traj.segments.forEach((seg, idx) => {
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    });

    // 2. Draw Bright Ricochet Sparks at Wall Bounce Points (exactly as in screenshot!)
    traj.bouncePoints.forEach(bp => {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ff784f';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Draw Target Landing Ghost Bubble
    if (traj.targetSlot) {
      drawGlossyBubble(traj.targetSlot.x, traj.targetSlot.y, BUBBLE_RADIUS, state.currentBubbleColor, true);
    }

    ctx.restore();
  }

  function drawShooter() {
    ctx.save();

    // 1. Next Bubble Queue (behind/right of shooter)
    const nextX = shooterX + 32;
    const nextY = shooterY + 16;
    drawGlossyBubble(nextX, nextY, BUBBLE_RADIUS * 0.72, state.nextBubbleColor, false);

    // Swap Icon / Reticle Ring
    ctx.strokeStyle = 'rgba(244, 242, 233, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(nextX, nextY, BUBBLE_RADIUS * 0.88, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Main Cannon Ring
    ctx.strokeStyle = 'rgba(255, 120, 79, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shooterX, shooterY, BUBBLE_RADIUS + 6, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Current Loaded Bubble
    drawGlossyBubble(shooterX, shooterY, BUBBLE_RADIUS, state.currentBubbleColor, false);

    // 4. Ammo Count inside Loaded Bubble (like "19" in the reference image!)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(state.shotsLeft.toString(), shooterX, shooterY + 1);

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
    if (dom.movesCount) dom.movesCount.textContent = `Shots: ${state.shotsLeft}`;

    if (dom.levelBadge) {
      dom.levelBadge.textContent = `WAVE ${state.levelIndex + 1}`;
    }

    if (dom.remainingCount) {
      const Board = window.BubbleBoard;
      const rem = Board ? Board.countActiveBubbles(state.grid) : 0;
      dom.remainingCount.textContent = `Remaining: ${rem}`;
    }

    if (dom.starProgress) {
      const target = state.levelInfo?.targetScore || 2500;
      const pct = Math.min(100, Math.floor((state.score / target) * 100));
      dom.starProgress.style.width = `${pct}%`;
    }
  }

  function clearBoosterButtons() {
    [dom.boosterBomb, dom.boosterRainbow, dom.boosterLaser, dom.boosterRocket].forEach(b => {
      b?.classList.remove('active');
    });
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
  }

  // Events & Aiming
  function bindEvents() {
    window.addEventListener('resize', () => {
      setupCanvas();
      render();
    });

    // Pointer Aiming on Canvas
    dom.canvas?.addEventListener('mousemove', handlePointerMove);
    dom.canvas?.addEventListener('click', handlePointerClick);

    dom.canvas?.addEventListener('touchstart', handleTouchAim, { passive: false });
    dom.canvas?.addEventListener('touchmove', handleTouchAim, { passive: false });
    dom.canvas?.addEventListener('touchend', handleTouchRelease, { passive: false });

    // Keyboard
    window.addEventListener('keydown', handleKeydown);

    // Boosters
    dom.boosterBomb?.addEventListener('click', () => toggleBooster('bomb', dom.boosterBomb));
    dom.boosterRainbow?.addEventListener('click', () => toggleBooster('rainbow', dom.boosterRainbow));
    dom.boosterLaser?.addEventListener('click', () => toggleBooster('laser', dom.boosterLaser));
    dom.boosterRocket?.addEventListener('click', () => toggleBooster('rocket', dom.boosterRocket));

    // Overlays
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
      loadLevel(state.levelIndex);
    });

    dom.nextLevelBtn?.addEventListener('click', () => {
      window.BubbleAudio?.playClick();
      loadLevel(state.levelIndex + 1);
    });

    dom.playAgainBtn?.addEventListener('click', () => {
      window.BubbleAudio?.playClick();
      loadLevel(0);
    });

    dom.gameOverRestartBtn?.addEventListener('click', () => {
      window.BubbleAudio?.playClick();
      loadLevel(state.levelIndex);
    });

    dom.pauseBtn?.addEventListener('click', togglePause);

    if (dom.audioToggleBtn) {
      updateAudioIcon();
      dom.audioToggleBtn.addEventListener('click', () => {
        const isMuted = window.BubbleAudio?.toggleMute();
        updateAudioIcon(isMuted);
      });
    }
  }

  function handlePointerMove(e) {
    if (state.status !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    updateAimAngle(mx, my);
  }

  function handlePointerClick(e) {
    if (state.status === 'ready') {
      startGameplay();
      return;
    }
    if (state.status !== 'playing') return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if clicked the Next Bubble Queue (swap)
    const distToSwap = Math.hypot(mx - (shooterX + 32), my - (shooterY + 16));
    if (distToSwap <= 22) {
      swapBubbles();
      return;
    }

    updateAimAngle(mx, my);
    fireBall();
  }

  function handleTouchAim(e) {
    e.preventDefault();
    if (e.touches && e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      const tx = e.touches[0].clientX - rect.left;
      const ty = e.touches[0].clientY - rect.top;
      updateAimAngle(tx, ty);
    }
  }

  function handleTouchRelease(e) {
    e.preventDefault();
    if (state.status === 'ready') {
      startGameplay();
      return;
    }
    if (state.status === 'playing') {
      fireBall();
    }
  }

  function updateAimAngle(targetX, targetY) {
    const dx = targetX - shooterX;
    const dy = targetY - shooterY;
    let angle = Math.atan2(dy, dx);

    // Clamp angle so cannon only aims upwards (between -165deg and -15deg)
    const minAngle = -Math.PI * 0.92;
    const maxAngle = -Math.PI * 0.08;

    if (angle > 0) {
      angle = dx < 0 ? minAngle : maxAngle;
    } else {
      angle = Math.max(minAngle, Math.min(maxAngle, angle));
    }

    state.aimAngle = angle;
    if (state.status === 'playing' && !animFrameId) {
      render();
    }
  }

  function toggleBooster(type, buttonEl) {
    window.BubbleAudio?.playClick();
    if (state.activeBooster === type) {
      state.activeBooster = null;
      buttonEl?.classList.remove('active');
    } else {
      clearBoosterButtons();
      state.activeBooster = type;
      buttonEl?.classList.add('active');
    }
  }

  function handleKeydown(e) {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // Aim left/right
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      state.aimAngle = Math.max(-Math.PI * 0.92, state.aimAngle - 0.05);
      render();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      state.aimAngle = Math.min(-Math.PI * 0.08, state.aimAngle + 0.05);
      render();
    }

    // Fire
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (state.status === 'ready') {
        startGameplay();
      } else if (state.status === 'playing') {
        fireBall();
      }
    }

    // Swap
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      e.preventDefault();
      swapBubbles();
    }

    // Pause
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
    }

    // Restart
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      window.BubbleAudio?.playClick();
      loadLevel(state.levelIndex);
    }

    // Mute
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const isMuted = window.BubbleAudio?.toggleMute();
      updateAudioIcon(isMuted);
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
    const colors = ['#ff784f', '#38bdf8', '#d5ff55', '#a855f7', '#fbbf24'];
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
