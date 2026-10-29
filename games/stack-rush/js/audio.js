/**
 * Stack Rush — Procedural Web Audio API Synthesizer
 * Produces tactile rotational sweeps, solid drop impacts, crystal layer destructions,
 * gem chimes, and theme fanfares without external audio dependencies.
 */
(function(exports) {
  'use strict';

  let audioCtx = null;
  let muted = false;

  // Restore mute setting
  try {
    muted = localStorage.getItem('arcade_stackrush_muted') === 'true';
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
      localStorage.setItem('arcade_stackrush_muted', muted.toString());
    } catch (e) {}
    return muted;
  }

  /**
   * Smooth rotational whoosh
   */
  function playRotate() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  /**
   * Block drop & lock impact
   */
  function playDrop() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  }

  /**
   * Layer clear crystal blast
   */
  function playLayerClear(layerCount = 1) {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const chords = [
      [523.25, 659.25, 783.99],          // C major
      [587.33, 739.99, 880, 1174.66],   // D major octave
      [659.25, 830.61, 987.77, 1318.51] // E high arpeggio
    ];

    const notes = chords[Math.min(layerCount - 1, chords.length - 1)];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
    });
  }

  /**
   * Gem collect sparkling chime
   */
  function playGem() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  /**
   * Game Over descending minor chord
   */
  function playGameOver() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [440, 392, 349.23, 293.66];
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
   * Victory celebratory arpeggio
   */
  function playWin() {
    if (muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { freq: 523.25, time: 0 },
      { freq: 659.25, time: 0.1 },
      { freq: 783.99, time: 0.2 },
      { freq: 1046.5, time: 0.32 },
      { freq: 1318.51, time: 0.45 }
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0, ctx.currentTime + n.time);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + 0.3);
    });
  }

  // Exports
  exports.isMuted = isMuted;
  exports.toggleMute = toggleMute;
  exports.playRotate = playRotate;
  exports.playDrop = playDrop;
  exports.playLayerClear = playLayerClear;
  exports.playGem = playGem;
  exports.playGameOver = playGameOver;
  exports.playWin = playWin;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.StackAudio = {}));
