/**
 * Stack Rush — Pure Functional 3D Rotating Tower Engine
 * Algorithms for 3D voxel grid, platform rotation mechanics, landing projection (ghost drop),
 * horizontal layer completion, multi-layer combos, and isometric projection math.
 */
(function(exports) {
  'use strict';

  const BASE_SIZE = 3; // 3x3 platform layer
  const TOWER_HEIGHT = 10; // 10 vertical layers

  // 3D Polyomino Shapes
  const SHAPES_3D = [
    {
      id: 'cube1',
      name: 'Single Unit',
      color: '#d5ff55',
      blocks: [{ x: 0, y: 0, z: 0 }]
    },
    {
      id: 'bar2',
      name: 'Twin Bar',
      color: '#38bdf8',
      blocks: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }]
    },
    {
      id: 'bar3',
      name: 'Triple Beam',
      color: '#60a5fa',
      blocks: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }]
    },
    {
      id: 'corner2',
      name: 'L-Corner',
      color: '#ffd166',
      blocks: [{ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }]
    },
    {
      id: 'square2',
      name: '2x2 Plate',
      color: '#ff784f',
      blocks: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 }
      ]
    },
    {
      id: 't_plate',
      name: 'T-Beam',
      color: '#c084fc',
      blocks: [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 1 }
      ]
    }
  ];

  // Visual Theme Palettes (Unlockable with earned gems)
  const THEMES = {
    cyber: {
      id: 'cyber',
      name: 'Cyber Neon',
      cost: 0, // Default free
      bgBase: '#10120f',
      platform: '#1c221a',
      gridLines: '#2a3525',
      accent: '#d5ff55',
      accentAlt: '#38bdf8',
      gemColor: '#38bdf8'
    },
    gold: {
      id: 'gold',
      name: 'Obsidian Gold',
      cost: 40,
      bgBase: '#0c0d0f',
      platform: '#222018',
      gridLines: '#423c28',
      accent: '#ffd166',
      accentAlt: '#ff784f',
      gemColor: '#ffd166'
    },
    synthwave: {
      id: 'synthwave',
      name: 'Retro Synth',
      cost: 80,
      bgBase: '#130d1e',
      platform: '#251538',
      gridLines: '#4e2874',
      accent: '#ff71ce',
      accentAlt: '#01cdfe',
      gemColor: '#ff71ce'
    },
    matrix: {
      id: 'matrix',
      name: 'Matrix Jade',
      cost: 120,
      bgBase: '#08140c',
      platform: '#102818',
      gridLines: '#1d482c',
      accent: '#00ff66',
      accentAlt: '#10b981',
      gemColor: '#00ff66'
    }
  };

  /**
   * Initializes a clean 3D tower grid: tower[y][x][z] = null
   */
  function createEmptyTower(baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    const tower = [];
    for (let y = 0; y < height; y++) {
      const layer = [];
      for (let x = 0; x < baseSize; x++) {
        layer.push(new Array(baseSize).fill(null));
      }
      tower.push(layer);
    }
    return tower;
  }

  /**
   * Clones a 3D tower grid.
   */
  function cloneTower(tower) {
    return tower.map(layer => layer.map(row => [...row]));
  }

  /**
   * Rotates 3D block coordinates by 90-degree step around Y-axis.
   * step: 0 = 0 deg, 1 = 90 deg, 2 = 180 deg, 3 = 270 deg
   */
  function rotateBlocks(blocks, step = 0) {
    const s = ((step % 4) + 4) % 4;
    if (s === 0) return blocks.map(b => ({ ...b }));

    return blocks.map(b => {
      let x = b.x;
      let z = b.z;
      for (let i = 0; i < s; i++) {
        const tempX = x;
        x = -z;
        z = tempX;
      }
      return { x, y: b.y, z };
    });
  }

  /**
   * Normalizes shape blocks so top-left-most block starts at min x=0, z=0.
   */
  function normalizeBlocks(blocks) {
    let minX = Infinity;
    let minZ = Infinity;
    blocks.forEach(b => {
      if (b.x < minX) minX = b.x;
      if (b.z < minZ) minZ = b.z;
    });
    return blocks.map(b => ({
      x: b.x - minX,
      y: b.y,
      z: b.z - minZ
    }));
  }

  /**
   * Checks if a set of shape blocks can legally occupy the tower at (posX, posY, posZ).
   */
  function canPlaceAt(tower, blocks, posX = 0, posY = 0, posZ = 0, baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    for (const b of blocks) {
      const x = posX + b.x;
      const y = posY + b.y;
      const z = posZ + b.z;

      // Check boundaries
      if (x < 0 || x >= baseSize || z < 0 || z >= baseSize) return false;
      if (y < 0 || y >= height) return false;

      // Check collision
      if (tower[y][x][z] !== null) return false;
    }
    return true;
  }

  /**
   * Calculates the lowest vertical landing level (Ghost drop Y) for a block at (posX, posZ).
   */
  function getDropY(tower, blocks, posX = 0, posZ = 0, baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    let dropY = height - 1;

    // Check if initial position at top is valid
    if (!canPlaceAt(tower, blocks, posX, dropY, posZ, baseSize, height)) {
      return -1; // Top is already blocked!
    }

    // Step down as far as possible
    while (dropY > 0 && canPlaceAt(tower, blocks, posX, dropY - 1, posZ, baseSize, height)) {
      dropY--;
    }

    return dropY;
  }

  /**
   * Locks the shape into the 3D tower and returns updated tower.
   */
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

  /**
   * Checks for completely filled horizontal 3x3 layers (all 9 cells filled).
   */
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
      if (isFull) {
        fullLayers.push(y);
      }
    }

    return fullLayers;
  }

  /**
   * Destroys completed layers and shifts upper layers downward.
   */
  function clearCompletedLayers(tower, fullLayers = [], baseSize = BASE_SIZE, height = TOWER_HEIGHT) {
    if (fullLayers.length === 0) {
      return { newTower: tower, clearedCount: 0 };
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

    return {
      newTower,
      tower: newTower,
      clearedCount: fullLayers.length
    };
  }

  /**
   * Computes score points and earned gems for placed block and layer clears.
   */
  function calculateScoreAndGems(placedCount, layersCleared, comboStreak = 0) {
    let score = placedCount * 15;
    let gems = placedCount;

    if (layersCleared > 0) {
      // 1 layer: 200 pts / 10 gems
      // 2 layers: 550 pts / 25 gems
      // 3 layers: 1000 pts / 50 gems
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

  /**
   * Mathematical isometric 3D projection:
   * Rotates (x, z) around the center (1, 1) by angleRad, then projects to 2D screen coordinates.
   */
  function projectIso(x, y, z, angleRad, originX, originY, tileSize = 44, layerHeight = 32) {
    // Relative to center of 3x3 platform (1, 1)
    const dx = x - 1;
    const dz = z - 1;

    // Y-axis horizontal rotation
    const rx = dx * Math.cos(angleRad) - dz * Math.sin(angleRad);
    const rz = dx * Math.sin(angleRad) + dz * Math.cos(angleRad);

    // Axonometric isometric projection
    const screenX = originX + (rx - rz) * tileSize * 0.866; // cos(30)
    const screenY = originY + (rx + rz) * tileSize * 0.5 - (y * layerHeight);

    // Depth for painter's algorithm sorting (higher depth drawn last)
    const depth = rx + rz;

    return { screenX, screenY, depth, rx, rz };
  }

  /**
   * Randomly draws next 3D shape from catalog.
   */
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

  // Exports
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
