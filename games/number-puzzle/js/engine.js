/**
 * Number Puzzle — Sliding Tile Core Engine (15-Puzzle)
 * Pure functional puzzle algorithms: Solvability guarantee, tile movement,
 * multi-tile sliding chains, keyboard directional sliding, and win detection.
 */
(function(exports) {
  'use strict';

  const DIFFICULTIES = {
    easy: { size: 3, label: '3×3 (8 Tiles)', shuffleMoves: 60, starThreshold: 45 },
    classic: { size: 4, label: '4×4 (15 Tiles)', shuffleMoves: 140, starThreshold: 90 },
    expert: { size: 5, label: '5×5 (24 Tiles)', shuffleMoves: 220, starThreshold: 160 }
  };

  /**
   * Generates a completed, in-order board matrix.
   * Empty space is represented by 0 (at the bottom-right).
   */
  function createSolvedBoard(size = 4) {
    const total = size * size;
    const board = [];
    for (let i = 1; i < total; i++) {
      board.push(i);
    }
    board.push(0); // Empty space
    return board;
  }

  /**
   * Checks if the board is completely arranged in ascending order 1..N-1 with 0 at the end.
   */
  function isSolved(board) {
    if (!board || board.length === 0) return false;
    for (let i = 0; i < board.length - 1; i++) {
      if (board[i] !== i + 1) return false;
    }
    return board[board.length - 1] === 0;
  }

  /**
   * Finds index of the empty slot (0)
   */
  function getBlankIndex(board) {
    return board.indexOf(0);
  }

  /**
   * Returns list of tile indices that can immediately slide into the empty space.
   */
  function getAdjacentMovableIndices(board, size = 4) {
    const blank = getBlankIndex(board);
    if (blank === -1) return [];

    const row = Math.floor(blank / size);
    const col = blank % size;
    const movable = [];

    // Left neighbor
    if (col > 0) movable.push(blank - 1);
    // Right neighbor
    if (col < size - 1) movable.push(blank + 1);
    // Up neighbor
    if (row > 0) movable.push(blank - size);
    // Down neighbor
    if (row < size - 1) movable.push(blank + size);

    return movable;
  }

  /**
   * Checks if a tile can be slid towards the empty space.
   * Supports both adjacent tiles and linear chain slides in the same row/col.
   */
  function canSlide(board, tileIndex, size = 4) {
    if (tileIndex < 0 || tileIndex >= board.length || board[tileIndex] === 0) {
      return false;
    }
    const blank = getBlankIndex(board);
    const tRow = Math.floor(tileIndex / size);
    const tCol = tileIndex % size;
    const bRow = Math.floor(blank / size);
    const bCol = blank % size;

    return tRow === bRow || tCol === bCol;
  }

  /**
   * Slides a tile (or a continuous chain of tiles in the same row/column) towards the blank space.
   */
  function slideTiles(board, tileIndex, size = 4) {
    if (!canSlide(board, tileIndex, size)) {
      return { newBoard: board, movedCount: 0, changed: false };
    }

    const blank = getBlankIndex(board);
    const tRow = Math.floor(tileIndex / size);
    const tCol = tileIndex % size;
    const bRow = Math.floor(blank / size);
    const bCol = blank % size;

    const newBoard = [...board];
    let movedCount = 0;

    if (tRow === bRow) {
      // Horizontal slide along the row
      const step = tCol < bCol ? 1 : -1;
      for (let c = bCol; c !== tCol; c -= step) {
        const fromIdx = tRow * size + (c - step);
        const toIdx = tRow * size + c;
        newBoard[toIdx] = newBoard[fromIdx];
        movedCount++;
      }
      newBoard[tileIndex] = 0;
    } else if (tCol === bCol) {
      // Vertical slide along the column
      const step = tRow < bRow ? 1 : -1;
      for (let r = bRow; r !== tRow; r -= step) {
        const fromIdx = (r - step) * size + tCol;
        const toIdx = r * size + tCol;
        newBoard[toIdx] = newBoard[fromIdx];
        movedCount++;
      }
      newBoard[tileIndex] = 0;
    }

    return {
      newBoard,
      movedCount,
      changed: movedCount > 0
    };
  }

  /**
   * Keyboard direction slide: Moves the adjacent tile into the blank space.
   * Direction is from player perspective (e.g. 'up' moves the tile below the blank upward).
   */
  function slideDirection(board, direction, size = 4) {
    const blank = getBlankIndex(board);
    const row = Math.floor(blank / size);
    const col = blank % size;
    let targetIndex = -1;

    switch (direction) {
      case 'up':
        // Move tile below blank up into empty space
        if (row < size - 1) targetIndex = (row + 1) * size + col;
        break;
      case 'down':
        // Move tile above blank down into empty space
        if (row > 0) targetIndex = (row - 1) * size + col;
        break;
      case 'left':
        // Move tile to the right of blank left into empty space
        if (col < size - 1) targetIndex = row * size + (col + 1);
        break;
      case 'right':
        // Move tile to the left of blank right into empty space
        if (col > 0) targetIndex = row * size + (col - 1);
        break;
    }

    if (targetIndex !== -1) {
      return slideTiles(board, targetIndex, size);
    }

    return { newBoard: board, movedCount: 0, changed: false };
  }

  /**
   * Shuffles board by performing random valid slides starting from solved state.
   * 100% guaranteed to be mathematically solvable!
   */
  function shuffleBoard(size = 4, moveCount = 140, rng = Math.random) {
    let board = createSolvedBoard(size);
    let lastMoved = -1;

    for (let i = 0; i < moveCount; i++) {
      const movables = getAdjacentMovableIndices(board, size).filter(idx => idx !== lastMoved);
      const chosen = movables[Math.floor(rng() * movables.length)];
      lastMoved = getBlankIndex(board);
      board = slideTiles(board, chosen, size).newBoard;
    }

    // Safety fallback: if somehow still solved after shuffling, make one more legal swap
    if (isSolved(board)) {
      const movables = getAdjacentMovableIndices(board, size);
      board = slideTiles(board, movables[0], size).newBoard;
    }

    return board;
  }

  /**
   * Counts how many tiles are currently in their correct final target position
   */
  function countCorrectTiles(board) {
    if (!board) return 0;
    let correct = 0;
    for (let i = 0; i < board.length - 1; i++) {
      if (board[i] === i + 1) correct++;
    }
    if (board[board.length - 1] === 0) correct++;
    return correct;
  }

  /**
   * Evaluates star performance based on moves taken
   */
  function calculateStars(moves, difficultyKey = 'classic') {
    const diff = DIFFICULTIES[difficultyKey] || DIFFICULTIES.classic;
    const thresh = diff.starThreshold;

    if (moves <= thresh) return 3;
    if (moves <= thresh * 1.6) return 2;
    return 1;
  }

  // Exports
  exports.DIFFICULTIES = DIFFICULTIES;
  exports.createSolvedBoard = createSolvedBoard;
  exports.isSolved = isSolved;
  exports.getBlankIndex = getBlankIndex;
  exports.getAdjacentMovableIndices = getAdjacentMovableIndices;
  exports.canSlide = canSlide;
  exports.slideTiles = slideTiles;
  exports.slideDirection = slideDirection;
  exports.shuffleBoard = shuffleBoard;
  exports.countCorrectTiles = countCorrectTiles;
  exports.calculateStars = calculateStars;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.NumberEngine = {}));

