/**
 * Block Puzzle — Pure Functional Game Engine
 * Core algorithms: 8x8 grid matrix, polyomino shapes, collision checking,
 * row/column line completion detection, board clearing, combo streaks,
 * smart solvability shape dealing, and game-over reachability validation.
 */
(function(exports) {
  'use strict';

  const GRID_SIZE = 8;

  // Shapes catalog with visual dimensions, categories, and color branding
  const SHAPES = [
    // 1x1 Dot (Small)
    { id: 'dot', name: '1x1 Dot', tier: 'small', matrix: [[1]], color: '#d5ff55' },

    // 1x2 and 2x1 Lines (Small)
    { id: 'line2h', name: '1x2 Bar', tier: 'small', matrix: [[1, 1]], color: '#38bdf8' },
    { id: 'line2v', name: '2x1 Bar', tier: 'small', matrix: [[1], [1]], color: '#38bdf8' },

    // 1x3 and 3x1 Lines (Medium)
    { id: 'line3h', name: '1x3 Bar', tier: 'medium', matrix: [[1, 1, 1]], color: '#38bdf8' },
    { id: 'line3v', name: '3x1 Bar', tier: 'medium', matrix: [[1], [1], [1]], color: '#38bdf8' },

    // 1x4 and 4x1 Lines (Large)
    { id: 'line4h', name: '1x4 Bar', tier: 'large', matrix: [[1, 1, 1, 1]], color: '#60a5fa' },
    { id: 'line4v', name: '4x1 Bar', tier: 'large', matrix: [[1], [1], [1], [1]], color: '#60a5fa' },

    // 1x5 and 5x1 Lines (Large)
    { id: 'line5h', name: '1x5 Bar', tier: 'large', matrix: [[1, 1, 1, 1, 1]], color: '#818cf8' },
    { id: 'line5v', name: '5x1 Bar', tier: 'large', matrix: [[1], [1], [1], [1], [1]], color: '#818cf8' },

    // 2x2 Square (Medium)
    { id: 'square2', name: '2x2 Box', tier: 'medium', matrix: [[1, 1], [1, 1]], color: '#ffd166' },

    // 3x3 Big Square (Large)
    { id: 'square3', name: '3x3 Giant Box', tier: 'large', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#ff784f' },

    // 2x2 Small Corners (Small)
    { id: 'corner2_tl', name: 'Corner TL', tier: 'small', matrix: [[1, 1], [1, 0]], color: '#c084fc' },
    { id: 'corner2_tr', name: 'Corner TR', tier: 'small', matrix: [[1, 1], [0, 1]], color: '#c084fc' },
    { id: 'corner2_bl', name: 'Corner BL', tier: 'small', matrix: [[1, 0], [1, 1]], color: '#c084fc' },
    { id: 'corner2_br', name: 'Corner BR', tier: 'small', matrix: [[0, 1], [1, 1]], color: '#c084fc' },

    // 3x3 Large Corners (Large)
    { id: 'corner3_tl', name: 'Big Corner TL', tier: 'large', matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: '#fb7185' },
    { id: 'corner3_tr', name: 'Big Corner TR', tier: 'large', matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], color: '#fb7185' },
    { id: 'corner3_bl', name: 'Big Corner BL', tier: 'large', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: '#fb7185' },
    { id: 'corner3_br', name: 'Big Corner BR', tier: 'large', matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], color: '#fb7185' },

    // T-Shapes (Medium)
    { id: 't_down', name: 'T Down', tier: 'medium', matrix: [[1, 1, 1], [0, 1, 0]], color: '#a78bfa' },
    { id: 't_up', name: 'T Up', tier: 'medium', matrix: [[0, 1, 0], [1, 1, 1]], color: '#a78bfa' },

    // Z and S Shapes (Medium)
    { id: 'z_shape', name: 'Z Block', tier: 'medium', matrix: [[1, 1, 0], [0, 1, 1]], color: '#4ade80' },
    { id: 's_shape', name: 'S Block', tier: 'medium', matrix: [[0, 1, 1], [1, 1, 0]], color: '#4ade80' }
  ];

  /**
   * Creates an empty 8x8 board filled with null.
   */
  function createEmptyGrid(size = GRID_SIZE) {
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid.push(new Array(size).fill(null));
    }
    return grid;
  }

  /**
   * Clones a 2D grid matrix.
   */
  function cloneGrid(grid) {
    return grid.map(row => [...row]);
  }

  /**
   * Checks whether a shape matrix can be legally placed at (startRow, startCol).
   */
  function canPlaceShape(grid, shapeMatrix, startRow, startCol, size = GRID_SIZE) {
    if (!shapeMatrix || shapeMatrix.length === 0) return false;
    const h = shapeMatrix.length;
    const w = shapeMatrix[0].length;

    // Boundary check
    if (startRow < 0 || startCol < 0 || startRow + h > size || startCol + w > size) {
      return false;
    }

    // Cell overlap check
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (shapeMatrix[r][c] === 1) {
          if (grid[startRow + r][startCol + c] !== null) {
            return false; // Cell already occupied
          }
        }
      }
    }

    return true;
  }

  /**
   * Places a shape matrix into the grid and returns the new grid.
   */
  function placeShape(grid, shapeMatrix, startRow, startCol, color = '#d5ff55', size = GRID_SIZE) {
    if (!canPlaceShape(grid, shapeMatrix, startRow, startCol, size)) {
      return { success: false, newGrid: grid, placedCount: 0 };
    }

    const newGrid = cloneGrid(grid);
    const h = shapeMatrix.length;
    const w = shapeMatrix[0].length;
    let placedCount = 0;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (shapeMatrix[r][c] === 1) {
          newGrid[startRow + r][startCol + c] = color;
          placedCount++;
        }
      }
    }

    return { success: true, newGrid, placedCount };
  }

  /**
   * Inspects the grid for completed horizontal rows and vertical columns.
   */
  function checkCompletedLines(grid, size = GRID_SIZE) {
    const fullRows = [];
    const fullCols = [];

    // Check rows
    for (let r = 0; r < size; r++) {
      let isRowFull = true;
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === null) {
          isRowFull = false;
          break;
        }
      }
      if (isRowFull) fullRows.push(r);
    }

    // Check columns
    for (let c = 0; c < size; c++) {
      let isColFull = true;
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === null) {
          isColFull = false;
          break;
        }
      }
      if (isColFull) fullCols.push(c);
    }

    return {
      fullRows,
      fullCols,
      totalLines: fullRows.length + fullCols.length
    };
  }

  /**
   * Clears completed rows and columns from the grid.
   */
  function clearLines(grid, fullRows = [], fullCols = [], size = GRID_SIZE) {
    if (fullRows.length === 0 && fullCols.length === 0) {
      return { newGrid: grid, clearedCells: 0 };
    }

    const newGrid = cloneGrid(grid);
    let clearedCells = 0;

    // Clear rows
    for (const r of fullRows) {
      for (let c = 0; c < size; c++) {
        if (newGrid[r][c] !== null) {
          newGrid[r][c] = null;
          clearedCells++;
        }
      }
    }

    // Clear cols
    for (const c of fullCols) {
      for (let r = 0; r < size; r++) {
        if (newGrid[r][c] !== null) {
          newGrid[r][c] = null;
          clearedCells++;
        }
      }
    }

    return { newGrid, clearedCells };
  }

  /**
   * Checks if a single specific shape can fit ANYWHERE on the board.
   */
  function canShapeFitAnywhere(grid, shapeMatrix, size = GRID_SIZE) {
    if (!shapeMatrix || shapeMatrix.length === 0) return false;
    const h = shapeMatrix.length;
    const w = shapeMatrix[0].length;

    for (let r = 0; r <= size - h; r++) {
      for (let c = 0; c <= size - w; c++) {
        if (canPlaceShape(grid, shapeMatrix, r, c, size)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Determines if ANY available dock shape can still be placed ANYWHERE on the board.
   * If false, player is completely blocked (Game Over).
   */
  function hasAnyValidMove(grid, availableShapes, size = GRID_SIZE) {
    if (!availableShapes || availableShapes.length === 0) return true;

    for (const shape of availableShapes) {
      if (!shape) continue;
      if (canShapeFitAnywhere(grid, shape.matrix, size)) {
        return true;
      }
    }

    return false; // No legal moves remain
  }

  /**
   * Calculates score for a placement including block points, line clear bonus, and combo multipliers.
   */
  function calculatePlacementScore(placedBlocks, totalLinesCleared, comboStreak = 0) {
    // 10 pts per placed block cell
    let score = placedBlocks * 10;

    if (totalLinesCleared > 0) {
      // Line bonus table: 1 line = 100, 2 lines = 300, 3 lines = 600, 4+ lines = 1000+
      const lineBonuses = [0, 100, 300, 600, 1000, 1500, 2100];
      const baseLineScore = lineBonuses[Math.min(totalLinesCleared, lineBonuses.length - 1)] || (totalLinesCleared * 350);

      // Streak multiplier: 1x, 1.5x, 2x, 2.5x, etc.
      const multiplier = 1 + (Math.max(0, comboStreak) * 0.5);
      score += Math.round(baseLineScore * multiplier);
    }

    return score;
  }

  /**
   * Intelligently deals a balanced, solvable hand of 3 shapes.
   * - Prevents dealing 3 large/unplaceable shapes in one hand.
   * - If grid is provided, guarantees at least one shape is currently placeable!
   * - Automatically favors smaller/combo-enabling shapes when board density is high.
   */
  function dealShapes(count = 3, rng = Math.random, grid = null) {
    const smallShapes = SHAPES.filter(s => s.tier === 'small');
    const mediumShapes = SHAPES.filter(s => s.tier === 'medium');
    const largeShapes = SHAPES.filter(s => s.tier === 'large');

    // Calculate grid density if grid provided
    let density = 0;
    if (grid && grid.length > 0) {
      let occupied = 0;
      const totalCells = grid.length * grid[0].length;
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c] !== null) occupied++;
        }
      }
      density = occupied / totalCells;
    }

    const dealt = [];
    let largeCount = 0;

    for (let i = 0; i < count; i++) {
      let pool = SHAPES;

      // Restrict large shapes: at most 1 large shape per hand
      if (largeCount >= 1 || density > 0.45) {
        pool = [...smallShapes, ...mediumShapes];
      } else if (density > 0.65) {
        // High density -> heavy weight on small shapes to allow comebacks
        pool = [...smallShapes, ...smallShapes, ...mediumShapes];
      }

      const chosen = pool[Math.floor(rng() * pool.length)];
      if (chosen.tier === 'large') largeCount++;

      dealt.push({
        id: chosen.id,
        name: chosen.name,
        tier: chosen.tier,
        matrix: chosen.matrix.map(row => [...row]),
        color: chosen.color
      });
    }

    // Solvability safeguard: if grid is provided, ensure at least 1 shape can fit!
    if (grid) {
      const anyCanFit = dealt.some(s => canShapeFitAnywhere(grid, s.matrix));
      if (!anyCanFit) {
        // Replace the last shape with a guaranteed small shape (e.g. dot or 1x2 bar)
        const solvableShape = smallShapes.find(s => canShapeFitAnywhere(grid, s.matrix)) || smallShapes[0];
        dealt[dealt.length - 1] = {
          id: solvableShape.id,
          name: solvableShape.name,
          tier: solvableShape.tier,
          matrix: solvableShape.matrix.map(row => [...row]),
          color: solvableShape.color
        };
      }
    }

    return dealt;
  }

  /**
   * Evaluates performance star rating based on score or lines cleared.
   */
  function calculateStars(score, linesCleared, mode = 'classic') {
    if (mode === 'challenge') {
      if (linesCleared >= 10 && score >= 2000) return 3;
      if (linesCleared >= 10) return 2;
      return 1;
    }
    if (score >= 3500) return 3;
    if (score >= 1800) return 2;
    return 1;
  }

  // Exports
  exports.GRID_SIZE = GRID_SIZE;
  exports.SHAPES = SHAPES;
  exports.createEmptyGrid = createEmptyGrid;
  exports.cloneGrid = cloneGrid;
  exports.canPlaceShape = canPlaceShape;
  exports.canShapeFitAnywhere = canShapeFitAnywhere;
  exports.placeShape = placeShape;
  exports.checkCompletedLines = checkCompletedLines;
  exports.clearLines = clearLines;
  exports.hasAnyValidMove = hasAnyValidMove;
  exports.calculatePlacementScore = calculatePlacementScore;
  exports.dealShapes = dealShapes;
  exports.calculateStars = calculateStars;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.BlockEngine = {}));
