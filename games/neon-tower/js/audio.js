/**
 * Neon Tower — Procedural Web Audio API Sound Synthesizer
 * Zero external audio assets. Real-time procedural synthesis:
 * - Pentatonic harmonic chimes for PERFECT combo streaks (C4 -> C7)
 * - Snappy mechanical neon thud & laser slice on trimmed blocks
 * - Resonant sparkle arpeggio on combo width expansion
 * - Heavy synthwave bass drop and crash rumble on Game Over
 * - Persistent mute state via localStorage
 */
(function(exports) {
  'use strict';

  const STORAGE_KEY = 'minigame_neontower_sound';
  let audioCtx = null;
  let muted = false;

  // Retrieve initial mute preference
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      muted = JSON.parse(saved);
    }
  } catch (e) {
    muted = false;
  }

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Major Pentatonic Scale across 3 octaves for uplifting ascending streaks
  const PENTATONIC_SCALE = [
    261.63, 293.66, 329.63, 392.00, 440.00, // C4, D4, E4, G4, A4
    523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00, // C6, D6, E6, G6, A6
    2093.00 // C7
  ];

  /**
   * Play block drop audio
   * @param {boolean} isPerfect - True for perfect alignment snap
   * @param {number} streak - Consecutive perfect streak count
   */
  function playDrop(isPerfect, streak = 0) {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (isPerfect) {
      // Ascending pentatonic chime
      const noteIdx = Math.min(streak, PENTATONIC_SCALE.length - 1);
      const freq = PENTATONIC_SCALE[noteIdx];

      // Primary sine bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Harmonic shimmer (octave + fifth)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.5, now);

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.28, now);
      master.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      gain1.gain.setValueAtTime(0.8, now);
      gain2.gain.setValueAtTime(0.25, now);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(master);
      gain2.connect(master);
      master.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } else {
      // Trimmed block: Mechanical thud + crisp slice swoosh
      const oscThud = ctx.createOscillator();
      const gainThud = ctx.createGain();
      oscThud.type = 'triangle';
      oscThud.frequency.setValueAtTime(180, now);
      oscThud.frequency.exponentialRampToValueAtTime(55, now + 0.12);

      gainThud.gain.setValueAtTime(0.3, now);
      gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      oscThud.connect(gainThud);
      gainThud.connect(ctx.destination);
      oscThud.start(now);
      oscThud.stop(now + 0.14);

      // Slicing hiss
      const oscSlice = ctx.createOscillator();
      const gainSlice = ctx.createGain();
      oscSlice.type = 'sawtooth';
      oscSlice.frequency.setValueAtTime(900, now);
      oscSlice.frequency.exponentialRampToValueAtTime(250, now + 0.08);

      gainSlice.gain.setValueAtTime(0.12, now);
      gainSlice.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      oscSlice.connect(gainSlice);
      gainSlice.connect(ctx.destination);
      oscSlice.start(now);
      oscSlice.stop(now + 0.09);
    }
  }

  /**
   * Resonant triple-chime sparkle on combo width restoration bonus
   */
  function playExpansion() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  /**
   * Dramatic synthwave bass drop and rumble on game over
   */
  function playGameOver() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Descending sub-bass dive
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.65);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    // Lowpass filter for muffled cinematic impact
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  function isMuted() {
    return muted;
  }

  function toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(muted));
    } catch (e) {}
    return muted;
  }

  function setMuted(val) {
    muted = !!val;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(muted));
    } catch (e) {}
  }

  // --- Export ---
  const NeonTowerAudio = {
    playDrop,
    playExpansion,
    playGameOver,
    isMuted,
    toggleMute,
    setMuted,
    getAudioContext
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeonTowerAudio;
  }
  if (typeof window !== 'undefined') {
    window.NeonTowerAudio = NeonTowerAudio;
  }

})(typeof exports === 'undefined' ? (this.NeonTowerAudio = {}) : exports);

