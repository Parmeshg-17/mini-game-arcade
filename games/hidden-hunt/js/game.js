/**
 * Hidden Hunt — Game Controller & UI Orchestrator
 * Connects data, scenes, engine, audio, and user interactions.
 */
(function() {
  'use strict';

  const Data = window.HiddenHuntData || { WORLDS: [], ACHIEVEMENTS: [] };
  const Engine = window.HiddenHuntEngine || {};
  const Scenes = window.HiddenHuntScenes || {};
  const Audio = window.HiddenHuntAudio || {};

  // --- State ---
  let progress = null;
  let currentSession = null;
  let currentWorld = null;
  let currentLevel = null;
  let timerInterval = null;

  // Zoom & Pan State
  let zoomLevel = 1.0;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  // --- DOM References ---
  const views = {
    menu: document.getElementById('view-main-menu'),
    worlds: document.getElementById('view-world-select'),
    levels: document.getElementById('view-level-select'),
    gameplay: document.getElementById('view-gameplay')
  };

  const hud = {
    worldName: document.getElementById('hh-hud-world-name'),
    levelName: document.getElementById('hh-hud-level-name'),
    timerVal: document.getElementById('hh-hud-timer-val'),
    foundVal: document.getElementById('hh-hud-found-val'),
    scoreVal: document.getElementById('hh-hud-score-val'),
    progressFill: document.getElementById('hh-hud-progress-fill'),
    progressText: document.getElementById('hh-hud-progress-text'),
    hintBtn: document.getElementById('hh-btn-hint'),
    muteBtn: document.getElementById('hh-btn-mute'),
    backToLevelsBtn: document.getElementById('hh-btn-back-levels')
  };

  const viewport = document.getElementById('hh-viewport');
  const canvasWrap = document.getElementById('hh-scene-wrap');
  const targetsList = document.getElementById('hh-targets-list');
  const toastEl = document.getElementById('hh-toast');
  const toastText = document.getElementById('hh-toast-text');
  let toastTimeout = null;

  function showDiscoveryToast(text) {
    if (!toastEl || !toastText) return;
    toastText.textContent = text;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      if (toastEl) toastEl.classList.add('hidden');
    }, 2200);
  }

  const modals = {
    complete: document.getElementById('modal-complete'),
    gameover: document.getElementById('modal-gameover'),
    howto: document.getElementById('modal-howto'),
    achievements: document.getElementById('modal-achievements'),
    daily: document.getElementById('modal-daily')
  };

  // --- Progress Storage ---
  function loadSavedProgress() {
    try {
      const raw = localStorage.getItem(Engine.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1) return parsed;
      }
    } catch (_) {}
    return Engine.createDefaultProgress();
  }

  function savePlayerProgress() {
    try {
      localStorage.setItem(Engine.STORAGE_KEY, JSON.stringify(progress));
    } catch (_) {}
  }

  // --- View Navigation ---
  function switchView(viewName) {
    Object.values(views).forEach(v => {
      if (v) v.classList.remove('active');
    });
    if (views[viewName]) {
      views[viewName].classList.add('active');
    }
    // Close open modals
    Object.values(modals).forEach(m => {
      if (m) m.classList.add('hidden');
    });
    // Stop timers if leaving gameplay
    if (viewName !== 'gameplay') {
      clearInterval(timerInterval);
    }
  }

  // --- Render Screen 1: Main Menu ---
  function initMainMenu() {
    const totalLevelsEl = document.getElementById('menu-stat-levels');
    const totalStarsEl = document.getElementById('menu-stat-stars');
    const completedCount = Object.keys(progress.completedLevels).length;

    if (totalLevelsEl) totalLevelsEl.textContent = `${completedCount} / 15`;
    if (totalStarsEl) totalStarsEl.textContent = `${progress.totalStars} / 45`;

    switchView('menu');
  }

  // --- Render Screen 2: World Select ---
  function renderWorldsScreen() {
    const container = document.getElementById('hh-worlds-grid');
    if (!container) return;
    container.innerHTML = '';

    Data.WORLDS.forEach(world => {
      const isUnlocked = progress.unlockedWorlds.includes(world.id);
      const completedInWorld = world.levels.filter(l => progress.completedLevels[l.id]).length;
      const starsInWorld = world.levels.reduce((acc, l) => {
        const rec = progress.completedLevels[l.id];
        return acc + (rec ? rec.stars : 0);
      }, 0);

      const card = document.createElement('div');
      card.className = `hh-world-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <div class="hh-world-banner">
          ${world.id === 'library' ? '📚' : world.id === 'forest' ? '🌲' : '🏴‍☠️'}
        </div>
        <div class="hh-world-body">
          <h3 class="hh-world-name">${world.name}</h3>
          <p class="hh-world-desc">${world.description}</p>
          <div class="hh-world-meta">
            <span>Levels: <strong>${completedInWorld}/5</strong></span>
            <span>Stars: <strong>${starsInWorld}/15 ⭐</strong></span>
          </div>
          <button class="hh-btn ${isUnlocked ? 'hh-btn-primary' : 'hh-btn-secondary'}" ${isUnlocked ? '' : 'disabled'}>
            ${isUnlocked ? (completedInWorld === 5 ? 'Replay World' : 'Explore World') : '🔒 Complete Prior World'}
          </button>
        </div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          renderLevelsScreen(world);
        });
      }
      container.appendChild(card);
    });

    switchView('worlds');
  }

  // --- Render Screen 3: Level Select ---
  function renderLevelsScreen(world) {
    currentWorld = world;
    const titleEl = document.getElementById('hh-levels-world-title');
    const container = document.getElementById('hh-levels-grid');
    if (titleEl) titleEl.textContent = world.name;
    if (!container) return;
    container.innerHTML = '';

    world.levels.forEach((lvl, idx) => {
      // Level unlocks sequentially: Level 1 is always unlocked; subsequent unlocked if previous completed
      const isUnlocked = idx === 0 || progress.completedLevels[world.levels[idx - 1].id];
      const rec = progress.completedLevels[lvl.id];
      const stars = rec ? rec.stars : 0;
      const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);

      const card = document.createElement('div');
      card.className = `hh-level-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <div class="hh-level-num">${isUnlocked ? lvl.number : '🔒'}</div>
        <div class="hh-level-title">${lvl.title}</div>
        <div class="hh-level-stars" aria-label="${stars} of 3 stars">${isUnlocked ? starStr : '---'}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          startLevelSession(world, lvl, 'story');
        });
      }
      container.appendChild(card);
    });

    switchView('levels');
  }

  // --- Render Screen 4: Core Gameplay ---
  function startLevelSession(world, level, mode = 'story') {
    currentWorld = world;
    currentLevel = level;
    currentSession = Engine.createSessionState(world, level, mode);

    // Reset Zoom and Pan
    resetZoom();

    // Update HUD
    if (hud.worldName) hud.worldName.textContent = world.name;
    if (hud.levelName) hud.levelName.textContent = level.title;
    if (hud.foundVal) hud.foundVal.textContent = `0 / ${level.objects.length}`;
    if (hud.scoreVal) hud.scoreVal.textContent = '0';
    if (hud.progressText) hud.progressText.textContent = `0 / ${level.objects.length} OBJECTS FOUND — 0%`;
    if (hud.progressFill) hud.progressFill.style.width = '0%';
    if (hud.timerVal) hud.timerVal.classList.remove('timer-warning');

    if (hud.hintBtn) {
      hud.hintBtn.classList.remove('disabled');
      hud.hintBtn.textContent = `💡 Hint (${currentSession.hintsRemaining})`;
    }

    // Render Target Shelf
    renderTargetShelf(level.objects, []);

    // Render Scene SVG
    if (canvasWrap) {
      canvasWrap.innerHTML = Scenes.buildSceneSvg(world, level, []);
      attachSceneClickListener();
    }

    // Start Timer
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      currentSession.timeElapsed++;
      if (currentSession.mode === 'timed') {
        currentSession.timeRemaining--;
        if (currentSession.timeRemaining <= 0) {
          handleGameOver();
        }
      }
      updateTimerDisplay();
    }, 1000);

    switchView('gameplay');
  }

  function updateTimerDisplay() {
    if (!hud.timerVal) return;
    if (currentSession.mode === 'timed') {
      const mins = Math.floor(currentSession.timeRemaining / 60);
      const secs = currentSession.timeRemaining % 60;
      hud.timerVal.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      // Warning treatment only when time is low (<= 20s)
      if (currentSession.timeRemaining <= 20) {
        hud.timerVal.classList.add('timer-warning');
      } else {
        hud.timerVal.classList.remove('timer-warning');
      }
    } else {
      const mins = Math.floor(currentSession.timeElapsed / 60);
      const secs = currentSession.timeElapsed % 60;
      hud.timerVal.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      hud.timerVal.classList.remove('timer-warning');
    }
  }

  function renderTargetShelf(objects, foundIds, hintTargetId = null) {
    if (!targetsList) return;
    const foundSet = new Set(foundIds);
    targetsList.innerHTML = objects.map(obj => {
      const isFound = foundSet.has(obj.id);
      const isHint = hintTargetId === obj.id && !isFound;
      return `
        <div class="hh-target-card ${isFound ? 'found' : ''} ${isHint ? 'hint-target' : ''}" id="shelf-${obj.id}">
          <div class="target-info-wrap">
            <span class="target-card-icon">${obj.icon}</span>
            <span class="target-card-name">${obj.name}</span>
          </div>
          <span class="target-status-badge">${isFound ? '✓ FOUND' : '○'}</span>
        </div>
      `;
    }).join('');
  }

  // --- Click & Hit Detection Handler ---
  function attachSceneClickListener() {
    const svgEl = document.getElementById('hidden-hunt-svg');
    if (!svgEl) return;

    svgEl.addEventListener('click', (e) => {
      if (!currentSession || currentSession.isCompleted || currentSession.isGameOver) return;

      const rect = svgEl.getBoundingClientRect();
      // Calculate normalized X, Y inside the SVG viewBox (0..1)
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;

      const check = Engine.checkHit(nx, ny, currentLevel.objects, currentSession.foundObjectIds);

      if (check.hit) {
        handleTargetDiscovered(check.object);
      } else {
        handleMistakeClick(e.clientX, e.clientY);
      }
    });
  }

  const DISCOVERY_MESSAGES = [
    'Excellent discovery!',
    'Well spotted!',
    'One more clue found!',
    'Sharp observation!',
    'Splendid find!'
  ];

  function handleTargetDiscovered(target) {
    const res = Engine.registerHit(currentSession, target);
    if (res.duplicate) return;

    // Visual Updates in Scene
    const sceneObj = document.getElementById(`obj-${target.id}`);
    if (sceneObj) {
      sceneObj.classList.add('found');
      const ring = sceneObj.querySelector('.discovery-ring');
      if (ring) ring.style.display = 'block';
    }

    // Visual Updates on Discovery Card
    const shelfCard = document.getElementById(`shelf-${target.id}`);
    if (shelfCard) {
      shelfCard.classList.remove('hint-target');
      shelfCard.classList.add('found');
      const badge = shelfCard.querySelector('.target-status-badge');
      if (badge) badge.textContent = '✓ FOUND';
    }

    // Audio Feedback
    if (res.combo > 1) {
      Audio.playCombo(res.combo);
    } else {
      Audio.playFound();
    }

    // Show Toast Feedback Pill
    const toastMsg = DISCOVERY_MESSAGES[Math.floor(Math.random() * DISCOVERY_MESSAGES.length)];
    const scoreBonus = res.combo > 1 ? ` (+${res.scoreAdded} • x${res.combo} Combo!)` : ` (+${res.scoreAdded})`;
    showDiscoveryToast(`${toastMsg}${scoreBonus}`);

    // Update HUD Found & Score
    const foundCount = currentSession.foundObjectIds.length;
    const totalTargets = currentSession.totalTargets;
    const progressPct = Math.round((foundCount / totalTargets) * 100);

    if (hud.foundVal) hud.foundVal.textContent = `${foundCount} / ${totalTargets}`;
    if (hud.scoreVal) hud.scoreVal.textContent = currentSession.score.toLocaleString();
    if (hud.progressText) hud.progressText.textContent = `${foundCount} / ${totalTargets} OBJECTS FOUND — ${progressPct}%`;
    if (hud.progressFill) hud.progressFill.style.width = `${progressPct}%`;

    // Check Level Complete
    if (res.isLevelComplete) {
      handleLevelComplete();
    }
  }

  function handleMistakeClick(clientX, clientY) {
    Engine.registerMiss(currentSession);
    Audio.playMiss();
    if (hud.scoreVal) hud.scoreVal.textContent = currentSession.score.toLocaleString();

    // Subtle red vibration pulse
    if (viewport) {
      viewport.style.boxShadow = 'inset 0 0 30px rgba(231,124,104,0.6)';
      setTimeout(() => {
        if (viewport) viewport.style.boxShadow = 'none';
      }, 200);
    }
  }

  // --- Hint System ---
  function triggerHint() {
    if (!currentSession || currentSession.hintsRemaining <= 0 || currentSession.isCompleted) return;

    const target = Engine.pickHintObject(currentLevel.objects, currentSession.foundObjectIds);
    if (!target) return;

    currentSession.hintsRemaining--;
    currentSession.hintsUsed++;
    if (hud.hintBtn) {
      hud.hintBtn.textContent = `💡 Hint (${currentSession.hintsRemaining})`;
      if (currentSession.hintsRemaining <= 0) {
        hud.hintBtn.classList.add('disabled');
      }
    }

    Audio.playHint();

    // 1. Move & Show SVG Hint Beacon Pin in Scene
    const hintPin = document.getElementById('scene-hint-pin');
    if (hintPin) {
      hintPin.setAttribute('transform', `translate(${target.x * 1000}, ${target.y * 600})`);
      hintPin.style.display = 'block';
      setTimeout(() => {
        if (hintPin) hintPin.style.display = 'none';
      }, 3800);
    }

    // 2. Highlight corresponding Discovery Card with pulsing antique gold border
    const shelfCard = document.getElementById(`shelf-${target.id}`);
    if (shelfCard) {
      shelfCard.classList.add('hint-target');
      setTimeout(() => {
        if (shelfCard) shelfCard.classList.remove('hint-target');
      }, 3800);
    }

    showDiscoveryToast(`Hint active: Look near the ${target.name}!`);
  }

  // --- Level Completion ---
  function handleLevelComplete() {
    clearInterval(timerInterval);
    const stars = Engine.evaluateStars(currentSession, currentLevel.parTime);
    Engine.commitLevelResult(progress, currentWorld.id, currentLevel.id, currentSession, stars);
    savePlayerProgress();
    Engine.checkAchievements(progress, currentSession);

    Audio.playLevelComplete();

    // Populate Victory Modal
    const starsContainer = document.getElementById('modal-stars-row');
    const scoreValEl = document.getElementById('modal-score-val');
    const accuracyEl = document.getElementById('modal-accuracy-val');
    const timeEl = document.getElementById('modal-time-val');

    if (starsContainer) {
      starsContainer.innerHTML = '★'.repeat(stars).split('').map(s => `<span>${s}</span>`).join('') +
        '☆'.repeat(3 - stars).split('').map(s => `<span style="opacity: 0.3;">${s}</span>`).join('');
    }
    if (scoreValEl) scoreValEl.textContent = currentSession.score.toLocaleString();
    if (accuracyEl) {
      const acc = currentSession.totalClicks > 0
        ? Math.round((currentSession.correctClicks / currentSession.totalClicks) * 100)
        : 100;
      accuracyEl.textContent = `${acc}%`;
    }
    if (timeEl) {
      const mins = Math.floor(currentSession.timeElapsed / 60);
      const secs = currentSession.timeElapsed % 60;
      timeEl.textContent = `${mins}m ${secs}s`;
    }

    if (modals.complete) modals.complete.classList.remove('hidden');
  }

  function handleGameOver() {
    clearInterval(timerInterval);
    currentSession.isGameOver = true;
    if (modals.gameover) modals.gameover.classList.remove('hidden');
  }

  // --- Zoom & Pan Management ---
  function applyTransform() {
    if (!canvasWrap) return;
    canvasWrap.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  }

  function zoomIn() {
    if (zoomLevel < 2.5) {
      zoomLevel = parseFloat((zoomLevel + 0.5).toFixed(1));
      applyTransform();
    }
  }

  function zoomOut() {
    if (zoomLevel > 1.0) {
      zoomLevel = parseFloat((zoomLevel - 0.5).toFixed(1));
      if (zoomLevel === 1.0) {
        panX = 0;
        panY = 0;
      }
      applyTransform();
    }
  }

  function resetZoom() {
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  // Mouse & Touch Pan Handling
  if (viewport) {
    viewport.addEventListener('mousedown', (e) => {
      if (zoomLevel > 1.0) {
        isDragging = true;
        dragStartX = e.clientX - panX;
        dragStartY = e.clientY - panY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging && zoomLevel > 1.0) {
        panX = e.clientX - dragStartX;
        panY = e.clientY - dragStartY;
        applyTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch Panning
    let touchX = 0;
    let touchY = 0;
    viewport.addEventListener('touchstart', (e) => {
      if (zoomLevel > 1.0 && e.touches.length === 1) {
        isDragging = true;
        touchX = e.touches[0].clientX - panX;
        touchY = e.touches[0].clientY - panY;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (isDragging && zoomLevel > 1.0 && e.touches.length === 1) {
        panX = e.touches[0].clientX - touchX;
        panY = e.touches[0].clientY - touchY;
        applyTransform();
      }
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  // --- Daily Challenge ---
  function openDailyHunt() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyChallenge = Engine.getDailyChallenge(todayStr, Data.WORLDS);
    const targetWorld = Data.WORLDS.find(w => w.id === dailyChallenge.worldId) || Data.WORLDS[0];
    const targetLevel = targetWorld.levels.find(l => l.id === dailyChallenge.levelId) || targetWorld.levels[0];

    startLevelSession(targetWorld, targetLevel, 'timed');
  }

  // --- Achievements Modal ---
  function openAchievementsModal() {
    const container = document.getElementById('modal-achievements-list');
    if (!container) return;
    container.innerHTML = Data.ACHIEVEMENTS.map(ach => {
      const isUnlocked = progress.achievements.includes(ach.id);
      return `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #20241e; border: 1px solid ${isUnlocked ? '#d5ff55' : '#2b3127'}; border-radius: 8px; margin-bottom: 8px; opacity: ${isUnlocked ? '1' : '0.5'};">
          <span style="font-size: 1.6rem;">${ach.icon}</span>
          <div style="flex: 1; text-align: left;">
            <div style="font-weight: 700; color: ${isUnlocked ? '#d5ff55' : '#f4f2e9'}; font-size: 0.9rem;">${ach.name}</div>
            <div style="font-size: 0.78rem; color: #9fa896;">${ach.desc}</div>
          </div>
          <span>${isUnlocked ? '✅' : '🔒'}</span>
        </div>
      `;
    }).join('');

    if (modals.achievements) modals.achievements.classList.remove('hidden');
  }

  // --- Button & Event Wiring ---
  function setupEventListeners() {
    // Menu Buttons
    const btnExplore = document.getElementById('menu-btn-explore');
    if (btnExplore) btnExplore.addEventListener('click', renderWorldsScreen);

    const btnContinue = document.getElementById('menu-btn-continue');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => {
        // Find first incomplete level
        for (const w of Data.WORLDS) {
          if (progress.unlockedWorlds.includes(w.id)) {
            for (const l of w.levels) {
              if (!progress.completedLevels[l.id]) {
                startLevelSession(w, l, 'story');
                return;
              }
            }
          }
        }
        // If all complete, play World 1 Level 1
        startLevelSession(Data.WORLDS[0], Data.WORLDS[0].levels[0], 'story');
      });
    }

    const btnDaily = document.getElementById('menu-btn-daily');
    if (btnDaily) btnDaily.addEventListener('click', openDailyHunt);

    const btnHowto = document.getElementById('menu-btn-howto');
    if (btnHowto) btnHowto.addEventListener('click', () => {
      if (modals.howto) modals.howto.classList.remove('hidden');
    });

    const btnAchievements = document.getElementById('menu-btn-achievements');
    if (btnAchievements) btnAchievements.addEventListener('click', openAchievementsModal);

    // Nav Back Buttons
    const backWorldsBtn = document.getElementById('hh-btn-back-worlds');
    if (backWorldsBtn) backWorldsBtn.addEventListener('click', initMainMenu);

    const backLevelsBtn = document.getElementById('hh-btn-back-levels');
    if (backLevelsBtn) backLevelsBtn.addEventListener('click', () => {
      if (currentWorld) renderLevelsScreen(currentWorld);
      else renderWorldsScreen();
    });

    // In-Game Buttons
    if (hud.hintBtn) hud.hintBtn.addEventListener('click', triggerHint);
    if (hud.muteBtn) {
      hud.muteBtn.addEventListener('click', () => {
        const isMuted = Audio.toggleMute();
        hud.muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Zoom Buttons
    const btnZoomIn = document.getElementById('hh-btn-zoom-in');
    const btnZoomOut = document.getElementById('hh-btn-zoom-out');
    const btnZoomReset = document.getElementById('hh-btn-zoom-reset');
    if (btnZoomIn) btnZoomIn.addEventListener('click', zoomIn);
    if (btnZoomOut) btnZoomOut.addEventListener('click', zoomOut);
    if (btnZoomReset) btnZoomReset.addEventListener('click', resetZoom);

    // Modal Action Buttons
    const nextLevelBtn = document.getElementById('modal-btn-next');
    if (nextLevelBtn) {
      nextLevelBtn.addEventListener('click', () => {
        const curIdx = currentWorld.levels.findIndex(l => l.id === currentLevel.id);
        if (curIdx >= 0 && curIdx < currentWorld.levels.length - 1) {
          startLevelSession(currentWorld, currentWorld.levels[curIdx + 1], currentSession.mode);
        } else {
          renderWorldsScreen();
        }
      });
    }

    const replayBtn = document.getElementById('modal-btn-replay');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        startLevelSession(currentWorld, currentLevel, currentSession.mode);
      });
    }

    const levelsMapBtn = document.getElementById('modal-btn-map');
    if (levelsMapBtn) {
      levelsMapBtn.addEventListener('click', () => {
        renderLevelsScreen(currentWorld);
      });
    }

    const goReplayBtn = document.getElementById('modal-go-btn-replay');
    if (goReplayBtn) {
      goReplayBtn.addEventListener('click', () => {
        startLevelSession(currentWorld, currentLevel, 'timed');
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.hh-modal-close-btn').forEach(b => {
      b.addEventListener('click', () => {
        Object.values(modals).forEach(m => {
          if (m) m.classList.add('hidden');
        });
      });
    });
  }

  // --- Boot Initialization ---
  function init() {
    progress = loadSavedProgress();
    setupEventListeners();
    initMainMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

