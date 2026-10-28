/**
 * Fruit & Bomb Definitions & Procedural Vector Renderers
 */

const FRUIT_TYPES = {
  WATERMELON: 'watermelon',
  ORANGE: 'orange',
  LEMON: 'lemon',
  STRAWBERRY: 'strawberry',
  KIWI: 'kiwi',
  PINEAPPLE: 'pineapple',
  DRAGONFRUIT: 'dragonfruit',
  STARFRUIT: 'starfruit',
  BOMB: 'bomb'
};

const FRUIT_CONFIGS = {
  [FRUIT_TYPES.WATERMELON]: {
    name: 'Watermelon',
    radius: 46,
    points: 1,
    palette: ['#ef4444', '#dc2626', '#b91c1c', '#4ade80'],
    splashColor: '#ef4444',
    weight: 18
  },
  [FRUIT_TYPES.ORANGE]: {
    name: 'Orange',
    radius: 38,
    points: 1,
    palette: ['#f97316', '#ea580c', '#fb923c', '#ffedd5'],
    splashColor: '#f97316',
    weight: 18
  },
  [FRUIT_TYPES.LEMON]: {
    name: 'Lemon',
    radius: 34,
    points: 1,
    palette: ['#eab308', '#facc15', '#fde047', '#fef9c3'],
    splashColor: '#eab308',
    weight: 16
  },
  [FRUIT_TYPES.STRAWBERRY]: {
    name: 'Strawberry',
    radius: 32,
    points: 2,
    palette: ['#f43f5e', '#e11d48', '#fda4af', '#22c55e'],
    splashColor: '#f43f5e',
    weight: 14
  },
  [FRUIT_TYPES.KIWI]: {
    name: 'Kiwi',
    radius: 35,
    points: 2,
    palette: ['#84cc16', '#65a30d', '#a3e635', '#78350f'],
    splashColor: '#84cc16',
    weight: 12
  },
  [FRUIT_TYPES.PINEAPPLE]: {
    name: 'Pineapple',
    radius: 44,
    points: 3,
    palette: ['#eab308', '#ca8a04', '#f59e0b', '#15803d'],
    splashColor: '#eab308',
    weight: 10
  },
  [FRUIT_TYPES.DRAGONFRUIT]: {
    name: 'Dragonfruit',
    radius: 40,
    points: 5,
    palette: ['#ec4899', '#db2777', '#f472b6', '#22c55e'],
    splashColor: '#ec4899',
    weight: 7
  },
  [FRUIT_TYPES.STARFRUIT]: {
    name: 'Starfruit (Bonus)',
    radius: 42,
    points: 10,
    bonusTime: 5, // Adds 5 seconds in Arcade mode
    palette: ['#facc15', '#fbbf24', '#fef08a', '#ffffff'],
    splashColor: '#facc15',
    weight: 4
  },
  [FRUIT_TYPES.BOMB]: {
    name: 'Bomb',
    radius: 38,
    points: 0,
    isBomb: true,
    palette: ['#1e293b', '#0f172a', '#ef4444', '#f59e0b'],
    splashColor: '#000000',
    weight: 11
  }
};

/**
 * Base Fruit/Bomb entity tossed upward with parabolic motion
 */
