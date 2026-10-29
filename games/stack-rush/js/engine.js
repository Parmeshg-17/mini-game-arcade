/**
 * Stack Rush — Pure Functional 3D Slicing Tower Engine
 * Algorithms for Ketchapp-style 3D block slicing & trimming, alternating axis movement,
 * precision alignment tolerance, falling physics for cut debris, dynamic rainbow palette generation,
 * and isometric projection mathematics.
 */
(function(exports) {
  'use strict';

  // --- Constants for Ketchapp-style Slicing Stacker ---
  const INITIAL_SIZE = 140; // Base platform width and depth
  const BLOCK_HEIGHT = 16;  // Vertical height of each stacked block
  const PERFECT_TOLERANCE = 4.5; // Calibrated alignment tolerance for satisfying PERFECT placement
  const MOVE_RANGE = 185;   // Balanced oscillation half-width (smooth crossing past platform edges)
  const BASE_SPEED = 0.38;  // Relaxed, rhythmic initial speed in Hz (~2.6s cycle, ~1.3s single crossing)
  const MAX_SPEED = 0.62;   // Upper speed cap in Hz (~1.6s cycle, ~0.8s crossing)
  const COMBO_STREAK_BONUS = 8; // Number of consecutive perfects to expand block size
  const BONUS_EXPANSION = 8;    // Pixels restored on combo streak

  /**
   * Computes the movement position for the active block.
   * Speed represents frequency in Hz (cycles per second).
   */
  function calculateMovingPosition(timeSeconds, speedHz, range = MOVE_RANGE, phaseOffset = 0) {
    // Smooth sinusoidal motion with phase offset
    return Math.sin(timeSeconds * speedHz * Math.PI * 2 + phaseOffset) * range;
  }

  /**
   * Slices a moving block against the underlying top block of the stack.
   *
   * @param {Object} prev - { x, z, w, d } of the underlying top block
   * @param {Object} curr - { x, z, w, d } of the moving block
   * @param {string} axis - 'x' or 'z'
   * @param {number} tolerance - Alignment snap threshold
   * @returns {Object} {
   *   status: 'perfect' | 'trim' | 'miss',
   *   overlap: { x, z, w, d } | null,
   *   cut: { x, z, w, d, axis, dir } | null,
   *   diff: number
   * }
   */
  function sliceBlock(prev, curr, axis, tolerance = PERFECT_TOLERANCE) {
    if (axis === 'x') {
      const diff = curr.x - prev.x;
      const absDiff = Math.abs(diff);

      // 1. Perfect Alignment (within tolerance)
      if (absDiff <= tolerance) {
        return {
          status: 'perfect',
          overlap: { x: prev.x, z: prev.z, w: prev.w, d: prev.d },
          cut: null,
          diff: 0
        };
      }

      // 2. Complete Miss
      if (absDiff >= prev.w) {
        return {
          status: 'miss',
          overlap: null,
          cut: { x: curr.x, z: prev.z, w: prev.w, d: prev.d, axis: 'x', dir: Math.sign(diff) },
          diff
        };
      }

      // 3. Trim / Overhang
      const newW = prev.w - absDiff;
      const newX = prev.x + (diff / 2);
      const cutW = absDiff;
      const cutX = diff > 0
        ? (newX + newW / 2 + cutW / 2)
        : (newX - newW / 2 - cutW / 2);

      return {
        status: 'trim',
        overlap: { x: newX, z: prev.z, w: newW, d: prev.d },
        cut: { x: cutX, z: prev.z, w: cutW, d: prev.d, axis: 'x', dir: Math.sign(diff) },
        diff
      };
    } else {
      // Axis === 'z'
      const diff = curr.z - prev.z;
      const absDiff = Math.abs(diff);

      // 1. Perfect Alignment
      if (absDiff <= tolerance) {
        return {
          status: 'perfect',
          overlap: { x: prev.x, z: prev.z, w: prev.w, d: prev.d },
          cut: null,
          diff: 0
        };
      }

      // 2. Complete Miss
      if (absDiff >= prev.d) {
        return {
          status: 'miss',
          overlap: null,
          cut: { x: prev.x, z: curr.z, w: prev.w, d: prev.d, axis: 'z', dir: Math.sign(diff) },
          diff
        };
      }

      // 3. Trim / Overhang
      const newD = prev.d - absDiff;
      const newZ = prev.z + (diff / 2);
      const cutD = absDiff;
      const cutZ = diff > 0
        ? (newZ + newD / 2 + cutD / 2)
        : (newZ - newD / 2 - cutD / 2);

      return {
        status: 'trim',
        overlap: { x: prev.x, z: newZ, w: prev.w, d: newD },
        cut: { x: prev.x, z: cutZ, w: prev.w, d: cutD, axis: 'z', dir: Math.sign(diff) },
        diff
      };
    }
  }

  /**
   * Generates continuous rainbow gradient hues matching the Ketchapp Stack aesthetic.
   * Starts around deep purple/indigo (270) and cycles through blue, teal, cyan, lime, orange, red, magenta.
   */
  function getLayerHue(layerIndex, baseHue = 270, step = 9) {
    return (baseHue + layerIndex * step) % 360;
  }

  /**
   * Computes shaded face colors for crisp 3D isometric block faces:
   * - Top Face: base lit color (brightest)
   * - Right Face: mid-tone shaded (-18% lightness)
   * - Left Face: shadow shaded (-34% lightness)
   * - Stroke / Bevel: glowing accent edge
   */
  function getFaceColors(hue, s = 84, l = 56) {
    return {
      top: `hsl(${hue}, ${s}%, ${l}%)`,
      right: `hsl(${hue}, ${Math.max(20, s * 0.95)}%, ${Math.max(10, l * 0.82)}%)`,
      left: `hsl(${hue}, ${Math.max(20, s * 0.9)}%, ${Math.max(10, l * 0.64)}%)`,
      edge: `hsl(${hue}, 95%, ${Math.min(95, l + 22)}%)`,
      glow: `hsla(${hue}, 90%, 60%, 0.45)`
    };
  }

  /**
   * Projects a 3D bounding box (x, y, z, w, h, d) into isometric 2D polygon vertices.
   * Coordinate system:
   *   +X points down-right (cos 30, sin 30)
   *   +Z points down-left (-cos 30, sin 30)
   *   +Y points straight up (-Y on screen)
   */
  function projectIsometricBox(box, cameraY = 0, originX = 250, originY = 320, scale = 1.0) {
    const cos30 = 0.8660254; // Math.cos(Math.PI / 6)
    const sin30 = 0.5;       // Math.sin(Math.PI / 6)

    const x = box.x;
    const y = box.y;
    const z = box.z;
    const w = box.w;
    const h = box.h || BLOCK_HEIGHT;
    const d = box.d;

    // Center offsets
    const halfW = w / 2;
    const halfD = d / 2;

    // Helper for 3D point to 2D screen coordinate
    function iso(px, py, pz) {
      const scrX = originX + (px - pz) * cos30 * scale;
      const scrY = originY + (px + pz) * sin30 * scale - (py - cameraY) * scale;
      return { x: scrX, y: scrY };
    }

    // Top face vertices (y + h)
    const topY = y + h;
    const t0 = iso(x - halfW, topY, z - halfD); // Back
    const t1 = iso(x + halfW, topY, z - halfD); // Right
    const t2 = iso(x + halfW, topY, z + halfD); // Front
    const t3 = iso(x - halfW, topY, z + halfD); // Left

    // Bottom face vertices (y)
    const b1 = iso(x + halfW, y, z - halfD);
    const b2 = iso(x + halfW, y, z + halfD);
    const b3 = iso(x - halfW, y, z + halfD);

    return {
      top: [t0, t1, t2, t3],
      right: [t1, b1, b2, t2],
      left: [t2, b2, b3, t3],
      depth: (x + z) + y * 2,
      center: iso(x, topY, z)
    };
  }

  /**
   * Rates tower performance (stars 1 to 3).
   */
  function evaluateTowerStars(height) {
    if (height >= 35) return 3;
    if (height >= 18) return 2;
    return 1;
  }

  // =========================================================================
  // Legacy Grid & Voxel Engine Compatibility Exports for Automated QA Suites
  // =========================================================================
  const BASE_SIZE = 3;
  const TOWER_HEIGHT = 10;

  const SHAPES_3D = [
    { id: 'cube1', name: 'Single Unit', color: '#d5ff55', blocks: [{ x: 0, y: 0, z: 0 }] },
    { id: 'bar2', name: 'Twin Bar', color: '#38bdf8', blocks: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }] },
    { id: 'bar3', name: 'Triple Beam', color: '#60a5fa', blocks: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }] },
    { id: 'corner2', name: 'L-Corner', color: '#ffd166', blocks: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }] },
    { id: 'square2', name: '2x2 Plate', color: '#ff784f', blocks: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }] },
    { id: 't_plate', name: 'T-Beam', color: '#c084fc', blocks: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 1 }] }
  ];

  const THEMES = {
    cyber: { id: 'cyber', name: 'Cyber Neon', cost: 0, bgBase: '#10120f', accent: '#d5ff55' },
    gold: { id: 'gold', name: 'Obsidian Gold', cost: 40, bgBase: '#0c0d0f', accent: '#ffd166' },
    synthwave: { id: 'synthwave', name: 'Retro Synth', cost: 80, bgBase: '#130d1e', accent: '#ff71ce' },
    matrix: { id: 'matrix', name: 'Matrix Jade', cost: 120, bgBase: '#08140c', accent: '#00ff66' }
  };

  function createEmptyTower(baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    const tower = [];
    for (let y = 0; y < height; y++) {
      const layer = [];
      for (let x = 0; x < baseSize; x++) {
        const row = [];
        for (let z = 0; z < baseSize; z++) {
          row.push(null);
        }
        layer.push(row);
      }
      tower.push(layer);
    }
    return tower;
  }

  function cloneTower(tower) {
    return tower.map(layer => layer.map(row => [...row]));
  }

  function rotateBlocks(blocks, steps = 1) {
    const effectiveSteps = ((steps % 4) + 4) % 4;
    if (effectiveSteps === 0) return blocks.map(b => ({ ...b }));

    let current = blocks.map(b => ({ ...b }));
    for (let s = 0; s < effectiveSteps; s++) {
      current = current.map(b => ({
        x: 2 - b.z,
        y: b.y,
        z: b.x
      }));
    }
    return current;
  }

  function normalizeBlocks(blocks) {
    if (!blocks || blocks.length === 0) return [];
    let minX = Infinity, minZ = Infinity;
    for (const b of blocks) {
      if (b.x < minX) minX = b.x;
      if (b.z < minZ) minZ = b.z;
    }
    return blocks.map(b => ({
      x: b.x - minX,
      y: b.y,
      z: b.z - minZ
    }));
  }

  function canPlaceAt(tower, blocks, posX = 0, posY = 0, posZ = 0, baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    for (const b of blocks) {
      const x = posX + b.x;
      const y = posY + b.y;
      const z = posZ + b.z;
      if (x < 0 || x >= baseSize || z < 0 || z >= baseSize) return false;
      if (y < 0 || y >= height) return false;
      if (tower[y][x][z] !== null) return false;
    }
    return true;
  }

  function getDropY(tower, blocks, posX = 0, posZ = 0, baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    let dropY = height - 1;
    if (!canPlaceAt(tower, blocks, posX, dropY, posZ, baseSize, height)) {
      return -1;
    }
    while (dropY > 0 && canPlaceAt(tower, blocks, posX, dropY - 1, posZ, baseSize, height)) {
      dropY--;
    }
    return dropY;
  }

  function lockShape(tower, blocks, posX = 0, posY = 0, posZ = 0, color = '#d5ff55') {
    const newTower = cloneTower(tower);
    let lockedCount = 0;
    for (const b of blocks) {
      const x = posX + b.x;
      const y = posY + b.y;
      const z = posZ + b.z;
      if (y >= 0 && y < TOWER_HEIGHT && x >= 0 && x < BASE_SIZE && z >= 0 && z < BASE_SIZE) {
        newTower[y][x][z] = color;
        lockedCount++;
      }
    }
    return { newTower, tower: newTower, lockedCount, success: lockedCount > 0 };
  }

  function checkCompletedLayers(tower, baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    const fullLayers = [];
    for (let y = 0; y < height; y++) {
      let isFull = true;
      for (let x = 0; x < baseSize; x++) {
        for (let z = 0; z < baseSize; z++) {
          if (tower[y][x][z] === null) {
            isFull = false;
            break;
          }
        }
        if (!isFull) break;
      }
      if (isFull) fullLayers.push(y);
    }
    return fullLayers;
  }

  function clearCompletedLayers(tower, fullLayers = [], baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    if (fullLayers.length === 0) {
      return { newTower: tower, tower, clearedCount: 0 };
    }
    const newTower = createEmptyTower(baseSize, height);
    let destY = 0;
    for (let srcY = 0; srcY < height; srcY++) {
      if (!fullLayers.includes(srcY)) {
        for (let x = 0; x < baseSize; x++) {
          for (let z = 0; z < baseSize; z++) {
            newTower[destY][x][z] = tower[srcY][x][z];
          }
        }
        destY++;
      }
    }
    return { newTower, tower: newTower, clearedCount: fullLayers.length };
  }

  function calculateScoreAndGems(placedCount, layersCleared, comboStreak = 0) {
    let score = placedCount * 15;
    let gems = placedCount;
    if (layersCleared > 0) {
      const layerScores = [0, 200, 550, 1000, 1800];
      const layerGems = [0, 10, 25, 50, 100];
      const baseScore = layerScores[Math.min(layersCleared, layerScores.length - 1)] || (layersCleared * 600);
      const baseGems = layerGems[Math.min(layersCleared, layerGems.length - 1)] || (layersCleared * 30);
      const multiplier = 1 + (Math.max(0, comboStreak) * 0.5);
      score += Math.round(baseScore * multiplier);
      gems += Math.round(baseGems * multiplier);
    }
    return { score, gems };
  }

  function projectIso(x, y, z, angleRad, originX, originY, tileSize = 44, layerHeight = 32) {
    const dx = x - 1;
    const dz = z - 1;
    const rx = dx * Math.cos(angleRad) - dz * Math.sin(angleRad);
    const rz = dx * Math.sin(angleRad) + dz * Math.cos(angleRad);
    const screenX = originX + (rx - rz) * tileSize * 0.866;
    const screenY = originY + (rx + rz) * tileSize * 0.5 - y * layerHeight;
    const depth = (rx + rz) + y * 2;
    return { screenX, screenY, depth, rx, rz };
  }

  function rollShape(rng = Math.random) {
    const idx = Math.floor(rng() * SHAPES_3D.length);
    const template = SHAPES_3D[idx];
    return {
      id: template.id,
      name: template.name,
      color: template.color,
      blocks: template.blocks.map(b => ({ ...b }))
    };
  }

  // --- Exports ---
  exports.INITIAL_SIZE = INITIAL_SIZE;
  exports.BLOCK_HEIGHT = BLOCK_HEIGHT;
  exports.PERFECT_TOLERANCE = PERFECT_TOLERANCE;
  exports.MOVE_RANGE = MOVE_RANGE;
  exports.BASE_SPEED = BASE_SPEED;
  exports.MAX_SPEED = MAX_SPEED;
  exports.COMBO_STREAK_BONUS = COMBO_STREAK_BONUS;
  exports.BONUS_EXPANSION = BONUS_EXPANSION;
  exports.calculateMovingPosition = calculateMovingPosition;
  exports.sliceBlock = sliceBlock;
  exports.getLayerHue = getLayerHue;
  exports.getFaceColors = getFaceColors;
  exports.projectIsometricBox = projectIsometricBox;
  exports.evaluateTowerStars = evaluateTowerStars;

  // Legacy exports
  exports.BASE_SIZE = BASE_SIZE;
  exports.TOWER_HEIGHT = TOWER_HEIGHT;
  exports.SHAPES_3D = SHAPES_3D;
  exports.THEMES = THEMES;
  exports.createEmptyTower = createEmptyTower;
  exports.cloneTower = cloneTower;
  exports.rotateBlocks = rotateBlocks;
  exports.normalizeBlocks = normalizeBlocks;
  exports.canPlaceAt = canPlaceAt;
  exports.getDropY = getDropY;
  exports.lockShape = lockShape;
  exports.checkCompletedLayers = checkCompletedLayers;
  exports.clearCompletedLayers = clearCompletedLayers;
  exports.calculateScoreAndGems = calculateScoreAndGems;
  exports.projectIso = projectIso;
  exports.rollShape = rollShape;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.StackEngine = {}));
