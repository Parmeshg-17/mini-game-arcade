/**
 * Jigpic Solitaire — Modular Game Logic Engine
 * Pure computational engine for picture puzzle solitaire mechanics.
 */
(function() {
  'use strict';

  const SCENES = [
    {
      id: 'alpine-sunrise',
      title: 'Warm Mountain Sunrise',
      description: 'Golden morning light breaks across misty pine valleys and snow-dusted alpine ridges.',
      rows: 3,
      cols: 3,
      parMoves: 14,
      parTime: 90
    },
    {
      id: 'lavender-cottage',
      title: 'Cozy Lavender Cottage',
      description: 'A charming stone cottage nestled beside vibrant purple lavender fields and a rustic pathway.',
      rows: 3,
      cols: 4,
      parMoves: 18,
      parTime: 120
    },
    {
      id: 'autumn-lake',
      title: 'Golden Autumn Lake',
      description: 'Amber reflections across a mirror-like lake surrounded by flaming maple trees and a quiet wooden dock.',
      rows: 3,
      cols: 4,
      parMoves: 20,
      parTime: 130
    },
    {
      id: 'forest-waterfall',
      title: 'Emerald Forest Waterfall',
      description: 'A tranquil cascading waterfall flowing through moss-carpeted boulders and lush sunlit canopy.',
      rows: 4,
      cols: 4,
      parMoves: 26,
      parTime: 160
    }
  ];

  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Initializes a new game state for a specific scene level.
   */
  function createGameState(sceneIndex = 0) {
    const scene = SCENES[sceneIndex % SCENES.length];
    const totalPieces = scene.rows * scene.cols;

    // Create array of piece indices: 0..(totalPieces - 1)
    const allPieces = [];
    for (let i = 0; i < totalPieces; i++) {
      allPieces.push(i);
    }

    const shuffled = shuffle(allPieces);

    // Initial hand gets up to 3 cards; remainder forms the draw deck
    const handSize = Math.min(3, shuffled.length);
    const hand = shuffled.slice(0, handSize);
    const deck = shuffled.slice(handSize);

    // Grid: array of null (empty) or piece index
    const grid = new Array(totalPieces).fill(null);

    return {
      sceneIndex: sceneIndex % SCENES.length,
      scene,
      totalPieces,
      grid,
      hand,
      deck,
      selectedHandIndex: 0, // currently active card in hand (0, 1, 2)
      moves: 0,
      score: 0,
      placedCount: 0,
      hintsUsed: 0,
      timeElapsed: 0,
      isWon: false,
      isPaused: false,
      history: []
    };
  }

  /**
   * Cycles or draws from deck to hand.
   * If hand has empty slots, fills them from deck.
   * If hand is full, moves unselected card back to deck bottom and draws fresh card.
   */
  function cycleDrawDeck(state) {
    if (!state || state.isWon) return false;

    // Save history for undo
    saveHistory(state);

    if (state.deck.length === 0) {
      // If deck is empty, collect current unplaced hand cards back into deck and reshuffle
      if (state.hand.length > 1) {
        state.deck = shuffle([...state.hand]);
        state.hand = [];
        const drawCount = Math.min(3, state.deck.length);
        state.hand = state.deck.splice(0, drawCount);
        state.selectedHandIndex = 0;
        state.moves++;
        return true;
      }
      return false;
    }

    // Hand has empty slot? Fill it
    if (state.hand.length < 3 && state.deck.length > 0) {
      state.hand.push(state.deck.shift());
      state.moves++;
      return true;
    }

    // Hand is full (3 cards): rotate top card to deck bottom, draw new card
    const rotated = state.hand.shift();
    state.deck.push(rotated);
    state.hand.push(state.deck.shift());
    state.selectedHandIndex = 0;
    state.moves++;
    return true;
  }

  /**
   * Saves snapshot for 1-step undo.
   */
  function saveHistory(state) {
    const snapshot = {
      grid: [...state.grid],
      hand: [...state.hand],
      deck: [...state.deck],
      selectedHandIndex: state.selectedHandIndex,
      moves: state.moves,
      score: state.score,
      placedCount: state.placedCount
    };
    state.history.push(snapshot);
    if (state.history.length > 10) state.history.shift();
  }

  /**
   * Undo last move.
   */
  function undoMove(state) {
    if (!state || state.history.length === 0 || state.isWon) return false;
    const prev = state.history.pop();
    state.grid = prev.grid;
    state.hand = prev.hand;
    state.deck = prev.deck;
    state.selectedHandIndex = prev.selectedHandIndex;
    state.moves = prev.moves;
    state.score = prev.score;
    state.placedCount = prev.placedCount;
    state.isWon = false;
    return true;
  }

  /**
   * Validates and places the selected hand card into target slot index.
   * Target index must match the piece number for it to snap into place!
   */
  function placePiece(state, targetSlotIndex) {
    if (!state || state.isWon) return { success: false, reason: 'game_over' };
    if (targetSlotIndex < 0 || targetSlotIndex >= state.totalPieces) {
      return { success: false, reason: 'invalid_slot' };
    }
    if (state.grid[targetSlotIndex] !== null) {
      return { success: false, reason: 'slot_occupied' };
    }

    const currentHandCard = state.hand[state.selectedHandIndex];
    if (currentHandCard === undefined) {
      return { success: false, reason: 'no_card_selected' };
    }

    // Save history prior to placement
    saveHistory(state);
    state.moves++;

    // Check if this card belongs in this slot!
    if (currentHandCard === targetSlotIndex) {
      // Correct Match! Snap into position
      state.grid[targetSlotIndex] = currentHandCard;
      state.placedCount++;

      // Remove from hand
      state.hand.splice(state.selectedHandIndex, 1);

      // Auto-draw from deck to replenish hand if available
      if (state.deck.length > 0) {
        state.hand.push(state.deck.shift());
      }

      // Clamp selected hand index
      if (state.selectedHandIndex >= state.hand.length) {
        state.selectedHandIndex = Math.max(0, state.hand.length - 1);
      }

      // Score bonus: +100 base, plus adjacency bonus if neighbor already placed
      let adjacencyBonus = 0;
      const row = Math.floor(targetSlotIndex / state.scene.cols);
      const col = targetSlotIndex % state.scene.cols;
      const neighbors = [
        row > 0 ? (row - 1) * state.scene.cols + col : -1,
        row < state.scene.rows - 1 ? (row + 1) * state.scene.cols + col : -1,
        col > 0 ? row * state.scene.cols + (col - 1) : -1,
        col < state.scene.cols - 1 ? row * state.scene.cols + (col + 1) : -1
      ];
      neighbors.forEach(n => {
        if (n !== -1 && state.grid[n] !== null) adjacencyBonus += 25;
      });

      const points = 100 + adjacencyBonus;
      state.score += points;

      // Check for win!
      if (state.placedCount === state.totalPieces) {
        state.isWon = true;
      }

      return {
        success: true,
        correct: true,
        piece: currentHandCard,
        slot: targetSlotIndex,
        points,
        isWon: state.isWon
      };
    } else {
      // Mismatch
      return {
        success: false,
        correct: false,
        reason: 'mismatch',
        piece: currentHandCard,
        targetSlot: targetSlotIndex
      };
    }
  }

  /**
   * Helper to check if any card currently in hand matches an empty slot.
   */
  function findHandMatchForSlot(state, targetSlotIndex) {
    if (!state || state.grid[targetSlotIndex] !== null) return -1;
    return state.hand.indexOf(targetSlotIndex);
  }

  /**
   * Solitaire hint: returns which hand card belongs to which slot,
   * or signals to draw if no currently held card matches an empty slot.
   */
  function getHint(state) {
    if (!state || state.isWon) return null;

    // Check if any card in hand matches an open slot
    for (let i = 0; i < state.hand.length; i++) {
      const piece = state.hand[i];
      if (state.grid[piece] === null) {
        state.hintsUsed++;
        state.selectedHandIndex = i;
        return {
          type: 'hand_to_slot',
          handIndex: i,
          piece,
          targetSlot: piece
        };
      }
    }

    // No card in hand matches; recommend drawing from deck
    state.hintsUsed++;
    return {
      type: 'draw_card',
      message: 'No current hand card matches open slots. Draw from the deck!'
    };
  }

  /**
   * Calculate 1-3 star performance evaluation.
   */
  function calculateStars(moves, timeElapsed, parMoves, parTime) {
    let stars = 3;
    if (moves > parMoves * 1.5 || timeElapsed > parTime * 1.5) {
      stars = 2;
    }
    if (moves > parMoves * 2.2 || timeElapsed > parTime * 2.2) {
      stars = 1;
    }
    return Math.max(1, stars);
  }

  const Engine = {
    SCENES,
    createGameState,
    cycleDrawDeck,
    placePiece,
    findHandMatchForSlot,
    getHint,
    undoMove,
    calculateStars
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Engine;
  }
  if (typeof window !== 'undefined') {
    window.JigpicEngine = Engine;
  }
})();
