/**
 * Dashverse — Pure Headless Parkour Runner & Physics Engine
 * Handles player kinetics, jumping, double jumping, sliding hitboxes,
 * rooftop procedural terrain, obstacle collisions, character perks,
 * mission tracking, and daily challenge generation.
 */
(function(exports) {
  'use strict';

  // Physics & Gameplay Constants
  const GRAVITY = 0.65;
  const JUMP_FORCE = -12.5;
  const DOUBLE_JUMP_FORCE = -11.0;
  const BASE_SPEED = 6.0;
  const MAX_SPEED = 14.0;
  const SPEED_ACCEL = 0.0008; // speed gain per distance unit
  const SLIDE_DURATION = 32;  // ticks (~0.5s at 60fps)
  const GROUND_Y = 360;       // baseline rooftop height
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 450;

  // Hitbox Dimensions
  const HITBOX = {
    RUN:   { w: 34, h: 56, offsetX: 10, offsetY: 0 },
    SLIDE: { w: 50, h: 26, offsetX: 2,  offsetY: 30 },
    JUMP:  { w: 32, h: 48, offsetX: 10, offsetY: 4 }
  };

  // Obstacle & Hazard Types
  const HAZARDS = {
    VENT: 'vent',                   // Low ground hurdle (Jump over)
    SPIKES: 'spikes',               // Spiked stone block hazard (Jump over)
    SLIME_TRAP: 'slime_trap',       // Toxic purple slime obstacle (Jump over)
    LASER_BARRIER: 'laser_barrier', // High security beam (Slide under)
    AERIAL_DRONE: 'aerial_drone',   // Flying drone (Dodge)
    ROOFTOP_GAP: 'rooftop_gap',     // Pit between buildings (Jump across)
    SPRING_PAD: 'spring_pad'        // Directional boost launcher
  };

  // Collectibles
  const PICKUPS = {
    DATA_SHARD: 'data_shard',       // +10 pts, +1 cyber coin
    PRISMATIC_GEM: 'prismatic_gem', // +50 pts, +5 coins (Rare glowing gem)
    CYBER_PACKAGE: 'cyber_package', // +100 pts, mission item
    WARP_PORTAL: 'warp_portal',     // +500 pts, dimensional checkpoint
    SHIELD_ORB: 'shield_orb',       // 1-hit invulnerability barrier
    MAGNET_ORB: 'magnet_orb'        // Attracts all shards for 8s
  };

  // Playable Character Registry
  const CHARACTERS = [
    {
      id: 'dash',
      name: 'Dash',
      title: 'The Agile Courier',
      cost: 0,
      color: '#38bdf8', // Neon Cyan
      accent: '#d5ff55', // Lime
      avatar: 'assets/dashverse.avif',
      desc: 'Balanced parkour agility with rapid recovery. The legendary metropolis courier.',
      perk: 'Balanced Agility',
      magnetRadius: 70,
      jumpBonus: 1.0,
      coinMultiplier: 1.0,
      hasShield: false
    },
    {
      id: 'cipher',
      name: 'Cipher',
      title: 'Netrunner Infiltrator',
      cost: 150,
      color: '#22c55e', // Matrix Green
      accent: '#a855f7', // Purple
      avatar: 'assets/charator.avif',
      desc: 'Hacks local electromagnetic fields to draw distant data shards into range.',
      perk: '+80% Magnet Pull Radius',
      magnetRadius: 130,
      jumpBonus: 1.0,
      coinMultiplier: 1.0,
      hasShield: false
    },
    {
      id: 'spark',
      name: 'Spark',
      title: 'High-Voltage Sprinter',
      cost: 250,
      color: '#ffd166', // Golden Yellow
      accent: '#ff784f', // Orange
      desc: 'Equipped with kinetic kinetic booster soles for amplified vertical leap.',
      perk: '+15% Higher Jump Force',
      magnetRadius: 70,
      jumpBonus: 1.15,
      coinMultiplier: 1.0,
      hasShield: false
    },
    {
      id: 'volt',
      name: 'Volt',
      title: 'Cyber Ninja',
      cost: 400,
      color: '#c084fc', // Cyber Purple
      accent: '#38bdf8', // Cyan
      desc: 'Master of aerial flips with an integrated nano-shield that absorbs 1 collision.',
      perk: 'Starts with Emergency Shield',
      magnetRadius: 70,
      jumpBonus: 1.05,
      coinMultiplier: 1.0,
      hasShield: true
    },
    {
      id: 'nova',
      name: 'Nova',
      title: 'Solar Stride',
      cost: 600,
      color: '#f43f5e', // Hot Coral Pink
      accent: '#ffd166', // Gold
      desc: 'Harnesses friction thermal energy. Earns double coins during clean slides.',
      perk: '2x Coins & Score on Slides',
      magnetRadius: 85,
      jumpBonus: 1.0,
      coinMultiplier: 1.5,
      hasShield: false
    }
  ];

  // Missions Catalog
  const MISSIONS_CATALOG = [
    { id: 'dist_300', text: 'Reach 300m in a single run', goal: 300, type: 'single_dist', reward: 40 },
    { id: 'shards_40', text: 'Collect 40 Data Shards total', goal: 40, type: 'total_shards', reward: 50 },
    { id: 'slides_6', text: 'Perform 6 Slides under obstacles', goal: 6, type: 'total_slides', reward: 45 },
    { id: 'packages_2', text: 'Deliver 2 Cyber Packages', goal: 2, type: 'total_packages', reward: 60 },
    { id: 'dist_800', text: 'Survive to 800m', goal: 800, type: 'single_dist', reward: 80 },
    { id: 'double_jumps_10', text: 'Execute 10 Double Jumps', goal: 10, type: 'total_dj', reward: 50 },
    { id: 'shards_100', text: 'Collect 100 Data Shards total', goal: 100, type: 'total_shards', reward: 120 },
    { id: 'dist_1500', text: 'Master Runner: Reach 1,500m', goal: 1500, type: 'single_dist', reward: 200 }
  ];

  /**
   * Creates initial game state.
   */
  function createGameState(characterId = 'dash', isDaily = false) {
    const char = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];

    return {
      character: char,
      isDaily,
      status: 'ready', // 'ready', 'running', 'paused', 'gameover'
      distance: 0,     // in meters
      score: 0,
      coins: 0,
      multiplier: 1,
      speed: BASE_SPEED,
      ticks: 0,

      // Runner Physics
      runner: {
        x: 100,
        y: GROUND_Y - HITBOX.RUN.h,
        vy: 0,
        isGrounded: true,
        canDoubleJump: true,
        isSliding: false,
        slideTicks: 0,
        hasShield: char.hasShield,
        magnetActive: false,
        magnetTicks: 0,
        invulnerableTicks: 0
      },

      // World Objects
      rooftops: [
        { x: 0, y: GROUND_Y, w: 900, h: 180, color: '#161d2b', border: '#25344d' }
      ],
      obstacles: [],
      pickups: [],
      particles: [],

      // Stats for Missions
      sessionStats: {
        distance: 0,
        shards: 0,
        slides: 0,
        packages: 0,
        doubleJumps: 0
      }
    };
  }

  /**
   * Jump action
   */
  function triggerJump(state) {
    if (state.status !== 'running') return false;
    const r = state.runner;

    // Grounded Jump
    if (r.isGrounded) {
      r.isSliding = false;
      r.slideTicks = 0;
      r.vy = JUMP_FORCE * state.character.jumpBonus;
      r.isGrounded = false;
      r.canDoubleJump = true;
      return { action: 'jump' };
    }

    // Double Jump in Air
    if (r.canDoubleJump) {
      r.vy = DOUBLE_JUMP_FORCE * state.character.jumpBonus;
      r.canDoubleJump = false;
      state.sessionStats.doubleJumps++;
      return { action: 'double_jump' };
    }

    return false;
  }

  /**
   * Slide action
   */
  function triggerSlide(state) {
    if (state.status !== 'running') return false;
    const r = state.runner;

    // Fast-drop if in air
    if (!r.isGrounded) {
      r.vy = Math.max(r.vy, 9.0); // Fast dive
      r.isSliding = true;
      r.slideTicks = SLIDE_DURATION;
      return { action: 'dive' };
    }

    // Ground slide
    r.isSliding = true;
    r.slideTicks = SLIDE_DURATION;
    state.sessionStats.slides++;
    return { action: 'slide' };
  }

  /**
   * Get active bounding box for runner
   */
  function getRunnerHitbox(runner) {
    const box = runner.isSliding ? HITBOX.SLIDE : (runner.isGrounded ? HITBOX.RUN : HITBOX.JUMP);
    return {
      x: runner.x + box.offsetX,
      y: runner.y + box.offsetY,
      w: box.w,
      h: box.h
    };
  }

  /**
   * AABB Collision Check with customizable margin
   */
  function checkCollision(b1, b2, margin = 4) {
    return (
      b1.x + margin < b2.x + b2.w &&
      b1.x + b1.w - margin > b2.x &&
      b1.y + margin < b2.y + b2.h &&
      b1.y + b1.h - margin > b2.y
    );
  }

  /**
   * Update engine step (called ~60fps)
   */
  function updateGameState(state, deltaFactor = 1.0) {
    if (state.status !== 'running') return state;

    state.ticks++;
    const r = state.runner;

    // Speed progression
    state.speed = Math.min(MAX_SPEED, BASE_SPEED + state.distance * SPEED_ACCEL);
    const stepMove = state.speed * deltaFactor;

    // Distance & Score
    state.distance += stepMove * 0.05;
    state.sessionStats.distance = Math.floor(state.distance);
    const slideBonus = (r.isSliding && state.character.id === 'nova') ? 2 : 1;
    state.score += Math.round(stepMove * 0.8 * state.multiplier * slideBonus);

    // Slide countdown
    if (r.isSliding) {
      r.slideTicks--;
      if (r.slideTicks <= 0) {
        r.isSliding = false;
      }
    }

    // Magnet countdown
    if (r.magnetActive) {
      r.magnetTicks--;
      if (r.magnetTicks <= 0) r.magnetActive = false;
    }

    // Invulnerability countdown
    if (r.invulnerableTicks > 0) {
      r.invulnerableTicks--;
    }

    // Apply Gravity & Vertical Movement
    r.vy += GRAVITY * deltaFactor;
    r.y += r.vy * deltaFactor;

    // Determine current ground height directly under runner
    const runnerBottomX = r.x + 20;
    let groundY = null;
    for (const roof of state.rooftops) {
      if (runnerBottomX >= roof.x && runnerBottomX <= roof.x + roof.w) {
        groundY = roof.y;
        break;
      }
    }

    // Ground Landing Check
    const runnerHeight = r.isSliding ? HITBOX.SLIDE.h + HITBOX.SLIDE.offsetY : HITBOX.RUN.h;
    if (groundY !== null && r.y + runnerHeight >= groundY && r.vy >= 0) {
      r.y = groundY - runnerHeight;
      r.vy = 0;
      r.isGrounded = true;
      r.canDoubleJump = true;
    } else {
      r.isGrounded = false;
    }

    // Pit Fall Check (Below bottom of canvas)
    if (r.y > CANVAS_HEIGHT + 60) {
      state.status = 'gameover';
      return { event: 'fall_death' };
    }

    // Move Rooftops, Obstacles, Pickups
    for (const roof of state.rooftops) {
      roof.x -= stepMove;
    }
    for (const obs of state.obstacles) {
      obs.x -= stepMove;
    }
    for (const p of state.pickups) {
      p.x -= stepMove;

      // Magnet Pull
      const magnetRange = r.magnetActive ? 220 : state.character.magnetRadius;
      const dx = (r.x + 20) - p.x;
      const dy = (r.y + 25) - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < magnetRange && p.type === PICKUPS.DATA_SHARD) {
        p.x += (dx / dist) * 7.5;
        p.y += (dy / dist) * 7.5;
      }
    }

    // Cleanup offscreen objects
    state.rooftops = state.rooftops.filter(rf => rf.x + rf.w > -100);
    state.obstacles = state.obstacles.filter(ob => ob.x + ob.w > -100);
    state.pickups = state.pickups.filter(pk => pk.x + pk.w > -100 && !pk.collected);

    // Spawn New Rooftops & Obstacles as needed
    spawnWorldSegments(state);

    // Runner Hitbox
    const rBox = getRunnerHitbox(r);

    // Check Pickup Collisions
    for (const p of state.pickups) {
      if (!p.collected && checkCollision(rBox, p, 2)) {
        p.collected = true;
        if (p.type === PICKUPS.DATA_SHARD) {
          const coinVal = (r.isSliding && state.character.id === 'nova') ? 2 : 1;
          state.coins += coinVal;
          state.score += 25 * state.multiplier;
          state.sessionStats.shards += coinVal;
        } else if (p.type === PICKUPS.PRISMATIC_GEM) {
          state.coins += 5;
          state.score += 75 * state.multiplier;
          state.sessionStats.shards += 5;
          return { event: 'gem_collected' };
        } else if (p.type === PICKUPS.WARP_PORTAL) {
          state.score += 500 * state.multiplier;
          state.coins += 10;
          state.sessionStats.packages++;
          return { event: 'portal_warp' };
        } else if (p.type === PICKUPS.CYBER_PACKAGE) {
          state.score += 250 * state.multiplier;
          state.coins += 5;
          state.sessionStats.packages++;
        } else if (p.type === PICKUPS.SHIELD_ORB) {
          r.hasShield = true;
        } else if (p.type === PICKUPS.MAGNET_ORB) {
          r.magnetActive = true;
          r.magnetTicks = 480; // ~8s
        }
      }
    }

    // Check Obstacle Collisions
    for (const ob of state.obstacles) {
      if (ob.passed) continue;

      // Spring Pad interaction
      if (ob.type === HAZARDS.SPRING_PAD && checkCollision(rBox, ob, 6)) {
        r.vy = -16.5; // Super high launch
        r.isGrounded = false;
        r.canDoubleJump = true;
        ob.passed = true;
        return { event: 'spring_launch' };
      }

      // Harmful Obstacle Collision
      if (checkCollision(rBox, ob, 6)) {
        if (r.invulnerableTicks > 0) {
          continue; // Currently blinking/grace period
        }

        // Shield protection
        if (r.hasShield) {
          r.hasShield = false;
          r.invulnerableTicks = 45; // 0.75s blink
          ob.passed = true;
          return { event: 'shield_absorbed' };
        }

        // Game Over!
        state.status = 'gameover';
        return { event: 'crash', obstacle: ob };
      }

      // Mark passed
      if (ob.x + ob.w < r.x) {
        ob.passed = true;
      }
    }

    return state;
  }

  /**
   * Spawns rooftop platforms, obstacles, and pickups ahead of the runner.
   */
  function spawnWorldSegments(state) {
    const lastRoof = state.rooftops[state.rooftops.length - 1];
    if (!lastRoof) return;

    if (lastRoof.x + lastRoof.w < CANVAS_WIDTH + 500) {
      // Determine gap to next roof
      const minGap = 70;
      const maxGap = Math.min(190, 75 + state.distance * 0.04);
      const gap = Math.random() < 0.85 ? minGap + Math.random() * (maxGap - minGap) : 0;

      // New roof width & elevation variation
      const nextX = lastRoof.x + lastRoof.w + gap;
      const width = 450 + Math.random() * 450;
      const height = 180;

      // Subtle height steps (-30 to +30)
      let nextY = GROUND_Y;
      if (Math.random() < 0.4) {
        nextY = Math.max(260, Math.min(380, lastRoof.y + (Math.random() < 0.5 ? -30 : 25)));
      }

      const colorPalette = ['#141b29', '#161d2d', '#121724', '#182133'];
      const borderPalette = ['#23324d', '#283a59', '#1d2a3f', '#2c4063'];
      const colIdx = Math.floor(Math.random() * colorPalette.length);

      const newRoof = {
        x: nextX,
        y: nextY,
        w: width,
        h: height,
        color: colorPalette[colIdx],
        border: borderPalette[colIdx],
        theme: Math.random() < 0.65 ? 'cyber' : 'grass'
      };
      state.rooftops.push(newRoof);

      // Generate obstacles & pickups on this roof
      populateRoofContent(state, newRoof);
    }
  }

  function populateRoofContent(state, roof) {
    if (roof.w < 200) return;

    const availableW = roof.w - 120;
    const numObstacles = Math.min(3, Math.floor(roof.w / 280));

    for (let i = 0; i < numObstacles; i++) {
      const offsetX = 80 + i * (availableW / numObstacles) + Math.random() * 40;
      const obX = roof.x + offsetX;

      // Obstacle roll based on distance difficulty
      const roll = Math.random();

      if (roll < 0.22) {
        // Ground hurdle (Roof vent / Air conditioning unit) - Jump over
        state.obstacles.push({
          type: HAZARDS.VENT,
          x: obX,
          y: roof.y - 32,
          w: 36,
          h: 32,
          color: '#ff4757',
          glow: 'rgba(255, 71, 87, 0.4)',
          passed: false
        });
      } else if (roll < 0.38) {
        // Spiked Stone Block Hazard - Jump over!
        state.obstacles.push({
          type: HAZARDS.SPIKES,
          x: obX,
          y: roof.y - 34,
          w: 34,
          h: 34,
          color: '#94a3b8',
          glow: 'rgba(148, 163, 184, 0.4)',
          passed: false
        });
      } else if (roll < 0.50) {
        // Purple Toxic Slime Hazard - Jump over!
        state.obstacles.push({
          type: HAZARDS.SLIME_TRAP,
          x: obX,
          y: roof.y - 28,
          w: 36,
          h: 28,
          color: '#c084fc',
          glow: 'rgba(192, 132, 252, 0.4)',
          passed: false
        });
      } else if (roll < 0.72) {
        // Overhead Laser Barrier - Slide under!
        // Beam hangs at Y ~ roof.y - 70, height 42 -> player in RUN (height 56) hits it, SLIDE (height 26) passes under!
        state.obstacles.push({
          type: HAZARDS.LASER_BARRIER,
          x: obX,
          y: roof.y - 70,
          w: 30,
          h: 42,
          color: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.5)',
          passed: false
        });
      } else if (roll < 0.86) {
        // Aerial Patrol Drone
        state.obstacles.push({
          type: HAZARDS.AERIAL_DRONE,
          x: obX,
          y: roof.y - 82,
          w: 34,
          h: 30,
          color: '#ffd166',
          glow: 'rgba(255, 209, 102, 0.5)',
          passed: false
        });
      } else {
        // Spring Booster Pad
        state.obstacles.push({
          type: HAZARDS.SPRING_PAD,
          x: obX,
          y: roof.y - 14,
          w: 40,
          h: 14,
          color: '#d5ff55',
          glow: 'rgba(213, 255, 85, 0.6)',
          passed: false
        });
      }

      // Spawn arc of Data Shards around obstacles
      spawnCoinArc(state, obX, roof.y - 45);
    }
  }

  function spawnCoinArc(state, centerX, baseY) {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let c = 0; c < count; c++) {
      const angle = (c / (count - 1)) * Math.PI;
      const arcH = Math.sin(angle) * 35;
      state.pickups.push({
        type: PICKUPS.DATA_SHARD,
        x: centerX - 40 + c * 25,
        y: baseY - arcH,
        w: 16,
        h: 16,
        collected: false
      });
    }

    // Occasional Cyber Package, Prismatic Gem, Warp Portal, or Shield
    const specialRoll = Math.random();
    if (specialRoll < 0.08) {
      state.pickups.push({
        type: PICKUPS.CYBER_PACKAGE,
        x: centerX + 70,
        y: baseY - 12,
        w: 22,
        h: 22,
        collected: false
      });
    } else if (specialRoll < 0.16) {
      state.pickups.push({
        type: PICKUPS.PRISMATIC_GEM,
        x: centerX + 70,
        y: baseY - 16,
        w: 22,
        h: 26,
        collected: false
      });
    } else if (specialRoll < 0.22) {
      state.pickups.push({
        type: PICKUPS.WARP_PORTAL,
        x: centerX + 90,
        y: baseY - 35,
        w: 38,
        h: 48,
        collected: false
      });
    } else if (specialRoll < 0.28) {
      state.pickups.push({
        type: PICKUPS.SHIELD_ORB,
        x: centerX + 70,
        y: baseY - 20,
        w: 20,
        h: 20,
        collected: false
      });
    } else if (specialRoll < 0.33) {
      state.pickups.push({
        type: PICKUPS.MAGNET_ORB,
        x: centerX + 70,
        y: baseY - 20,
        w: 20,
        h: 20,
        collected: false
      });
    }
  }

  /**
   * Evaluates missions completion against session stats
   */
  function evaluateMissions(activeMissions, stats) {
    const results = [];
    for (const m of activeMissions) {
      let isMet = false;
      let progress = 0;

      if (m.type === 'single_dist') {
        progress = stats.distance;
        isMet = stats.distance >= m.goal;
      } else if (m.type === 'total_shards') {
        progress = stats.shards;
        isMet = stats.shards >= m.goal;
      } else if (m.type === 'total_slides') {
        progress = stats.slides;
        isMet = stats.slides >= m.goal;
      } else if (m.type === 'total_packages') {
        progress = stats.packages;
        isMet = stats.packages >= m.goal;
      } else if (m.type === 'total_dj') {
        progress = stats.doubleJumps;
        isMet = stats.doubleJumps >= m.goal;
      }

      results.push({
        ...m,
        progress,
        isCompleted: isMet
      });
    }
    return results;
  }

  /**
   * Daily challenge seed generator (YYYY-MM-DD string)
   */
  function getDailySeedDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Exports
  exports.GRAVITY = GRAVITY;
  exports.JUMP_FORCE = JUMP_FORCE;
  exports.DOUBLE_JUMP_FORCE = DOUBLE_JUMP_FORCE;
  exports.BASE_SPEED = BASE_SPEED;
  exports.MAX_SPEED = MAX_SPEED;
  exports.GROUND_Y = GROUND_Y;
  exports.CANVAS_WIDTH = CANVAS_WIDTH;
  exports.CANVAS_HEIGHT = CANVAS_HEIGHT;
  exports.HITBOX = HITBOX;
  exports.HAZARDS = HAZARDS;
  exports.PICKUPS = PICKUPS;
  exports.CHARACTERS = CHARACTERS;
  exports.MISSIONS_CATALOG = MISSIONS_CATALOG;

  exports.createGameState = createGameState;
  exports.triggerJump = triggerJump;
  exports.triggerSlide = triggerSlide;
  exports.getRunnerHitbox = getRunnerHitbox;
  exports.checkCollision = checkCollision;
  exports.updateGameState = updateGameState;
  exports.evaluateMissions = evaluateMissions;
  exports.getDailySeedDate = getDailySeedDate;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.DashverseEngine = {}));

