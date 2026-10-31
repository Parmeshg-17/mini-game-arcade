/**
 * Merge Grid — Core Puzzle Engine (2048-style Sliding Logic)
 * Pure functional puzzle algorithms: Row compression, directional tile shifts,
 * value merging, score accrual, undo snapshots, random spawning, win/loss states.
 */
(function(exports) {
  'use strict';

  const GRID_SIZE = 4;
  const WIN_VALUE = 2048;

  function idx(r, c) {
    return r * GRID_SIZE + c;
  }

  /**
   * Compresses and merges a single 1D row array to the left.
   * e.g. [2, 2, 4, 8] -> { row: [4, 4, 8, 0], score: 4, merged: true }
   * e.g. [4, 4, 4, 4] -> { row: [8, 8, 0, 0], score: 16, merged: true }
   */
  function slideRow(row) {
    const nonZero = row.filter(v => v !== 0);
    const merged = [];
    let score = 0;
    let mergedAny = false;

    for (let i = 0; i < nonZero.length; i++) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const val = nonZero[i] * 2;
        merged.push(val);
        score += val;
        mergedAny = true;
        i++; // skip combined pair
      } else {
        merged.push(nonZero[i]);
      }
    }

    while (merged.length < GRID_SIZE) {
      merged.push(0);
    }

    return { row: merged, score, merged: mergedAny };
  }

  /**
   * Applies a directional move to an entire 16-cell board.
   * @param {Array<number>} currentBoard 16-element board array
   * @param {'left'|'right'|'up'|'down'} direction
   * @returns {{ board: Array<number>, score: number, changed: boolean, merged: boolean }}
   */
  function moveBoard(currentBoard, direction) {
    let changed = false;
    let totalScore = 0;
    let mergedAny = false;
    const nextBoard = currentBoard.slice();

    if (direction === 'left') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const row = [nextBoard[idx(r,0)], nextBoard[idx(r,1)], nextBoard[idx(r,2)], nextBoard[idx(r,3)]];
        const res = slideRow(row);
        totalScore += res.score;
        if (res.merged) mergedAny = true;
        for (let c = 0; c < GRID_SIZE; c++) {
          if (nextBoard[idx(r,c)] !== res.row[c]) changed = true;
          nextBoard[idx(r,c)] = res.row[c];
        }
      }
    } else if (direction === 'right') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const row = [nextBoard[idx(r,3)], nextBoard[idx(r,2)], nextBoard[idx(r,1)], nextBoard[idx(r,0)]];
        const res = slideRow(row);
        totalScore += res.score;
        if (res.merged) mergedAny = true;
        const rev = res.row.slice().reverse();
        for (let c = 0; c < GRID_SIZE; c++) {
          if (nextBoard[idx(r,c)] !== rev[c]) changed = true;
          nextBoard[idx(r,c)] = rev[c];
        }
      }
    } else if (direction === 'up') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = [nextBoard[idx(0,c)], nextBoard[idx(1,c)], nextBoard[idx(2,c)], nextBoard[idx(3,c)]];
        const res = slideRow(col);
        totalScore += res.score;
        if (res.merged) mergedAny = true;
        for (let r = 0; r < GRID_SIZE; r++) {
          if (nextBoard[idx(r,c)] !== res.row[r]) changed = true;
          nextBoard[idx(r,c)] = res.row[r];
        }
      }
    } else if (direction === 'down') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const col = [nextBoard[idx(3,c)], nextBoard[idx(2,c)], nextBoard[idx(1,c)], nextBoard[idx(0,c)]];
        const res = slideRow(col);
        totalScore += res.score;
        if (res.merged) mergedAny = true;
        const rev = res.row.slice().reverse();
        for (let r = 0; r < GRID_SIZE; r++) {
          if (nextBoard[idx(r,c)] !== rev[r]) changed = true;
          nextBoard[idx(r,c)] = rev[r];
        }
      }
    }

    return {
      board: nextBoard,
      score: totalScore,
      changed,
      merged: mergedAny
    };
  }

  function getEmptyIndices(board) {
    const res = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 0) res.push(i);
    }
    return res;
  }

  function spawnTile(board, randomFn = Math.random) {
    const empties = getEmptyIndices(board);
    if (!empties.length) return { board: board.slice(), spawned: false, index: -1, value: 0 };
    const spawnIndex = empties[Math.floor(randomFn() * empties.length)];
    const val = randomFn() < 0.9 ? 2 : 4;
    const newBoard = board.slice();
    newBoard[spawnIndex] = val;
    return { board: newBoard, spawned: true, index: spawnIndex, value: val };
  }

  function hasMovesLeft(board) {
    if (board.includes(0)) return true;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const v = board[idx(r, c)];
        if (c + 1 < GRID_SIZE && board[idx(r, c + 1)] === v) return true;
        if (r + 1 < GRID_SIZE && board[idx(r + 1, c)] === v) return true;
      }
    }
    return false;
  }

  function isWin(board) {
    return board.includes(WIN_VALUE);
  }

  function createInitialBoard(randomFn = Math.random) {
    let b = new Array(GRID_SIZE * GRID_SIZE).fill(0);
    b = spawnTile(b, randomFn).board;
    b = spawnTile(b, randomFn).board;
    return b;
  }

  exports.GRID_SIZE = GRID_SIZE;
  exports.WIN_VALUE = WIN_VALUE;
  exports.slideRow = slideRow;
  exports.moveBoard = moveBoard;
  exports.getEmptyIndices = getEmptyIndices;
  exports.spawnTile = spawnTile;
  exports.hasMovesLeft = hasMovesLeft;
  exports.isWin = isWin;
  exports.createInitialBoard = createInitialBoard;

})(typeof exports === 'undefined' ? (window.MergeGridEngine = {}) : exports);
