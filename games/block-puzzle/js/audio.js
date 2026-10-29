/**
 * Block Puzzle — Web Audio API Synthesizer
 * 100% procedural sound generator with zero external assets.
 * Produces tactile block placement thuds, neon line-clearing crunches,
 * combo arpeggios, and game over/win states.
 */
(function(exports) {
  'use strict';

  let audioCtx = null;
  let muted = false;

  // Restore mute preference
  try {
    muted = localStorage.getItem('arcade_blockpuzzle_muted') === 'true';
  } catch (e) {}

  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function isMuted() {
    return muted;
  }

  function toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem('arcade_blockpuzzle_muted', muted.toString());
    } catch (e) {}
    return muted;
  }

  /**
   * Satisfying block placement snap
   */
  function playPlace() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * Block selection click
   */
  function playSelect() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.07);
  }

  /**
   * Invalid placement attempt thud
   */
  function playInvalid() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  }

  /**
   * Line clearing crunch and synth arpeggio
   */
  function playLineClear(lineCount = 1) {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Pitch rises with more lines cleared
    const basePitches = [
      [523.25, 659.25],                  // 1 line: C5, E5
      [523.25, 659.25, 783.99],          // 2 lines: C5, E5, G5
      [523.25, 659.25, 783.99, 1046.5],  // 3 lines: C5, E5, G5, C6
      [659.25, 783.99, 1046.5, 1318.51]  // 4+ lines: E5, G5, C6, E6
    ];

    const notes = basePitches[Math.min(lineCount - 1, basePitches.length - 1)];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.25);
    });
  }

  /**
   * Combo streak chord
   */
  function playCombo(streak = 1) {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const pitches = [587.33, 739.99, 880, 1174.66];
    const freq = pitches[Math.min(streak - 1, pitches.length - 1)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  /**
   * Game Over descending minor progression
   */
  function playGameOver() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.2);
    });
  }

  /**
   * Victory fanfare arpeggio
   */
  function playWin() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 440, time: 0 },
      { freq: 554.37, time: 0.1 },
      { freq: 659.25, time: 0.2 },
      { freq: 880, time: 0.3 },
      { freq: 1108.73, time: 0.45 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0, ctx.currentTime + n.time);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + 0.35);
    });
  }

  // Exports
  exports.isMuted = isMuted;
  exports.toggleMute = toggleMute;
  exports.playPlace = playPlace;
  exports.playSelect = playSelect;
  exports.playInvalid = playInvalid;
  exports.playLineClear = playLineClear;
  exports.playCombo = playCombo;
  exports.playGameOver = playGameOver;
  exports.playWin = playWin;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.BlockAudio = {}));
