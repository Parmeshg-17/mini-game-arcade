/**
 * Block Puzzle — Interactive DOM Game Controller
 * Manages 8x8 grid rendering, dock polyominos, tap/click/keyboard placement,
 * ghost preview, line blast particle animations, and victory/game-over conditions.
 */
(function() {
  'use strict';

  // DOM Elements cache
  const dom = {};

  // Game State
  const state = {
    mode: 'classic', // 'classic' | 'challenge' | 'blitz'
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'cleared' | 'gameover'
    grid: [],
    dockShapes: [null, null, null],
    selectedDockIndex: -1,
    cursorRow: 3,
    cursorCol: 3,
    score: 0,
    moves: 0,
    linesCleared: 0,
    comboStreak: 0,
    timer: 0,
    timerInterval: null,
    targetLines: 10, // For challenge mode
    blitzDuration: 90, // For blitz mode
    bestScores: {
      classic: 0,
      challenge: 0,
      blitz: 0
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    cacheDom();
    loadBestScores();
    bindEvents();
    switchMode('classic');
  }

  function cacheDom() {
    dom.boardGrid = document.getElementById('board-grid');
    dom.dockContainer = document.getElementById('dock-container');
    dom.dockSlots = [
      document.getElementById('dock-slot-0'),
      document.getElementById('dock-slot-1'),
      document.getElementById('dock-slot-2')
    ];

    dom.scoreDisplay = document.getElementById('score-display');
    dom.linesDisplay = document.getElementById('lines-display');
    dom.movesDisplay = document.getElementById('moves-display');
    dom.timerDisplay = document.getElementById('timer-display');
    dom.comboDisplay = document.getElementById('combo-display');
    dom.bestDisplay = document.getElementById('best-display');

    dom.modeClassicBtn = document.getElementById('mode-classic-btn');
    dom.modeChallengeBtn = document.getElementById('mode-challenge-btn');
    dom.modeBlitzBtn = document.getElementById('mode-blitz-btn');

    dom.audioToggleBtn = document.getElementById('audio-toggle-btn');
    dom.audioIcon = document.getElementById('audio-icon');
    dom.pauseBtn = document.getElementById('pause-btn');

    dom.overlayStart = document.getElementById('overlay-start');
    dom.overlayPause = document.getElementById('overlay-pause');
    dom.overlayWin = document.getElementById('overlay-win');
    dom.overlayGameOver = document.getElementById('overlay-gameover');

    dom.startBtn = document.getElementById('start-btn');
    dom.resumeBtn = document.getElementById('resume-btn');
    dom.restartBtn = document.getElementById('restart-btn');
    dom.playAgainBtn = document.getElementById('play-again-btn');
    dom.tryAgainBtn = document.getElementById('try-again-btn');

    dom.winTitle = document.getElementById('win-title');
    dom.winScoreVal = document.getElementById('win-score-val');
    dom.winMovesVal = document.getElementById('win-moves-val');
    dom.winLinesVal = document.getElementById('win-lines-val');
    dom.winStarsVal = document.getElementById('win-stars-val');
    dom.winSummary = document.getElementById('win-summary');

    dom.goScoreVal = document.getElementById('go-score-val');
    dom.goMovesVal = document.getElementById('go-moves-val');
    dom.goLinesVal = document.getElementById('go-lines-val');

    dom.srAnnouncer = document.getElementById('sr-announcer');
  }

  function loadBestScores() {
    try {
      state.bestScores.classic = parseInt(localStorage.getItem('arcade_blockpuzzle_best_classic') || '0', 10);
      state.bestScores.challenge = parseInt(localStorage.getItem('arcade_blockpuzzle_best_challenge') || '0', 10);
      state.bestScores.blitz = parseInt(localStorage.getItem('arcade_blockpuzzle_best_blitz') || '0', 10);
    } catch (e) {}
    updateBestDisplay();
  }

  function saveBestScore() {
    try {
      if (state.score > (state.bestScores[state.mode] || 0)) {
        state.bestScores[state.mode] = state.score;
        localStorage.setItem(`arcade_blockpuzzle_best_${state.mode}`, state.score.toString());
      }
    } catch (e) {}
    updateBestDisplay();
  }

  function updateBestDisplay() {
    if (!dom.bestDisplay) return;
    const best = state.bestScores[state.mode] || 0;
    dom.bestDisplay.textContent = best > 0 ? `${best} pts` : '—';
  }

  function bindEvents() {
    // Mode selectors
    if (dom.modeClassicBtn) dom.modeClassicBtn.addEventListener('click', () => switchMode('classic'));
    if (dom.modeChallengeBtn) dom.modeChallengeBtn.addEventListener('click', () => switchMode('challenge'));
    if (dom.modeBlitzBtn) dom.modeBlitzBtn.addEventListener('click', () => switchMode('blitz'));

    // Audio & Pause controls
    if (dom.audioToggleBtn) dom.audioToggleBtn.addEventListener('click', handleAudioToggle);
    if (dom.pauseBtn) dom.pauseBtn.addEventListener('click', togglePause);

    // Overlay action buttons
    if (dom.startBtn) dom.startBtn.addEventListener('click', startGame);
    if (dom.resumeBtn) dom.resumeBtn.addEventListener('click', resumeGame);
    if (dom.restartBtn) dom.restartBtn.addEventListener('click', restartGame);
    if (dom.playAgainBtn) dom.playAgainBtn.addEventListener('click', restartGame);
    if (dom.tryAgainBtn) dom.tryAgainBtn.addEventListener('click', restartGame);

    // Keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    // Sync initial audio icon
    updateAudioIcon();
  }

  function switchMode(newMode) {
    if (state.status === 'playing') {
      stopTimer();
    }
    state.mode = newMode;

    [dom.modeClassicBtn, dom.modeChallengeBtn, dom.modeBlitzBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    if (newMode === 'classic' && dom.modeClassicBtn) {
      dom.modeClassicBtn.classList.add('active');
      dom.modeClassicBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'challenge' && dom.modeChallengeBtn) {
      dom.modeChallengeBtn.classList.add('active');
      dom.modeChallengeBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'blitz' && dom.modeBlitzBtn) {
      dom.modeBlitzBtn.classList.add('active');
      dom.modeBlitzBtn.setAttribute('aria-selected', 'true');
    }

    updateBestDisplay();
    prepareBoard();
  }

  function prepareBoard() {
    stopTimer();
    const Engine = window.BlockEngine;
    state.grid = Engine ? Engine.createEmptyGrid() : [];
    state.status = 'ready';
    state.score = 0;
    state.moves = 0;
    state.linesCleared = 0;
    state.comboStreak = 0;
    state.selectedDockIndex = -1;
    state.cursorRow = 3;
    state.cursorCol = 3;

    if (state.mode === 'blitz') {
      state.timer = state.blitzDuration;
    } else {
      state.timer = 0;
    }

    dealNewDockShapes();
    updateHUD();
    renderBoard();
    renderDock();
    showStartOverlay();
  }

  function dealNewDockShapes() {
    const Engine = window.BlockEngine;
    state.dockShapes = Engine ? Engine.dealShapes(3) : [];
    state.selectedDockIndex = 0; // Automatically select first dock piece for accessibility
  }

  function renderBoard() {
    if (!dom.boardGrid) return;
    dom.boardGrid.innerHTML = '';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);

        const color = state.grid[r]?.[c];
        if (color) {
          cell.classList.add('cell-filled');
          cell.style.setProperty('--block-color', color);
          cell.style.backgroundColor = color;
        }

        // Mouse hover preview
        cell.addEventListener('pointerenter', () => {
          if (state.status === 'playing' && state.selectedDockIndex !== -1) {
            state.cursorRow = r;
            state.cursorCol = c;
            updatePlacementPreview();
          }
        });

        // Click / touch to place
        cell.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (state.status === 'playing' && state.selectedDockIndex !== -1) {
            handleAttemptPlace(r, c);
          }
        });

        dom.boardGrid.appendChild(cell);
      }
    }

    updatePlacementPreview();
  }

  function renderDock() {
    if (!dom.dockSlots) return;

    state.dockShapes.forEach((shape, idx) => {
      const slot = dom.dockSlots[idx];
      if (!slot) return;
      slot.innerHTML = '';
      slot.className = `dock-slot ${state.selectedDockIndex === idx ? 'selected' : ''}`;

      if (!shape) {
        slot.classList.add('empty');
        return;
      }

      // Render miniature matrix
      const matrix = shape.matrix;
      const h = matrix.length;
      const w = matrix[0].length;

      const pieceWrap = document.createElement('div');
      pieceWrap.className = 'dock-piece';
      pieceWrap.style.gridTemplateRows = `repeat(${h}, 1fr)`;
      pieceWrap.style.gridTemplateColumns = `repeat(${w}, 1fr)`;

      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          const miniBlock = document.createElement('div');
          miniBlock.className = 'mini-block';
          if (matrix[r][c] === 1) {
            miniBlock.style.backgroundColor = shape.color;
            miniBlock.classList.add('filled');
          }
          pieceWrap.appendChild(miniBlock);
        }
      }

      // Slot select listener
      slot.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        selectDockPiece(idx);
      });

      slot.appendChild(pieceWrap);
    });
  }

  function selectDockPiece(idx) {
    if (state.status !== 'playing' && state.status !== 'ready') return;
    if (!state.dockShapes[idx]) return;

    state.selectedDockIndex = idx;
    if (window.BlockAudio) window.BlockAudio.playSelect();
    renderDock();
    updatePlacementPreview();
  }

  function updatePlacementPreview() {
    if (!dom.boardGrid) return;
    const cells = dom.boardGrid.children;
    // Clear previous preview styles
    for (let i = 0; i < cells.length; i++) {
      cells[i].classList.remove('preview-valid', 'preview-invalid', 'preview-clearing');
    }

    const currentShape = state.dockShapes[state.selectedDockIndex];
    if (!currentShape || state.status !== 'playing') return;

    const Engine = window.BlockEngine;
    const isValid = Engine ? Engine.canPlaceShape(state.grid, currentShape.matrix, state.cursorRow, state.cursorCol) : false;

    const h = currentShape.matrix.length;
    const w = currentShape.matrix[0].length;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (currentShape.matrix[r][c] === 1) {
          const targetR = state.cursorRow + r;
          const targetC = state.cursorCol + c;
          if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
            const cellIdx = targetR * 8 + targetC;
            const cell = cells[cellIdx];
            if (cell) {
              cell.classList.add(isValid ? 'preview-valid' : 'preview-invalid');
              if (isValid) {
                cell.style.setProperty('--preview-color', currentShape.color);
              }
            }
          }
        }
      }
    }

    // Highlight rows and columns that will clear if placed
    if (isValid && Engine) {
      const sim = Engine.placeShape(state.grid, currentShape.matrix, state.cursorRow, state.cursorCol, currentShape.color);
      if (sim.success) {
        const lines = Engine.checkCompletedLines(sim.newGrid);
        lines.fullRows.forEach(r => {
          for (let c = 0; c < 8; c++) cells[r * 8 + c]?.classList.add('preview-clearing');
        });
        lines.fullCols.forEach(c => {
          for (let r = 0; r < 8; r++) cells[r * 8 + c]?.classList.add('preview-clearing');
        });
      }
    }
  }

  function handleAttemptPlace(startR, startC) {
    const currentShape = state.dockShapes[state.selectedDockIndex];
    if (!currentShape) return;

    const Engine = window.BlockEngine;
    const placement = Engine ? Engine.placeShape(state.grid, currentShape.matrix, startR, startC, currentShape.color) : { success: false };

    if (!placement.success) {
      if (window.BlockAudio) window.BlockAudio.playInvalid();
      triggerScreenShake();
      return;
    }

    // Successful Placement!
    state.grid = placement.newGrid;
    state.moves++;
    state.dockShapes[state.selectedDockIndex] = null;

    if (window.BlockAudio) window.BlockAudio.playPlace();

    // Check line completions
    const lineCheck = Engine.checkCompletedLines(state.grid);
    let linesCount = lineCheck.totalLines;

    if (linesCount > 0) {
      state.comboStreak++;
      state.linesCleared += linesCount;
      const clearRes = Engine.clearLines(state.grid, lineCheck.fullRows, lineCheck.fullCols);
      state.grid = clearRes.newGrid;

      // Audio feedback
      if (window.BlockAudio) {
        window.BlockAudio.playLineClear(linesCount);
        if (state.comboStreak > 1) {
          window.BlockAudio.playCombo(state.comboStreak);
        }
      }

      // Bonus time in Blitz mode
      if (state.mode === 'blitz') {
        state.timer = Math.min(state.blitzDuration, state.timer + (linesCount * 3));
      }
    } else {
      state.comboStreak = 0;
    }

    // Compute score
    const earned = Engine.calculatePlacementScore(placement.placedCount, linesCount, state.comboStreak);
    state.score += earned;

    // Check if dock is empty -> deal 3 new shapes
    const remaining = state.dockShapes.filter(s => s !== null);
    if (remaining.length === 0) {
      dealNewDockShapes();
    }

    // Automatically select next available piece
    const nextIdx = state.dockShapes.findIndex(s => s !== null);
    state.selectedDockIndex = nextIdx;

    updateHUD();
    renderBoard();
    renderDock();

    // Check Win Condition for Challenge Mode
    if (state.mode === 'challenge' && state.linesCleared >= state.targetLines) {
      endGame(true);
      return;
    }

    // Check Game Over Condition (No moves remain for any available shape)
    const available = state.dockShapes.filter(s => s !== null);
    const canMove = Engine.hasAnyValidMove(state.grid, available);

    if (!canMove) {
      endGame(false);
    }
  }

  function triggerScreenShake() {
    const card = document.getElementById('puzzle-stage-card');
    if (card) {
      card.classList.add('shake-active');
      setTimeout(() => card.classList.remove('shake-active'), 250);
    }
  }

  function startGame() {
    hideOverlays();
    state.status = 'playing';
    startTimer();
    updateHUD();
    updatePlacementPreview();
    announceSR('Block Puzzle match started! Place blocks onto the grid.');
  }

  function startTimer() {
    stopTimer();
    state.timerInterval = setInterval(() => {
      if (state.status !== 'playing') return;

      if (state.mode === 'blitz') {
        state.timer--;
        if (state.timer <= 0) {
          state.timer = 0;
          updateHUD();
          endGame(false);
          return;
        }
      } else {
        state.timer++;
      }
      updateHUD();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }

  function updateHUD() {
    if (dom.scoreDisplay) dom.scoreDisplay.textContent = `Score: ${state.score}`;
    if (dom.movesDisplay) dom.movesDisplay.textContent = `Moves: ${state.moves}`;

    if (dom.linesDisplay) {
      if (state.mode === 'challenge') {
        dom.linesDisplay.textContent = `Lines: ${state.linesCleared} / ${state.targetLines}`;
      } else {
        dom.linesDisplay.textContent = `Lines: ${state.linesCleared}`;
      }
    }

    if (dom.timerDisplay) {
      const mins = Math.floor(state.timer / 60);
      const secs = state.timer % 60;
      dom.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    if (dom.comboDisplay) {
      if (state.comboStreak > 1) {
        dom.comboDisplay.textContent = `⚡ ${state.comboStreak}x Streak`;
        dom.comboDisplay.className = 'hud-pill highlight-gold';
      } else {
        dom.comboDisplay.textContent = 'Streak: 0';
        dom.comboDisplay.className = 'hud-pill';
      }
    }
  }

  function endGame(isVictory = false) {
    stopTimer();
    saveBestScore();

    const Engine = window.BlockEngine;
    const stars = Engine ? Engine.calculateStars(state.score, state.linesCleared, state.mode) : 2;

    if (isVictory) {
      state.status = 'cleared';
      if (window.BlockAudio) window.BlockAudio.playWin();

      if (dom.winTitle) dom.winTitle.textContent = 'Challenge Completed!';
      if (dom.winScoreVal) dom.winScoreVal.textContent = state.score.toString();
      if (dom.winMovesVal) dom.winMovesVal.textContent = state.moves.toString();
      if (dom.winLinesVal) dom.winLinesVal.textContent = state.linesCleared.toString();
      if (dom.winStarsVal) dom.winStarsVal.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      if (dom.winSummary) dom.winSummary.textContent = `Cleared ${state.linesCleared} lines in ${state.moves} moves! Rating: ${stars} Stars.`;

      showOverlay(dom.overlayWin);
      announceSR(`Victory! Puzzle cleared in ${state.moves} moves with ${state.score} points.`);
    } else {
      state.status = 'gameover';
      if (window.BlockAudio) window.BlockAudio.playGameOver();

      if (dom.goScoreVal) dom.goScoreVal.textContent = state.score.toString();
      if (dom.goMovesVal) dom.goMovesVal.textContent = state.moves.toString();
      if (dom.goLinesVal) dom.goLinesVal.textContent = state.linesCleared.toString();

      showOverlay(dom.overlayGameOver);
      announceSR(`Game Over! Final score: ${state.score} with ${state.linesCleared} lines cleared.`);
    }
  }

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();

    // Universal shortcuts
    if (key === 'p') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (key === 'r') {
      e.preventDefault();
      restartGame();
      return;
    }
    if (key === 'm') {
      e.preventDefault();
      handleAudioToggle();
      return;
    }

    if (state.status !== 'playing') {
      if (key === ' ' || key === 'enter') {
        if (state.status === 'ready') {
          e.preventDefault();
          startGame();
        }
      }
      return;
    }

    // Number keys 1, 2, 3 to select dock piece
    if (key === '1' || key === '2' || key === '3') {
      e.preventDefault();
      selectDockPiece(parseInt(key, 10) - 1);
      return;
    }

    // Cursor navigation: Arrow keys & WASD
    let moved = false;
    if (key === 'arrowup' || key === 'w') {
      state.cursorRow = Math.max(0, state.cursorRow - 1);
      moved = true;
    } else if (key === 'arrowdown' || key === 's') {
      state.cursorRow = Math.min(7, state.cursorRow + 1);
      moved = true;
    } else if (key === 'arrowleft' || key === 'a') {
      state.cursorCol = Math.max(0, state.cursorCol - 1);
      moved = true;
    } else if (key === 'arrowright' || key === 'd') {
      state.cursorCol = Math.min(7, state.cursorCol + 1);
      moved = true;
    }

    if (moved) {
      e.preventDefault();
      updatePlacementPreview();
      return;
    }

    // Space / Enter to place shape at cursor
    if (key === ' ' || key === 'enter') {
      e.preventDefault();
      handleAttemptPlace(state.cursorRow, state.cursorCol);
    }
  }

  function togglePause() {
    if (state.status === 'playing') {
      state.status = 'paused';
      stopTimer();
      showOverlay(dom.overlayPause);
      announceSR('Game paused. Press P to resume.');
    } else if (state.status === 'paused') {
      resumeGame();
    }
  }

  function resumeGame() {
    if (state.status !== 'paused') return;
    hideOverlays();
    state.status = 'playing';
    startTimer();
    updatePlacementPreview();
    announceSR('Game resumed.');
  }

  function restartGame() {
    prepareBoard();
    startGame();
  }

  function handleAudioToggle() {
    if (window.BlockAudio) {
      window.BlockAudio.toggleMute();
      updateAudioIcon();
    }
  }

  function updateAudioIcon() {
    if (!dom.audioIcon) return;
    const isMuted = window.BlockAudio ? window.BlockAudio.isMuted() : false;
    dom.audioIcon.textContent = isMuted ? '🔇' : '🔊';
  }

  function showStartOverlay() {
    hideOverlays();
    if (dom.overlayStart) {
      dom.overlayStart.classList.add('show');
      const descEl = dom.overlayStart.querySelector('.overlay-subtitle');
      if (descEl) {
        if (state.mode === 'classic') {
          descEl.textContent = 'Drag or click shapes from the dock to fit them onto the 8×8 board. Fill full rows or columns to clear lines and build explosive combos!';
        } else if (state.mode === 'challenge') {
          descEl.textContent = 'Target: Clear 10 rows or columns in the fewest moves possible to earn a 3-star rating!';
        } else {
          descEl.textContent = 'Speed Blitz! Clear as many lines as you can before the 90-second countdown runs out. Clears grant bonus time!';
        }
      }
    }
  }

  function showOverlay(overlay) {
    hideOverlays();
    if (overlay) overlay.classList.add('show');
  }

  function hideOverlays() {
    [dom.overlayStart, dom.overlayPause, dom.overlayWin, dom.overlayGameOver].forEach(o => {
      if (o) o.classList.remove('show');
    });
  }

  function announceSR(msg) {
    if (dom.srAnnouncer) {
      dom.srAnnouncer.textContent = msg;
    }
  }

})();
