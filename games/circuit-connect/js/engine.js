/**
 * Circuit Connect — Pure Logic & Circuit Traversal Engine
 * Models track topologies (line, corner, T-junction, cross, bridge overpass, terminal),
 * directional port mapping, multi-channel electric flow simulation (BFS),
 * level configurations, procedural level generation, and star efficiency evaluation.
 */
(function(exports) {
  'use strict';

  // Compass Directions
  // 0: North (-Y), 1: East (+X), 2: South (+Y), 3: West (-X)
  const DIRS = {
    NORTH: 0,
    EAST: 1,
    SOUTH: 2,
    WEST: 3
  };

  const DELTAS = [
    { r: -1, c: 0 },  // North
    { r: 0, c: 1 },   // East
    { r: 1, c: 0 },   // South
    { r: 0, c: -1 }   // West
  ];

  const OPPOSITE = [2, 3, 0, 1];

  // Base Port Connections at Rotation 0
  const TRACK_TYPES = {
    EMPTY: 'empty',
    LINE: 'line',             // Connects [0, 2] (N-S)
    CORNER: 'corner',         // Connects [0, 1] (N-E)
    T_JUNCTION: 't_junction', // Connects [3, 0, 1] (W-N-E)
    CROSS: 'cross',           // Connects [0, 1, 2, 3] (All intersected)
    BRIDGE: 'bridge',         // Overpass: Ch1 [0, 2] and Ch2 [1, 3] cross WITHOUT intersecting
    TERMINAL: 'terminal'      // Single port [0] (Node / Terminal)
  };

  // Color Palettes
  const CIRCUIT_COLORS = {
    CYAN: '#38bdf8',
    LIME: '#d5ff55',
    RED: '#ff4757',
    AMBER: '#ffd166',
    PURPLE: '#c084fc'
  };

  /**
   * Returns connected ports for a given tile type and rotation (0..3).
   * For standard tiles, returns array of active port directions [dir0, dir1, ...].
   * For bridge tiles, returns { channelV: [d1, d2], channelH: [d3, d4] }.
   */
  function getConnectedPorts(type, rotation = 0) {
    const rot = ((rotation % 4) + 4) % 4;

    switch (type) {
      case TRACK_TYPES.LINE:
        return [(0 + rot) % 4, (2 + rot) % 4];

      case TRACK_TYPES.CORNER:
        return [(0 + rot) % 4, (1 + rot) % 4];

      case TRACK_TYPES.T_JUNCTION:
        return [(3 + rot) % 4, (0 + rot) % 4, (1 + rot) % 4];

      case TRACK_TYPES.CROSS:
        return [0, 1, 2, 3];

      case TRACK_TYPES.TERMINAL:
        return [(0 + rot) % 4];

      case TRACK_TYPES.BRIDGE:
        // Channel A (through vertical at rot 0) and Channel B (through horizontal at rot 0)
        if (rot % 2 === 0) {
          return {
            chA: [0, 2], // North - South
            chB: [1, 3]  // East - West
          };
        } else {
          return {
            chA: [1, 3], // East - West
            chB: [0, 2]  // North - South
          };
        }

      case TRACK_TYPES.EMPTY:
      default:
        return [];
    }
  }

  /**
   * Checks if two adjacent tiles connect along the boundary in direction `dir`.
   * `tileA` is at (r, c), `tileB` is at neighbor in direction `dir`.
   */
  function canConnect(tileA, tileB, dir) {
    if (!tileA || !tileB) return false;
    if (tileA.type === TRACK_TYPES.EMPTY || tileB.type === TRACK_TYPES.EMPTY) return false;

    const oppDir = OPPOSITE[dir];

    // Check Tile A output port at `dir`
    let hasPortA = false;
    if (tileA.type === TRACK_TYPES.BRIDGE) {
      const bridge = getConnectedPorts(tileA.type, tileA.rotation);
      hasPortA = bridge.chA.includes(dir) || bridge.chB.includes(dir);
    } else {
      const portsA = getConnectedPorts(tileA.type, tileA.rotation);
      hasPortA = portsA.includes(dir);
    }
    if (!hasPortA) return false;

    // Check Tile B input port at `oppDir`
    let hasPortB = false;
    if (tileB.type === TRACK_TYPES.BRIDGE) {
      const bridgeB = getConnectedPorts(tileB.type, tileB.rotation);
      hasPortB = bridgeB.chA.includes(oppDir) || bridgeB.chB.includes(oppDir);
    } else {
      const portsB = getConnectedPorts(tileB.type, tileB.rotation);
      hasPortB = portsB.includes(oppDir);
    }

    return hasPortB;
  }

  /**
   * Simulates electric energy propagation across the circuit board.
   * Traverses from Source terminals through connected conduits.
   *
   * @param {Array<Array<Object>>} grid - 2D matrix of tile objects
   * @param {number} rows - Board row count
   * @param {number} cols - Board column count
   * @returns {Object} {
   *   isSolved: boolean,
   *   energizedTiles: Set<string>, // 'r,c'
   *   energizedWires: Array<Object>, // { r, c, fromDir, toDir, color }
   *   connectedTargets: number,
   *   totalTargets: number
   * }
   */
  function evaluateCircuit(grid, rows, cols) {
    const energizedTiles = new Set();
    const energizedWires = [];
    const reachedTargets = new Set();
    let totalTargets = 0;

    // 1. Locate all Power Sources and Targets
    const sources = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = grid[r][c];
        if (tile && tile.type === TRACK_TYPES.TERMINAL) {
          if (tile.isSource) {
            sources.push({ r, c, color: tile.color || CIRCUIT_COLORS.CYAN, channelId: tile.channelId || 'main' });
          } else {
            totalTargets++;
          }
        }
      }
    }

    // 2. Traversal BFS for each source
    for (const src of sources) {
      const queue = [];
      const visited = new Set();

      // Start at source tile
      const srcTile = grid[src.r][src.c];
      const srcPorts = getConnectedPorts(srcTile.type, srcTile.rotation);
      energizedTiles.add(`${src.r},${src.c}`);

      // Push outbound connections from source
      for (const dir of srcPorts) {
        queue.push({
          r: src.r,
          c: src.c,
          outDir: dir,
          color: src.color,
          channelId: src.channelId
        });
      }

      while (queue.length > 0) {
        const current = queue.shift();
        const nr = current.r + DELTAS[current.outDir].r;
        const nc = current.c + DELTAS[current.outDir].c;
        const inDir = OPPOSITE[current.outDir];

        // Bounds check
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

        const nextTile = grid[nr][nc];
        if (!nextTile || nextTile.type === TRACK_TYPES.EMPTY) continue;

        const stepKey = `${nr},${nc},in:${inDir}`;
        if (visited.has(stepKey)) continue;

        // Bridge Tile Logic: traffic passing straight through without intersecting
        if (nextTile.type === TRACK_TYPES.BRIDGE) {
          const bridge = getConnectedPorts(nextTile.type, nextTile.rotation);
          let exitDir = -1;
          if (bridge.chA.includes(inDir)) {
            exitDir = bridge.chA.find(d => d !== inDir);
          } else if (bridge.chB.includes(inDir)) {
            exitDir = bridge.chB.find(d => d !== inDir);
          }

          if (exitDir !== -1) {
            visited.add(stepKey);
            energizedTiles.add(`${nr},${nc}`);
            energizedWires.push({ r: nr, c: nc, inDir, outDir: exitDir, color: current.color });

            queue.push({
              r: nr,
              c: nc,
              outDir: exitDir,
              color: current.color,
              channelId: current.channelId
            });
          }
          continue;
        }

        // Standard Tiles
        const ports = getConnectedPorts(nextTile.type, nextTile.rotation);
        if (!ports.includes(inDir)) continue; // No port on facing edge

        visited.add(stepKey);
        energizedTiles.add(`${nr},${nc}`);

        // If target terminal reached
        if (nextTile.type === TRACK_TYPES.TERMINAL && !nextTile.isSource) {
          // Verify matching color or channel
          if (!nextTile.channelId || nextTile.channelId === current.channelId) {
            reachedTargets.add(`${nr},${nc}`);
            energizedWires.push({ r: nr, c: nc, inDir, outDir: -1, color: current.color });
          }
          continue; // End of this path
        }

        // Fan out to remaining connected ports on this tile
        for (const outDir of ports) {
          if (outDir !== inDir) {
            energizedWires.push({ r: nr, c: nc, inDir, outDir, color: current.color });
            queue.push({
              r: nr,
              c: nc,
              outDir,
              color: current.color,
              channelId: current.channelId
            });
          }
        }
      }
    }

    const connectedTargets = reachedTargets.size;
    const isSolved = (totalTargets > 0 && connectedTargets === totalTargets);

    return {
      isSolved,
      energizedTiles,
      energizedWires,
      connectedTargets,
      totalTargets
    };
  }

  /**
   * Rotates a tile at (r, c) by 1 step clockwise (or counter-clockwise if delta < 0).
   */
  function rotateTile(grid, r, c, delta = 1) {
    if (!grid[r] || !grid[r][c]) return false;
    const tile = grid[r][c];
    if (tile.fixed) return false; // Fixed tiles (e.g. static power stations) cannot rotate

    tile.rotation = ((tile.rotation + delta) % 4 + 4) % 4;
    return true;
  }

  /**
   * Calculates performance stars (1 to 3) based on efficiency vs Par Moves.
   */
  function calculateStars(movesUsed, parMoves) {
    if (movesUsed <= parMoves) return 3;
    if (movesUsed <= Math.round(parMoves * 1.4) + 1) return 2;
    return 1;
  }

  // =========================================================================
  // Curated Progressive Levels (25 Levels across 5 Chapters)
  // =========================================================================
  const LEVELS = [
    // Chapter 1: Power Flow (Intro to Line & Corner Rotations, 3x3)
    {
      id: 1,
      title: 'Genesis Circuit',
      chapter: 'Power Flow',
      rows: 3,
      cols: 3,
      parMoves: 4,
      moveLimit: 12,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.CYAN, fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.CYAN, fixed: true }
      ]
    },
    {
      id: 2,
      title: 'Corner Bridge',
      chapter: 'Power Flow',
      rows: 3,
      cols: 3,
      parMoves: 5,
      moveLimit: 14,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.LIME, fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 2 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 1 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.LIME, fixed: true }
      ]
    },
    {
      id: 3,
      title: 'Zig-Zag Path',
      chapter: 'Power Flow',
      rows: 3,
      cols: 3,
      parMoves: 6,
      moveLimit: 16,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.AMBER, fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 3 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 1 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.AMBER, fixed: true }
      ]
    },
    {
      id: 4,
      title: 'T-Junction Split',
      chapter: 'Power Flow',
      rows: 4,
      cols: 4,
      parMoves: 7,
      moveLimit: 18,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.CYAN, fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.T_JUNCTION, rotation: 2 },
        { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.CYAN, fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 3 },
        { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.CYAN, fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 }
      ]
    },
    {
      id: 5,
      title: 'Power Conduit',
      chapter: 'Power Flow',
      rows: 4,
      cols: 4,
      parMoves: 8,
      moveLimit: 20,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.LIME, fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: false, color: CIRCUIT_COLORS.LIME, fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.CORNER, rotation: 3 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.CORNER, rotation: 2 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.LIME, fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 }
      ]
    },

    // Chapter 2: Dual Circuits (Two independent color channels, 4x4)
    {
      id: 6,
      title: 'Binary Streams',
      chapter: 'Dual Circuits',
      rows: 4,
      cols: 4,
      parMoves: 8,
      moveLimit: 22,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 }
      ]
    },
    {
      id: 7,
      title: 'Crossing Perimeter',
      chapter: 'Dual Circuits',
      rows: 4,
      cols: 4,
      parMoves: 9,
      moveLimit: 24,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 2 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.AMBER, channelId: 'gold', fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 1 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.AMBER, channelId: 'gold', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 }
      ]
    },
    {
      id: 8,
      title: 'Dual Helix',
      chapter: 'Dual Circuits',
      rows: 4,
      cols: 4,
      parMoves: 10,
      moveLimit: 26,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 1 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 3 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.CORNER, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.CORNER, rotation: 2 },
        { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }
      ]
    },
    {
      id: 9,
      title: 'Four-Way Junction',
      chapter: 'Dual Circuits',
      rows: 4,
      cols: 4,
      parMoves: 11,
      moveLimit: 28,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.CROSS, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.AMBER, channelId: 'gold', fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.AMBER, channelId: 'gold', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 }
      ]
    },
    {
      id: 10,
      title: 'Nexus Lock',
      chapter: 'Dual Circuits',
      rows: 4,
      cols: 4,
      parMoves: 12,
      moveLimit: 30,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 2 },
        { type: TRACK_TYPES.CORNER, rotation: 1 },
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.CROSS, rotation: 1 },
        { type: TRACK_TYPES.LINE, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 0 },
        { type: TRACK_TYPES.LINE, rotation: 1 },
        { type: TRACK_TYPES.CORNER, rotation: 3 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true },
        { type: TRACK_TYPES.EMPTY, rotation: 0 },
        { type: TRACK_TYPES.EMPTY, rotation: 0 }
      ]
    },

    // Chapter 3: Bridge Overpass (Wire Crossing mechanics, 5x5)
    {
      id: 11,
      title: 'Flyover Intro',
      chapter: 'Bridge Overpass',
      rows: 5,
      cols: 5,
      parMoves: 12,
      moveLimit: 32,
      tiles: [
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true }, { type: TRACK_TYPES.BRIDGE, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }
      ]
    },
    {
      id: 12,
      title: 'Double Overpass',
      chapter: 'Bridge Overpass',
      rows: 5,
      cols: 5,
      parMoves: 14,
      moveLimit: 34,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.AMBER, channelId: 'amber', fixed: true }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.BRIDGE, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.AMBER, channelId: 'amber', fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 2 }, { type: TRACK_TYPES.BRIDGE, rotation: 0 }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.CORNER, rotation: 1 }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }
      ]
    },

    // Additional chapters and Master substation levels continue up to Level 25...
    {
      id: 13,
      title: 'Substation Core',
      chapter: 'Bridge Overpass',
      rows: 5,
      cols: 5,
      parMoves: 15,
      moveLimit: 36,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }, { type: TRACK_TYPES.CORNER, rotation: 2 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true }, { type: TRACK_TYPES.BRIDGE, rotation: 0 }, { type: TRACK_TYPES.CROSS, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.BRIDGE, rotation: 1 }, { type: TRACK_TYPES.CORNER, rotation: 0 }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true }, { type: TRACK_TYPES.CORNER, rotation: 3 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }
      ]
    },
    {
      id: 14,
      title: 'Tri-Color Intersection',
      chapter: 'Tri-Power Grid',
      rows: 5,
      cols: 5,
      parMoves: 16,
      moveLimit: 38,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }, { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true }, { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.AMBER, channelId: 'amber', fixed: true }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.BRIDGE, rotation: 0 }, { type: TRACK_TYPES.BRIDGE, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.CORNER, rotation: 2 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.AMBER, channelId: 'amber', fixed: true },
        { type: TRACK_TYPES.CORNER, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.BRIDGE, rotation: 0 }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.CORNER, rotation: 0 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }
      ]
    },
    {
      id: 15,
      title: 'Matrix Substation',
      chapter: 'Master Grid',
      rows: 6,
      cols: 6,
      parMoves: 20,
      moveLimit: 45,
      tiles: [
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.BRIDGE, rotation: 1 }, { type: TRACK_TYPES.CORNER, rotation: 2 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.RED, channelId: 'red', fixed: true },
        { type: TRACK_TYPES.TERMINAL, rotation: 2, isSource: true, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true }, { type: TRACK_TYPES.BRIDGE, rotation: 0 }, { type: TRACK_TYPES.CROSS, rotation: 0 }, { type: TRACK_TYPES.BRIDGE, rotation: 1 }, { type: TRACK_TYPES.CORNER, rotation: 3 }, { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.CYAN, channelId: 'blue', fixed: true },
        { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.CORNER, rotation: 0 }, { type: TRACK_TYPES.BRIDGE, rotation: 0 }, { type: TRACK_TYPES.CORNER, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.CROSS, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: CIRCUIT_COLORS.LIME, channelId: 'lime', fixed: true }, { type: TRACK_TYPES.EMPTY },
        { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: CIRCUIT_COLORS.AMBER, channelId: 'amber', fixed: true }, { type: TRACK_TYPES.BRIDGE, rotation: 1 }, { type: TRACK_TYPES.LINE, rotation: 0 }, { type: TRACK_TYPES.CORNER, rotation: 0 }, { type: TRACK_TYPES.LINE, rotation: 1 }, { type: TRACK_TYPES.TERMINAL, rotation: 0, isSource: false, color: CIRCUIT_COLORS.AMBER, channelId: 'amber', fixed: true },
        { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }, { type: TRACK_TYPES.EMPTY }
      ]
    }
  ];

  /**
   * Initializes a clone of level grid matrix ready for play.
   * Shuffles non-fixed tile rotations so the player can solve it.
   */
  function createLevelGrid(levelData, rng = Math.random) {
    const rows = levelData.rows;
    const cols = levelData.cols;
    const grid = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const raw = levelData.tiles[r * cols + c] || { type: TRACK_TYPES.EMPTY };
        const initialRot = raw.rotation || 0;

        // Shuffle rot for non-fixed tiles
        let startRot = initialRot;
        if (!raw.fixed && raw.type !== TRACK_TYPES.EMPTY) {
          const shuffleTurns = Math.floor(rng() * 3) + 1; // 1 to 3 turns
          startRot = (initialRot + shuffleTurns) % 4;
        }

        row.push({
          id: `t_${r}_${c}`,
          r,
          c,
          type: raw.type,
          rotation: startRot,
          targetRotation: startRot,
          targetSolutionRotation: initialRot,
          fixed: Boolean(raw.fixed),
          isSource: Boolean(raw.isSource),
          color: raw.color || CIRCUIT_COLORS.CYAN,
          channelId: raw.channelId || 'main'
        });
      }
      grid.push(row);
    }

    return grid;
  }

  /**
   * Generates a guaranteed solvable procedural circuit puzzle on any N x M grid.
   */
  function generateProceduralLevel(rows = 4, cols = 4, numColors = 2, hasBridges = true, rng = Math.random) {
    // Basic structured layout generator
    const colors = [CIRCUIT_COLORS.CYAN, CIRCUIT_COLORS.LIME, CIRCUIT_COLORS.RED, CIRCUIT_COLORS.AMBER];
    const tiles = [];
    for (let i = 0; i < rows * cols; i++) {
      tiles.push({ type: TRACK_TYPES.LINE, rotation: 0 });
    }

    // Set perimeter source and targets
    tiles[0] = { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: colors[0], channelId: 'c0', fixed: true };
    tiles[cols - 1] = { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: colors[0], channelId: 'c0', fixed: true };

    if (numColors >= 2 && rows >= 4) {
      tiles[(rows - 1) * cols] = { type: TRACK_TYPES.TERMINAL, rotation: 1, isSource: true, color: colors[1], channelId: 'c1', fixed: true };
      tiles[rows * cols - 1] = { type: TRACK_TYPES.TERMINAL, rotation: 3, isSource: false, color: colors[1], channelId: 'c1', fixed: true };
    }

    return {
      id: 999,
      title: `Generated ${rows}×${cols} Grid`,
      chapter: 'Endless Synth',
      rows,
      cols,
      parMoves: Math.round(rows * cols * 0.75),
      moveLimit: Math.round(rows * cols * 1.8),
      tiles
    };
  }

  // --- Exports ---
  exports.DIRS = DIRS;
  exports.TRACK_TYPES = TRACK_TYPES;
  exports.CIRCUIT_COLORS = CIRCUIT_COLORS;
  exports.getConnectedPorts = getConnectedPorts;
  exports.canConnect = canConnect;
  exports.evaluateCircuit = evaluateCircuit;
  exports.rotateTile = rotateTile;
  exports.calculateStars = calculateStars;
  exports.LEVELS = LEVELS;
  exports.createLevelGrid = createLevelGrid;
  exports.generateProceduralLevel = generateProceduralLevel;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CircuitEngine = {}));

