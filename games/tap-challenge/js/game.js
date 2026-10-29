/**
 * Tap Challenge — Interactive Game Controller
 * Manages game loop, touch/keyboard input, grid rendering, target spawning,
 * combo streaks, timer countdowns, and win state evaluation.
 */
(function() {
  'use strict';

  // DOM Elements cache
  const dom = {};

  // Game State
  const state = {
    mode: 'reflex', // 'reflex' | 'sprint' | 'frenzy'
    status: 'ready', // 'ready' | 'playing' | 'paused' | 'cleared'
    score: 0,
    moves: 0, // total taps
    mistakes: 0,
    comboStreak: 0,
    maxCombo: 0,
    timeRemaining: 30, // seconds for reflex & frenzy
    elapsedTime: 0, // seconds for sprint
    timerInterval: null,
    targetSpawnTimer: null,
    activeTargets: {}, // cellIndex -> { type, expireAt, timerId }
    expectedNumber: 1, // for sprint
    sprintBoard: [],
    bestScores: {
      reflex: 0,
      sprint: 999, // lowest seconds is best
      frenzy: 0
    }
  };

  // Keyboard mapping for 3x3 grid
  // Rows top-to-bottom: [0,1,2], [3,4,5], [6,7,8]
  const KEY_TO_INDEX_3X3 = {
    'q': 0, 'w': 1, 'e': 2,
    'a': 3, 's': 4, 'd': 5,
    'z': 6, 'x': 7, 'c': 8,
    '7': 0, '8': 1, '9': 2,
    '4': 3, '5': 4, '6': 5,
    '1': 6, '2': 7, '3': 8
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    loadBestScores();
    bindEvents();
    switchMode('reflex');
  }

  function cacheDom() {
    dom.tapBoard = document.getElementById('tap-board');
    dom.scoreDisplay = document.getElementById('score-display');
    dom.timerDisplay = document.getElementById('timer-display');
    dom.movesDisplay = document.getElementById('moves-display');
    dom.comboDisplay = document.getElementById('combo-display');
    dom.bestDisplay = document.getElementById('best-display');
    dom.targetCue = document.getElementById('target-cue');

    dom.modeReflexBtn = document.getElementById('mode-reflex-btn');
    dom.modeSprintBtn = document.getElementById('mode-sprint-btn');
    dom.modeFrenzyBtn = document.getElementById('mode-frenzy-btn');

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

    dom.winTitle = document.getElementById('win-title');
    dom.winScoreVal = document.getElementById('win-score-val');
    dom.winRateVal = document.getElementById('win-rate-val');
    dom.winStarsVal = document.getElementById('win-stars-val');
    dom.winSummary = document.getElementById('win-summary');
    dom.srAnnouncer = document.getElementById('sr-announcer');
  }

  function loadBestScores() {
    try {
      state.bestScores.reflex = parseInt(localStorage.getItem('arcade_tapchallenge_best_reflex') || '0', 10);
      state.bestScores.sprint = parseFloat(localStorage.getItem('arcade_tapchallenge_best_sprint') || '999');
      state.bestScores.frenzy = parseFloat(localStorage.getItem('arcade_tapchallenge_best_frenzy') || '0');
    } catch (e) {}
    updateBestDisplay();
  }

  function saveBestScore() {
    try {
      if (state.mode === 'reflex' && state.score > state.bestScores.reflex) {
        state.bestScores.reflex = state.score;
        localStorage.setItem('arcade_tapchallenge_best_reflex', state.score.toString());
      } else if (state.mode === 'sprint' && state.elapsedTime < state.bestScores.sprint) {
        state.bestScores.sprint = Math.round(state.elapsedTime * 10) / 10;
        localStorage.setItem('arcade_tapchallenge_best_sprint', state.bestScores.sprint.toString());
      } else if (state.mode === 'frenzy') {
        const rate = window.TapEngine ? window.TapEngine.calculateCPS(state.moves, 10) : (state.moves / 10);
        if (rate > state.bestScores.frenzy) {
          state.bestScores.frenzy = rate;
          localStorage.setItem('arcade_tapchallenge_best_frenzy', rate.toString());
        }
      }
    } catch (e) {}
    updateBestDisplay();
  }

  function updateBestDisplay() {
    if (!dom.bestDisplay) return;
    if (state.mode === 'reflex') {
      dom.bestDisplay.textContent = state.bestScores.reflex > 0 ? `${state.bestScores.reflex} pts` : '—';
    } else if (state.mode === 'sprint') {
      dom.bestDisplay.textContent = state.bestScores.sprint < 900 ? `${state.bestScores.sprint}s` : '—';
    } else if (state.mode === 'frenzy') {
      dom.bestDisplay.textContent = state.bestScores.frenzy > 0 ? `${state.bestScores.frenzy} CPS` : '—';
    }
  }

  function bindEvents() {
    // Mode selectors
    if (dom.modeReflexBtn) dom.modeReflexBtn.addEventListener('click', () => switchMode('reflex'));
    if (dom.modeSprintBtn) dom.modeSprintBtn.addEventListener('click', () => switchMode('sprint'));
    if (dom.modeFrenzyBtn) dom.modeFrenzyBtn.addEventListener('click', () => switchMode('frenzy'));

    // Audio & Pause controls
    if (dom.audioToggleBtn) dom.audioToggleBtn.addEventListener('click', handleAudioToggle);
    if (dom.pauseBtn) dom.pauseBtn.addEventListener('click', togglePause);

    // Overlay action buttons
    if (dom.startBtn) dom.startBtn.addEventListener('click', startGame);
    if (dom.resumeBtn) dom.resumeBtn.addEventListener('click', resumeGame);
    if (dom.restartBtn) dom.restartBtn.addEventListener('click', restartGame);
    if (dom.playAgainBtn) dom.playAgainBtn.addEventListener('click', restartGame);

    // Global keyboard listener
    window.addEventListener('keydown', handleKeyDown);

    // Sync initial audio icon
    updateAudioIcon();
  }

  function switchMode(newMode) {
    if (state.status === 'playing') {
      stopAllTimers();
    }
    state.mode = newMode;

    // Update tab styles
    [dom.modeReflexBtn, dom.modeSprintBtn, dom.modeFrenzyBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    if (newMode === 'reflex' && dom.modeReflexBtn) {
      dom.modeReflexBtn.classList.add('active');
      dom.modeReflexBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'sprint' && dom.modeSprintBtn) {
      dom.modeSprintBtn.classList.add('active');
      dom.modeSprintBtn.setAttribute('aria-selected', 'true');
    } else if (newMode === 'frenzy' && dom.modeFrenzyBtn) {
      dom.modeFrenzyBtn.classList.add('active');
      dom.modeFrenzyBtn.setAttribute('aria-selected', 'true');
    }

    updateBestDisplay();
    prepareBoard();
  }

  function prepareBoard() {
    stopAllTimers();
    clearActiveTargets();
    state.status = 'ready';
    state.score = 0;
    state.moves = 0;
    state.mistakes = 0;
    state.comboStreak = 0;
    state.maxCombo = 0;
    state.elapsedTime = 0;
    state.expectedNumber = 1;

    const Engine = window.TapEngine;
    const modeConfig = Engine?.MODES[state.mode] || { gridSize: 3, totalCells: 9 };

    if (state.mode === 'reflex') {
      state.timeRemaining = modeConfig.duration || 30;
    } else if (state.mode === 'frenzy') {
      state.timeRemaining = modeConfig.duration || 10;
    } else if (state.mode === 'sprint') {
      state.sprintBoard = Engine ? Engine.generateSprintBoard(modeConfig.totalCells) : [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
    }

    updateHUD();
    renderBoard();
    showStartOverlay();
  }

  function renderBoard() {
    if (!dom.tapBoard) return;
    dom.tapBoard.innerHTML = '';

    const Engine = window.TapEngine;
    const modeConfig = Engine?.MODES[state.mode] || { gridSize: 3, totalCells: 9 };
    const gridSize = modeConfig.gridSize;
    const totalCells = modeConfig.totalCells;

    dom.tapBoard.className = `tap-board grid-${gridSize}`;

    for (let i = 0; i < totalCells; i++) {
      const pad = document.createElement('button');
      pad.className = 'tap-pad';
      pad.type = 'button';
      pad.dataset.index = i;
      pad.setAttribute('role', 'gridcell');

      if (state.mode === 'sprint') {
        const val = state.sprintBoard[i];
        pad.dataset.value = val;
        pad.innerHTML = `<span class="pad-number">${val}</span>`;
        pad.setAttribute('aria-label', `Number ${val}`);
      } else {
        pad.innerHTML = `<span class="pad-icon"></span><span class="pad-key-hint">${getPadKeyHint(i, gridSize)}</span>`;
        pad.setAttribute('aria-label', `Target Pad ${i + 1}`);
      }

      // Add zero-latency pointer / touch listeners
      pad.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handlePadTap(i, pad);
      });

      dom.tapBoard.appendChild(pad);
    }
  }

  function getPadKeyHint(idx, size) {
    if (size === 3) {
      const hints = ['Q', 'W', 'E', 'A', 'S', 'D', 'Z', 'X', 'C'];
      return hints[idx] || '';
    }
    return '';
  }

  function startGame() {
    hideOverlays();
    state.status = 'playing';
    state.score = 0;
    state.moves = 0;
    state.mistakes = 0;
    state.comboStreak = 0;
    state.maxCombo = 0;
    state.elapsedTime = 0;

    const Engine = window.TapEngine;
    const modeConfig = Engine?.MODES[state.mode] || {};

    if (window.TapAudio) {
      window.TapAudio.playCountdown(true);
    }

    if (state.mode === 'reflex') {
      state.timeRemaining = modeConfig.duration || 30;
      startReflexLoop();
    } else if (state.mode === 'sprint') {
      state.expectedNumber = 1;
      startSprintLoop();
    } else if (state.mode === 'frenzy') {
      state.timeRemaining = modeConfig.duration || 10;
      startFrenzyLoop();
    }

    updateHUD();
    announceSR(`${modeConfig.name || state.mode} started! Tap now!`);
  }

  function startReflexLoop() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.status !== 'playing') return;
      state.timeRemaining -= 0.1;

      if (state.timeRemaining <= 0) {
        state.timeRemaining = 0;
        updateHUD();
        endGame(true);
        return;
      }
      updateHUD();
    }, 100);

    // Spawn first target immediately
    spawnReflexTarget();
    scheduleNextTarget();
  }

  function scheduleNextTarget() {
    if (state.status !== 'playing') return;
    clearTimeout(state.targetSpawnTimer);

    // Target spawn rate increases as score rises
    const baseDelay = Math.max(450, 900 - Math.floor(state.score / 20));
    state.targetSpawnTimer = setTimeout(() => {
      if (state.status === 'playing') {
        spawnReflexTarget();
        scheduleNextTarget();
      }
    }, baseDelay);
  }

  function spawnReflexTarget() {
    const Engine = window.TapEngine;
    const modeConfig = Engine?.MODES.reflex || { totalCells: 9 };
    const totalCells = modeConfig.totalCells;

    // Find available cells not currently active
    const available = [];
    for (let i = 0; i < totalCells; i++) {
      if (!state.activeTargets[i]) available.push(i);
    }
    if (available.length === 0) return;

    const cellIdx = available[Math.floor(Math.random() * available.length)];
    const targetType = Engine ? Engine.rollTargetType() : Engine.TARGET_TYPES.normal;

    const pad = dom.tapBoard?.querySelector(`[data-index="${cellIdx}"]`);
    if (!pad) return;

    // Apply target styles
    pad.className = `tap-pad active-target target-${targetType.type}`;
    const iconEl = pad.querySelector('.pad-icon');
    if (iconEl) iconEl.textContent = targetType.icon;

    // Dynamic duration based on score
    const targetDuration = Math.max(650, 1300 - Math.floor(state.score / 15));

    const expireTimer = setTimeout(() => {
      expireTarget(cellIdx);
    }, targetDuration);

    state.activeTargets[cellIdx] = {
      type: targetType,
      timer: expireTimer,
      duration: targetDuration
    };
  }

  function expireTarget(cellIdx) {
    const target = state.activeTargets[cellIdx];
    if (!target) return;

    delete state.activeTargets[cellIdx];
    const pad = dom.tapBoard?.querySelector(`[data-index="${cellIdx}"]`);
    if (pad) {
      pad.className = 'tap-pad';
      const iconEl = pad.querySelector('.pad-icon');
      if (iconEl) iconEl.textContent = '';
    }

    // If a normal or bonus target expired without being hit, break combo streak!
    if (!target.type.isHazard && state.status === 'playing') {
      if (state.comboStreak > 2 && window.TapAudio) {
        window.TapAudio.playMiss();
      }
      state.comboStreak = 0;
      updateHUD();
    }
  }

  function clearActiveTargets() {
    clearTimeout(state.targetSpawnTimer);
    Object.keys(state.activeTargets).forEach(idx => {
      clearTimeout(state.activeTargets[idx].timer);
    });
    state.activeTargets = {};
  }

  function startSprintLoop() {
    clearInterval(state.timerInterval);
    const startTime = Date.now();
    state.timerInterval = setInterval(() => {
      if (state.status !== 'playing') return;
      state.elapsedTime = (Date.now() - startTime) / 1000;
      updateHUD();
    }, 50);
  }

  function startFrenzyLoop() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      if (state.status !== 'playing') return;
      state.timeRemaining -= 0.1;

      if (state.timeRemaining <= 0) {
        state.timeRemaining = 0;
        updateHUD();
        endGame(true);
        return;
      }
      updateHUD();
    }, 100);
  }

  function handlePadTap(cellIdx, pad) {
    if (state.status !== 'playing') return;

    state.moves++;
    createRipple(pad);

    if (state.mode === 'reflex') {
      handleReflexTap(cellIdx, pad);
    } else if (state.mode === 'sprint') {
      handleSprintTap(cellIdx, pad);
    } else if (state.mode === 'frenzy') {
      handleFrenzyTap(cellIdx, pad);
    }

    updateHUD();
  }

  function handleReflexTap(cellIdx, pad) {
    const Engine = window.TapEngine;
    const target = state.activeTargets[cellIdx];

    if (!target) {
      // Tapped an empty pad — small penalty or miss
      if (window.TapAudio) window.TapAudio.playTap();
      state.comboStreak = 0;
      return;
    }

    clearTimeout(target.timer);
    delete state.activeTargets[cellIdx];

    const type = target.type;
    if (type.isHazard) {
      // Hit a Glitch Mine!
      if (window.TapAudio) window.TapAudio.playHazard();
      state.score = Math.max(0, state.score + type.points);
      state.timeRemaining = Math.max(0, state.timeRemaining + type.timeBonus);
      state.comboStreak = 0;
      pad.className = 'tap-pad pad-hazard-hit';
      triggerScreenShake();
      setTimeout(() => { if (pad) pad.className = 'tap-pad'; }, 250);
      return;
    }

    // Hit a valid target!
    state.comboStreak++;
    if (state.comboStreak > state.maxCombo) state.maxCombo = state.comboStreak;

    const mult = Engine ? Engine.calculateComboMultiplier(state.comboStreak) : 1;
    const earned = type.points * mult;
    state.score += earned;
    state.timeRemaining = Math.min(45, state.timeRemaining + type.timeBonus);

    // Audio & Visual feedback
    if (window.TapAudio) {
      window.TapAudio.playTargetHit(type.type);
      if (state.comboStreak >= 3 && state.comboStreak % 3 === 0) {
        window.TapAudio.playCombo(mult);
      }
    }

    pad.className = 'tap-pad pad-hit-success';
    const iconEl = pad.querySelector('.pad-icon');
    if (iconEl) iconEl.textContent = `+${earned}`;

    setTimeout(() => {
      if (pad && !state.activeTargets[cellIdx]) {
        pad.className = 'tap-pad';
        if (iconEl) iconEl.textContent = '';
      }
    }, 200);

    // Check immediate replacement
    if (Math.random() < 0.4) {
      spawnReflexTarget();
    }
  }

  function handleSprintTap(cellIdx, pad) {
    const Engine = window.TapEngine;
    const val = parseInt(pad.dataset.value, 10);
    const validation = Engine ? Engine.validateSprintTap(state.expectedNumber, val) : { isCorrect: val === state.expectedNumber };

    if (validation.isCorrect) {
      // Correct number in sequence!
      if (window.TapAudio) window.TapAudio.playTargetHit('normal');
      pad.classList.add('sprint-solved');
      pad.setAttribute('disabled', 'true');
      state.expectedNumber++;

      if (state.expectedNumber > 16) {
        // Solved the entire 1..16 sequence!
        endGame(true);
      }
    } else {
      // Wrong number tapped!
      state.mistakes++;
      if (window.TapAudio) window.TapAudio.playMiss();
      pad.classList.add('sprint-wrong');
      triggerScreenShake();
      setTimeout(() => {
        if (pad) pad.classList.remove('sprint-wrong');
      }, 300);
    }
  }

  function handleFrenzyTap(cellIdx, pad) {
    if (window.TapAudio) window.TapAudio.playTap();
    state.score = state.moves * 50;

    // Visual bump on pad
    pad.classList.add('frenzy-tap-glow');
    setTimeout(() => {
      if (pad) pad.classList.remove('frenzy-tap-glow');
    }, 120);
  }

  function createRipple(pad) {
    const ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    pad.appendChild(ripple);
    setTimeout(() => ripple.remove(), 400);
  }

  function triggerScreenShake() {
    const card = document.getElementById('tap-stage-card');
    if (card) {
      card.classList.add('shake-active');
      setTimeout(() => card.classList.remove('shake-active'), 300);
    }
  }

  function updateHUD() {
    const Engine = window.TapEngine;

    // Timer display
    if (dom.timerDisplay) {
      if (state.mode === 'sprint') {
        dom.timerDisplay.textContent = state.elapsedTime.toFixed(1) + 's';
      } else {
        dom.timerDisplay.textContent = Math.max(0, state.timeRemaining).toFixed(1) + 's';
      }
    }

    // Moves display
    if (dom.movesDisplay) {
      if (state.mode === 'sprint') {
        const accuracy = state.moves > 0 ? Math.round(((state.expectedNumber - 1) / state.moves) * 100) : 100;
        dom.movesDisplay.textContent = `Taps: ${state.moves} (${accuracy}%)`;
      } else if (state.mode === 'frenzy') {
        const cps = Engine ? Engine.calculateCPS(state.moves, 10 - state.timeRemaining) : 0;
        dom.movesDisplay.textContent = `Taps: ${state.moves} (${cps} CPS)`;
      } else {
        dom.movesDisplay.textContent = `Taps: ${state.moves}`;
      }
    }

    // Score display
    if (dom.scoreDisplay) {
      dom.scoreDisplay.textContent = `Score: ${state.score}`;
    }

    // Combo / Cue display
    if (dom.comboDisplay) {
      if (state.mode === 'reflex') {
        const mult = Engine ? Engine.calculateComboMultiplier(state.comboStreak) : 1;
        dom.comboDisplay.textContent = state.comboStreak > 1 ? `${state.comboStreak}x Streak (${mult}x)` : 'Streak: 0';
        dom.comboDisplay.className = `hud-pill ${mult > 1 ? 'highlight-lime' : ''}`;
      } else if (state.mode === 'sprint') {
        dom.comboDisplay.textContent = `Target: [ ${Math.min(16, state.expectedNumber)} ]`;
        dom.comboDisplay.className = 'hud-pill highlight-cyan';
      } else {
        const cps = Engine ? Engine.calculateCPS(state.moves, 10 - state.timeRemaining) : 0;
        dom.comboDisplay.textContent = `${cps} CPS`;
        dom.comboDisplay.className = 'hud-pill highlight-gold';
      }
    }
  }

  function endGame(isVictory = true) {
    stopAllTimers();
    clearActiveTargets();
    state.status = 'cleared';
    saveBestScore();

    if (window.TapAudio) {
      window.TapAudio.playWin();
    }

    const Engine = window.TapEngine;
    let stars = 3;
    let summaryText = '';
    let rateText = '';

    if (state.mode === 'reflex') {
      stars = Engine ? Engine.calculateReflexStars(state.score) : 2;
      summaryText = `Achieved a max combo of ${state.maxCombo} with ${state.moves} total taps!`;
      rateText = `${state.score} pts`;
      if (dom.winTitle) dom.winTitle.textContent = 'Reflex Rush Cleared!';
    } else if (state.mode === 'sprint') {
      stars = Engine ? Engine.calculateSprintStars(state.elapsedTime, state.mistakes) : 2;
      summaryText = `Cleared 1 to 16 in ${state.elapsedTime.toFixed(2)} seconds with ${state.mistakes} errors!`;
      rateText = `${state.elapsedTime.toFixed(1)}s`;
      if (dom.winTitle) dom.winTitle.textContent = 'Number Sprint Completed!';
    } else if (state.mode === 'frenzy') {
      const cps = Engine ? Engine.calculateCPS(state.moves, 10) : (state.moves / 10);
      const tierInfo = Engine ? Engine.calculateFrenzyTier(cps) : { tier: 'Speed Tapper', stars: 2 };
      stars = tierInfo.stars;
      summaryText = `Speed Tier: ${tierInfo.tier}! Registered ${state.moves} total taps in 10s.`;
      rateText = `${cps} CPS`;
      if (dom.winTitle) dom.winTitle.textContent = 'Frenzy Test Finished!';
    }

    if (dom.winScoreVal) dom.winScoreVal.textContent = state.score.toString();
    if (dom.winRateVal) dom.winRateVal.textContent = rateText;
    if (dom.winStarsVal) dom.winStarsVal.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    if (dom.winSummary) dom.winSummary.textContent = summaryText;

    showOverlay(dom.overlayWin);
    announceSR(`Game complete! ${summaryText} Rating: ${stars} stars.`);
  }

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();

    // Universal controls
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

    // Spacebar support for CPS Frenzy or overlay resume
    if (key === ' ') {
      if (state.status === 'ready') {
        e.preventDefault();
        startGame();
        return;
      }
      if (state.status === 'playing' && state.mode === 'frenzy') {
        e.preventDefault();
        const centerPad = dom.tapBoard?.children[4] || dom.tapBoard?.children[0];
        if (centerPad) handlePadTap(4, centerPad);
        return;
      }
    }

    // 3x3 Grid keyboard mapping
    if (state.status === 'playing' && (state.mode === 'reflex' || state.mode === 'frenzy')) {
      if (KEY_TO_INDEX_3X3.hasOwnProperty(key)) {
        e.preventDefault();
        const padIdx = KEY_TO_INDEX_3X3[key];
        const pad = dom.tapBoard?.querySelector(`[data-index="${padIdx}"]`);
        if (pad) handlePadTap(padIdx, pad);
      }
    }
  }

  function togglePause() {
    if (state.status === 'playing') {
      state.status = 'paused';
      clearInterval(state.timerInterval);
      clearTimeout(state.targetSpawnTimer);
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

    if (state.mode === 'reflex') {
      startReflexLoop();
    } else if (state.mode === 'sprint') {
      startSprintLoop();
    } else if (state.mode === 'frenzy') {
      startFrenzyLoop();
    }
    announceSR('Game resumed.');
  }

  function restartGame() {
    prepareBoard();
    startGame();
  }

  function stopAllTimers() {
    clearInterval(state.timerInterval);
    clearTimeout(state.targetSpawnTimer);
    state.timerInterval = null;
    state.targetSpawnTimer = null;
  }

  function handleAudioToggle() {
    if (window.TapAudio) {
      window.TapAudio.toggleMute();
      updateAudioIcon();
    }
  }

  function updateAudioIcon() {
    if (!dom.audioIcon) return;
    const isMuted = window.TapAudio ? window.TapAudio.isMuted() : false;
    dom.audioIcon.textContent = isMuted ? '🔇' : '🔊';
  }

  function showStartOverlay() {
    hideOverlays();
    if (dom.overlayStart) {
      dom.overlayStart.classList.add('show');
      const descEl = dom.overlayStart.querySelector('.overlay-subtitle');
      if (descEl) {
        if (state.mode === 'reflex') {
          descEl.textContent = 'Tap illuminated neon nodes before they fade! Hit speed orbs for time bonuses, chain multipliers, and avoid red glitch mines.';
        } else if (state.mode === 'sprint') {
          descEl.textContent = 'Tap numbers in sequential order from 1 to 16 as fast as your fingers can move! Avoid wrong numbers to keep your accuracy high.';
        } else {
          descEl.textContent = 'Tap the pads or press Spacebar as rapidly as possible for 10 seconds to test your maximum Clicks Per Second (CPS) speed!';
        }
      }
    }
  }

  function showOverlay(overlay) {
    hideOverlays();
    if (overlay) overlay.classList.add('show');
  }

  function hideOverlays() {
    [dom.overlayStart, dom.overlayPause, dom.overlayWin].forEach(o => {
      if (o) o.classList.remove('show');
    });
  }

  function announceSR(msg) {
    if (dom.srAnnouncer) {
      dom.srAnnouncer.textContent = msg;
    }
  }

})();
