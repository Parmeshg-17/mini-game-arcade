/**
 * Water Sort — Main Game Controller & UI Orchestration
 * Handles user touch/click events, responsive tube layout, realistic pouring stream
 * animations, move history, hints, solver assists, and progress persistence.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'minigame_watersort_save_v1';

  // State object
  const state = {
    levelNumber: 1,
    levelData: null,
    tubes: [],
    history: [],
    selectedTubeIndex: null,
    isAnimating: false,
    extraTubeUsed: false,
    movesCount: 0,
    startTime: 0,
    elapsedSeconds: 0,
    timerInterval: null,
    isDaily: false,
    storage: {
      maxUnlockedLevel: 1,
      levelStars: {},
      levelMoves: {},
      soundEnabled: true
    }
  };

  // Color lookup helper
  const colorMap = {};
  if (typeof WaterSortEngine !== 'undefined') {
    WaterSortEngine.LIQUID_COLORS.forEach(c => {
      colorMap[c.id] = c;
    });
  }

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
  let tubesGrid = null;
  let levelTitleEl = null;
  let levelTierEl = null;
  let movesCountEl = null;
  let timerDisplayEl = null;
  let bestMovesEl = null;
  let btnUndo = null;
  let btnRestart = null;
  let btnHint = null;
  let btnAddTube = null;
  let btnSound = null;
  let btnLevels = null;
  let winModal = null;
  let levelModal = null;
  let streamLayer = null;

  /* ── Initialization ────────────────────────────────────── */
  function init() {
    loadStorage();

    tubesGrid = document.getElementById('tubes-grid');
    levelTitleEl = document.getElementById('level-title');
    levelTierEl = document.getElementById('level-tier');
    movesCountEl = document.getElementById('moves-count');
    timerDisplayEl = document.getElementById('timer-display');
    bestMovesEl = document.getElementById('best-moves');
    btnUndo = document.getElementById('btn-undo');
    btnRestart = document.getElementById('btn-restart');
    btnHint = document.getElementById('btn-hint');
    btnAddTube = document.getElementById('btn-add-tube');
    btnSound = document.getElementById('btn-sound');
    btnLevels = document.getElementById('btn-levels');
    winModal = document.getElementById('win-modal');
    levelModal = document.getElementById('level-modal');
    streamLayer = document.getElementById('pouring-stream-layer');

    setupEventListeners();
    updateSoundButton();

    // Check URL parameters (e.g. ?level=5 or ?mode=daily)
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const lvl = parseInt(urlParams.get('level'), 10);

    if (mode === 'daily') {
      startDailyChallenge();
    } else if (!isNaN(lvl) && lvl >= 1) {
      loadLevel(lvl);
    } else {
      loadLevel(state.storage.maxUnlockedLevel || 1);
    }
  }

  /* ── Event Listeners ───────────────────────────────────── */
  function setupEventListeners() {
    if (btnUndo) btnUndo.addEventListener('click', handleUndo);
    if (btnRestart) btnRestart.addEventListener('click', handleRestart);
    if (btnHint) btnHint.addEventListener('click', handleHint);
    if (btnAddTube) btnAddTube.addEventListener('click', handleAddExtraTube);
    if (btnSound) btnSound.addEventListener('click', handleToggleSound);
    if (btnLevels) btnLevels.addEventListener('click', openLevelSelectModal);

    const btnNextLevel = document.getElementById('btn-next-level');
    if (btnNextLevel) btnNextLevel.addEventListener('click', () => {
      closeModal(winModal);
      if (state.isDaily) {
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

    // Close modals on clicking overlay or close buttons
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
  }

  /* ── Sound Toggle ──────────────────────────────────────── */
  function updateSoundButton() {
    if (!btnSound) return;
    const isMuted = typeof WaterSortAudio !== 'undefined' ? WaterSortAudio.getMuted() : false;
    btnSound.innerHTML = isMuted
      ? `<svg viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Unmute`
      : `<svg viewBox="0 0 24 24" fill="none"><path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Sound`;
  }

  function handleToggleSound() {
    if (typeof WaterSortAudio === 'undefined') return;
    const currentlyMuted = WaterSortAudio.getMuted();
    WaterSortAudio.setMuted(!currentlyMuted);
    updateSoundButton();
  }

  /* ── Timer Management ──────────────────────────────────── */
  function startTimer() {
    clearInterval(state.timerInterval);
    state.startTime = Date.now();
    state.elapsedSeconds = 0;
    updateTimerDisplay();

    state.timerInterval = setInterval(() => {
      state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
      updateTimerDisplay();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
  }

  function updateTimerDisplay() {
    if (!timerDisplayEl) return;
    const mins = Math.floor(state.elapsedSeconds / 60);
    const secs = state.elapsedSeconds % 60;
    timerDisplayEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /* ── Level Management ──────────────────────────────────── */
  function loadLevel(levelNum) {
    state.levelNumber = levelNum;
    state.isDaily = false;
    state.selectedTubeIndex = null;
    state.isAnimating = false;
    state.extraTubeUsed = false;
    state.history = [];
    state.movesCount = 0;

    // Generate guaranteed-solvable level
    state.levelData = WaterSortEngine.generateLevel(levelNum);
    state.tubes = WaterSortEngine.createPrng ? state.levelData.tubes.map(t => t.slice()) : state.levelData.tubes;

    // Update HUD
    if (levelTitleEl) levelTitleEl.textContent = `Level ${levelNum}`;
    if (levelTierEl) levelTierEl.textContent = state.levelData.tier;
    if (movesCountEl) movesCountEl.textContent = '0';
    if (bestMovesEl) {
      const best = state.storage.levelMoves[levelNum];
      bestMovesEl.textContent = best ? `${best} moves` : `Par: ${state.levelData.minMoves}`;
    }

    if (btnAddTube) {
      btnAddTube.disabled = false;
      const tag = btnAddTube.querySelector('.badge-tag');
      if (tag) tag.textContent = '+1';
    }

    renderTubes();
    updateControls();
    startTimer();
  }

  function startDailyChallenge() {
    state.isDaily = true;
    state.selectedTubeIndex = null;
    state.isAnimating = false;
    state.extraTubeUsed = false;
    state.history = [];
    state.movesCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    state.levelData = WaterSortEngine.getDailyLevel(todayStr);
    state.tubes = state.levelData.tubes.map(t => t.slice());

    if (levelTitleEl) levelTitleEl.textContent = 'Daily Challenge';
    if (levelTierEl) levelTierEl.textContent = todayStr;
    if (movesCountEl) movesCountEl.textContent = '0';
    if (bestMovesEl) bestMovesEl.textContent = 'Daily';

    if (btnAddTube) {
      btnAddTube.disabled = false;
      const tag = btnAddTube.querySelector('.badge-tag');
      if (tag) tag.textContent = '+1';
    }

    renderTubes();
    updateControls();
    startTimer();
  }

  /* ── Tube Rendering ────────────────────────────────────── */
  function renderTubes() {
    if (!tubesGrid) return;
    tubesGrid.innerHTML = '';

    state.tubes.forEach((tube, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'tube-wrapper';
      wrapper.dataset.index = idx;
      wrapper.setAttribute('role', 'button');
      wrapper.setAttribute('tabindex', '0');
      wrapper.setAttribute('aria-label', `Tube ${idx + 1}, contains ${tube.length} units`);

      if (state.selectedTubeIndex === idx) {
        wrapper.classList.add('selected');
      }

      const isComplete = WaterSortEngine.isTubeComplete(tube);
      if (isComplete) {
        wrapper.classList.add('completed');
      }

      // Tube collar/lip
      const lip = document.createElement('div');
      lip.className = 'tube-lip';
      wrapper.appendChild(lip);

      // Glass body
      const glass = document.createElement('div');
      glass.className = 'tube-glass';

      // Bottom glow reflection
      const bottomGlow = document.createElement('div');
      bottomGlow.className = 'tube-bottom-glow';
      glass.appendChild(bottomGlow);

      // Render liquid segments
      tube.forEach(colorId => {
        const seg = document.createElement('div');
        seg.className = 'liquid-segment';
        const colorMeta = colorMap[colorId] || { hex: '#00d2ff', light: '#62e4ff', dark: '#0099cc' };

        seg.style.background = `linear-gradient(180deg, ${colorMeta.light} 0%, ${colorMeta.hex} 50%, ${colorMeta.dark} 100%)`;
        seg.style.boxShadow = `inset 0 1px 3px rgba(255, 255, 255, 0.4), 0 0 10px ${colorMeta.hex}33`;

        // Small floating bubble inside segment
        const bubble = document.createElement('span');
        bubble.className = 'bubble';
        bubble.style.left = `${20 + Math.random() * 50}%`;
        bubble.style.width = `${3 + Math.random() * 4}px`;
        bubble.style.height = bubble.style.width;
        bubble.style.animationDelay = `${Math.random() * 2}s`;
        seg.appendChild(bubble);

        glass.appendChild(seg);
      });

      wrapper.appendChild(glass);

      if (isComplete) {
        const sparkle = document.createElement('span');
        sparkle.className = 'completed-sparkle';
        sparkle.textContent = '✨';
        wrapper.appendChild(sparkle);
      }

      // Click & Keyboard Handlers
      wrapper.addEventListener('click', () => handleTubeClick(idx));
      wrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTubeClick(idx);
        }
      });

      tubesGrid.appendChild(wrapper);
    });
  }

  /* ── Interaction Handling ──────────────────────────────── */
  function handleTubeClick(clickedIdx) {
    if (state.isAnimating) return;

    // Clear any active hint pointers
    clearHints();

    const currentTubes = state.tubes;
    const clickedTube = currentTubes[clickedIdx];

    // Case 1: No tube currently selected
    if (state.selectedTubeIndex === null) {
      if (clickedTube.length === 0) return; // Cannot pour empty tube
      if (WaterSortEngine.isTubeComplete(clickedTube)) return; // Already solved

      state.selectedTubeIndex = clickedIdx;
      if (typeof WaterSortAudio !== 'undefined') WaterSortAudio.playSelect();
      updateSelectedTubeUI();
      return;
    }

    // Case 2: Clicked on already selected tube -> Deselect
    if (state.selectedTubeIndex === clickedIdx) {
      state.selectedTubeIndex = null;
      updateSelectedTubeUI();
      return;
    }

    // Case 3: Clicked another tube -> Attempt pour
    const srcIdx = state.selectedTubeIndex;
    const dstIdx = clickedIdx;

    if (WaterSortEngine.canPour(currentTubes, srcIdx, dstIdx)) {
      executeAnimatedPour(srcIdx, dstIdx);
    } else {
      // If destination has liquid and is not complete, switch selection to this new tube
      if (clickedTube.length > 0 && !WaterSortEngine.isTubeComplete(clickedTube)) {
        state.selectedTubeIndex = clickedIdx;
        if (typeof WaterSortAudio !== 'undefined') WaterSortAudio.playSelect();
        updateSelectedTubeUI();
      } else {
        // Invalid move -> shake source tube
        shakeTube(srcIdx);
        if (typeof WaterSortAudio !== 'undefined') WaterSortAudio.playInvalid();
      }
    }
  }

  function updateSelectedTubeUI() {
    const wrappers = tubesGrid.querySelectorAll('.tube-wrapper');
    wrappers.forEach((w, idx) => {
      if (idx === state.selectedTubeIndex) {
        w.classList.add('selected');
      } else {
        w.classList.remove('selected');
      }
    });
  }

  function shakeTube(idx) {
    const wrapper = tubesGrid.querySelector(`[data-index="${idx}"]`);
    if (!wrapper) return;
    wrapper.classList.add('shake');
    setTimeout(() => {
      wrapper.classList.remove('shake');
    }, 400);
  }

  /* ── Animated Liquid Pouring Execution ──────────────────── */
  function executeAnimatedPour(srcIdx, dstIdx) {
    state.isAnimating = true;

    // Snapshot state for Undo
    state.history.push(state.tubes.map(t => t.slice()));

    const srcWrapper = tubesGrid.querySelector(`[data-index="${srcIdx}"]`);
    const dstWrapper = tubesGrid.querySelector(`[data-index="${dstIdx}"]`);

    const result = WaterSortEngine.executePour(state.tubes, srcIdx, dstIdx);

    if (!srcWrapper || !dstWrapper || !result.success) {
      state.tubes = result.tubes;
      state.selectedTubeIndex = null;
      state.isAnimating = false;
      renderTubes();
      return;
    }

    // Audio cue
    if (typeof WaterSortAudio !== 'undefined') {
      WaterSortAudio.playPour(result.units);
    }

    // Calculate dynamic positioning for tilt and liquid stream
    const srcRect = srcWrapper.getBoundingClientRect();
    const dstRect = dstWrapper.getBoundingClientRect();
    const gridRect = tubesGrid.getBoundingClientRect();

    const dx = (dstRect.left + dstRect.width / 2) - (srcRect.left + srcRect.width / 2);
    const dy = (dstRect.top - srcRect.top);
    const tiltDirection = dx >= 0 ? 1 : -1;
    const tiltAngle = tiltDirection * 55;

    // Translate source tube towards destination and tilt
    const liftTranslateX = dx - (tiltDirection * 40);
    const liftTranslateY = dy - 60;

    srcWrapper.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    srcWrapper.style.zIndex = '60';
    srcWrapper.style.transform = `translate(${liftTranslateX}px, ${liftTranslateY}px) rotate(${tiltAngle}deg)`;

    // Draw SVG pouring stream
    const colorMeta = colorMap[result.color] || { hex: '#00d2ff' };
    createStreamSvg(srcWrapper, dstWrapper, colorMeta.hex, tiltDirection);

    // After pour flow duration:
    setTimeout(() => {
      // Remove stream
      if (streamLayer) streamLayer.innerHTML = '';

      // Reset source tube transform
      srcWrapper.style.transform = '';
      srcWrapper.style.zIndex = '';

      // Commit state
      state.tubes = result.tubes;
      state.selectedTubeIndex = null;
      state.movesCount++;
      if (movesCountEl) movesCountEl.textContent = state.movesCount.toString();

      // Re-render tubes
      renderTubes();
      updateControls();

      // Check tube completion sound
      if (result.destCompleted && typeof WaterSortAudio !== 'undefined') {
        WaterSortAudio.playTubeComplete();
      }

      state.isAnimating = false;

      // Check victory
      if (WaterSortEngine.checkWin(state.tubes)) {
        setTimeout(handleVictory, 300);
      }
    }, 450);
  }

  function createStreamSvg(srcEl, dstEl, colorHex, direction) {
    if (!streamLayer) return;
    streamLayer.innerHTML = '';

    const layerRect = streamLayer.getBoundingClientRect();
    const srcRect = srcEl.getBoundingClientRect();
    const dstRect = dstEl.getBoundingClientRect();

    const startX = (direction > 0 ? srcRect.right - 10 : srcRect.left + 10) - layerRect.left;
    const startY = (srcRect.top + 25) - layerRect.top;

    const endX = (dstRect.left + dstRect.width / 2) - layerRect.left;
    const endY = (dstRect.top + 20) - layerRect.top;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'pour-arc-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const ctrlX = startX + (direction * 15);
    const ctrlY = startY + 50;

    const d = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', colorHex);
    path.setAttribute('stroke-width', '8');
    path.setAttribute('stroke-linecap', 'round');
    path.style.filter = `drop-shadow(0 0 6px ${colorHex})`;

    svg.appendChild(path);
    streamLayer.appendChild(svg);
  }

  /* ── Action Handlers ───────────────────────────────────── */
  function handleUndo() {
    if (state.isAnimating || state.history.length === 0) return;

    state.tubes = state.history.pop();
    state.selectedTubeIndex = null;
    state.movesCount++;
    if (movesCountEl) movesCountEl.textContent = state.movesCount.toString();

    if (typeof WaterSortAudio !== 'undefined') WaterSortAudio.playUndo();

    renderTubes();
    updateControls();
  }

  function handleRestart() {
    if (state.isAnimating) return;
    if (state.isDaily) {
      startDailyChallenge();
    } else {
      loadLevel(state.levelNumber);
    }
  }

  function handleHint() {
    if (state.isAnimating) return;
    clearHints();

    const hint = WaterSortEngine.findHint(state.tubes);
    if (!hint) {
      shakeTube(0);
      return;
    }

    if (typeof WaterSortAudio !== 'undefined') WaterSortAudio.playHint();

    const srcWrapper = tubesGrid.querySelector(`[data-index="${hint.from}"]`);
    const dstWrapper = tubesGrid.querySelector(`[data-index="${hint.to}"]`);

    if (srcWrapper) srcWrapper.classList.add('hint-source');
    if (dstWrapper) dstWrapper.classList.add('hint-target');

    setTimeout(clearHints, 3000);
  }

  function clearHints() {
    if (!tubesGrid) return;
    tubesGrid.querySelectorAll('.hint-source').forEach(el => el.classList.remove('hint-source'));
    tubesGrid.querySelectorAll('.hint-target').forEach(el => el.classList.remove('hint-target'));
  }

  function handleAddExtraTube() {
    if (state.isAnimating || state.extraTubeUsed) return;

    state.history.push(state.tubes.map(t => t.slice()));
    state.tubes.push([]);
    state.extraTubeUsed = true;

    if (btnAddTube) {
      btnAddTube.disabled = true;
      const tag = btnAddTube.querySelector('.badge-tag');
      if (tag) tag.textContent = 'Used';
    }

    if (typeof WaterSortAudio !== 'undefined') WaterSortAudio.playSelect();

    renderTubes();
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

    const minMoves = state.levelData.minMoves || 8;
    let stars = 1;
    if (state.movesCount <= minMoves + 2) {
      stars = 3;
    } else if (state.movesCount <= minMoves + 6) {
      stars = 2;
    }

    // Persist best stats
    const lvl = state.levelNumber;
    if (!state.isDaily) {
      if (lvl >= state.storage.maxUnlockedLevel) {
        state.storage.maxUnlockedLevel = Math.max(state.storage.maxUnlockedLevel, lvl + 1);
      }
      const prevStars = state.storage.levelStars[lvl] || 0;
      state.storage.levelStars[lvl] = Math.max(prevStars, stars);

      const prevMoves = state.storage.levelMoves[lvl];
      if (!prevMoves || state.movesCount < prevMoves) {
        state.storage.levelMoves[lvl] = state.movesCount;
      }
      saveStorage();
    }

    if (typeof WaterSortAudio !== 'undefined') {
      WaterSortAudio.playWin();
    }

    // Update Victory Modal UI
    const modalTitle = document.getElementById('win-title');
    const modalMoves = document.getElementById('win-moves');
    const modalTime = document.getElementById('win-time');
    const starsContainer = document.getElementById('win-stars');

    if (modalTitle) {
      modalTitle.textContent = state.isDaily ? 'Daily Challenge Complete!' : `Level ${lvl} Cleared!`;
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

      for (let i = 1; i <= Math.max(maxUnlocked + 2, 30); i++) {
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
