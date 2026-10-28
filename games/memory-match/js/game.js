/**
 * Memory Match — Main Game Controller
 * Manages game lifecycle, card flips, matching logic, 3 difficulty modes,
 * timer, move counter, accessible keyboard navigation, and celebratory win effects.
 */

(function () {
  'use strict';

  // Game State
  const state = {
    difficulty: 'medium', // 'easy', 'medium', 'hard'
    cards: [],
    flippedIndices: [],
    matchedPairs: 0,
    totalPairs: 8,
    moves: 0,
    isLocked: false,
    isGameActive: false,
    isWon: false,
    seconds: 0,
    timerInterval: null,
    focusedIndex: 0,
    bestScores: {
      easy: null,
      medium: null,
      hard: null
    }
  };

  // DOM Elements Cache
  let dom = {};

  // 1. Initialization
  function init() {
    cacheDom();
    loadBestScores();
    updateBestScoreBadge();
    bindEvents();
    startNewGame(state.difficulty);
  }

  function cacheDom() {
    dom = {
      // Board & Grid
      grid: document.getElementById('memory-grid'),
      stageCard: document.getElementById('memory-stage-card'),

      // HUD & Status
      timerDisplay: document.getElementById('match-timer'),
      movesDisplay: document.getElementById('moves-count'),
      pairsDisplay: document.getElementById('pairs-matched'),
      audioToggleBtn: document.getElementById('audio-toggle-btn'),
      audioIcon: document.getElementById('audio-icon'),

      // Mode / Difficulty Buttons
      diffEasyBtn: document.getElementById('diff-easy-btn'),
      diffMedBtn: document.getElementById('diff-med-btn'),
      diffHardBtn: document.getElementById('diff-hard-btn'),

      // Action Buttons
      restartBtn: document.getElementById('restart-btn'),
      playAgainBtn: document.getElementById('play-again-btn'),
      clearBestBtn: document.getElementById('clear-best-btn'),

      // Outcome Modal / Banner
      outcomeBanner: document.getElementById('outcome-banner'),
      outcomeTitle: document.getElementById('outcome-title'),
      outcomeSubtitle: document.getElementById('outcome-subtitle'),
      outcomeStars: document.getElementById('outcome-stars'),
      outcomeTimeVal: document.getElementById('outcome-time-val'),
      outcomeMovesVal: document.getElementById('outcome-moves-val'),
      outcomeBestVal: document.getElementById('outcome-best-val'),

      // Best Score Display
      bestScoreDisplay: document.getElementById('best-score-display'),

      // Confetti Canvas
      confettiCanvas: document.getElementById('confetti-canvas')
    };
  }

  // 2. Best Score Persistence
  function loadBestScores() {
    try {
      const saved = localStorage.getItem('arcade_memory_best');
      if (saved) {
        state.bestScores = Object.assign(state.bestScores, JSON.parse(saved));
      }
    } catch (e) {}
  }

  function saveBestScores() {
    try {
      localStorage.setItem('arcade_memory_best', JSON.stringify(state.bestScores));
    } catch (e) {}
  }

  function updateBestScoreBadge() {
    if (!dom.bestScoreDisplay) return;
    const currentBest = state.bestScores[state.difficulty];
    if (currentBest) {
      dom.bestScoreDisplay.textContent = `Best: ${currentBest.moves} moves (${formatTime(currentBest.time)})`;
    } else {
      dom.bestScoreDisplay.textContent = 'Best: --';
    }
  }

  // 3. Event Binding
  function bindEvents() {
    // Difficulty Buttons
    if (dom.diffEasyBtn) {
      dom.diffEasyBtn.addEventListener('click', () => switchDifficulty('easy'));
    }
    if (dom.diffMedBtn) {
      dom.diffMedBtn.addEventListener('click', () => switchDifficulty('medium'));
    }
    if (dom.diffHardBtn) {
      dom.diffHardBtn.addEventListener('click', () => switchDifficulty('hard'));
    }

    // Restart & Play Again
    if (dom.restartBtn) {
      dom.restartBtn.addEventListener('click', () => {
        window.MemoryAudio?.playReset();
        startNewGame(state.difficulty);
      });
    }
    if (dom.playAgainBtn) {
      dom.playAgainBtn.addEventListener('click', () => {
        window.MemoryAudio?.playReset();
        startNewGame(state.difficulty);
      });
    }

    // Clear Best Scores
    if (dom.clearBestBtn) {
      dom.clearBestBtn.addEventListener('click', () => {
        window.MemoryAudio?.playClick();
        state.bestScores = { easy: null, medium: null, hard: null };
        saveBestScores();
        updateBestScoreBadge();
      });
    }

    // Audio Toggle
    if (dom.audioToggleBtn) {
      updateAudioIcon();
      dom.audioToggleBtn.addEventListener('click', () => {
        const isMuted = window.MemoryAudio?.toggleMute();
        updateAudioIcon(isMuted);
      });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', handleGlobalKeydown);

    // Canvas Resize for Confetti
    window.addEventListener('resize', resizeConfettiCanvas);
  }

  function updateAudioIcon(muted) {
    if (!dom.audioIcon) return;
    const isMuted = muted !== undefined ? muted : window.MemoryAudio?.isMuted();
    dom.audioIcon.textContent = isMuted ? '🔇' : '🔊';
    dom.audioToggleBtn?.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
  }

  // 4. Keyboard Navigation
  function handleGlobalKeydown(e) {
    // Ignore if inside text input or textarea
    if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // R: Restart round
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      window.MemoryAudio?.playReset();
      startNewGame(state.difficulty);
      return;
    }

    // M: Toggle audio
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      const isMuted = window.MemoryAudio?.toggleMute();
      updateAudioIcon(isMuted);
      return;
    }

    // Arrow keys for grid navigation
    const config = window.MemoryCards?.DIFFICULTIES[state.difficulty] || { gridCols: 4 };
    const cols = config.gridCols;
    const total = state.cards.length;
    let newFocus = state.focusedIndex;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      newFocus = (newFocus - cols + total) % total;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newFocus = (newFocus + cols) % total;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      newFocus = (newFocus - 1 + total) % total;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      newFocus = (newFocus + 1) % total;
    } else if (e.key === 'Enter' || e.key === ' ') {
      // If focused element is a memory card, trigger flip
      if (document.activeElement && document.activeElement.classList.contains('memory-card')) {
        e.preventDefault();
        const idx = Number(document.activeElement.dataset.index);
        flipCard(idx);
        return;
      }
    } else {
      return;
    }

    state.focusedIndex = newFocus;
    const targetCard = dom.grid?.querySelector(`.memory-card[data-index="${newFocus}"]`);
    targetCard?.focus();
  }

  // 5. Game Round Lifecycle
  function switchDifficulty(diff) {
    if (state.difficulty === diff) return;
    window.MemoryAudio?.playClick();
    state.difficulty = diff;

    // Update difficulty segment UI
    [dom.diffEasyBtn, dom.diffMedBtn, dom.diffHardBtn].forEach(btn => {
      btn?.classList.remove('active');
      btn?.setAttribute('aria-selected', 'false');
    });

    if (diff === 'easy') {
      dom.diffEasyBtn?.classList.add('active');
      dom.diffEasyBtn?.setAttribute('aria-selected', 'true');
    } else if (diff === 'medium') {
      dom.diffMedBtn?.classList.add('active');
      dom.diffMedBtn?.setAttribute('aria-selected', 'true');
    } else if (diff === 'hard') {
      dom.diffHardBtn?.classList.add('active');
      dom.diffHardBtn?.setAttribute('aria-selected', 'true');
    }

    updateBestScoreBadge();
    startNewGame(diff);
  }

  function startNewGame(difficulty = 'medium') {
    stopTimer();

    const config = window.MemoryCards?.DIFFICULTIES[difficulty] || window.MemoryCards?.DIFFICULTIES.medium;
    state.totalPairs = config.pairsCount;
    state.matchedPairs = 0;
    state.moves = 0;
    state.seconds = 0;
    state.isLocked = false;
    state.isGameActive = false;
    state.isWon = false;
    state.flippedIndices = [];
    state.focusedIndex = 0;

    // Generate fresh shuffled deck
    state.cards = window.MemoryCards?.generateDeck(difficulty) || [];

    // Hide Outcome Banner
    if (dom.outcomeBanner) {
      dom.outcomeBanner.classList.remove('show');
    }

    // Reset HUD
    updateTimerUI();
    updateMovesUI();
    updatePairsUI();
    updateBestScoreBadge();

    // Render Grid Cards
    renderGrid(config);
  }

  function renderGrid(config) {
    if (!dom.grid) return;
    dom.grid.innerHTML = '';

    // Apply grid column classes
    dom.grid.className = `memory-grid grid-cols-${config.gridCols}`;

    state.cards.forEach((card, idx) => {
      const cardBtn = document.createElement('button');
      cardBtn.type = 'button';
      cardBtn.className = 'memory-card';
      cardBtn.dataset.index = idx;
      cardBtn.dataset.cardId = card.cardId;
      cardBtn.setAttribute('aria-label', `Card ${idx + 1}, hidden`);
      cardBtn.setAttribute('tabindex', '0');

      cardBtn.innerHTML = `
        <div class="card-inner">
          <div class="card-front">
            <div class="card-back-pattern">
              <svg viewBox="0 0 28 28" class="card-emblem-svg" aria-hidden="true">
                <rect x="2" y="2" width="24" height="24" rx="4" fill="#171A16" stroke="rgba(244,242,233,0.2)" stroke-width="1.6"/>
                <path d="M7 14H21M14 7V21" stroke="#d5ff55" stroke-width="1.6" stroke-linecap="round"/>
                <circle cx="14" cy="14" r="2.5" fill="#38bdf8"/>
              </svg>
            </div>
          </div>
          <div class="card-back" style="--card-accent: ${card.color}">
            <div class="card-icon-container">
              ${card.svg}
            </div>
            <span class="card-name-label">${card.name}</span>
          </div>
        </div>
      `;

      cardBtn.addEventListener('click', () => flipCard(idx));

      dom.grid.appendChild(cardBtn);
    });
  }

  // 6. Card Flip & Matching Logic
  function flipCard(index) {
    if (state.isLocked || state.isWon) return;

    const cardEl = dom.grid?.querySelector(`.memory-card[data-index="${index}"]`);
    if (!cardEl) return;

    // Ignore if already flipped or matched
    if (cardEl.classList.contains('is-flipped') || cardEl.classList.contains('is-matched')) {
      return;
    }

    // Start timer on first flip
    if (!state.isGameActive) {
      state.isGameActive = true;
      startTimer();
    }

    // Flip card face up
    cardEl.classList.add('is-flipped');
    cardEl.setAttribute('aria-label', `Card ${index + 1}, ${state.cards[index].name}`);
    window.MemoryAudio?.playFlip();

    state.flippedIndices.push(index);

    // If 2 cards are face up, check match
    if (state.flippedIndices.length === 2) {
      state.moves++;
      updateMovesUI();
      checkForMatch();
    }
  }

  function checkForMatch() {
    const [idx1, idx2] = state.flippedIndices;
    const card1 = state.cards[idx1];
    const card2 = state.cards[idx2];

    const el1 = dom.grid?.querySelector(`.memory-card[data-index="${idx1}"]`);
    const el2 = dom.grid?.querySelector(`.memory-card[data-index="${idx2}"]`);

    if (card1.cardId === card2.cardId) {
      // MATCH!
      state.isLocked = true;
      setTimeout(() => {
        el1?.classList.add('is-matched');
        el2?.classList.add('is-matched');
        el1?.setAttribute('aria-label', `Matched ${card1.name}`);
        el2?.setAttribute('aria-label', `Matched ${card2.name}`);

        window.MemoryAudio?.playMatch();
        state.matchedPairs++;
        updatePairsUI();
        state.flippedIndices = [];
        state.isLocked = false;

        // Check for victory
        if (state.matchedPairs === state.totalPairs) {
          handleWin();
        }
      }, 200);
    } else {
      // MISMATCH
      state.isLocked = true;
      setTimeout(() => {
        window.MemoryAudio?.playMismatch();
        el1?.classList.add('is-mismatch');
        el2?.classList.add('is-mismatch');
      }, 250);

      setTimeout(() => {
        el1?.classList.remove('is-flipped', 'is-mismatch');
        el2?.classList.remove('is-flipped', 'is-mismatch');
        el1?.setAttribute('aria-label', `Card ${idx1 + 1}, hidden`);
        el2?.setAttribute('aria-label', `Card ${idx2 + 1}, hidden`);
        state.flippedIndices = [];
        state.isLocked = false;
      }, 850);
    }
  }

  // 7. Victory Sequence
  function handleWin() {
    state.isWon = true;
    stopTimer();

    window.MemoryAudio?.playWin();
    launchConfetti();

    // Check Star Rating based on par moves
    const config = window.MemoryCards?.DIFFICULTIES[state.difficulty] || { parMoves: 18 };
    const par = config.parMoves;
    let stars = '★★★';
    if (state.moves > par * 1.5) {
      stars = '★☆☆';
    } else if (state.moves > par * 1.15) {
      stars = '★★☆';
    }

    // Check Best Record
    let isNewRecord = false;
    const currentBest = state.bestScores[state.difficulty];
    if (!currentBest || state.moves < currentBest.moves || (state.moves === currentBest.moves && state.seconds < currentBest.time)) {
      state.bestScores[state.difficulty] = {
        moves: state.moves,
        time: state.seconds
      };
      saveBestScores();
      updateBestScoreBadge();
      isNewRecord = true;
    }

    // Populate Win Modal
    if (dom.outcomeTitle) {
      dom.outcomeTitle.textContent = isNewRecord ? 'New Best Record!' : 'Puzzle Completed!';
    }
    if (dom.outcomeSubtitle) {
      dom.outcomeSubtitle.textContent = `Clean sweep across all ${state.totalPairs} pairs on ${config.label}!`;
    }
    if (dom.outcomeStars) {
      dom.outcomeStars.textContent = stars;
    }
    if (dom.outcomeTimeVal) {
      dom.outcomeTimeVal.textContent = formatTime(state.seconds);
    }
    if (dom.outcomeMovesVal) {
      dom.outcomeMovesVal.textContent = state.moves;
    }
    if (dom.outcomeBestVal) {
      const best = state.bestScores[state.difficulty];
      dom.outcomeBestVal.textContent = best ? `${best.moves} moves` : `${state.moves} moves`;
    }

    if (dom.outcomeBanner) {
      dom.outcomeBanner.classList.add('show');
    }
    dom.playAgainBtn?.focus();
  }

  // 8. HUD & Time Formatters
  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateTimerUI() {
    if (dom.timerDisplay) {
      dom.timerDisplay.textContent = formatTime(state.seconds);
    }
  }

  function updateMovesUI() {
    if (dom.movesDisplay) {
      dom.movesDisplay.textContent = `Moves: ${state.moves}`;
    }
  }

  function updatePairsUI() {
    if (dom.pairsDisplay) {
      dom.pairsDisplay.textContent = `Pairs: ${state.matchedPairs} / ${state.totalPairs}`;
    }
  }

  function startTimer() {
    stopTimer();
    state.timerInterval = setInterval(() => {
      state.seconds++;
      updateTimerUI();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  // 9. Particle Confetti Burst
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

    const colors = ['#d5ff55', '#38bdf8', '#ff784f', '#f4f2e9', '#eab308'];
    confettiParticles = [];

    const width = dom.confettiCanvas.width;
    const height = dom.confettiCanvas.height;

    for (let i = 0; i < 75; i++) {
      confettiParticles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 80,
        y: height * 0.4 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 11 - 2,
        size: Math.random() * 7 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 18,
        alpha: 1,
        decay: Math.random() * 0.018 + 0.012
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
      p.vy += 0.38; // gravity
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

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

