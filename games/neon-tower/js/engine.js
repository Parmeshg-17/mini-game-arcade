/**
 * Neon Tower — Core Pure Physics & Game Engine
 * Precision block slicing, perfect snap window, combo multipliers, speed escalation,
 * debris physics, particle emitter, and neon synthwave palette generator.
 */
(function(exports) {
  'use strict';

  // --- Engine Constants ---
  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 800;
  const BLOCK_HEIGHT = 28;
  const INITIAL_WIDTH = 220;
  const BASE_Y = 660; // Base foundation Y position in virtual coordinate space
  const PERFECT_TOLERANCE = 3.5; // Alignment snap window in pixels
  const BASE_SPEED = 240; // Pixels per second
  const SPEED_INCREMENT = 8.5; // Added speed per floor
  const MAX_SPEED = 680; // Speed cap
  const COMBO_EXPANSION_THRESHOLD = 5; // Perfect streak count to trigger block width restoration
  const EXPANSION_BONUS = 10; // Width added when expansion triggers
  const GRAVITY = 1100; // Pixels / s^2 for falling cut debris

  // Cyber Synthwave Neon Palette Cycles
  const NEON_PALETTE = [
    { name: 'Cyan', main: '#00f0ff', glow: 'rgba(0, 240, 255, 0.65)', light: '#a6f8ff', dark: '#005d63' },
    { name: 'Magenta', main: '#ff007f', glow: 'rgba(255, 0, 127, 0.65)', light: '#ff99cc', dark: '#660033' },
    { name: 'Lime', main: '#39ff14', glow: 'rgba(57, 255, 20, 0.65)', light: '#a8ff96', dark: '#145c05' },
    { name: 'Purple', main: '#b026ff', glow: 'rgba(176, 38, 255, 0.65)', light: '#deb6ff', dark: '#480573' },
    { name: 'Amber', main: '#ffe600', glow: 'rgba(255, 230, 0, 0.65)', light: '#fff48a', dark: '#665c00' },
    { name: 'Orange', main: '#ff5e00', glow: 'rgba(255, 94, 0, 0.65)', light: '#ffb58a', dark: '#662600' },
    { name: 'Electric Blue', main: '#00a6ff', glow: 'rgba(0, 166, 255, 0.65)', light: '#99dbff', dark: '#003f66' },
    { name: 'Fluo Mint', main: '#00ffa3', glow: 'rgba(0, 255, 163, 0.65)', light: '#a8ffd9', dark: '#00663f' }
  ];

  /**
   * Generates continuous smooth color specs for any floor index.
   */
  function getFloorColor(floor) {
    const cycle = NEON_PALETTE[floor % NEON_PALETTE.length];
    // Dynamic slight hue rotation every round
    const hue = (floor * 17) % 360;
    return {
      main: cycle.main,
      glow: cycle.glow,
      light: cycle.light,
      dark: cycle.dark,
      hue: hue
    };
  }

  /**
   * Calculates movement speed in px/s for a given floor height.
   */
  function getSpeedForFloor(floor) {
    return Math.min(BASE_SPEED + Math.max(0, floor - 1) * SPEED_INCREMENT, MAX_SPEED);
  }

  /**
   * Creates fresh game state.
   */
  function createInitialState() {
    const baseWidth = INITIAL_WIDTH;
    const baseX = (CANVAS_WIDTH - baseWidth) / 2;
    const baseY = BASE_Y;
    const baseColor = getFloorColor(0);

    const foundation = {
      x: baseX,
      y: baseY,
      width: baseWidth,
      height: BLOCK_HEIGHT,
      floor: 0,
      color: baseColor
    };

    const movingColor = getFloorColor(1);
    const movingBlock = {
      x: 20,
      y: baseY - BLOCK_HEIGHT,
      width: baseWidth,
      height: BLOCK_HEIGHT,
      floor: 1,
      direction: 1, // 1 = moving right, -1 = moving left
      speed: getSpeedForFloor(1),
      color: movingColor
    };

    return {
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      floor: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      tower: [foundation],
      currentWidth: baseWidth,
      movingBlock: movingBlock,
      cameraY: 0,
      targetCameraY: 0,
      fallingDebris: [],
      particles: [],
      floatingTexts: [],
      isGameOver: false,
      isPaused: false
    };
  }

  /**
   * Updates position of moving block during active gameplay.
   */
  function updateMovingBlock(state, deltaSeconds) {
    if (state.isGameOver || state.isPaused || !state.movingBlock) return;

    const b = state.movingBlock;
    b.x += b.direction * b.speed * deltaSeconds;

    const minX = 0;
    const maxX = CANVAS_WIDTH - b.width;

    if (b.x <= minX) {
      b.x = minX;
      b.direction = 1;
    } else if (b.x >= maxX) {
      b.x = maxX;
      b.direction = -1;
    }
  }

  /**
   * Executes the drop/placement action when player clicks or presses Space.
   *
   * @param {Object} state - The game state
   * @param {number} [tolerance=PERFECT_TOLERANCE] - Alignment snap tolerance
   * @returns {Object} Result outcome:
   *   {
   *     outcome: 'perfect' | 'trim' | 'miss',
   *     placedBlock: Object | null,
   *     cutDebris: Object | null,
   *     points: number,
   *     combo: number,
   *     bonusExpansion: boolean,
   *     floor: number
   *   }
   */
  function dropBlock(state, tolerance = PERFECT_TOLERANCE) {
    if (state.isGameOver || !state.movingBlock) {
      return { outcome: 'none', points: 0, combo: 0 };
    }

    const prevBlock = state.tower[state.tower.length - 1];
    const curr = state.movingBlock;
    const diff = curr.x - prevBlock.x;
    const absDiff = Math.abs(diff);

    // 1. COMPLETE MISS (Game Over)
    if (absDiff >= curr.width) {
      // The entire block drops off
      const fullDebris = {
        x: curr.x,
        y: curr.y,
        width: curr.width,
        height: curr.height,
        color: curr.color,
        vx: curr.direction * 100 + (diff > 0 ? 80 : -80),
        vy: -60,
        rotation: 0,
        vRot: (Math.random() - 0.5) * 6,
        alpha: 1.0
      };

      state.fallingDebris.push(fullDebris);
      state.movingBlock = null;
      state.isGameOver = true;

      return {
        outcome: 'miss',
        placedBlock: null,
        cutDebris: fullDebris,
        points: 0,
        combo: 0,
        bonusExpansion: false,
        floor: state.floor
      };
    }

    // 2. PERFECT ALIGNMENT (Snaps cleanly to underlying block)
    if (absDiff <= tolerance) {
      const newX = prevBlock.x;
      let newWidth = curr.width;
      let bonusExpansion = false;

      state.combo++;
      if (state.combo > state.maxCombo) {
        state.maxCombo = state.combo;
      }

      // Combo streak reward: expand width if reduced
      if (state.combo >= COMBO_EXPANSION_THRESHOLD && newWidth < INITIAL_WIDTH) {
        newWidth = Math.min(INITIAL_WIDTH, newWidth + EXPANSION_BONUS);
        bonusExpansion = true;
      }

      state.currentWidth = newWidth;
      state.floor++;

      const comboMultiplier = Math.min(state.combo, 10);
      const points = 100 * comboMultiplier;
      state.score += points;

      const placedBlock = {
        x: newX,
        y: prevBlock.y - BLOCK_HEIGHT,
        width: newWidth,
        height: BLOCK_HEIGHT,
        floor: state.floor,
        color: curr.color
      };

      state.tower.push(placedBlock);

      // Spawn next moving block
      spawnNextMovingBlock(state);

      return {
        outcome: 'perfect',
        placedBlock,
        cutDebris: null,
        points,
        combo: state.combo,
        bonusExpansion,
        floor: state.floor
      };
    }

    // 3. TRIMMED OVERHANG (Precision cut)
    state.combo = 0; // Combo streak reset
    const newWidth = curr.width - absDiff;
    const newX = diff > 0 ? curr.x : prevBlock.x;

    state.currentWidth = newWidth;
    state.floor++;

    const points = 50;
    state.score += points;

    // Overhang cut piece
    const cutWidth = absDiff;
    const cutX = diff > 0 ? (prevBlock.x + prevBlock.width) : curr.x;
    const cutDebris = {
      x: cutX,
      y: curr.y,
      width: cutWidth,
      height: curr.height,
      color: curr.color,
      vx: diff > 0 ? 90 + Math.random() * 40 : -90 - Math.random() * 40,
      vy: -70,
      rotation: 0,
      vRot: (diff > 0 ? 1 : -1) * (2 + Math.random() * 3),
      alpha: 1.0
    };

    state.fallingDebris.push(cutDebris);

    const placedBlock = {
      x: newX,
      y: prevBlock.y - BLOCK_HEIGHT,
      width: newWidth,
      height: BLOCK_HEIGHT,
      floor: state.floor,
      color: curr.color
    };

    state.tower.push(placedBlock);

    // Spawn next moving block
    spawnNextMovingBlock(state);

    return {
      outcome: 'trim',
      placedBlock,
      cutDebris,
      points,
      combo: 0,
      bonusExpansion: false,
      floor: state.floor
    };
  }

  /**
   * Prepares the next moving block above the tower top.
   */
  function spawnNextMovingBlock(state) {
    const topBlock = state.tower[state.tower.length - 1];
    const nextFloor = state.floor + 1;
    const nextColor = getFloorColor(nextFloor);
    const speed = getSpeedForFloor(nextFloor);

    // Alternate initial spawn side
    const startFromLeft = nextFloor % 2 === 1;
    const initialX = startFromLeft ? 0 : CANVAS_WIDTH - topBlock.width;
    const initialDir = startFromLeft ? 1 : -1;

    state.movingBlock = {
      x: initialX,
      y: topBlock.y - BLOCK_HEIGHT,
      width: topBlock.width,
      height: BLOCK_HEIGHT,
      floor: nextFloor,
      direction: initialDir,
      speed: speed,
      color: nextColor
    };

    // Update target camera Y so top blocks remain in comfortable view
    // Keep top block around 60% of canvas height (e.g. y = 480)
    const viewY = 480;
    state.targetCameraY = Math.max(0, viewY - topBlock.y);
  }

  /**
   * Advances physics for debris, particles, floating texts, and camera.
   */
  function updatePhysics(state, deltaSeconds) {
    // 1. Camera interpolation (smooth follow)
    state.cameraY += (state.targetCameraY - state.cameraY) * Math.min(1.0, 7.5 * deltaSeconds);

    // 2. Falling debris
    for (let i = state.fallingDebris.length - 1; i >= 0; i--) {
      const d = state.fallingDebris[i];
      d.vy += GRAVITY * deltaSeconds;
      d.x += d.vx * deltaSeconds;
      d.y += d.vy * deltaSeconds;
      d.rotation += d.vRot * deltaSeconds;
      d.alpha -= 0.65 * deltaSeconds;

      if (d.alpha <= 0 || d.y > CANVAS_HEIGHT + 200 + state.cameraY) {
        state.fallingDebris.splice(i, 1);
      }
    }

    // 3. Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.vy += (p.gravity || 350) * deltaSeconds;
      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;
      p.life -= deltaSeconds;

      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    // 4. Floating texts
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y -= 45 * deltaSeconds;
      ft.life -= deltaSeconds;
      if (ft.life <= 0) {
        state.floatingTexts.splice(i, 1);
      }
    }
  }

  /**
   * Spawns neon spark particles along a slice cut or perfect snap.
   */
  function spawnSliceSparks(particles, cutX, cutY, color, count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.5;
      const speed = 80 + Math.random() * 260;
      particles.push({
        x: cutX + (Math.random() - 0.5) * 6,
        y: cutY + Math.random() * BLOCK_HEIGHT,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        color: color.main,
        glow: color.glow,
        size: 2 + Math.random() * 3,
        life: 0.35 + Math.random() * 0.35,
        maxLife: 0.7,
        gravity: 420
      });
    }
  }

  /**
   * Evaluates performance rank and star rating.
   */
  function evaluateRating(floor) {
    if (floor >= 50) return { stars: 3, rank: 'Sky Legend', title: 'Cyber Tower God' };
    if (floor >= 35) return { stars: 3, rank: 'Apex Architect', title: 'Master Stacker' };
    if (floor >= 20) return { stars: 2, rank: 'Grid Runner', title: 'Neon Builder' };
    if (floor >= 10) return { stars: 2, rank: 'Skyscraper Novice', title: 'Steady Stacker' };
    return { stars: 1, rank: 'Floor Sweeper', title: 'Rookie Builder' };
  }

  // --- Export for Browser and Node.js Testing ---
  const NeonTowerEngine = {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BLOCK_HEIGHT,
    INITIAL_WIDTH,
    BASE_Y,
    PERFECT_TOLERANCE,
    BASE_SPEED,
    SPEED_INCREMENT,
    MAX_SPEED,
    COMBO_EXPANSION_THRESHOLD,
    EXPANSION_BONUS,
    NEON_PALETTE,
    getFloorColor,
    getSpeedForFloor,
    createInitialState,
    updateMovingBlock,
    dropBlock,
    spawnNextMovingBlock,
    updatePhysics,
    spawnSliceSparks,
    evaluateRating
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeonTowerEngine;
  }
  if (typeof window !== 'undefined') {
    window.NeonTowerEngine = NeonTowerEngine;
  }

})(typeof exports === 'undefined' ? (this.NeonTowerEngine = {}) : exports);

