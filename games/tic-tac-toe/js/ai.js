/**
 * Tic Tac Toe — AI Decision Engine
 * Implements Minimax with depth penalty for Mastermind AI,
 * plus a balanced Casual Bot for approachable arcade play.
 */

(function () {
  'use strict';

  // 8 Winning Combinations across 3x3 Grid
  const WINNING_COMBINATIONS = [
    [0, 1, 2], // Row 0
    [3, 4, 5], // Row 1
    [6, 7, 8], // Row 2
    [0, 3, 6], // Col 0
    [1, 4, 7], // Col 1
    [2, 5, 8], // Col 2
    [0, 4, 8], // Diag 1
    [2, 4, 6]  // Diag 2
  ];

  /**
   * Check if the current board has a winner.
   * @param {Array<string>} board - 9-element array of '', 'X', or 'O'
   * @returns {{ winner: string, line: Array<number> } | null}
   */
  function checkWinner(board) {
    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
      const [a, b, c] = WINNING_COMBINATIONS[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return {
          winner: board[a],
          line: [a, b, c],
          lineIndex: i
        };
      }
    }
    return null;
  }

  /**
   * Check if all cells on the board are occupied.
   * @param {Array<string>} board
   * @returns {boolean}
   */
  function isBoardFull(board) {
    return board.every(cell => cell !== '');
  }

  /**
   * Get all empty cell indices.
   * @param {Array<string>} board
   * @returns {Array<number>}
   */
  function getEmptyIndices(board) {
    const indices = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === '') indices.push(i);
    }
    return indices;
  }

  /**
   * Minimax Recursive Evaluator with Depth Weighting
   * Higher score for quicker bot wins, lower score for quicker opponent wins.
   */
  function minimax(board, depth, isMaximizing, botSymbol, humanSymbol) {
    const result = checkWinner(board);
    if (result) {
      if (result.winner === botSymbol) return 10 - depth;
      if (result.winner === humanSymbol) return depth - 10;
    }
    if (isBoardFull(board)) return 0;

    const empty = getEmptyIndices(board);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < empty.length; i++) {
        const idx = empty[i];
        board[idx] = botSymbol;
        const score = minimax(board, depth + 1, false, botSymbol, humanSymbol);
        board[idx] = '';
        if (score > maxScore) maxScore = score;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < empty.length; i++) {
        const idx = empty[i];
        board[idx] = humanSymbol;
        const score = minimax(board, depth + 1, true, botSymbol, humanSymbol);
        board[idx] = '';
        if (score < minScore) minScore = score;
      }
      return minScore;
    }
  }

  /**
   * Determine the optimal move for Mastermind AI using Minimax.
   * @param {Array<string>} board
   * @param {string} botSymbol
   * @param {string} humanSymbol
   * @returns {number} cell index (0-8)
   */
  function getMastermindMove(board, botSymbol, humanSymbol) {
    const empty = getEmptyIndices(board);
    if (empty.length === 0) return -1;

    // Fast-path for opening turn: take center or corner
    if (empty.length === 9) {
      return 4; // Center
    }
    if (empty.length === 8) {
      // If opponent took center, take corner; else take center
      return board[4] === '' ? 4 : 0;
    }

    // 1. Check for immediate winning move
    for (let i = 0; i < empty.length; i++) {
      const idx = empty[i];
      board[idx] = botSymbol;
      if (checkWinner(board)?.winner === botSymbol) {
        board[idx] = '';
        return idx;
      }
      board[idx] = '';
    }

    // 2. Check for immediate blocking move
    for (let i = 0; i < empty.length; i++) {
      const idx = empty[i];
      board[idx] = humanSymbol;
      if (checkWinner(board)?.winner === humanSymbol) {
        board[idx] = '';
        return idx;
      }
      board[idx] = '';
    }

    // 3. Minimax full evaluation
    let bestScore = -Infinity;
    let bestMove = empty[0];

    for (let i = 0; i < empty.length; i++) {
      const idx = empty[i];
      board[idx] = botSymbol;
      const score = minimax(board, 0, false, botSymbol, humanSymbol);
      board[idx] = '';

      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }

    return bestMove;
  }

  /**
   * Determine move for Casual Bot:
   * 65% chance of smart move (immediate win/block), 35% chance of casual random move.
   */
  function getCasualMove(board, botSymbol, humanSymbol) {
    const empty = getEmptyIndices(board);
    if (empty.length === 0) return -1;

    // 1. Always take an immediate win if available
    for (let i = 0; i < empty.length; i++) {
      const idx = empty[i];
      board[idx] = botSymbol;
      if (checkWinner(board)?.winner === botSymbol) {
        board[idx] = '';
        return idx;
      }
      board[idx] = '';
    }

    // 2. 60% chance to block human win
    if (Math.random() < 0.6) {
      for (let i = 0; i < empty.length; i++) {
        const idx = empty[i];
        board[idx] = humanSymbol;
        if (checkWinner(board)?.winner === humanSymbol) {
          board[idx] = '';
          return idx;
        }
        board[idx] = '';
      }
    }

    // 3. 35% intentional random move to allow human wins
    if (Math.random() < 0.35) {
      const randomIdx = Math.floor(Math.random() * empty.length);
      return empty[randomIdx];
    }

    // Prefer center, then corners, then edges
    if (board[4] === '') return 4;
    const corners = [0, 2, 6, 8].filter(c => board[c] === '');
    if (corners.length > 0 && Math.random() < 0.7) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    return empty[Math.floor(Math.random() * empty.length)];
  }

  /**
   * Main entrypoint to compute next bot move.
   */
  function findBestMove(board, botSymbol, humanSymbol, difficulty = 'mastermind') {
    if (difficulty === 'casual') {
      return getCasualMove(board, botSymbol, humanSymbol);
    }
    return getMastermindMove(board, botSymbol, humanSymbol);
  }

  const TicTacToeAI = {
    WINNING_COMBINATIONS,
    checkWinner,
    isBoardFull,
    getEmptyIndices,
    findBestMove,
    getMastermindMove,
    getCasualMove
  };

  // Browser export
  if (typeof window !== 'undefined') {
    window.TicTacToeAI = TicTacToeAI;
  }

  // Node.js export for test runner
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TicTacToeAI;
  }
})();

