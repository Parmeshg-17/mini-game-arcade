/**
 * Stack Ball — Pure Game Engine & Mechanics
 * 3D cylinder segmented helix calculations, rotation physics,
 * ball bounce timing, smash plunge velocity, hazard collision,
 * streak tracking, fireball mode, and progressive level generation.
 */
(function(exports) {
  'use strict';

  // --- Constants ---
  const TOWER_RADIUS = 88;
  const CORE_RADIUS = 26;
  const LAYER_HEIGHT = 18;
  const LAYER_SPACING = 36;
  const BOUNCE_HEIGHT = 38;
  const BOUNCE_DURATION = 0.36; // seconds per full bounce cycle
  const SMASH_SPEED = 780; // pixels per second downward plunge
  const FIREBALL_THRESHOLD = 4; // consecutive safe smashes to ignite fireball
  const FIREBALL_DURATION = 2.8; // seconds

  // Theme palettes cycling across levels
  const LEVEL_THEMES = [
    { name: 'Solar Flare', safe: '#ff5722', safeLight: '#ff8a50', safeDark: '#c41c00', glow: 'rgba(255, 87, 34, 0.65)' },
    { name: 'Neon Cyber', safe: '#00e5ff', safeLight: '#6effff', safeDark: '#00b2cc', glow: 'rgba(0, 229, 255, 0.65)' },
    { name: 'Hot Magenta', safe: '#ff007f', safeLight: '#ff66b2', safeDark: '#b30059', glow: 'rgba(255, 0, 127, 0.65)' },
    { name: 'Toxic Lime', safe: '#76ff03', safeLight: '#b0ff57', safeDark: '#3ec600', glow: 'rgba(118, 255, 3, 0.65)' },
    { name: 'Cyber Amber', safe: '#ffd600', safeLight: '#ffff52', safeDark: '#c7a500', glow: 'rgba(255, 214, 0, 0.65)' },
    { name: 'Electric Violet', safe: '#d500f9', safeLight: '#ff54ff', safeDark: '#9e00c5', glow: 'rgba(213, 0, 249, 0.65)' }
  ];

  const HAZARD_COLOR = {
    main: '#12151b',
    light: '#2a313d',
    dark: '#080a0e',
    glow: 'rgba(0, 0, 0, 0.45)'
  };

  /**
   * Retrieves visual color palette for a given level.
   */
  function getLevelTheme(levelNumber) {
    return LEVEL_THEMES[(levelNumber - 1) % LEVEL_THEMES.length];
  }

  /**
   * Generates deterministic layers for a given level.
   */
  function generateLevel(levelNumber) {
    const theme = getLevelTheme(levelNumber);
    // Layers count scales with level (22 base + level up to 45)
    const layerCount = Math.min(20 + Math.floor(levelNumber * 1.5), 45);

    // Hazard ratio increases with level (from 20% up to 55%)
    const hazardRatio = Math.min(0.20 + (levelNumber * 0.025), 0.55);

    const layers = [];

    for (let i = 0; i < layerCount; i++) {
      const y = i * LAYER_SPACING;
      // Alternate rotation directions and varied speeds
      const dir = (i % 2 === 0) ? 1 : -1;
      const rotSpeed = dir * (0.85 + ((i % 5) * 0.18) + Math.min(levelNumber * 0.05, 0.8));

      // Number of segments in this ring (e.g. 6 to 10)
      const numSegments = 6 + (i % 4);
      const segmentArc = (Math.PI * 2) / numSegments;
      const segments = [];

      // Determine hazard placement for this layer
      // Ensure layer 0 (very top) has safe segment where the ball lands
      for (let s = 0; s < numSegments; s++) {
        const start = s * segmentArc;
        const end = (s + 1) * segmentArc;

        let isHazard = false;
        if (i > 0) {
          // Semi-random deterministic placement based on level and layer
          const pseudoRand = Math.sin(levelNumber * 100 + i * 23 + s * 17) * 10000;
          const val = pseudoRand - Math.floor(pseudoRand);
          isHazard = val < hazardRatio;
        }

        // Never let an entire layer be 100% black hazard
        if (isHazard && s === numSegments - 1 && segments.every(seg => seg.type === 'hazard')) {
          isHazard = false;
        }

        segments.push({
          index: s,
          start: start,
          end: end,
          type: isHazard ? 'hazard' : 'safe'
        });
      }

      layers.push({
        index: i,
        y: y,
        rotation: (i * 0.45) % (Math.PI * 2),
        rotSpeed: rotSpeed,
        segments: segments,
        status: 'intact'
      });
    }

    return {
      level: levelNumber,
      theme: theme,
      layerCount: layerCount,
      layers: layers,
      baseY: layerCount * LAYER_SPACING
    };
  }

  /**
   * Creates initial game state.
   */
  function createInitialState(levelNumber = 1) {
    const levelData = generateLevel(levelNumber);

    return {
      level: levelNumber,
      theme: levelData.theme,
      layerCount: levelData.layerCount,
      layers: levelData.layers,
      baseY: levelData.baseY,
      score: 0,
      streak: 0,
      maxStreak: 0,
      fireballMeter: 0, // 0 to 1
      isFireball: false,
      fireballTimer: 0,
      isInputDown: false,
      isPaused: false,
      isGameOver: false,
      isWon: false,
      cameraY: 0,
      targetCameraY: 0,
      ball: {
        x: 0,
        y: -BOUNCE_HEIGHT,
        vy: 0,
        radius: 12,
        bounceTime: 0,
        squishX: 1.0,
        squishY: 1.0,
        currentLayerIndex: 0,
        isSmashing: false
      },
      shatteredDebris: [],
      particles: [],
      floatingTexts: []
    };
  }

  /**
   * Advances layer rotation angles and falling debris physics.
   */
  function updateTower(state, deltaSeconds) {
    if (state.isGameOver || state.isPaused) return;

    // 1. Rotate intact layers
    for (const layer of state.layers) {
      if (layer.status === 'intact') {
        layer.rotation = (layer.rotation + layer.rotSpeed * deltaSeconds) % (Math.PI * 2);
        if (layer.rotation < 0) layer.rotation += Math.PI * 2;
      }
    }

    // 2. Fireball Timer
    if (state.isFireball) {
      state.fireballTimer -= deltaSeconds;
      state.fireballMeter = Math.max(0, state.fireballTimer / FIREBALL_DURATION);
      if (state.fireballTimer <= 0) {
        state.isFireball = false;
        state.fireballMeter = 0;
      }
    }

    // 3. Falling Shattered Debris
    for (let i = state.shatteredDebris.length - 1; i >= 0; i--) {
      const d = state.shatteredDebris[i];
      d.vy += 1200 * deltaSeconds;
      d.x += d.vx * deltaSeconds;
      d.y += d.vy * deltaSeconds;
      d.rotation += d.vRot * deltaSeconds;
      d.alpha -= 0.85 * deltaSeconds;

      if (d.alpha <= 0 || d.y > state.baseY + 400) {
        state.shatteredDebris.splice(i, 1);
      }
    }

    // 4. Sparkle and Fire Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * deltaSeconds;
      p.y += p.vy * deltaSeconds;
      p.life -= deltaSeconds;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    // 5. Floating texts
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const ft = state.floatingTexts[i];
      ft.y -= 45 * deltaSeconds;
      ft.life -= deltaSeconds;
      if (ft.life <= 0) {
        state.floatingTexts.splice(i, 1);
      }
    }
  }

  /**
   * Starts smashing (player holds down touch / mouse / key).
   */
  function startSmash(state) {
    if (state.isGameOver || state.isWon || state.isPaused) return;
    state.isInputDown = true;
    state.ball.isSmashing = true;
  }

  /**
   * Stops smashing (player releases touch / mouse / key).
   */
  function stopSmash(state) {
    state.isInputDown = false;
    state.ball.isSmashing = false;
    // Reset non-fireball streak when player releases hold
    if (!state.isFireball) {
      state.streak = 0;
      state.fireballMeter = 0;
    }
  }

  /**
   * Checks which segment lies directly beneath the ball at the current rotation.
   * Ball is positioned at fixed front angle: phi = Math.PI / 2 (90 deg facing camera).
   */
  function getSegmentUnderBall(layer) {
    const ballAngle = Math.PI / 2;
    // Relative angle on the rotating platform
    let relAngle = (ballAngle - layer.rotation) % (Math.PI * 2);
    if (relAngle < 0) relAngle += Math.PI * 2;

    for (const seg of layer.segments) {
      if (relAngle >= seg.start && relAngle < seg.end) {
        return seg;
      }
    }
    return layer.segments[0];
  }

  /**
   * Executes collision and physics update for the ball.
   */
  function updateBallPhysics(state, deltaSeconds) {
    if (state.isGameOver || state.isWon || state.isPaused) return;

    const ball = state.ball;

    // Find the next intact layer
    let targetLayer = null;
    for (let i = 0; i < state.layers.length; i++) {
      if (state.layers[i].status === 'intact') {
        targetLayer = state.layers[i];
        ball.currentLayerIndex = i;
        break;
      }
    }

    // Camera follow
    const targetY = targetLayer ? targetLayer.y : state.baseY;
    state.targetCameraY = targetY;
    state.cameraY += (state.targetCameraY - state.cameraY) * Math.min(1.0, 10 * deltaSeconds);

    // If all layers destroyed, target is the victory base
    if (!targetLayer) {
      // Falling toward base
      ball.y += SMASH_SPEED * deltaSeconds;
      if (ball.y >= state.baseY - ball.radius) {
        ball.y = state.baseY - ball.radius;
        state.isWon = true;
        return { event: 'win' };
      }
      return { event: 'fall_to_base' };
    }

    const platformTop = targetLayer.y - ball.radius;

    // 1. SMASHING MODE (Input is held down)
    if (state.isInputDown && ball.isSmashing) {
      ball.y += SMASH_SPEED * deltaSeconds;

      if (ball.y >= platformTop) {
        ball.y = platformTop;
        const segment = getSegmentUnderBall(targetLayer);

        // A. HAZARD HIT (Black segment)
        if (segment.type === 'hazard') {
          if (state.isFireball) {
            // FIREBALL INVINCIBILITY: Smashes through black segment!
            shatterLayer(targetLayer, state, true);
            state.score += 50;
            state.streak++;
            if (state.streak > state.maxStreak) state.maxStreak = state.streak;

            return {
              event: 'fireball_smash',
              layerIndex: targetLayer.index,
              scoreDelta: 50,
              streak: state.streak
            };
          } else {
            // DEATH: Ball shatters!
            state.isGameOver = true;
            shatterBall(state);
            return {
              event: 'hazard_shatter',
              layerIndex: targetLayer.index
            };
          }
        }

        // B. SAFE HIT (Colored segment)
        shatterLayer(targetLayer, state, state.isFireball);
        state.score += 15 + state.streak * 5;
        state.streak++;
        if (state.streak > state.maxStreak) state.maxStreak = state.streak;

        // Fireball streak buildup
        if (!state.isFireball) {
          state.fireballMeter = Math.min(1.0, state.streak / FIREBALL_THRESHOLD);
          if (state.streak >= FIREBALL_THRESHOLD) {
            state.isFireball = true;
            state.fireballTimer = FIREBALL_DURATION;
            state.fireballMeter = 1.0;
          }
        }

        return {
          event: 'smash',
          layerIndex: targetLayer.index,
          scoreDelta: 15,
          streak: state.streak,
          isFireball: state.isFireball
        };
      }

      return { event: 'plunge' };
    }

    // 2. BOUNCING IDLE MODE (User released or not holding)
    ball.bounceTime += deltaSeconds;
    const t = (ball.bounceTime % BOUNCE_DURATION) / BOUNCE_DURATION;
    // Parabolic arc for realistic gravity bounce
    const bounceY = Math.sin(t * Math.PI) * BOUNCE_HEIGHT;

    ball.y = platformTop - bounceY;

    // Squish deformation at the very moment of contact
    if (bounceY < 3) {
      ball.squishX = 1.35;
      ball.squishY = 0.65;
    } else {
      ball.squishX += (1.0 - ball.squishX) * 12 * deltaSeconds;
      ball.squishY += (1.0 - ball.squishY) * 12 * deltaSeconds;
    }

    return { event: 'bounce', bouncePhase: t };
  }

  /**
   * Shatters a platform layer into physical debris pieces flying outward.
   */
  function shatterLayer(layer, state, isFireball = false) {
    layer.status = 'destroyed';

    const theme = state.theme;
    const piecesPerSegment = 2;

    for (const seg of layer.segments) {
      const segMidAngle = (seg.start + seg.end) / 2 + layer.rotation;
      const isHaz = seg.type === 'hazard';

      const color = isHaz ? HAZARD_COLOR : theme;

      for (let p = 0; p < piecesPerSegment; p++) {
        const angle = segMidAngle + (Math.random() - 0.5) * 0.4;
        const speed = 140 + Math.random() * 240;

        state.shatteredDebris.push({
          x: Math.cos(angle) * (TOWER_RADIUS * 0.7),
          y: layer.y,
          vx: Math.cos(angle) * speed,
          vy: -60 - Math.random() * 120,
          vRot: (Math.random() - 0.5) * 8,
          rotation: Math.random() * Math.PI,
          width: 22 + Math.random() * 14,
          height: 12 + Math.random() * 6,
          color: color,
          isHazard: isHaz,
          isFireball: isFireball,
          alpha: 1.0
        });
      }
    }

    // Spawn sparks
    for (let s = 0; s < 18; s++) {
      const spAngle = Math.random() * Math.PI * 2;
      const spSpeed = 80 + Math.random() * 180;
      state.particles.push({
        x: Math.cos(spAngle) * 35,
        y: layer.y,
        vx: Math.cos(spAngle) * spSpeed,
        vy: Math.sin(spAngle) * spSpeed - 40,
        color: isFireball ? '#ffeb3b' : theme.safe,
        size: 3 + Math.random() * 3,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6
      });
    }
  }

  /**
   * Shatters the ball on game over into debris fragments.
   */
  function shatterBall(state) {
    const ball = state.ball;
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.3;
      const speed = 120 + Math.random() * 260;
      state.shatteredDebris.push({
        x: Math.cos(angle) * 10,
        y: ball.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        vRot: (Math.random() - 0.5) * 10,
        rotation: 0,
        width: 8 + Math.random() * 6,
        height: 8 + Math.random() * 6,
        color: { main: '#ffffff', light: '#ffffff', dark: '#ff5722' },
        isHazard: false,
        isFireball: false,
        alpha: 1.0
      });
    }
  }

  /**
   * Calculates completion progress percentage (0% to 100%).
   */
  function calculateProgress(state) {
    if (!state.layers || state.layers.length === 0) return 0;
    const destroyed = state.layers.filter(l => l.status === 'destroyed').length;
    return Math.round((destroyed / state.layers.length) * 100);
  }

  /**
   * Evaluates star rating upon completing a level.
   */
  function evaluateStars(state) {
    if (state.maxStreak >= 10) return 3;
    if (state.maxStreak >= 5) return 2;
    return 1;
  }

  // --- Export ---
  const StackBallEngine = {
    TOWER_RADIUS,
    CORE_RADIUS,
    LAYER_HEIGHT,
    LAYER_SPACING,
    BOUNCE_HEIGHT,
    BOUNCE_DURATION,
    SMASH_SPEED,
    FIREBALL_THRESHOLD,
    FIREBALL_DURATION,
    LEVEL_THEMES,
    HAZARD_COLOR,
    getLevelTheme,
    generateLevel,
    createInitialState,
    updateTower,
    startSmash,
    stopSmash,
    getSegmentUnderBall,
    updateBallPhysics,
    shatterLayer,
    shatterBall,
    calculateProgress,
    evaluateStars
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StackBallEngine;
  }
  if (typeof window !== 'undefined') {
    window.StackBallEngine = StackBallEngine;
  }

})(typeof exports === 'undefined' ? (this.StackBallEngine = {}) : exports);
