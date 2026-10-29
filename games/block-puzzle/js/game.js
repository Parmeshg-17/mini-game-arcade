/**
 * Block Puzzle — Interactive DOM Game Controller
 * Features:
 * - Fluid Pointer Drag & Drop with finger-offset preview & touch support
 * - Tap-to-select and click-to-place fallback for full accessibility
 * - Dynamic can-place dock status (greys out shapes that currently cannot fit)
 * - Juicy neon line-clearing blast animations & floating score popups
 * - Smart balanced dealing with solvability safeguards
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
    targetLines: 10,
    blitzDuration: 90,
    bestScores: {
      classic: 0,
      challenge: 0,
      blitz: 0
    },
    // Drag and Drop state
    isDragging: false,
    dragShapeIndex: -1,
    dragHoverRow: -1,
    dragHoverCol: -1,
    touchOffsetY: 0
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
    dom.boardContainer = document.querySelector('.board-container');
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

    // Create drag avatar element
    dom.dragAvatar = document.createElement('div');
    dom.dragAvatar.id = 'drag-avatar';
    dom.dragAvatar.className = 'drag-avatar';
    document.body.appendChild(dom.dragAvatar);
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

    // Global keyboard listener
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
    state.isDragging = false;
    state.dragShapeIndex = -1;

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
    // Pass current grid to ensure deal is balanced and guaranteed solvable!
    state.dockShapes = Engine ? Engine.dealShapes(3, Math.random, state.grid) : [];
    state.selectedDockIndex = state.dockShapes.findIndex(s => s !== null);
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

        // Pointer hover for preview
        cell.addEventListener('pointerenter', () => {
          if (state.status === 'playing' && state.selectedDockIndex !== -1 && !state.isDragging) {
            state.cursorRow = r;
            state.cursorCol = c;
            updatePlacementPreview(r, c);
          }
        });

        // Click / tap to place (fallback mode)
        cell.addEventListener('pointerdown', (e) => {
          if (state.isDragging) return;
          if (state.status === 'playing' && state.selectedDockIndex !== -1) {
            e.preventDefault();
            handleAttemptPlace(r, c, state.selectedDockIndex);
          }
        });

        dom.boardGrid.appendChild(cell);
      }
    }

    if (state.selectedDockIndex !== -1 && !state.isDragging) {
      updatePlacementPreview(state.cursorRow, state.cursorCol);
    }
  }

  function renderDock() {
    if (!dom.dockSlots) return;
    const Engine = window.BlockEngine;

    state.dockShapes.forEach((shape, idx) => {
      const slot = dom.dockSlots[idx];
      if (!slot) return;
      slot.innerHTML = '';
      slot.className = 'dock-slot';

      if (!shape) {
        slot.classList.add('empty');
        return;
      }

      if (state.selectedDockIndex === idx) {
        slot.classList.add('selected');
      }

      // Check if this piece can currently fit anywhere on the board
      const canFit = Engine ? Engine.canShapeFitAnywhere(state.grid, shape.matrix) : true;
      if (!canFit) {
        slot.classList.add('cannot-fit');
        slot.setAttribute('title', 'No room for this shape right now. Clear lines first!');
      }

      // Build mini-block grid
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

      // Attach pointer down for DRAG or TAP
      slot.onpointerdown = (e) => {
        if (state.status !== 'playing' && state.status !== 'ready') return;
        e.preventDefault();
        startPieceDrag(e, idx);
      };

      slot.appendChild(pieceWrap);
    });
  }

  /**
   * Fluid Drag and Drop Controller
   */
  function startPieceDrag(e, dockIndex) {
    const shape = state.dockShapes[dockIndex];
    if (!shape) return;

    state.selectedDockIndex = dockIndex;
    state.dragShapeIndex = dockIndex;
    state.isDragging = true;

    // Ergonomic touch offset: lift 60px above finger on mobile so finger doesn't block view
    state.touchOffsetY = e.pointerType === 'touch' ? 64 : 10;

    if (window.BlockAudio) window.BlockAudio.playSelect();
    renderDock();

    // Populate and show drag avatar
    setupDragAvatar(shape);
    moveDragAvatar(e.clientX, e.clientY);

    // Bind window drag listeners
    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp, { passive: false });
    window.addEventListener('pointercancel', onWindowPointerCancel, { passive: false });
  }

  function setupDragAvatar(shape) {
    if (!dom.dragAvatar) return;
    dom.dragAvatar.innerHTML = '';
    dom.dragAvatar.style.display = 'grid';

    const matrix = shape.matrix;
    const h = matrix.length;
    const w = matrix[0].length;

    dom.dragAvatar.style.gridTemplateRows = `repeat(${h}, 1fr)`;
    dom.dragAvatar.style.gridTemplateColumns = `repeat(${w}, 1fr)`;

    // Calculate cell dimension matching the board grid
    const boardRect = dom.boardGrid ? dom.boardGrid.getBoundingClientRect() : { width: 360 };
    const cellSize = (boardRect.width - 16) / 8; // approx 40px

    dom.dragAvatar.style.width = `${w * cellSize}px`;
    dom.dragAvatar.style.height = `${h * cellSize}px`;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const block = document.createElement('div');
        block.className = 'avatar-block';
        if (matrix[r][c] === 1) {
          block.style.backgroundColor = shape.color;
          block.classList.add('filled');
        }
        dom.dragAvatar.appendChild(block);
      }
    }
  }

  function moveDragAvatar(clientX, clientY) {
    if (!dom.dragAvatar) return;
    const shape = state.dockShapes[state.dragShapeIndex];
    if (!shape) return;

    const avatarW = dom.dragAvatar.offsetWidth || 80;
    const avatarH = dom.dragAvatar.offsetHeight || 80;

    // Center the avatar on cursor with touch vertical offset
    const x = clientX - (avatarW / 2);
    const y = clientY - (avatarH / 2) - state.touchOffsetY;

    dom.dragAvatar.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.05)`;
  }

  function onWindowPointerMove(e) {
    if (!state.isDragging) return;
    e.preventDefault();
    moveDragAvatar(e.clientX, e.clientY);

    // Map pointer to grid cell
    const targetCell = getGridCoordsFromPoint(e.clientX, e.clientY - state.touchOffsetY);
    if (targetCell) {
      state.dragHoverRow = targetCell.row;
      state.dragHoverCol = targetCell.col;
      state.cursorRow = targetCell.row;
      state.cursorCol = targetCell.col;
      updatePlacementPreview(targetCell.row, targetCell.col);
    } else {
      state.dragHoverRow = -1;
      state.dragHoverCol = -1;
      clearPlacementPreview();
    }
  }

  function onWindowPointerUp(e) {
    if (!state.isDragging) return;
    e.preventDefault();

    cleanupDrag();

    // Check if released over a valid grid spot
    if (state.dragHoverRow !== -1 && state.dragHoverCol !== -1) {
      handleAttemptPlace(state.dragHoverRow, state.dragHoverCol, state.dragShapeIndex);
    }
  }

  function onWindowPointerCancel() {
    cleanupDrag();
  }

  function cleanupDrag() {
    state.isDragging = false;
    window.removeEventListener('pointermove', onWindowPointerMove);
    window.removeEventListener('pointerup', onWindowPointerUp);
    window.removeEventListener('pointercancel', onWindowPointerCancel);

    if (dom.dragAvatar) {
      dom.dragAvatar.style.display = 'none';
      dom.dragAvatar.innerHTML = '';
    }
    clearPlacementPreview();
  }

  function getGridCoordsFromPoint(clientX, clientY) {
    if (!dom.boardGrid) return null;
    const rect = dom.boardGrid.getBoundingClientRect();

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }

    const shape = state.dockShapes[state.dragShapeIndex];
    const shapeW = shape ? shape.matrix[0].length : 1;
    const shapeH = shape ? shape.matrix.length : 1;

    const cellWidth = rect.width / 8;
    const cellHeight = rect.height / 8;

    // Center shape around pointer
    const rawCol = Math.floor((clientX - rect.left) / cellWidth) - Math.floor((shapeW - 1) / 2);
    const rawRow = Math.floor((clientY - rect.top) / cellHeight) - Math.floor((shapeH - 1) / 2);

    const clampedCol = Math.max(0, Math.min(8 - shapeW, rawCol));
    const clampedRow = Math.max(0, Math.min(8 - shapeH, rawRow));

    return { row: clampedRow, col: clampedCol };
  }

  function clearPlacementPreview() {
    if (!dom.boardGrid) return;
    const cells = dom.boardGrid.children;
    for (let i = 0; i < cells.length; i++) {
      cells[i].classList.remove('preview-valid', 'preview-invalid', 'preview-clearing');
    }
  }

  function updatePlacementPreview(startR, startC) {
    clearPlacementPreview();
    const currentShape = state.dockShapes[state.selectedDockIndex];
    if (!currentShape || state.status !== 'playing') return;

    const Engine = window.BlockEngine;
    const isValid = Engine ? Engine.canPlaceShape(state.grid, currentShape.matrix, startR, startC) : false;

    const h = currentShape.matrix.length;
    const w = currentShape.matrix[0].length;
    const cells = dom.boardGrid.children;

    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        if (currentShape.matrix[r][c] === 1) {
          const targetR = startR + r;
          const targetC = startC + c;
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

    // Highlight lines that will blast
    if (isValid && Engine) {
      const sim = Engine.placeShape(state.grid, currentShape.matrix, startR, startC, currentShape.color);
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

  function handleAttemptPlace(startR, startC, dockIndex) {
    const shape = state.dockShapes[dockIndex];
    if (!shape) return;

    const Engine = window.BlockEngine;
    const placement = Engine ? Engine.placeShape(state.grid, shape.matrix, startR, startC, shape.color) : { success: false };

    if (!placement.success) {
      if (window.BlockAudio) window.BlockAudio.playInvalid();
      triggerScreenShake();
      return;
    }

    // Success! Update grid & consume piece
    state.grid = placement.newGrid;
    state.moves++;
    state.dockShapes[dockIndex] = null;
    clearPlacementPreview();

    if (window.BlockAudio) window.BlockAudio.playPlace();

    // Check completed lines
    const lineCheck = Engine.checkCompletedLines(state.grid);
    const linesCount = lineCheck.totalLines;

    if (linesCount > 0) {
      state.comboStreak++;
      state.linesCleared += linesCount;

      // Render board with immediate placed shape
      renderBoard();

      // Trigger line blast animations on clearing cells
      highlightAndBlastLines(lineCheck.fullRows, lineCheck.fullCols, () => {
        const clearRes = Engine.clearLines(state.grid, lineCheck.fullRows, lineCheck.fullCols);
        state.grid = clearRes.newGrid;

        const earned = Engine.calculatePlacementScore(placement.placedCount, linesCount, state.comboStreak);
        state.score += earned;

        showFloatingScore(`+${earned}${state.comboStreak > 1 ? ` (${state.comboStreak}x Streak!)` : ''}`);

        if (window.BlockAudio) {
          window.BlockAudio.playLineClear(linesCount);
          if (state.comboStreak > 1) {
            window.BlockAudio.playCombo(state.comboStreak);
          }
        }

        if (state.mode === 'blitz') {
          state.timer = Math.min(state.blitzDuration, state.timer + (linesCount * 3));
        }

        finalizeTurn();
      });

    } else {
      state.comboStreak = 0;
      const earned = Engine.calculatePlacementScore(placement.placedCount, 0, 0);
      state.score += earned;
      finalizeTurn();
    }
  }

  function highlightAndBlastLines(rows, cols, onComplete) {
    const cells = dom.boardGrid.children;
    const blastedCells = [];

    rows.forEach(r => {
      for (let c = 0; c < 8; c++) {
        const cell = cells[r * 8 + c];
        if (cell) blastedCells.push(cell);
      }
    });

    cols.forEach(c => {
      for (let r = 0; r < 8; r++) {
        const cell = cells[r * 8 + c];
        if (cell && !blastedCells.includes(cell)) blastedCells.push(cell);
      }
    });

    blastedCells.forEach(cell => cell.classList.add('cell-blast'));
    triggerScreenShake();

    setTimeout(() => {
      blastedCells.forEach(cell => cell.classList.remove('cell-blast'));
      onComplete();
    }, 180);
  }

  function finalizeTurn() {
    const Engine = window.BlockEngine;

    // Deal new shapes if dock is empty
    const remaining = state.dockShapes.filter(s => s !== null);
    if (remaining.length === 0) {
      dealNewDockShapes();
    }

    // Automatically select next placeable dock piece
    state.selectedDockIndex = state.dockShapes.findIndex(s => s !== null && Engine.canShapeFitAnywhere(state.grid, s.matrix));
    if (state.selectedDockIndex === -1) {
      state.selectedDockIndex = state.dockShapes.findIndex(s => s !== null);
    }

    updateHUD();
    renderBoard();
    renderDock();

    // Check Win Condition for Challenge Mode
    if (state.mode === 'challenge' && state.linesCleared >= state.targetLines) {
      endGame(true);
      return;
    }

    // Check Game Over Condition
    const available = state.dockShapes.filter(s => s !== null);
    const canMove = Engine.hasAnyValidMove(state.grid, available);

    if (!canMove) {
      endGame(false);
    }
  }

  function showFloatingScore(text) {
    if (!dom.boardContainer) return;
    const floater = document.createElement('div');
    floater.className = 'floating-score';
    floater.textContent = text;
    dom.boardContainer.appendChild(floater);
    setTimeout(() => floater.remove(), 800);
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
    renderDock();
    updatePlacementPreview(state.cursorRow, state.cursorCol);
    announceSR('Block Puzzle match started! Drag or tap shapes onto the grid.');
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
      const targetIdx = parseInt(key, 10) - 1;
      if (state.dockShapes[targetIdx]) {
        state.selectedDockIndex = targetIdx;
        if (window.BlockAudio) window.BlockAudio.playSelect();
        renderDock();
        updatePlacementPreview(state.cursorRow, state.cursorCol);
      }
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
      updatePlacementPreview(state.cursorRow, state.cursorCol);
      return;
    }

    // Space / Enter to place shape at cursor
    if (key === ' ' || key === 'enter') {
      e.preventDefault();
      handleAttemptPlace(state.cursorRow, state.cursorCol, state.selectedDockIndex);
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
    renderDock();
    updatePlacementPreview(state.cursorRow, state.cursorCol);
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
          descEl.textContent = 'Drag or tap polyominos from your dock to fit them onto the 8×8 board. Fill rows or columns to blast lines and trigger explosive combo streaks!';
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
