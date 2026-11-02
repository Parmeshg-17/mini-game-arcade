/**
 * Screw Master — Main Game Controller & UI Orchestration
 * Handles user touch/mouse input, smooth mechanical unscrewing animations,
 * physical panel releases, multi-step undo, solver hints, and progress persistence.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'minigame_screwmaster_save_v1';

  // State object
  const state = {
    levelNumber: 1,
    gameMode: 'classic', // 'classic', 'daily', 'time', 'relax'
    engineState: null,
    history: [],
    selectedScrewId: null,
    isAnimating: false,
    isPaused: false,
    extraSlotUsed: false,
    movesCount: 0,
    startTime: 0,
    elapsedSeconds: 0,
    timeRemaining: 60, // for Time Challenge
    timerInterval: null,
    storage: {
      maxUnlockedLevel: 1,
      levelStars: {},
      levelMoves: {},
      xp: 0,
      dailyCompleted: {},
      dailyStreak: 0,
      soundEnabled: true
    }
  };

  /* ── LocalStorage Management ───────────────────────────── */
  function loadStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        state.storage = Object.assign(state.storage, parsed);
      }
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
  }

  function saveStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.storage));
    } catch (e) {
      console.warn('Could not save to storage', e);
    }
  }

  /* ── DOM Element References ────────────────────────────── */
  let stageEl = null;
  let levelTitleEl = null;
  let levelTierEl = null;
  let movesCountEl = null;
  let timerDisplayEl = null;
  let bestMovesEl = null;
  let toastEl = null;
  let btnUndo = null;
  let btnRestart = null;
  let btnHint = null;
  let btnAddSlot = null;
  let btnSound = null;
  let btnLevels = null;
  let winModal = null;
  let levelModal = null;

  /* ── Initialization ────────────────────────────────────── */
  function init() {
    loadStorage();

    stageEl = document.getElementById('mechanical-stage');
    levelTitleEl = document.getElementById('level-title');
    levelTierEl = document.getElementById('level-tier');
    movesCountEl = document.getElementById('moves-count');
    timerDisplayEl = document.getElementById('timer-display');
    bestMovesEl = document.getElementById('best-moves');
    toastEl = document.getElementById('game-toast');
    btnUndo = document.getElementById('btn-undo');
    btnRestart = document.getElementById('btn-restart');
    btnHint = document.getElementById('btn-hint');
    btnAddSlot = document.getElementById('btn-add-slot');
    btnSound = document.getElementById('btn-sound');
    btnLevels = document.getElementById('btn-levels');
    winModal = document.getElementById('win-modal');
    levelModal = document.getElementById('level-modal');

    setupEventListeners();
    updateSoundButton();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    const lvlParam = parseInt(urlParams.get('level'), 10);

    if (modeParam === 'daily') {
      setMode('daily');
    } else if (modeParam === 'time') {
      setMode('time');
    } else if (modeParam === 'relax') {
      setMode('relax');
    } else if (!isNaN(lvlParam) && lvlParam >= 1) {
      loadLevel(lvlParam);
    } else {
      loadLevel(state.storage.maxUnlockedLevel || 1);
    }
  }

  /* ── Event Listeners ───────────────────────────────────── */
  function setupEventListeners() {
    if (btnUndo) btnUndo.addEventListener('click', handleUndo);
    if (btnRestart) btnRestart.addEventListener('click', handleRestart);
    if (btnHint) btnHint.addEventListener('click', handleHint);
    if (btnAddSlot) btnAddSlot.addEventListener('click', handleAddExtraSlot);
    if (btnSound) btnSound.addEventListener('click', handleToggleSound);
    if (btnLevels) btnLevels.addEventListener('click', openLevelSelectModal);

    const btnNextLevel = document.getElementById('btn-next-level');
    if (btnNextLevel) btnNextLevel.addEventListener('click', () => {
      closeModal(winModal);
      if (state.gameMode === 'daily') {
        loadLevel(state.levelNumber);
      } else {
        loadLevel(state.levelNumber + 1);
      }
    });

    const btnReplayLevel = document.getElementById('btn-replay-level');
    if (btnReplayLevel) btnReplayLevel.addEventListener('click', () => {
      closeModal(winModal);
      handleRestart();
    });

    // Mode tab buttons
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode) setMode(mode);
      });
    });

    // Close modals
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) closeModal(overlay);
      });
    });

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        if (item) item.classList.toggle('active');
      });
    });

    // Keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'u' || e.key === 'U') handleUndo();
      if (e.key === 'r' || e.key === 'R') handleRestart();
      if (e.key === 'h' || e.key === 'H') handleHint();
      if (e.key === 'm' || e.key === 'M') handleToggleSound();
    });
  }

  /* ── Mode Switching ────────────────────────────────────── */
  function setMode(mode) {
    state.gameMode = mode;
    document.querySelectorAll('.mode-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    if (mode === 'daily') {
      startDailyChallenge();
    } else {
      loadLevel(state.levelNumber);
    }
  }

  /* ── Sound Toggle ──────────────────────────────────────── */
  function updateSoundButton() {
    if (!btnSound) return;
    const isMuted = typeof ScrewMasterAudio !== 'undefined' ? ScrewMasterAudio.getMuted() : false;
    btnSound.innerHTML = isMuted
      ? `<svg viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Unmute`
      : `<svg viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Sound`;
  }

  function handleToggleSound() {
    if (typeof ScrewMasterAudio === 'undefined') return;
    const currentlyMuted = ScrewMasterAudio.getMuted();
    ScrewMasterAudio.setMuted(!currentlyMuted);
    updateSoundButton();
  }

  /* ── Timer Management ──────────────────────────────────── */
  function startTimer() {
    clearInterval(state.timerInterval);
    state.startTime = Date.now();
    state.elapsedSeconds = 0;
    state.timeRemaining = state.gameMode === 'time' ? 75 : 0;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      if (state.isPaused) return;

      if (state.gameMode === 'time') {
        state.timeRemaining--;
        updateTimerDisplay();
        if (state.timeRemaining <= 0) {
          clearInterval(state.timerInterval);
          showToast('Time Expired! Tap Restart to try again.');
          if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playInvalid();
        }
      } else {
        state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
        updateTimerDisplay();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
  }

  function updateTimerDisplay() {
    if (!timerDisplayEl) return;
    if (state.gameMode === 'relax') {
      timerDisplayEl.textContent = 'Zen';
      return;
    }
    const val = state.gameMode === 'time' ? state.timeRemaining : state.elapsedSeconds;
    const mins = Math.floor(Math.max(0, val) / 60);
    const secs = Math.max(0, val) % 60;
    timerDisplayEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /* ── Toast Notifications ───────────────────────────────── */
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2200);
  }

  /* ── Level Management ──────────────────────────────────── */
  function loadLevel(levelNum) {
    state.levelNumber = levelNum;
    state.selectedScrewId = null;
    state.isAnimating = false;
    state.isPaused = false;
    state.extraSlotUsed = false;
    state.history = [];
    state.movesCount = 0;

    // Generate guaranteed-solvable level from engine
    const rawState = ScrewMasterEngine.generateLevel(levelNum);
    state.engineState = ScrewMasterEngine.cloneState(rawState);

    // Update HUD
    if (levelTitleEl) levelTitleEl.textContent = `Level ${levelNum}`;
    if (levelTierEl) levelTierEl.textContent = state.engineState.tier;
    if (movesCountEl) movesCountEl.textContent = '0';
    if (bestMovesEl) {
      const best = state.storage.levelMoves[levelNum];
      bestMovesEl.textContent = best ? `${best} moves` : `Par: ${state.engineState.minMoves || 5}`;
    }

    if (btnAddSlot) {
      btnAddSlot.disabled = false;
      const tag = btnAddSlot.querySelector('.badge-tag');
      if (tag) tag.textContent = '+1';
    }

    renderBoard();
    updateControls();
    startTimer();
  }

  function startDailyChallenge() {
    state.selectedScrewId = null;
    state.isAnimating = false;
    state.isPaused = false;
    state.extraSlotUsed = false;
    state.history = [];
    state.movesCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const rawState = ScrewMasterEngine.getDailyLevel(todayStr);
    state.engineState = ScrewMasterEngine.cloneState(rawState);

    if (levelTitleEl) levelTitleEl.textContent = 'Daily Challenge';
    if (levelTierEl) levelTierEl.textContent = todayStr;
    if (movesCountEl) movesCountEl.textContent = '0';
    if (bestMovesEl) bestMovesEl.textContent = 'Daily';

    if (btnAddSlot) {
      btnAddSlot.disabled = false;
      const tag = btnAddSlot.querySelector('.badge-tag');
      if (tag) tag.textContent = '+1';
    }

    renderBoard();
    updateControls();
    startTimer();
  }

  /* ── Board Rendering ───────────────────────────────────── */
  function renderBoard() {
    if (!stageEl || !state.engineState) return;
    stageEl.innerHTML = '';

    const engine = state.engineState;

    // 1. Storage Tray Container
    const trayEl = document.createElement('div');
    trayEl.className = 'storage-tray-recess';
    const trayLabel = document.createElement('span');
    trayLabel.className = 'tray-label';
    trayLabel.textContent = 'Screw Storage Tray';
    trayEl.appendChild(trayLabel);
    stageEl.appendChild(trayEl);

    // 2. Render Holes
    engine.holes.forEach(hole => {
      const hEl = document.createElement('div');
      hEl.className = `board-hole ${hole.type === 'tray' ? 'tray-hole' : ''}`;
      hEl.dataset.holeId = hole.id;
      hEl.style.left = `${hole.x}px`;
      hEl.style.top = `${hole.y}px`;

      // Check if this hole should show as an available target
      if (state.selectedScrewId && ScrewMasterEngine.isHoleAvailable(engine, hole.id)) {
        hEl.classList.add('available-target');
      }

      hEl.addEventListener('click', () => handleHoleClick(hole.id));
      stageEl.appendChild(hEl);
    });

    // 3. Render Panels (layered by depth)
    const sortedPanels = engine.panels.slice().sort((a, b) => a.layer - b.layer);
    sortedPanels.forEach(panel => {
      const pEl = document.createElement('div');
      pEl.className = `puzzle-panel panel-${panel.material}`;
      pEl.dataset.panelId = panel.id;
      pEl.style.left = `${panel.x}px`;
      pEl.style.top = `${panel.y}px`;
      pEl.style.width = `${panel.width}px`;
      pEl.style.height = `${panel.height}px`;
      pEl.style.zIndex = panel.layer * 10;

      if (panel.rotation) {
        pEl.style.transform = `rotate(${panel.rotation}deg)`;
      }

      if (panel.status === 'released') {
        pEl.classList.add('released');
      }

      stageEl.appendChild(pEl);
    });

    // 4. Render Screws
    engine.screws.forEach(screw => {
      const hole = engine.holes.find(h => h.id === screw.holeId);
      if (!hole) return;

      const sEl = document.createElement('div');
      sEl.className = `screw-element style-${screw.style || 'steel'}`;
      sEl.dataset.screwId = screw.id;
      sEl.style.left = `${hole.x}px`;
      sEl.style.top = `${hole.y}px`;

      // Higher z-index than panels so screws are on top of their respective panel
      sEl.style.zIndex = 40 + (hole.type === 'tray' ? 20 : 0);

      if (state.selectedScrewId === screw.id) {
        sEl.classList.add('selected');
      }

      // Phillips cross-head (+) groove
      const cross = document.createElement('div');
      cross.className = 'screw-cross';
      sEl.appendChild(cross);

      sEl.addEventListener('click', (e) => {
        e.stopPropagation();
        handleScrewClick(screw.id);
      });

      stageEl.appendChild(sEl);
    });
  }

  /* ── Interaction Handling ──────────────────────────────── */
  function handleScrewClick(screwId) {
    if (state.isAnimating || state.isPaused) return;

    clearHints();

    const engine = state.engineState;
    const isAccessible = ScrewMasterEngine.isScrewAccessible(engine, screwId);

    // If screw is blocked by an overlying panel
    if (!isAccessible) {
      shakeScrew(screwId);
      showToast('Blocked! Remove the overlapping panel first.');
      if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playInvalid();
      return;
    }

    // Toggle selection
    if (state.selectedScrewId === screwId) {
      state.selectedScrewId = null;
    } else {
      state.selectedScrewId = screwId;
      if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playSelect();
    }

    renderBoard();
  }

  function handleHoleClick(holeId) {
    if (state.isAnimating || state.isPaused || !state.selectedScrewId) return;

    clearHints();

    const engine = state.engineState;
    const screwId = state.selectedScrewId;

    if (!ScrewMasterEngine.isHoleAvailable(engine, holeId)) {
      showToast('Hole is not available!');
      if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playInvalid();
      return;
    }

    // Execute move
    executeAnimatedMove(screwId, holeId);
  }

  function shakeScrew(screwId) {
    const sEl = stageEl.querySelector(`[data-screw-id="${screwId}"]`);
    if (!sEl) return;
    sEl.classList.add('shake');
    setTimeout(() => {
      sEl.classList.remove('shake');
    }, 400);
  }

  /* ── Animated Screw Movement ────────────────────────────── */
  function executeAnimatedMove(screwId, targetHoleId) {
    state.isAnimating = true;

    // Snapshot state for Undo
    state.history.push(ScrewMasterEngine.cloneState(state.engineState));

    const engine = state.engineState;
    const fromHole = engine.holes.find(h => h.id === (engine.screws.find(s => s.id === screwId)?.holeId));
    const targetHole = engine.holes.find(h => h.id === targetHoleId);
    const sEl = stageEl.querySelector(`[data-screw-id="${screwId}"]`);

    if (!sEl || !fromHole || !targetHole) {
      const res = ScrewMasterEngine.executeMove(engine, screwId, targetHoleId);
      state.selectedScrewId = null;
      state.isAnimating = false;
      renderBoard();
      return;
    }

    // Audio: unscrewing ratchet
    if (typeof ScrewMasterAudio !== 'undefined') {
      ScrewMasterAudio.playUnscrew();
    }

    // Step 1: Unscrew rotation & lift
    sEl.style.transition = 'transform 0.22s ease-out';
    sEl.style.transform = 'translate(-50%, -90%) scale(1.25) rotate(720deg)';

    // Step 2: Fly to destination hole coordinates
    setTimeout(() => {
      const dx = targetHole.x - fromHole.x;
      const dy = targetHole.y - fromHole.y;

      sEl.style.transition = 'all 0.28s cubic-bezier(0.25, 1, 0.5, 1)';
      sEl.style.left = `${targetHole.x}px`;
      sEl.style.top = `${targetHole.y}px`;
      sEl.style.transform = 'translate(-50%, -50%) scale(1) rotate(1080deg)';

      // Step 3: Insert into hole
      setTimeout(() => {
        if (typeof ScrewMasterAudio !== 'undefined') {
          ScrewMasterAudio.playInsert();
        }

        // Execute engine state update
        const res = ScrewMasterEngine.executeMove(engine, screwId, targetHoleId);
        state.selectedScrewId = null;
        state.movesCount++;
        if (movesCountEl) movesCountEl.textContent = state.movesCount.toString();

        // Check if any panel released
        if (res.releasedPanels && res.releasedPanels.length > 0) {
          if (typeof ScrewMasterAudio !== 'undefined') {
            ScrewMasterAudio.playPanelRelease();
          }

          // In Time Challenge, give +10s per panel cleared!
          if (state.gameMode === 'time') {
            state.timeRemaining += 10;
            updateTimerDisplay();
            showToast('+10s Bonus Time!');
          }
        }

        renderBoard();
        updateControls();
        state.isAnimating = false;

        // Check victory
        if (res.isWon) {
          setTimeout(handleVictory, 400);
        }
      }, 300);
    }, 240);
  }

  /* ── Action Handlers ───────────────────────────────────── */
  function handleUndo() {
    if (state.isAnimating || state.history.length === 0) return;

    state.engineState = state.history.pop();
    state.selectedScrewId = null;
    state.movesCount++;
    if (movesCountEl) movesCountEl.textContent = state.movesCount.toString();

    if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playUndo();

    renderBoard();
    updateControls();
  }

  function handleRestart() {
    if (state.isAnimating) return;
    if (state.gameMode === 'daily') {
      startDailyChallenge();
    } else {
      loadLevel(state.levelNumber);
    }
  }

  function handleHint() {
    if (state.isAnimating) return;
    clearHints();

    const hint = ScrewMasterEngine.findHint(state.engineState);
    if (!hint) {
      showToast('No solution move found from this state! Try Undo.');
      if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playInvalid();
      return;
    }

    if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playHint();

    const sEl = stageEl.querySelector(`[data-screw-id="${hint.screwId}"]`);
    const hEl = stageEl.querySelector(`[data-hole-id="${hint.targetHoleId}"]`);

    if (sEl) sEl.classList.add('hint-highlight');
    if (hEl) hEl.classList.add('available-target');

    showToast('Hint: Unscrew the highlighted bolt!');
    setTimeout(clearHints, 3500);
  }

  function clearHints() {
    if (!stageEl) return;
    stageEl.querySelectorAll('.hint-highlight').forEach(el => el.classList.remove('hint-highlight'));
    stageEl.querySelectorAll('.available-target').forEach(el => el.classList.remove('available-target'));
  }

  function handleAddExtraSlot() {
    if (state.isAnimating || state.extraSlotUsed) return;

    state.history.push(ScrewMasterEngine.cloneState(state.engineState));

    const engine = state.engineState;
    const trayHoles = engine.holes.filter(h => h.type === 'tray');
    const newIdx = trayHoles.length + 1;
    const newHoleId = `t${newIdx}`;

    // Add new hole to tray
    engine.holes.push({
      id: newHoleId,
      x: 40 + (newIdx * 65),
      y: 460,
      type: 'tray'
    });
    engine.trayCapacity++;
    state.extraSlotUsed = true;

    if (btnAddSlot) {
      btnAddSlot.disabled = true;
      const tag = btnAddSlot.querySelector('.badge-tag');
      if (tag) tag.textContent = 'Used';
    }

    if (typeof ScrewMasterAudio !== 'undefined') ScrewMasterAudio.playSelect();
    showToast('+1 Extra Tray Slot Added!');

    renderBoard();
    updateControls();
  }

  function updateControls() {
    if (btnUndo) {
      btnUndo.disabled = state.history.length === 0;
    }
  }

  /* ── Victory & Modals ──────────────────────────────────── */
  function handleVictory() {
    stopTimer();

    const minMoves = state.engineState.minMoves || 5;
    let stars = 1;
    if (state.movesCount <= minMoves + 2) {
      stars = 3;
    } else if (state.movesCount <= minMoves + 5) {
      stars = 2;
    }

    const lvl = state.levelNumber;
    const isDaily = state.gameMode === 'daily';

    if (!isDaily) {
      if (lvl >= state.storage.maxUnlockedLevel) {
        state.storage.maxUnlockedLevel = Math.max(state.storage.maxUnlockedLevel, lvl + 1);
      }
      const prevStars = state.storage.levelStars[lvl] || 0;
      state.storage.levelStars[lvl] = Math.max(prevStars, stars);

      const prevMoves = state.storage.levelMoves[lvl];
      if (!prevMoves || state.movesCount < prevMoves) {
        state.storage.levelMoves[lvl] = state.movesCount;
      }
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      state.storage.dailyCompleted[todayStr] = { moves: state.movesCount, time: state.elapsedSeconds };
      state.storage.dailyStreak = (state.storage.dailyStreak || 0) + 1;
    }

    state.storage.xp = (state.storage.xp || 0) + (stars * 50);
    saveStorage();

    if (typeof ScrewMasterAudio !== 'undefined') {
      ScrewMasterAudio.playWin();
    }

    // Update Victory Modal UI
    const modalTitle = document.getElementById('win-title');
    const modalMoves = document.getElementById('win-moves');
    const modalTime = document.getElementById('win-time');
    const starsContainer = document.getElementById('win-stars');

    if (modalTitle) {
      modalTitle.textContent = isDaily ? 'Daily Challenge Cleared!' : `Level ${lvl} Cleared!`;
    }
    if (modalMoves) modalMoves.textContent = state.movesCount.toString();
    if (modalTime) {
      const mins = Math.floor(state.elapsedSeconds / 60);
      const secs = state.elapsedSeconds % 60;
      modalTime.textContent = `${mins}m ${secs}s`;
    }
    if (starsContainer) {
      const starEls = starsContainer.querySelectorAll('.star-icon');
      starEls.forEach((s, idx) => {
        if (idx < stars) s.classList.add('earned');
        else s.classList.remove('earned');
      });
    }

    openModal(winModal);
  }

  function openLevelSelectModal() {
    if (!levelModal) return;
    const grid = document.getElementById('level-select-grid');
    if (grid) {
      grid.innerHTML = '';
      const maxUnlocked = state.storage.maxUnlockedLevel || 1;

      for (let i = 1; i <= Math.max(maxUnlocked + 4, 30); i++) {
        const btn = document.createElement('button');
        btn.className = 'level-select-btn';
        if (i === state.levelNumber) btn.classList.add('active');
        if (i > maxUnlocked) btn.disabled = true;

        const num = document.createElement('span');
        num.className = 'level-select-num';
        num.textContent = i.toString();

        const starsSpan = document.createElement('span');
        starsSpan.className = 'level-select-stars';
        const earned = state.storage.levelStars[i] || 0;
        starsSpan.textContent = earned > 0 ? '★'.repeat(earned) : (i <= maxUnlocked ? '—' : '🔒');

        btn.appendChild(num);
        btn.appendChild(starsSpan);

        btn.addEventListener('click', () => {
          closeModal(levelModal);
          loadLevel(i);
        });

        grid.appendChild(btn);
      }
    }
    openModal(levelModal);
  }

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

