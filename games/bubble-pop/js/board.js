/**
 * Bubble Pop — Hexagonal Grid & Physics Engine
 * Implements:
 * - Hexagonal staggered row coordinate transformations
 * - Real-time raycast trajectory with reflective wall bounces
 * - Match-3+ flood fill BFS
 * - Floating orphan island detection (avalanches)
 * - Level stage patterns (including the iconic Diamond Cluster from reference)
 */
(function(exports) {
  'use strict';

  // Constants
  const BUBBLE_RADIUS = 20; // 40px diameter
  const ROW_HEIGHT = Math.floor(BUBBLE_RADIUS * Math.sqrt(3)); // ~34.64px
  const MAX_ROWS = 14;
  const EVEN_COLS = 9;
  const ODD_COLS = 8;

  const BUBBLE_COLORS = [
    { id: 0, name: 'Coral', fill: '#ff784f', glow: '#ffa07a', symbol: '▲' },
    { id: 1, name: 'Cyan', fill: '#38bdf8', glow: '#7dd3fc', symbol: '●' },
    { id: 2, name: 'Lime', fill: '#d5ff55', glow: '#e2ff7a', symbol: '◆' },
    { id: 3, name: 'Violet', fill: '#a855f7', glow: '#c084fc', symbol: '★' },
    { id: 4, name: 'Gold', fill: '#fbbf24', glow: '#fde68a', symbol: '■' }
  ];

  /**
   * Pre-designed Puzzle Levels
   * Level 1: Faithfully recreates the user's reference screenshot (Orange & Cyan diamond cluster).
   */
  const LEVEL_PATTERNS = [
    {
      name: 'Wave 1: Pharaoh Citadel',
      moves: 22,
      targetScore: 2500,
      activeColors: [0, 1], // Coral (0) and Cyan (1)
      grid: [
        [null, null, null, 1, 1, null, null, null, null],       // Row 0 (9 cols)
        [null, null, null, 0, 0, null, null, null],             // Row 1 (8 cols)
        [null, null, 1, 1, 1, null, null, null, null],          // Row 2
        [null, null, 1, 1, 1, 1, null, null],                   // Row 3
        [null, null, 1, 1, 1, null, null, null, null],          // Row 4
        [null, null, null, 0, null, null, null, null],          // Row 5
        [null, null, 0, 0, 0, null, null, null, null],          // Row 6
        [null, null, null, 0, null, null, null, null]           // Row 7
      ]
    },
    {
      name: 'Wave 2: Emerald Bastion',
      moves: 25,
      targetScore: 3500,
      activeColors: [0, 1, 2], // Coral, Cyan, Lime
      grid: [
        [2, 2, 1, 1, 0, 0, 1, 1, 2],
        [2, 1, 0, 0, 0, 0, 1, 2],
        [null, 2, 1, 2, 2, 1, 2, null, null],
        [null, 2, 0, 1, 0, 2, null, null],
        [null, null, 1, 0, 1, null, null, null, null],
        [null, null, 2, 2, null, null, null, null]
      ]
    },
    {
      name: 'Wave 3: Cyber Prism',
      moves: 28,
      targetScore: 4800,
      activeColors: [0, 1, 2, 3], // Coral, Cyan, Lime, Violet
      grid: [
        [3, 3, 2, 2, 1, 1, 0, 0, 3],
        [3, 2, 1, 0, 0, 1, 2, 3],
        [null, 3, 2, 1, 1, 2, 3, null, null],
        [null, 3, 2, 0, 2, 3, null, null],
        [null, null, 3, 0, 3, null, null, null, null],
        [null, null, 3, 3, null, null, null, null]
      ]
    }
  ];

  /**
   * Initializes a grid from level data or empty
   */
  function createLevelGrid(levelIndex = 0) {
    const lvl = LEVEL_PATTERNS[levelIndex % LEVEL_PATTERNS.length];
    const grid = [];

    for (let r = 0; r < MAX_ROWS; r++) {
      const cols = (r % 2 === 0) ? EVEN_COLS : ODD_COLS;
      const row = [];
      const templateRow = lvl.grid[r];

      for (let c = 0; c < cols; c++) {
        if (templateRow && templateRow[c] !== undefined && templateRow[c] !== null) {
          row.push(templateRow[c]);
        } else {
          row.push(null);
        }
      }
      grid.push(row);
    }

    return {
      levelInfo: lvl,
      grid: grid
    };
  }

  /**
   * Computes pixel center coordinates for grid cell (r, c)
   */
  function getBubbleCenter(r, c, offsetX = 0, offsetY = 0, radius = BUBBLE_RADIUS) {
    const isEven = (r % 2 === 0);
    const h = Math.floor(radius * Math.sqrt(3));
    const cx = isEven
      ? offsetX + radius + c * (radius * 2)
      : offsetX + radius * 2 + c * (radius * 2);
    const cy = offsetY + radius + r * h;
    return { x: cx, y: cy };
  }

  /**
   * Returns adjacent hexagonal neighbors for cell (r, c)
   */
  function getHexNeighbors(r, c, maxRows = MAX_ROWS) {
    const neighbors = [];
    const isEven = (r % 2 === 0);
    const colsInRow = isEven ? EVEN_COLS : ODD_COLS;

    // Horizontal neighbors
    if (c > 0) neighbors.push({ r, c: c - 1 });
    if (c + 1 < colsInRow) neighbors.push({ r, c: c + 1 });

    // Upward neighbors
    if (r > 0) {
      if (isEven) {
        // Even row connects to (r-1, c-1) and (r-1, c)
        if (c - 1 >= 0) neighbors.push({ r: r - 1, c: c - 1 });
        if (c < ODD_COLS) neighbors.push({ r: r - 1, c });
      } else {
        // Odd row connects to (r-1, c) and (r-1, c+1)
        if (c >= 0) neighbors.push({ r: r - 1, c });
        if (c + 1 < EVEN_COLS) neighbors.push({ r: r - 1, c: c + 1 });
      }
    }

    // Downward neighbors
    if (r + 1 < maxRows) {
      if (isEven) {
        if (c - 1 >= 0) neighbors.push({ r: r + 1, c: c - 1 });
        if (c < ODD_COLS) neighbors.push({ r: r + 1, c });
      } else {
        if (c >= 0) neighbors.push({ r: r + 1, c });
        if (c + 1 < EVEN_COLS) neighbors.push({ r: r + 1, c: c + 1 });
      }
    }

    return neighbors;
  }

  /**
   * Finds closest vacant hexagonal cell to coordinate (x, y) adjacent to an existing bubble or ceiling.
   */
  function findBestVacantCell(x, y, grid, offsetX, offsetY, radius = BUBBLE_RADIUS) {
    let bestDist = Infinity;
    let bestCell = null;

    for (let r = 0; r < grid.length; r++) {
      const isEven = (r % 2 === 0);
      const cols = isEven ? EVEN_COLS : ODD_COLS;

      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== null) continue; // Cell must be empty

        // Must touch ceiling (r === 0) OR touch at least one existing bubble
        let isAttachable = (r === 0);
        if (!isAttachable) {
          const neighbors = getHexNeighbors(r, c, grid.length);
          for (const n of neighbors) {
            if (grid[n.r] && grid[n.r][n.c] !== null) {
              isAttachable = true;
              break;
            }
          }
        }

        if (isAttachable) {
          const center = getBubbleCenter(r, c, offsetX, offsetY, radius);
          const distSq = (x - center.x) ** 2 + (y - center.y) ** 2;
          if (distSq < bestDist) {
            bestDist = distSq;
            bestCell = { r, c, x: center.x, y: center.y };
          }
        }
      }
    }

    return bestCell;
  }

  /**
   * Raycast aiming trajectory with wall reflections
   * Returns list of line segments [{ x1, y1, x2, y2 }] and bounce points [{ x, y }]
   */
  function calculateTrajectory(originX, originY, angleRad, playW, playH, grid, offsetX, offsetY, radius = BUBBLE_RADIUS) {
    const segments = [];
    const bouncePoints = [];
    const maxBounces = 2;

    let curX = originX;
    let curY = originY;
    let dirX = Math.cos(angleRad);
    let dirY = Math.sin(angleRad);

    const leftWall = offsetX + radius;
    const rightWall = playW - offsetX - radius;
    const ceiling = offsetY + radius;

    for (let bounce = 0; bounce <= maxBounces; bounce++) {
      let hit = null;
      let stepSize = 3;
      let totalDist = 0;
      let maxDist = 800;

      let rayX = curX;
      let rayY = curY;

      while (totalDist < maxDist) {
        rayX += dirX * stepSize;
        rayY += dirY * stepSize;
        totalDist += stepSize;

        // 1. Check Ceiling Collision
        if (rayY <= ceiling) {
          hit = { type: 'ceiling', x: rayX, y: ceiling };
          break;
        }

        // 2. Check Left Wall Collision
        if (dirX < 0 && rayX <= leftWall) {
          hit = { type: 'wall_left', x: leftWall, y: rayY };
          break;
        }

        // 3. Check Right Wall Collision
        if (dirX > 0 && rayX >= rightWall) {
          hit = { type: 'wall_right', x: rightWall, y: rayY };
          break;
        }

        // 4. Check Collision with existing bubbles
        let bubbleHit = false;
        for (let r = 0; r < grid.length; r++) {
          const isEven = (r % 2 === 0);
          const cols = isEven ? EVEN_COLS : ODD_COLS;
          for (let c = 0; c < cols; c++) {
            if (grid[r][c] === null) continue;
            const bPos = getBubbleCenter(r, c, offsetX, offsetY, radius);
            const distSq = (rayX - bPos.x) ** 2 + (rayY - bPos.y) ** 2;
            if (distSq <= (radius * 1.85) ** 2) {
              hit = { type: 'bubble', x: rayX, y: rayY };
              bubbleHit = true;
              break;
            }
          }
          if (bubbleHit) break;
        }

        if (bubbleHit) break;
      }

      if (hit) {
        segments.push({ x1: curX, y1: curY, x2: hit.x, y2: hit.y });

        if (hit.type === 'wall_left' || hit.type === 'wall_right') {
          bouncePoints.push({ x: hit.x, y: hit.y });
          curX = hit.x;
          curY = hit.y;
          dirX = -dirX; // Reflect horizontally!
        } else {
          // Hit ceiling or bubble -> Stop trajectory
          const targetSlot = findBestVacantCell(hit.x, hit.y, grid, offsetX, offsetY, radius);
          return { segments, bouncePoints, targetSlot, hitPoint: { x: hit.x, y: hit.y } };
        }
      } else {
        segments.push({ x1: curX, y1: curY, x2: rayX, y2: rayY });
        break;
      }
    }

    return { segments, bouncePoints, targetSlot: null, hitPoint: null };
  }

  /**
   * BFS flood fill to find all connected matching-color bubbles starting at (startR, startC)
   */
  function findMatchCluster(grid, startR, startC) {
    if (!grid || startR < 0 || startR >= grid.length) return [];
    const targetColor = grid[startR][startC];
    if (targetColor === null || targetColor === undefined) return [];

    const cluster = [];
    const queue = [{ r: startR, c: startC }];
    const visited = new Set([`${startR},${startC}`]);

    while (queue.length > 0) {
      const cur = queue.shift();
      cluster.push({ r: cur.r, c: cur.c, color: targetColor });

      const neighbors = getHexNeighbors(cur.r, cur.c, grid.length);
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (!visited.has(key) && grid[n.r] && grid[n.r][n.c] === targetColor) {
          visited.add(key);
          queue.push(n);
        }
      }
    }

    return cluster;
  }

  /**
   * Finds all orphan bubbles (disconnected from top ceiling row 0)
   */
  function findOrphanBubbles(grid) {
    const visited = new Set();
    const queue = [];

    // All bubbles in row 0 are anchored to the ceiling
    if (grid[0]) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[0][c] !== null) {
          queue.push({ r: 0, c });
          visited.add(`0,${c}`);
        }
      }
    }

    // BFS to find all reachable bubbles anchored to ceiling
    while (queue.length > 0) {
      const cur = queue.shift();
      const neighbors = getHexNeighbors(cur.r, cur.c, grid.length);
      for (const n of neighbors) {
        const key = `${n.r},${n.c}`;
        if (!visited.has(key) && grid[n.r] && grid[n.r][n.c] !== null) {
          visited.add(key);
          queue.push(n);
        }
      }
    }

    // Any bubble in grid that was not visited is an orphan
    const orphans = [];
    for (let r = 0; r < grid.length; r++) {
      const cols = (r % 2 === 0) ? EVEN_COLS : ODD_COLS;
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] !== null && !visited.has(`${r},${c}`)) {
          orphans.push({ r, c, color: grid[r][c] });
        }
      }
    }

    return orphans;
  }

  /**
   * Counts non-null bubbles remaining on grid
   */
  function countActiveBubbles(grid) {
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] !== null) count++;
      }
    }
    return count;
  }

  /**
   * Gets list of distinct colors currently present on the grid
   */
  function getRemainingColors(grid) {
    const set = new Set();
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] !== null) set.add(grid[r][c]);
      }
    }
    return Array.from(set);
  }

  // Exports
  exports.BUBBLE_RADIUS = BUBBLE_RADIUS;
  exports.ROW_HEIGHT = ROW_HEIGHT;
  exports.MAX_ROWS = MAX_ROWS;
  exports.EVEN_COLS = EVEN_COLS;
  exports.ODD_COLS = ODD_COLS;
  exports.BUBBLE_COLORS = BUBBLE_COLORS;
  exports.LEVEL_PATTERNS = LEVEL_PATTERNS;
  exports.createLevelGrid = createLevelGrid;
  exports.getBubbleCenter = getBubbleCenter;
  exports.getHexNeighbors = getHexNeighbors;
  exports.findBestVacantCell = findBestVacantCell;
  exports.calculateTrajectory = calculateTrajectory;
  exports.findMatchCluster = findMatchCluster;
  exports.findOrphanBubbles = findOrphanBubbles;
  exports.countActiveBubbles = countActiveBubbles;
  exports.getRemainingColors = getRemainingColors;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.BubbleBoard = {}));
