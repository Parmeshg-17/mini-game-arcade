/**
 * Space Dodge — Core Physics & Sector Wave Engine
 * Pure modular game logic: Sector configurations, collision algorithms,
 * obstacle generation, near-miss calculations, and scoring.
 */
(function(exports) {
  'use strict';

  const SECTORS = [
    {
      id: 0,
      name: 'Sector 1: Kuiper Belt',
      tagline: 'Navigate dense asteroid debris',
      duration: 35, // seconds to clear
      targetDist: 1000,
      baseSpeed: 3.2,
      spawnRate: 1.1, // spawns per second
      hazardTypes: ['asteroid_sm', 'asteroid_med'],
      starRatingScore: 3000
    },
    {
      id: 1,
      name: 'Sector 2: Pulsar Storm',
      tagline: 'High-velocity plasma comets & space mines',
      duration: 40,
      targetDist: 1400,
      baseSpeed: 4.2,
      spawnRate: 1.5,
      hazardTypes: ['asteroid_med', 'comet', 'mine'],
      starRatingScore: 4800
    },
    {
      id: 2,
      name: 'Sector 3: Singularity Horizon',
      tagline: 'Hyper-dense cosmic hazards & EMP fields',
      duration: 45,
      targetDist: 1800,
      baseSpeed: 5.2,
      spawnRate: 1.9,
      hazardTypes: ['asteroid_lg', 'comet', 'mine'],
      starRatingScore: 7000
    }
  ];

  /**
   * Generates a multi-layer parallax starfield
   */
  function createStarField(count = 70, canvasW = 480, canvasH = 640, rng = Math.random) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.floor(rng() * 3); // 0 = far/slow, 1 = mid, 2 = near/fast
      stars.push({
        x: rng() * canvasW,
        y: rng() * canvasH,
        size: layer === 0 ? 1 : (layer === 1 ? 1.5 : 2.2),
        speed: layer === 0 ? 0.8 : (layer === 1 ? 1.8 : 3.5),
        alpha: layer === 0 ? 0.35 : (layer === 1 ? 0.65 : 0.95),
        color: layer === 2 ? (rng() > 0.5 ? '#d5ff55' : '#38bdf8') : '#ffffff'
      });
    }
    return stars;
  }

  /**
   * Generates an obstacle hazard or collectible pickup
   */
  function createObstacle(type, canvasW = 480, speedMultiplier = 1.0, rng = Math.random) {
    const x = 30 + rng() * (canvasW - 60);
    const y = -50;

    switch (type) {
      case 'asteroid_sm': {
        const radius = 16 + rng() * 8;
        return {
          type: 'asteroid_sm',
          isHazard: true,
          x,
          y,
          vx: (rng() - 0.5) * 1.2,
          vy: (2.8 + rng() * 1.4) * speedMultiplier,
          radius,
          hitRadius: radius * 0.82,
          rotation: rng() * Math.PI * 2,
          rotSpeed: (rng() - 0.5) * 0.05,
          color: '#a7ada0',
          vertices: generatePolygonVertices(radius, 7, rng),
          nearMissTriggered: false
        };
      }

      case 'asteroid_med': {
        const radius = 26 + rng() * 10;
        return {
          type: 'asteroid_med',
          isHazard: true,
          x,
          y,
          vx: (rng() - 0.5) * 0.9,
          vy: (2.2 + rng() * 1.2) * speedMultiplier,
          radius,
          hitRadius: radius * 0.84,
          rotation: rng() * Math.PI * 2,
          rotSpeed: (rng() - 0.5) * 0.035,
          color: '#8e9687',
          vertices: generatePolygonVertices(radius, 8, rng),
          nearMissTriggered: false
        };
      }

      case 'asteroid_lg': {
        const radius = 38 + rng() * 14;
        return {
          type: 'asteroid_lg',
          isHazard: true,
          x,
          y,
          vx: (rng() - 0.5) * 0.6,
          vy: (1.8 + rng() * 0.8) * speedMultiplier,
          radius,
          hitRadius: radius * 0.85,
          rotation: rng() * Math.PI * 2,
          rotSpeed: (rng() - 0.5) * 0.02,
          color: '#737a6c',
          vertices: generatePolygonVertices(radius, 10, rng),
          nearMissTriggered: false
        };
      }

      case 'comet': {
        const radius = 18;
        return {
          type: 'comet',
          isHazard: true,
          x,
          y,
          vx: (rng() - 0.5) * 2.2,
          vy: (4.6 + rng() * 1.8) * speedMultiplier,
          radius,
          hitRadius: radius * 0.8,
          rotation: 0,
          rotSpeed: 0,
          color: '#ff784f',
          trail: [],
          nearMissTriggered: false
        };
      }

      case 'mine': {
        const radius = 20;
        return {
          type: 'mine',
          isHazard: true,
          x,
          y,
          vx: (rng() - 0.5) * 1.4,
          vy: (2.4 + rng() * 1.0) * speedMultiplier,
          radius,
          hitRadius: radius * 0.85,
          rotation: 0,
          rotSpeed: 0.06,
          color: '#f43f5e',
          pulse: 0,
          nearMissTriggered: false
        };
      }

      case 'crystal': {
        return {
          type: 'crystal',
          isHazard: false,
          isPickup: true,
          x,
          y,
          vx: (rng() - 0.5) * 0.5,
          vy: (2.0 + rng() * 0.6) * speedMultiplier,
          radius: 14,
          hitRadius: 18,
          rotation: 0,
          rotSpeed: 0.05,
          color: '#fbbf24',
          points: 250
        };
      }

      case 'shield_pickup': {
        return {
          type: 'shield_pickup',
          isHazard: false,
          isPickup: true,
          x,
          y,
          vx: (rng() - 0.5) * 0.4,
          vy: (1.8 + rng() * 0.5) * speedMultiplier,
          radius: 16,
          hitRadius: 20,
          rotation: 0,
          rotSpeed: 0.03,
          color: '#38bdf8'
        };
      }

      case 'emp_pickup': {
        return {
          type: 'emp_pickup',
          isHazard: false,
          isPickup: true,
          x,
          y,
          vx: (rng() - 0.5) * 0.4,
          vy: (1.8 + rng() * 0.5) * speedMultiplier,
          radius: 16,
          hitRadius: 20,
          rotation: 0,
          rotSpeed: 0.04,
          color: '#d5ff55'
        };
      }

      default:
        return createObstacle('asteroid_sm', canvasW, speedMultiplier, rng);
    }
  }

  /**
   * Generates natural jagged polygon vertices for asteroid shapes
   */
  function generatePolygonVertices(radius, numPoints = 8, rng = Math.random) {
    const vertices = [];
    const step = (Math.PI * 2) / numPoints;
    for (let i = 0; i < numPoints; i++) {
      const angle = i * step + (rng() - 0.5) * 0.2;
      const r = radius * (0.8 + rng() * 0.4);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }
    return vertices;
  }

  /**
   * Circle-to-Circle Collision Check
   */
  function checkCollision(ship, entity) {
    const dx = ship.x - entity.x;
    const dy = ship.y - entity.y;
    const distSq = dx * dx + dy * dy;
    const threshold = ship.hitRadius + entity.hitRadius;
    return distSq <= threshold * threshold;
  }

  /**
   * Near-Miss calculation (awards bonus points for hair-raising near misses)
   */
  function checkNearMiss(ship, entity) {
    if (!entity.isHazard || entity.nearMissTriggered) return false;
    const dx = ship.x - entity.x;
    const dy = ship.y - entity.y;
    const distSq = dx * dx + dy * dy;

    const hitDist = ship.hitRadius + entity.hitRadius;
    const nearMissDist = hitDist * 1.65;

    if (distSq > hitDist * hitDist && distSq <= nearMissDist * nearMissDist) {
      entity.nearMissTriggered = true;
      return true;
    }
    return false;
  }

  /**
   * Total score calculation
   */
  function calculateScore(survivalTime, dodgesCount, crystalsCollected, nearMisses = 0) {
    const timeScore = Math.floor(survivalTime * 40);
    const dodgeScore = dodgesCount * 60;
    const crystalScore = crystalsCollected * 200;
    const missScore = nearMisses * 150;
    return timeScore + dodgeScore + crystalScore + missScore;
  }

  /**
   * Star rating calculation for Sector Cleared
   */
  function calculateStars(score, sectorId, livesRemaining) {
    const sector = SECTORS[sectorId] || SECTORS[0];
    const baseTarget = sector.starRatingScore;

    if (livesRemaining >= 3 && score >= baseTarget) return 3;
    if (livesRemaining >= 2 && score >= baseTarget * 0.7) return 2;
    return 1;
  }

  // Exports
  exports.SECTORS = SECTORS;
  exports.createStarField = createStarField;
  exports.createObstacle = createObstacle;
  exports.generatePolygonVertices = generatePolygonVertices;
  exports.checkCollision = checkCollision;
  exports.checkNearMiss = checkNearMiss;
  exports.calculateScore = calculateScore;
  exports.calculateStars = calculateStars;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.SpaceEngine = {}));
