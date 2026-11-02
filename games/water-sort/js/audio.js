/**
 * Water Sort — Procedural Web Audio API Sound Synthesizer
 * Zero external audio assets. Synthesizes liquid pours, glass chimes,
 * droplet clicks, and victory fanfare directly in browser.
 */
(function(exports) {
  'use strict';

  let audioCtx = null;
  let isMuted = false;

  // Restore mute setting
  try {
    const saved = localStorage.getItem('minigame_watersort_sound');
    if (saved !== null) {
      isMuted = saved === 'false';
    }
  } catch (e) {
    // Ignore storage restrictions
  }

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function setMuted(muted) {
    isMuted = !!muted;
    try {
      localStorage.setItem('minigame_watersort_sound', (!isMuted).toString());
    } catch (e) {}
  }

  function getMuted() {
    return isMuted;
  }

  /**
   * Subtle water droplet selection pop
   */
  function playSelect() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Soft liquid trickling stream sound
   */
  function playPour(units = 1) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = Math.min(0.25 + units * 0.18, 0.7);
    const now = ctx.currentTime;

    // Layer 1: Bubbling sine ripples
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = now + (i * 0.08);

      osc.type = 'sine';
      const baseFreq = 520 + Math.random() * 240;
      osc.frequency.setValueAtTime(baseFreq, delay);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, delay + 0.08);

      gain.gain.setValueAtTime(0.12, delay);
      gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(delay);
      osc.stop(delay + 0.1);
    }

    // Layer 2: Filtered liquid body
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(260, now);
    osc2.frequency.exponentialRampToValueAtTime(340, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc2.connect(filter);
    filter.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now);
    osc2.stop(now + duration);
  }

  /**
   * Invalid move thud
   */
  function playInvalid() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Tube filled with single color - crystal harmonic chime
   */
  function playTubeComplete() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + (idx * 0.06);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  /**
   * Level Victory Fanfare
   */
  function playWin() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Pentatonic ascending celebratory arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + (idx * 0.08);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  /**
   * Hint chime
   */
  function playHint() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [880, 1174.66]; // A5, D6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + (idx * 0.1);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  /**
   * Undo whoosh
   */
  function playUndo() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  exports.getAudioContext = getAudioContext;
  exports.setMuted = setMuted;
  exports.getMuted = getMuted;
  exports.playSelect = playSelect;
  exports.playPour = playPour;
  exports.playInvalid = playInvalid;
  exports.playTubeComplete = playTubeComplete;
  exports.playWin = playWin;
  exports.playHint = playHint;
  exports.playUndo = playUndo;

})(typeof module !== 'undefined' ? module.exports : (window.WaterSortAudio = {}));