class FruitObject {
  constructor(x, y, vx, vy, type) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.config = FRUIT_CONFIGS[type];
    this.radius = this.config.radius;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.08;
    this.sliced = false;
    this.missed = false;
    this.pulse = 0;
    this.createdAt = performance.now();
  }

  update(dt = 1, gravity = 0.42) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += gravity * dt;
    this.rotation += this.rotSpeed * dt;
    this.pulse += 0.05 * dt;
  }

  /**
   * Check if a line segment (from blade swipe) intersects this fruit
   */
  checkSlice(p1, p2) {
    if (this.sliced) return false;

    // Line segment to circle collision
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      return Math.hypot(this.x - p1.x, this.y - p1.y) <= this.radius;
    }

    // Clamp projection factor t between 0 and 1
    const t = Math.max(0, Math.min(1, ((this.x - p1.x) * dx + (this.y - p1.y) * dy) / lenSq));
    const closestX = p1.x + t * dx;
    const closestY = p1.y + t * dy;

    const dist = Math.hypot(this.x - closestX, this.y - closestY);
    return dist <= this.radius;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    switch (this.type) {
      case FRUIT_TYPES.WATERMELON:
        this.drawWatermelon(ctx);
        break;
      case FRUIT_TYPES.ORANGE:
        this.drawOrange(ctx);
        break;
      case FRUIT_TYPES.LEMON:
        this.drawLemon(ctx);
        break;
      case FRUIT_TYPES.STRAWBERRY:
        this.drawStrawberry(ctx);
        break;
      case FRUIT_TYPES.KIWI:
        this.drawKiwi(ctx);
        break;
      case FRUIT_TYPES.PINEAPPLE:
        this.drawPineapple(ctx);
        break;
      case FRUIT_TYPES.DRAGONFRUIT:
        this.drawDragonfruit(ctx);
        break;
      case FRUIT_TYPES.STARFRUIT:
        this.drawStarfruit(ctx);
        break;
      case FRUIT_TYPES.BOMB:
        this.drawBomb(ctx);
        break;
    }

    ctx.restore();
  }

  /* --- PROCEDURAL DRAWINGS --- */

  drawWatermelon(ctx) {
    const r = this.radius;
    // Outer green rind
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#4ade80');
    grad.addColorStop(0.7, '#16a34a');
    grad.addColorStop(1, '#14532d');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Dark wavy stripes
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, angle - 0.2, angle + 0.2);
      ctx.stroke();
    }

    // Specular highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.35, r * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOrange(ctx) {
    const r = this.radius;
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(0.8, '#f97316');
    grad.addColorStop(1, '#c2410c');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Stem dimple & little leaf
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.85, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(6, -r * 0.95, 9, 4, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.3, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawLemon(ctx) {
    const r = this.radius;
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.7, '#facc15');
    grad.addColorStop(1, '#ca8a04');

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Lemon oval with tapered tips
    ctx.moveTo(0, -r * 1.15);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.4, r * 0.8, 0);
    ctx.quadraticCurveTo(r * 0.9, r * 0.4, 0, r * 1.15);
    ctx.quadraticCurveTo(-r * 0.9, r * 0.4, -r * 0.8, 0);
    ctx.quadraticCurveTo(-r * 0.9, -r * 0.4, 0, -r * 1.15);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.25, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStrawberry(ctx) {
    const r = this.radius;
    // Heart/cone berry
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#fb7185');
    grad.addColorStop(0.7, '#e11d48');
    grad.addColorStop(1, '#881337');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, r * 1.1);
    ctx.bezierCurveTo(r * 1.1, r * 0.3, r * 1.1, -r * 0.8, 0, -r * 0.8);
    ctx.bezierCurveTo(-r * 1.1, -r * 0.8, -r * 1.1, r * 0.3, 0, r * 1.1);
    ctx.fill();

    // Yellow seed dots
    ctx.fillStyle = '#fef08a';
    const seeds = [
      [0, -r * 0.4], [-r * 0.4, -r * 0.3], [r * 0.4, -r * 0.3],
      [-r * 0.3, 0], [r * 0.3, 0], [0, 0.1 * r],
      [-r * 0.2, r * 0.4], [r * 0.2, r * 0.4], [0, r * 0.7]
    ];
    for (const [sx, sy] of seeds) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Green leafy crown
    ctx.fillStyle = '#16a34a';
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI - Math.PI;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * r * 0.4, -r * 0.85 + Math.sin(angle) * 5, 8, 4, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawKiwi(ctx) {
    const r = this.radius;
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#a16207');
    grad.addColorStop(0.7, '#78350f');
    grad.addColorStop(1, '#451a03');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fuzzy skin texture dots
    ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.65, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPineapple(ctx) {
    const r = this.radius;
    // Golden body
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(0.7, '#d97706');
    grad.addColorStop(1, '#92400e');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.8, r * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crosshatch scales
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let d = -r * 0.6; d <= r * 0.6; d += 16) {
      ctx.moveTo(d - 15, -r * 0.5 + Math.abs(d) * 0.4);
      ctx.lineTo(d + 15, r * 0.9 - Math.abs(d) * 0.4);
      ctx.moveTo(d + 15, -r * 0.5 + Math.abs(d) * 0.4);
      ctx.lineTo(d - 15, r * 0.9 - Math.abs(d) * 0.4);
    }
    ctx.stroke();

    // Green spiky crown
    ctx.fillStyle = '#15803d';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, -r * 0.7);
      ctx.lineTo(i * 12, -r * 1.35);
      ctx.lineTo(i * 8 + 6, -r * 0.7);
      ctx.fill();
    }
  }

  drawDragonfruit(ctx) {
    const r = this.radius;
    // Vibrant pink body
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#f472b6');
    grad.addColorStop(0.7, '#db2777');
    grad.addColorStop(1, '#9d174d');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Wavy curved green-tipped petal scales
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(px * 0.85, py * 0.85);
      ctx.quadraticCurveTo(px * 1.25, py * 1.25, px * 0.7 + Math.cos(angle + 0.4) * 12, py * 0.7 + Math.sin(angle + 0.4) * 12);
      ctx.fill();
    }
  }

  drawStarfruit(ctx) {
    const r = this.radius;
    // Radiant pulsating aura
    const pulseScale = 1 + Math.sin(this.pulse * 4) * 0.08;
    ctx.scale(pulseScale, pulseScale);

    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 18;

    // Golden 5-point star
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3;

    ctx.beginPath();
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      const px = Math.cos(angle) * rad;
      const py = Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Star core glow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBomb(ctx) {
    const r = this.radius;
    const pulseFactor = 1 + Math.sin(this.pulse * 8) * 0.04;
    ctx.scale(pulseFactor, pulseFactor);

    // Cast iron body
    const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, '#64748b');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#090d16');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Metallic specular gloss
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.25, r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Warning icon (skull or alert mark)
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 2);

    // Bronze collar
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-7, -r - 5, 14, 6);

    // Curved fuse rope
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -r - 5);
    ctx.quadraticCurveTo(12, -r - 18, 16, -r - 24);
    ctx.stroke();

    // Animated fuse spark
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 12;
    ctx.fillStyle = Math.sin(this.pulse * 15) > 0 ? '#ffbe0b' : '#ff0055';
    ctx.beginPath();
    ctx.arc(16, -r - 24, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Fruit Half: Spawned after slicing, flies apart along normal to slice angle
 */
class FruitHalf {
  constructor(x, y, vx, vy, type, sliceAngle, halfIndex) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = FRUIT_CONFIGS[type];
    this.radius = this.config.radius;
    this.sliceAngle = sliceAngle;
    this.halfIndex = halfIndex; // 0 (left/top) or 1 (right/bottom)

    // Perpendicular impulse away from slice plane
    const normalAngle = sliceAngle + (halfIndex === 0 ? -Math.PI / 2 : Math.PI / 2);
    const impulse = Math.random() * 3.5 + 3.0;

    this.vx = vx + Math.cos(normalAngle) * impulse;
    this.vy = vy + Math.sin(normalAngle) * impulse - 1.5;
    this.rotation = sliceAngle;
    this.rotSpeed = (halfIndex === 0 ? -1 : 1) * (Math.random() * 0.08 + 0.05);
    this.alpha = 1;
    this.decay = 0.003;
  }

  update(dt = 1, gravity = 0.42) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += gravity * dt;
    this.rotation += this.rotSpeed * dt;
    this.alpha -= this.decay * dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Clip to half circle along slice angle
    ctx.beginPath();
    if (this.halfIndex === 0) {
      ctx.arc(0, 0, this.radius + 2, Math.PI, 0, false);
    } else {
      ctx.arc(0, 0, this.radius + 2, 0, Math.PI, false);
    }
    ctx.closePath();
    ctx.clip();

    // Draw the detailed interior cross-section!
    this.drawCrossSection(ctx);

    ctx.restore();
  }

  drawCrossSection(ctx) {
    const r = this.radius;

    switch (this.type) {
      case FRUIT_TYPES.WATERMELON: {
        // Dark green skin
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // White rind
        ctx.fillStyle = '#f0fdf4';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Juicy red flesh
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
        ctx.fill();

        // Little black seeds
        ctx.fillStyle = '#18181b';
        const seedAngles = [-0.6, -0.3, 0, 0.3, 0.6];
        for (const sa of seedAngles) {
          const sy = this.halfIndex === 0 ? -r * 0.45 : r * 0.45;
          ctx.beginPath();
          ctx.ellipse(sa * r * 0.6, sy, 3, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case FRUIT_TYPES.ORANGE: {
        // Orange skin
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // White pith
        ctx.fillStyle = '#fff7ed';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
        ctx.fill();

        // Segments
        ctx.fillStyle = '#f97316';
        for (let i = 0; i < 8; i++) {
          const a1 = (i / 8) * Math.PI * 2 + 0.08;
          const a2 = ((i + 1) / 8) * Math.PI * 2 - 0.08;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r * 0.85, a1, a2);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case FRUIT_TYPES.LEMON: {
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fefce8';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        for (let i = 0; i < 8; i++) {
          const a1 = (i / 8) * Math.PI * 2 + 0.08;
          const a2 = ((i + 1) / 8) * Math.PI * 2 - 0.08;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r * 0.85, a1, a2);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case FRUIT_TYPES.KIWI: {
        // Fuzzy skin
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Emerald pulp
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Creamy core
        ctx.fillStyle = '#ecfccb';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
        ctx.fill();

        // Seed ring
        ctx.fillStyle = '#1c1917';
        for (let i = 0; i < 12; i++) {
          const sa = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(sa) * r * 0.48, Math.sin(sa) * r * 0.48, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case FRUIT_TYPES.DRAGONFRUIT: {
        // Pink rind
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // White pulp
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
        ctx.fill();

        // Black specks
        ctx.fillStyle = '#1e293b';
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const rad = (i % 3 + 1) * (r * 0.22);
          ctx.beginPath();
          ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      default: {
        // Generic attractive cross section
        ctx.fillStyle = this.config.palette[1] || '#e11d48';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    // Cut edge sheen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
  }
}

window.FRUIT_TYPES = FRUIT_TYPES;
window.FRUIT_CONFIGS = FRUIT_CONFIGS;
window.FruitObject = FruitObject;
window.FruitHalf = FruitHalf;
