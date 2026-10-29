/**
 * Stack Rush — Procedural Web Audio API Sound Synthesizer
 * Harmonious ascending pentatonic chimes for PERFECT streaks,
 * crisp slicing and thud effects for trimmed blocks, falling debris swooshes,
 * and celebratory fanfare on personal best records.
 */
(function(exports) {
  'use strict';

  let audioCtx = null;
  let isMuted = false;

  // Load mute state from localStorage
  try {
    const saved = localStorage.getItem('stack_rush_muted');
    if (saved !== null) {
      isMuted = JSON.parse(saved);
    }
  } catch (e) {
    // LocalStorage unavailable
  }

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

  // Musical Scale: Pentatonic Major across 3 octaves for satisfying rising combo streaks
  // C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6, D6, E6, G6, A6, C7
  const PENTATONIC_FREQS = [
    261.63, 293.66, 329.63, 392.00, 440.00,
    523.25, 587.33, 659.25, 783.99, 880.00,
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00
  ];

  /**
   * Ascending bell chime for PERFECT alignment.
   */
  function playPerfect(streak = 0) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const noteIdx = Math.min(streak, PENTATONIC_FREQS.length - 1);
    const freq = PENTATONIC_FREQS[noteIdx];
    const now = ctx.currentTime;

    // Primary bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Harmonic sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    gain1.gain.setValueAtTime(0.8, now);
    gain2.gain.setValueAtTime(0.3, now);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.48);
    osc2.stop(now + 0.48);
  }

  /**
   * Crisp slicing whoosh + placement thud when a block is trimmed.
   */
  function playTrim() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Placement thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);

    // Slice filtered noise whoosh
    try {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.08);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.09);
    } catch (e) {
      // Noise buffer fallback
    }
  }

  /**
   * Celebratory arpeggio chord when combo restores block size.
   */
  function playComboBonus() {
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

      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.38);
    });
  }

  /**
   * Downward tumbling pitch drop when a block misses completely.
   */
  function playMiss() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.45);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  /**
   * Resonant game over chords.
   */
  function playGameOver() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [196, 164.8, 146.8, 110].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      gain.gain.setValueAtTime(0.22, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.5);
    });
  }

  /**
   * Victory sound.
   */
  function playWin() {
    playComboBonus();
  }

  // Legacy compatibility methods
  function playRotate() {
    playTrim();
  }
  function playDrop() {
    playTrim();
  }
  function playLayerClear() {
    playPerfect(5);
  }
  function playGem() {
    playPerfect(1);
  }

  function toggleMute() {
    isMuted = !isMuted;
    try {
      localStorage.setItem('stack_rush_muted', JSON.stringify(isMuted));
    } catch (e) {}
    return isMuted;
  }

  function getMuteState() {
    return isMuted;
  }

  exports.playPerfect = playPerfect;
  exports.playTrim = playTrim;
  exports.playComboBonus = playComboBonus;
  exports.playMiss = playMiss;
  exports.playGameOver = playGameOver;
  exports.playWin = playWin;
  exports.playRotate = playRotate;
  exports.playDrop = playDrop;
  exports.playLayerClear = playLayerClear;
  exports.playGem = playGem;
  exports.toggleMute = toggleMute;
  exports.getMuteState = getMuteState;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.StackAudio = {}));
