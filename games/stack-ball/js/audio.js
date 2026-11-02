/**
 * Stack Ball — Procedural Web Audio API Sound Synthesizer
 * Zero external audio assets. Real-time procedural synthesis:
 * - Rhythmic rubber bounce pop
 * - Ascending pitch destruction crunches on rapid continuous smashes
 * - Roaring flame combustion for Fireball Mode
 * - Shattering crash on hazard collision
 * - Celebratory level complete victory fanfare
 * - Persistent mute preference via localStorage
 */
(function(exports) {
  'use strict';

  const STORAGE_KEY = 'minigame_stackball_sound';
  let audioCtx = null;
  let muted = false;

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

  /**
   * Rhythmic rubber pop when ball bounces atop platform
   */
  function playBounce() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Shatter crunch sound on destroying a platform layer
   * Pitch climbs higher with streak for satisfying progression!
   */
  function playSmash(streak = 0) {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const noteFreq = 220 + Math.min(streak, 14) * 28;

    // 1. Tonal impact
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(noteFreq, now);
    osc.frequency.exponentialRampToValueAtTime(noteFreq * 0.5, now + 0.12);

    oscGain.gain.setValueAtTime(0.26, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // 2. High sizzle crack
    const oscCrack = ctx.createOscillator();
    const crackGain = ctx.createGain();
    oscCrack.type = 'sawtooth';
    oscCrack.frequency.setValueAtTime(950, now);
    oscCrack.frequency.exponentialRampToValueAtTime(180, now + 0.06);

    crackGain.gain.setValueAtTime(0.14, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    oscCrack.connect(crackGain);
    crackGain.connect(ctx.destination);
    oscCrack.start(now);
    oscCrack.stop(now + 0.07);
  }

  /**
   * Roaring combustion audio when Fireball mode ignites
   */
  function playFireballIgnite() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.35);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Heavy blast when smashing in fireball mode
   */
  function playFireballSmash() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Violent shatter when ball hits a hazard black segment
   */
  function playHazardDeath() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Sub bass drop
    const oscBass = ctx.createOscillator();
    const gainBass = ctx.createGain();
    oscBass.type = 'sawtooth';
    oscBass.frequency.setValueAtTime(160, now);
    oscBass.frequency.exponentialRampToValueAtTime(30, now + 0.55);

    gainBass.gain.setValueAtTime(0.4, now);
    gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    oscBass.connect(gainBass);
    gainBass.connect(ctx.destination);
    oscBass.start(now);
    oscBass.stop(now + 0.6);

    // Dissonant crack
    const oscCrack = ctx.createOscillator();
    const gainCrack = ctx.createGain();
    oscCrack.type = 'square';
    oscCrack.frequency.setValueAtTime(800, now);
    oscCrack.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gainCrack.gain.setValueAtTime(0.25, now);
    gainCrack.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    oscCrack.connect(gainCrack);
    gainCrack.connect(ctx.destination);
    oscCrack.start(now);
    oscCrack.stop(now + 0.26);
  }

  /**
   * Victory chime sequence on reaching the finish base
   */
  function playWinFanfare() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = now + idx * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.24, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(st);
      osc.stop(st + 0.4);
    });
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
  const StackBallAudio = {
    playBounce,
    playSmash,
    playFireballIgnite,
    playFireballSmash,
    playHazardDeath,
    playWinFanfare,
    isMuted,
    toggleMute,
    setMuted,
    getAudioContext
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StackBallAudio;
  }
  if (typeof window !== 'undefined') {
    window.StackBallAudio = StackBallAudio;
  }

})(typeof exports === 'undefined' ? (this.StackBallAudio = {}) : exports);
