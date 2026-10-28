/**
 * ParticleSystem - Manages juice droplets, splatters, sparks, floating text, and confetti.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.splatters = []; // Persistent decals drawn on background canvas
    this.confetti = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.splatters = [];
    this.confetti = [];
  }

  /**
   * Spawn juice burst when fruit is sliced
   */
  spawnJuiceSplash(x, y, colorPalette, count = 22) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      const radius = Math.random() * 5 + 3;
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius,
        color,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.015,
        gravity: 0.35,
        type: 'juice'
      });
    }

    // Add 1-2 splatters on the background wall
    const splatterColor = colorPalette[0];
    this.splatters.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      radius: Math.random() * 26 + 18,
      color: splatterColor,
      alpha: 0.35,
      decay: 0.0018, // Fades very slowly over ~8-10 seconds
      drips: Math.floor(Math.random() * 3) + 1
    });
  }

  /**
   * Blade sparks when player slashes rapidly
   */
  spawnBladeSparks(x, y, vx, vy, color = '#67e8f9') {
    for (let i = 0; i < 3; i++) {
      const spread = (Math.random() - 0.5) * 1.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: -vx * 0.2 + spread * 2,
        vy: -vy * 0.2 + (Math.random() - 0.5) * 2,
        radius: Math.random() * 2.5 + 1.2,
        color: color,
        alpha: 0.9,
        decay: 0.07,
        gravity: 0.05,
        type: 'spark'
      });
    }
  }

  /**
   * Bomb fuse sparks and smoke
   */
  spawnFuseSparks(x, y) {
    // Sizzling spark
    for (let i = 0; i < 2; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI * 0.75;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.3 ? '#ffbe0b' : '#ff0055',
        alpha: 1,
        decay: 0.06,
        gravity: 0.1,
        type: 'spark'
      });
    }

    // Little puff of smoke
    if (Math.random() < 0.3) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 1.2 - 0.5,
        radius: Math.random() * 4 + 3,
        color: 'rgba(180, 180, 180, 0.4)',
        alpha: 0.5,
        decay: 0.02,
        gravity: -0.02,
        type: 'smoke'
      });
    }
  }

  /**
   * Explosion shockwave and dark debris
   */
  spawnExplosion(x, y) {
    // Fiery shockwave particles
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 4;
      const colors = ['#ff0055', '#ff5400', '#ffbe0b', '#3a0ca3', '#111111'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 6 + 3,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
        gravity: 0.3,
        type: 'explosion'
      });
    }

    // Heavy black smoke ring
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        radius: Math.random() * 16 + 10,
        color: 'rgba(30, 30, 35, 0.7)',
        alpha: 0.7,
        decay: 0.012,
        gravity: -0.05,
        type: 'smoke'
      });
    }
  }

  /**
   * Floating animated score and combo indicators
   */
  spawnFloatingText(text, x, y, options = {}) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vx: options.vx || (Math.random() - 0.5) * 1.2,
      vy: options.vy || -3.2,
      alpha: 1,
      decay: options.decay || 0.022,
      scale: options.scale || 1,
      color: options.color || '#ffffff',
      stroke: options.stroke || '#000000',
      font: options.font || '900 24px "Outfit", sans-serif',
      glow: options.glow || null
    });
  }

  /**
   * Confetti celebration for new high scores
   */
  spawnConfetti(width, height) {
    const colors = ['#ff0055', '#ffbe0b', '#00f5d4', '#7b2cbf', '#fee440', '#00bbf9'];
    for (let i = 0; i < 70; i++) {
      this.confetti.push({
        x: Math.random() * width,
        y: -10 - Math.random() * height * 0.3,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1
      });
    }
  }

  update(dt = 1) {
    // Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;

      if (p.type === 'smoke') {
        p.radius += 0.2 * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.alpha -= t.decay * dt;
      t.scale = Math.max(t.scale * 0.99, 0.7);

      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update splatters (fade out slowly)
    for (let i = this.splatters.length - 1; i >= 0; i--) {
      const s = this.splatters[i];
      s.alpha -= s.decay * dt;
      if (s.alpha <= 0) {
        this.splatters.splice(i, 1);
      }
    }

    // Update confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rotation += c.rotSpeed * dt;
      if (c.alpha <= 0 || c.y > window.innerHeight + 50) {
        this.confetti.splice(i, 1);
      }
    }
  }

  /**
   * Draw persistent background splatters
   */
  drawSplatters(ctx) {
    for (const s of this.splatters) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.fillStyle = s.color;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Dripping droplets
      for (let d = 1; d <= s.drips; d++) {
        const dripY = s.y + s.radius * 0.7 + d * 14;
        const dripRadius = Math.max(2, s.radius * 0.22 - d * 1.5);
        ctx.beginPath();
        ctx.arc(s.x + (d % 2 === 0 ? 6 : -5), dripY, dripRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /**
   * Draw active particles and floating texts
   */
  drawParticles(ctx) {
    // Regular particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'juice' || p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'explosion') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Confetti
    for (const c of this.confetti) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = Math.max(0, c.alpha);
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }

    // Floating text popups
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = t.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (t.glow) {
        ctx.shadowColor = t.glow;
        ctx.shadowBlur = 12;
      }

      ctx.lineWidth = 4;
      ctx.strokeStyle = t.stroke;
      ctx.strokeText(t.text, t.x, t.y);

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);

      ctx.restore();
    }
  }
}

window.ParticleSystem = ParticleSystem;
