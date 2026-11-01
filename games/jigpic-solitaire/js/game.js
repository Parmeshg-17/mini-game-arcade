/**
 * Jigpic Solitaire — Main Game Controller & UI Orchestrator
 * Connects Engine, Scenes, Audio, and Player Touch/Mouse/Keyboard Interactions.
 */
(function() {
  'use strict';

  const Engine = window.JigpicEngine || {};
  const Scenes = window.JigpicScenes || {};
  const Audio = window.JigpicAudio || {};

  // State
  let currentLevelIndex = 0;
  let state = null;
  let timerInterval = null;
  let focusedSlotIndex = 0;
  let isPeeking = false;
  let dragPieceIndex = null;

  // DOM Elements
  const el = {
    sceneTitle: document.getElementById('jig-scene-title'),
    sceneDesc: document.getElementById('jig-scene-desc'),
    levelSelect: document.getElementById('jig-level-select'),
    timerVal: document.getElementById('jig-timer-val'),
    movesVal: document.getElementById('jig-moves-val'),
    progressVal: document.getElementById('jig-progress-val'),
    progressFill: document.getElementById('jig-progress-fill'),
    scoreVal: document.getElementById('jig-score-val'),
    board: document.getElementById('jig-board'),
    deckBtn: document.getElementById('jig-deck-btn'),
    deckCount: document.getElementById('jig-deck-count'),
    handSlots: document.getElementById('jig-hand-slots'),
    peekOverlay: document.getElementById('jig-peek-overlay'),
    peekArtwork: document.getElementById('jig-peek-artwork'),
    btnPeek: document.getElementById('btn-peek'),
    btnHint: document.getElementById('btn-hint'),
    btnUndo: document.getElementById('btn-undo'),
    btnRestart: document.getElementById('btn-restart'),
    btnMute: document.getElementById('btn-mute'),
    modalComplete: document.getElementById('modal-complete'),
    modalStars: document.getElementById('modal-stars'),
    modalScore: document.getElementById('modal-score'),
    modalMoves: document.getElementById('modal-moves'),
    modalTime: document.getElementById('modal-time'),
    btnNextScene: document.getElementById('btn-next-scene'),
    btnReplay: document.getElementById('btn-replay'),
    toast: document.getElementById('jig-toast')
  };

  function init() {
    setupLevelSelector();
    startLevel(0);
    setupEvents();
    updateMuteButton();
  }

  function setupLevelSelector() {
    if (!el.levelSelect || !Engine.SCENES) return;
    el.levelSelect.innerHTML = Engine.SCENES.map((sc, idx) => `
      <option value="${idx}">Scene ${idx + 1}: ${sc.title}</option>
    `).join('');
    el.levelSelect.addEventListener('change', (e) => {
      startLevel(parseInt(e.target.value, 10));
    });
  }

  function startLevel(index) {
    currentLevelIndex = index;
    if (el.levelSelect) el.levelSelect.value = index;

    state = Engine.createGameState(currentLevelIndex);
    focusedSlotIndex = 0;
    isPeeking = false;

    if (el.peekOverlay) el.peekOverlay.classList.add('hidden');
    if (el.modalComplete) el.modalComplete.classList.add('hidden');

    if (el.sceneTitle) el.sceneTitle.textContent = state.scene.title;
    if (el.sceneDesc) el.sceneDesc.textContent = state.scene.description;

    // Start timer
    clearInterval(timerInterval);
    updateHUD();
    timerInterval = setInterval(() => {
      if (state && !state.isWon && !state.isPaused) {
        state.timeElapsed++;
        updateTimerDisplay();
      }
    }, 1000);

    renderBoard();
    renderTray();
    renderPeekArtwork();
    Audio.playCardDraw();
  }

  function updateTimerDisplay() {
    if (!el.timerVal || !state) return;
    const mins = Math.floor(state.timeElapsed / 60);
    const secs = state.timeElapsed % 60;
    el.timerVal.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function updateHUD() {
    if (!state) return;
    updateTimerDisplay();
    if (el.movesVal) el.movesVal.textContent = state.moves;
    if (el.scoreVal) el.scoreVal.textContent = state.score.toLocaleString();
    if (el.progressVal) el.progressVal.textContent = `${state.placedCount} / ${state.totalPieces}`;

    if (el.progressFill) {
      const pct = Math.round((state.placedCount / state.totalPieces) * 100);
      el.progressFill.style.width = `${pct}%`;
    }

    if (el.deckCount) {
      el.deckCount.textContent = state.deck.length;
    }
  }

  function renderBoard() {
    if (!el.board || !state) return;
    const { rows, cols } = state.scene;

    el.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    el.board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Calculate aspect ratio
    const aspect = cols / rows;
    el.board.style.aspectRatio = `${aspect}`;

    el.board.innerHTML = '';

    for (let i = 0; i < state.totalPieces; i++) {
      const slot = document.createElement('div');
      slot.className = 'jig-slot';
      slot.id = `slot-${i}`;
      slot.dataset.slotIndex = i;
      slot.tabIndex = 0;
      slot.setAttribute('role', 'button');
      slot.setAttribute('aria-label', `Picture slot ${i + 1}`);

      const pieceIndex = state.grid[i];
      if (pieceIndex !== null) {
        // Placed & locked
        slot.classList.add('occupied');
        slot.innerHTML = `
          <div class="jig-piece-frame placed">
            ${Scenes.getPieceSvg(state.scene.id, pieceIndex)}
          </div>
        `;
      } else {
        // Empty slot
        slot.classList.add('empty');
        slot.innerHTML = `
          <div class="slot-ghost-guide">
            <span class="slot-coord">${i + 1}</span>
          </div>
        `;

        // Check if selected hand card matches this slot $\to$ highlight hint!
        const currentSelectedPiece = state.hand[state.selectedHandIndex];
        if (currentSelectedPiece === i) {
          slot.classList.add('can-place');
        }
      }

      // Slot Click
      slot.addEventListener('click', () => handleSlotClick(i));

      // Drag over / Drop
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        handleDropOnSlot(i);
      });

      el.board.appendChild(slot);
    }
  }

  function renderTray() {
    if (!el.handSlots || !state) return;
    el.handSlots.innerHTML = '';

    state.hand.forEach((pieceIdx, handIdx) => {
      const isSelected = handIdx === state.selectedHandIndex;
      const card = document.createElement('div');
      card.className = `jig-hand-card ${isSelected ? 'active' : ''}`;
      card.id = `hand-card-${handIdx}`;
      card.draggable = true;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Piece card ${pieceIdx + 1}`);

      card.innerHTML = `
        <div class="card-inner">
          <div class="card-preview">
            ${Scenes.getPieceSvg(state.scene.id, pieceIdx)}
          </div>
          <div class="card-meta">
            <span class="card-key-badge">${handIdx + 1}</span>
            <span class="card-piece-num">#${pieceIdx + 1}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        state.selectedHandIndex = handIdx;
        Audio.playCardSelect();
        renderTray();
        renderBoard(); // refresh can-place highlights
      });

      // Drag support
      card.addEventListener('dragstart', () => {
        state.selectedHandIndex = handIdx;
        dragPieceIndex = pieceIdx;
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        dragPieceIndex = null;
      });

      el.handSlots.appendChild(card);
    });

    if (el.deckCount) {
      el.deckCount.textContent = state.deck.length;
    }
  }

  function renderPeekArtwork() {
    if (!el.peekArtwork || !state) return;
    el.peekArtwork.innerHTML = Scenes.getFullArtworkSvg(state.scene.id);
  }

  function handleSlotClick(slotIndex) {
    if (!state || state.isWon) return;

    // If slot is empty:
    if (state.grid[slotIndex] === null) {
      // If currently selected hand card does NOT match, but another hand card DOES match:
      const matchInHand = Engine.findHandMatchForSlot(state, slotIndex);
      if (matchInHand !== -1 && matchInHand !== state.selectedHandIndex) {
        state.selectedHandIndex = matchInHand;
      }

      const res = Engine.placePiece(state, slotIndex);
      if (res.success && res.correct) {
        Audio.playSnap();
        showToast(`Piece #${res.piece + 1} snapped into place! (+${res.points} pts)`);
        renderBoard();
        renderTray();
        updateHUD();

        // Trigger snap particle effect on the slot
        triggerSnapSparkle(slotIndex);

        if (res.isWon) {
          handleWin();
        }
      } else {
        Audio.playError();
        showToast(`Piece does not fit here. Look closely at the pattern!`);
        updateHUD();
        // Shake animation on slot
        const slotEl = document.getElementById(`slot-${slotIndex}`);
        if (slotEl) {
          slotEl.classList.add('mismatch-shake');
          setTimeout(() => slotEl.classList.remove('mismatch-shake'), 400);
        }
      }
    }
  }

  function handleDropOnSlot(slotIndex) {
    if (!state || state.isWon) return;
    handleSlotClick(slotIndex);
  }

  function triggerSnapSparkle(slotIndex) {
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (!slotEl) return;
    slotEl.classList.add('snap-flash');
    setTimeout(() => slotEl.classList.remove('snap-flash'), 600);
  }

  function handleWin() {
    clearInterval(timerInterval);
    Audio.playWin();

    const stars = Engine.calculateStars(state.moves, state.timeElapsed, state.scene.parMoves, state.scene.parTime);

    if (el.modalStars) {
      el.modalStars.innerHTML = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    }
    if (el.modalScore) el.modalScore.textContent = state.score.toLocaleString();
    if (el.modalMoves) el.modalMoves.textContent = state.moves;
    if (el.modalTime) {
      const mins = Math.floor(state.timeElapsed / 60);
      const secs = state.timeElapsed % 60;
      el.modalTime.textContent = `${mins}m ${secs}s`;
    }

    if (el.modalComplete) {
      el.modalComplete.classList.remove('hidden');
    }
  }

  function triggerDraw() {
    if (!state || state.isWon) return;
    const drawn = Engine.cycleDrawDeck(state);
    if (drawn) {
      Audio.playCardDraw();
      renderTray();
      renderBoard();
      updateHUD();
      showToast('Drew from deck');
    } else {
      showToast('Deck and hand are settled');
    }
  }

  function triggerHint() {
    if (!state || state.isWon) return;
    const hint = Engine.getHint(state);
    if (!hint) return;

    if (hint.type === 'hand_to_slot') {
      Audio.playCardSelect();
      renderTray();
      renderBoard();
      updateHUD();

      const slotEl = document.getElementById(`slot-${hint.targetSlot}`);
      const cardEl = document.getElementById(`hand-card-${hint.handIndex}`);

      if (slotEl) {
        slotEl.classList.add('hint-pulse');
        setTimeout(() => slotEl.classList.remove('hint-pulse'), 3000);
      }
      if (cardEl) {
        cardEl.classList.add('hint-pulse');
        setTimeout(() => cardEl.classList.remove('hint-pulse'), 3000);
      }
      showToast(`Hint: Card #${hint.piece + 1} fits into slot ${hint.targetSlot + 1}`);
    } else if (hint.type === 'draw_card') {
      showToast(hint.message);
      if (el.deckBtn) {
        el.deckBtn.classList.add('hint-pulse');
        setTimeout(() => el.deckBtn.classList.remove('hint-pulse'), 3000);
      }
    }
  }

  function triggerUndo() {
    if (!state || state.isWon) return;
    const undone = Engine.undoMove(state);
    if (undone) {
      renderBoard();
      renderTray();
      updateHUD();
      showToast('Undid last action');
    } else {
      showToast('Nothing to undo');
    }
  }

  function togglePeek() {
    if (!el.peekOverlay) return;
    isPeeking = !isPeeking;
    if (isPeeking) {
      Audio.playPeek();
      el.peekOverlay.classList.remove('hidden');
      if (el.btnPeek) el.btnPeek.classList.add('active');
    } else {
      el.peekOverlay.classList.add('hidden');
      if (el.btnPeek) el.btnPeek.classList.remove('active');
    }
  }

  function updateMuteButton() {
    if (!el.btnMute) return;
    const muted = Audio.getIsMuted();
    el.btnMute.textContent = muted ? '🔇' : '🔊';
  }

  let toastTimeout = null;
  function showToast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      if (el.toast) el.toast.classList.add('hidden');
    }, 2000);
  }

  function setupEvents() {
    // Deck Click
    if (el.deckBtn) {
      el.deckBtn.addEventListener('click', triggerDraw);
    }

    // Action Buttons
    if (el.btnPeek) el.btnPeek.addEventListener('click', togglePeek);
    if (el.peekOverlay) el.peekOverlay.addEventListener('click', togglePeek);
    if (el.btnHint) el.btnHint.addEventListener('click', triggerHint);
    if (el.btnUndo) el.btnUndo.addEventListener('click', triggerUndo);
    if (el.btnRestart) el.btnRestart.addEventListener('click', () => startLevel(currentLevelIndex));

    if (el.btnMute) {
      el.btnMute.addEventListener('click', () => {
        Audio.toggleMute();
        updateMuteButton();
      });
    }

    // Modal Actions
    if (el.btnNextScene) {
      el.btnNextScene.addEventListener('click', () => {
        const nextIdx = (currentLevelIndex + 1) % Engine.SCENES.length;
        startLevel(nextIdx);
      });
    }

    if (el.btnReplay) {
      el.btnReplay.addEventListener('click', () => {
        startLevel(currentLevelIndex);
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't intercept when user is typing in form inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const key = e.key.toLowerCase();

      // Number keys 1, 2, 3 select hand cards
      if (['1', '2', '3'].includes(key)) {
        const idx = parseInt(key, 10) - 1;
        if (state && idx < state.hand.length) {
          state.selectedHandIndex = idx;
          Audio.playCardSelect();
          renderTray();
          renderBoard();
        }
      } else if (key === 'd' || key === ' ') {
        e.preventDefault();
        triggerDraw();
      } else if (key === 'p') {
        togglePeek();
      } else if (key === 'h') {
        triggerHint();
      } else if (key === 'u') {
        triggerUndo();
      } else if (key === 'r') {
        startLevel(currentLevelIndex);
      } else if (key === 'm') {
        Audio.toggleMute();
        updateMuteButton();
      } else if (key === 'arrowright' || key === 'arrowleft' || key === 'arrowup' || key === 'arrowdown') {
        // Navigate slots with arrow keys
        if (!state) return;
        e.preventDefault();
        const { rows, cols } = state.scene;
        let r = Math.floor(focusedSlotIndex / cols);
        let c = focusedSlotIndex % cols;

        if (key === 'arrowright') c = (c + 1) % cols;
        if (key === 'arrowleft') c = (c - 1 + cols) % cols;
        if (key === 'arrowdown') r = (r + 1) % rows;
        if (key === 'arrowup') r = (r - 1 + rows) % rows;

        focusedSlotIndex = r * cols + c;
        const targetEl = document.getElementById(`slot-${focusedSlotIndex}`);
        if (targetEl) targetEl.focus();
      } else if (key === 'enter') {
        // Place selected card into focused slot
        handleSlotClick(focusedSlotIndex);
      }
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
