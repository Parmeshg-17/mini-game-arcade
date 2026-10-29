/**
 * Tap Challenge — Core Engine Logic
 * Pure functional game algorithms:
 * - Reflex Rush: target spawner, time degradation, combo multipliers, scoring
 * - Number Sprint: sequence verification, shuffle generator, mistake tracking
 * - CPS Frenzy: tap rate calculator, tier evaluation, heat scale
 * Supports headless QA and cross-environment execution.
 */
(function(exports) {
  'use strict';

  const MODES = {
    reflex: {
      id: 'reflex',
      name: 'Reflex Rush',
      gridSize: 3,
      totalCells: 9,
      duration: 30, // seconds
      baseTargetDuration: 1400, // ms
      minTargetDuration: 700 // ms
    },
    sprint: {
      id: 'sprint',
      name: 'Number Sprint',
      gridSize: 4,
      totalCells: 16,
      targetNumber: 16
    },
    frenzy: {
      id: 'frenzy',
      name: 'CPS Frenzy',
      gridSize: 3,
      totalCells: 9,
      duration: 10 // seconds
    }
  };

  const TARGET_TYPES = {
    normal: {
      type: 'normal',
      name: 'Neon Node',
      points: 100,
      timeBonus: 0,
      color: '#d5ff55',
      icon: '⚡',
      isHazard: false
    },
    speed: {
      type: 'speed',
      name: 'Speed Pulse',
      points: 180,
      timeBonus: 1.0,
      color: '#38bdf8',
      icon: '⏱️',
      isHazard: false
    },
    golden: {
      type: 'golden',
      name: 'Hyper Core',
      points: 300,
      timeBonus: 0.5,
      color: '#ffd166',
      icon: '⭐',
      isHazard: false
    },
    hazard: {
      type: 'hazard',
      name: 'Glitch Mine',
      points: -200,
      timeBonus: -2.0,
      color: '#ff4757',
      icon: '💥',
      isHazard: true
    }
  };

  /**
   * Generates a shuffled sequence 1..count for Number Sprint mode.
   * Uses Fisher-Yates shuffle with injectable RNG.
   */
  function generateSprintBoard(count = 16, rng = Math.random) {
    const board = [];
    for (let i = 1; i <= count; i++) {
      board.push(i);
    }
    for (let i = board.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = board[i];
      board[i] = board[j];
      board[j] = temp;
    }
    return board;
  }

  /**
   * Validates if a tapped value matches the expected next number in sequence.
   */
  function validateSprintTap(currentExpected, tappedValue) {
    const isCorrect = tappedValue === currentExpected;
    return {
      isCorrect,
      nextExpected: isCorrect ? currentExpected + 1 : currentExpected,
      penaltyAdded: isCorrect ? 0 : 1 // 1 second penalty for wrong tap
    };
  }

  /**
   * Computes the dynamic combo multiplier based on streak.
   */
  function calculateComboMultiplier(streak) {
    if (streak >= 18) return 5;
    if (streak >= 12) return 4;
    if (streak >= 7) return 3;
    if (streak >= 3) return 2;
    return 1;
  }

  /**
   * Calculates Clicks Per Second (CPS) rate.
   */
  function calculateCPS(tapCount, elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0;
    const rate = tapCount / elapsedSeconds;
    return Math.round(rate * 10) / 10;
  }

  /**
   * Evaluates CPS Frenzy speed tier based on CPS rating.
   */
  function calculateFrenzyTier(cps) {
    if (cps >= 10.0) {
      return { tier: 'Godlike Reflexes', stars: 3, badge: '🏆 MASTER' };
    }
    if (cps >= 7.5) {
      return { tier: 'Lightning Fingers', stars: 3, badge: '⚡ TURBO' };
    }
    if (cps >= 5.5) {
      return { tier: 'Arcade Pro', stars: 2, badge: '🔥 SPEEDY' };
    }
    if (cps >= 3.5) {
      return { tier: 'Agile Tapper', stars: 2, badge: '👍 SOLID' };
    }
    return { tier: 'Casual Tapper', stars: 1, badge: '🌱 WARMUP' };
  }

  /**
   * Evaluates Number Sprint performance stars based on completion time and mistakes.
   */
  function calculateSprintStars(elapsedSeconds, mistakes = 0) {
    const totalScoreTime = elapsedSeconds + (mistakes * 1.5);
    if (totalScoreTime <= 12.0) return 3;
    if (totalScoreTime <= 20.0) return 2;
    return 1;
  }

  /**
   * Evaluates Reflex Rush stars based on total score.
   */
  function calculateReflexStars(score) {
    if (score >= 3500) return 3;
    if (score >= 2000) return 2;
    return 1;
  }

  /**
   * Chooses random target type for Reflex Rush with weighted probabilities.
   */
  function rollTargetType(rng = Math.random) {
    const roll = rng();
    if (roll < 0.65) return TARGET_TYPES.normal;
    if (roll < 0.82) return TARGET_TYPES.speed;
    if (roll < 0.92) return TARGET_TYPES.golden;
    return TARGET_TYPES.hazard; // 8% chance of hazard mine
  }

  /**
   * Formats milliseconds into clean display string (e.g. "00:14.8" or "12.4s").
   */
  function formatSeconds(seconds) {
    const clamped = Math.max(0, seconds);
    const mins = Math.floor(clamped / 60);
    const secs = Math.floor(clamped % 60);
    const ms = Math.floor((clamped - Math.floor(clamped)) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  }

  // Exports
  exports.MODES = MODES;
  exports.TARGET_TYPES = TARGET_TYPES;
  exports.generateSprintBoard = generateSprintBoard;
  exports.validateSprintTap = validateSprintTap;
  exports.calculateComboMultiplier = calculateComboMultiplier;
  exports.calculateCPS = calculateCPS;
  exports.calculateFrenzyTier = calculateFrenzyTier;
  exports.calculateSprintStars = calculateSprintStars;
  exports.calculateReflexStars = calculateReflexStars;
  exports.rollTargetType = rollTargetType;
  exports.formatSeconds = formatSeconds;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.TapEngine = {}));
