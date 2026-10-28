/**
 * Bubble Pop — Core Board & Logic Engine
 * Pure functional game state algorithms: cluster flood-fill, gravity cascades,
 * column compression, and scoring calculations.
 */
(function(exports) {
  'use strict';

  const BUBBLE_THEMES = [
    { id: 0, name: 'Lime', fill: '#d5ff55', glow: '#e2ff7a', rim: 'rgba(213, 255, 85, 0.4)', symbol: '◆' },
    { id: 1, name: 'Coral', fill: '#ff784f', glow: '#ff9878', rim: 'rgba(255, 120, 79, 0.4)', symbol: '▲' },
    { id: 2, name: 'Cyan', fill: '#38bdf8', glow: '#7dd3fc', rim: 'rgba(56, 189, 248, 0.4)', symbol: '●' },
    { id: 3, name: 'Violet', fill: '#a855f7', glow: '#c084fc', rim: 'rgba(168, 85, 247, 0.4)', symbol: '★' },
    { id: 4, name: 'Gold', fill: '#fbbf24', glow: '#fde68a', rim: 'rgba(251, 191, 36, 0.4)', symbol: '■' }
  ];

  /**
   * Generates a 2D matrix of bubble color indexes.
   * Ensures at least one valid cluster (>=2 connected bubbles) exists.
   */
  function createInitialGrid(rows = 10, cols = 8, numColors = 5, rng = Math.random) {
    let grid;
    let attempts = 0;

    do {
      grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(Math.floor(rng() * numColors));
        }
        grid.push(row);
      }
      attempts++;
    } while (!hasValidMoves(grid) && attempts < 50);

    return grid;
  }

  /**
   * Breadth-First-Search flood fill to find all orthogonally adjacent
   * bubbles of the same color starting at (startRow, startCol).
   */
  function findCluster(grid, startRow, startCol) {
    if (!grid || startRow < 0 || startRow >= grid.length) return [];
    if (startCol < 0 || startCol >= grid[0].length) return [];

    const targetColor = grid[startRow][startCol];
    if (targetColor === null || targetColor === undefined) return [];

    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const cluster = [];
    const queue = [{ r: startRow, c: startCol }];
    visited[startRow][startCol] = true;

    const dirs = [
      [-1, 0], // Up
      [1, 0],  // Down
      [0, -1], // Left
      [0, 1]   // Right
    ];

    while (queue.length > 0) {
      const current = queue.shift();
      cluster.push({ row: current.r, col: current.c, colorIndex: targetColor });

      for (let i = 0; i < dirs.length; i++) {
        const nr = current.r + dirs[i][0];
        const nc = current.c + dirs[i][1];

        if (
          nr >= 0 &&
          nr < rows &&
          nc >= 0 &&
          nc < cols &&
          !visited[nr][nc] &&
          grid[nr][nc] === targetColor
        ) {
          visited[nr][nc] = true;
          queue.push({ r: nr, c: nc });
        }
      }
    }

    return cluster;
  }

  /**
   * Checks whether the current board contains at least one pop-able cluster (>=2 bubbles).
   */
  function hasValidMoves(grid) {
    if (!grid || grid.length === 0 || grid[0].length === 0) return false;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = grid[r][c];
        if (color === null || color === undefined) continue;

        // Check right neighbor
        if (c + 1 < cols && grid[r][c + 1] === color) {
          return true;
        }
        // Check bottom neighbor
        if (r + 1 < rows && grid[r + 1][c] === color) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Counts the number of non-null bubbles left on the board.
   */
  function countRemainingBubbles(grid) {
    if (!grid) return 0;
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] !== null && grid[r][c] !== undefined) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Computes score awarded for a cluster pop.
   * Formula: (clusterSize ^ 2) * 10 * comboMultiplier
   */
  function calculateScore(clusterSize, combo = 1) {
    if (clusterSize < 2) return 0;
    const base = clusterSize * clusterSize * 10;
    const multiplier = Math.min(5, Math.max(1, Math.floor(combo)));
    return base * multiplier;
  }

  /**
   * Applies downward gravity to fill emptied cells,
   * followed by horizontal compression of empty columns to the left.
   * Returns:
   *   - newGrid: updated matrix
   *   - drops: list of bubble drops { fromRow, fromCol, toRow, toCol, colorIndex }
   *   - slides: list of column shifts { fromCol, toCol }
   */
  function applyGravityAndCollapse(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    // 1. Clone grid
    const working = grid.map(row => [...row]);
    const drops = [];

    // Phase 1: Gravity (Vertical drop down in each column)
    for (let c = 0; c < cols; c++) {
      let writeRow = rows - 1;
      for (let r = rows - 1; r >= 0; r--) {
        if (working[r][c] !== null && working[r][c] !== undefined) {
          if (r !== writeRow) {
            drops.push({
              fromRow: r,
              fromCol: c,
              toRow: writeRow,
              toCol: c,
              colorIndex: working[r][c]
            });
            working[writeRow][c] = working[r][c];
            working[r][c] = null;
          }
          writeRow--;
        }
      }
    }

    // Phase 2: Column Compression (Horizontal slide left for empty columns)
    const slides = [];
    let writeCol = 0;

    for (let c = 0; c < cols; c++) {
      // Check if column c has any remaining bubble
      let colHasBubble = false;
      for (let r = 0; r < rows; r++) {
        if (working[r][c] !== null && working[r][c] !== undefined) {
          colHasBubble = true;
          break;
        }
      }

      if (colHasBubble) {
        if (c !== writeCol) {
          slides.push({ fromCol: c, toCol: writeCol });
          for (let r = 0; r < rows; r++) {
            working[r][writeCol] = working[r][c];
            working[r][c] = null;
          }
        }
        writeCol++;
      }
    }

    return {
      newGrid: working,
      drops,
      slides
    };
  }

  /**
   * Evaluates star performance based on total score and remaining bubbles.
   */
  function calculateStars(score, remainingBubbles) {
    if (remainingBubbles === 0) return 3; // Perfect Clear
    if (score >= 4000 || remainingBubbles <= 4) return 3;
    if (score >= 2200 || remainingBubbles <= 10) return 2;
    return 1;
  }

  /**
   * Inserts a new row of bubbles at the top, shifting existing bubbles down (used in Blitz mode).
   */
  function insertTopRow(grid, numColors = 5, rng = Math.random) {
    const rows = grid.length;
    const cols = grid[0].length;
    const newGrid = [];

    // Top row
    const topRow = [];
    for (let c = 0; c < cols; c++) {
      topRow.push(Math.floor(rng() * numColors));
    }
    newGrid.push(topRow);

    // Shift other rows down (last row pushed off if full)
    for (let r = 0; r < rows - 1; r++) {
      newGrid.push([...grid[r]]);
    }

    return newGrid;
  }

  // Exports
  exports.BUBBLE_THEMES = BUBBLE_THEMES;
  exports.createInitialGrid = createInitialGrid;
  exports.findCluster = findCluster;
  exports.hasValidMoves = hasValidMoves;
  exports.countRemainingBubbles = countRemainingBubbles;
  exports.calculateScore = calculateScore;
  exports.applyGravityAndCollapse = applyGravityAndCollapse;
  exports.calculateStars = calculateStars;
  exports.insertTopRow = insertTopRow;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.BubbleBoard = {}));
