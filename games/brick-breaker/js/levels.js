/**
 * Brick Breaker — Level Layouts & Brick Definitions
 * Defines wave layouts, brick hit points, power-ups, and grid generation.
 */

(function () {
  'use strict';

  const BRICK_THEMES = {
    coral: { fill: '#ff784f', stroke: '#ff9a76', points: 120, label: 'Coral' },
    amber: { fill: '#eab308', stroke: '#fde047', points: 100, label: 'Amber' },
    lime:  { fill: '#d5ff55', stroke: '#e8ff8c', points: 80,  label: 'Lime' },
    cyan:  { fill: '#38bdf8', stroke: '#7dd3fc', points: 60,  label: 'Cyan' },
    rose:  { fill: '#fb7185', stroke: '#fda4af', points: 150, label: 'Rose' },
    durable: { fill: '#a855f7', stroke: '#c084fc', points: 250, label: 'Armored (2-Hit)' }
  };

  const POWERUP_TYPES = [
    { type: 'wide', label: 'WIDE PADDLE', color: '#38bdf8', symbol: '↔' },
    { type: 'multiball', label: 'MULTI BALL', color: '#d5ff55', symbol: '●●' },
    { type: 'life', label: 'EXTRA SHIELD', color: '#ff784f', symbol: '♥' },
    { type: 'slow', label: 'SLOW ORBIT', color: '#eab308', symbol: '⏱' }
  ];

  // 3 Progressive Level Grids (0 = empty, 1 = normal brick, 2 = durable 2-hit, 3 = powerup brick)
  const LEVEL_DATA = [
    // Level 1: Classic Neon Grid (5 rows x 8 cols)
    {
      name: 'Wave 1: Neon Grid',
      rows: 5,
      cols: 8,
      speedMultiplier: 1.0,
      grid: [
        [1, 1, 1, 1, 1, 1, 1, 1], // Coral
        [1, 1, 3, 1, 1, 3, 1, 1], // Amber (with 2 powerups)
        [1, 1, 1, 1, 1, 1, 1, 1], // Lime
        [1, 1, 1, 1, 1, 1, 1, 1], // Cyan
        [1, 1, 1, 1, 1, 1, 1, 1]  // Cyan
      ],
      rowThemes: ['coral', 'amber', 'lime', 'cyan', 'cyan']
    },

    // Level 2: Stepped Diamond Fortress (6 rows x 8 cols)
    {
      name: 'Wave 2: Diamond Fortress',
      rows: 6,
      cols: 8,
      speedMultiplier: 1.1,
      grid: [
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [1, 2, 3, 2, 2, 3, 2, 1],
        [1, 2, 2, 2, 2, 2, 2, 1],
        [0, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0]
      ],
      rowThemes: ['rose', 'amber', 'durable', 'lime', 'cyan', 'cyan']
    },

    // Level 3: Cyber Castle Wall (7 rows x 8 cols)
    {
      name: 'Wave 3: Cyber Bastion',
      rows: 7,
      cols: 8,
      speedMultiplier: 1.2,
      grid: [
        [2, 0, 2, 0, 0, 2, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [1, 3, 1, 2, 2, 1, 3, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 2, 1, 1, 2, 1, 0],
        [0, 1, 1, 3, 3, 1, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0]
      ],
      rowThemes: ['rose', 'durable', 'coral', 'amber', 'lime', 'cyan', 'cyan']
    }
  ];

  /**
   * Generates active brick objects for the given level.
   * Scaled to fit current canvas width and height.
   */
  function buildBricksForLevel(levelIndex, canvasWidth = 600, canvasHeight = 480) {
    const level = LEVEL_DATA[levelIndex % LEVEL_DATA.length];
    const bricks = [];

    const padding = 8;
    const sideMargin = Math.max(16, canvasWidth * 0.05);
    const topMargin = Math.max(45, canvasHeight * 0.1);

    const availableWidth = canvasWidth - sideMargin * 2;
    const brickWidth = (availableWidth - (level.cols - 1) * padding) / level.cols;
    const brickHeight = Math.max(16, Math.min(24, canvasHeight * 0.045));

    for (let r = 0; r < level.rows; r++) {
      const themeKey = level.rowThemes[r] || 'cyan';
      const defaultTheme = BRICK_THEMES[themeKey] || BRICK_THEMES.cyan;

      for (let c = 0; c < level.cols; c++) {
        const cellType = level.grid[r][c];
        if (cellType === 0) continue; // Empty space

        const x = sideMargin + c * (brickWidth + padding);
        const y = topMargin + r * (brickHeight + padding);

        const isDurable = cellType === 2;
        const isPowerup = cellType === 3;

        let theme = defaultTheme;
        let hp = 1;

        if (isDurable) {
          theme = BRICK_THEMES.durable;
          hp = 2;
        }

        // Random powerup selection for type 3
        const powerup = isPowerup ? POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)] : null;

        bricks.push({
          id: `brick_${r}_${c}`,
          x,
          y,
          width: brickWidth,
          height: brickHeight,
          hp,
          maxHp: hp,
          theme,
          points: theme.points,
          powerup,
          alive: true
        });
      }
    }

    return {
      name: level.name,
      speedMultiplier: level.speedMultiplier,
      bricks
    };
  }

  const BrickLevels = {
    BRICK_THEMES,
    POWERUP_TYPES,
    LEVEL_DATA,
    buildBricksForLevel
  };

  if (typeof window !== 'undefined') {
    window.BrickLevels = BrickLevels;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrickLevels;
  }
})();
