/**
 * Citrus Blitz - Core Game Loop & State Manager
 */

const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
};

const GAME_MODES = {
  ARCADE: 'ARCADE', // 60s timer blitz, bombs subtract time
  CLASSIC: 'CLASSIC' // 3 lives, drops/bombs cost lives
};

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Subsystems
    this.audio = window.gameAudio;
    this.particles = new window.ParticleSystem();
    this.blade = new window.BladeTrail();

    // Game state
    this.state = GAME_STATES.MENU;
    this.mode = GAME_MODES.ARCADE;
    this.score = 0;
    this.highScores = {
      [GAME_MODES.ARCADE]: parseInt(localStorage.getItem('citrusBlitz_high_arcade') || '0', 10),
      [GAME_MODES.CLASSIC]: parseInt(localStorage.getItem('citrusBlitz_high_classic') || '0', 10)
    };
    this.lives = 3;
    this.maxLives = 3;
    this.timer = 60; // seconds for Arcade mode
    this.comboCount = 0;
    this.comboTimer = 0;
    this.highestCombo = 0;
    this.totalSliced = 0;
    this.bombsAvoided = 0;

    // Entities
    this.fruits = [];
    this.fruitHalves = [];

    // Wave spawning
    this.spawnTimer = 0;
    this.spawnInterval = 110;
    this.waveNumber = 0;

    // Screen Shake & Red Flash
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.flashAlpha = 0;

    // Multi-touch & Pointer Tracking (pointerId -> {x, y})
    this.activePointers = new Map();

    // High DPI & Dimension
    this.dpr = window.devicePixelRatio || 1;
    this.width = 800;
    this.height = 600;

    // Timing
    this.lastTime = performance.now();
    this.fpsInterval = 1000 / 60;

    this.initDOM();
    this.initCanvasSize();
    this.initEvents();
    this.updateHUD();

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initDOM() {
    this.ui = {
      menuOverlay: document.getElementById('menu-overlay'),
      pauseOverlay: document.getElementById('pause-overlay'),
      gameOverOverlay: document.getElementById('gameover-overlay'),
      howToOverlay: document.getElementById('howto-overlay'),

      scoreDisplay: document.getElementById('score-val'),
      highScoreDisplay: document.getElementById('high-score-val'),
      timerDisplay: document.getElementById('timer-val'),
      timerContainer: document.getElementById('timer-container'),
      livesContainer: document.getElementById('lives-container'),
      comboBadge: document.getElementById('combo-badge'),
      comboText: document.getElementById('combo-text'),

      btnStartArcade: document.getElementById('btn-start-arcade'),
      btnStartClassic: document.getElementById('btn-start-classic'),
      btnPause: document.getElementById('btn-pause'),
      btnResume: document.getElementById('btn-resume'),
      btnRestart: document.getElementById('btn-restart'),
      btnGameOverRestart: document.getElementById('btn-gameover-restart'),
      btnGameOverMenu: document.getElementById('btn-gameover-menu'),
      btnPauseMenu: document.getElementById('btn-pause-menu'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      btnSoundIcon: document.getElementById('btn-sound-icon'),
      btnHelp: document.getElementById('btn-help'),
      btnCloseHelp: document.getElementById('btn-close-help'),

      gameOverTitle: document.getElementById('gameover-title'),
      finalScore: document.getElementById('final-score'),
      finalHighScoreNotice: document.getElementById('final-highscore-notice'),
      statSliced: document.getElementById('stat-sliced'),
      statCombo: document.getElementById('stat-combo'),
      statBombs: document.getElementById('stat-bombs')
    };

    this.updateSoundIcon();
  }

  initCanvasSize() {
    const container = document.getElementById('canvas-container');
    const rect = container.getBoundingClientRect();

    this.width = Math.max(Math.floor(rect.width), 300);
    this.height = Math.max(Math.floor(rect.height), 400);

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Cross-browser transform reset and high-DPI scaling
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
    });

    const canvas = this.canvas;

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    // Pointer events with multi-touch support
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}

      this.audio.ensureReady();
      const pos = getPos(e);
      this.activePointers.set(e.pointerId, pos);

      this.blade.clear();
      this.blade.addPoint(pos.x, pos.y);
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.activePointers.has(e.pointerId)) return;
      e.preventDefault();

      const pos = getPos(e);
      const prevPos = this.activePointers.get(e.pointerId);

      this.blade.addPoint(pos.x, pos.y);

      if (prevPos && this.state === GAME_STATES.PLAYING) {
        this.processSlice(prevPos, pos);
      }

      this.activePointers.set(e.pointerId, pos);
    }, { passive: false });

    const handlePointerEnd = (e) => {
      this.activePointers.delete(e.pointerId);
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    // Context menu prevention
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // UI Buttons
    this.ui.btnStartArcade.addEventListener('click', () => {
      this.audio.playClick();
      this.startGame(GAME_MODES.ARCADE);
    });

    this.ui.btnStartClassic.addEventListener('click', () => {
      this.audio.playClick();
      this.startGame(GAME_MODES.CLASSIC);
    });

    this.ui.btnPause.addEventListener('click', () => {
      this.audio.playClick();
      this.togglePause();
    });

    this.ui.btnResume.addEventListener('click', () => {
      this.audio.playClick();
      this.resumeGame();
    });

    this.ui.btnRestart.addEventListener('click', () => {
      this.audio.playClick();
      this.startGame(this.mode);
    });

    this.ui.btnGameOverRestart.addEventListener('click', () => {
      this.audio.playClick();
      this.startGame(this.mode);
    });

    this.ui.btnGameOverMenu.addEventListener('click', () => {
      this.audio.playClick();
      this.showMenu();
    });

    this.ui.btnPauseMenu.addEventListener('click', () => {
      this.audio.playClick();
      this.showMenu();
    });

    this.ui.btnSoundToggle.addEventListener('click', () => {
      this.audio.toggleMute();
      this.updateSoundIcon();
      this.audio.playClick();
    });

    this.ui.btnHelp.addEventListener('click', () => {
      this.audio.playClick();
      this.ui.howToOverlay.classList.remove('hidden');
    });

    this.ui.btnCloseHelp.addEventListener('click', () => {
      this.audio.playClick();
      this.ui.howToOverlay.classList.add('hidden');
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.key === 'p' || e.key === 'P') {
        if (this.state === GAME_STATES.PLAYING) {
          this.togglePause();
        } else if (this.state === GAME_STATES.PAUSED) {
          this.resumeGame();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED || this.state === GAME_STATES.GAMEOVER) {
          this.startGame(this.mode);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        this.audio.toggleMute();
        this.updateSoundIcon();
      } else if (e.key === 'Escape') {
        if (this.ui.howToOverlay && !this.ui.howToOverlay.classList.contains('hidden')) {
          this.ui.howToOverlay.classList.add('hidden');
        } else if (this.state === GAME_STATES.PLAYING) {
          this.togglePause();
        } else if (this.state === GAME_STATES.PAUSED) {
          this.resumeGame();
        }
      }
    });
  }

  updateSoundIcon() {
    const muted = this.audio.isMuted();
    this.ui.btnSoundIcon.textContent = muted ? '🔇' : '🔊';
    this.ui.btnSoundToggle.title = muted ? 'Unmute Sound (M)' : 'Mute Sound (M)';
  }

  startGame(mode = GAME_MODES.ARCADE) {
    this.mode = mode;
    this.state = GAME_STATES.PLAYING;
    this.score = 0;
    this.lives = this.maxLives;
    this.timer = 60;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.highestCombo = 0;
    this.totalSliced = 0;
    this.bombsAvoided = 0;
    this.waveNumber = 0;
    this.spawnTimer = 40; // Quick initial spawn

    this.fruits = [];
    this.fruitHalves = [];
    this.particles.reset();
    this.blade.reset();
    this.activePointers.clear();

    if (this.mode === GAME_MODES.ARCADE) {
      this.ui.timerContainer.style.display = 'flex';
      this.ui.livesContainer.style.display = 'none';
    } else {
      this.ui.timerContainer.style.display = 'none';
      this.ui.livesContainer.style.display = 'flex';
    }

    this.hideAllOverlays();
    this.updateHUD();
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      this.ui.pauseOverlay.classList.remove('hidden');
    }
  }

  resumeGame() {
    if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      this.ui.pauseOverlay.classList.add('hidden');
      this.lastTime = performance.now();
    }
  }

  showMenu() {
    this.state = GAME_STATES.MENU;
    this.hideAllOverlays();
    this.ui.menuOverlay.classList.remove('hidden');
    this.particles.reset();
    this.fruits = [];
    this.fruitHalves = [];
    this.activePointers.clear();
    this.updateHUD();
  }

  gameOver(reason = 'time') {
    this.state = GAME_STATES.GAMEOVER;
    this.audio.playGameOver();
    this.activePointers.clear();

    // Dynamic title based on mode and reason
    if (this.ui.gameOverTitle) {
      if (this.mode === GAME_MODES.CLASSIC) {
        this.ui.gameOverTitle.textContent = 'GAME OVER!';
      } else if (reason === 'bomb') {
        this.ui.gameOverTitle.textContent = 'BOMB BLAST! GAME OVER!';
      } else {
        this.ui.gameOverTitle.textContent = "TIME'S UP!";
      }
    }

    // High score check
    const currentHigh = this.highScores[this.mode] || 0;
    const isNewHigh = this.score > currentHigh;
    if (isNewHigh) {
      this.highScores[this.mode] = this.score;
      if (this.mode === GAME_MODES.ARCADE) {
        localStorage.setItem('citrusBlitz_high_arcade', this.score);
      } else {
        localStorage.setItem('citrusBlitz_high_classic', this.score);
      }
      this.particles.spawnConfetti(this.width, this.height);
    }

    this.ui.finalScore.textContent = this.score.toLocaleString();
    this.ui.finalHighScoreNotice.style.display = isNewHigh ? 'block' : 'none';
    this.ui.statSliced.textContent = this.totalSliced;
    this.ui.statCombo.textContent = `${this.highestCombo}x`;
    this.ui.statBombs.textContent = this.bombsAvoided;

    this.hideAllOverlays();
    this.ui.gameOverOverlay.classList.remove('hidden');
    this.updateHUD();
  }

  hideAllOverlays() {
    this.ui.menuOverlay.classList.add('hidden');
    this.ui.pauseOverlay.classList.add('hidden');
    this.ui.gameOverOverlay.classList.add('hidden');
  }

  updateHUD() {
    this.ui.scoreDisplay.textContent = this.score.toLocaleString();
    const currentHigh = this.highScores[this.mode] || 0;
    this.ui.highScoreDisplay.textContent = currentHigh.toLocaleString();

    if (this.mode === GAME_MODES.ARCADE) {
      this.ui.timerDisplay.textContent = Math.max(0, Math.ceil(this.timer));
      if (this.timer <= 10) {
        this.ui.timerContainer.classList.add('urgent');
      } else {
        this.ui.timerContainer.classList.remove('urgent');
      }
    } else {
      const hearts = ['❤️', '❤️', '❤️'];
      for (let i = 0; i < 3; i++) {
        hearts[i] = i < this.lives ? '❤️' : '🖤';
      }
      this.ui.livesContainer.innerHTML = hearts.map(h => `<span class="heart-icon">${h}</span>`).join('');
    }
  }

  processSlice(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 3) return;

    if (dist > 25 && Math.random() < 0.28) {
      this.audio.playWhoosh(dist);
    }

    this.particles.spawnBladeSparks(p2.x, p2.y, dx, dy, this.comboCount >= 3 ? '#ffbe0b' : '#38bdf8');

    const sliceAngle = Math.atan2(dy, dx);
    let hitCountInStroke = 0;

    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const fruit = this.fruits[i];
      if (fruit.sliced) continue;

      if (fruit.checkSlice(p1, p2)) {
        fruit.sliced = true;
        this.fruits.splice(i, 1);

        if (fruit.type === window.FRUIT_TYPES.BOMB) {
          this.handleBombSlice(fruit);
          return;
        } else {
          hitCountInStroke++;
          this.handleFruitSlice(fruit, sliceAngle);
        }
      }
    }

    if (hitCountInStroke > 0) {
      this.recordCombo(hitCountInStroke);
    }
  }

  handleFruitSlice(fruit, sliceAngle) {
    this.totalSliced++;
    this.audio.playSlice(fruit.type);

    let pointsGained = fruit.config.points;

    if (fruit.type === window.FRUIT_TYPES.STARFRUIT && this.mode === GAME_MODES.ARCADE) {
      this.timer += fruit.config.bonusTime;
      this.particles.spawnFloatingText(`+${fruit.config.bonusTime}s EXTRA TIME!`, fruit.x, fruit.y - 30, {
        color: '#facc15',
        font: '900 24px "Outfit", sans-serif',
        glow: '#f59e0b'
      });
    }

    this.score += pointsGained;

    this.fruitHalves.push(
      new window.FruitHalf(fruit.x, fruit.y, fruit.vx, fruit.vy, fruit.type, sliceAngle, 0),
      new window.FruitHalf(fruit.x, fruit.y, fruit.vx, fruit.vy, fruit.type, sliceAngle, 1)
    );

    this.particles.spawnJuiceSplash(fruit.x, fruit.y, fruit.config.palette, 24);
    this.particles.spawnFloatingText(`+${pointsGained}`, fruit.x, fruit.y, {
      color: fruit.config.splashColor,
      stroke: '#0f172a'
    });

    this.updateHUD();
  }

  handleBombSlice(bomb) {
    this.audio.playExplosion();
    this.particles.spawnExplosion(bomb.x, bomb.y);

    this.shakeDuration = 24;
    this.shakeIntensity = 18;
    this.flashAlpha = 0.6;

    this.comboCount = 0;
    this.ui.comboBadge.classList.add('hidden');
    this.blade.setComboMode(false);

    if (this.mode === GAME_MODES.ARCADE) {
      this.timer = Math.max(0, this.timer - 10);
      this.score = Math.max(0, this.score - 10);
      this.particles.spawnFloatingText('-10s BOMB PENALTY!', bomb.x, bomb.y, {
        color: '#ef4444',
        stroke: '#000000',
        font: '900 26px "Outfit", sans-serif',
        glow: '#ef4444'
      });

      if (this.timer <= 0) {
        this.gameOver('bomb');
      }
    } else {
      this.lives--;
      this.particles.spawnFloatingText('BOMB HIT! -1 LIFE', bomb.x, bomb.y, {
        color: '#ef4444',
        font: '900 26px "Outfit", sans-serif'
      });

      if (this.lives <= 0) {
        this.gameOver('bomb');
      }
    }

    this.updateHUD();
  }

  recordCombo(count) {
    this.comboCount += count;
    this.comboTimer = 28;

    if (this.comboCount >= 2) {
      if (this.comboCount > this.highestCombo) {
        this.highestCombo = this.comboCount;
      }

      let bonus = 0;
      let label = '';
      if (this.comboCount === 2) {
        bonus = 2;
        label = 'DOUBLE SLICE! +2';
      } else if (this.comboCount === 3) {
        bonus = 3;
        label = '3x COMBO! +3';
        this.blade.setComboMode(true);
      } else if (this.comboCount === 4) {
        bonus = 5;
        label = '4x MEGA COMBO! +5';
        this.blade.setComboMode(true);
      } else {
        bonus = 10;
        label = `${this.comboCount}x BLADE FRENZY! +10`;
        this.blade.setComboMode(true);
      }

      this.score += bonus;
      this.audio.playCombo(this.comboCount);

      this.ui.comboBadge.classList.remove('hidden');
      this.ui.comboText.textContent = label;

      this.particles.spawnFloatingText(label, this.width / 2, this.height * 0.35, {
        color: '#facc15',
        stroke: '#451a03',
        font: '900 32px "Outfit", sans-serif',
        glow: '#f59e0b'
      });

      this.updateHUD();
    }
  }

  spawnWave() {
    this.waveNumber++;

    const waveSize = Math.min(Math.floor(Math.random() * 3) + 1 + Math.floor(this.score / 60), 4);
    const allowBomb = this.score >= 5;
    let bombSpawnedInWave = false;

    for (let i = 0; i < waveSize; i++) {
      const type = this.pickRandomFruitType(allowBomb && !bombSpawnedInWave);
      if (type === window.FRUIT_TYPES.BOMB) {
        bombSpawnedInWave = true;
      }

      const margin = this.width * 0.15;
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = this.height + 40;

      const heightFactor = Math.sqrt(this.height / 600);
      const vy = -(Math.random() * 4.5 + 14.5) * heightFactor;

      const centerX = this.width / 2;
      const vx = (centerX - x) * 0.008 + (Math.random() - 0.5) * 2.8;

      this.fruits.push(new window.FruitObject(x, y, vx, vy, type));
    }
  }

  pickRandomFruitType(canSpawnBomb) {
    const keys = Object.keys(window.FRUIT_CONFIGS);
    const pool = [];

    for (const key of keys) {
      if (key === window.FRUIT_TYPES.BOMB) {
        if (canSpawnBomb && Math.random() < 0.22) {
          return key;
        }
        continue;
      }
      const weight = window.FRUIT_CONFIGS[key].weight || 10;
      for (let w = 0; w < weight; w++) {
        pool.push(key);
      }
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  loop(currentTime) {
    requestAnimationFrame((t) => this.loop(t));

    const elapsed = currentTime - this.lastTime;
    if (elapsed < this.fpsInterval) return;
    this.lastTime = currentTime - (elapsed % this.fpsInterval);

    this.update();
    this.draw();
  }

  update() {
    if (this.state === GAME_STATES.PLAYING) {
      if (this.mode === GAME_MODES.ARCADE) {
        this.timer -= 1 / 60;
        if (this.timer <= 0) {
          this.timer = 0;
          this.gameOver('time');
          return;
        }
      }

      if (this.comboTimer > 0) {
        this.comboTimer--;
        if (this.comboTimer <= 0) {
          this.comboCount = 0;
          this.ui.comboBadge.classList.add('hidden');
          this.blade.setComboMode(false);
        }
      }

      this.spawnTimer--;
      if (this.spawnTimer <= 0) {
        this.spawnWave();
        const intervalFactor = Math.max(65, 115 - Math.floor(this.score / 8) * 4);
        this.spawnTimer = intervalFactor;
      }

      // Update Fruits
      for (let i = this.fruits.length - 1; i >= 0; i--) {
        const fruit = this.fruits[i];
        fruit.update(1);

        if (fruit.type === window.FRUIT_TYPES.BOMB) {
          this.particles.spawnFuseSparks(fruit.x + 16, fruit.y - fruit.radius - 24);
        }

        if (fruit.y > this.height + 70 && fruit.vy > 0) {
          if (!fruit.sliced) {
            if (fruit.type === window.FRUIT_TYPES.BOMB) {
              this.bombsAvoided++;
            } else if (this.mode === GAME_MODES.CLASSIC) {
              this.lives--;
              this.particles.spawnFloatingText('MISSED! 💔', fruit.x, this.height - 40, {
                color: '#ef4444',
                font: 'bold 20px "Outfit", sans-serif'
              });
              if (this.lives <= 0) {
                this.gameOver('lives');
                return;
              }
              this.updateHUD();
            }
          }
          this.fruits.splice(i, 1);
        }
      }

      // Update Fruit Halves
      for (let i = this.fruitHalves.length - 1; i >= 0; i--) {
        const half = this.fruitHalves[i];
        half.update(1);
        if (half.y > this.height + 90 || half.alpha <= 0) {
          this.fruitHalves.splice(i, 1);
        }
      }

      if (this.shakeDuration > 0) {
        this.shakeDuration--;
      }
      if (this.flashAlpha > 0) {
        this.flashAlpha = Math.max(0, this.flashAlpha - 0.035);
      }

      this.updateHUD();
    }

    this.blade.update();
    this.particles.update(1);
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Overscan clear to prevent edge artifacting during screen shake
    ctx.clearRect(-100, -100, this.width + 200, this.height + 200);

    // Apply Screen Shake if active
    if (this.shakeDuration > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(offsetX, offsetY);
    }

    // 1. Draw persistent background splatters
    this.particles.drawSplatters(ctx);

    // 2. Draw active fruits
    for (const fruit of this.fruits) {
      fruit.draw(ctx);
    }

    // 3. Draw split fruit halves
    for (const half of this.fruitHalves) {
      half.draw(ctx);
    }

    // 4. Draw juice particles, sparks, smoke, and floating text
    this.particles.drawParticles(ctx);

    // 5. Draw glowing blade trail
    this.blade.draw(ctx);

    // 6. Bomb red flash shockwave
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.flashAlpha})`;
      ctx.fillRect(-100, -100, this.width + 200, this.height + 200);
    }

    ctx.restore();
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
