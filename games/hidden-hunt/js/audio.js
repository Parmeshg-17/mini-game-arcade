/**
 * Hidden Hunt — Procedural Web Audio Sound Synthesizer
 * Generates tactile casual audio feedback without external audio files.
 */
(function(exports) {
  'use strict';

  let ctx = null;
  let muted = false;

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, type = 'sine', duration = 0.12, gainVal = 0.2, rampTo = 0.001) {
    if (muted) return;
    const c = getContext();
    if (!c) return;

    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);

      gain.gain.setValueAtTime(gainVal, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(rampTo, c.currentTime + duration);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start();
      osc.stop(c.currentTime + duration);
    } catch (_) {}
  }

  function playFound() {
    tone(587.33, 'sine', 0.1, 0.25); // D5
    setTimeout(() => tone(880, 'sine', 0.18, 0.22), 60); // A5
  }

  function playCombo(combo = 1) {
    const base = 523.25 + (Math.min(combo, 8) * 65);
    tone(base, 'triangle', 0.1, 0.22);
    setTimeout(() => tone(base * 1.25, 'sine', 0.2, 0.25), 50);
  }

  function playMiss() {
    tone(180, 'triangle', 0.09, 0.15);
  }

  function playHint() {
    [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => {
      setTimeout(() => tone(f, 'sine', 0.15, 0.12), i * 50);
    });
  }

  function playLevelComplete() {
    const notes = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.35 }
    ];
    notes.forEach((n, i) => {
      setTimeout(() => tone(n.f, 'sine', n.d, 0.25), i * 110);
    });
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  function isMuted() {
    return muted;
  }

  exports.playFound = playFound;
  exports.playCombo = playCombo;
  exports.playMiss = playMiss;
  exports.playHint = playHint;
  exports.playLevelComplete = playLevelComplete;
  exports.toggleMute = toggleMute;
  exports.isMuted = isMuted;

})(typeof exports === 'undefined' ? (window.HiddenHuntAudio = {}) : exports);
