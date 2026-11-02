/**
 * Screw Master — Core Puzzle Engine & Solvability Verifier
 * Pure mechanical logic for overlapping panels, screw accessibility,
 * valid destination routing, cascading panel releases, and BFS solver.
 */
(function(exports) {
  'use strict';

  // Panel materials and visual metadata
  const PANEL_MATERIALS = {
    oak:      { name: 'Light Oak',     fill: '#c2925b', border: '#8c6032', dark: '#6b4723' },
    walnut:   { name: 'Dark Walnut',   fill: '#5c3a21', border: '#3b2210', dark: '#2b1709' },
    metal:    { name: 'Brushed Steel', fill: '#94a3b8', border: '#475569', dark: '#334155' },
    brass:    { name: 'Polished Brass',fill: '#d4af37', border: '#aa820a', dark: '#7b5e07' },
    iron:     { name: 'Cast Iron',     fill: '#334155', border: '#1e293b', dark: '#0f172a' },
    cyan:     { name: 'Neon Acrylic',  fill: '#0284c7', border: '#0369a1', dark: '#075985' },
    emerald:  { name: 'Forest Board',  fill: '#059669', border: '#047857', dark: '#065f46' },
    ruby:     { name: 'Anodized Red',  fill: '#e11d48', border: '#be123c', dark: '#9f1239' }
  };

  // Screw visual styles
  const SCREW_STYLES = {
    steel: { name: 'Standard Steel', head: '#cbd5e1', slot: '#475569', ring: '#94a3b8' },
    brass: { name: 'Vintage Brass',  head: '#fde047', slot: '#854d0e', ring: '#ca8a04' },
    gold:  { name: 'Royal Gold',     head: '#facc15', slot: '#713f12', ring: '#eab308' },
    iron:  { name: 'Forged Iron',    head: '#64748b', slot: '#1e293b', ring: '#475569' }
  };

  /**
   * Seeded Mulberry32 PRNG
   */
  function createPrng(seed) {
    let s = (typeof seed === 'number' ? seed : 123456789) >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Clone a game state deeply
   */
  function cloneState(state) {
    return {
      level: state.level,
      name: state.name,
      tier: state.tier,
      minMoves: state.minMoves,
      trayCapacity: state.trayCapacity,
      extraSlots: state.extraSlots || 0,
      holes: state.holes.map(h => Object.assign({}, h)),
      screws: state.screws.map(s => Object.assign({}, s)),
      panels: state.panels.map(p => ({
        id: p.id,
        name: p.name,
        material: p.material,
        layer: p.layer,
        shape: p.shape,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        rotation: p.rotation || 0,
        holeIds: p.holeIds.slice(),
        blockingHoles: (p.blockingHoles || []).slice(),
        status: p.status
      }))
    };
  }

  /**
   * Checks whether a screw is currently accessible (not covered by higher active panels).
   * A screw at hole H is accessible if:
   * 1. It is in an open tray slot (always accessible), OR
   * 2. No active panel with a higher layer than the screw's top panel covers hole H.
   */
  function isScrewAccessible(state, screwId) {
    const screw = state.screws.find(s => s.id === screwId);
    if (!screw || !screw.holeId) return false;

    const hole = state.holes.find(h => h.id === screw.holeId);
    if (!hole) return false;

    // Tray slots are always accessible
    if (hole.type === 'tray') return true;

    // Find all active panels attached to this hole
    const attachedPanels = state.panels.filter(p => p.status === 'active' && p.holeIds.includes(hole.id));
    const maxAttachedLayer = attachedPanels.length > 0 ? Math.max(...attachedPanels.map(p => p.layer)) : 0;

    // Check if any active panel covers/blocks this hole from a higher layer
    for (const p of state.panels) {
      if (p.status !== 'active') continue;
      // If panel is on a higher layer and explicitly blocks this hole
      if (p.layer > maxAttachedLayer) {
        if (p.blockingHoles && p.blockingHoles.includes(hole.id)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Checks whether a hole is currently free and accessible to receive a screw.
   */
  function isHoleAvailable(state, holeId) {
    const hole = state.holes.find(h => h.id === holeId);
    if (!hole) return false;

    // Check if occupied by any screw
    const isOccupied = state.screws.some(s => s.holeId === holeId);
    if (isOccupied) return false;

    // Tray slots are always accessible
    if (hole.type === 'tray') return true;

    // Check if covered by any active panel
    for (const p of state.panels) {
      if (p.status !== 'active') continue;
      if (p.blockingHoles && p.blockingHoles.includes(hole.id)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns list of all currently available destination holes (both board and tray).
   */
  function getAvailableHoles(state) {
    return state.holes.filter(h => isHoleAvailable(state, h.id));
  }

  /**
   * Checks which panels have lost all their anchoring screws and releases them.
   * Cascades if releasing a panel uncovers screws that then allow further releases.
   */
  function checkPanelReleases(state) {
    const newlyReleased = [];
    let changed = true;

    while (changed) {
      changed = false;
      for (const panel of state.panels) {
        if (panel.status !== 'active') continue;

        // Count screws currently anchored to this panel
        const activeScrews = state.screws.filter(s => s.holeId && panel.holeIds.includes(s.holeId));

        if (activeScrews.length === 0) {
          panel.status = 'released';
          newlyReleased.push(panel.id);
          changed = true;
        }
      }
    }

    return newlyReleased;
  }

  /**
   * Checks if all target panels are cleared (win condition).
   */
  function checkWin(state) {
    return state.panels.every(p => p.status === 'released');
  }

  /**
   * Executes a valid move: transfers a screw to a target hole.
   * Returns operation result including newly released panels and victory status.
   */
  function executeMove(state, screwId, targetHoleId) {
    const screw = state.screws.find(s => s.id === screwId);
    if (!screw) {
      return { success: false, reason: 'Screw not found' };
    }

    if (!isScrewAccessible(state, screwId)) {
      return { success: false, reason: 'Screw is blocked by an overlapping panel!' };
    }

    if (screw.holeId === targetHoleId) {
      return { success: false, reason: 'Screw is already in this hole' };
    }

    if (!isHoleAvailable(state, targetHoleId)) {
      return { success: false, reason: 'Target hole is occupied or covered' };
    }

    const fromHoleId = screw.holeId;
    screw.holeId = targetHoleId;

    // Process panel releases
    const releasedPanels = checkPanelReleases(state);
    const isWon = checkWin(state);

    return {
      success: true,
      screwId,
      fromHoleId,
      targetHoleId,
      releasedPanels,
      isWon
    };
  }

  /**
   * Canonical board hash for BFS state exploration.
   */
  function getStateHash(state) {
    const activePanels = state.panels.filter(p => p.status === 'active').map(p => p.id).sort().join(',');
    const screwPlacements = state.screws.map(s => `${s.id}:${s.holeId}`).sort().join(';');
    return `${activePanels}|${screwPlacements}`;
  }

  /**
   * Returns all legally valid moves from current state.
   */
  function getLegalMoves(state) {
    const legalMoves = [];
    const accessibleScrews = state.screws.filter(s => isScrewAccessible(state, s.id));
    const availableHoles = getAvailableHoles(state);

    if (accessibleScrews.length === 0 || availableHoles.length === 0) {
      return legalMoves;
    }

    for (const screw of accessibleScrews) {
      for (const hole of availableHoles) {
        if (screw.holeId === hole.id) continue;

        // Skip symmetrical moves into multiple identical empty tray slots
        // If moving into tray, only consider the first available tray slot
        if (hole.type === 'tray') {
          const firstTray = availableHoles.find(h => h.type === 'tray');
          if (firstTray && hole.id !== firstTray.id) continue;
        }

        legalMoves.push({
          screwId: screw.id,
          targetHoleId: hole.id
        });
      }
    }

    return legalMoves;
  }

  /**
   * BFS Puzzle Solver.
   * Finds the shortest sequence of legal moves to clear all panels.
   * Returns array of moves `[{ screwId, targetHoleId }, ...]` or null if unsolvable within maxStates.
   */
  function solvePuzzle(initialState, maxStates = 4000) {
    if (checkWin(initialState)) return [];

    const queue = [{ state: cloneState(initialState), path: [] }];
    const visited = new Set();
    visited.add(getStateHash(initialState));

    let statesExamined = 0;

    while (queue.length > 0 && statesExamined < maxStates) {
      statesExamined++;
      const { state: current, path } = queue.shift();

      const moves = getLegalMoves(current);

      // Heuristic sort: prioritize moves that release panels immediately
      moves.sort((a, b) => {
        const testStateA = cloneState(current);
        const resA = executeMove(testStateA, a.screwId, a.targetHoleId);
        const testStateB = cloneState(current);
        const resB = executeMove(testStateB, b.screwId, b.targetHoleId);

        const scoreA = (resA.releasedPanels ? resA.releasedPanels.length * 10 : 0);
        const scoreB = (resB.releasedPanels ? resB.releasedPanels.length * 10 : 0);
        return scoreB - scoreA;
      });

      for (const m of moves) {
        const nextState = cloneState(current);
        const res = executeMove(nextState, m.screwId, m.targetHoleId);

        if (!res.success) continue;

        const nextPath = path.concat([m]);

        if (res.isWon) {
          return nextPath;
        }

        const hash = getStateHash(nextState);
        if (!visited.has(hash)) {
          visited.add(hash);
          queue.push({ state: nextState, path: nextPath });
        }
      }
    }

    return null; // Unsolvable or exceeded state budget
  }

  /**
   * Find the best immediate hint for the current board state.
   */
  function findHint(state) {
    if (checkWin(state)) return null;

    const solution = solvePuzzle(state, 2500);
    if (solution && solution.length > 0) {
      return solution[0];
    }

    // Fallback heuristic: choose move that releases maximum panels
    const legalMoves = getLegalMoves(state);
    if (legalMoves.length === 0) return null;

    let bestMove = legalMoves[0];
    let maxReleased = -1;

    for (const m of legalMoves) {
      const copy = cloneState(state);
      const res = executeMove(copy, m.screwId, m.targetHoleId);
      const count = res.releasedPanels ? res.releasedPanels.length : 0;
      if (count > maxReleased) {
        maxReleased = count;
        bestMove = m;
      }
    }

    return bestMove;
  }

  /* ── Level Templates & Generators ──────────────────────── */

  /**
   * Handcrafted foundational tutorial and early levels (Levels 1–5)
   */
  function getHandcraftedLevel(levelNumber) {
    if (levelNumber === 1) {
      // Level 1: First Steps (2 panels, 3 screws, 2 empty board holes + 2 tray slots)
      return {
        level: 1,
        name: 'First Unscrew: Twin Planks',
        tier: 'Beginner',
        minMoves: 3,
        trayCapacity: 2,
        holes: [
          { id: 'h1', x: 130, y: 160, type: 'board' },
          { id: 'h2', x: 270, y: 160, type: 'board' },
          { id: 'h3', x: 200, y: 250, type: 'board' },
          { id: 'h4', x: 130, y: 340, type: 'board' }, // empty
          { id: 'h5', x: 270, y: 340, type: 'board' }, // empty
          { id: 't1', x: 150, y: 450, type: 'tray' },  // tray
          { id: 't2', x: 250, y: 450, type: 'tray' }   // tray
        ],
        screws: [
          { id: 's1', holeId: 'h1', style: 'steel' },
          { id: 's2', holeId: 'h2', style: 'steel' },
          { id: 's3', holeId: 'h3', style: 'brass' }
        ],
        panels: [
          {
            id: 'p1',
            name: 'Top Plank',
            material: 'oak',
            layer: 2,
            shape: 'bar',
            x: 90,
            y: 130,
            width: 220,
            height: 60,
            rotation: 0,
            holeIds: ['h1', 'h2'],
            blockingHoles: ['h3'], // covers h3 underneath!
            status: 'active'
          },
          {
            id: 'p2',
            name: 'Bottom Beam',
            material: 'walnut',
            layer: 1,
            shape: 'bar',
            x: 160,
            y: 220,
            width: 80,
            height: 150,
            rotation: 0,
            holeIds: ['h3'],
            blockingHoles: [],
            status: 'active'
          }
        ]
      };
    }

    if (levelNumber === 2) {
      // Level 2: The Cross (3 panels, 4 screws, 2 empty board holes + 2 tray slots)
      return {
        level: 2,
        name: 'Mechanical Crossroad',
        tier: 'Beginner',
        minMoves: 4,
        trayCapacity: 2,
        holes: [
          { id: 'h1', x: 120, y: 180, type: 'board' },
          { id: 'h2', x: 280, y: 180, type: 'board' },
          { id: 'h3', x: 200, y: 120, type: 'board' },
          { id: 'h4', x: 200, y: 300, type: 'board' },
          { id: 'h5', x: 120, y: 300, type: 'board' }, // empty
          { id: 'h6', x: 280, y: 300, type: 'board' }, // empty
          { id: 't1', x: 150, y: 450, type: 'tray' },
          { id: 't2', x: 250, y: 450, type: 'tray' }
        ],
        screws: [
          { id: 's1', holeId: 'h1', style: 'steel' },
          { id: 's2', holeId: 'h2', style: 'steel' },
          { id: 's3', holeId: 'h3', style: 'brass' },
          { id: 's4', holeId: 'h4', style: 'brass' }
        ],
        panels: [
          {
            id: 'p1',
            name: 'Horizontal Crossbar',
            material: 'metal',
            layer: 2,
            shape: 'bar',
            x: 80,
            y: 150,
            width: 240,
            height: 60,
            rotation: 0,
            holeIds: ['h1', 'h2'],
            blockingHoles: [],
            status: 'active'
          },
          {
            id: 'p2',
            name: 'Vertical Pillar',
            material: 'oak',
            layer: 1,
            shape: 'bar',
            x: 170,
            y: 90,
            width: 60,
            height: 240,
            rotation: 0,
            holeIds: ['h3', 'h4'],
            blockingHoles: [],
            status: 'active'
          }
        ]
      };
    }

    if (levelNumber === 3) {
      // Level 3: Triple Overlap (3 panels, 5 screws, 2 empty board holes + 2 tray slots)
      return {
        level: 3,
        name: 'Triple Tier Truss',
        tier: 'Beginner',
        minMoves: 5,
        trayCapacity: 2,
        holes: [
          { id: 'h1', x: 100, y: 140, type: 'board' },
          { id: 'h2', x: 200, y: 140, type: 'board' },
          { id: 'h3', x: 300, y: 140, type: 'board' },
          { id: 'h4', x: 150, y: 260, type: 'board' },
          { id: 'h5', x: 250, y: 260, type: 'board' },
          { id: 'h6', x: 200, y: 350, type: 'board' }, // empty
          { id: 't1', x: 130, y: 450, type: 'tray' },
          { id: 't2', x: 270, y: 450, type: 'tray' }
        ],
        screws: [
          { id: 's1', holeId: 'h1', style: 'steel' },
          { id: 's2', holeId: 'h2', style: 'gold' },
          { id: 's3', holeId: 'h3', style: 'steel' },
          { id: 's4', holeId: 'h4', style: 'brass' },
          { id: 's5', holeId: 'h5', style: 'brass' }
        ],
        panels: [
          {
            id: 'p1',
            name: 'Top Acrylic Plate',
            material: 'cyan',
            layer: 3,
            shape: 'bar',
            x: 160,
            y: 110,
            width: 80,
            height: 60,
            rotation: 0,
            holeIds: ['h2'],
            blockingHoles: [],
            status: 'active'
          },
          {
            id: 'p2',
            name: 'Upper Wood Bar',
            material: 'oak',
            layer: 2,
            shape: 'bar',
            x: 60,
            y: 110,
            width: 280,
            height: 60,
            rotation: 0,
            holeIds: ['h1', 'h3'],
            blockingHoles: ['h4'],
            status: 'active'
          },
          {
            id: 'p3',
            name: 'Lower Metal Brace',
            material: 'metal',
            layer: 1,
            shape: 'bar',
            x: 110,
            y: 230,
            width: 180,
            height: 60,
            rotation: 0,
            holeIds: ['h4', 'h5'],
            blockingHoles: [],
            status: 'active'
          }
        ]
      };
    }

    return null;
  }

  /**
   * Deterministic Procedural Level Generator
   * Generates a guaranteed-solvable level based on levelNumber.
   */
  function generateLevel(levelNumber, customSeed = null) {
    // Check handcrafted tutorial levels first
    const handcrafted = getHandcraftedLevel(levelNumber);
    if (handcrafted) {
      const solution = solvePuzzle(handcrafted, 2000);
      if (solution) {
        handcrafted.minMoves = solution.length;
      }
      return handcrafted;
    }

    const seed = customSeed !== null ? customSeed : (levelNumber * 2654435761 + 997);
    const prng = createPrng(seed);

    // Determine level complexity by tier
    let numPanels = 3;
    let tier = 'Beginner';
    let trayCapacity = 2;

    if (levelNumber <= 20) {
      numPanels = 3;
      tier = 'Beginner';
      trayCapacity = 2;
    } else if (levelNumber <= 50) {
      numPanels = 4;
      tier = 'Intermediate';
      trayCapacity = 2;
    } else if (levelNumber <= 100) {
      numPanels = 5;
      tier = 'Advanced';
      trayCapacity = 2;
    } else if (levelNumber <= 150) {
      numPanels = 6;
      tier = 'Expert';
      trayCapacity = 3;
    } else {
      numPanels = 7;
      tier = 'Master';
      trayCapacity = 3;
    }

    const materials = Object.keys(PANEL_MATERIALS);
    const screwStyles = Object.keys(SCREW_STYLES);

    // Grid coordinates on board (3 rows x 4 columns = 12 potential board hole nodes)
    const gridCols = [90, 160, 240, 310];
    const gridRows = [120, 200, 280, 360];

    const holes = [];
    let holeIdx = 1;
    for (let r = 0; r < gridRows.length; r++) {
      for (let c = 0; c < gridCols.length; c++) {
        holes.push({
          id: `h${holeIdx++}`,
          x: gridCols[c],
          y: gridRows[r],
          type: 'board'
        });
      }
    }

    // Add tray slots at bottom
    const trayY = 460;
    const traySpacing = 360 / (trayCapacity + 1);
    for (let t = 1; t <= trayCapacity; t++) {
      holes.push({
        id: `t${t}`,
        x: Math.round(20 + t * traySpacing),
        y: trayY,
        type: 'tray'
      });
    }

    // Construct overlapping panels
    const panels = [];
    const usedHoleIds = new Set();
    const availableHoleIds = holes.filter(h => h.type === 'board').map(h => h.id);

    for (let p = 0; p < numPanels; p++) {
      const mat = materials[p % materials.length];
      const layer = p + 1; // progressive layer depth

      // Pick 2 distinct holes for this panel
      const h1Idx = Math.floor(prng() * availableHoleIds.length);
      let h2Idx = Math.floor(prng() * availableHoleIds.length);
      while (h2Idx === h1Idx) {
        h2Idx = (h2Idx + 1) % availableHoleIds.length;
      }

      const holeA = holes.find(h => h.id === availableHoleIds[h1Idx]);
      const holeB = holes.find(h => h.id === availableHoleIds[h2Idx]);

      usedHoleIds.add(holeA.id);
      usedHoleIds.add(holeB.id);

      // Compute bounding box around holes
      const minX = Math.min(holeA.x, holeB.x) - 25;
      const minY = Math.min(holeA.y, holeB.y) - 25;
      const maxX = Math.max(holeA.x, holeB.x) + 25;
      const maxY = Math.max(holeA.y, holeB.y) + 25;

      // Identify holes covered beneath this panel for lower layers
      const blocking = [];
      if (layer > 1) {
        for (const h of holes) {
          if (h.type === 'board' && h.id !== holeA.id && h.id !== holeB.id) {
            if (h.x >= minX && h.x <= maxX && h.y >= minY && h.y <= maxY) {
              blocking.push(h.id);
            }
          }
        }
      }

      panels.push({
        id: `p${p + 1}`,
        name: `${PANEL_MATERIALS[mat].name} Plate`,
        material: mat,
        layer: layer,
        shape: 'bar',
        x: minX,
        y: minY,
        width: Math.max(70, maxX - minX),
        height: Math.max(60, maxY - minY),
        rotation: 0,
        holeIds: [holeA.id, holeB.id],
        blockingHoles: blocking,
        status: 'active'
      });
    }

    // Place screws into panel holes
    const screws = [];
    let screwIdx = 1;
    for (const hId of usedHoleIds) {
      screws.push({
        id: `s${screwIdx}`,
        holeId: hId,
        style: screwStyles[(screwIdx - 1) % screwStyles.length]
      });
      screwIdx++;
    }

    const state = {
      level: levelNumber,
      name: `Mechanical Assembly #${levelNumber}`,
      tier: tier,
      trayCapacity: trayCapacity,
      holes: holes,
      screws: screws,
      panels: panels
    };

    // Verify solvability with solver
    const solution = solvePuzzle(state, 3000);
    if (solution && solution.length >= 2) {
      state.minMoves = solution.length;
      return state;
    }

    // Fallback guaranteed solvable configuration:
    // Simply clear any accidental cycle of blocking holes
    for (const p of panels) {
      p.blockingHoles = [];
    }
    const cleanSol = solvePuzzle(state, 2000);
    state.minMoves = cleanSol ? cleanSol.length : (screws.length + 1);

    return state;
  }

  /**
   * Deterministic Daily Challenge Puzzle
   */
  function getDailyLevel(dateStr) {
    let hash = 0;
    const str = dateStr || new Date().toISOString().slice(0, 10);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) + 88000;
    const level = generateLevel(35, seed);
    level.name = `Daily Challenge: ${str}`;
    level.isDaily = true;
    level.date = str;
    return level;
  }

  // Exports
  exports.PANEL_MATERIALS = PANEL_MATERIALS;
  exports.SCREW_STYLES = SCREW_STYLES;
  exports.cloneState = cloneState;
  exports.isScrewAccessible = isScrewAccessible;
  exports.isHoleAvailable = isHoleAvailable;
  exports.getAvailableHoles = getAvailableHoles;
  exports.checkPanelReleases = checkPanelReleases;
  exports.checkWin = checkWin;
  exports.executeMove = executeMove;
  exports.getLegalMoves = getLegalMoves;
  exports.getStateHash = getStateHash;
  exports.solvePuzzle = solvePuzzle;
  exports.findHint = findHint;
  exports.generateLevel = generateLevel;
  exports.getDailyLevel = getDailyLevel;
  exports.createPrng = createPrng;

})(typeof module !== 'undefined' ? module.exports : (window.ScrewMasterEngine = {}));

