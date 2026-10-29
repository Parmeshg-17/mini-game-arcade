/**
 * Dashverse — Parkour Rooftop Runner Controller & Canvas Renderer
 * Multi-layer neon cyberpunk parallax skyline, agile runner kinetics,
 * touch & keyboard controls, character locker, and mission rewards.
 */
(function() {
  'use strict';

  // DOM Elements
  const canvas = document.getElementById('dash-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // HUD
  const distDisplay = document.getElementById('dist-display');
  const shardsDisplay = document.getElementById('shards-display');
  const scoreDisplay = document.getElementById('score-display');
  const multDisplay = document.getElementById('mult-display');
  const runnerBadge = document.getElementById('runner-badge');
  const bestDisplay = document.getElementById('best-display');
  const coinsBalanceDisplay = document.getElementById('coins-balance-display');

  const pauseBtn = document.getElementById('pause-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const missionsBtn = document.getElementById('missions-btn');
  const shopBtn = document.getElementById('shop-btn');

  // Mobile Action Buttons
  const btnTouchJump = document.getElementById('btn-touch-jump');
  const btnTouchSlide = document.getElementById('btn-touch-slide');

  // Overlays
  const overlayStart = document.getElementById('overlay-start');
  const startBtn = document.getElementById('start-btn');
  const startShopBtn = document.getElementById('start-shop-btn');

  const overlayPause = document.getElementById('overlay-pause');
  const resumeBtn = document.getElementById('resume-btn');
  const pauseRestartBtn = document.getElementById('pause-restart-btn');

  const overlayGameover = document.getElementById('overlay-gameover');
  const goDistVal = document.getElementById('go-dist-val');
  const goShardsVal = document.getElementById('go-shards-val');
  const goScoreVal = document.getElementById('go-score-val');
  const goBestVal = document.getElementById('go-best-val');
  const goNewBestBadge = document.getElementById('go-new-best-badge');
  const goMissionsList = document.getElementById('go-missions-list');
  const playAgainBtn = document.getElementById('play-again-btn');
  const goShopBtn = document.getElementById('go-shop-btn');

  const overlayShop = document.getElementById('overlay-shop');
  const closeShopBtn = document.getElementById('close-shop-btn');
  const shopGrid = document.getElementById('shop-grid');
  const shopCoinsVal = document.getElementById('shop-coins-val');

  const overlayMissions = document.getElementById('overlay-missions');
  const closeMissionsBtn = document.getElementById('close-missions-btn');
  const missionsContainer = document.getElementById('missions-container');
  const dailyDateDisplay = document.getElementById('daily-date-display');
  const dailyStatusDisplay = document.getElementById('daily-status-display');

  // Persistence Keys
  const KEY_BEST_DIST = 'dashverse_best_dist';
  const KEY_HIGH_SCORE = 'dashverse_high_score';
  const KEY_COINS = 'dashverse_coins';
  const KEY_EQUIPPED = 'dashverse_equipped';
  const KEY_UNLOCKED = 'dashverse_unlocked';
  const KEY_MISSIONS = 'dashverse_missions';
  const KEY_DAILY_PREFIX = 'dashverse_daily_';

  // Saved Data
  let bestDist = 0;
  let highScore = 0;
  let totalCoins = 0;
  let equippedId = 'dash';
  let unlockedIds = ['dash'];
  let activeMissions = [];

  try {
    bestDist = parseInt(localStorage.getItem(KEY_BEST_DIST) || '0', 10);
    highScore = parseInt(localStorage.getItem(KEY_HIGH_SCORE) || '0', 10);
    totalCoins = parseInt(localStorage.getItem(KEY_COINS) || '0', 10);
    const eq = localStorage.getItem(KEY_EQUIPPED);
    if (eq && DashverseEngine.CHARACTERS.some(c => c.id === eq)) equippedId = eq;
    const un = localStorage.getItem(KEY_UNLOCKED);
    if (un) unlockedIds = JSON.parse(un);
    const mis = localStorage.getItem(KEY_MISSIONS);
    if (mis) activeMissions = JSON.parse(mis);
  } catch (e) {}

  // Initialize missions if none exist
  if (!activeMissions || activeMissions.length < 3) {
    activeMissions = DashverseEngine.MISSIONS_CATALOG.slice(0, 3).map(m => ({ ...m, progress: 0, claimed: false }));
    saveMissions();
  }

  function saveMissions() {
    try {
      localStorage.setItem(KEY_MISSIONS, JSON.stringify(activeMissions));
    } catch (e) {}
  }

  function saveProfile() {
    try {
      localStorage.setItem(KEY_BEST_DIST, bestDist.toString());
      localStorage.setItem(KEY_HIGH_SCORE, highScore.toString());
      localStorage.setItem(KEY_COINS, totalCoins.toString());
      localStorage.setItem(KEY_EQUIPPED, equippedId);
      localStorage.setItem(KEY_UNLOCKED, JSON.stringify(unlockedIds));
    } catch (e) {}
  }

  // Runtime State
  let gameState = null;
  let animFrameId = null;
  let lastTime = 0;
  let cameraX = 0;
  let particleList = [];
  let animTick = 0;

  // Visual Assets Preloader
  const ASSETS = {
    heroBanner: { src: 'assets/hero-banner.avif', img: null, loaded: false },
    charCipher: { src: 'assets/char-cipher.avif', img: null, loaded: false },
    spikes: { src: 'assets/obstacle-spikes.avif', img: null, loaded: false },
    padBoost: { src: 'assets/pad-boost.avif', img: null, loaded: false },
    platformGrass: { src: 'assets/platform-grass.avif', img: null, loaded: false },
    portalGate: { src: 'assets/portal-gate.avif', img: null, loaded: false },
    platformCyber: { src: 'assets/platform-cyber.avif', img: null, loaded: false },
    hazardSlime: { src: 'assets/hazard-slime.avif', img: null, loaded: false },
    gemPrismatic: { src: 'assets/gem-prismatic.avif', img: null, loaded: false }
  };

  Object.keys(ASSETS).forEach(key => {
    const item = ASSETS[key];
    const img = new Image();
    img.onload = () => { item.img = img; item.loaded = true; };
    img.onerror = () => { item.loaded = false; };
    img.src = item.src;
  });

  // Parallax Scenery Elements
  const cityBuildings = [];
  for (let i = 0; i < 18; i++) {
    cityBuildings.push({
      x: i * 80 + Math.random() * 20,
      w: 60 + Math.random() * 50,
      h: 180 + Math.random() * 160,
      color: ['#0d1322', '#090e18', '#11192b', '#070b13'][Math.floor(Math.random() * 4)],
      windows: Math.random() < 0.75,
      antenna: Math.random() < 0.4
    });
  }

  const billboards = [
    { x: 300, y: 140, text: 'CYBER//RUN', color: '#38bdf8' },
    { x: 900, y: 120, text: 'NEON SKY', color: '#d5ff55' },
    { x: 1600, y: 150, text: 'DASHVERSE', color: '#c084fc' },
    { x: 2300, y: 130, text: 'PULSE 99', color: '#ffd166' }
  ];

  /**
   * Reset & Start Game Run
   */
  function startRun(isDaily = false) {
    gameState = DashverseEngine.createGameState(equippedId, isDaily);
    gameState.status = 'running';
    particleList = [];
    cameraX = 0;
    hideAllOverlays();
    updateHUD();
    resizeCanvas();
  }

  function updateHUD() {
    if (!gameState) {
      if (bestDisplay) bestDisplay.textContent = `${bestDist}m`;
      if (coinsBalanceDisplay) coinsBalanceDisplay.textContent = totalCoins.toString();
      return;
    }

    if (distDisplay) distDisplay.textContent = `${Math.floor(gameState.distance)}m`;
    if (shardsDisplay) shardsDisplay.textContent = gameState.coins.toString();
    if (scoreDisplay) scoreDisplay.textContent = gameState.score.toString();
    if (multDisplay) multDisplay.textContent = `x${gameState.multiplier}`;
    if (bestDisplay) bestDisplay.textContent = `${Math.max(bestDist, Math.floor(gameState.distance))}m`;
    if (coinsBalanceDisplay) coinsBalanceDisplay.textContent = totalCoins.toString();

    if (runnerBadge) {
      const char = gameState.character;
      runnerBadge.innerHTML = `<span style="color:${char.color};">●</span> ${char.name}`;
    }

    if (audioIcon) {
      audioIcon.textContent = DashverseAudio.isMuted() ? '🔇' : '🔊';
    }
  }

  /**
   * Canvas Responsive Scaling
   */
  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);

  /**
   * Main Game Loop
   */
  function gameLoop(time) {
    if (!lastTime) lastTime = time;
    const deltaMs = Math.min(33, time - lastTime);
    const deltaFactor = deltaMs / 16.666;
    lastTime = time;
    animTick++;

    if (gameState && gameState.status === 'running') {
      const updateRes = DashverseEngine.updateGameState(gameState, deltaFactor);

      // Audio & Event handling
      if (updateRes && updateRes.event) {
        if (updateRes.event === 'spring_launch') {
          DashverseAudio.playSpring();
          spawnBurst(gameState.runner.x + 20, gameState.runner.y + 40, '#d5ff55', 18);
        } else if (updateRes.event === 'gem_collected') {
          DashverseAudio.playGem();
          spawnBurst(gameState.runner.x + 20, gameState.runner.y + 20, '#38bdf8', 16);
          spawnBurst(gameState.runner.x + 20, gameState.runner.y + 20, '#c084fc', 16);
        } else if (updateRes.event === 'portal_warp') {
          DashverseAudio.playPortal();
          spawnBurst(gameState.runner.x + 20, gameState.runner.y + 20, '#38bdf8', 26);
          spawnBurst(gameState.runner.x + 20, gameState.runner.y + 20, '#ffd166', 26);
        } else if (updateRes.event === 'shield_absorbed') {
          DashverseAudio.playHit();
          spawnBurst(gameState.runner.x + 20, gameState.runner.y + 25, '#38bdf8', 22);
        } else if (updateRes.event === 'crash' || updateRes.event === 'fall_death') {
          handleGameOver();
        }
      }

      // Spawn running spark particles
      if (gameState.runner.isGrounded && Math.random() < 0.6) {
        spawnParticle(
          gameState.runner.x + (gameState.runner.isSliding ? 0 : 8),
          gameState.runner.y + (gameState.runner.isSliding ? 24 : 54),
          (Math.random() - 0.5) * 2 - gameState.speed * 0.3,
          -Math.random() * 2,
          gameState.runner.isSliding ? '#ffd166' : '#38bdf8',
          16
        );
      }

      updateHUD();
    }

    // Render Stage
    renderStage();

    animFrameId = requestAnimationFrame(gameLoop);
  }

  /**
   * Stage Rendering
   */
  function renderStage() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Dynamic Cyber Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0a0d16');
    skyGrad.addColorStop(0.65, '#121829');
    skyGrad.addColorStop(1, '#1b1429');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    if (!gameState) {
      renderParallaxSkyline(w, h, 0);
      return;
    }

    const runner = gameState.runner;
    const speed = gameState.speed;

    // 1. Far Parallax Megacity Skyline
    renderParallaxSkyline(w, h, gameState.distance);

    // 2. Midground Neon Billboards
    renderBillboards(w, h, gameState.distance);

    // 3. Foreground Rooftops
    renderRooftops();

    // 4. Obstacles
    renderObstacles();

    // 5. Collectibles & Data Shards
    renderPickups();

    // 6. Particles
    renderParticles();

    // 7. Parkour Runner Dash
    renderRunner(runner);

    // 8. Overhead Speed Streaks
    renderSpeedStreaks(w, h, speed);
  }

  function renderParallaxSkyline(w, h, dist) {
    const scrollFar = (dist * 1.5) % 800;

    ctx.save();
    cityBuildings.forEach(b => {
      const bx = ((b.x - scrollFar) % 1200 + 1200) % 1200 - 150;
      const by = h - b.h - 40;

      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, b.w, b.h + 80);

      // Building illuminated windows
      if (b.windows) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        for (let wy = by + 20; wy < by + b.h - 15; wy += 22) {
          for (let wx = bx + 8; wx < bx + b.w - 12; wx += 14) {
            if ((wx + wy) % 5 !== 0) {
              ctx.fillRect(wx, wy, 4, 8);
            }
          }
        }
      }

      // Rooftop antenna hazard light
      if (b.antenna) {
        ctx.strokeStyle = '#25344d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx + b.w / 2, by);
        ctx.lineTo(bx + b.w / 2, by - 25);
        ctx.stroke();

        ctx.fillStyle = animTick % 60 < 30 ? '#ff4757' : 'rgba(255, 71, 87, 0.2)';
        ctx.beginPath();
        ctx.arc(bx + b.w / 2, by - 26, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function renderBillboards(w, h, dist) {
    const scrollMid = (dist * 4.0) % 2400;

    ctx.save();
    billboards.forEach(b => {
      const bx = ((b.x - scrollMid) % 2400 + 2400) % 2400 - 200;
      if (bx > -200 && bx < w + 200) {
        ctx.fillStyle = '#10141f';
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;

        ctx.fillRect(bx, b.y, 140, 48);
        ctx.strokeRect(bx, b.y, 140, 48);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(b.text, bx + 70, b.y + 28);
      }
    });
    ctx.restore();
  }

  function renderRooftops() {
    ctx.save();
    gameState.rooftops.forEach(roof => {
      // Main Roof Slab
      ctx.fillStyle = roof.color;
      ctx.fillRect(roof.x, roof.y, roof.w, roof.h);

      // Top Edge Platform Caps (Cyber grid or Grass rooftop)
      if (roof.theme === 'grass' && ASSETS.platformGrass.loaded) {
        const tileW = 54;
        const tileH = 36;
        for (let tx = roof.x; tx < roof.x + roof.w; tx += tileW) {
          const drawW = Math.min(tileW, roof.x + roof.w - tx);
          ctx.drawImage(ASSETS.platformGrass.img, 0, 0, 128, 85, tx, roof.y - 12, drawW, tileH);
        }
      } else if (ASSETS.platformCyber.loaded) {
        const tileW = 54;
        const tileH = 34;
        for (let tx = roof.x; tx < roof.x + roof.w; tx += tileW) {
          const drawW = Math.min(tileW, roof.x + roof.w - tx);
          ctx.drawImage(ASSETS.platformCyber.img, 0, 0, 128, 80, tx, roof.y - 10, drawW, tileH);
        }
      }

      // Glowing Neon Edge Conduit
      ctx.strokeStyle = roof.theme === 'grass' ? '#4ade80' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = roof.theme === 'grass' ? '#4ade80' : '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(roof.x, roof.y);
      ctx.lineTo(roof.x + roof.w, roof.y);
      ctx.stroke();

      // Architecture Facade Panels
      ctx.shadowBlur = 0;
      ctx.strokeStyle = roof.border;
      ctx.lineWidth = 1;
      for (let px = roof.x + 40; px < roof.x + roof.w; px += 75) {
        ctx.beginPath();
        ctx.moveTo(px, roof.y + 10);
        ctx.lineTo(px, roof.y + roof.h);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function renderObstacles() {
    ctx.save();
    gameState.obstacles.forEach(ob => {
      if (ob.type === DashverseEngine.HAZARDS.SPIKES) {
        // Spiked Stone Block Hazard
        if (ASSETS.spikes.loaded) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.drawImage(ASSETS.spikes.img, ob.x - 2, ob.y - 4, ob.w + 4, ob.h + 4);
        } else {
          // Fallback vector spikes
          ctx.fillStyle = '#64748b';
          ctx.fillRect(ob.x, ob.y + 14, ob.w, ob.h - 14);
          ctx.fillStyle = '#e2e8f0';
          for (let sx = ob.x + 4; sx < ob.x + ob.w - 4; sx += 10) {
            ctx.beginPath();
            ctx.moveTo(sx, ob.y + 14);
            ctx.lineTo(sx + 4, ob.y);
            ctx.lineTo(sx + 8, ob.y + 14);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else if (ob.type === DashverseEngine.HAZARDS.SLIME_TRAP) {
        // Toxic Purple Slime Hazard
        if (ASSETS.hazardSlime.loaded) {
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 10;
          ctx.drawImage(ASSETS.hazardSlime.img, ob.x - 2, ob.y - 4, ob.w + 4, ob.h + 4);
        } else {
          ctx.fillStyle = '#7e22ce';
          ctx.fillRect(ob.x, ob.y + 10, ob.w, ob.h - 10);
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(ob.x + 10, ob.y + 8, 6, 0, Math.PI * 2);
          ctx.arc(ob.x + 24, ob.y + 7, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (ob.type === DashverseEngine.HAZARDS.SPRING_PAD) {
        // Directional Boost Arrow Spring Pad
        if (ASSETS.padBoost.loaded) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.drawImage(ASSETS.padBoost.img, ob.x - 4, ob.y - 14, ob.w + 8, ob.h + 16);
        } else {
          ctx.fillStyle = '#d5ff55';
          ctx.shadowColor = '#d5ff55';
          ctx.shadowBlur = 12;
          ctx.fillRect(ob.x, ob.y, ob.w, ob.h);

          ctx.strokeStyle = '#0b0f19';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ob.x + 12, ob.y + 8);
          ctx.lineTo(ob.x + 20, ob.y + 2);
          ctx.lineTo(ob.x + 28, ob.y + 8);
          ctx.stroke();
        }
      } else if (ob.type === DashverseEngine.HAZARDS.VENT) {
        // Air Vent Hurdle
        ctx.fillStyle = '#1e2638';
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 10;
        ctx.strokeRect(ob.x, ob.y, ob.w, ob.h);

        // Vent Slats
        ctx.fillStyle = '#ff4757';
        for (let vy = ob.y + 6; vy < ob.y + ob.h - 4; vy += 6) {
          ctx.fillRect(ob.x + 4, vy, ob.w - 8, 2);
        }
      } else if (ob.type === DashverseEngine.HAZARDS.LASER_BARRIER) {
        // Overhead Laser Pylons
        ctx.fillStyle = '#222d42';
        ctx.fillRect(ob.x, ob.y, 6, ob.h);
        ctx.fillRect(ob.x + ob.w - 6, ob.y, 6, ob.h);

        // Pulsing Laser Core
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(ob.x + 3, ob.y + 8);
        ctx.lineTo(ob.x + ob.w - 3, ob.y + 8);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ob.x + 3, ob.y + 8);
        ctx.lineTo(ob.x + ob.w - 3, ob.y + 8);
        ctx.stroke();
      } else if (ob.type === DashverseEngine.HAZARDS.AERIAL_DRONE) {
        // Patrol Drone
        ctx.fillStyle = '#ffd166';
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ob.x + 17, ob.y + 14, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#10141f';
        ctx.beginPath();
        ctx.arc(ob.x + 17, ob.y + 14, 4, 0, Math.PI * 2);
        ctx.fill();

        // Rotor Blades
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        const rOff = (animTick * 0.4) % Math.PI;
        ctx.beginPath();
        ctx.moveTo(ob.x + 5, ob.y + 4);
        ctx.lineTo(ob.x + 29, ob.y + 4);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function renderPickups() {
    ctx.save();
    gameState.pickups.forEach(p => {
      if (p.collected) return;

      const bobY = Math.sin(animTick * 0.1 + p.x) * 4;

      if (p.type === DashverseEngine.PICKUPS.PRISMATIC_GEM) {
        // Glowing Prismatic Crystal Gem
        if (ASSETS.gemPrismatic.loaded) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
          ctx.drawImage(ASSETS.gemPrismatic.img, p.x - 2, p.y + bobY - 2, p.w + 4, p.h + 4);
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, p.y + bobY);
          ctx.lineTo(p.x + p.w, p.y + p.h / 2 + bobY);
          ctx.lineTo(p.x + p.w / 2, p.y + p.h + bobY);
          ctx.lineTo(p.x, p.y + p.h / 2 + bobY);
          ctx.closePath();
          ctx.fill();
        }
      } else if (p.type === DashverseEngine.PICKUPS.WARP_PORTAL) {
        // Dimensional Delivery Warp Portal
        if (ASSETS.portalGate.loaded) {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 18;
          ctx.drawImage(ASSETS.portalGate.img, p.x - 4, p.y + bobY - 6, p.w + 8, p.h + 10);
        } else {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2 + bobY, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (p.type === DashverseEngine.PICKUPS.DATA_SHARD) {
        // Glowing Data Shard Crystal
        ctx.fillStyle = '#d5ff55';
        ctx.shadowColor = '#d5ff55';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(p.x + 8, p.y + bobY);
        ctx.lineTo(p.x + 14, p.y + 8 + bobY);
        ctx.lineTo(p.x + 8, p.y + 16 + bobY);
        ctx.lineTo(p.x + 2, p.y + 8 + bobY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x + 8, p.y + 8 + bobY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === DashverseEngine.PICKUPS.CYBER_PACKAGE) {
        // Gold Delivery Package
        ctx.fillStyle = '#ffd166';
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 14;
        ctx.fillRect(p.x, p.y + bobY, 20, 20);

        ctx.fillStyle = '#ff784f';
        ctx.fillRect(p.x + 7, p.y + bobY, 6, 20);
        ctx.fillRect(p.x, p.y + 7 + bobY, 20, 6);
      } else if (p.type === DashverseEngine.PICKUPS.SHIELD_ORB) {
        // Shield Orb
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(p.x + 10, p.y + 10 + bobY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function renderRunner(runner) {
    ctx.save();

    // Invulnerability Blink
    if (runner.invulnerableTicks > 0 && Math.floor(runner.invulnerableTicks / 4) % 2 === 0) {
      ctx.restore();
      return;
    }

    const char = gameState.character;
    const rx = runner.x;
    const ry = runner.y;

    // Shield Aura
    if (runner.hasShield) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.arc(rx + 24, ry + 28, 36 + Math.sin(animTick * 0.15) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Magnet Field Aura
    if (runner.magnetActive) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(rx + 24, ry + 28, 48 + Math.cos(animTick * 0.2) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 8;
    ctx.shadowColor = char.color;

    // Custom Sprite Rendering for Cipher
    if (char.id === 'cipher' && ASSETS.charCipher.loaded) {
      if (runner.isSliding) {
        ctx.save();
        ctx.translate(rx + 24, ry + 36);
        ctx.rotate(0.32);
        ctx.drawImage(ASSETS.charCipher.img, -24, -20, 48, 44);
        ctx.restore();
        ctx.fillStyle = char.accent;
        ctx.fillRect(rx, ry + 38, 6, 8);
      } else if (!runner.isGrounded) {
        const bobAir = Math.sin(animTick * 0.2) * 2;
        ctx.drawImage(ASSETS.charCipher.img, rx, ry + bobAir, 48, 54);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.fillRect(rx + 14, ry + 48, 8, 8);
        ctx.fillRect(rx + 28, ry + 48, 8, 8);
      } else {
        const runBounce = Math.abs(Math.sin(animTick * 0.35)) * 3;
        ctx.drawImage(ASSETS.charCipher.img, rx, ry - runBounce, 48, 56);
      }
      ctx.restore();
      return;
    }

    if (runner.isSliding) {
      // Sliding posture (low horizontal dash)
      ctx.fillStyle = char.color;
      ctx.fillRect(rx + 4, ry + 32, 44, 20);

      // Visor Glow
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx + 36, ry + 36, 10, 4);

      // Jet exhaust spark
      ctx.fillStyle = char.accent;
      ctx.fillRect(rx, ry + 38, 6, 8);
    } else if (!runner.isGrounded) {
      // Airborne Jump / Vault
      ctx.fillStyle = char.color;
      ctx.fillRect(rx + 12, ry + 8, 24, 38);

      // Helmet / Head
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(rx + 14, ry, 20, 16);
      ctx.fillStyle = char.accent;
      ctx.fillRect(rx + 24, ry + 4, 10, 5); // Visor

      // Sneaker Boost Jets
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fillRect(rx + 10, ry + 44, 10, 8);
      ctx.fillRect(rx + 24, ry + 44, 10, 8);
    } else {
      // Ground Running Cycle
      const legPhase = Math.sin(animTick * 0.35);

      // Body Jacket
      ctx.fillStyle = char.color;
      ctx.fillRect(rx + 12, ry + 12, 22, 28);

      // Head & Glowing Visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(rx + 14, ry, 18, 14);
      ctx.fillStyle = char.accent;
      ctx.fillRect(rx + 22, ry + 3, 10, 5);

      // Dynamic Animated Legs
      ctx.fillStyle = '#1e293b';
      const leg1H = 16 + legPhase * 8;
      const leg2H = 16 - legPhase * 8;
      ctx.fillRect(rx + 14, ry + 40, 8, leg1H);
      ctx.fillRect(rx + 24, ry + 40, 8, leg2H);

      // Neon Sneakers
      ctx.fillStyle = char.accent;
      ctx.fillRect(rx + 16, ry + 40 + leg1H - 4, 10, 4);
      ctx.fillRect(rx + 26, ry + 40 + leg2H - 4, 10, 4);
    }

    ctx.restore();
  }

  function renderParticles() {
    ctx.save();
    for (let i = particleList.length - 1; i >= 0; i--) {
      const p = particleList[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0) {
        particleList.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function renderSpeedStreaks(w, h, speed) {
    if (speed < 9.0) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    const streakCount = Math.floor((speed - 8.0) * 2);

    for (let i = 0; i < streakCount; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * (h - 120);
      const len = 40 + Math.random() * 80;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - len, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function spawnParticle(x, y, vx, vy, color, life, size = 3) {
    particleList.push({ x, y, vx, vy, color, life, maxLife: life, size });
  }

  function spawnBurst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      spawnParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 20 + Math.random() * 15, 2.5);
    }
  }

  /**
   * Game Over & Missions Evaluation
   */
  function handleGameOver() {
    DashverseAudio.playGameOver();

    const distAchieved = Math.floor(gameState.distance);
    const scoreAchieved = gameState.score;
    const coinsEarned = gameState.coins;

    // Save Coins
    totalCoins += coinsEarned;

    // Check High Score & Best Distance
    let isNewBest = false;
    if (distAchieved > bestDist) {
      bestDist = distAchieved;
      isNewBest = true;
    }
    if (scoreAchieved > highScore) {
      highScore = scoreAchieved;
    }

    // Evaluate Active Missions
    const missionRes = DashverseEngine.evaluateMissions(activeMissions, gameState.sessionStats);
    const completedThisRun = [];

    missionRes.forEach((m, idx) => {
      activeMissions[idx].progress = m.progress;
      if (m.isCompleted && !m.claimed) {
        activeMissions[idx].claimed = true;
        totalCoins += m.reward;
        completedThisRun.push(m);
      }
    });

    if (completedThisRun.length > 0) {
      DashverseAudio.playMissionComplete();
    }

    saveProfile();
    saveMissions();

    // Populate Game Over Overlay
    if (goDistVal) goDistVal.textContent = `${distAchieved}m`;
    if (goShardsVal) goShardsVal.textContent = coinsEarned.toString();
    if (goScoreVal) goScoreVal.textContent = scoreAchieved.toString();
    if (goBestVal) goBestVal.textContent = `${bestDist}m`;

    if (goNewBestBadge) {
      goNewBestBadge.style.display = isNewBest ? 'inline-block' : 'none';
    }

    if (goMissionsList) {
      goMissionsList.innerHTML = '';
      if (completedThisRun.length > 0) {
        completedThisRun.forEach(cm => {
          const li = document.createElement('div');
          li.className = 'mission-complete-pill';
          li.innerHTML = `<span>🏆 Mission Complete: ${cm.text}</span><strong>+${cm.reward} Coins</strong>`;
          goMissionsList.appendChild(li);
        });
      }
    }

    setTimeout(() => {
      showOverlay(overlayGameover);
    }, 450);
  }

  /**
   * Character Locker / Shop Modal
   */
  function openShopModal() {
    if (!overlayShop || !shopGrid) return;
    shopGrid.innerHTML = '';
    if (shopCoinsVal) shopCoinsVal.textContent = totalCoins.toString();

    DashverseEngine.CHARACTERS.forEach(char => {
      const isUnlocked = unlockedIds.includes(char.id);
      const isEquipped = equippedId === char.id;
      const isCipher = char.id === 'cipher';
      const isDash = char.id === 'dash';

      let portraitInner = `<div class="char-avatar" style="background:${char.color};"></div>`;
      if (isCipher && ASSETS.charCipher.loaded) {
        portraitInner = `<img src="assets/char-cipher.avif" alt="Cipher" class="char-portrait-img">`;
      } else if (isDash && ASSETS.heroBanner.loaded) {
        portraitInner = `<img src="assets/hero-banner.avif" alt="Dash" class="char-portrait-img">`;
      }

      const card = document.createElement('div');
      card.className = `shop-char-card ${isEquipped ? 'equipped' : (isUnlocked ? 'unlocked' : 'locked')}`;

      card.innerHTML = `
        <div class="char-portrait" style="border-color:${char.color};">
          ${portraitInner}
          <span class="char-title-tag">${char.name}</span>
        </div>
        <div class="char-info">
          <h4 class="char-name">${char.title}</h4>
          <p class="char-desc">${char.desc}</p>
          <div class="char-perk-badge">${char.perk}</div>
        </div>
        <div class="char-action">
          ${isEquipped ? '<button class="btn-equipped" disabled>Equipped</button>' :
            (isUnlocked ? `<button class="btn-arcade-action btn-equip" data-id="${char.id}">Equip</button>` :
              `<button class="btn-buy" data-id="${char.id}" ${totalCoins < char.cost ? 'disabled' : ''}>Unlock: ${char.cost} Coins</button>`)}
        </div>
      `;

      shopGrid.appendChild(card);
    });

    // Bind buy/equip clicks
    shopGrid.querySelectorAll('.btn-equip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        equippedId = id;
        saveProfile();
        updateHUD();
        openShopModal();
      });
    });

    shopGrid.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const c = DashverseEngine.CHARACTERS.find(ch => ch.id === id);
        if (c && totalCoins >= c.cost && !unlockedIds.includes(id)) {
          totalCoins -= c.cost;
          unlockedIds.push(id);
          equippedId = id;
          saveProfile();
          updateHUD();
          DashverseAudio.playMissionComplete();
          openShopModal();
        }
      });
    });

    showOverlay(overlayShop);
  }

  /**
   * Missions & Daily Challenge Modal
   */
  function openMissionsModal() {
    if (!overlayMissions || !missionsContainer) return;
    missionsContainer.innerHTML = '';

    const todayDate = DashverseEngine.getDailySeedDate();
    if (dailyDateDisplay) dailyDateDisplay.textContent = todayDate;
    const dailyCompleted = localStorage.getItem(KEY_DAILY_PREFIX + todayDate) === 'true';
    if (dailyStatusDisplay) {
      dailyStatusDisplay.textContent = dailyCompleted ? 'Completed (2x Reward Claimed)' : 'Target: 800m • Multiplier: 2x';
      dailyStatusDisplay.className = dailyCompleted ? 'highlight-lime' : 'highlight-gold';
    }

    activeMissions.forEach((m, idx) => {
      const isDone = m.progress >= m.goal;
      const pct = Math.min(100, Math.round((m.progress / m.goal) * 100));

      const card = document.createElement('div');
      card.className = `mission-item-card ${isDone ? 'done' : ''}`;
      card.innerHTML = `
        <div class="mission-item-header">
          <span class="mission-text">${m.text}</span>
          <span class="mission-reward">+${m.reward} Coins</span>
        </div>
        <div class="mission-progress-bar">
          <div class="mission-fill" style="width:${pct}%;"></div>
        </div>
        <div class="mission-status-row">
          <span>${m.progress} / ${m.goal}</span>
          <span>${isDone ? '✓ Completed' : `${pct}%`}</span>
        </div>
      `;
      missionsContainer.appendChild(card);
    });

    showOverlay(overlayMissions);
  }

  function showOverlay(el) {
    hideAllOverlays();
    if (el) el.classList.add('active', 'show');
  }

  function hideAllOverlays() {
    [overlayStart, overlayPause, overlayGameover, overlayShop, overlayMissions].forEach(ov => {
      if (ov) ov.classList.remove('active', 'show');
    });
  }

  /**
   * Player Input Actions
   */
  function handleJumpInput() {
    if (!gameState || gameState.status !== 'running') return;
    const res = DashverseEngine.triggerJump(gameState);
    if (res) {
      if (res.action === 'jump') {
        DashverseAudio.playJump();
        spawnBurst(gameState.runner.x + 16, gameState.runner.y + 50, '#38bdf8', 6);
      } else if (res.action === 'double_jump') {
        DashverseAudio.playDoubleJump();
        spawnBurst(gameState.runner.x + 20, gameState.runner.y + 30, '#c084fc', 14);
      }
    }
  }

  function handleSlideInput() {
    if (!gameState || gameState.status !== 'running') return;
    const res = DashverseEngine.triggerSlide(gameState);
    if (res) {
      DashverseAudio.playSlide();
      spawnBurst(gameState.runner.x + 10, gameState.runner.y + 40, '#ffd166', 8);
    }
  }

  /**
   * Touch & Button Bindings
   */
  if (btnTouchJump) {
    btnTouchJump.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleJumpInput();
    });
  }

  if (btnTouchSlide) {
    btnTouchSlide.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handleSlideInput();
    });
  }

  // Swipe / Tap controls directly on Canvas
  let touchStartY = 0;
  let touchStartX = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0) {
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const deltaX = e.changedTouches[0].clientX - touchStartX;

      if (Math.abs(deltaY) > 35) {
        if (deltaY < 0) {
          handleJumpInput(); // Swipe Up
        } else {
          handleSlideInput(); // Swipe Down
        }
      } else {
        // Tap: upper half -> Jump, lower half -> Slide
        const rect = canvas.getBoundingClientRect();
        const tapY = e.changedTouches[0].clientY - rect.top;
        if (tapY < rect.height * 0.6) {
          handleJumpInput();
        } else {
          handleSlideInput();
        }
      }
    }
  }, { passive: true });

  /**
   * Keyboard Bindings
   */
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (overlayStart && overlayStart.classList.contains('show')) {
        startRun();
        return;
      }
      if (overlayGameover && overlayGameover.classList.contains('show')) {
        startRun();
        return;
      }
      handleJumpInput();
      return;
    }

    if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      handleSlideInput();
      return;
    }

    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (pauseBtn) pauseBtn.click();
      return;
    }

    if (e.key === 'r' || e.key === 'R') {
      startRun();
      return;
    }

    if (e.key === 'm' || e.key === 'M') {
      if (audioToggleBtn) audioToggleBtn.click();
      return;
    }
  });

  /**
   * Modal and Menu Controls
   */
  if (startBtn) {
    startBtn.addEventListener('click', () => startRun(false));
  }
  if (startShopBtn) {
    startShopBtn.addEventListener('click', openShopModal);
  }
  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => startRun(false));
  }
  if (goShopBtn) {
    goShopBtn.addEventListener('click', openShopModal);
  }
  if (shopBtn) {
    shopBtn.addEventListener('click', openShopModal);
  }
  if (closeShopBtn) {
    closeShopBtn.addEventListener('click', () => {
      overlayShop.classList.remove('active', 'show');
      if (gameState && gameState.status === 'ready') showOverlay(overlayStart);
    });
  }
  if (missionsBtn) {
    missionsBtn.addEventListener('click', openMissionsModal);
  }
  if (closeMissionsBtn) {
    closeMissionsBtn.addEventListener('click', () => {
      overlayMissions.classList.remove('active', 'show');
      if (gameState && gameState.status === 'ready') showOverlay(overlayStart);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (!gameState || gameState.status === 'gameover' || gameState.status === 'ready') return;
      if (gameState.status === 'running') {
        gameState.status = 'paused';
        pauseBtn.textContent = '▶';
        pauseBtn.title = 'Resume Game';
        showOverlay(overlayPause);
      } else if (gameState.status === 'paused') {
        gameState.status = 'running';
        pauseBtn.textContent = '⏸';
        pauseBtn.title = 'Pause Game';
        hideAllOverlays();
      }
    });
  }

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      if (gameState && gameState.status === 'paused') {
        gameState.status = 'running';
        if (pauseBtn) {
          pauseBtn.textContent = '⏸';
          pauseBtn.title = 'Pause Game';
        }
        hideAllOverlays();
      }
    });
  }

  if (pauseRestartBtn) {
    pauseRestartBtn.addEventListener('click', () => startRun(false));
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      const muted = DashverseAudio.toggleMute();
      if (audioIcon) audioIcon.textContent = muted ? '🔇' : '🔊';
    });
  }

  // Initial State: Title screen
  updateHUD();
  resizeCanvas();
  showOverlay(overlayStart);
  requestAnimationFrame(gameLoop);

})();

