/**
 * Circuit Connect (Color Chain) — Frontend Controller & Canvas Renderer
 * Smooth drag-to-connect glowing neon lines, backtracking, line cuts,
 * 100% board coverage check, hints, keyboard & touch accessibility.
 */
(function() {
  'use strict';

  // DOM Elements
  const canvas = document.getElementById('circuit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const levelTitleDisplay = document.getElementById('level-title-display');
  const chapterDisplay = document.getElementById('chapter-display');
  const movesDisplay = document.getElementById('moves-display');
  const parDisplay = document.getElementById('par-display');
  const targetsDisplay = document.getElementById('targets-display');
  const timerDisplay = document.getElementById('timer-display');
  const coverageDisplay = document.getElementById('coverage-display');

  const levelSelectBtn = document.getElementById('level-select-btn');
  const undoBtn = document.getElementById('undo-btn');
  const restartBtn = document.getElementById('restart-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const hintBtn = document.getElementById('hint-btn');

  // Overlays
  const overlayWin = document.getElementById('overlay-win');
  const winTitle = document.getElementById('win-title');
  const winStarsVal = document.getElementById('win-stars-val');
  const winMovesVal = document.getElementById('win-moves-val');
  const winParVal = document.getElementById('win-par-val');
  const winTimeVal = document.getElementById('win-time-val');
  const nextLevelBtn = document.getElementById('next-level-btn');
  const replayBtn = document.getElementById('replay-btn');

  const overlayOverload = document.getElementById('overlay-overload');
  const overloadRestartBtn = document.getElementById('overload-restart-btn');
  const overloadUndoBtn = document.getElementById('overload-undo-btn');

  const overlayLevelSelect = document.getElementById('overlay-level-select');
  const closeLevelSelectBtn = document.getElementById('close-level-select-btn');
  const levelGridContainer = document.getElementById('level-grid-container');

  // Storage Keys
  const STORAGE_LEVEL_KEY = 'circuit_connect_level';
  const STORAGE_STARS_KEY = 'circuit_connect_stars';

  // Game Runtime State
  let currentLevelIdx = 0;
  let flowState = null;
  let isPaused = false;
  let timerInterval = null;
  let elapsedSeconds = 0;
  let pointerPos = null; // { x, y } for fingertip glow during drag
  let cursor = { r: 0, c: 0, active: false };
  let animFrameId = null;
  let pulsePhase = 0;

  // Saved Stars Map: { [levelId]: stars }
  let userStars = {};
  try {
    const raw = localStorage.getItem(STORAGE_STARS_KEY);
    if (raw) userStars = JSON.parse(raw);
    const savedLvl = localStorage.getItem(STORAGE_LEVEL_KEY);
    if (savedLvl !== null) {
      currentLevelIdx = Math.max(0, Math.min(CircuitEngine.LEVELS.length - 1, parseInt(savedLvl, 10)));
    }
  } catch (e) {}

  /**
   * Initialize or switch level
   */
  function loadLevel(idx) {
    currentLevelIdx = Math.max(0, Math.min(CircuitEngine.LEVELS.length - 1, idx));
    try {
      localStorage.setItem(STORAGE_LEVEL_KEY, currentLevelIdx.toString());
    } catch (e) {}

    const lvlConfig = CircuitEngine.LEVELS[currentLevelIdx];
    flowState = CircuitEngine.createFlowLevel(lvlConfig);

    // Reset timing & cursor
    stopTimer();
    elapsedSeconds = 0;
    startTimer();

    cursor.r = Math.floor(lvlConfig.rows / 2);
    cursor.c = Math.floor(lvlConfig.cols / 2);
    pointerPos = null;

    hideAllOverlays();
    updateHUD();
    resizeCanvas();
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      if (!isPaused && !flowState.isSolved) {
        elapsedSeconds++;
        updateTimerDisplay();
      }
    }, 1000);
    updateTimerDisplay();
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    if (!timerDisplay) return;
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function updateHUD() {
    if (!flowState) return;
    const lvl = flowState.level;

    if (levelTitleDisplay) {
      levelTitleDisplay.textContent = `Lvl ${lvl.id}: ${lvl.title}`;
    }
    if (chapterDisplay) {
      chapterDisplay.textContent = lvl.chapter;
    }
    if (movesDisplay) {
      movesDisplay.textContent = `Moves: ${flowState.moves} / ${lvl.moveLimit}`;
    }
    if (parDisplay) {
      parDisplay.textContent = `Par: ${lvl.par}`;
    }

    const connectedCount = flowState.pairs.filter(p => flowState.connected[p.key]).length;
    const totalPairs = flowState.pairs.length;
    if (targetsDisplay) {
      targetsDisplay.textContent = `Pipes: ${connectedCount} / ${totalPairs}`;
    }

    const cov = CircuitEngine.getBoardCoverage(flowState);
    if (coverageDisplay) {
      coverageDisplay.textContent = `Covered: ${cov.percent}%`;
      coverageDisplay.className = cov.isFull ? 'hud-pill highlight-lime' : 'hud-pill highlight-cyan';
    }

    // Audio button sync
    if (audioIcon) {
      audioIcon.textContent = CircuitAudio.isMuted() ? '🔇' : '🔊';
    }
  }

  /**
   * Canvas Resizing with Retina Support
   */
  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 480;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);

  /**
   * Main Render Loop
   */
  function renderLoop() {
    pulsePhase += 0.05;
    renderBoard();
    animFrameId = requestAnimationFrame(renderLoop);
  }

  function renderBoard() {
    if (!ctx || !flowState) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const rows = flowState.rows;
    const cols = flowState.cols;
    const padding = 12;
    const boardW = w - padding * 2;
    const boardH = h - padding * 2;
    const cellW = boardW / cols;
    const cellH = boardH / rows;

    // 1. Draw Grid Cells Background
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padding + c * cellW;
        const y = padding + r * cellH;
        const margin = 2;

        ctx.fillStyle = '#14181f';
        roundRect(ctx, x + margin, y + margin, cellW - margin * 2, cellH - margin * 2, 8);
        ctx.fill();

        ctx.strokeStyle = '#1e2634';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 2. Draw Color Paths / Wires
    for (const key of Object.keys(flowState.paths)) {
      const path = flowState.paths[key];
      if (!path || path.length < 2) continue;

      const pair = flowState.pairs.find(p => p.key === key);
      const color = pair ? pair.color : '#38bdf8';
      const isConnected = flowState.connected[key];

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Pass A: Outer Neon Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = isConnected ? 18 : 10;
      ctx.strokeStyle = color;
      ctx.lineWidth = cellW * 0.34;
      ctx.globalAlpha = isConnected ? 0.75 : 0.6;
      strokePath(ctx, path, padding, cellW, cellH);

      // Pass B: Solid Vibrant Wire Body
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = cellW * 0.28;
      ctx.strokeStyle = color;
      strokePath(ctx, path, padding, cellW, cellH);

      // Pass C: Bright Inner Energy Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = cellW * 0.08;
      ctx.globalAlpha = isConnected ? 0.95 : 0.7;
      strokePath(ctx, path, padding, cellW, cellH);

      // Pass D: Animated Electric Spark Pulses along completed wire
      if (isConnected) {
        const pulseT = (pulsePhase * 0.4) % 1;
        const totalSegs = path.length - 1;
        const curSeg = Math.min(totalSegs - 1, Math.floor(pulseT * totalSegs));
        const segFrac = (pulseT * totalSegs) - curSeg;

        const pA = path[curSeg];
        const pB = path[curSeg + 1];
        if (pA && pB) {
          const sx = padding + (pA.c + 0.5 + (pB.c - pA.c) * segFrac) * cellW;
          const sy = padding + (pA.r + 0.5 + (pB.r - pA.r) * segFrac) * cellH;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(sx, sy, cellW * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // 3. Draw Endpoints (Circular Nodes)
    for (const p of flowState.pairs) {
      const isConn = flowState.connected[p.key];
      drawEndpointNode(ctx, p.p1.r, p.p1.c, p.color, isConn, padding, cellW, cellH);
      drawEndpointNode(ctx, p.p2.r, p.p2.c, p.color, isConn, padding, cellW, cellH);
    }

    // 4. Draw Active Drag Pointer Flare
    if (flowState.activeKey && pointerPos) {
      const pair = flowState.pairs.find(p => p.key === flowState.activeKey);
      if (pair) {
        ctx.save();
        ctx.shadowColor = pair.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pointerPos.x, pointerPos.y, cellW * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pair.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pointerPos.x, pointerPos.y, cellW * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Draw Keyboard Cursor Frame
    if (cursor.active) {
      const cx = padding + cursor.c * cellW;
      const cy = padding + cursor.r * cellH;
      ctx.save();
      ctx.strokeStyle = '#d5ff55';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#d5ff55';
      ctx.shadowBlur = 8;
      roundRect(ctx, cx + 4, cy + 4, cellW - 8, cellH - 8, 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  function strokePath(c, path, pad, cw, ch) {
    if (path.length < 2) return;
    c.beginPath();
    c.moveTo(pad + (path[0].c + 0.5) * cw, pad + (path[0].r + 0.5) * ch);
    for (let i = 1; i < path.length; i++) {
      c.lineTo(pad + (path[i].c + 0.5) * cw, pad + (path[i].r + 0.5) * ch);
    }
    c.stroke();
  }

  function drawEndpointNode(c, r, col, color, isConnected, pad, cw, ch) {
    const cx = pad + (col + 0.5) * cw;
    const cy = pad + (r + 0.5) * ch;
    const radius = cw * 0.32;
    const pulseScale = isConnected ? 1.0 : (1.0 + Math.sin(pulsePhase * 2) * 0.05);

    c.save();

    // Outer Glow Halo
    c.shadowColor = color;
    c.shadowBlur = isConnected ? 22 : 14;

    // Glowing Ring
    c.strokeStyle = color;
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(cx, cy, radius * pulseScale, 0, Math.PI * 2);
    c.stroke();

    // Filled Gradient Core
    const grad = c.createRadialGradient(
      cx - radius * 0.25,
      cy - radius * 0.25,
      radius * 0.1,
      cx,
      cy,
      radius * 0.85
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, '#0b0e14');

    c.fillStyle = grad;
    c.beginPath();
    c.arc(cx, cy, radius * 0.8 * pulseScale, 0, Math.PI * 2);
    c.fill();

    // Specular Highlight
    c.fillStyle = 'rgba(255, 255, 255, 0.65)';
    c.beginPath();
    c.arc(cx - radius * 0.25, cy - radius * 0.25, radius * 0.25, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  function roundRect(c, x, y, width, height, radius) {
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + width - radius, y);
    c.quadraticCurveTo(x + width, y, x + width, y + radius);
    c.lineTo(x + width, y + height - radius);
    c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    c.lineTo(x + radius, y + height);
    c.quadraticCurveTo(x, y + height, x, y + height - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y);
    c.closePath();
  }

  /**
   * Pointer Event Coordinates to Grid Cell
   */
  function getCellFromCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const padding = 12;
    const boardW = rect.width - padding * 2;
    const boardH = rect.height - padding * 2;
    const cellW = boardW / flowState.cols;
    const cellH = boardH / flowState.rows;

    const c = Math.floor((x - padding) / cellW);
    const r = Math.floor((y - padding) / cellH);

    return {
      r: Math.max(0, Math.min(flowState.rows - 1, r)),
      c: Math.max(0, Math.min(flowState.cols - 1, c)),
      inBounds: r >= 0 && r < flowState.rows && c >= 0 && c < flowState.cols,
      localX: x,
      localY: y
    };
  }

  /**
   * Pointer Handlers (Touch & Mouse unified)
   */
  let isPointerDown = false;

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (isPaused || flowState.isSolved) return;
    canvas.setPointerCapture(e.pointerId);

    const pos = getCellFromCoords(e.clientX, e.clientY);
    if (!pos.inBounds) return;

    isPointerDown = true;
    pointerPos = { x: pos.localX, y: pos.localY };
    cursor.r = pos.r;
    cursor.c = pos.c;
    cursor.active = false;

    const res = CircuitEngine.startDrawing(flowState, pos.r, pos.c);
    if (res && res.success) {
      CircuitAudio.playStep();
      updateHUD();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isPointerDown || !flowState.activeKey || flowState.isSolved) return;
    e.preventDefault();

    const pos = getCellFromCoords(e.clientX, e.clientY);
    pointerPos = { x: pos.localX, y: pos.localY };

    if (!pos.inBounds) return;

    const ext = CircuitEngine.extendDrawing(flowState, pos.r, pos.c);
    if (ext) {
      if (ext.action === 'connected') {
        CircuitAudio.playConnect();
        updateHUD();
        checkAndHandleCompletion();
      } else if (ext.action === 'step') {
        CircuitAudio.playStep();
        updateHUD();
      } else if (ext.action === 'backtrack' || ext.action === 'loop') {
        CircuitAudio.playStep();
        updateHUD();
      }
    }
  });

  function onPointerEnd(e) {
    if (!isPointerDown) return;
    isPointerDown = false;
    pointerPos = null;

    if (flowState.activeKey) {
      CircuitEngine.finishDrawing(flowState);
      updateHUD();
      checkAndHandleCompletion();
    }
  }

  canvas.addEventListener('pointerup', onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);

  /**
   * Victory / Completion Check
   */
  function checkAndHandleCompletion() {
    const res = CircuitEngine.checkBoardCompletion(flowState);
    if (res.isSolved) {
      stopTimer();
      CircuitAudio.playWin();

      // Save Stars
      const lvlId = flowState.level.id;
      const prevStars = userStars[lvlId] || 0;
      if (res.stars > prevStars) {
        userStars[lvlId] = res.stars;
        try {
          localStorage.setItem(STORAGE_STARS_KEY, JSON.stringify(userStars));
        } catch (e) {}
      }

      // Unlock next level if available
      const nextIdx = currentLevelIdx + 1;
      if (nextIdx < CircuitEngine.LEVELS.length) {
        try {
          localStorage.setItem(STORAGE_LEVEL_KEY, nextIdx.toString());
        } catch (e) {}
      }

      setTimeout(() => {
        showWinOverlay(res.stars);
      }, 350);
    } else if (flowState.moves >= flowState.level.moveLimit) {
      showOverloadOverlay();
    }
  }

  function showWinOverlay(stars) {
    hideAllOverlays();
    if (overlayWin) {
      overlayWin.classList.add('active');
      if (winStarsVal) winStarsVal.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
      if (winMovesVal) winMovesVal.textContent = flowState.moves.toString();
      if (winParVal) winParVal.textContent = flowState.level.par.toString();
      if (winTimeVal && timerDisplay) winTimeVal.textContent = timerDisplay.textContent;
    }
  }

  function showOverloadOverlay() {
    hideAllOverlays();
    if (overlayOverload) {
      overlayOverload.classList.add('active');
    }
  }

  function hideAllOverlays() {
    [overlayWin, overlayOverload, overlayLevelSelect].forEach(ov => {
      if (ov) ov.classList.remove('active');
    });
  }

  /**
   * Level Selection Modal
   */
  function openLevelSelect() {
    if (!overlayLevelSelect || !levelGridContainer) return;
    levelGridContainer.innerHTML = '';

    CircuitEngine.LEVELS.forEach((lvl, idx) => {
      const btn = document.createElement('button');
      btn.className = 'level-item-btn';
      if (idx === currentLevelIdx) btn.classList.add('current');

      const stars = userStars[lvl.id] || 0;
      const starsStr = stars > 0 ? '★'.repeat(stars) : '☆☆☆';

      btn.innerHTML = `
        <span class="lvl-num">Lvl ${lvl.id}</span>
        <span class="lvl-size">${lvl.rows}x${lvl.cols}</span>
        <span class="lvl-stars">${starsStr}</span>
      `;

      btn.addEventListener('click', () => {
        loadLevel(idx);
        hideAllOverlays();
      });

      levelGridContainer.appendChild(btn);
    });

    overlayLevelSelect.classList.add('active');
  }

  /**
   * Button Event Handlers
   */
  if (hintBtn) {
    hintBtn.addEventListener('click', () => {
      if (flowState.isSolved) return;
      const res = CircuitEngine.applyHint(flowState);
      if (res && res.success) {
        CircuitAudio.playHint();
        updateHUD();
        checkAndHandleCompletion();
      }
    });
  }

  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      if (CircuitEngine.undoMove(flowState)) {
        CircuitAudio.playUndo();
        updateHUD();
        hideAllOverlays();
      }
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      CircuitAudio.playStep();
      loadLevel(currentLevelIdx);
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      isPaused = !isPaused;
      pauseBtn.textContent = isPaused ? '▶' : '⏸';
      pauseBtn.title = isPaused ? 'Resume Game' : 'Pause Game';
    });
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      const muted = CircuitAudio.toggleMute();
      if (audioIcon) audioIcon.textContent = muted ? '🔇' : '🔊';
    });
  }

  if (levelSelectBtn) {
    levelSelectBtn.addEventListener('click', openLevelSelect);
  }

  if (closeLevelSelectBtn) {
    closeLevelSelectBtn.addEventListener('click', () => {
      overlayLevelSelect.classList.remove('active');
    });
  }

  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', () => {
      const nextIdx = (currentLevelIdx + 1) % CircuitEngine.LEVELS.length;
      loadLevel(nextIdx);
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      loadLevel(currentLevelIdx);
    });
  }

  if (overloadRestartBtn) {
    overloadRestartBtn.addEventListener('click', () => {
      loadLevel(currentLevelIdx);
    });
  }

  if (overloadUndoBtn) {
    overloadUndoBtn.addEventListener('click', () => {
      hideAllOverlays();
      if (CircuitEngine.undoMove(flowState)) {
        CircuitAudio.playUndo();
        updateHUD();
      }
    });
  }

  /**
   * Keyboard Controls
   */
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.key === 'u' || e.key === 'U') {
      if (undoBtn) undoBtn.click();
      return;
    }
    if (e.key === 'h' || e.key === 'H') {
      if (hintBtn) hintBtn.click();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      if (restartBtn) restartBtn.click();
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      if (pauseBtn) pauseBtn.click();
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      if (audioToggleBtn) audioToggleBtn.click();
      return;
    }

    if (!flowState || flowState.isSolved || isPaused) return;

    cursor.active = true;
    let moved = false;

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      cursor.r = Math.max(0, cursor.r - 1);
      moved = true;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      cursor.r = Math.min(flowState.rows - 1, cursor.r + 1);
      moved = true;
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      cursor.c = Math.max(0, cursor.c - 1);
      moved = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      cursor.c = Math.min(flowState.cols - 1, cursor.c + 1);
      moved = true;
    } else if (e.code === 'Space' || e.key === 'Enter') {
      if (flowState.activeKey) {
        CircuitEngine.finishDrawing(flowState);
        updateHUD();
        checkAndHandleCompletion();
      } else {
        const res = CircuitEngine.startDrawing(flowState, cursor.r, cursor.c);
        if (res && res.success) {
          CircuitAudio.playStep();
          updateHUD();
        }
      }
      return;
    }

    // Number keys 1-8 to jump to endpoint
    const num = parseInt(e.key, 10);
    if (!isNaN(num) && num >= 1 && num <= flowState.pairs.length) {
      const p = flowState.pairs[num - 1];
      cursor.r = p.p1.r;
      cursor.c = p.p1.c;
      CircuitEngine.startDrawing(flowState, cursor.r, cursor.c);
      CircuitAudio.playStep();
      updateHUD();
      return;
    }

    // If drawing is active, step along keyboard movement
    if (moved && flowState.activeKey) {
      const ext = CircuitEngine.extendDrawing(flowState, cursor.r, cursor.c);
      if (ext) {
        if (ext.action === 'connected') {
          CircuitAudio.playConnect();
          updateHUD();
          checkAndHandleCompletion();
        } else {
          CircuitAudio.playStep();
          updateHUD();
        }
      }
    }
  });

  // Start
  loadLevel(currentLevelIdx);
  renderLoop();

})();
