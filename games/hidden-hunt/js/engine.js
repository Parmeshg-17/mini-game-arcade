/**
 * Hidden Hunt — Core Game & Observation Engine
 * Pure functional game systems: Coordinate distance mapping, hit detection,
 * score calculation, star evaluations, hint selection, daily challenges, and persistence.
 */
(function(exports) {
  'use strict';

  const STORAGE_KEY = 'hidden_hunt_save_v1';

  // Scoring constants
  const BASE_FIND_SCORE = 100;
  const COMBO_STEP_SCORE = 25;
  const TIME_PENALTY_INCORRECT = 5; // seconds deducted in Timed Mode
  const SCORE_PENALTY_INCORRECT = 10;
  const HINT_PENALTY = 20;

  /**
   * Initializes a clean default progress data store
   */
  function createDefaultProgress() {
    return {
      version: 1,
      unlockedWorlds: ['library'],
      completedLevels: {}, // { 'lib_1': { stars: 3, bestScore: 650, accuracy: 100 } }
      totalStars: 0,
      totalObjectsFound: 0,
      dailyHistory: {}, // { '2026-10-31': { completed: true, score: 580 } }
      achievements: [] // ['first_discovery']
    };
  }

  /**
   * Initializes the mutable state for a single active level session
   */
  function createSessionState(world, level, mode = 'story') {
    return {
      worldId: world.id,
      levelId: level.id,
      mode: mode, // 'story' | 'timed' | 'relax'
      timeElapsed: 0,
      timeRemaining: level.parTime || 90,
      totalTargets: level.objects.length,
      foundObjectIds: [],
      consecutiveFinds: 0,
      maxCombo: 0,
      totalClicks: 0,
      correctClicks: 0,
      hintsRemaining: 3,
      hintsUsed: 0,
      score: 0,
      isCompleted: false,
      isGameOver: false
    };
  }

  /**
   * Calculates normalized Euclidean distance between click and target
   */
  function calculateDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Tests whether a normalized click position (0..1) hits any remaining target object
   * @param {number} nx Normalized X (0..1)
   * @param {number} ny Normalized Y (0..1)
   * @param {Array<Object>} targets List of all level target objects
   * @param {Array<string>} foundIds List of already discovered object IDs
   * @returns {{ hit: boolean, object: Object|null }}
   */
  function checkHit(nx, ny, targets, foundIds) {
    const foundSet = new Set(foundIds);
    let closestTarget = null;
    let minDistance = Infinity;

    for (const target of targets) {
      if (foundSet.has(target.id)) continue;
      const dist = calculateDistance(nx, ny, target.x, target.y);
      if (dist <= target.radius && dist < minDistance) {
        minDistance = dist;
        closestTarget = target;
      }
    }

    if (closestTarget) {
      return { hit: true, object: closestTarget, distance: minDistance };
    }
    return { hit: false, object: null, distance: minDistance };
  }

  /**
   * Registers a successful discovery in session state
   */
  function registerHit(session, targetObject) {
    if (session.foundObjectIds.includes(targetObject.id)) {
      return { duplicate: true, isLevelComplete: false };
    }

    session.foundObjectIds.push(targetObject.id);
    session.totalClicks++;
    session.correctClicks++;
    session.consecutiveFinds++;
    if (session.consecutiveFinds > session.maxCombo) {
      session.maxCombo = session.consecutiveFinds;
    }

    // Score calculation
    const comboBonus = (session.consecutiveFinds - 1) * COMBO_STEP_SCORE;
    session.score += BASE_FIND_SCORE + comboBonus;

    const isLevelComplete = session.foundObjectIds.length >= session.totalTargets;
    if (isLevelComplete) {
      session.isCompleted = true;
      if (session.mode === 'timed') {
        // Bonus for remaining time
        session.score += Math.max(0, Math.floor(session.timeRemaining * 5));
      }
    }

    return {
      duplicate: false,
      isLevelComplete,
      scoreAdded: BASE_FIND_SCORE + comboBonus,
      combo: session.consecutiveFinds
    };
  }

  /**
   * Registers an incorrect click penalty
   */
  function registerMiss(session) {
    session.totalClicks++;
    session.consecutiveFinds = 0; // Break streak

    if (session.mode === 'timed') {
      session.score = Math.max(0, session.score - SCORE_PENALTY_INCORRECT);
      session.timeRemaining = Math.max(0, session.timeRemaining - TIME_PENALTY_INCORRECT);
      if (session.timeRemaining <= 0) {
        session.isGameOver = true;
      }
    }
  }

  /**
   * Finds the best target object to reveal for a hint
   */
  function pickHintObject(targets, foundIds) {
    const foundSet = new Set(foundIds);
    const remaining = targets.filter(t => !foundSet.has(t.id));
    if (!remaining.length) return null;
    return remaining[0]; // Returns first unfound object
  }

  /**
   * Evaluates 1, 2, or 3 stars based on performance
   */
  function evaluateStars(session, parTime = 90) {
    if (!session.isCompleted) return 0;
    const accuracy = session.totalClicks > 0
      ? (session.correctClicks / session.totalClicks) * 100
      : 100;

    // Relax mode awards up to 3 stars on full completion
    if (session.mode === 'relax') {
      if (accuracy >= 85 && session.hintsUsed <= 1) return 3;
      if (accuracy >= 60) return 2;
      return 1;
    }

    // Story and Timed mode
    let stars = 1; // Completed = at least 1 star
    if (accuracy >= 70 && session.hintsUsed <= 2) stars = 2;
    if (accuracy >= 90 && session.hintsUsed <= 1 && session.timeElapsed <= parTime * 1.2) stars = 3;

    return stars;
  }

  /**
   * Updates global player progress when a level finishes
   */
  function commitLevelResult(progress, worldId, levelId, session, stars) {
    const prev = progress.completedLevels[levelId] || { stars: 0, bestScore: 0 };
    const bestScore = Math.max(prev.bestScore, session.score);
    const bestStars = Math.max(prev.stars, stars);

    progress.completedLevels[levelId] = {
      stars: bestStars,
      bestScore: bestScore,
      accuracy: Math.round((session.correctClicks / Math.max(1, session.totalClicks)) * 100)
    };

    // Recalculate totals
    progress.totalStars = Object.values(progress.completedLevels).reduce((acc, l) => acc + (l.stars || 0), 0);
    progress.totalObjectsFound += session.foundObjectIds.length;

    // Check world unlocks
    // World 1 (library) has 5 levels (lib_1 to lib_5). If all 5 completed -> unlock 'forest'
    const libCompleted = ['lib_1', 'lib_2', 'lib_3', 'lib_4', 'lib_5'].every(id => progress.completedLevels[id]);
    if (libCompleted && !progress.unlockedWorlds.includes('forest')) {
      progress.unlockedWorlds.push('forest');
    }

    // World 2 (forest) has 5 levels (for_1 to for_5). If all 5 completed -> unlock 'pirate'
    const forCompleted = ['for_1', 'for_2', 'for_3', 'for_4', 'for_5'].every(id => progress.completedLevels[id]);
    if (forCompleted && !progress.unlockedWorlds.includes('pirate')) {
      progress.unlockedWorlds.push('pirate');
    }

    return progress;
  }

  /**
   * Generates a deterministic daily challenge selection based on YYYY-MM-DD
   */
  function getDailyChallenge(dateStr, allWorlds) {
    // Generate simple stable hash from date string
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);

    // Pick world and level
    const worldIndex = absHash % allWorlds.length;
    const world = allWorlds[worldIndex];
    const levelIndex = Math.floor(absHash / 7) % world.levels.length;
    const level = world.levels[levelIndex];

    return {
      date: dateStr,
      worldId: world.id,
      worldName: world.name,
      levelId: level.id,
      levelTitle: level.title,
      targetCount: level.objects.length,
      levelRef: level
    };
  }

  /**
   * Evaluates achievements against current state and progress
   */
  function checkAchievements(progress, session = null) {
    const newlyUnlocked = [];
    const has = (id) => progress.achievements.includes(id);

    // 1. First discovery
    if (!has('first_discovery') && Object.keys(progress.completedLevels).length >= 1) {
      newlyUnlocked.push('first_discovery');
    }

    // 2. Sharp Eyes (5 combo streak)
    if (session && !has('sharp_eyes') && session.maxCombo >= 5) {
      newlyUnlocked.push('sharp_eyes');
    }

    // 3. Perfect Hunt (100% accuracy on completed level)
    if (session && !has('perfect_hunt') && session.isCompleted && session.correctClicks === session.totalClicks) {
      newlyUnlocked.push('perfect_hunt');
    }

    // 4. Library Explorer
    const libAll = ['lib_1', 'lib_2', 'lib_3', 'lib_4', 'lib_5'].every(id => progress.completedLevels[id]);
    if (!has('library_explorer') && libAll) {
      newlyUnlocked.push('library_explorer');
    }

    // 5. Forest Detective
    const forAll = ['for_1', 'for_2', 'for_3', 'for_4', 'for_5'].every(id => progress.completedLevels[id]);
    if (!has('forest_detective') && forAll) {
      newlyUnlocked.push('forest_detective');
    }

    // 6. Treasure Hunter
    const pirAll = ['pir_1', 'pir_2', 'pir_3', 'pir_4', 'pir_5'].every(id => progress.completedLevels[id]);
    if (!has('treasure_hunter') && pirAll) {
      newlyUnlocked.push('treasure_hunter');
    }

    // 7. Master Observer (all 15 levels)
    if (!has('master_observer') && libAll && forAll && pirAll) {
      newlyUnlocked.push('master_observer');
    }

    // Merge unlocked
    for (const a of newlyUnlocked) {
      progress.achievements.push(a);
    }

    return newlyUnlocked;
  }

  exports.STORAGE_KEY = STORAGE_KEY;
  exports.BASE_FIND_SCORE = BASE_FIND_SCORE;
  exports.COMBO_STEP_SCORE = COMBO_STEP_SCORE;
  exports.createDefaultProgress = createDefaultProgress;
  exports.createSessionState = createSessionState;
  exports.calculateDistance = calculateDistance;
  exports.checkHit = checkHit;
  exports.registerHit = registerHit;
  exports.registerMiss = registerMiss;
  exports.pickHintObject = pickHintObject;
  exports.evaluateStars = evaluateStars;
  exports.commitLevelResult = commitLevelResult;
  exports.getDailyChallenge = getDailyChallenge;
  exports.checkAchievements = checkAchievements;

})(typeof exports === 'undefined' ? (window.HiddenHuntEngine = {}) : exports);
