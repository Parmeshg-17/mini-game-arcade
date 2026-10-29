/**
 * Number Puzzle — Interactive DOM Grid Controller (15-Puzzle)
 * Handles tile sliding animations, move counter, stopwatch timer,
 * difficulty mode switching, keyboard/touch gestures, and win state.
 */
(function() {
  'use strict';

  // DOM Elements cache
  const dom = {};

  // Engine State
  const state = {
    difficulty: 'classic', // 'easy' (3x3), 'classic' (4x4), 'expert' (5x5)
    size: 4,
    board: [],
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'cleared'
    moves: 0,
    timer: 0,
    timerInterval: null,
    bestMoves: 0,
    touchStartX: 0,
    touchStartY: 0
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    loadBestScore();
    bindEvents();
    startNewGame();
  }

  function cacheDom() {
    dom.puzzleBoard = document.getElementById('puzzle-board');
    dom.movesDisplay = document.getElementById('moves-display');
    dom.timerDisplay = document.getElementById('timer-display');
    dom.progressDisplay = document.getElementById('progress-display');
    dom.bestDisplay = document.getElementById('best-display');

    dom.diffEasyBtn = document.getElementById('diff-easy-btn');
    dom.diffClassicBtn = document.getElementById('diff-classic-btn');
    dom.diffExpertBtn = document.getElementById('diff-expert-btn');

    dom.audioToggleBtn = document.getElementById('audio-toggle-btn');
    dom.audioIcon = document.getElementById('audio-icon');
    dom.pauseBtn = document.getElementById('pause-btn');

    dom.overlayStart = document.getElementById('overlay-start');
    dom.overlayPause = document.getElementById('overlay-pause');
    dom.overlayWin = document.getElementById('overlay-win');

    dom.startBtn = document.getElementById('start-btn');
    dom.resumeBtn = document.getElementById('resume-btn');
    dom.restartBtn = document.getElementById('restart-btn');
    dom.playAgainBtn = document.getElementById('play-again-btn');

    dom.winMovesVal = document.getElementById('win-moves-val');
    dom.winTimeVal = document.getElementById('win-time-val');
    dom.winStarsVal = document.getElementById('win-stars-val');
    dom.srAnnouncer = document.getElementById('sr-announcer');
  }

  function loadBestScore() {
    const key = `arcade_numberpuzzle_best_${state.difficulty}`;
    state.bestMoves = parseInt(localStorage.getItem(key) || '0', 10);
    if (dom.bestDisplay) dom.bestDisplay.textContent = state.bestMoves > 0 ? `${state.bestMoves} Moves` : '—';
  }

  function saveBestScore() {
    if (state.bestMoves === 0 || state.moves < state.bestMoves) {
      state.bestMoves = state.moves;
      const key = `arcade_numberpuzzle_best_${state.difficulty}`;
      try {
        localStorage.setItem(key, state.bestMoves.toString());
      } catch (e) {}
      if (dom.bestDisplay) dom.bestDisplay.textContent = `${state.bestMoves} Moves`;
    }
  }

  function startNewGame() {
    stopTimer();
    const Engine = window.NumberEngine;
    const diff = Engine?.DIFFICULTIES[state.difficulty] || { size: 4, shuffleMoves: 140 };
    state.size = diff.size;

    // Generate 100% solvable shuffled board
    state.board = Engine ? Engine.shuffleBoard(state.size, diff.shuffleMoves) : [1, 2, 3, 0];
    state.moves = 0;
    state.timer = 0;
    state.status = 'ready';

    updateHUD();
    renderBoard();
    showOverlay(dom.overlayStart);
  }

  function startGameplay() {
    state.status = 'playing';
    hideAllOverlays();
    startTimer();
  }

  // Timer controls
  function startTimer() {
    stopTimer();
    state.timerInterval = setInterval(() => {
      state.timer++;
      if (dom.timerDisplay) {
        dom.timerDisplay.textContent = formatTime(state.timer);
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Board Rendering
  function renderBoard() {
    if (!dom.puzzleBoard) return;
    const Engine = window.NumberEngine;
    dom.puzzleBoard.innerHTML = '';
    dom.puzzleBoard.className = `puzzle-board grid-${state.size}`;
    dom.puzzleBoard.style.setProperty('--grid-size', state.size);

    const movables = new Set(Engine ? Engine.getAdjacentMovableIndices(state.board, state.size) : []);

    state.board.forEach((val, idx) => {
      const tileEl = document.createElement('div');
      tileEl.dataset.index = idx;

      if (val === 0) {
        // Empty space slot
        tileEl.className = 'puzzle-tile empty-slot';
        tileEl.setAttribute('aria-hidden', 'true');
      } else {
        const isCorrect = (val === idx + 1);
        const canMove = movables.has(idx);

        tileEl.className = `puzzle-tile number-tile ${isCorrect ? 'is-correct' : ''} ${canMove ? 'can-move' : ''}`;
        tileEl.setAttribute('role', 'button');
        tileEl.setAttribute('tabindex', '0');
        tileEl.setAttribute('aria-label', `Tile ${val}, ${isCorrect ? 'in correct position' : 'out of position'}`);

        tileEl.innerHTML = `
          <span class="tile-number">${val}</span>
          ${isCorrect ? '<span class="tile-correct-dot" title="Correct Spot">●</span>' : ''}
        `;

        tileEl.addEventListener('click', () => handleTileClick(idx));
        tileEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTileClick(idx);
          }
        });
      }

      dom.puzzleBoard.appendChild(tileEl);
    });
  }

  function handleTileClick(index) {
    if (state.status === 'ready') {
      startGameplay();
    }
    if (state.status !== 'playing') return;

    const Engine = window.NumberEngine;
    if (!Engine || !Engine.canSlide(state.board, index, state.size)) return;

    // Perform Slide
    const result = Engine.slideTiles(state.board, index, state.size);
    if (result.changed) {
      state.board = result.newBoard;
      state.moves += result.movedCount;

      window.NumberAudio?.playSlide();

      // Check if newly placed tiles are in correct position
      const correctCount = Engine.countCorrectTiles(state.board);
      if (state.board[index] === index + 1) {
        window.NumberAudio?.playTilePlaced();
      }

      updateHUD();
      renderBoard();

      // Announce for screen reader
      if (dom.srAnnouncer) {
        dom.srAnnouncer.textContent = `Moved tile. Total moves: ${state.moves}. ${correctCount} of ${state.size * state.size - 1} tiles placed.`;
      }

      // Check Solved Condition
      if (Engine.isSolved(state.board)) {
        handleVictory();
      }
    }
  }

  function handleDirectionalSlide(direction) {
    if (state.status === 'ready') {
      startGameplay();
    }
    if (state.status !== 'playing') return;

    const Engine = window.NumberEngine;
    if (!Engine) return;

    const result = Engine.slideDirection(state.board, direction, state.size);
    if (result.changed) {
      state.board = result.newBoard;
      state.moves += result.movedCount;

      window.NumberAudio?.playSlide();
      updateHUD();
      renderBoard();

      if (Engine.isSolved(state.board)) {
        handleVictory();
      }
    }
  }

  function handleVictory() {
    state.status = 'cleared';
    stopTimer();
    window.NumberAudio?.playWin();
    launchConfetti();
    saveBestScore();

    const Engine = window.NumberEngine;
    const stars = Engine ? Engine.calculateStars(state.moves, state.difficulty) : 3;

    if (dom.winMovesVal) dom.winMovesVal.textContent = state.moves;
    if (dom.winTimeVal) dom.winTimeVal.textContent = formatTime(state.timer);
    if (dom.winStarsVal) dom.winStarsVal.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    showOverlay(dom.overlayWin);
  }

  function updateHUD() {
    if (dom.movesDisplay) dom.movesDisplay.textContent = `Moves: ${state.moves}`;
    if (dom.timerDisplay) dom.timerDisplay.textContent = formatTime(state.timer);

    if (dom.progressDisplay) {
      const Engine = window.NumberEngine;
      const totalTiles = state.size * state.size - 1;
      const placed = Engine ? Engine.countCorrectTiles(state.board) - 1 : 0; // Exclude empty space
      dom.progressDisplay.textContent = `${Math.max(0, placed)} / ${totalTiles} Placed`;
    }
  }

  function showOverlay(targetEl) {
    [dom.overlayStart, dom.overlayPause, dom.overlayWin].forEach(el => {
      if (el) el.classList.remove('show');
    });
    if (targetEl) targetEl.classList.add('show');
  }

  function hideAllOverlays() {
    [dom.overlayStart, dom.overlayPause, dom.overlayWin].forEach(el => {
      if (el) el.classList.remove('show');
    });
  }

  function updateAudioIcon(isMuted) {
    if (!dom.audioIcon) return;
    const muted = isMuted !== undefined ? isMuted : window.NumberAudio?.isMuted();
    dom.audioIcon.textContent = muted ? '🔇' : '🔊';
  }

  // Events & Inputs
  function bindEvents() {
    // Keyboard controls
    window.addEventListener('keydown', handleKeydown);

    // Touch swipe gestures
    dom.puzzleBoard?.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        state.touchStartX = e.touches[0].clientX;
        state.touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    dom.puzzleBoard?.addEventListener('touchend', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - state.touchStartX;
      const dy = e.changedTouches[0].clientY - state.touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 25) {
        if (absDx > absDy) {
          handleDirectionalSlide(dx > 0 ? 'right' : 'left');
        } else {
          handleDirectionalSlide(dy > 0 ? 'down' : 'up');
        }
      }
    }, { passive: true });

    // Mode Buttons
    dom.diffEasyBtn?.addEventListener('click', () => setDifficulty('easy', dom.diffEasyBtn));
    dom.diffClassicBtn?.addEventListener('click', () => setDifficulty('classic', dom.diffClassicBtn));
    dom.diffExpertBtn?.addEventListener('click', () => setDifficulty('expert', dom.diffExpertBtn));

    // Overlays
    dom.startBtn?.addEventListener('click', () => {
      window.NumberAudio?.playClick();
      startGameplay();
    });

    dom.resumeBtn?.addEventListener('click', () => {
      if (state.status === 'paused') {
        state.status = 'playing';
        hideAllOverlays();
        startTimer();
      }
    });

    dom.restartBtn?.addEventListener('click', () => {
      window.NumberAudio?.playClick();
      startNewGame();
    });

    dom.playAgainBtn?.addEventListener('click', () => {
      window.NumberAudio?.playClick();
      startNewGame();
    });

    dom.pauseBtn?.addEventListener('click', togglePause);

    if (dom.audioToggleBtn) {
      updateAudioIcon();
      dom.audioToggleBtn.addEventListener('click', () => {
        const isMuted = window.NumberAudio?.toggleMute();
        updateAudioIcon(isMuted);
      });
    }
  }

  function setDifficulty(diffKey, buttonEl) {
    if (state.difficulty === diffKey) return;
    window.NumberAudio?.playClick();
    state.difficulty = diffKey;

    [dom.diffEasyBtn, dom.diffClassicBtn, dom.diffExpertBtn].forEach(b => {
      b?.classList.remove('active');
      b?.setAttribute('aria-selected', 'false');
    });

    buttonEl?.classList.add('active');
    buttonEl?.setAttribute('aria-selected', 'true');

    loadBestScore();
    startNewGame();
  }

  function handleKeydown(e) {
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // Arrow keys / WASD for directional slide
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      handleDirectionalSlide('up');
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      handleDirectionalSlide('down');
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      handleDirectionalSlide('left');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      handleDirectionalSlide('right');
    }

    // Space: Start game
    if (e.key === ' ' && state.status === 'ready') {
      e.preventDefault();
      startGameplay();
    }

    // P: Pause
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      togglePause();
    }

    // R: Restart / Shuffle
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      window.NumberAudio?.playClick();
      startNewGame();
    }

    // M: Mute
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const isMuted = window.NumberAudio?.toggleMute();
      updateAudioIcon(isMuted);
    }
  }

  function togglePause() {
    if (state.status === 'playing') {
      state.status = 'paused';
      stopTimer();
      showOverlay(dom.overlayPause);
    } else if (state.status === 'paused') {
      state.status = 'playing';
      hideAllOverlays();
      startTimer();
    }
  }

  function launchConfetti() {
    const container = document.body;
    const colors = ['#d5ff55', '#38bdf8', '#ff784f', '#fbbf24', '#ffffff'];

    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.animation = `confettiFall ${Math.random() * 1.5 + 1.2}s ease-out forwards`;
      container.appendChild(piece);

      setTimeout(() => piece.remove(), 2500);
    }
  }

})();
