/**
 * Space Dodge — Canvas 2D Space Arcade Game Engine
 * Features:
 * - Multi-layer parallax scrolling starfield
 * - Cyber starship with banking tilt, dual ion thruster trails, and energy shields
 * - Procedural asteroid hazards, plasma comets, space mines, and crystals
 * - Near-miss proximity bonuses and hair-raising evasive maneuvers
 * - Sector campaign (3 progressive waves) & Endless Hyperspace mode
 * - Full mouse, touch, and accessible keyboard controls
 * - Delta-time physics normalization (60Hz / 120Hz / 144Hz)
 */
(function() {
  'use strict';

  // Constants
  const SHIP_BASE_SPEED = 7.5;
  const SHIP_RADIUS = 18;
  const SHIP_HIT_RADIUS = 13;

  // DOM Elements
  const dom = {};

  // Engine State
  const state = {
    mode: 'sector', // 'sector' | 'endless'
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'cleared' | 'gameover'
    sectorIndex: 0,
    sectorInfo: null,

    // Stats
    survivalTime: 0,
    distance: 0,
    dodgesCount: 0,
    crystalsCount: 0,
    nearMissCount: 0,
    score: 0,
    bestScore: 0,

    // Ship
    ship: {
      x: 240,
      y: 520,
      vx: 0,
      vy: 0,
      tilt: 0,
      radius: SHIP_RADIUS,
      hitRadius: SHIP_HIT_RADIUS,
      shield: 1, // Max 2
      empCharged: true,
      invulnerableTimer: 0
    },

    // Entities
    starfield: [],
    obstacles: [],
    particles: [],
    shockwaves: [],
    floatingTexts: [],

    // Systems
    spawnTimer: 0,
    screenShake: 0,
    warpTimer: 0,
    keys: { left: false, right: false, up: false, down: false },
    pointer: { active: false, x: 240, y: 520 },
    lastTime: 0
  };

  let canvas = null;
  let ctx = null;
  let animFrameId = null;
  let dpr = 1;
  let canvasW = 480;
  let canvasH = 640;

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    setupCanvas();
    loadBestScore();
    bindEvents();
    loadSector(0);
    render();
  }

  function cacheDom() {
    dom.canvas = document.getElementById('space-canvas');
    dom.scoreDisplay = document.getElementById('score-display');
    dom.bestDisplay = document.getElementById('best-display');
    dom.timerDisplay = document.getElementById('timer-display');
    dom.dodgesDisplay = document.getElementById('dodges-display');
    dom.distDisplay = document.getElementById('dist-display');
    dom.crystalsDisplay = document.getElementById('crystals-display');
    dom.sectorBadge = document.getElementById('sector-badge');
    dom.shieldIndicator = document.getElementById('shield-indicator');
    dom.empBtn = document.getElementById('emp-btn');

    dom.modeSectorBtn = document.getElementById('mode-sector-btn');
    dom.modeEndlessBtn = document.getElementById('mode-endless-btn');
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
    dom.nextSectorBtn = document.getElementById('next-sector-btn');
    dom.playAgainBtn = document.getElementById('play-again-btn');
    dom.gameOverRestartBtn = document.getElementById('gameover-restart-btn');

    dom.winScoreVal = document.getElementById('win-score-val');
    dom.winDodgesVal = document.getElementById('win-dodges-val');
    dom.winTimeVal = document.getElementById('win-time-val');
    dom.winStarsVal = document.getElementById('win-stars-val');
    dom.goScoreVal = document.getElementById('go-score-val');
    dom.goDistVal = document.getElementById('go-dist-val');
    dom.srAnnouncer = document.getElementById('sr-announcer');
  }

  function setupCanvas() {
    if (!dom.canvas) return;
    canvas = dom.canvas;
    ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;

    canvasW = rect.width || 480;
    canvasH = rect.height || 640;

    canvas.width = Math.floor(canvasW * dpr);
    canvas.height = Math.floor(canvasH * dpr);
    ctx.scale(dpr, dpr);

    // Initialize Starfield
    const Engine = window.SpaceEngine;
    state.starfield = Engine ? Engine.createStarField(80, canvasW, canvasH) : [];
  }

  function loadBestScore() {
    const key = `arcade_spacedodge_best_${state.mode}`;
    state.bestScore = parseInt(localStorage.getItem(key) || '0', 10);
    if (dom.bestDisplay) dom.bestDisplay.textContent = state.bestScore;
  }

  function saveBestScore() {
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      const key = `arcade_spacedodge_best_${state.mode}`;
      try {
        localStorage.setItem(key, state.bestScore.toString());
      } catch (e) {}
      if (dom.bestDisplay) dom.bestDisplay.textContent = state.bestScore;
    }
  }

  function loadSector(idx) {
    state.sectorIndex = idx;
    const Engine = window.SpaceEngine;
    state.sectorInfo = Engine?.SECTORS[idx % (Engine?.SECTORS?.length || 3)] || {
      name: 'Sector 1',
      duration: 35,
      baseSpeed: 3.2,
      hazardTypes: ['asteroid_sm']
    };

    // Reset Flight Stats
    state.survivalTime = 0;
    state.distance = 0;
    state.dodgesCount = 0;
    state.crystalsCount = 0;
    state.nearMissCount = 0;
    state.score = 0;
    state.spawnTimer = 0;
    state.warpTimer = 0;
    state.screenShake = 0;

    state.obstacles = [];
    state.particles = [];
    state.shockwaves = [];
    state.floatingTexts = [];

    // Reset Ship
    state.ship.x = canvasW / 2;
    state.ship.y = canvasH - 120;
    state.ship.vx = 0;
    state.ship.vy = 0;
    state.ship.tilt = 0;
    state.ship.shield = 1;
    state.ship.empCharged = true;
    state.ship.invulnerableTimer = 0;

    state.pointer.active = false;
    state.pointer.x = state.ship.x;
    state.pointer.y = state.ship.y;

    state.status = 'ready';
    updateHUD();
    showOverlay(dom.overlayStart);
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
    let timeScale = dt * 60;

    if (state.warpTimer > 0) {
      state.warpTimer -= dt;
      timeScale *= 0.55; // 45% warp slowdown
    }

    if (state.status === 'playing') {
      update(timeScale, dt);
    }
    render();

    if (state.status === 'playing' || state.particles.length > 0 || state.shockwaves.length > 0) {
      animFrameId = requestAnimationFrame(gameLoop);
    } else {
      animFrameId = null;
    }
  }

  // Update
  function update(timeScale, dt) {
    const Engine = window.SpaceEngine;

    // 1. Time & Distance Progress
    state.survivalTime += dt;
    state.distance += Math.floor((state.sectorInfo?.baseSpeed || 3.5) * 1.8 * timeScale);

    // Compute live score
    state.score = Engine
      ? Engine.calculateScore(state.survivalTime, state.dodgesCount, state.crystalsCount, state.nearMissCount)
      : Math.floor(state.survivalTime * 40) + state.dodgesCount * 60;
    saveBestScore();

    // 2. Sector Clear Check (in Campaign mode)
    if (state.mode === 'sector' && state.survivalTime >= (state.sectorInfo?.duration || 35)) {
      handleSectorCleared();
      return;
    }

    // 3. Update Ship
    updateShip(timeScale);

    // 4. Update Starfield
    updateStarfield(timeScale);

    // 5. Spawning Obstacles & Pickups
    updateSpawning(dt);

    // 6. Update Obstacles & Check Collisions
    updateObstacles(timeScale);

    // 7. Update Particles & Shockwaves
    updateParticles(timeScale);

    // 8. Screen Shake
    if (state.screenShake > 0) {
      state.screenShake *= Math.pow(0.85, timeScale);
      if (state.screenShake < 0.2) state.screenShake = 0;
    }

    updateHUD();
  }

  function updateShip(timeScale) {
    const s = state.ship;

    // Pointer Steering (Touch or Mouse)
    if (state.pointer.active) {
      const dx = state.pointer.x - s.x;
      const dy = state.pointer.y - s.y;
      s.vx = dx * 0.16;
      s.vy = dy * 0.16;
    } else {
      // Keyboard Steering
      let targetVx = 0;
      let targetVy = 0;
      const speed = SHIP_BASE_SPEED;

      if (state.keys.left) targetVx -= speed;
      if (state.keys.right) targetVx += speed;
      if (state.keys.up) targetVy -= speed;
      if (state.keys.down) targetVy += speed;

      s.vx += (targetVx - s.vx) * 0.22 * timeScale;
      s.vy += (targetVy - s.vy) * 0.22 * timeScale;
    }

    // Apply movement
    s.x += s.vx * timeScale;
    s.y += s.vy * timeScale;

    // Banking tilt animation
    const targetTilt = Math.max(-0.4, Math.min(0.4, (s.vx / SHIP_BASE_SPEED) * 0.35));
    s.tilt += (targetTilt - s.tilt) * 0.15 * timeScale;

    // Boundaries clamping
    s.x = Math.max(s.radius + 6, Math.min(canvasW - s.radius - 6, s.x));
    s.y = Math.max(s.radius + 20, Math.min(canvasH - s.radius - 20, s.y));

    // Invulnerability timer decay
    if (s.invulnerableTimer > 0) {
      s.invulnerableTimer -= 0.016 * timeScale;
    }

    // Dual Ion Engine Exhaust Particles
    spawnThrusterParticles();
  }

  function spawnThrusterParticles() {
    const s = state.ship;
    // Left engine and right engine offsets
    const leftX = s.x - 7 * Math.cos(s.tilt);
    const rightX = s.x + 7 * Math.cos(s.tilt);
    const exhaustY = s.y + 16;

    for (let i = 0; i < 2; i++) {
      const exX = i === 0 ? leftX : rightX;
      state.particles.push({
        x: exX + (Math.random() - 0.5) * 3,
        y: exhaustY,
        vx: (Math.random() - 0.5) * 1.2 - s.vx * 0.1,
        vy: Math.random() * 3 + 4,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.4 ? '#38bdf8' : '#d5ff55',
        alpha: 0.85,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  function updateStarfield(timeScale) {
    state.starfield.forEach(star => {
      star.y += star.speed * (1.2 + (state.warpTimer > 0 ? -0.5 : 0)) * timeScale;
      if (star.y > canvasH) {
        star.y = 0;
        star.x = Math.random() * canvasW;
      }
    });
  }

  function updateSpawning(dt) {
    const Engine = window.SpaceEngine;
    if (!Engine) return;

    state.spawnTimer += dt;
    const spawnRate = state.sectorInfo?.spawnRate || 1.2;
    const interval = 1 / spawnRate;

    if (state.spawnTimer >= interval) {
      state.spawnTimer = 0;

      // 1. Hazard Spawning
      const types = state.sectorInfo?.hazardTypes || ['asteroid_sm'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const speedMult = (state.sectorInfo?.baseSpeed || 3.2) / 3.2;

      state.obstacles.push(Engine.createObstacle(chosenType, canvasW, speedMult));

      // 2. Pickup Spawning (15% chance: Crystal, 5% chance: Shield/EMP)
      const roll = Math.random();
      if (roll < 0.15) {
        state.obstacles.push(Engine.createObstacle('crystal', canvasW, speedMult));
      } else if (roll < 0.19 && state.ship.shield < 2) {
        state.obstacles.push(Engine.createObstacle('shield_pickup', canvasW, speedMult));
      } else if (roll < 0.22 && !state.ship.empCharged) {
        state.obstacles.push(Engine.createObstacle('emp_pickup', canvasW, speedMult));
      }
    }
  }

  function updateObstacles(timeScale) {
    const Engine = window.SpaceEngine;
    const s = state.ship;

    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const ob = state.obstacles[i];
      ob.x += ob.vx * timeScale;
      ob.y += ob.vy * timeScale;
      ob.rotation += ob.rotSpeed * timeScale;

      // Comet trail
      if (ob.type === 'comet') {
        ob.trail.push({ x: ob.x, y: ob.y });
        if (ob.trail.length > 8) ob.trail.shift();
      }

      // Check Near-Miss
      if (Engine && s.invulnerableTimer <= 0 && Engine.checkNearMiss(s, ob)) {
        state.nearMissCount++;
        window.SpaceAudio?.playNearMiss();
        spawnFloatingText(s.x, s.y - 18, 'NEAR MISS! +150', '#d5ff55');
      }

      // Check Collision with Ship
      if (Engine && Engine.checkCollision(s, ob)) {
        if (ob.isPickup) {
          handlePickupCollected(ob);
          state.obstacles.splice(i, 1);
          continue;
        } else if (s.invulnerableTimer <= 0) {
          // Hit a hazard!
          const survived = handleHazardImpact(ob);
          state.obstacles.splice(i, 1);
          if (!survived) return;
          continue;
        }
      }

      // Out of bounds cleanup (Dodge successful!)
      if (ob.y > canvasH + 60) {
        if (ob.isHazard) {
          state.dodgesCount++;
        }
        state.obstacles.splice(i, 1);
      }
    }
  }

  function handlePickupCollected(item) {
    if (item.type === 'crystal') {
      state.crystalsCount++;
      window.SpaceAudio?.playCrystal();
      spawnParticles(item.x, item.y, '#fbbf24', 12);
      spawnFloatingText(item.x, item.y, '+250 💎', '#fbbf24');
    } else if (item.type === 'shield_pickup') {
      state.ship.shield = Math.min(2, state.ship.shield + 1);
      window.SpaceAudio?.playShieldDeflect();
      spawnParticles(item.x, item.y, '#38bdf8', 16);
      spawnFloatingText(item.x, item.y, 'SHIELD RESTORED! 🛡️', '#38bdf8');
    } else if (item.type === 'emp_pickup') {
      state.ship.empCharged = true;
      window.SpaceAudio?.playCrystal();
      spawnParticles(item.x, item.y, '#d5ff55', 16);
      spawnFloatingText(item.x, item.y, 'EMP CHARGED! ⚡', '#d5ff55');
    }
    updateHUD();
  }

  function handleHazardImpact(hazard) {
    const s = state.ship;

    if (s.shield > 0) {
      // Shield absorbs the blow!
      s.shield--;
      s.invulnerableTimer = 1.2; // 1.2s invulnerability
      state.screenShake = 7;
      window.SpaceAudio?.playShieldDeflect();

      spawnParticles(s.x, s.y, '#38bdf8', 20);
      state.shockwaves.push({ x: s.x, y: s.y, radius: 10, maxRadius: 75, color: '#38bdf8', alpha: 0.9 });
      spawnFloatingText(s.x, s.y - 20, 'SHIELD DEFLECTED! 🛡️', '#38bdf8');
      updateHUD();
      return true;
    } else {
      // Ship Destroyed -> Game Over
      triggerShipExplosion();
      handleGameOver('Hull Breached by Cosmic Hazard!');
      return false;
    }
  }

  function triggerShipExplosion() {
    const s = state.ship;
    window.SpaceAudio?.playExplosion();
    state.screenShake = 16;
    spawnParticles(s.x, s.y, '#ff784f', 35);
    spawnParticles(s.x, s.y, '#d5ff55', 25);
    state.shockwaves.push({ x: s.x, y: s.y, radius: 10, maxRadius: 130, color: '#ff784f', alpha: 1.0 });
  }

  function triggerEMP() {
    if (!state.ship.empCharged || state.status !== 'playing') return;
    state.ship.empCharged = false;
    window.SpaceAudio?.playEMP();
    state.screenShake = 12;

    const s = state.ship;
    state.shockwaves.push({ x: s.x, y: s.y, radius: 15, maxRadius: 360, color: '#d5ff55', alpha: 1.0 });

    // Vaporize all hazards on screen!
    let vaporizedCount = 0;
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const ob = state.obstacles[i];
      if (ob.isHazard) {
        spawnParticles(ob.x, ob.y, ob.color, 12);
        state.obstacles.splice(i, 1);
        vaporizedCount++;
      }
    }

    const bonus = vaporizedCount * 120;
    state.score += bonus;
    saveBestScore();
    spawnFloatingText(s.x, s.y - 30, `EMP BLAST! +${bonus}`, '#d5ff55');
    updateHUD();
  }

  function handleSectorCleared() {
    state.status = 'cleared';
    stopLoop();
    window.SpaceAudio?.playWin();
    launchConfetti();

    const Engine = window.SpaceEngine;
    const stars = Engine ? Engine.calculateStars(state.score, state.sectorIndex, state.ship.shield + 1) : 3;

    if (dom.winScoreVal) dom.winScoreVal.textContent = state.score;
    if (dom.winDodgesVal) dom.winDodgesVal.textContent = `${state.dodgesCount} Dodges`;
    if (dom.winTimeVal) dom.winTimeVal.textContent = formatTime(state.survivalTime);
    if (dom.winStarsVal) dom.winStarsVal.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    showOverlay(dom.overlayWin);
  }

  function handleGameOver(reason) {
    state.status = 'gameover';
    stopLoop();
    window.SpaceAudio?.playGameOver();

    if (dom.goScoreVal) dom.goScoreVal.textContent = state.score;
    if (dom.goDistVal) dom.goDistVal.textContent = `${state.distance}m`;
    const sub = dom.overlayGameOver?.querySelector('.overlay-subtitle');
    if (sub) sub.textContent = reason || 'Cosmic hazards overwhelmed your cyber craft!';

    showOverlay(dom.overlayGameOver);
  }

  // Particle & FX systems
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 1.5;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  function spawnFloatingText(x, y, text, color) {
    state.floatingTexts.push({ x, y, text, color, alpha: 1, vy: -1.4 });
  }

  function updateParticles(timeScale) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * timeScale;
      p.y += p.vy * timeScale;
      p.alpha -= p.decay * timeScale;
      if (p.alpha <= 0) state.particles.splice(i, 1);
    }

    for (let i = state.shockwaves.length - 1; i >= 0; i--) {
      const sw = state.shockwaves[i];
      sw.radius += 4.5 * timeScale;
      sw.alpha -= 0.035 * timeScale;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) state.shockwaves.splice(i, 1);
    }

    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y += ft.vy * timeScale;
      ft.alpha -= 0.02 * timeScale;
      if (ft.alpha <= 0) state.floatingTexts.splice(i, 1);
    }
  }

  // Rendering
  function render() {
    if (!ctx) return;

    ctx.save();

    // Screen Shake Offset
    if (state.screenShake > 0) {
      const sx = (Math.random() - 0.5) * state.screenShake * 2;
      const sy = (Math.random() - 0.5) * state.screenShake * 2;
      ctx.translate(sx, sy);
    }

    // Deep Space Background
    ctx.fillStyle = '#10120f';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Parallax Starfield
    drawStarfield();

    // Obstacles & Pickups
    drawObstacles();

    // Shockwaves & Particles
    drawParticles();

    // Player Starship
    if (state.status !== 'gameover') {
      drawPlayerShip();
    }

    // Floating Texts
    drawFloatingTexts();

    ctx.restore();
  }

  function drawStarfield() {
    state.starfield.forEach(star => {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  function drawObstacles() {
    state.obstacles.forEach(ob => {
      ctx.save();
      ctx.translate(ob.x, ob.y);
      ctx.rotate(ob.rotation);

      if (ob.type.startsWith('asteroid')) {
        drawAsteroid(ob);
      } else if (ob.type === 'comet') {
        drawComet(ob);
      } else if (ob.type === 'mine') {
        drawMine(ob);
      } else if (ob.type === 'crystal') {
        drawCrystal(ob);
      } else if (ob.type === 'shield_pickup') {
        drawShieldPickup(ob);
      } else if (ob.type === 'emp_pickup') {
        drawEMPPickup(ob);
      }

      ctx.restore();
    });
  }

  function drawAsteroid(ob) {
    ctx.fillStyle = ob.color;
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ob.vertices.forEach((v, idx) => {
      if (idx === 0) ctx.moveTo(v.x, v.y);
      else ctx.lineTo(v.x, v.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crater accents
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(ob.radius * 0.25, -ob.radius * 0.2, ob.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawComet(ob) {
    // Plasma Glow Tail
    ctx.shadowColor = '#ff784f';
    ctx.shadowBlur = 14;

    ctx.fillStyle = '#ff784f';
    ctx.beginPath();
    ctx.arc(0, 0, ob.radius, 0, Math.PI * 2);
    ctx.fill();

    // White hot core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, ob.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMine(ob) {
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;

    // Spikes
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * (ob.radius + 6), Math.sin(a) * (ob.radius + 6));
      ctx.stroke();
    }

    // Core
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, ob.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCrystal(ob) {
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12;

    // Spinning Diamond
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(0, -ob.radius);
    ctx.lineTo(ob.radius * 0.7, 0);
    ctx.lineTo(0, ob.radius);
    ctx.lineTo(-ob.radius * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawShieldPickup(ob) {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, ob.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡️', 0, 1);
  }

  function drawEMPPickup(ob) {
    ctx.shadowColor = '#d5ff55';
    ctx.shadowBlur = 12;

    ctx.strokeStyle = '#d5ff55';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, ob.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#d5ff55';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 1);
  }

  function drawPlayerShip() {
    const s = state.ship;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.tilt);

    // Invulnerability Blink
    if (s.invulnerableTimer > 0 && Math.floor(performance.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 1. Energy Shield Bubble
    if (s.shield > 0) {
      ctx.save();
      ctx.strokeStyle = s.shield === 2 ? '#38bdf8' : 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = s.shield === 2 ? 3 : 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 2, s.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Main Hull (Cyber Fighter)
    ctx.shadowColor = '#d5ff55';
    ctx.shadowBlur = 10;

    // Wings
    ctx.fillStyle = '#1e241c';
    ctx.strokeStyle = '#d5ff55';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -s.radius); // Nose tip
    ctx.lineTo(s.radius * 0.9, s.radius * 0.85); // Right wing tip
    ctx.lineTo(s.radius * 0.4, s.radius * 0.5); // Right inner notch
    ctx.lineTo(0, s.radius * 0.7); // Center rear
    ctx.lineTo(-s.radius * 0.4, s.radius * 0.5); // Left inner notch
    ctx.lineTo(-s.radius * 0.9, s.radius * 0.85); // Left wing tip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Cockpit Canopy
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, -3, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Wingtip Laser Accents
    ctx.fillStyle = '#ff784f';
    ctx.fillRect(s.radius * 0.85, s.radius * 0.4, 2, 6);
    ctx.fillRect(-s.radius * 0.85 - 2, s.radius * 0.4, 2, 6);

    ctx.restore();
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

  function drawFloatingTexts() {
    state.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
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
    if (dom.bestDisplay) dom.bestDisplay.textContent = state.bestScore;
    if (dom.timerDisplay) dom.timerDisplay.textContent = formatTime(state.survivalTime);
    if (dom.dodgesDisplay) dom.dodgesDisplay.textContent = `Dodges: ${state.dodgesCount}`;
    if (dom.distDisplay) dom.distDisplay.textContent = `${state.distance}m`;
    if (dom.crystalsDisplay) dom.crystalsDisplay.textContent = `💎 ${state.crystalsCount}`;

    if (dom.sectorBadge) {
      dom.sectorBadge.textContent = state.mode === 'endless' ? 'HYPERSPACE' : `SECTOR ${state.sectorIndex + 1}`;
    }

    if (dom.shieldIndicator) {
      const shieldTexts = ['SHIELD: OFF', 'SHIELD: 100%', 'SHIELD: OVERCHARGED'];
      dom.shieldIndicator.textContent = shieldTexts[state.ship.shield] || 'SHIELD: OFF';
      dom.shieldIndicator.className = `hud-pill ${state.ship.shield > 0 ? 'highlight-cyan' : 'highlight-coral'}`;
    }

    if (dom.empBtn) {
      dom.empBtn.disabled = !state.ship.empCharged;
      dom.empBtn.classList.toggle('active', state.ship.empCharged);
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
    const muted = isMuted !== undefined ? isMuted : window.SpaceAudio?.isMuted();
    dom.audioIcon.textContent = muted ? '🔇' : '🔊';
  }

  // Events & Controls
  function bindEvents() {
    window.addEventListener('resize', () => {
      setupCanvas();
      render();
    });

    // Touch & Mouse Steering
    dom.canvas?.addEventListener('pointerdown', handlePointerDown);
    dom.canvas?.addEventListener('pointermove', handlePointerMove);
    dom.canvas?.addEventListener('pointerup', handlePointerUp);
    dom.canvas?.addEventListener('pointercancel', handlePointerUp);

    // Keyboard
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);

    // EMP Button
    dom.empBtn?.addEventListener('click', triggerEMP);

    // Overlays
    dom.startBtn?.addEventListener('click', () => {
      window.SpaceAudio?.playClick();
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
      window.SpaceAudio?.playClick();
      loadSector(state.sectorIndex);
    });

    dom.nextSectorBtn?.addEventListener('click', () => {
      window.SpaceAudio?.playClick();
      loadSector(state.sectorIndex + 1);
    });

    dom.playAgainBtn?.addEventListener('click', () => {
      window.SpaceAudio?.playClick();
      loadSector(0);
    });

    dom.gameOverRestartBtn?.addEventListener('click', () => {
      window.SpaceAudio?.playClick();
      loadSector(state.sectorIndex);
    });

    dom.pauseBtn?.addEventListener('click', togglePause);

    if (dom.audioToggleBtn) {
      updateAudioIcon();
      dom.audioToggleBtn.addEventListener('click', () => {
        const isMuted = window.SpaceAudio?.toggleMute();
        updateAudioIcon(isMuted);
      });
    }

    // Mode Selector
    dom.modeSectorBtn?.addEventListener('click', () => {
      if (state.mode === 'sector') return;
      setMode('sector');
    });

    dom.modeEndlessBtn?.addEventListener('click', () => {
      if (state.mode === 'endless') return;
      setMode('endless');
    });
  }

  function setMode(newMode) {
    state.mode = newMode;
    dom.modeSectorBtn?.classList.toggle('active', newMode === 'sector');
    dom.modeSectorBtn?.setAttribute('aria-selected', newMode === 'sector');
    dom.modeEndlessBtn?.classList.toggle('active', newMode === 'endless');
    dom.modeEndlessBtn?.setAttribute('aria-selected', newMode === 'endless');
    loadBestScore();
    loadSector(0);
  }

  function handlePointerDown(e) {
    if (state.status === 'ready') {
      startGameplay();
      return;
    }
    state.pointer.active = true;
    updatePointerCoords(e);
  }

  function handlePointerMove(e) {
    if (state.pointer.active) {
      updatePointerCoords(e);
    }
  }

  function handlePointerUp() {
    state.pointer.active = false;
  }

  function updatePointerCoords(e) {
    const rect = canvas.getBoundingClientRect();
    state.pointer.x = e.clientX - rect.left;
    state.pointer.y = e.clientY - rect.top;
  }

  function handleKeydown(e) {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.keys.down = true;

    // Space: Start Game or EMP Blast
    if (e.key === ' ') {
      e.preventDefault();
      if (state.status === 'ready') {
        startGameplay();
      } else if (state.status === 'playing') {
        triggerEMP();
      }
    }

    // P: Pause/Resume
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
    }

    // R: Restart
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      window.SpaceAudio?.playClick();
      loadSector(state.sectorIndex);
    }

    // M: Mute
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const isMuted = window.SpaceAudio?.toggleMute();
      updateAudioIcon(isMuted);
    }
  }

  function handleKeyup(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.keys.down = false;
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
    const colors = ['#d5ff55', '#38bdf8', '#ff784f', '#fbbf24', '#ffffff'];
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

