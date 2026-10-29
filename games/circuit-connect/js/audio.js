/**
 * Circuit Connect — Procedural Web Audio API Sound Synthesizer
 * Mechanical switch clicks on tile rotation, electric power connection snaps,
 * neon energy pulses, and triumphant synth victory fanfare.
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
   * Mechanical rotary switch click.
   */
  function playRotate() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Electric connection snap / neon line energized.
   */
  function playConnect() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Electric spark / current pulse along wire.
   */
  function playPowerPulse() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08); // E6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Ascending bell chimes for 3-star victory rating.
   */
  function playStarChime(index = 0) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const freq = notes[index] || 523.25;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  /**
   * Circuit complete triumphant synth fanfare.
   */
  function playVictory() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chords = [
      { f: 440.00, t: 0.0 }, // A4
      { f: 554.37, t: 0.08 }, // C#5
      { f: 659.25, t: 0.16 }, // E5
      { f: 880.00, t: 0.24 }  // A5
    ];

    chords.forEach(c => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, now + c.t);

      gain.gain.setValueAtTime(0.25, now + c.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + c.t + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + c.t);
      osc.stop(now + c.t + 0.48);
    });
  }

  /**
   * Move limit exhausted / circuit overload buzz.
   */
  function playError() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  function toggleMute() {
    isMuted = !isMuted;
    try {
      localStorage.setItem('circuit_connect_muted', JSON.stringify(isMuted));
    } catch (e) {}
    return isMuted;
  }

  function getMuteState() {
    return isMuted;
  }

  exports.playRotate = playRotate;
  exports.playConnect = playConnect;
  exports.playPowerPulse = playPowerPulse;
  exports.playStarChime = playStarChime;
  exports.playVictory = playVictory;
  exports.playError = playError;
  exports.toggleMute = toggleMute;
  exports.getMuteState = getMuteState;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CircuitAudio = {}));

