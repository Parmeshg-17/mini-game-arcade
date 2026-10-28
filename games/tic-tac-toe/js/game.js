/**
 * Tic Tac Toe — Main Game Controller
 * Manages game state, user interactions, bot timing, timer, move counter,
 * keyboard accessibility, and winning visual effects.
 */

(function () {
  'use strict';

  // Game Configuration & State
  const state = {
    board: ['', '', '', '', '', '', '', '', ''],
    mode: 'bot', // 'bot' (Me vs Bot) or 'pvp' (2 Players)
    difficulty: 'mastermind', // 'casual' or 'mastermind'
    humanSymbol: 'X',
    botSymbol: 'O',
    currentTurn: 'X',
    isGameOver: false,
    isBotThinking: false,
    matchSeconds: 0,
    timerInterval: null,
    moveCount: 0,
    scores: {
      xWins: 0,
      oWins: 0,
      draws: 0
    },
    focusedIndex: 4 // Start focus at center
  };

  // DOM Elements Cache
  let dom = {};

  // Strike line coordinates in percentage (viewBox 0 0 100 100)
  const STRIKE_COORDINATES = [
    { x1: 6, y1: 16.67, x2: 94, y2: 16.67 }, // Row 0
    { x1: 6, y1: 50, x2: 94, y2: 50 },       // Row 1
    { x1: 6, y1: 83.33, x2: 94, y2: 83.33 }, // Row 2
    { x1: 16.67, y1: 6, x2: 16.67, y2: 94 }, // Col 0
    { x1: 50, y1: 6, x2: 50, y2: 94 },       // Col 1
    { x1: 83.33, y1: 6, x2: 83.33, y2: 94 }, // Col 2
    { x1: 8, y1: 8, x2: 92, y2: 92 },        // Diag 0 (0,4,8)
    { x1: 92, y1: 8, x2: 8, y2: 92 }         // Diag 1 (2,4,6)
  ];

  // SVG Mark Templates
  const SVG_MARK_X = `
    <svg class="cell-mark mark-x" viewBox="0 0 48 48" aria-hidden="true">
      <line class="mark-line line-1" x1="10" y1="10" x2="38" y2="38" />
      <line class="mark-line line-2" x1="38" y1="10" x2="10" y2="38" />
    </svg>
  `;

  const SVG_MARK_O = `
    <svg class="cell-mark mark-o" viewBox="0 0 48 48" aria-hidden="true">
      <circle class="mark-circle" cx="24" cy="24" r="15" />
    </svg>
  `;

  // 1. Initialization
  function init() {
    cacheDom();
    loadScores();
    updateScoreboardUI();
    bindEvents();
    startNewRound();
  }

  function cacheDom() {
    dom = {
      // Board & Cells
      board: document.getElementById('ttt-board'),
      cells: Array.from(document.querySelectorAll('.ttt-cell')),
      strikeSvg: document.getElementById('strike-svg'),
      strikeLine: document.getElementById('strike-line'),
      strikeGlow: document.getElementById('strike-glow'),

      // HUD & Status
      turnIndicator: document.getElementById('turn-indicator'),
      turnSymbolBadge: document.getElementById('turn-symbol-badge'),
      turnLabel: document.getElementById('turn-label'),
      matchTimer: document.getElementById('match-timer'),
      moveCounter: document.getElementById('move-counter'),
      audioToggleBtn: document.getElementById('audio-toggle-btn'),
      audioIcon: document.getElementById('audio-icon'),

      // Controls & Selectors
      modeBotBtn: document.getElementById('mode-bot-btn'),
      modePvpBtn: document.getElementById('mode-pvp-btn'),
      botOptionsBar: document.getElementById('bot-options-bar'),
      diffCasualBtn: document.getElementById('diff-casual-btn'),
      diffMastermindBtn: document.getElementById('diff-mastermind-btn'),
      symbolXBtn: document.getElementById('symbol-x-btn'),
      symbolOBtn: document.getElementById('symbol-o-btn'),
      restartBtn: document.getElementById('restart-btn'),

      // Outcome Modal / Banner
      outcomeBanner: document.getElementById('outcome-banner'),
      outcomeTitle: document.getElementById('outcome-title'),
      outcomeSubtitle: document.getElementById('outcome-subtitle'),
      playAgainBtn: document.getElementById('play-again-btn'),

      // Scoreboard
      scoreX: document.getElementById('score-x'),
      scoreO: document.getElementById('score-o'),
      scoreDraws: document.getElementById('score-draws'),
      labelScoreX: document.getElementById('label-score-x'),
      labelScoreO: document.getElementById('label-score-o'),
      clearScoresBtn: document.getElementById('clear-scores-btn'),

      // Confetti Canvas
      confettiCanvas: document.getElementById('confetti-canvas')
    };
  }

  // 2. Scoreboard Storage
  function loadScores() {
    try {
      const saved = localStorage.getItem('arcade_ttt_scores');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.scores.xWins = Number(parsed.xWins) || 0;
        state.scores.oWins = Number(parsed.oWins) || 0;
        state.scores.draws = Number(parsed.draws) || 0;
      }
    } catch (e) {}
  }

  function saveScores() {
    try {
      localStorage.setItem('arcade_ttt_scores', JSON.stringify(state.scores));
    } catch (e) {}
  }

  function updateScoreboardUI() {
    if (dom.scoreX) dom.scoreX.textContent = state.scores.xWins;
    if (dom.scoreO) dom.scoreO.textContent = state.scores.oWins;
    if (dom.scoreDraws) dom.scoreDraws.textContent = state.scores.draws;

    if (dom.labelScoreX && dom.labelScoreO) {
      if (state.mode === 'bot') {
        dom.labelScoreX.textContent = state.humanSymbol === 'X' ? 'Player (X)' : 'Bot (X)';
        dom.labelScoreO.textContent = state.humanSymbol === 'O' ? 'Player (O)' : 'Bot (O)';
      } else {
        dom.labelScoreX.textContent = 'Player X';
        dom.labelScoreO.textContent = 'Player O';
      }
    }
  }

  // 3. Event Listeners
  function bindEvents() {
    // Cell clicks
    dom.cells.forEach((cell) => {
      const idx = Number(cell.dataset.index);
      cell.addEventListener('click', () => handleCellClick(idx));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCellClick(idx);
        }
      });
    });

    // Mode Selector
    if (dom.modeBotBtn) {
      dom.modeBotBtn.addEventListener('click', () => switchMode('bot'));
    }
    if (dom.modePvpBtn) {
      dom.modePvpBtn.addEventListener('click', () => switchMode('pvp'));
    }

    // Difficulty Selector
    if (dom.diffCasualBtn) {
      dom.diffCasualBtn.addEventListener('click', () => setDifficulty('casual'));
    }
    if (dom.diffMastermindBtn) {
      dom.diffMastermindBtn.addEventListener('click', () => setDifficulty('mastermind'));
    }

    // Symbol Chooser
    if (dom.symbolXBtn) {
      dom.symbolXBtn.addEventListener('click', () => setHumanSymbol('X'));
    }
    if (dom.symbolOBtn) {
      dom.symbolOBtn.addEventListener('click', () => setHumanSymbol('O'));
    }

    // Restart & Play Again
    if (dom.restartBtn) {
      dom.restartBtn.addEventListener('click', () => {
        window.TicTacToeAudio?.playReset();
        startNewRound();
      });
    }
    if (dom.playAgainBtn) {
      dom.playAgainBtn.addEventListener('click', () => {
        window.TicTacToeAudio?.playReset();
        startNewRound();
      });
    }

    // Clear Scores
    if (dom.clearScoresBtn) {
      dom.clearScoresBtn.addEventListener('click', () => {
        window.TicTacToeAudio?.playClick();
        state.scores.xWins = 0;
        state.scores.oWins = 0;
        state.scores.draws = 0;
        saveScores();
        updateScoreboardUI();
      });
    }

    // Audio Toggle
    if (dom.audioToggleBtn) {
      updateAudioIcon();
      dom.audioToggleBtn.addEventListener('click', () => {
        const isMuted = window.TicTacToeAudio?.toggleMute();
        updateAudioIcon(isMuted);
      });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', handleGlobalKeydown);

    // Responsive Canvas Resize
    window.addEventListener('resize', resizeConfettiCanvas);
  }

  function updateAudioIcon(muted) {
    if (!dom.audioIcon) return;
    const isMuted = muted !== undefined ? muted : window.TicTacToeAudio?.isMuted();
    dom.audioIcon.textContent = isMuted ? '🔇' : '🔊';
    dom.audioToggleBtn?.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
  }

  // 4. Keyboard Navigation
  function handleGlobalKeydown(e) {
    // Do not interfere if user is typing in form or inputs
    if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) {
      if (e.key === 'r' || e.key === 'R') {
        // Let R reset game
        e.preventDefault();
        startNewRound();
        return;
      }
      return;
    }

    // R: Restart round
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      window.TicTacToeAudio?.playReset();
      startNewRound();
      return;
    }

    // M: Toggle audio
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const isMuted = window.TicTacToeAudio?.toggleMute();
      updateAudioIcon(isMuted);
      return;
    }

    // Number keys 1-9 (Support both 1-9 top-row and keypad)
    const num = Number(e.key);
    if (!isNaN(num) && num >= 1 && num <= 9) {
      e.preventDefault();
      handleCellClick(num - 1);
      return;
    }

    // Arrow keys for grid navigation
    let newFocus = state.focusedIndex;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newFocus = (newFocus - 3 + 9) % 9;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newFocus = (newFocus + 3) % 9;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newFocus = newFocus % 3 === 0 ? newFocus + 2 : newFocus - 1;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newFocus = newFocus % 3 === 2 ? newFocus - 2 : newFocus + 1;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCellClick(state.focusedIndex);
      return;
    } else {
      return;
    }

    state.focusedIndex = newFocus;
    dom.cells[newFocus]?.focus();
  }

  // 5. Game Round Lifecycle
  function startNewRound() {
    // Stop previous timer
    stopTimer();

    // Reset state
    state.board = ['', '', '', '', '', '', '', '', ''];
    state.currentTurn = 'X';
    state.isGameOver = false;
    state.isBotThinking = false;
    state.matchSeconds = 0;
    state.moveCount = 0;

    // Clear board cells
    dom.cells.forEach((cell, idx) => {
      cell.innerHTML = '';
      cell.classList.remove('has-x', 'has-o', 'winning-cell');
      cell.setAttribute('aria-label', `Cell ${idx + 1}, empty`);
      cell.disabled = false;
    });

    // Hide strike line & outcome banner
    hideStrikeLine();
    if (dom.outcomeBanner) {
      dom.outcomeBanner.classList.remove('show');
    }

    // Reset Move and Timer UI
    updateMoveCounterUI();
    updateTimerUI();
    updateTurnUI();

    // Start timer on first move
    // If Bot goes first (player chose O), trigger bot move
    if (state.mode === 'bot' && state.botSymbol === 'X') {
      startTimer();
      triggerBotMove();
    }
  }

  function handleCellClick(index) {
    if (state.isGameOver || state.isBotThinking) return;
    if (state.board[index] !== '') return;

    // Start timer on first user move
    if (state.moveCount === 0 && !state.timerInterval) {
      startTimer();
    }

    // Place mark
    makeMove(index, state.currentTurn);

    // If game ended, finish
    if (state.isGameOver) return;

    // If Mode is 'bot', trigger bot response
    if (state.mode === 'bot' && state.currentTurn === state.botSymbol) {
      triggerBotMove();
    }
  }

  function makeMove(index, symbol) {
    state.board[index] = symbol;
    state.moveCount++;
    updateMoveCounterUI();

    // Render mark in cell
    const cell = dom.cells[index];
    if (cell) {
      cell.innerHTML = symbol === 'X' ? SVG_MARK_X : SVG_MARK_O;
      cell.classList.add(symbol === 'X' ? 'has-x' : 'has-o');
      cell.setAttribute('aria-label', `Cell ${index + 1}, ${symbol}`);
    }

    // Play Sound
    if (symbol === 'X') {
      window.TicTacToeAudio?.playMarkX();
    } else {
      window.TicTacToeAudio?.playMarkO();
    }

    // Check for Win or Draw
    const winResult = window.TicTacToeAI?.checkWinner(state.board);
    if (winResult) {
      handleWin(winResult);
      return;
    }

    if (window.TicTacToeAI?.isBoardFull(state.board)) {
      handleDraw();
      return;
    }

    // Switch turn
    state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
    updateTurnUI();
  }

  function triggerBotMove() {
    state.isBotThinking = true;
    updateTurnUI(true);

    // Subtle humanized delay so the bot doesn't feel instant
    const thinkingDelay = state.difficulty === 'mastermind' ? 320 : 250;

    setTimeout(() => {
      if (state.isGameOver) {
        state.isBotThinking = false;
        return;
      }

      const bestMove = window.TicTacToeAI?.findBestMove(
        state.board,
        state.botSymbol,
        state.humanSymbol,
        state.difficulty
      );

      state.isBotThinking = false;

      if (bestMove !== undefined && bestMove >= 0 && state.board[bestMove] === '') {
        makeMove(bestMove, state.botSymbol);
      }
    }, thinkingDelay);
  }

  // 6. Win & Draw Handlers
  function handleWin(winResult) {
    state.isGameOver = true;
    stopTimer();

    const winner = winResult.winner;
    const lineIndices = winResult.line;

    // Highlight winning cells
    lineIndices.forEach((idx) => {
      dom.cells[idx]?.classList.add('winning-cell');
    });

    // Draw animated strike line
    drawStrikeLine(winResult.lineIndex);

    // Update Scores
    if (winner === 'X') {
      state.scores.xWins++;
    } else {
      state.scores.oWins++;
    }
    saveScores();
    updateScoreboardUI();

    // Audio Fanfare
    window.TicTacToeAudio?.playWin();

    // Particle Confetti
    launchConfetti();

    // Show Victory Banner
    let winnerText = '';
    if (state.mode === 'bot') {
      winnerText = winner === state.humanSymbol ? 'Victory! You Won!' : 'Mastermind Bot Wins!';
    } else {
      winnerText = `Player ${winner} Triumphs!`;
    }

    showOutcomeBanner({
      title: winnerText,
      subtitle: `Resolved in ${state.moveCount} moves • ${formatTime(state.matchSeconds)}`,
      winner: winner
    });
  }

  function handleDraw() {
    state.isGameOver = true;
    stopTimer();

    state.scores.draws++;
    saveScores();
    updateScoreboardUI();

    window.TicTacToeAudio?.playDraw();

    showOutcomeBanner({
      title: "It's a Stalemate!",
      subtitle: `All 9 cells locked with no winner • ${formatTime(state.matchSeconds)}`,
      winner: null
    });
  }

  function showOutcomeBanner({ title, subtitle, winner }) {
    if (!dom.outcomeBanner) return;
    if (dom.outcomeTitle) dom.outcomeTitle.textContent = title;
    if (dom.outcomeSubtitle) dom.outcomeSubtitle.textContent = subtitle;

    dom.outcomeBanner.classList.remove('winner-x', 'winner-o', 'winner-draw');
    if (winner === 'X') {
      dom.outcomeBanner.classList.add('winner-x');
    } else if (winner === 'O') {
      dom.outcomeBanner.classList.add('winner-o');
    } else {
      dom.outcomeBanner.classList.add('winner-draw');
    }

    dom.outcomeBanner.classList.add('show');
    dom.playAgainBtn?.focus();
  }

  // 7. Winning Strike Line Overlay
  function drawStrikeLine(lineIndex) {
    if (!dom.strikeLine || !dom.strikeGlow || !dom.strikeSvg) return;

    const coords = STRIKE_COORDINATES[lineIndex];
    if (!coords) return;

    dom.strikeLine.setAttribute('x1', `${coords.x1}%`);
    dom.strikeLine.setAttribute('y1', `${coords.y1}%`);
    dom.strikeLine.setAttribute('x2', `${coords.x2}%`);
    dom.strikeLine.setAttribute('y2', `${coords.y2}%`);

    dom.strikeGlow.setAttribute('x1', `${coords.x1}%`);
    dom.strikeGlow.setAttribute('y1', `${coords.y1}%`);
    dom.strikeGlow.setAttribute('x2', `${coords.x2}%`);
    dom.strikeGlow.setAttribute('y2', `${coords.y2}%`);

    dom.strikeSvg.style.display = 'block';
    dom.strikeSvg.classList.add('animate-strike');
  }

  function hideStrikeLine() {
    if (!dom.strikeSvg) return;
    dom.strikeSvg.style.display = 'none';
    dom.strikeSvg.classList.remove('animate-strike');
  }

  // 8. Turn & HUD Updates
  function updateTurnUI(botThinking = false) {
    if (!dom.turnSymbolBadge || !dom.turnLabel) return;

    if (state.isGameOver) {
      dom.turnLabel.textContent = 'Match Complete';
      dom.turnSymbolBadge.className = 'turn-symbol-badge badge-neutral';
      dom.turnSymbolBadge.textContent = '★';
      return;
    }

    if (botThinking) {
      dom.turnLabel.textContent = 'Bot is analyzing...';
      dom.turnSymbolBadge.className = `turn-symbol-badge ${state.botSymbol === 'X' ? 'badge-x' : 'badge-o'} pulse`;
      dom.turnSymbolBadge.textContent = state.botSymbol;
      return;
    }

    const symbol = state.currentTurn;
    dom.turnSymbolBadge.className = `turn-symbol-badge ${symbol === 'X' ? 'badge-x' : 'badge-o'}`;
    dom.turnSymbolBadge.textContent = symbol;

    if (state.mode === 'bot') {
      const isPlayerTurn = symbol === state.humanSymbol;
      dom.turnLabel.textContent = isPlayerTurn ? 'Your Turn' : 'Bot Turn';
    } else {
      dom.turnLabel.textContent = `Player ${symbol}'s Turn`;
    }
  }

  function updateMoveCounterUI() {
    if (dom.moveCounter) {
      dom.moveCounter.textContent = `Move: ${state.moveCount} / 9`;
    }
  }

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateTimerUI() {
    if (dom.matchTimer) {
      dom.matchTimer.textContent = formatTime(state.matchSeconds);
    }
  }

  function startTimer() {
    stopTimer();
    state.timerInterval = setInterval(() => {
      state.matchSeconds++;
      updateTimerUI();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  // 9. Mode & Settings Controls
  function switchMode(newMode) {
    if (state.mode === newMode) return;
    window.TicTacToeAudio?.playClick();
    state.mode = newMode;

    if (dom.modeBotBtn && dom.modePvpBtn) {
      dom.modeBotBtn.classList.toggle('active', newMode === 'bot');
      dom.modePvpBtn.classList.toggle('active', newMode === 'pvp');
    }

    if (dom.botOptionsBar) {
      dom.botOptionsBar.style.display = newMode === 'bot' ? 'flex' : 'none';
    }

    updateScoreboardUI();
    startNewRound();
  }

  function setDifficulty(newDiff) {
    if (state.difficulty === newDiff) return;
    window.TicTacToeAudio?.playClick();
    state.difficulty = newDiff;

    if (dom.diffCasualBtn && dom.diffMastermindBtn) {
      dom.diffCasualBtn.classList.toggle('active', newDiff === 'casual');
      dom.diffMastermindBtn.classList.toggle('active', newDiff === 'mastermind');
    }

    startNewRound();
  }

  function setHumanSymbol(sym) {
    if (state.humanSymbol === sym) return;
    window.TicTacToeAudio?.playClick();
    state.humanSymbol = sym;
    state.botSymbol = sym === 'X' ? 'O' : 'X';

    if (dom.symbolXBtn && dom.symbolOBtn) {
      dom.symbolXBtn.classList.toggle('active', sym === 'X');
      dom.symbolOBtn.classList.toggle('active', sym === 'O');
    }

    updateScoreboardUI();
    startNewRound();
  }

  // 10. Particle Confetti Burst
  let confettiParticles = [];
  let confettiAnimationId = null;

  function resizeConfettiCanvas() {
    if (!dom.confettiCanvas) return;
    const parent = dom.confettiCanvas.parentElement;
    if (parent) {
      dom.confettiCanvas.width = parent.clientWidth;
      dom.confettiCanvas.height = parent.clientHeight;
    }
  }

  function launchConfetti() {
    if (!dom.confettiCanvas) return;
    resizeConfettiCanvas();
    const ctx = dom.confettiCanvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#d5ff55', '#ff784f', '#38bdf8', '#f4f2e9', '#e8ff8c'];
    confettiParticles = [];

    const width = dom.confettiCanvas.width;
    const height = dom.confettiCanvas.height;

    for (let i = 0; i < 60; i++) {
      confettiParticles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 60,
        y: height * 0.5 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 10 - 2,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        alpha: 1,
        decay: Math.random() * 0.02 + 0.012
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animateConfetti(ctx, width, height);
  }

  function animateConfetti(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;
    for (let i = 0; i < confettiParticles.length; i++) {
      const p = confettiParticles[i];
      if (p.alpha <= 0) continue;

      activeCount++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.rotation += p.rotSpeed;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (activeCount > 0) {
      confettiAnimationId = requestAnimationFrame(() => animateConfetti(ctx, width, height));
    } else {
      ctx.clearRect(0, 0, width, height);
      confettiAnimationId = null;
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
