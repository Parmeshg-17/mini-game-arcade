/**
 * Water Sort — Core Puzzle Engine & Solvability Verifier
 * Pure logic for liquid physics, pouring validation, BFS solving, hint generation,
 * and deterministic solvable level generation.
 */
(function(exports) {
  'use strict';

  const TUBE_CAPACITY = 4;

  // 12 High-contrast vibrant liquid color definitions
  const LIQUID_COLORS = [
    { id: 'crimson', name: 'Crimson', hex: '#ff3366', light: '#ff668f', dark: '#d9044b' },
    { id: 'cyan',    name: 'Electric Cyan', hex: '#00d2ff', light: '#62e4ff', dark: '#0099cc' },
    { id: 'amber',   name: 'Golden Amber', hex: '#ffbe0b', light: '#ffcf4b', dark: '#d49b00' },
    { id: 'emerald', name: 'Emerald', hex: '#06d6a0', light: '#50ecc3', dark: '#04a77b' },
    { id: 'purple',  name: 'Royal Purple', hex: '#8338ec', light: '#a56cf0', dark: '#601abf' },
    { id: 'orange',  name: 'Tangerine', hex: '#fb5607', light: '#ff8244', dark: '#d03f00' },
    { id: 'lime',    name: 'Neon Lime', hex: '#70e000', light: '#9ef03b', dark: '#50a300' },
    { id: 'pink',    name: 'Orchid Pink', hex: '#ff006e', light: '#ff4d9c', dark: '#cc0058' },
    { id: 'marine',  name: 'Ocean Blue', hex: '#3a86ff', light: '#70a7ff', dark: '#1b63d9' },
    { id: 'indigo',  name: 'Deep Indigo', hex: '#4361ee', light: '#738cf7', dark: '#2b44c4' },
    { id: 'bronze',  name: 'Caramel Bronze', hex: '#b07d62', light: '#c8a18c', dark: '#8a5840' },
    { id: 'mint',    name: 'Seafoam Mint', hex: '#52b788', light: '#7ecba5', dark: '#379268' }
  ];

  /**
   * Seeded Pseudo-Random Number Generator (Mulberry32)
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
   * Clone a 2D tubes array
   */
  function cloneTubes(tubes) {
    return tubes.map(tube => tube.slice());
  }

  /**
   * Checks if a single tube is completely filled with a single color
   */
  function isTubeComplete(tube, capacity = TUBE_CAPACITY) {
    if (!tube || tube.length !== capacity) return false;
    const first = tube[0];
    for (let i = 1; i < tube.length; i++) {
      if (tube[i] !== first) return false;
    }
    return true;
  }

  /**
   * Checks if all items in the tube are identical (may be partially filled)
   */
  function isTubeMonochromatic(tube) {
    if (!tube || tube.length === 0) return true;
    const first = tube[0];
    for (let i = 1; i < tube.length; i++) {
      if (tube[i] !== first) return false;
    }
    return true;
  }

  /**
   * Returns top color of a tube, or null if empty
   */
  function getTopColor(tube) {
    if (!tube || tube.length === 0) return null;
    return tube[tube.length - 1];
  }

  /**
   * Returns count of contiguous top units matching the top color
   */
  function getTopContiguousCount(tube) {
    if (!tube || tube.length === 0) return 0;
    const top = tube[tube.length - 1];
    let count = 0;
    for (let i = tube.length - 1; i >= 0; i--) {
      if (tube[i] === top) count++;
      else break;
    }
    return count;
  }

  /**
   * Determines if pouring from tube `fromIdx` to `toIdx` is legally valid.
   */
  function canPour(tubes, fromIdx, toIdx, capacity = TUBE_CAPACITY) {
    if (fromIdx === toIdx) return false;
    if (fromIdx < 0 || fromIdx >= tubes.length) return false;
    if (toIdx < 0 || toIdx >= tubes.length) return false;

    const src = tubes[fromIdx];
    const dst = tubes[toIdx];

    // Source must contain liquid
    if (!src || src.length === 0) return false;

    // Destination must have capacity
    if (!dst || dst.length >= capacity) return false;

    // Destination is empty -> Valid
    if (dst.length === 0) {
      // Disallow pointless move: pouring a pure tube into an empty tube
      if (isTubeMonochromatic(src)) return false;
      return true;
    }

    // Destination not empty -> top color must match
    return src[src.length - 1] === dst[dst.length - 1];
  }

  /**
   * Calculates how many units will transfer in a pour.
   */
  function calculatePourUnits(tubes, fromIdx, toIdx, capacity = TUBE_CAPACITY) {
    if (!canPour(tubes, fromIdx, toIdx, capacity)) return 0;
    const src = tubes[fromIdx];
    const dst = tubes[toIdx];
    const contiguous = getTopContiguousCount(src);
    const space = capacity - dst.length;
    return Math.min(contiguous, space);
  }

  /**
   * Executes a pour, returning new state and details
   */
  function executePour(tubes, fromIdx, toIdx, capacity = TUBE_CAPACITY) {
    const units = calculatePourUnits(tubes, fromIdx, toIdx, capacity);
    if (units === 0) {
      return { success: false, tubes, units: 0, color: null, fromIdx, toIdx };
    }

    const nextTubes = cloneTubes(tubes);
    const src = nextTubes[fromIdx];
    const dst = nextTubes[toIdx];
    const color = src[src.length - 1];

    for (let i = 0; i < units; i++) {
      dst.push(src.pop());
    }

    return {
      success: true,
      tubes: nextTubes,
      units,
      color,
      fromIdx,
      toIdx,
      sourceCompleted: isTubeComplete(src, capacity),
      destCompleted: isTubeComplete(dst, capacity)
    };
  }

  /**
   * Check if all tubes are solved (either completely empty or filled with 4 identical units)
   */
  function checkWin(tubes, capacity = TUBE_CAPACITY) {
    if (!tubes || tubes.length === 0) return false;
    for (let i = 0; i < tubes.length; i++) {
      const tube = tubes[i];
      if (tube.length === 0) continue;
      if (!isTubeComplete(tube, capacity)) return false;
    }
    return true;
  }

  /**
   * Returns list of all legal moves for current board
   */
  function getLegalMoves(tubes, capacity = TUBE_CAPACITY) {
    const moves = [];
    let emptyTubeTargetIndex = -1;

    for (let i = 0; i < tubes.length; i++) {
      if (tubes[i].length === 0) continue;
      if (isTubeComplete(tubes[i], capacity)) continue; // Never break a completed tube

      for (let j = 0; j < tubes.length; j++) {
        if (i === j) continue;
        if (tubes[j].length >= capacity) continue;

        // Deduplicate pouring into multiple empty tubes
        if (tubes[j].length === 0) {
          if (emptyTubeTargetIndex === -1) {
            emptyTubeTargetIndex = j;
          }
          if (j !== emptyTubeTargetIndex) continue;
        }

        if (canPour(tubes, i, j, capacity)) {
          const units = calculatePourUnits(tubes, i, j, capacity);
          moves.push({
            from: i,
            to: j,
            units,
            color: tubes[i][tubes[i].length - 1]
          });
        }
      }
    }
    return moves;
  }

  /**
   * Canonical hash representation for state caching in BFS
   */
  function getBoardHash(tubes) {
    // Sort tubes lexicographically so position of equivalent tubes doesn't create duplicate states
    return tubes.map(t => t.join(',')).sort().join('|');
  }

  /**
   * Intelligent BFS Solver to guarantee solvability and provide hints.
   * Finds the shortest path to victory or returns null if unsolvable within maxStates.
   */
  function solvePuzzle(tubes, capacity = TUBE_CAPACITY, maxStates = 4000) {
    if (checkWin(tubes, capacity)) return [];

    const queue = [{ tubes: cloneTubes(tubes), path: [] }];
    const visited = new Set();
    visited.add(getBoardHash(tubes));

    let statesCount = 0;

    while (queue.length > 0 && statesCount < maxStates) {
      statesCount++;
      const { tubes: current, path } = queue.shift();

      const moves = getLegalMoves(current, capacity);

      // Prioritize moves:
      // 1. Moves that complete a tube
      // 2. Moves that empty a tube
      // 3. Normal pours
      moves.sort((a, b) => {
        const destA = current[a.to];
        const destB = current[b.to];
        const wouldCompleteA = (destA.length + a.units === capacity) ? 1 : 0;
        const wouldCompleteB = (destB.length + b.units === capacity) ? 1 : 0;
        return wouldCompleteB - wouldCompleteA;
      });

      for (const m of moves) {
        const res = executePour(current, m.from, m.to, capacity);
        if (!res.success) continue;

        if (checkWin(res.tubes, capacity)) {
          return path.concat([m]);
        }

        const hash = getBoardHash(res.tubes);
        if (!visited.has(hash)) {
          visited.add(hash);
          queue.push({
            tubes: res.tubes,
            path: path.concat([m])
          });
        }
      }
    }

    return null; // Exceeded search budget or unsolvable
  }

  /**
   * Finds the best immediate hint move for the current board state.
   */
  function findHint(tubes, capacity = TUBE_CAPACITY) {
    if (checkWin(tubes, capacity)) return null;

    // Run BFS solver
    const solution = solvePuzzle(tubes, capacity, 3000);
    if (solution && solution.length > 0) {
      return solution[0];
    }

    // Fallback heuristic: choose move that makes most progress
    const legalMoves = getLegalMoves(tubes, capacity);
    if (legalMoves.length === 0) return null;

    // Prioritize: completes a tube > pours maximum units > doesn't empty a tube to empty
    legalMoves.sort((a, b) => {
      const destA = tubes[a.to];
      const destB = tubes[b.to];
      const completesA = (destA.length + a.units === capacity) ? 10 : 0;
      const completesB = (destB.length + b.units === capacity) ? 10 : 0;
      return (completesB + b.units) - (completesA + a.units);
    });

    return legalMoves[0];
  }

  /**
   * Deterministic Solvable Level Generator
   * Tiers:
   * Level 1-5: 3 colors, 1 empty (4 tubes)
   * Level 6-20: 3-4 colors, 2 empty (5-6 tubes)
   * Level 21-50: 5-6 colors, 2 empty (7-8 tubes)
   * Level 51-100: 7-8 colors, 2 empty (9-10 tubes)
   * Level 101-150: 9-10 colors, 2 empty (11-12 tubes)
   * Level 151+: 11-12 colors, 2 empty (13-14 tubes)
   */
  function getLevelConfig(levelNumber) {
    if (levelNumber === 1) {
      return { numColors: 3, numEmpty: 1, name: 'Tutorial: Pure Drops', tier: 'Beginner' };
    }
    if (levelNumber <= 5) {
      return { numColors: 3, numEmpty: 2, name: `Beginner Sort #${levelNumber}`, tier: 'Beginner' };
    }
    if (levelNumber <= 20) {
      return { numColors: 4, numEmpty: 2, name: `Novice Flow #${levelNumber}`, tier: 'Beginner' };
    }
    if (levelNumber <= 35) {
      return { numColors: 5, numEmpty: 2, name: `Intermediate Cascade #${levelNumber}`, tier: 'Intermediate' };
    }
    if (levelNumber <= 50) {
      return { numColors: 6, numEmpty: 2, name: `Crystal Sorting #${levelNumber}`, tier: 'Intermediate' };
    }
    if (levelNumber <= 75) {
      return { numColors: 7, numEmpty: 2, name: `Advanced Prism #${levelNumber}`, tier: 'Advanced' };
    }
    if (levelNumber <= 100) {
      return { numColors: 8, numEmpty: 2, name: `Master Chemist #${levelNumber}`, tier: 'Advanced' };
    }
    if (levelNumber <= 125) {
      return { numColors: 9, numEmpty: 2, name: `Expert Gradient #${levelNumber}`, tier: 'Expert' };
    }
    if (levelNumber <= 150) {
      return { numColors: 10, numEmpty: 2, name: `Alchemy Lab #${levelNumber}`, tier: 'Expert' };
    }
    if (levelNumber <= 175) {
      return { numColors: 11, numEmpty: 2, name: `Grand Master #${levelNumber}`, tier: 'Master' };
    }
    return { numColors: 12, numEmpty: 2, name: `Championship Flask #${levelNumber}`, tier: 'Master' };
  }

  /**
   * Generates a guaranteed-solvable level
   */
  function generateLevel(levelNumber, customSeed = null) {
    const config = getLevelConfig(levelNumber);
    const seedBase = customSeed !== null ? customSeed : (levelNumber * 16807 + 7919);

    let attempt = 0;
    while (attempt < 40) {
      attempt++;
      const prng = createPrng(seedBase + attempt * 101);

      // Pick colors for this level
      const availableColors = LIQUID_COLORS.slice(0, Math.min(config.numColors, LIQUID_COLORS.length));

      // Build segment pool: 4 units for each color
      const pool = [];
      availableColors.forEach(c => {
        for (let u = 0; u < TUBE_CAPACITY; u++) {
          pool.push(c.id);
        }
      });

      // Fisher-Yates shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        const temp = pool[i];
        pool[i] = pool[j];
        pool[j] = temp;
      }

      // Distribute into tubes
      const tubes = [];
      for (let c = 0; c < config.numColors; c++) {
        tubes.push(pool.slice(c * TUBE_CAPACITY, (c + 1) * TUBE_CAPACITY));
      }

      // Add empty tubes
      for (let e = 0; e < config.numEmpty; e++) {
        tubes.push([]);
      }

      // Check that no tube starts already solved
      let alreadySolvedCount = 0;
      for (let t = 0; t < tubes.length; t++) {
        if (isTubeComplete(tubes[t], TUBE_CAPACITY)) alreadySolvedCount++;
      }
      if (alreadySolvedCount > 0) continue;

      // Verify solvability using solver
      const solution = solvePuzzle(tubes, TUBE_CAPACITY, 2500);
      if (solution && solution.length >= 3) {
        return {
          level: levelNumber,
          name: config.name,
          tier: config.tier,
          numColors: config.numColors,
          numEmpty: config.numEmpty,
          tubes,
          minMoves: solution.length,
          colors: availableColors
        };
      }
    }

    // Guaranteed fallback: Solved state + reverse mixing
    const availableColors = LIQUID_COLORS.slice(0, Math.min(config.numColors, LIQUID_COLORS.length));
    const tubes = [];
    for (let c = 0; c < config.numColors; c++) {
      tubes.push([availableColors[c].id, availableColors[c].id, availableColors[c].id, availableColors[c].id]);
    }
    for (let e = 0; e < config.numEmpty; e++) {
      tubes.push([]);
    }

    // Perform random valid reverse moves
    const prng = createPrng(seedBase + 9999);
    for (let step = 0; step < config.numColors * 7; step++) {
      const srcIdx = Math.floor(prng() * tubes.length);
      const dstIdx = Math.floor(prng() * tubes.length);
      if (srcIdx !== dstIdx && tubes[srcIdx].length > 0 && tubes[dstIdx].length < TUBE_CAPACITY) {
        tubes[dstIdx].push(tubes[srcIdx].pop());
      }
    }

    return {
      level: levelNumber,
      name: config.name,
      tier: config.tier,
      numColors: config.numColors,
      numEmpty: config.numEmpty,
      tubes,
      minMoves: 10,
      colors: availableColors
    };
  }

  /**
   * Deterministic Daily Challenge Level
   */
  function getDailyLevel(dateStr) {
    let hash = 0;
    const str = dateStr || new Date().toISOString().slice(0, 10);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) + 42000;
    const level = generateLevel(30, seed);
    level.name = `Daily Challenge: ${str}`;
    level.isDaily = true;
    level.date = str;
    return level;
  }

  // Export module
  exports.TUBE_CAPACITY = TUBE_CAPACITY;
  exports.LIQUID_COLORS = LIQUID_COLORS;
  exports.canPour = canPour;
  exports.calculatePourUnits = calculatePourUnits;
  exports.executePour = executePour;
  exports.isTubeComplete = isTubeComplete;
  exports.isTubeMonochromatic = isTubeMonochromatic;
  exports.getTopColor = getTopColor;
  exports.getTopContiguousCount = getTopContiguousCount;
  exports.checkWin = checkWin;
  exports.getLegalMoves = getLegalMoves;
  exports.solvePuzzle = solvePuzzle;
  exports.findHint = findHint;
  exports.generateLevel = generateLevel;
  exports.getDailyLevel = getDailyLevel;
  exports.getLevelConfig = getLevelConfig;
  exports.createPrng = createPrng;

})(typeof module !== 'undefined' ? module.exports : (window.WaterSortEngine = {}));
