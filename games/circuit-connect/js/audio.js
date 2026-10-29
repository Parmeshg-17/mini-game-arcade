/**
 * Circuit Connect (Color Chain) — Procedural Web Audio API Synthesizer
 * Neon wire drag ticks, harmonic connection chimes, electric cut sparks,
 * hint chimes, and triumphant victory fanfare.
 */
(function(exports) {
  'use strict';

  let audioCtx = null;
  let isMuted = false;

  try {
    const saved = localStorage.getItem('circuit_connect_muted');
    if (saved !== null) {
      isMuted = JSON.parse(saved);
    }
  } catch (e) {}

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  /**
   * Subtle soft click/tick when dragging wire into adjacent cell.
   */
  function playStep() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Harmonic chime when a color pair connects!
   */
  function playConnect() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Two-tone bell chord (Root + 5th)
    [587.33, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);

      gain.gain.setValueAtTime(0.18, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.3);
    });
  }

  /**
   * Electric spark / cut buzz when a wire is severed.
   */
  function playCut() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Ascending magic chime for Hints.
   */
  function playHint() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.15, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.22);
    });
  }

  /**
   * Soft undo tick.
   */
  function playUndo() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.05);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Victorious neon arcade fanfare.
   */
  function playWin() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.10, t: 0.00 }, // C5
      { f: 659.25, d: 0.10, t: 0.10 }, // E5
      { f: 783.99, d: 0.10, t: 0.20 }, // G5
      { f: 1046.50, d: 0.35, t: 0.30 }, // C6
      { f: 1318.51, d: 0.45, t: 0.45 }  // E6
    ];

    melody.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);

      gain.gain.setValueAtTime(0.22, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }

  function playRotate() {
    playStep();
  }

  function toggleMute() {
    isMuted = !isMuted;
    try {
      localStorage.setItem('circuit_connect_muted', JSON.stringify(isMuted));
    } catch (e) {}
    return isMuted;
  }

  function getMuted() {
    return isMuted;
  }

  exports.playStep = playStep;
  exports.playConnect = playConnect;
  exports.playCut = playCut;
  exports.playHint = playHint;
  exports.playUndo = playUndo;
  exports.playWin = playWin;
  exports.playRotate = playRotate;
  exports.toggleMute = toggleMute;
  exports.isMuted = getMuted;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CircuitAudio = {}));
