/**
 * BladeTrail - Renders a sleek, glowing neon blade swipe trail with smooth interpolation.
 */
class BladeTrail {
  constructor() {
    this.points = [];
    this.maxAge = 180; // ms
    this.minSliceSpeed = 2.8; // px/ms threshold to slice
    this.comboActive = false;
    this.currentSpeed = 0;
  }

  reset() {
    this.points = [];
    this.comboActive = false;
    this.currentSpeed = 0;
  }

  setComboMode(active) {
    this.comboActive = active;
  }

  addPoint(x, y) {
    const now = performance.now();
    if (this.points.length > 0) {
      const prev = this.points[this.points.length - 1];
      const dx = x - prev.x;
      const dy = y - prev.y;
      const dt = Math.max(now - prev.time, 1);
      this.currentSpeed = Math.hypot(dx, dy) / dt;
    }

    this.points.push({ x, y, time: now });
  }

  clear() {
    this.points = [];
    this.currentSpeed = 0;
  }

  update() {
    const now = performance.now();
    while (this.points.length > 0 && (now - this.points[0].time) > this.maxAge) {
      this.points.shift();
    }
  }

  /**
   * Check if the latest segment has enough speed to slice
   */
  canSlice() {
    if (this.points.length < 2) return false;
    return this.currentSpeed >= this.minSliceSpeed;
  }

  /**
   * Get recent path segments for collision detection
   */
  getActiveSegments() {
    if (this.points.length < 2) return [];
    const segments = [];
    for (let i = 1; i < this.points.length; i++) {
      segments.push({
        p1: this.points[i - 1],
        p2: this.points[i]
      });
    }
    return segments;
  }

  draw(ctx) {
    if (this.points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const count = this.points.length;
    const now = performance.now();

    // Determine blade style based on combo
    let glowColor = '#38bdf8'; // Electric sky blue
    let coreColor = '#ffffff'; // White core
    let outerColor = '#0284c7';

    if (this.comboActive) {
      glowColor = '#ffbe0b'; // Blazing gold / fire
      coreColor = '#fffbeb';
      outerColor = '#ff0055';
    }

    // Outer Glow pass
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = this.comboActive ? 22 : 14;

    for (let i = 1; i < count; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];
      const progress = i / count; // 0 (old tail) to 1 (new tip)
      const age = now - p2.time;
      const alpha = Math.max(0, 1 - age / this.maxAge);

      ctx.strokeStyle = outerColor;
      ctx.globalAlpha = alpha * 0.75;
      ctx.lineWidth = progress * (this.comboActive ? 14 : 10) + 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Inner Core pass (brilliant intense blade spine)
    ctx.shadowBlur = 4;
    ctx.shadowColor = coreColor;

    for (let i = 1; i < count; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];
      const progress = i / count;
      const age = now - p2.time;
      const alpha = Math.max(0, 1 - age / this.maxAge);

      ctx.strokeStyle = coreColor;
      ctx.globalAlpha = alpha * 0.95;
      ctx.lineWidth = progress * (this.comboActive ? 6 : 4) + 1;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

window.BladeTrail = BladeTrail;

